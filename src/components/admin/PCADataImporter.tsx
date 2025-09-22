'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Eye, 
  Download,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
  User,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';

interface ExtractedClubData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  contactPerson?: string;
  contactRole?: string;
  additionalInfo?: string;
}

interface ClubMatch {
  clubId: string;
  existingClubName: string;
  extractedData: ExtractedClubData;
  matchConfidence: number;
  matchType: 'exact' | 'high' | 'medium' | 'low' | 'none';
  suggestedAction: 'update' | 'review' | 'skip';
}

// Club Logos Tab Component
function ClubLogosTab() {
  const [logoStats, setLogoStats] = useState<{
    totalClubs: number;
    clubsWithLogoIds: number;
    clubsWithPcaIds: number;
  } | null>(null);
  const [clubsWithPcaIds, setClubsWithPcaIds] = useState<any[]>([]);
  const [downloadedLogos, setDownloadedLogos] = useState<any[]>([]);
  const [selectedLogos, setSelectedLogos] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Fetch logo statistics on component mount
  useEffect(() => {
    fetchLogoStats();
  }, []);

  const fetchLogoStats = async () => {
    try {
      const response = await fetch('/api/admin/download-club-logos');
      if (response.ok) {
        const data = await response.json();
        setLogoStats({
          totalClubs: data.summary.totalClubs,
          clubsWithLogoIds: data.summary.clubsWithPcaIds,
          clubsWithPcaIds: data.summary.clubsWithPcaIds
        });
        setClubsWithPcaIds(data.clubsWithPcaIds || []);
      }
    } catch (error) {
      console.error('Error fetching logo stats:', error);
    }
  };

  const downloadAllLogos = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      const response = await fetch('/api/admin/download-club-logos?download=true');
      if (response.ok) {
        const data = await response.json();
        setDownloadedLogos(data.downloads || []);
        setDownloadProgress(100);
      }
    } catch (error) {
      console.error('Error downloading logos:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const storeSelectedLogos = async () => {
    const selectedLogoData = downloadedLogos.filter(logo => 
      selectedLogos.has(logo.clubId)
    );

    setIsStoring(true);
    try {
      const response = await fetch('/api/admin/store-club-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedLogos: selectedLogoData })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully stored ${result.summary.successfulStores} logos`);
        setSelectedLogos(new Set());
      }
    } catch (error) {
      console.error('Error storing logos:', error);
      alert('Error storing logos');
    } finally {
      setIsStoring(false);
    }
  };

  const toggleLogoSelection = (clubId: string) => {
    const newSelected = new Set(selectedLogos);
    if (newSelected.has(clubId)) {
      newSelected.delete(clubId);
    } else {
      newSelected.add(clubId);
    }
    setSelectedLogos(newSelected);
  };

  const selectAllLogos = () => {
    setSelectedLogos(new Set(downloadedLogos.map(logo => logo.clubId)));
  };

  const deselectAllLogos = () => {
    setSelectedLogos(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Logo Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Club Logo Statistics
          </CardTitle>
          <CardDescription>
            Overview of clubs with PCA logo IDs available for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logoStats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{logoStats.totalClubs}</div>
                <div className="text-sm text-muted-foreground">Total Clubs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{logoStats.clubsWithLogoIds}</div>
                <div className="text-sm text-muted-foreground">With Logo IDs</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{logoStats.clubsWithPcaIds}</div>
                <div className="text-sm text-muted-foreground">Available for Download</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading statistics...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Download Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Download Club Logos</CardTitle>
          <CardDescription>
            Download club logos from Pony Club Australia system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={downloadAllLogos} 
              disabled={isDownloading || !logoStats?.clubsWithPcaIds}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download All Logos
                </>
              )}
            </Button>
          </div>

          {isDownloading && downloadProgress > 0 && (
            <Progress value={downloadProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Clubs with PCA IDs and URLs */}
      {clubsWithPcaIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-blue-600" />
              Clubs with PCA Logo URLs ({clubsWithPcaIds.length})
            </CardTitle>
            <CardDescription>
              Clubs that have valid PCA logo IDs and constructed download URLs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {clubsWithPcaIds.map((club) => (
                <div key={club.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{club.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Logo ID: <code className="bg-gray-200 px-1 rounded">{club.logoUrlId}</code>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Doc ID: <code className="bg-gray-200 px-1 rounded">{club.docId}</code>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <a 
                        href={club.fullUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View URL
                      </a>
                    </div>
                  </div>
                  <div className="mt-2 text-xs">
                    <div className="text-muted-foreground mb-1">Constructed URL:</div>
                    <code className="text-xs bg-white border rounded p-2 block break-all font-mono">
                      {club.fullUrl}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Downloaded Logos Preview */}
      {downloadedLogos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Downloaded Logos ({downloadedLogos.length})</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllLogos}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllLogos}>
                  Deselect All
                </Button>
                <Button 
                  onClick={storeSelectedLogos}
                  disabled={selectedLogos.size === 0 || isStoring}
                  size="sm"
                >
                  {isStoring ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Storing...
                    </>
                  ) : (
                    `Store Selected (${selectedLogos.size})`
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {downloadedLogos.map((logo) => (
                <Card key={logo.clubId} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedLogos.has(logo.clubId)}
                        onCheckedChange={() => toggleLogoSelection(logo.clubId)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {logo.clubName}
                        </div>
                        <div className="mt-2">
                          <img
                            src={logo.logoData}
                            alt={`${logo.clubName} logo`}
                            className="w-16 h-16 object-contain border rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMS4zMzMzIDIxLjMzMzNIMzJWMzJIMjEuMzMzM1YyMS4zMzMzWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMzIgMjEuMzMzM0g0Mi42NjY3VjMySDMyVjIxLjMzMzNaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMS4zMzMzIDMySDMyVjQyLjY2NjdIMjEuMzMzM1YzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+';
                            }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {logo.contentType}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PCADataImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [logSessionId, setLogSessionId] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // NOTE: You will need to implement the following functions for the component to be fully operational.
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setImportResult(null); // Reset previous results
    }
  };

  const processFile = async (mode: 'preview' | 'import') => {
    if (!file) return;
    if (mode === 'preview') setIsProcessing(true);
    if (mode === 'import') setIsImporting(true);
    
    try {
      console.log(`[PCADataImporter] Starting ${mode} for file:`, file.name, `(${file.size} bytes)`);
      
      const fileContent = await file.text();
      console.log(`[PCADataImporter] File content length: ${fileContent.length} characters`);
      console.log(`[PCADataImporter] Content preview:`, fileContent.substring(0, 200));
      
      // Send to API for processing
      const response = await fetch('/api/admin/import-pca-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonContent: fileContent,
          mode,
          selectedMatches: mode === 'import' ? Array.from(selectedMatches) : undefined
        }),
      });
      
      console.log(`[PCADataImporter] API response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PCADataImporter] API request failed:`, response.status, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[PCADataImporter] API result:`, result);
      
      setImportResult(result);
      
      // Auto-select high confidence matches for preview
      if (mode === 'preview' && result.success) {
        const autoSelected = new Set<string>();
        result.matches
          .filter((match: ClubMatch) => match.matchType === 'exact' || match.matchType === 'high')
          .forEach((match: ClubMatch) => autoSelected.add(match.clubId));
        setSelectedMatches(autoSelected);
      }
    } catch (error) {
      console.error(`[PCADataImporter] Error during ${mode}:`, error);
      
      // Create detailed error information
      const errorDetails = [];
      if (error instanceof Error) {
        errorDetails.push(`Error: ${error.message}`);
      }
      
      // Add file information to help with debugging
      errorDetails.push(`File: ${file.name} (${file.size} bytes)`);
      errorDetails.push(`File type: ${file.type || 'unknown'}`);
      
      // Add troubleshooting tips
      errorDetails.push('Troubleshooting tips:');
      errorDetails.push('• Ensure the file is valid JSON format');
      errorDetails.push('• Check that the JSON contains an array of club objects');
      errorDetails.push('• Verify club objects have "Name", "club_name", or "name" fields');
      errorDetails.push('• Make sure the file is not corrupted or truncated');
      
      setImportResult({
        success: false,
        mode,
        error: error instanceof Error ? error.message : 'Failed to process file',
        matches: [],
        summary: {
          totalExtracted: 0,
          highConfidenceMatches: 0,
          mediumConfidenceMatches: 0,
          lowConfidenceMatches: 0,
          noMatches: 0
        },
        diagnostics: errorDetails
      });
    } finally {
      setIsProcessing(false);
      setIsImporting(false);
    }
  };
  
  const handleMatchSelection = (clubId: string, checked: boolean) => {
    setSelectedMatches(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(clubId);
      } else {
        newSet.delete(clubId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    // Scroll to the bottom of the log output when new lines are added
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);


  const getMatchBadge = (match: ClubMatch) => {
    const confidence = Math.round(match.matchConfidence * 100);
    switch (match.matchType) {
      case 'exact':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Exact Match ({confidence}%)
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            High Match ({confidence}%)
          </Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Medium Match ({confidence}%)
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Low Match ({confidence}%)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            No Match
          </Badge>
        );
    }
  }
  const selectAllHighConfidence = () => {
    if (!importResult) return;
    
    const highConfidenceClubs = new Set<string>();
    importResult.matches
      .filter((match: ClubMatch) => match.matchType === 'exact' || match.matchType === 'high')
      .forEach((match: ClubMatch) => highConfidenceClubs.add(match.clubId));
    
    setSelectedMatches(highConfidenceClubs);
  };

  const selectAll = () => {
    if (!importResult) return;
    
    const allClubs = new Set<string>();
    importResult.matches.forEach((match: ClubMatch) => allClubs.add(match.clubId));
    setSelectedMatches(allClubs);
  };

  const selectNone = () => {
    setSelectedMatches(new Set());
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Import PCA Club Data
          </CardTitle>
          <CardDescription>
            Upload a JSON file containing Pony Club Australia club data to extract and update club information including logos, addresses, and contact details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList>
              <TabsTrigger value="upload">Upload & Preview</TabsTrigger>
              <TabsTrigger value="clublogos">Club Logos</TabsTrigger>
              {importResult && <TabsTrigger value="results">Import Results</TabsTrigger>}
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="flex flex-col items-center gap-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Upload JSON File</h3>
                    <p className="text-sm text-muted-foreground">
                      Select the JSON file containing Pony Club Australia club data
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  {file && (
                    <div className="text-sm text-muted-foreground">
                      Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                      {file.size > 0 && (
                        <div className="mt-1 text-xs">
                          Last modified: {new Date(file.lastModified).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Processing Progress & Cool Log Output */}
              {(isProcessing || isImporting || uploadProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Processing JSON file...</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  {/* Cool scrolling log output */}
                  <div
                    ref={logRef}
                    className="mt-2 max-h-48 overflow-y-auto rounded bg-black/80 text-xs font-mono text-white p-2 border border-gray-700 animate-fade-in"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                  >
                    {logLines.length === 0 ? (
                      <span className="text-gray-400">Waiting for log output...</span>
                    ) : (
                      logLines.map((line, idx) => {
                        let color = 'text-gray-200';
                        if (line.includes('✅')) color = 'text-green-400';
                        if (line.includes('❌')) color = 'text-red-400';
                        if (line.includes('🕷️')) color = 'text-pink-400';
                        if (line.includes('📄') || line.includes('📊')) color = 'text-blue-400';
                        return (
                          <div key={idx} className={color + ' transition-all'}>
                            {line}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Preview Button */}
              {file && !isProcessing && (
                <Button 
                  onClick={() => processFile('preview')} 
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Data Extraction
                </Button>
              )}

              {/* Preview Results */}
              {importResult && importResult.mode === 'preview' && (
                <div className="space-y-4">
                  {importResult.success ? (
                    <>
                      {/* Summary Statistics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Extraction Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded">
                              <div className="text-2xl font-bold text-blue-600">{importResult.summary.totalExtracted}</div>
                              <div className="text-sm text-blue-600">Extracted</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
                              <div className="text-2xl font-bold text-green-600">{importResult.summary.highConfidenceMatches}</div>
                              <div className="text-sm text-green-600">High Match</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
                              <div className="text-2xl font-bold text-yellow-600">{importResult.summary.mediumConfidenceMatches}</div>
                              <div className="text-sm text-yellow-600">Medium Match</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded">
                              <div className="text-2xl font-bold text-orange-600">{importResult.summary.lowConfidenceMatches}</div>
                              <div className="text-sm text-orange-600">Low Match</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 dark:bg-gray-950 rounded">
                              <div className="text-2xl font-bold text-gray-600">{importResult.summary.noMatches}</div>
                              <div className="text-sm text-gray-600">No Match</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Selection Controls */}
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={selectAllHighConfidence}>
                          Select High Confidence
                        </Button>
                        <Button variant="outline" size="sm" onClick={selectAll}>
                          Select All
                        </Button>
                        <Button variant="outline" size="sm" onClick={selectNone}>
                          Select None
                        </Button>
                        <div className="text-sm text-muted-foreground flex items-center">
                          {selectedMatches.size} of {importResult.matches.length} selected
                        </div>
                      </div>

                      {/* Matches Table */}
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Club Matches</h3>
                        {importResult.matches.map((match: ClubMatch) => (
                          <Card key={match.clubId} className="relative">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={selectedMatches.has(match.clubId)}
                                  onCheckedChange={(checked) => 
                                    handleMatchSelection(match.clubId, checked as boolean)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-semibold">{match.existingClubName}</h4>
                                      <p className="text-sm text-muted-foreground">
                                        Extracted as: {match.extractedData.name}
                                      </p>
                                    </div>
                                    {getMatchBadge(match)}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h5 className="font-medium text-sm mb-2">Extracted Data:</h5>
                                      <div className="space-y-1 text-sm">
                                        {match.extractedData.address && (
                                          <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3 text-muted-foreground" />
                                            <span>{match.extractedData.address}</span>
                                          </div>
                                        )}
                                        {match.extractedData.phone && (
                                          <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                            <span>{match.extractedData.phone}</span>
                                          </div>
                                        )}
                                        {match.extractedData.email && (
                                          <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-muted-foreground" />
                                            <span>{match.extractedData.email}</span>
                                          </div>
                                        )}
                                        {match.extractedData.website && (
                                          <div className="flex items-center gap-2">
                                            <Globe className="h-3 w-3 text-muted-foreground" />
                                            <a 
                                              href={match.extractedData.website} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              Website
                                            </a>
                                          </div>
                                        )}
                                        {match.extractedData.logoUrl && (
                                          <div className="flex items-center gap-2">
                                            <Eye className="h-3 w-3 text-muted-foreground" />
                                            <a 
                                              href={match.extractedData.logoUrl} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              Logo Image
                                            </a>
                                          </div>
                                        )}
                                        {match.extractedData.contactPerson && (
                                          <div className="flex items-center gap-2">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            <span>{match.extractedData.contactPerson} 
                                              {match.extractedData.contactRole && ` (${match.extractedData.contactRole})`}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {match.extractedData.logoUrl && (
                                      <div>
                                        <h5 className="font-medium text-sm mb-2">Club Logo:</h5>
                                        <img 
                                          src={match.extractedData.logoUrl} 
                                          alt={`${match.extractedData.name} logo`}
                                          className="max-w-24 max-h-24 object-contain border rounded"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Import Button */}
                      {selectedMatches.size > 0 && (
                        <Button 
                          onClick={() => processFile('import')} 
                          className="w-full"
                          disabled={isImporting}
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing {selectedMatches.size} Clubs...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Import {selectedMatches.size} Selected Clubs
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {importResult.error || 'Failed to extract club data from the file'}
                        </AlertDescription>
                      </Alert>
                      
                      {/* Enhanced Diagnostics */}
                      {(importResult as any).diagnostics && (
                        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center gap-2">
                              <AlertCircle className="h-5 w-5" />
                              Diagnostic Information
                            </CardTitle>
                            <CardDescription className="text-orange-700 dark:text-orange-300">
                              Detailed information to help troubleshoot the import issue
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {(importResult as any).diagnostics.map((diagnostic: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <div className="text-orange-600 dark:text-orange-400 font-mono">•</div>
                                  <div className="text-orange-800 dark:text-orange-200">{diagnostic}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      {/* File Information */}
                      {file && (
                        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              File Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700 dark:text-blue-300">Name:</span>
                                <span className="text-blue-800 dark:text-blue-200">{file.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700 dark:text-blue-300">Size:</span>
                                <span className="text-blue-800 dark:text-blue-200">{Math.round(file.size / 1024)} KB</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700 dark:text-blue-300">Type:</span>
                                <span className="text-blue-800 dark:text-blue-200">{file.type || 'unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-blue-700 dark:text-blue-300">Last Modified:</span>
                                <span className="text-blue-800 dark:text-blue-200">{new Date(file.lastModified).toLocaleString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="clublogos" className="space-y-4">
              <ClubLogosTab />
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {importResult && importResult.mode === 'import' && (
                <div className="space-y-4">
                  {importResult.success ? (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        Successfully imported club data! Updated {importResult.summary.imported} clubs.
                        {importResult.summary.skipped! > 0 && ` Skipped ${importResult.summary.skipped} clubs.`}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Import failed: {importResult.error}
                        </AlertDescription>
                      </Alert>
                      
                      {/* Enhanced Diagnostics for Import Failures */}
                      {(importResult as any).diagnostics && (
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                              <XCircle className="h-5 w-5" />
                              Import Failure Details
                            </CardTitle>
                            <CardDescription className="text-red-700 dark:text-red-300">
                              Information about what went wrong during the import process
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {(importResult as any).diagnostics.map((diagnostic: string, index: number) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <div className="text-red-600 dark:text-red-400 font-mono">•</div>
                                  <div className="text-red-800 dark:text-red-200">{diagnostic}</div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}