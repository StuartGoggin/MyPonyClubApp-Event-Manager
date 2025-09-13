'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface ImportChangesSummary {
  totalRows: number;
  newUsers: number;
  usersWithChanges: number;
  fieldChanges: {
    email: number;
    mobileNumber: number;
    firstName: number;
    lastName: number;
    clubId: number;
    other: number;
  };
  detailedChanges: Array<{
    ponyClubId: string;
    changes: Record<string, { old: string; new: string }>;
  }>;
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
  changesSummary?: ImportChangesSummary;
  importErrors: Array<{
    row: number;
    error: string;
  }>;
}

export default function EnhancedUserImport() {
  const [file, setFile] = useState<File | null>(null);
  const [isReImport, setIsReImport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setPreviewData(null);
    }
  };

  const handlePreviewImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/users/import/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error previewing import:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.validRows) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          validRows: previewData.validRows,
          fileName: file?.name,
          isReImport: isReImport,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error importing users:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChangesSummary = (summary: ImportChangesSummary) => {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Import Changes Summary</CardTitle>
          <CardDescription>
            Preview of changes that will be made during re-import
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm font-medium">Total Rows</div>
              <div className="text-2xl font-bold">{summary.totalRows}</div>
            </div>
            <div>
              <div className="text-sm font-medium">New Users</div>
              <div className="text-2xl font-bold text-green-600">{summary.newUsers}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Users with Changes</div>
              <div className="text-2xl font-bold text-orange-600">{summary.usersWithChanges}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Field Changes:</h4>
            <div className="flex flex-wrap gap-2">
              {summary.fieldChanges.email > 0 && (
                <Badge variant="outline">Email: {summary.fieldChanges.email}</Badge>
              )}
              {summary.fieldChanges.mobileNumber > 0 && (
                <Badge variant="outline">Mobile: {summary.fieldChanges.mobileNumber}</Badge>
              )}
              {summary.fieldChanges.firstName > 0 && (
                <Badge variant="outline">First Name: {summary.fieldChanges.firstName}</Badge>
              )}
              {summary.fieldChanges.lastName > 0 && (
                <Badge variant="outline">Last Name: {summary.fieldChanges.lastName}</Badge>
              )}
              {summary.fieldChanges.clubId > 0 && (
                <Badge variant="outline">Club: {summary.fieldChanges.clubId}</Badge>
              )}
            </div>
          </div>

          {summary.detailedChanges.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Detailed Changes (first 5):</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {summary.detailedChanges.slice(0, 5).map((change, index) => (
                  <div key={index} className="text-sm border rounded p-2">
                    <div className="font-medium">{change.ponyClubId}</div>
                    {Object.entries(change.changes).map(([field, fieldChange]) => (
                      <div key={field} className="text-xs text-gray-600">
                        {field}: "{fieldChange.old}" → "{fieldChange.new}"
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              {summary.detailedChanges.length > 5 && (
                <div className="text-xs text-gray-500 mt-2">
                  ... and {summary.detailedChanges.length - 5} more changes
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced User Import</CardTitle>
          <CardDescription>
            Import users with change detection and role preservation for re-imports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="file-input" className="block text-sm font-medium mb-2">
              Select spreadsheet file (.xlsx, .xls, .csv)
            </label>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="re-import"
              checked={isReImport}
              onCheckedChange={(checked) => setIsReImport(checked as boolean)}
            />
            <label htmlFor="re-import" className="text-sm font-medium">
              This is a re-import (preserve existing user roles)
            </label>
          </div>

          {isReImport && (
            <Alert>
              <AlertDescription>
                Re-import mode: Existing user roles will be preserved, and you'll see a summary of changes before import.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handlePreviewImport}
              disabled={!file || loading}
              variant="outline"
            >
              {loading ? 'Processing...' : 'Preview Import'}
            </Button>
            
            {previewData && (
              <Button
                onClick={handleConfirmImport}
                disabled={loading}
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && result.changesSummary && renderChangesSummary(result.changesSummary)}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
              Import {result.success ? 'Completed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{result.message}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Valid Rows</div>
                <div className="text-lg font-bold">{result.results.validRows}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Created Users</div>
                <div className="text-lg font-bold text-green-600">{result.results.createdUsers}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Updated Users</div>
                <div className="text-lg font-bold text-blue-600">{result.results.updatedUsers}</div>
              </div>
              {result.results.deactivatedUsers && result.results.deactivatedUsers > 0 && (
                <div>
                  <div className="text-sm font-medium">Deactivated Users</div>
                  <div className="text-lg font-bold text-orange-600">{result.results.deactivatedUsers}</div>
                </div>
              )}
              <div>
                <div className="text-sm font-medium">Import Errors</div>
                <div className="text-lg font-bold text-red-600">{result.results.importErrors}</div>
              </div>
            </div>

            {result.importErrors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Import Errors:</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.importErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 border rounded p-2">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}