/**
 * Token Refresh Utility
 * Automatically refreshes JWT tokens before they expire
 */

let refreshTimer: NodeJS.Timeout | null = null;

/**
 * Decode JWT token to get expiration time
 */
function decodeToken(token: string): { exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Get time until token expires (in milliseconds)
 */
function getTimeUntilExpiry(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }
  
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeUntilExpiry = expiryTime - currentTime;
  
  return timeUntilExpiry;
}

/**
 * Refresh the authentication token
 */
async function refreshToken(): Promise<boolean> {
  try {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      console.error('No user data found for token refresh');
      return false;
    }

    const user = JSON.parse(userData);
    
    // Re-authenticate to get a fresh token
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        userId: user.id,
        ponyClubId: user.ponyClubId
      })
    });

    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      return false;
    }

    const data = await response.json();
    
    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
      console.log('✅ Token refreshed successfully');
      
      // Schedule next refresh
      scheduleTokenRefresh(data.token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

/**
 * Schedule automatic token refresh
 * Refreshes token when it has 5 minutes left before expiry
 */
export function scheduleTokenRefresh(token?: string): void {
  // Clear existing timer
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  // Get token from storage if not provided
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
  
  if (!authToken) {
    return;
  }

  const timeUntilExpiry = getTimeUntilExpiry(authToken);
  
  if (!timeUntilExpiry || timeUntilExpiry <= 0) {
    console.warn('Token already expired or invalid');
    return;
  }

  // Refresh when token has 5 minutes left (or immediately if less than 5 minutes remain)
  const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
  const refreshIn = Math.max(0, timeUntilExpiry - REFRESH_BEFORE_EXPIRY);
  
  console.log(`📅 Token refresh scheduled in ${Math.round(refreshIn / 1000 / 60)} minutes`);
  
  refreshTimer = setTimeout(async () => {
    console.log('🔄 Refreshing token...');
    const success = await refreshToken();
    
    if (!success) {
      console.warn('Token refresh failed - user may need to log in again');
      // Optionally trigger logout or show notification
    }
  }, refreshIn);
}

/**
 * Stop automatic token refresh
 */
export function stopTokenRefresh(): void {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
    console.log('Token refresh stopped');
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(token);
  return timeUntilExpiry === null || timeUntilExpiry <= 0;
}

/**
 * Get token expiration info
 */
export function getTokenInfo(token: string): { 
  expiresAt: Date | null;
  isExpired: boolean;
  minutesUntilExpiry: number | null;
} {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return {
      expiresAt: null,
      isExpired: true,
      minutesUntilExpiry: null
    };
  }

  const expiresAt = new Date(decoded.exp * 1000);
  const timeUntilExpiry = getTimeUntilExpiry(token);
  
  return {
    expiresAt,
    isExpired: timeUntilExpiry === null || timeUntilExpiry <= 0,
    minutesUntilExpiry: timeUntilExpiry ? Math.round(timeUntilExpiry / 1000 / 60) : null
  };
}
