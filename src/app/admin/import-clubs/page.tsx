'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClubJsonData } from '@/lib/club-data-utils';

export default function ClubImportPage() {
  const [jsonData, setJsonData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const exampleData = `[
  {
    "club_id": 101,
    "club_name": "Bealiba Pony Club",
    "zone": "Central Zone",
    "physical_address": "Park Lane, Bealiba VIC 3475",
    "postal_address": "PO Box 123, Bealiba VIC 3475",
    "email": "secretary@bealibaponyclub.com.au",
    "phone": "03 5468 1234",
    "website_url": "https://www.bealibaponyclub.com.au",
    "social_media_url": "https://www.facebook.com/bealibaponyclub"
  }
]`;

  const clubZoneDataExample = `[
  {
    "zone_name": "Central Zone",
    "clubs": [
      {
        "club_id": 201,
        "club_name": "Bulla & District Pony Club",
        "zone": "Central Zone",
        "physical_address": "55 Green Street, Bulla VIC 3428",
        "postal_address": "PO Box 150, Bulla VIC 3428",
        "email": null,
        "phone": null,
        "website_url": null,
        "social_media_url": "https://www.facebook.com/BullaPonyClub/"
      }
    ]
  }
]`;

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Parse the JSON data
      const parsedData: ClubJsonData[] = JSON.parse(jsonData);
      
      // Call the import API
      const response = await fetch('/api/clubs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clubs: parsedData }),
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClubZoneDataImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Parse the ClubZoneData JSON
      const parsedData = JSON.parse(jsonData);
      
      // Call the ClubZoneData import API
      const response = await fetch('/api/admin/load-clubzone-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zonesData: parsedData }),
      });

      if (!response.ok) {
        throw new Error(`ClubZoneData import failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during ClubZoneData import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenericImport = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Parse the JSON data
      const parsedData = JSON.parse(jsonData);
      
      // Call the zones import API (handles both zones and clubs)
      const response = await fetch('/api/admin/zones/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      setImportResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async (type: 'zones' | 'clubs' | 'zones-clubs') => {
    setIsExporting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/zones/export?type=${type}`);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `pony-club-${type}-export.json`;

      // Create a blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during export');
    } finally {
      setIsExporting(false);
    }
  };

  const loadExampleData = (type: 'simple' | 'clubzone') => {
    setJsonData(type === 'simple' ? exampleData : clubZoneDataExample);
  };

  const loadClubZoneDataFile = async () => {
    try {
      const response = await fetch('/Information, Requirements and Data/ClubZoneData.json');
      if (response.ok) {
        const data = await response.text();
        setJsonData(data);
      } else {
        setError('Could not load ClubZoneData.json file');
      }
    } catch (err) {
      setError('Error loading ClubZoneData.json file');
    }
  };

  const loadAndImportClubZoneData = async () => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Load the file directly
      const response = await fetch('/Information, Requirements and Data/ClubZoneData.json');
      if (!response.ok) {
        throw new Error('Could not load ClubZoneData.json file');
      }
      
      const data = await response.text();
      const parsedData = JSON.parse(data);
      
      // Import the data
      const importResponse = await fetch('/api/admin/load-clubzone-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zonesData: parsedData }),
      });

      if (!importResponse.ok) {
        throw new Error(`ClubZoneData import failed: ${importResponse.statusText}`);
      }

      const result = await importResponse.json();
      setImportResult(result);
      setJsonData(data); // Show the loaded data in the textarea
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during ClubZoneData import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Data Management</h1>
        <p className="text-muted-foreground">
          Import, export, and manage zones and clubs data.
        </p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                Export zones, clubs, or both to timestamped JSON files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={() => handleExport('zones')} 
                  disabled={isExporting}
                  variant="outline"
                >
                  {isExporting ? 'Exporting...' : 'Export Zones'}
                </Button>
                <Button 
                  onClick={() => handleExport('clubs')} 
                  disabled={isExporting}
                  variant="outline"
                >
                  {isExporting ? 'Exporting...' : 'Export Clubs'}
                </Button>
                <Button 
                  onClick={() => handleExport('zones-clubs')} 
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export Zones & Clubs'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Import</CardTitle>
              <CardDescription>
                One-click import from your internal ClubZoneData.json file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">🚀 Load Internal ClubZoneData</h4>
                  <p className="text-sm text-muted-foreground">
                    Directly import from ClubZoneData.json. Updates existing records and adds missing information.
                  </p>
                </div>
                <Button 
                  onClick={loadAndImportClubZoneData} 
                  disabled={isImporting}
                  size="lg"
                >
                  {isImporting ? 'Importing...' : 'Import ClubZoneData'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual Import Options</CardTitle>
              <CardDescription>
                Choose your import method based on your data format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="font-semibold mb-2">🏇 Simple Club Import</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Import individual clubs with basic information.
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" onClick={() => loadExampleData('simple')}>
                      Load Example
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleImport} 
                      disabled={!jsonData.trim() || isImporting}
                      className="w-full"
                    >
                      Import Clubs
                    </Button>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-2">📁 ClubZoneData File</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Load from your comprehensive ClubZoneData.json file.
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" onClick={loadClubZoneDataFile}>
                      Load Internal File
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleClubZoneDataImport} 
                      disabled={!jsonData.trim() || isImporting}
                      className="w-full"
                    >
                      Import ClubZoneData
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      This will update existing data and add missing information without duplicating records.
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-2">📄 Generic Import</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Import exported zones/clubs data or custom format.
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" variant="outline" onClick={() => loadExampleData('clubzone')}>
                      Load Example
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleGenericImport} 
                      disabled={!jsonData.trim() || isImporting}
                      className="w-full"
                    >
                      Import Data
                    </Button>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>JSON Data</CardTitle>
              <CardDescription>
                Paste your JSON data below or use one of the load buttons above.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                placeholder="Paste your JSON data here..."
                className="min-h-[300px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {importResult.stats ? (
              // ClubZoneData results
              <div className="space-y-4">
                <div className="flex gap-4 flex-wrap">
                  <Badge variant="default">
                    📍 Zones: {importResult.stats.zones.created} created, {importResult.stats.zones.updated} updated
                  </Badge>
                  <Badge variant="default">
                    🏇 Clubs: {importResult.stats.clubs.created} created, {importResult.stats.clubs.updated} updated
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Processed {importResult.stats.processing.totalZones} zones with {importResult.stats.processing.validClubs} valid clubs
                  {importResult.stats.processing.invalidClubs > 0 && ` (${importResult.stats.processing.invalidClubs} invalid clubs skipped)`}
                </div>
              </div>
            ) : (
              // Regular import results
              <div className="flex gap-4">
                <Badge variant="default">
                  ✅ Imported: {importResult.imported || 0}
                </Badge>
                <Badge variant="secondary">
                  ⏭️ Updated: {importResult.updated || 0}
                </Badge>
                {importResult.failed > 0 && (
                  <Badge variant="destructive">
                    ❌ Failed: {importResult.failed}
                  </Badge>
                )}
              </div>
            )}

            {importResult.invalidClubs?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Invalid Clubs:</h4>
                <div className="space-y-1">
                  {importResult.invalidClubs.map((invalid: any, index: number) => (
                    <div key={index} className="text-sm text-red-600">
                      <strong>{invalid.data.club_name}:</strong> {invalid.errors.join(', ')}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.missingZones?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Missing Zones:</h4>
                <div className="text-sm text-amber-600">
                  The following zones need to be created first: {importResult.missingZones.join(', ')}
                </div>
              </div>
            )}

            {importResult.errors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Errors:</h4>
                <div className="space-y-1">
                  {importResult.errors.map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Format Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Simple Club Format</h4>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "club_id": 101,
  "club_name": "Club Name",
  "zone": "Zone Name",
  "physical_address": "Street, Suburb VIC",
  "postal_address": "PO Box, Suburb VIC",
  "email": "secretary@club.com.au",
  "phone": "03 1234 5678",
  "website_url": "https://club.com.au",
  "social_media_url": "https://facebook.com/club"
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">ClubZoneData Format</h4>
              <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "zone_name": "Zone Name",
  "clubs": [
    {
      "club_id": 101,
      "club_name": "Club Name",
      "zone": "Zone Name",
      "physical_address": "Address",
      ...
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
