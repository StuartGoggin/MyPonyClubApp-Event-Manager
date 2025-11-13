'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Download, CheckCircle, XCircle, AlertCircle, FileText, History, Calendar, HardDrive } from 'lucide-react';
import { BackupExecution } from '@/lib/types-backup';

export function BackupHistoryTile() {
  const [executions, setExecutions] = useState<BackupExecution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<BackupExecution | null>(null);

  useEffect(() => {
    if (isDialogOpen) {
      fetchExecutions();
    }
  }, [isDialogOpen]);

  const fetchExecutions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/backup-executions?limit=50');
      const data = await response.json();
      if (data.success) {
        setExecutions(data.executions);
      }
    } catch (error) {
      console.error('Error fetching backup executions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(dateObj);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatSize = (bytes: number | undefined) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (ms: number | undefined) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Running</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = async (execution: BackupExecution) => {
    try {
      // Check if backup was stored (not email-only)
      if (!execution.storagePath && !execution.downloadUrl) {
        alert('This backup was delivered via email only and is not available for download from storage.');
        return;
      }

      // Request a fresh download URL from the API
      const response = await fetch(`/api/admin/backup-executions/${execution.id}/download`);
      const data = await response.json();

      if (!data.success) {
        alert(`Failed to get download URL: ${data.error}`);
        return;
      }

      // Open the signed URL in a new tab to trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || `backup-${execution.scheduleName}-${new Date(execution.startTime).toISOString().split('T')[0]}.zip`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`✅ Backup download started: ${data.fileName}`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      alert('Failed to download backup. Please try again.');
    }
  };

  const handleViewDetails = (execution: BackupExecution) => {
    setSelectedExecution(execution);
  };

  const recentExecutions = executions.slice(0, 3);
  const hasBackups = executions.length > 0;

  return (
    <>
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 backdrop-blur shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <History className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>Review and download backups</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <FileText className="h-4 w-4" />
                <span>Total Backups</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {executions.length}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="h-4 w-4" />
                <span>Successful</span>
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {executions.filter(e => e.status === 'completed').length}
              </div>
            </div>
          </div>

          {/* Recent Backups */}
          {hasBackups ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Backups</h4>
              <div className="space-y-2">
                {recentExecutions.map((execution) => (
                  <div
                    key={execution.id}
                    className="p-3 rounded-lg bg-white/70 dark:bg-gray-800/70 backdrop-blur border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(execution.status)}
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {execution.scheduleName}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(execution.startTime)}
                          </span>
                          {execution.exportSize && (
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              {formatSize(execution.exportSize)}
                            </span>
                          )}
                        </div>
                      </div>
                      {execution.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(execution)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No backup history available</p>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            disabled={isLoading}
          >
            <History className="mr-2 h-4 w-4" />
            View All Backups
          </Button>
        </CardContent>
      </Card>

      {/* Full History Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Backup History
            </DialogTitle>
            <DialogDescription>
              View and download all backup executions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 animate-spin mx-auto mb-2 text-purple-600" />
                  <p className="text-gray-600 dark:text-gray-400">Loading backup history...</p>
                </div>
              </div>
            ) : executions.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">No backups found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>{getStatusBadge(execution.status)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{execution.scheduleName}</div>
                          <div className="text-xs text-gray-500">
                            {execution.metadata.triggeredBy === 'manual' ? 'Manual' : 'Scheduled'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(execution.startTime)}</div>
                          {execution.endTime && (
                            <div className="text-xs text-gray-500">
                              Ended: {formatDate(execution.endTime)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDuration(execution.metadata.executionDuration)}</TableCell>
                      <TableCell>{formatSize(execution.exportSize)}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {execution.metadata.exportedRecords.events > 0 && (
                            <div>Events: {execution.metadata.exportedRecords.events}</div>
                          )}
                          {execution.metadata.exportedRecords.users > 0 && (
                            <div>Users: {execution.metadata.exportedRecords.users}</div>
                          )}
                          {execution.metadata.exportedRecords.clubs > 0 && (
                            <div>Clubs: {execution.metadata.exportedRecords.clubs}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(execution)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {execution.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleDownload(execution)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Execution Details Dialog */}
      {selectedExecution && (
        <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Backup Execution Details</DialogTitle>
              <DialogDescription>
                Detailed information about this backup execution
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedExecution.status)}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Schedule</Label>
                  <div className="mt-1 font-medium">{selectedExecution.scheduleName}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Start Time</Label>
                  <div className="mt-1">{formatDate(selectedExecution.startTime)}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">End Time</Label>
                  <div className="mt-1">{formatDate(selectedExecution.endTime)}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Duration</Label>
                  <div className="mt-1">{formatDuration(selectedExecution.metadata.executionDuration)}</div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">File Size</Label>
                  <div className="mt-1">{formatSize(selectedExecution.exportSize)}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Exported Records</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                    <div className="text-lg font-semibold">{selectedExecution.metadata.exportedRecords.events}</div>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Users</div>
                    <div className="text-lg font-semibold">{selectedExecution.metadata.exportedRecords.users}</div>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Clubs</div>
                    <div className="text-lg font-semibold">{selectedExecution.metadata.exportedRecords.clubs}</div>
                  </div>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <div className="text-xs text-gray-600 dark:text-gray-400">Zones</div>
                    <div className="text-lg font-semibold">{selectedExecution.metadata.exportedRecords.zones}</div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Delivery Status</Label>
                <div className="mt-2 space-y-2">
                  {selectedExecution.deliveryStatus.email && (
                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="text-sm">Email</span>
                      <Badge variant={selectedExecution.deliveryStatus.email === 'sent' ? 'default' : 'destructive'}>
                        {selectedExecution.deliveryStatus.email}
                      </Badge>
                    </div>
                  )}
                  {selectedExecution.deliveryStatus.storage && (
                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      <span className="text-sm">Storage</span>
                      <Badge variant={selectedExecution.deliveryStatus.storage === 'uploaded' ? 'default' : 'destructive'}>
                        {selectedExecution.deliveryStatus.storage}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {selectedExecution.errorMessage && (
                <div>
                  <Label className="text-sm text-red-600">Error Message</Label>
                  <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                    {selectedExecution.errorMessage}
                  </div>
                </div>
              )}

              {selectedExecution.status === 'completed' && (
                <Button
                  onClick={() => handleDownload(selectedExecution)}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
