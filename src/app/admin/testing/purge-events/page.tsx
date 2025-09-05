'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  ArrowLeft, 
  Upload, 
  FileArchive, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Search,
  Shield,
  Eye,
  AlertCircle,
  Clock,
  FileText,
  Users,
  MapPin,
  Calendar,
  Database,
  Target
} from 'lucide-react';
import Link from 'next/link';

interface PurgeProgress {
  stage: string;
  percentage: number;
  details: string;
  logs: string[];
}

interface PurgeConfig {
  dryRun: boolean;
  requireConfirmation: boolean;
  filterByZone: string[];
  filterByClub: string[];
  filterByDateRange: {
    start: string;
    end: string;
  };
  skipScheduleFiles: boolean;
  createBackup: boolean;
}

interface MatchedEvent {
  id: string;
  name: string;
  date: string;
  club: string;
  zone: string;
  status: string;
  matchType: 'exact' | 'near' | 'partial';
  confidence: number;
}

interface PurgeResult {
  success: boolean;
  totalMatched: number;
  deleted: number;
  skipped: number;
  errors: string[];
  backupCreated?: string;
  purgeTime: number;
  summary: {
    byZone: { [zone: string]: number };
    byClub: { [club: string]: number };
    byStatus: { [status: string]: number };
    byMatchType: { [type: string]: number };
  };
}

interface ArchiveAnalysis {
  totalEvents: number;
  dateRange: { start: string; end: string };
  zones: string[];
  clubs: string[];
  eventTypes: string[];
  hasManifest: boolean;
  manifestVersion: string;
  checksumValid: boolean;
}

