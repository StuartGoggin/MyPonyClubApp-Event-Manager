'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, X, FileText, Users, AlertCircle } from 'lucide-react';
import { ImportPreviewResult } from '@/app/api/admin/users/import/preview/route';

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: ImportPreviewResult | null;
  onConfirmImport: (validRows: any[], fileName: string) => void;
  isImporting: boolean;
  validRows: any[];
}

export function ImportPreviewDialog({ 
  isOpen, 
  onClose, 
  previewData, 
  onConfirmImport, 
  isImporting,
  validRows 
}: ImportPreviewDialogProps) {
  if (!previewData) return null;

  const successRate = previewData.totalRows > 0 
    ? Math.round((previewData.validRows / previewData.totalRows) * 100)
    : 0;

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Preview: {previewData.fileName}
          </DialogTitle>
          <DialogDescription>
            Review the data that will be imported and confirm to proceed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                File Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{previewData.totalRows}</div>
                  <div className="text-sm text-muted-foreground">Total Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{previewData.validRows}</div>
                  <div className="text-sm text-muted-foreground">Valid Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{previewData.errorRows}</div>
                  <div className="text-sm text-muted-foreground">Error Rows</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                File: {previewData.fileName} ({formatFileSize(previewData.fileSize)})
              </div>
            </CardContent>
          </Card>

          {/* Import Rules Information */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Import Filtering Rules:</div>
              <div className="mt-1 text-sm space-y-1">
                <div>• Users with blank membership will be excluded</div>
                <div>• Users with "Historical Membership" will be excluded</div>
                <div>• Mobile numbers are optional for import</div>
                <div>• Only users with valid membership types will be imported</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Clubs Found ({previewData.summary.clubsFound.length})</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.summary.clubsFound.slice(0, 10).map(club => (
                        <Badge key={club} variant="outline" className="text-xs">{club}</Badge>
                      ))}
                      {previewData.summary.clubsFound.length > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{previewData.summary.clubsFound.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Zones Found ({previewData.summary.zonesFound.length})</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.summary.zonesFound.slice(0, 10).map(zone => (
                        <Badge key={zone} variant="outline" className="text-xs">{zone}</Badge>
                      ))}
                      {previewData.summary.zonesFound.length > 10 && (
                        <Badge variant="secondary" className="text-xs">
                          +{previewData.summary.zonesFound.length - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">Roles Found</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {previewData.summary.rolesFound.map(role => (
                        <Badge key={role} variant="default" className="text-xs">{role}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Missing Mobile Numbers:</span>
                      <span className="font-medium">{previewData.summary.missingMobileNumbers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Missing Club Names:</span>
                      <span className="font-medium">{previewData.summary.missingClubNames}</span>
                    </div>
                    {previewData.summary.duplicatePonyClubIds.length > 0 && (
                      <div className="flex justify-between text-sm text-orange-600">
                        <span>Duplicate IDs:</span>
                        <span className="font-medium">{previewData.summary.duplicatePonyClubIds.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Data Preview */}
          {previewData.sampleData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Data (First 10 rows)</CardTitle>
                <CardDescription>
                  Preview of the data that will be imported
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pony Club ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.sampleData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.ponyClubId}</TableCell>
                          <TableCell>
                            {row.firstName || row.lastName 
                              ? `${row.firstName || ''} ${row.lastName || ''}`.trim()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>{row.mobileNumber || '-'}</TableCell>
                          <TableCell>{row.originalClubName || '-'}</TableCell>
                          <TableCell>{row.originalZoneName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.role}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors and Filtered Rows */}
          {previewData.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Skipped Rows ({previewData.errors.length})
                </CardTitle>
                <CardDescription>
                  These rows were skipped during import due to validation issues or membership filtering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {previewData.errors.slice(0, 20).map((error, index) => {
                    const isFilteredRow = error.error.includes('blank membership') || error.error.includes('Historical Membership');
                    return (
                      <Alert key={index} variant={isFilteredRow ? "default" : "destructive"}>
                        {isFilteredRow ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                          Row {error.row}: {error.error}
                        </AlertDescription>
                      </Alert>
                    );
                  })}
                  {previewData.errors.length > 20 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      ... and {previewData.errors.length - 20} more rows skipped
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning for duplicates */}
          {previewData.summary.duplicatePonyClubIds.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Duplicate Pony Club IDs found:</div>
                <div className="mt-1 text-sm">
                  {previewData.summary.duplicatePonyClubIds.slice(0, 5).join(', ')}
                  {previewData.summary.duplicatePonyClubIds.length > 5 && 
                    ` and ${previewData.summary.duplicatePonyClubIds.length - 5} more`
                  }
                </div>
                <div className="mt-1 text-sm">
                  Only the first occurrence of each ID will be imported.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirmImport(validRows, previewData.fileName)}
            disabled={isImporting || previewData.validRows === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {isImporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Import ({previewData.validRows} users)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
