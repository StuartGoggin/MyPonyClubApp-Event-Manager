'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Package, Download, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function DataExportTile() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setCurrentStep('Initializing export...');
      setExportStatus('idle');
      setErrorMessage('');
      
      // Default export config - export all data
      const exportConfig = {
        eventTypes: [], // Empty means all event types
        dateRange: {
          start: '', // Empty means no start date filter
          end: ''    // Empty means no end date filter
        },
        includeSchedules: true,
        includeMetadata: true,
        includeManifest: true,
        compressionLevel: 'medium'
      };

      console.log('🚀 Starting data export...');

      // Simulate progress steps
      setProgress(10);
      setCurrentStep('Preparing export configuration...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(20);
      setCurrentStep('Connecting to database...');
      await new Promise(resolve => setTimeout(resolve, 200));

      setProgress(30);
      setCurrentStep('Fetching setup data (clubs, zones, event types)...');
      await new Promise(resolve => setTimeout(resolve, 400));

      // Call the export API
      setProgress(40);
      setCurrentStep('Calling export API...');
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

      setProgress(60);
      setCurrentStep('Fetching event data...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress(75);
      setCurrentStep('Generating ZIP file...');
      await new Promise(resolve => setTimeout(resolve, 400));

      setProgress(85);
      setCurrentStep('Preparing download...');

      // Get export info from headers
      const exportInfo = response.headers.get('X-Export-Info');
      const parsedInfo = exportInfo ? JSON.parse(exportInfo) : {};

      // Create download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      setProgress(95);
      setCurrentStep('Starting download...');
      
      console.log('✅ Export completed successfully!');

      // Auto-trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = parsedInfo.filename || `ponyclub-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setProgress(100);
      setCurrentStep('Export completed successfully!');
      setExportStatus('success');

      // Clean up the blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

    } catch (error) {
      console.error('❌ Export failed:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setCurrentStep('Export failed');
    } finally {
      // Reset after a delay to show completion status
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        setCurrentStep('');
        setExportStatus('idle');
        setErrorMessage('');
      }, 3000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-violet-50/40 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-violet-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-violet-400/5"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
            <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Data Export</h3>
            <p className="text-sm text-muted-foreground">Export system data for backup</p>
          </div>
        </div>
        <div className="space-y-3">
          <Badge variant="outline" className="text-xs">
            JSON + ZIP format
          </Badge>
          
          {/* Progress section */}
          {isExporting && (
            <div className="space-y-3 p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-200/30">
              <div className="flex items-center gap-2">
                {exportStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : exportStatus === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <Clock className="h-4 w-4 text-purple-600 animate-pulse" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {currentStep || 'Processing...'}
                </span>
              </div>
              
              <Progress 
                value={progress} 
                className="h-2"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}% complete</span>
                {exportStatus === 'error' && errorMessage && (
                  <span className="text-red-600">{errorMessage}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Success message */}
          {exportStatus === 'success' && !isExporting && (
            <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/30">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Export completed successfully!</span>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {exportStatus === 'error' && !isExporting && (
            <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200/30">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Export failed: {errorMessage}</span>
              </div>
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Package className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}