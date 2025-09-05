'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Package, 
  Download, 
  FileText, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ArrowLeft,
  Filter,
  Shield,
  Clock,
  Database
} from 'lucide-react';
import Link from 'next/link';

interface ExportProgress {
  stage: string;
  percentage: number;
  details: string;
  logs: string[];
}

interface ExportConfig {
  eventTypes: string[];
  dateRange: {
    start: string;
    end: string;
  };
  includeSchedules: boolean;
  includeMetadata: boolean;
  includeManifest: boolean;
  compressionLevel: string;
}

export default function ExportEventsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    eventTypes: [],
    dateRange: {
      start: '',
      end: ''
    },
    includeSchedules: true,
    includeMetadata: true,
    includeManifest: true,
    compressionLevel: 'medium'
  });
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    filename?: string;
    fileSize?: string;
    eventCount?: number;
    error?: string;
    downloadUrl?: string;
  } | null>(null);

  // Mock data for demonstration
  const availableEventTypes = [
    { id: 'rally', name: 'Rally' },
    { id: 'ode', name: 'One Day Event' },
    { id: 'showjumping', name: 'Show Jumping' },
    { id: 'dressage', name: 'Dressage' },
    { id: 'cross-country', name: 'Cross Country' }
  ];

  // Cleanup download URL on unmount
  useEffect(() => {
    return () => {
      if (exportResult?.downloadUrl) {
        window.URL.revokeObjectURL(exportResult.downloadUrl);
      }
    };
  }, [exportResult?.downloadUrl]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);
    
    // Clean up any previous download URL
    if (exportResult?.downloadUrl) {
      window.URL.revokeObjectURL(exportResult.downloadUrl);
    }
    
    try {
      // Update progress during export
      setExportProgress({
        stage: 'Initializing Export',
        percentage: 5,
        details: 'Preparing export configuration...',
        logs: [`[${new Date().toLocaleTimeString()}] Starting export process...`]
      });

      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UI

      setExportProgress(prev => ({
        stage: 'Fetching Data',
        percentage: 15,
        details: 'Retrieving events, clubs, and zones from database...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Fetching database records...`]
      }));

      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress(prev => ({
        stage: 'Downloading Schedules',
        percentage: 40,
        details: 'Downloading schedule files from Firebase Storage...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Processing schedule files...`]
      }));

      // Call the export API
      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Export failed');
      }

      // Update progress
      setExportProgress(prev => ({
        stage: 'Creating Archive',
        percentage: 75,
        details: 'Compressing files into ZIP archive...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Creating compressed archive...`]
      }));

      await new Promise(resolve => setTimeout(resolve, 300));

      setExportProgress(prev => ({
        stage: 'Finalizing',
        percentage: 90,
        details: 'Preparing download...',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Export completed, preparing download...`]
      }));

      // Get export info from headers
      const exportInfo = response.headers.get('X-Export-Info');
      const parsedInfo = exportInfo ? JSON.parse(exportInfo) : {};

      // Create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Update progress to complete
      setExportProgress(prev => ({
        stage: 'Complete',
        percentage: 100,
        details: 'Export completed successfully!',
        logs: [...prev?.logs || [], `[${new Date().toLocaleTimeString()}] Download ready`]
      }));

      // Set success result with download URL
      setExportResult({
        success: true,
        filename: parsedInfo.filename,
        fileSize: parsedInfo.fileSize,
        eventCount: parsedInfo.eventCount,
        downloadUrl: downloadUrl
      });

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = parsedInfo.filename || 'events-export.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (exportResult?.downloadUrl && exportResult?.filename) {
      const link = document.createElement('a');
      link.href = exportResult.downloadUrl;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            <Package className="h-8 w-8 text-purple-600" />
            Event Export Tool
          </h1>
          <p className="text-muted-foreground mt-1">
            Export all events and associated data into a comprehensive ZIP archive
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Export Configuration
            </CardTitle>
            <CardDescription>
              Configure what data to include in your export archive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event Type Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Event Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableEventTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={exportConfig.eventTypes.includes(type.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setExportConfig(prev => ({
                            ...prev,
                            eventTypes: [...prev.eventTypes, type.id]
                          }));
                        } else {
                          setExportConfig(prev => ({
                            ...prev,
                            eventTypes: prev.eventTypes.filter(t => t !== type.id)
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={type.id} className="text-sm">{type.name}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to export all event types
              </p>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={exportConfig.dateRange.start}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={exportConfig.dateRange.end}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-schedules"
                  checked={exportConfig.includeSchedules}
                  onCheckedChange={(checked) => setExportConfig(prev => ({
                    ...prev,
                    includeSchedules: !!checked
                  }))}
                />
                <Label htmlFor="include-schedules" className="text-sm">
                  Include uploaded schedules
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={exportConfig.includeMetadata}
                  onCheckedChange={(checked) => setExportConfig(prev => ({
                    ...prev,
                    includeMetadata: !!checked
                  }))}
                />
                <Label htmlFor="include-metadata" className="text-sm">
                  Include metadata and dependencies
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-manifest"
                  checked={exportConfig.includeManifest}
                  onCheckedChange={(checked) => setExportConfig(prev => ({
                    ...prev,
                    includeManifest: !!checked
                  }))}
                />
                <Label htmlFor="include-manifest" className="text-sm">
                  Generate integrity manifest
                </Label>
              </div>
            </div>

            {/* Compression Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Compression Level</Label>
              <Select
                value={exportConfig.compressionLevel}
                onValueChange={(value) => setExportConfig(prev => ({
                  ...prev,
                  compressionLevel: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (Faster)</SelectItem>
                  <SelectItem value="medium">Medium (Balanced)</SelectItem>
                  <SelectItem value="high">High (Smaller file)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Export Button */}
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
              size="lg"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Start Export
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Export Progress
            </CardTitle>
            <CardDescription>
              Real-time progress and detailed logging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!exportProgress && !exportResult && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure your export settings and click "Start Export" to begin</p>
              </div>
            )}

            {exportProgress && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{exportProgress.stage}</span>
                    <span className="text-sm text-muted-foreground">{exportProgress.percentage}%</span>
                  </div>
                  <Progress value={exportProgress.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{exportProgress.details}</p>
                </div>

                {/* Log Output */}
                <div className="bg-muted/30 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-1">
                    {exportProgress.logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-muted-foreground">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {exportResult && (
              <div className="space-y-4">
                {exportResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">Export Completed Successfully</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Filename:</span>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded">{exportResult.filename}</code>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">File Size:</span>
                        <Badge variant="outline">{exportResult.fileSize}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-700">Events Exported:</span>
                        <Badge variant="outline">{exportResult.eventCount} events</Badge>
                      </div>
                    </div>
                    <Button onClick={handleDownload} className="w-full mt-4" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Archive
                    </Button>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-800">Export Failed</h3>
                    </div>
                    <p className="text-sm text-red-700">{exportResult.error}</p>
                    <Button 
                      onClick={() => setExportResult(null)} 
                      className="w-full mt-4" 
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Export Features
          </CardTitle>
          <CardDescription>
            Comprehensive data export with integrity verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Complete Data Export</h4>
                <p className="text-xs text-muted-foreground">All event definitions, schedules, and metadata</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Integrity Verification</h4>
                <p className="text-xs text-muted-foreground">Checksum manifest for data validation</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Version Metadata</h4>
                <p className="text-xs text-muted-foreground">Compatibility tracking and timestamps</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
