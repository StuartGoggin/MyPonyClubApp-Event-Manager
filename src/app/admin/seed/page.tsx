
'use client';

import { useState } from 'react';
import { callSeedData } from '@/lib/serverActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Trash2, Database } from 'lucide-react';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [purgeResult, setPurgeResult] = useState<any>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    const seedResult = await callSeedData();
    setResult(seedResult);
    setLoading(false);
  };

  const handleCleanupDuplicates = async () => {
    setCleanupLoading(true);
    setCleanupResult(null);
    
    try {
      const response = await fetch('/api/admin/cleanup-duplicates', {
        method: 'DELETE',
      });
      
      const result = await response.json();
      setCleanupResult(result);
    } catch (error) {
      setCleanupResult({
        success: false,
        error: 'Failed to cleanup duplicates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handlePurgeDatabase = async () => {
    if (!confirm('⚠️ This will permanently delete ALL zones, clubs, and club pictures from the database. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }

    setPurgeLoading(true);
    setPurgeResult(null);
    
    try {
      const response = await fetch('/api/admin/purge-database', {
        method: 'DELETE',
      });
      
      const result = await response.json();
      setPurgeResult(result);
    } catch (error) {
      setPurgeResult({
        success: false,
        error: 'Failed to purge database',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setPurgeLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/20 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Initialize the Firestore database with comprehensive pony club data including all zones and clubs from ClubZoneData.json, plus base data for zones, clubs, and event types. This will load ALL clubs from your comprehensive dataset and create complete zone and club structures. You can also clean up duplicates or completely purge all config data (zones, clubs, pictures).
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
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-2 border-red-200">
              <span className="font-medium">⚠️ Purge Database</span>
              <span className="text-red-600">DELETE all zones, clubs & pictures</span>
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
          
          {cleanupResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              cleanupResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {cleanupResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <div className="font-medium">
                    {cleanupResult.success ? 'Cleanup Successful!' : 'Cleanup Failed'}
                  </div>
                  {cleanupResult.results && (
                    <div className="mt-2 space-y-1">
                      <div>Duplicate zones deleted: {cleanupResult.results.duplicateZonesDeleted}</div>
                      <div>Clubs updated: {cleanupResult.results.clubsUpdated}</div>
                      {cleanupResult.results.deletedZones.length > 0 && (
                        <div className="text-xs text-gray-600">
                          Deleted: {cleanupResult.results.deletedZones.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                  {cleanupResult.error && (
                    <div className="text-sm mt-1">{cleanupResult.error}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {purgeResult && (
            <div className={`mt-4 p-4 rounded-lg border ${
              purgeResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-2">
                {purgeResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <div className="font-medium">
                    {purgeResult.success ? 'Database Purge Successful!' : 'Database Purge Failed'}
                  </div>
                  <div className="text-sm mt-1">{purgeResult.message}</div>
                  {purgeResult.results?.details && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div>Zones deleted: {purgeResult.results.details.zones.deleted}</div>
                      <div>Clubs deleted: {purgeResult.results.details.clubs.deleted}</div>
                      <div>Club pictures deleted: {purgeResult.results.details.clubPictures.deleted}</div>
                      <div className="font-medium">Total deleted: {purgeResult.results.summary.totalDeleted}</div>
                    </div>
                  )}
                  {purgeResult.error && (
                    <div className="text-sm mt-1">{purgeResult.error}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleSeed} disabled={loading || cleanupLoading || purgeLoading} className="w-full">
            {loading ? 'Seeding Complete Database...' : 'Seed Complete Database'}
          </Button>
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleCleanupDuplicates} 
              disabled={loading || cleanupLoading || purgeLoading} 
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupLoading ? 'Cleaning...' : 'Clean Duplicates'}
            </Button>
            <Button 
              onClick={handlePurgeDatabase} 
              disabled={loading || cleanupLoading || purgeLoading} 
              variant="destructive"
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              {purgeLoading ? 'Purging...' : 'Purge All Data'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
