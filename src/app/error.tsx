'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-24 w-24 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong!</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
        </div>

        {error.message && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Error Details:</p>
            <p className="mt-1">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go to homepage
          </Button>
        </div>
      </div>
    </div>
  );
}
