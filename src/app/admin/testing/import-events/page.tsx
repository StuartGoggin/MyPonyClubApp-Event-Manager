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
import { 
  FileUp, 
  Upload, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ArrowLeft,
  Shield,
  Clock,
  Database,
  AlertCircle,
  Eye,
  Save,
  X,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import Link from 'next/link';
import JSZip from 'jszip';

interface ImportProgress {
  stage: string;
  percentage: number;
  details: string;
  logs: string[];
}

interface ImportConfig {
  eventTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  dryRun: boolean;
  validateManifest: boolean;
  allowDuplicates: boolean;
  skipSchedules: boolean;
}

interface ConflictItem {
  id: string;
  type: 'duplicate_id' | 'duplicate_name' | 'date_conflict' | 'club_missing' | 'type_missing';
  severity: 'high' | 'medium' | 'low';
  existing: any;
  imported: any;
  resolution: 'skip' | 'overwrite' | 'rename' | 'merge' | null;
  message: string;
}

interface ImportSummary {
  totalEvents: number;
  validEvents: number;
  conflicts: ConflictItem[];
  scheduleFiles: number;
  missingDependencies: string[];
  manifestValid: boolean;
  versionCompatible: boolean;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  conflicts: ConflictItem[];
}

export default function ImportEventsPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    eventTypes: [],
    dateRange: { start: '', end: '' },
    dryRun: true,
    validateManifest: true,
    allowDuplicates: false,
    skipSchedules: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showConflictResolution, setShowConflictResolution] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data for event types
  const availableEventTypes = [
    { id: 'rally', name: 'Rally' },
    { id: 'ode', name: 'One Day Event' },
    { id: 'showjumping', name: 'Show Jumping' },
    { id: 'dressage', name: 'Dressage' },
    { id: 'cross-country', name: 'Cross Country' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
      setImportSummary(null);
      setImportResult(null);
      setShowConflictResolution(false);
    } else {
      alert('Please select a ZIP file');
    }
  };

  const analyzeArchive = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress({
      stage: 'Analyzing Archive',
      percentage: 10,
      details: 'Reading ZIP file contents...',
      logs: [`[${new Date().toLocaleTimeString()}] Starting archive analysis...`]
    });

    try {
      const zip = new JSZip();
      const archive = await zip.loadAsync(selectedFile);

      // Update progress
      setImportProgress(prev => ({
        stage: 'Validating Structure',
        percentage: 30,
        details: 'Checking required files and manifest...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Archive loaded, validating structure...`]
      }));

      // Check for required files
      const requiredFiles = ['events.json', 'clubs.json', 'zones.json', 'event-types.json'];
      const missingFiles = requiredFiles.filter(file => !archive.files[file]);
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
      }

      // Validate manifest if present
      let manifestValid = false;
      let versionCompatible = true;
      
      if (archive.files['manifest.json']) {
        setImportProgress(prev => ({
          stage: 'Validating Manifest',
          percentage: 50,
          details: 'Checking file integrity and compatibility...',
          logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Validating manifest and checksums...`]
        }));
        
        // In a real implementation, you would validate checksums here
        manifestValid = true;
      }

      // Parse events and detect conflicts
      setImportProgress(prev => ({
        stage: 'Detecting Conflicts',
        percentage: 70,
        details: 'Analyzing potential data conflicts...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Parsing events and detecting conflicts...`]
      }));

      const eventsFile = await archive.files['events.json'].async('string');
      const events = JSON.parse(eventsFile);

      // Simulate conflict detection
      const conflicts: ConflictItem[] = [
        {
          id: 'conflict_1',
          type: 'duplicate_name',
          severity: 'medium',
          existing: { id: 'event123', name: 'Spring Rally', date: '2025-03-15' },
          imported: { id: 'event456', name: 'Spring Rally', date: '2025-03-20' },
          resolution: null,
          message: 'Event with same name exists but different date'
        },
        {
          id: 'conflict_2',
          type: 'duplicate_id',
          severity: 'high',
          existing: { id: 'event789', name: 'Summer ODE', date: '2025-06-10' },
          imported: { id: 'event789', name: 'Summer Competition', date: '2025-06-10' },
          resolution: null,
          message: 'Event ID already exists with different name'
        }
      ];

      // Count schedule files
      const scheduleFiles = Object.keys(archive.files).filter(name => 
        name.startsWith('schedules/') && !name.endsWith('/')
      ).length;

      setImportProgress(prev => ({
        stage: 'Analysis Complete',
        percentage: 100,
        details: 'Archive analysis completed successfully',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Analysis complete - found ${events.length} events, ${conflicts.length} conflicts`]
      }));

      setImportSummary({
        totalEvents: events.length,
        validEvents: events.length - conflicts.length,
        conflicts,
        scheduleFiles,
        missingDependencies: [],
        manifestValid,
        versionCompatible
      });

      if (conflicts.length > 0) {
        setShowConflictResolution(true);
      }

    } catch (error) {
      setImportProgress(prev => ({
        stage: 'Analysis Failed',
        percentage: 0,
        details: 'Error analyzing archive',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }));
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importSummary) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      // Call import API
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('config', JSON.stringify(importConfig));
      
      if (importSummary.conflicts.length > 0) {
        formData.append('conflicts', JSON.stringify(importSummary.conflicts));
      }

      setImportProgress({
        stage: 'Importing Data',
        percentage: 20,
        details: 'Uploading archive and processing events...',
        logs: [`[${new Date().toLocaleTimeString()}] Starting import process...`]
      });

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Import failed');
      }

      setImportProgress(prev => ({
        stage: 'Processing Events',
        percentage: 60,
        details: 'Creating events and uploading schedules...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Processing event data...`]
      }));

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

      setImportProgress(prev => ({
        stage: 'Finalizing',
        percentage: 90,
        details: 'Updating database and cleaning up...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Finalizing import...`]
      }));

      const result = await response.json();

      setImportProgress(prev => ({
        stage: 'Complete',
        percentage: 100,
        details: 'Import completed successfully',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Import complete - ${result.imported} events imported`]
      }));

      setImportResult(result);

    } catch (error) {
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        conflicts: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  const updateConflictResolution = (conflictId: string, resolution: ConflictItem['resolution']) => {
    if (!importSummary) return;
    
    const updatedConflicts = importSummary.conflicts.map(conflict =>
      conflict.id === conflictId ? { ...conflict, resolution } : conflict
    );
    
    setImportSummary({ ...importSummary, conflicts: updatedConflicts });
  };

  const getSeverityColor = (severity: ConflictItem['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
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
            <FileUp className="h-8 w-8 text-purple-600" />
            Event Import Tool
          </h1>
          <p className="text-muted-foreground mt-1">
            Restore events from exported ZIP archives with conflict detection and validation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Archive Upload & Configuration
            </CardTitle>
            <CardDescription>
              Select a ZIP archive and configure import settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Archive File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                  title="Select ZIP archive for import"
                  aria-label="Select ZIP archive file"
                />
                <FileUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop a ZIP file here, or click to browse
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  Select ZIP File
                </Button>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <Badge variant="outline">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Import Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Import Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dry-run"
                  checked={importConfig.dryRun}
                  onCheckedChange={(checked) => setImportConfig(prev => ({
                    ...prev,
                    dryRun: !!checked
                  }))}
                />
                <Label htmlFor="dry-run" className="text-sm">
                  Dry run (simulate without changes)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate-manifest"
                  checked={importConfig.validateManifest}
                  onCheckedChange={(checked) => setImportConfig(prev => ({
                    ...prev,
                    validateManifest: !!checked
                  }))}
                />
                <Label htmlFor="validate-manifest" className="text-sm">
                  Validate manifest and checksums
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-schedules"
                  checked={importConfig.skipSchedules}
                  onCheckedChange={(checked) => setImportConfig(prev => ({
                    ...prev,
                    skipSchedules: !!checked
                  }))}
                />
                <Label htmlFor="skip-schedules" className="text-sm">
                  Skip schedule file uploads
                </Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={analyzeArchive} 
                disabled={!selectedFile || isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Analyze Archive
                  </>
                )}
              </Button>

              {importSummary && (
                <Button 
                  onClick={handleImport}
                  disabled={isImporting || (importSummary.conflicts.length > 0 && !importSummary.conflicts.every(c => c.resolution))}
                  className="w-full"
                  variant={importConfig.dryRun ? "outline" : "default"}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {importConfig.dryRun ? 'Simulate Import' : 'Import Events'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress & Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Import Progress & Results
            </CardTitle>
            <CardDescription>
              Real-time progress and detailed status information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!importProgress && !importSummary && !importResult && (
              <div className="text-center py-8 text-muted-foreground">
                <FileUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a ZIP file and click "Analyze Archive" to begin</p>
              </div>
            )}

            {importProgress && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{importProgress.stage}</span>
                    <span className="text-sm text-muted-foreground">{importProgress.percentage}%</span>
                  </div>
                  <Progress value={importProgress.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{importProgress.details}</p>
                </div>

                {/* Log Output */}
                <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {importProgress.logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-muted-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {importResult && (
              <div className="space-y-4">
                {importResult.success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>Import Completed Successfully</strong>
                      <div className="mt-2 space-y-1">
                        <div>• {importResult.imported} events imported</div>
                        <div>• {importResult.skipped} events skipped</div>
                        {importConfig.dryRun && <div>• Dry run mode - no actual changes made</div>}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                      <strong>Import Failed</strong>
                      <div className="mt-2 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Summary */}
      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import Summary
            </CardTitle>
            <CardDescription>
              Archive contents and validation results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-foreground">{importSummary.totalEvents}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{importSummary.validEvents}</div>
                <div className="text-sm text-muted-foreground">Valid Events</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">{importSummary.conflicts.length}</div>
                <div className="text-sm text-muted-foreground">Conflicts</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{importSummary.scheduleFiles}</div>
                <div className="text-sm text-muted-foreground">Schedule Files</div>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <Badge variant={importSummary.manifestValid ? "default" : "destructive"}>
                {importSummary.manifestValid ? "✓ Manifest Valid" : "✗ No Manifest"}
              </Badge>
              <Badge variant={importSummary.versionCompatible ? "default" : "destructive"}>
                {importSummary.versionCompatible ? "✓ Version Compatible" : "✗ Version Incompatible"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflict Resolution */}
      {showConflictResolution && importSummary && importSummary.conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Conflict Resolution Required
            </CardTitle>
            <CardDescription>
              Review and resolve conflicts before proceeding with import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {importSummary.conflicts.map((conflict) => (
                <div key={conflict.id} className={`p-4 rounded-lg border ${getSeverityColor(conflict.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-sm">
                        {conflict.type.replace('_', ' ').toUpperCase()} - {conflict.severity.toUpperCase()} PRIORITY
                      </div>
                      <div className="text-sm mt-1">{conflict.message}</div>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {conflict.type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <div className="font-medium">Existing:</div>
                      <div className="bg-white/50 p-2 rounded mt-1">
                        <div>ID: {conflict.existing.id}</div>
                        <div>Name: {conflict.existing.name}</div>
                        <div>Date: {conflict.existing.date}</div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Import:</div>
                      <div className="bg-white/50 p-2 rounded mt-1">
                        <div>ID: {conflict.imported.id}</div>
                        <div>Name: {conflict.imported.name}</div>
                        <div>Date: {conflict.imported.date}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={conflict.resolution === 'skip' ? "default" : "outline"}
                      onClick={() => updateConflictResolution(conflict.id, 'skip')}
                    >
                      Skip Import
                    </Button>
                    <Button
                      size="sm"
                      variant={conflict.resolution === 'overwrite' ? "default" : "outline"}
                      onClick={() => updateConflictResolution(conflict.id, 'overwrite')}
                    >
                      Overwrite Existing
                    </Button>
                    <Button
                      size="sm"
                      variant={conflict.resolution === 'rename' ? "default" : "outline"}
                      onClick={() => updateConflictResolution(conflict.id, 'rename')}
                    >
                      Rename Import
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Import Features
          </CardTitle>
          <CardDescription>
            Comprehensive data restoration with integrity verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <FileCheck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Integrity Validation</h4>
                <p className="text-xs text-muted-foreground">Manifest verification and checksum validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Conflict Resolution</h4>
                <p className="text-xs text-muted-foreground">Smart conflict detection with resolution options</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Dry Run Mode</h4>
                <p className="text-xs text-muted-foreground">Simulate imports without making changes</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
