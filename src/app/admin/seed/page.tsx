
'use client';

import { useState } from 'react';
import { seedData } from '@/lib/data';
import { callSeedData } from '@/lib/serverActions'; // Import callSeedData from the new file
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    const seedResult = await callSeedData();
    setResult(seedResult);
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Click the button below to populate the Firestore database with initial data for zones, clubs, and event types. This should only be run once.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <div
              className={`p-4 rounded-md flex items-start gap-3 ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <p>{result.message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSeed} disabled={loading} className="w-full">
            {loading ? 'Seeding...' : 'Seed Database'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
