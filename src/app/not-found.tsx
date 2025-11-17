import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <FileQuestion className="h-24 w-24 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild variant="default">
            <Link href="/">Go to homepage</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
