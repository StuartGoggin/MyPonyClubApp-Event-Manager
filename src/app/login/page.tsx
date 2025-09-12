'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogIn } from 'lucide-react';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    ponyClubId: '',
    mobileNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        // Store token in localStorage (you might want to use a more secure method)
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        
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
        setError(data.message || data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <LogIn className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            Pony Club Login
          </CardTitle>
          <CardDescription className="text-center">
            Enter your Pony Club ID and registered mobile number to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ponyClubId">Pony Club ID</Label>
              <Input
                id="ponyClubId"
                type="text"
                placeholder="e.g., PC123456"
                value={credentials.ponyClubId}
                onChange={(e) => handleInputChange('ponyClubId', e.target.value)}
                required
                disabled={loading}
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                Your unique Pony Club identifier
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="e.g., 0412 345 678"
                value={credentials.mobileNumber}
                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your registered Australian mobile number
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !credentials.ponyClubId || !credentials.mobileNumber}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Need help with login?</p>
              <p className="text-xs">
                Contact your club administrator or zone representative if you can't access your account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
