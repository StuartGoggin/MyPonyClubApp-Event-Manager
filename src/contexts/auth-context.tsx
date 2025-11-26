'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { scheduleTokenRefresh, stopTokenRefresh } from '@/lib/token-refresh';

interface User {
  id: string;
  ponyClubId: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  clubId?: string;
  zoneId?: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { ponyClubId: string; mobileNumber: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Hydration-safe initialization
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check for existing token after hydration
  useEffect(() => {
    if (!isHydrated) return;
    
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Start automatic token refresh
        scheduleTokenRefresh(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    
    setLoading(false);
    
    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, [isHydrated]);

  const login = async (credentials: { ponyClubId: string; mobileNumber: string }) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setUser(data.user);
        setLoading(false); // Set loading to false after successful login
        
        // Start automatic token refresh
        scheduleTokenRefresh(data.token);
        
        // Redirect based on user role
        switch (data.user.role) {
          case 'super_user':
            router.push('/admin');
            break;
          case 'zone_rep':
            router.push('/zone-manager');
            break;
          default:
            router.push('/club-manager');
        }
      } else {
        throw new Error(data.message || data.error || 'Login failed');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    stopTokenRefresh();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}