export default function PurgeEventsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState<PurgeProgress | null>(null);
  const [purgeConfig, setPurgeConfig] = useState<PurgeConfig>({
    dryRun: true,
    requireConfirmation: true,
    filterByZone: [],
    filterByClub: [],
    filterByDateRange: { start: '', end: '' },
    skipScheduleFiles: false,
    createBackup: true
  });
  const [archiveAnalysis, setArchiveAnalysis] = useState<ArchiveAnalysis | null>(null);
  const [matchedEvents, setMatchedEvents] = useState<MatchedEvent[]>([]);
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
      setArchiveAnalysis(null);
      setMatchedEvents([]);
      setPurgeResult(null);
      setShowConfirmation(false);
    } else {
      alert('Please select a valid ZIP file.');
    }
  };

  const handleAnalyzeArchive = async () => {
    if (!selectedFile) return;

    setIsPurging(true);
    setPurgeProgress({
      stage: 'Analyzing Archive',
      percentage: 10,
      details: 'Reading ZIP file structure...',
      logs: [`[${new Date().toLocaleTimeString()}] Starting archive analysis...`]
    });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('operation', 'analyze');

      const response = await fetch('/api/admin/purge-events', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Analysis failed');
      }

      const result = await response.json();
      
      setPurgeProgress(prev => ({
        stage: 'Analysis Complete',
        percentage: 100,
        details: `Found ${result.analysis.totalEvents} events in archive`,
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Analysis completed successfully`]
      }));

      setArchiveAnalysis(result.analysis);
      setMatchedEvents(result.matches || []);

    } catch (error: any) {
      setPurgeProgress(prev => ({
        stage: 'Analysis Failed',
        percentage: 0,
        details: error.message,
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Error: ${error.message}`]
      }));
    } finally {
      setIsPurging(false);
    }
  };

  const handlePurgeEvents = async () => {
    if (!selectedFile || matchedEvents.length === 0) return;

    if (purgeConfig.requireConfirmation && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsPurging(true);
    setPurgeResult(null);
    setShowConfirmation(false);

    try {
      setPurgeProgress({
        stage: purgeConfig.dryRun ? 'Simulating Purge' : 'Purging Events',
        percentage: 20,
        details: `Processing ${matchedEvents.length} matched events...`,
        logs: [`[${new Date().toLocaleTimeString()}] Starting ${purgeConfig.dryRun ? 'dry run' : 'purge'} operation...`]
      });

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('operation', 'purge');
      formData.append('config', JSON.stringify(purgeConfig));

      console.log('Starting purge operation with config:', purgeConfig);
      
      // Add timeout and progress updates
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 300000); // 5 minute timeout

      const response = await fetch('/api/admin/purge-events', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Purge failed');
      }

      const result = await response.json();

      setPurgeProgress(prev => ({
        stage: 'Purge Complete',
        percentage: 100,
        details: `${purgeConfig.dryRun ? 'Simulation' : 'Purge'} completed successfully`,
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] ${result.result.deleted} events ${purgeConfig.dryRun ? 'would be' : 'were'} deleted`]
      }));

      setPurgeResult(result.result);

    } catch (error: any) {
      console.error('Purge operation failed:', error);
      
      let errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorMessage = 'Operation timed out after 5 minutes. This may be due to a large number of events or database connectivity issues.';
      }
      
      setPurgeProgress(prev => ({
        stage: 'Purge Failed',
        percentage: 0,
        details: errorMessage,
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Error: ${errorMessage}`]
      }));
    } finally {
      setIsPurging(false);
    }
  };

  const updateConfig = (key: keyof PurgeConfig, value: any) => {
    setPurgeConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-red-600" />
            Event Purge Tool
          </h1>
          <p className="text-muted-foreground mt-1">
            Safely remove events from the database using exported ZIP archives
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload & Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Archive Upload & Configuration
            </CardTitle>
            <CardDescription>
              Upload an exported ZIP file and configure purge settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Select Export Archive</Label>
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium"
                />
                <Button 
                  onClick={handleAnalyzeArchive}
                  disabled={!selectedFile || isPurging}
                  variant="outline"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileArchive className="h-4 w-4" />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </div>
              )}
            </div>

            <Separator />

            {/* Safety Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safety Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dry-run"
                    checked={purgeConfig.dryRun}
                    onCheckedChange={(checked) => updateConfig('dryRun', !!checked)}
                  />
                  <Label htmlFor="dry-run" className="text-sm">
                    Dry run mode (simulate without deleting)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="require-confirmation"
                    checked={purgeConfig.requireConfirmation}
                    onCheckedChange={(checked) => updateConfig('requireConfirmation', !!checked)}
                  />
                  <Label htmlFor="require-confirmation" className="text-sm">
                    Require confirmation before purging
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-backup"
                    checked={purgeConfig.createBackup}
                    onCheckedChange={(checked) => updateConfig('createBackup', !!checked)}
                  />
                  <Label htmlFor="create-backup" className="text-sm">
                    Create backup before purging
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-schedules"
                    checked={purgeConfig.skipScheduleFiles}
                    onCheckedChange={(checked) => updateConfig('skipScheduleFiles', !!checked)}
                  />
                  <Label htmlFor="skip-schedules" className="text-sm">
                    Skip schedule file deletion
                  </Label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t">
              {showConfirmation && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Confirm Purge:</strong> This will permanently delete {matchedEvents.length} events. 
                    This action cannot be undone. Are you sure?
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handlePurgeEvents}
                disabled={!archiveAnalysis || matchedEvents.length === 0 || isPurging}
                className="w-full"
                variant={showConfirmation ? "destructive" : "default"}
              >
                {isPurging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {purgeConfig.dryRun ? 'Simulating...' : 'Purging...'}
                  </>
                ) : showConfirmation ? (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirm Purge
                  </>
                ) : (
                  <>
                    {purgeConfig.dryRun ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {purgeConfig.dryRun ? 'Simulate Purge' : 'Purge Events'}
                  </>
                )}
              </Button>

              {showConfirmation && (
                <Button 
                  onClick={() => setShowConfirmation(false)}
                  variant="outline"
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress & Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Analysis & Progress
            </CardTitle>
            <CardDescription>
              Archive analysis results and purge progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Archive Analysis */}
            {archiveAnalysis && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileArchive className="h-4 w-4" />
                  Archive Overview
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Events:</span>
                      <span className="font-medium">{archiveAnalysis.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Zones:</span>
                      <span className="font-medium">{archiveAnalysis.zones.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Clubs:</span>
                      <span className="font-medium">{archiveAnalysis.clubs.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manifest:</span>
                      <Badge variant={archiveAnalysis.hasManifest ? "default" : "destructive"}>
                        {archiveAnalysis.hasManifest ? "Valid" : "Missing"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Checksum:</span>
                      <Badge variant={archiveAnalysis.checksumValid ? "default" : "destructive"}>
                        {archiveAnalysis.checksumValid ? "Valid" : "Invalid"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Range:</span>
                      <span className="font-medium text-xs">
                        {archiveAnalysis.dateRange.start} to {archiveAnalysis.dateRange.end}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Matched Events */}
            {matchedEvents.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Matched Events ({matchedEvents.length})
                </h4>
                
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {matchedEvents.slice(0, 10).map((event, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{event.name}</div>
                        <div className="text-muted-foreground">{event.date} • {event.club}</div>
                      </div>
                      <Badge 
                        variant={event.matchType === 'exact' ? 'default' : 
                                event.matchType === 'near' ? 'secondary' : 'outline'}
                        className="ml-2"
                      >
                        {event.confidence}%
                      </Badge>
                    </div>
                  ))}
                  {matchedEvents.length > 10 && (
                    <div className="text-center text-muted-foreground text-xs pt-2 border-t">
                      +{matchedEvents.length - 10} more events
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Progress */}
            {purgeProgress && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {purgeProgress.stage}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{purgeProgress.details}</span>
                    <span className="font-medium">{purgeProgress.percentage}%</span>
                  </div>
                  <Progress value={purgeProgress.percentage} className="h-2" />
                </div>

                <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-muted/50">
                  <div className="space-y-1 text-xs font-mono">
                    {purgeProgress.logs.map((log, index) => (
                      <div key={index} className="text-muted-foreground">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Summary */}
            {purgeResult && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Purge Results
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Matched:</span>
                      <span className="font-medium">{purgeResult.totalMatched}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deleted:</span>
                      <span className="font-medium text-red-600">{purgeResult.deleted}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skipped:</span>
                      <span className="font-medium">{purgeResult.skipped}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{purgeResult.purgeTime}ms</span>
                    </div>
                  </div>
                </div>

                {purgeResult.backupCreated && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Backup created: {purgeResult.backupCreated}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
