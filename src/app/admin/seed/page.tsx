
'use client';

import { useState } from 'react';
// import { callSeedData } from '@/lib/serverActions';

// Stub for static export
const callSeedData = async () => {
  throw new Error('Server Actions not available in static export mode');
};
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Trash2, Database, Download, FileText } from 'lucide-react';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportEventsLoading, setExportEventsLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportEventsProgress, setExportEventsProgress] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [purgeResult, setPurgeResult] = useState<any>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [exportEventsResult, setExportEventsResult] = useState<any>(null);

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

  const handleExportData = async () => {
    setExportLoading(true);
    setExportResult(null);
    setExportProgress('Initializing export...');
    
    try {
      setExportProgress('Fetching zones and clubs data...');
      
      const response = await fetch('/api/admin/export-data', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setExportProgress('Processing export data...');
      const result = await response.json();
      
      if (result.success) {
        setExportProgress('Preparing download...');
        
        // Create a downloadable file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with current date and content description
        const currentDate = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `pony-club-zones-clubs-export-${currentDate}-${timestamp}.json`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setExportProgress('Export completed successfully!');
        setExportResult({
          success: true,
          message: `Export completed successfully!\n\nFile: ${filename}\nZones: ${result.data.metadata.totalZones}\nClubs: ${result.data.metadata.totalClubs}\nExported: ${result.data.metadata.exportDate}`
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      setExportProgress('Export failed');
      setExportResult({
        success: false,
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setExportLoading(false);
      // Clear progress after a delay
      setTimeout(() => setExportProgress(''), 3000);
    }
  };

  const handleExportEvents = async () => {
    setExportEventsLoading(true);
    setExportEventsResult(null);
    setExportEventsProgress('Initializing events export...');
    
    try {
      setExportEventsProgress('Fetching events and related data...');
      
      const response = await fetch('/api/admin/export-events', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setExportEventsProgress('Processing events export data...');
      const result = await response.json();
      
      if (result.success) {
        setExportEventsProgress('Preparing events download...');
        
        // Create a downloadable file
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with current date and content description
        const currentDate = new Date().toISOString().split('T')[0];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `pony-club-events-export-${currentDate}-${timestamp}.json`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setExportEventsProgress('Events export completed successfully!');
        setExportEventsResult({
          success: true,
          message: `Events export completed successfully!\n\nFile: ${filename}\nEvents: ${result.data.metadata.totalEvents}\nEvent Types: ${result.data.metadata.totalEventTypes}\nExported: ${result.data.metadata.exportDate}`
        });
      } else {
        throw new Error(result.error || 'Events export failed');
      }
    } catch (error) {
      setExportEventsProgress('Events export failed');
      setExportEventsResult({
        success: false,
        error: 'Failed to export events',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setExportEventsLoading(false);
      // Clear progress after a delay
      setTimeout(() => setExportEventsProgress(''), 3000);
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-muted/20 p-4">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Database Seeding Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Seeding
            </CardTitle>
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
            <Button onClick={handleSeed} disabled={loading || cleanupLoading || purgeLoading || exportLoading || exportEventsLoading} className="w-full">
              {loading ? 'Seeding Complete Database...' : 'Seed Complete Database'}
            </Button>
          </CardFooter>
        </Card>

        {/* Export Functions Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Export data from the database to JSON files for backup, analysis, or migration purposes. Each export includes comprehensive data with metadata and timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                <span className="font-medium">📥 Zones & Clubs</span>
                <span className="text-blue-600">Complete club database</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                <span className="font-medium">📅 Events & Types</span>
                <span className="text-green-600">All events with details</span>
              </div>
            </div>

            {exportProgress && (
              <div className="mt-4 p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600 animate-pulse" />
                  <div className="text-sm font-medium text-blue-800">{exportProgress}</div>
                </div>
              </div>
            )}

            {exportEventsProgress && (
              <div className="mt-4 p-4 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600 animate-pulse" />
                  <div className="text-sm font-medium text-green-800">{exportEventsProgress}</div>
                </div>
              </div>
            )}

            {exportResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                exportResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {exportResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <div className="font-medium">
                      {exportResult.success ? 'Zones & Clubs Export Successful!' : 'Export Failed'}
                    </div>
                    <div className="text-sm mt-1 whitespace-pre-wrap">{exportResult.message || exportResult.error}</div>
                    {exportResult.details && (
                      <div className="text-sm mt-1">{exportResult.details}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {exportEventsResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                exportEventsResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {exportEventsResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-sm">
                    <div className="font-medium">
                      {exportEventsResult.success ? 'Events Export Successful!' : 'Events Export Failed'}
                    </div>
                    <div className="text-sm mt-1 whitespace-pre-wrap">{exportEventsResult.message || exportEventsResult.error}</div>
                    {exportEventsResult.details && (
                      <div className="text-sm mt-1">{exportEventsResult.details}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button 
              onClick={handleExportData} 
              disabled={loading || cleanupLoading || purgeLoading || exportLoading || exportEventsLoading} 
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportLoading ? 'Exporting...' : 'Export Zones & Clubs'}
            </Button>
            <Button 
              onClick={handleExportEvents} 
              disabled={loading || cleanupLoading || purgeLoading || exportLoading || exportEventsLoading} 
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {exportEventsLoading ? 'Exporting...' : 'Export Events'}
            </Button>
          </CardFooter>
        </Card>

        {/* Database Maintenance Section */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Database Maintenance
            </CardTitle>
            <CardDescription>
              Clean up duplicate data or completely purge all configuration data. Use these functions with caution as they modify or delete data permanently.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <span className="font-medium">🧹 Clean Duplicates</span>
                <span className="text-yellow-600">Remove duplicate zones/clubs</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-2 border-red-200">
                <span className="font-medium">⚠️ Purge Database</span>
                <span className="text-red-600">DELETE all zones, clubs & pictures</span>
              </div>
            </div>
            
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
          <CardFooter className="flex gap-2">
            <Button 
              onClick={handleCleanupDuplicates} 
              disabled={loading || cleanupLoading || purgeLoading || exportLoading || exportEventsLoading} 
              variant="outline"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {cleanupLoading ? 'Cleaning...' : 'Clean Duplicates'}
            </Button>
            <Button 
              onClick={handlePurgeDatabase} 
              disabled={loading || cleanupLoading || purgeLoading || exportLoading || exportEventsLoading} 
              variant="destructive"
              className="flex-1"
            >
              <Database className="h-4 w-4 mr-2" />
              {purgeLoading ? 'Purging...' : 'Purge All Data'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
