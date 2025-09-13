'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  UserPlus, 
  UserX, 
  UserCheck,
  FileText,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface ImportProgress {
  phase: 'uploading' | 'parsing' | 'validating' | 'processing' | 'completed' | 'error';
  current: number;
  total: number;
  message: string;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  message: string;
  results: {
    validRows: number;
    createdUsers: number;
    updatedUsers: number;
    deactivatedUsers?: number;
    importErrors: number;
  };
  importErrors: Array<{
    row: number;
    error: string;
  }>;
}

interface ImportStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  skipped: number;
  deactivated: number;
}

export default function ImprovedUserImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({
    phase: 'uploading',
    current: 0,
    total: 0,
    message: '',
    errors: []
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<ImportStats>({
    totalProcessed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    deactivated: 0
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setProgress({
        phase: 'uploading',
        current: 0,
        total: 0,
        message: '',
        errors: []
      });
    }
  }, []);

  const simulateProgress = useCallback((phase: ImportProgress['phase'], total: number, message: string) => {
    return new Promise<void>((resolve) => {
      let current = 0;
      const interval = setInterval(() => {
        current += Math.random() * 15 + 5; // Random progress increments
        if (current >= total) {
          current = total;
          clearInterval(interval);
          setProgress(prev => ({ ...prev, phase, current: total, total, message }));
          setTimeout(resolve, 200);
        } else {
          setProgress(prev => ({ ...prev, phase, current, total, message }));
        }
      }, 100);
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);
    
    try {
      // Phase 1: Upload and parse
      await simulateProgress('parsing', 100, `Parsing ${file.name}...`);
      
      const formData = new FormData();
      formData.append('file', file);

      // Phase 2: Validation
      await simulateProgress('validating', 100, 'Validating user data...');

      // Phase 3: Processing
      setProgress(prev => ({
        ...prev,
        phase: 'processing',
        current: 0,
        total: 100,
        message: 'Processing user accounts...'
      }));

      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Complete progress
      await simulateProgress('completed', 100, 'Import completed successfully!');

      setResult(data);
      
      // Calculate stats
      if (data.results) {
        const newStats: ImportStats = {
          totalProcessed: data.results.validRows || 0,
          successful: (data.results.createdUsers || 0) + (data.results.updatedUsers || 0),
          failed: data.results.importErrors || 0,
          skipped: 0,
          deactivated: data.results.deactivatedUsers || 0
        };
        setStats(newStats);
      }

    } catch (error) {
      console.error('Import failed:', error);
      setProgress(prev => ({
        ...prev,
        phase: 'error',
        message: 'Import failed. Please try again.',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }));
    } finally {
      setImporting(false);
    }
  }, [file, simulateProgress]);

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  };

  const getPhaseIcon = (phase: ImportProgress['phase']) => {
    switch (phase) {
      case 'uploading':
      case 'parsing':
        return <Upload className="h-5 w-5" />;
      case 'validating':
        return <FileText className="h-5 w-5" />;
      case 'processing':
        return <Users className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getPhaseColor = (phase: ImportProgress['phase']) => {
    switch (phase) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            User Import
          </CardTitle>
          <CardDescription>
            Import users from a spreadsheet (.xlsx, .xls, .csv). Supports both user data updates and historical membership processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium mb-2">
              Select spreadsheet file
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </div>

          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Ready to import: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(1)} KB)
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Start Import
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Progress Section */}
      {importing && (
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
              <div className="flex justify-between text-sm">
                <span>{progress.message}</span>
                <span className="font-medium">{getProgressPercentage()}%</span>
              </div>
              <Progress 
                value={getProgressPercentage()} 
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className={`p-3 rounded-lg ${progress.phase === 'parsing' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                <div className="text-xs font-medium">PARSING</div>
                <div className="text-lg font-bold">
                  {progress.phase === 'parsing' ? '⏳' : progress.phase === 'validating' || progress.phase === 'processing' || progress.phase === 'completed' ? '✅' : '⏸️'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${progress.phase === 'validating' ? 'bg-blue-100 text-blue-800' : progress.phase === 'processing' || progress.phase === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                <div className="text-xs font-medium">VALIDATING</div>
                <div className="text-lg font-bold">
                  {progress.phase === 'validating' ? '⏳' : progress.phase === 'processing' || progress.phase === 'completed' ? '✅' : '⏸️'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${progress.phase === 'processing' ? 'bg-blue-100 text-blue-800' : progress.phase === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                <div className="text-xs font-medium">PROCESSING</div>
                <div className="text-lg font-bold">
                  {progress.phase === 'processing' ? '⏳' : progress.phase === 'completed' ? '✅' : '⏸️'}
                </div>
              </div>
              <div className={`p-3 rounded-lg ${progress.phase === 'completed' ? 'bg-green-100 text-green-800' : progress.phase === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
                <div className="text-xs font-medium">COMPLETE</div>
                <div className="text-lg font-bold">
                  {progress.phase === 'completed' ? '✅' : progress.phase === 'error' ? '❌' : '⏸️'}
                </div>
              </div>
            </div>

            {progress.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {progress.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              Import {result.success ? 'Completed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Message */}
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className="text-lg font-medium">
                {result.message}
              </AlertDescription>
            </Alert>

            {/* Detailed Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-800">{result.results.validRows}</div>
                  <div className="text-sm text-blue-600">Total Rows</div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <UserPlus className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-800">{result.results.createdUsers}</div>
                  <div className="text-sm text-green-600">New Users</div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <UserCheck className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-800">{result.results.updatedUsers}</div>
                  <div className="text-sm text-yellow-600">Updated Users</div>
                </CardContent>
              </Card>

              {result.results.deactivatedUsers && result.results.deactivatedUsers > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <UserX className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-2xl font-bold text-orange-800">{result.results.deactivatedUsers}</div>
                    <div className="text-sm text-orange-600">Deactivated</div>
                  </CardContent>
                </Card>
              )}

              {result.results.importErrors > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-800">{result.results.importErrors}</div>
                    <div className="text-sm text-red-600">Errors</div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Success Rate */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-lg font-bold">
                  {result.results.validRows > 0 
                    ? Math.round(((result.results.createdUsers + result.results.updatedUsers + (result.results.deactivatedUsers || 0)) / result.results.validRows) * 100)
                    : 0}%
                </span>
              </div>
              <Progress 
                value={result.results.validRows > 0 
                  ? ((result.results.createdUsers + result.results.updatedUsers + (result.results.deactivatedUsers || 0)) / result.results.validRows) * 100
                  : 0} 
                className="w-full"
              />
            </div>

            {/* Error Details */}
            {result.importErrors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Import Errors ({result.importErrors.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-red-50 p-4 rounded-lg border border-red-200">
                  {result.importErrors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="text-red-600 border-red-300 shrink-0">
                        Row {error.row}
                      </Badge>
                      <span className="text-red-700">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setProgress({
                    phase: 'uploading',
                    current: 0,
                    total: 0,
                    message: '',
                    errors: []
                  });
                }}
              >
                Import Another File
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}