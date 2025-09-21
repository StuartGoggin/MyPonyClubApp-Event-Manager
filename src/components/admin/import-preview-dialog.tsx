'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, X, FileText, Users, AlertCircle } from 'lucide-react';
import { ImportPreviewResult } from '@/types/import';

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
              <div className="font-medium">Import Processing Rules:</div>
              <div className="mt-1 text-sm space-y-1">
                <div>• Users with blank membership will be excluded</div>
                <div>• Users with historical/inactive memberships will be deactivated (isActive: false)</div>
                <div>• Mobile numbers are optional for import</div>
                <div>• Only users with valid membership types will be imported</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Enhanced Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Data Summary
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of the data found in your import file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Organization Data */}
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-semibold text-blue-700 flex items-center gap-1">
                      🏇 Clubs Found ({previewData.summary.clubsFound.length})
                    </h4>
                    <div className="mt-2 space-y-1">
                      {previewData.summary.clubsFound.slice(0, 8).map(club => (
                        <div key={club} className="text-sm bg-blue-50 px-2 py-1 rounded text-blue-800">
                          {club}
                        </div>
                      ))}
                      {previewData.summary.clubsFound.length > 8 && (
                        <div className="text-xs text-blue-600 font-medium pt-1">
                          +{previewData.summary.clubsFound.length - 8} more clubs
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-3">
                    <h4 className="font-semibold text-green-700 flex items-center gap-1">
                      📍 Zones Found ({previewData.summary.zonesFound.length})
                    </h4>
                    <div className="mt-2 space-y-1">
                      {previewData.summary.zonesFound.map(zone => (
                        <div key={zone} className="text-sm bg-green-50 px-2 py-1 rounded text-green-800">
                          {zone}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* User Data Quality */}
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 pl-3">
                    <h4 className="font-semibold text-purple-700 flex items-center gap-1">
                      👤 User Roles & Membership
                    </h4>
                    <div className="mt-2 space-y-2">
                      {previewData.summary.rolesFound.map(role => (
                        <div key={role} className="flex items-center justify-between">
                          <Badge variant="default" className="text-xs capitalize">
                            {role.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {/* You could add role counts here if available */}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-l-4 border-amber-500 pl-3">
                    <h4 className="font-semibold text-amber-700 flex items-center gap-1">
                      📞 Contact Information
                    </h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Users with Email:</span>
                        <Badge variant="outline" className="text-green-700 bg-green-50">
                          {previewData.summary.usersWithEmail || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Users with Mobile:</span>
                        <Badge variant="outline" className="text-blue-700 bg-blue-50">
                          {(previewData.validRows || 0) - (previewData.summary.missingMobileNumbers || 0)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Missing Mobile:</span>
                        <Badge variant="outline" className="text-orange-700 bg-orange-50">
                          {previewData.summary.missingMobileNumbers || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-3">
                    <h4 className="font-semibold text-purple-700 flex items-center gap-1">
                      🕒 Membership Status
                    </h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Memberships:</span>
                        <Badge variant="outline" className="text-green-700 bg-green-50">
                          {(previewData.validRows || 0) - (previewData.summary.historicalMemberships || 0)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Historical Memberships:</span>
                        <Badge variant="outline" className="text-orange-700 bg-orange-50">
                          {previewData.summary.historicalMemberships || 0}
                        </Badge>
                      </div>
                      {(previewData.summary.historicalMemberships || 0) > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ⚠️ Historical memberships will deactivate existing accounts
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Quality Issues */}
                <div className="space-y-4">
                  <div className="border-l-4 border-red-500 pl-3">
                    <h4 className="font-semibold text-red-700 flex items-center gap-1">
                      ⚠️ Data Quality Issues
                    </h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Missing Club Names:</span>
                        <Badge variant={previewData.summary.missingClubNames > 0 ? "destructive" : "outline"}>
                          {previewData.summary.missingClubNames}
                        </Badge>
                      </div>
                      
                      {previewData.summary.duplicatePonyClubIds.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-orange-800">Duplicate Pony Club IDs:</span>
                            <Badge variant="outline" className="text-orange-700 bg-orange-100">
                              {previewData.summary.duplicatePonyClubIds.length}
                            </Badge>
                          </div>
                          <div className="text-xs text-orange-700">
                            {previewData.summary.duplicatePonyClubIds.slice(0, 3).join(', ')}
                            {previewData.summary.duplicatePonyClubIds.length > 3 && '...'}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Error Rows:</span>
                        <Badge variant={previewData.errorRows > 0 ? "destructive" : "outline"}>
                          {previewData.errorRows}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-emerald-500 pl-3">
                    <h4 className="font-semibold text-emerald-700 flex items-center gap-1">
                      ✅ Import Summary
                    </h4>
                    <div className="mt-2 space-y-2">
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-600">
                            {previewData.validRows}
                          </div>
                          <div className="text-xs text-emerald-700">
                            Users ready to import
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <div>• {previewData.summary.clubsFound.length} unique clubs detected</div>
                        <div>• {previewData.summary.zonesFound.length} zones identified</div>
                        <div>• {Math.round(((previewData.validRows || 0) / (previewData.totalRows || 1)) * 100)}% success rate</div>
                      </div>
                    </div>
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
                        <TableHead>Email</TableHead>
                        <TableHead>Mobile</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Membership Status</TableHead>
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
                          <TableCell>
                            {row.email ? (
                              <span className="text-sm">{row.email}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{row.mobileNumber || '-'}</TableCell>
                          <TableCell>{row.originalClubName || '-'}</TableCell>
                          <TableCell>{row.originalZoneName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.role}</Badge>
                          </TableCell>
                          <TableCell>
                            {row.membershipStatus ? (
                              <Badge 
                                variant={(
                                  row.membershipStatus.toLowerCase().includes('historical') ||
                                  row.membershipStatus.toLowerCase().includes('inactive') ||
                                  row.membershipStatus.toLowerCase().includes('former') ||
                                  row.membershipStatus.toLowerCase().includes('expired') ||
                                  row.membershipStatus.toLowerCase().includes('lapsed') ||
                                  row.membershipStatus.toLowerCase() === 'nil' ||
                                  row.membershipStatus.toLowerCase() === 'none'
                                ) ? 'destructive' : 'default'}
                                className={(
                                  row.membershipStatus.toLowerCase().includes('historical') ||
                                  row.membershipStatus.toLowerCase().includes('inactive') ||
                                  row.membershipStatus.toLowerCase().includes('former') ||
                                  row.membershipStatus.toLowerCase().includes('expired') ||
                                  row.membershipStatus.toLowerCase().includes('lapsed') ||
                                  row.membershipStatus.toLowerCase() === 'nil' ||
                                  row.membershipStatus.toLowerCase() === 'none'
                                ) ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
                              >
                                {row.membershipStatus}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
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
