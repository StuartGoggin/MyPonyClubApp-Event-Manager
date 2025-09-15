'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, RefreshCw } from 'lucide-react';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AdminAuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('admin-token');
    if (token) {
      setAuthToken(token);
      verifyAuth(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAuth = async (token: string) => {
    try {
      // Test API access with the token
      const response = await fetch('/api/email-queue?action=stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setError('');
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem('admin-token');
        setError('Authentication failed');
      }
    } catch (error) {
      setIsAuthenticated(false);
      localStorage.removeItem('admin-token');
      setError('Connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // For development purposes, accept "admin-token" as valid
      // In production, this would authenticate against your auth system
      if (authToken === 'admin-token') {
        localStorage.setItem('admin-token', authToken);
        await verifyAuth(authToken);
      } else {
        setError('Invalid credentials. Use "admin-token" for development.');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Authentication failed');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    setIsAuthenticated(false);
    setAuthToken('');
    setError('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please authenticate to access the email queue management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="token">Admin Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter admin token"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Development: Use "admin-token"
                </p>
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !authToken}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Authenticate'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add auth token to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem('admin-token');
    const headers = new Headers(init?.headers);
    
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    return originalFetch(input, {
      ...init,
      headers
    });
  };

  return (
    <div className="min-h-screen">
      {/* Admin logout bar */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Admin Mode</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-white hover:bg-blue-700"
          >
            Logout
          </Button>
        </div>
      </div>
      
      {children}
    </div>
  );
}