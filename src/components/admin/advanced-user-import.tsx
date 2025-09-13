'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ImportPreviewDialog } from './import-preview-dialog';

interface ImportProgress {
  phase: 'idle' | 'uploading' | 'parsing' | 'validating' | 'processing' | 'completed' | 'error';
  totalRows: number;
  processedRows: number;
  currentAction: string;
  percentage: number;
}

interface ImportStats {
  validRows: number;
  createdUsers: number;
  updatedUsers: number;
  deactivatedUsers: number;
  skippedRows: number;
  errorRows: number;
}

interface ImportError {
  row: number;
  error: string;
  data?: any;
}

interface AdvancedUserImportProps {
  onImportComplete?: () => void;
}

export default function AdvancedUserImport({ onImportComplete }: AdvancedUserImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isReImport, setIsReImport] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [progress, setProgress] = useState<ImportProgress>({
    phase: 'idle',
    totalRows: 0,
    processedRows: 0,
    currentAction: '',
    percentage: 0
  });
  const [stats, setStats] = useState<ImportStats>({
    validRows: 0,
    createdUsers: 0,
    updatedUsers: 0,
    deactivatedUsers: 0,
    skippedRows: 0,
    errorRows: 0
  });
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateProgress = useCallback((updates: Partial<ImportProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      resetState();
    }
  };

  const resetState = () => {
    setProgress({
      phase: 'idle',
      totalRows: 0,
      processedRows: 0,
      currentAction: '',
      percentage: 0
    });
    setStats({
      validRows: 0,
      createdUsers: 0,
      updatedUsers: 0,
      deactivatedUsers: 0,
      skippedRows: 0,
      errorRows: 0
    });
    setErrors([]);
    setShowErrors(false);
    setShowPreview(false);
    setPreviewData(null);
  };

  const simulateProgress = async (phase: ImportProgress['phase'], duration: number) => {
    const steps = 20;
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      const percentage = (i / steps) * 100;
      updateProgress({ phase, percentage });
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  };

  const processImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    resetState();

    try {
      // Show preview dialog instead of direct import
      updateProgress({ 
        phase: 'parsing', 
        currentAction: 'Preparing file preview...',
        percentage: 0 
      });

      const formData = new FormData();
      formData.append('file', file);

      const previewResponse = await fetch('/api/admin/users/import/preview', {
        method: 'POST',
        body: formData,
      });

      const previewData = await previewResponse.json();
      
      if (!previewData.success) {
        throw new Error(previewData.error || 'Failed to parse file');
      }

      updateProgress({ 
        phase: 'completed', 
        currentAction: 'File loaded - ready for preview',
        percentage: 100 
      });

      setPreviewData(previewData);
      setShowPreview(true);
      setIsProcessing(false);

    } catch (error) {
      updateProgress({ 
        phase: 'error', 
        currentAction: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        percentage: 0 
      });
      setIsProcessing(false);
    }
  };

  const executeImportWithProgress = async (validRows: any[], fileName: string) => {
    setShowPreview(false);
    setIsProcessing(true);
    resetState();

    try {
      // Phase 1: Upload
      updateProgress({ 
        phase: 'uploading', 
        currentAction: 'Starting import process...',
        percentage: 0 
      });
      await simulateProgress('uploading', 500);

      // Phase 2: Validation
      updateProgress({ 
        phase: 'validating', 
        currentAction: 'Validating user data...',
        percentage: 0,
        totalRows: validRows.length
      });
      await simulateProgress('validating', 600);

      // Phase 3: Processing with detailed mapping progress
      updateProgress({ 
        phase: 'processing', 
        currentAction: 'Starting user data mapping and import...',
        percentage: 0 
      });

      // Simulate detailed mapping progress (since actual mapping happens server-side)
      const importTotalRows = validRows.length;
      const mappingSteps = Math.min(importTotalRows, 50); // Show up to 50 progress steps
      
      for (let i = 0; i <= mappingSteps; i++) {
        const processedRows = Math.floor((i / mappingSteps) * importTotalRows);
        const percentage = (i / mappingSteps) * 90; // Reserve 10% for final processing
        
        let currentAction = '';
        if (i < mappingSteps * 0.3) {
          currentAction = `Mapping club and zone data for user ${processedRows + 1} of ${importTotalRows}...`;
        } else if (i < mappingSteps * 0.7) {
          currentAction = `Processing user records ${processedRows + 1} of ${importTotalRows}...`;
        } else {
          currentAction = `Finalizing import for user ${processedRows + 1} of ${importTotalRows}...`;
        }
        
        updateProgress({ 
          phase: 'processing', 
          processedRows,
          currentAction,
          percentage 
        });
        
        // Longer delays for mapping phase to reflect actual processing time
        const delay = i < mappingSteps * 0.5 ? 200 : 100; // Slower progress for mapping phase
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Execute actual import
      const importResponse = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validRows: validRows,
          fileName: fileName,
          isReImport: isReImport
        })
      });

      const importResult = await importResponse.json();

      if (importResult.success) {
        // Phase 4: Completed
        updateProgress({ 
          phase: 'completed', 
          currentAction: 'Import completed successfully!',
          percentage: 100 
        });

        setStats({
          validRows: importResult.results.validRows || 0,
          createdUsers: importResult.results.createdUsers || 0,
          updatedUsers: importResult.results.updatedUsers || 0,
          deactivatedUsers: importResult.results.deactivatedUsers || 0,
          skippedRows: 0,
          errorRows: importResult.results.importErrors || 0
        });

        setErrors(importResult.importErrors || []);

        // Call completion callback
        if (onImportComplete) {
          onImportComplete();
        }
      } else {
        throw new Error(importResult.error || 'Import failed');
      }

    } catch (error) {
      updateProgress({ 
        phase: 'error', 
        currentAction: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        percentage: 0 
      });
      setIsProcessing(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
    setIsProcessing(false);
    resetState();
  };

  const getPhaseIcon = (phase: ImportProgress['phase']) => {
    switch (phase) {
      case 'uploading':
        return <Upload className="h-5 w-5 text-blue-500" />;
      case 'parsing':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'validating':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <TrendingUp className="h-5 w-5 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPhaseColor = (phase: ImportProgress['phase']) => {
    switch (phase) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'processing':
        return 'text-orange-600'; // Different color for processing to indicate it's the longest phase
      case 'uploading':
      case 'parsing':
      case 'validating':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Advanced User Import
          </CardTitle>
          <CardDescription>
            Import users with real-time progress tracking and detailed status reporting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium mb-2">
              Select User Data File (.xlsx, .xls, .csv)
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="re-import"
              checked={isReImport}
              onCheckedChange={(checked) => setIsReImport(checked as boolean)}
              disabled={isProcessing}
            />
            <label htmlFor="re-import" className="text-sm font-medium">
              This is a re-import (preserve existing roles and show change detection)
            </label>
          </div>

          <Button
            onClick={processImport}
            disabled={!file || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Preparing Preview...' : 'Preview Import'}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {progress.phase !== 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPhaseIcon(progress.phase)}
              <span className={getPhaseColor(progress.phase)}>
                Import Progress
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{progress.currentAction}</span>
                <span className="text-sm text-gray-500">{Math.round(progress.percentage)}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>

            {progress.totalRows > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processed: {progress.processedRows} / {progress.totalRows} rows</span>
                <span>Phase: {progress.phase}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {progress.phase === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Import Completed Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-green-600">{stats.createdUsers}</div>
                <div className="text-sm text-green-700">Created</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <UserCheck className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-2xl font-bold text-blue-600">{stats.updatedUsers}</div>
                <div className="text-sm text-blue-700">Updated</div>
              </div>
              {stats.deactivatedUsers > 0 && (
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <UserX className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-orange-600">{stats.deactivatedUsers}</div>
                  <div className="text-sm text-orange-700">Deactivated</div>
                </div>
              )}
              {stats.errorRows > 0 && (
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-red-600">{stats.errorRows}</div>
                  <div className="text-sm text-red-700">Errors</div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="text-sm text-gray-600 space-y-1">
              <div>Total rows processed: <span className="font-medium">{stats.validRows}</span></div>
              <div>Success rate: <span className="font-medium text-green-600">
                {stats.validRows > 0 ? Math.round(((stats.createdUsers + stats.updatedUsers + stats.deactivatedUsers) / stats.validRows) * 100) : 0}%
              </span></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Import Errors ({errors.length})
            </CardTitle>
            <CardDescription>
              Issues encountered during import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowErrors(!showErrors)}
              className="mb-3"
            >
              {showErrors ? 'Hide' : 'Show'} Error Details
            </Button>

            {showErrors && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Row {error.row}:</span> {error.error}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {progress.phase === 'error' && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {progress.currentAction}
          </AlertDescription>
        </Alert>
      )}

      {/* Import Preview Dialog */}
      {showPreview && previewData && (
        <ImportPreviewDialog
          previewData={previewData}
          isOpen={showPreview}
          onClose={handleClosePreview}
          onConfirmImport={executeImportWithProgress}
          isImporting={isProcessing}
          validRows={previewData.validRowsData || []}
        />
      )}
    </div>
  );
}