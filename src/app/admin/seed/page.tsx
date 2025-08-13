
'use client';

import { useState } from 'react';
import { callSeedData } from '@/lib/serverActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="flex justify-center items-center min-h-screen bg-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
          <CardDescription>
            Initialize the Firestore database with comprehensive pony club data including all zones and clubs from ClubZoneData.json, plus base data for zones, clubs, and event types. This will load ALL clubs from your comprehensive dataset and create complete zone and club structures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Base Zones</span>
              <span className="text-blue-600">10 zones with full details</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="font-medium">📁 ClubZoneData.json</span>
              <span className="text-green-600">ALL clubs from comprehensive dataset</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Event Types</span>
              <span className="text-purple-600">13 different event types</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
              <span className="font-medium">🚀 Complete Dataset</span>
              <span className="text-amber-600">Zones + All Clubs + Event Types</span>
            </div>
          </div>
          
          {result && (
            <div
              className={`p-4 rounded-md flex items-start gap-3 mt-4 ${
                result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {result.success ? <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" /> : <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className="font-medium">{result.success ? 'Success!' : 'Error'}</p>
                <div className="text-sm mt-1 whitespace-pre-wrap">{result.message}</div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSeed} disabled={loading} className="w-full">
            {loading ? 'Seeding Complete Database...' : 'Seed Complete Database'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
