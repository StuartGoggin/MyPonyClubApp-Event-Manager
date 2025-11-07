'use client';

import { useState } from 'react';
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
  Shield,
  Eye,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar,
  Database,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

interface PurgeConfig {
  dryRun: boolean;
  excludePublicHolidays: boolean;
  filterByDateRange: {
    start: string;
    end: string;
  };
  filterBySource: string[];
  filterByStatus: string[];
  createBackup: boolean;
}

interface PurgeResult {
  success: boolean;
  totalEvents: number;
  eventsToDelete: number;
  deleted: number;
  skipped: number;
  errors: string[];
  backupCreated?: string;
  purgeTime: number;
  summary: {
    bySource: { [source: string]: number };
    byStatus: { [status: string]: number };
    byYear: { [year: string]: number };
  };
  preservedEvents: {
    publicHolidays: number;
    recentApproved: number;
    futureImportant: number;
  };
}

interface PurgeProgress {
  stage: string;
  percentage: number;
  details: string;
}

export default function PurgeTestEventsPage() {
  const [isPurging, setIsPurging] = useState(false);
  const [purgeProgress, setPurgeProgress] = useState<PurgeProgress | null>(null);
  const [purgeConfig, setPurgeConfig] = useState<PurgeConfig>({
    dryRun: true,
    excludePublicHolidays: true,
    filterByDateRange: { start: '', end: '' },
    filterBySource: [],
    filterByStatus: [],
    createBackup: true
  });
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePurgeTestEvents = async () => {
    if (!purgeConfig.dryRun && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setIsPurging(true);
    setPurgeResult(null);
    setShowConfirmation(false);

    try {
      setPurgeProgress({
        stage: purgeConfig.dryRun ? 'Analyzing Events' : 'Purging Test Events',
        percentage: 20,
        details: 'Fetching and analyzing events...'
      });

      const response = await fetch('/api/admin/purge-test-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purgeConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Purge failed');
      }

      setPurgeProgress({
        stage: 'Processing Results',
        percentage: 80,
        details: 'Finalizing operation...'
      });

      const result = await response.json();
      setPurgeResult(result.result);

      setPurgeProgress({
        stage: 'Complete',
        percentage: 100,
        details: `${purgeConfig.dryRun ? 'Analysis' : 'Purge'} completed successfully`
      });

    } catch (error: any) {
      console.error('Purge operation error:', error);
      setPurgeResult({
        success: false,
        totalEvents: 0,
        eventsToDelete: 0,
        deleted: 0,
        skipped: 0,
        errors: [error.message || 'Unknown error'],
        purgeTime: 0,
        summary: { bySource: {}, byStatus: {}, byYear: {} },
        preservedEvents: { publicHolidays: 0, recentApproved: 0, futureImportant: 0 }
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Rocket className="h-8 w-8 text-green-600" />
            Production Event Cleanup
          </h1>
          <p className="text-muted-foreground mt-1">
            Safely remove test events while preserving production data and public holidays
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Purge Configuration
            </CardTitle>
            <CardDescription>
              Configure what events to remove for production preparation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    onCheckedChange={(checked) => 
                      setPurgeConfig(prev => ({ ...prev, dryRun: checked as boolean }))
                    }
                  />
                  <Label htmlFor="dry-run" className="text-sm">
                    Dry Run (Simulate Only) - Recommended First
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-holidays"
                    checked={purgeConfig.excludePublicHolidays}
                    onCheckedChange={(checked) => 
                      setPurgeConfig(prev => ({ ...prev, excludePublicHolidays: checked as boolean }))
                    }
                  />
                  <Label htmlFor="exclude-holidays" className="text-sm">
                    Protect Public Holidays (Highly Recommended)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-backup"
                    checked={purgeConfig.createBackup}
                    onCheckedChange={(checked) => 
                      setPurgeConfig(prev => ({ ...prev, createBackup: checked as boolean }))
                    }
                  />
                  <Label htmlFor="create-backup" className="text-sm">
                    Create Backup Before Deletion
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Range Filter */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range Filter (Optional)
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={purgeConfig.filterByDateRange.start}
                    onChange={(e) => 
                      setPurgeConfig(prev => ({
                        ...prev,
                        filterByDateRange: { ...prev.filterByDateRange, start: e.target.value }
                      }))
                    }
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={purgeConfig.filterByDateRange.end}
                    onChange={(e) => 
                      setPurgeConfig(prev => ({
                        ...prev,
                        filterByDateRange: { ...prev.filterByDateRange, end: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Leave empty to process all dates. Use to limit purge to specific time periods.
              </p>
            </div>

            <Separator />

            {/* Action Button */}
            <div className="space-y-2 pt-4">
              {showConfirmation && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>⚠️ Production Purge Confirmation:</strong> This will permanently delete test events from your database. 
                    Public holidays and recent approved events will be preserved. This action cannot be undone. Are you sure?
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handlePurgeTestEvents}
                disabled={isPurging}
                className="w-full"
                variant={showConfirmation ? "destructive" : "default"}
              >
                {isPurging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {purgeConfig.dryRun ? 'Analyzing...' : 'Purging...'}
                  </>
                ) : showConfirmation ? (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirm Production Purge
                  </>
                ) : (
                  <>
                    {purgeConfig.dryRun ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <Rocket className="h-4 w-4 mr-2" />
                    )}
                    {purgeConfig.dryRun ? 'Analyze Events' : 'Prepare for Production'}
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

        {/* Results Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Operation Results
            </CardTitle>
            <CardDescription>
              Analysis and results of the purge operation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress */}
            {purgeProgress && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {purgeProgress.stage}
                </h4>
                
                <div className="space-y-2">
                  <Progress value={purgeProgress.percentage} className="w-full" />
                  <p className="text-xs text-muted-foreground">{purgeProgress.details}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {purgeResult && (
              <div className="space-y-6">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  {purgeConfig.dryRun ? 'Analysis Results' : 'Purge Results'}
                </h4>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Events:</span>
                      <span className="font-medium">{purgeResult.totalEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To {purgeConfig.dryRun ? 'Delete' : 'Deleted'}:</span>
                      <span className="font-medium text-red-600">{purgeResult.deleted}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Public Holidays:</span>
                      <span className="font-medium text-green-600">{purgeResult.preservedEvents.publicHolidays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recent Approved:</span>
                      <span className="font-medium text-green-600">{purgeResult.preservedEvents.recentApproved}</span>
                    </div>
                  </div>
                </div>

                {purgeResult.backupCreated && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      📦 Backup created: {purgeResult.backupCreated}
                    </p>
                  </div>
                )}

                {/* Summary by Status */}
                {Object.keys(purgeResult.summary.byStatus).length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-xs">Events by Status</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(purgeResult.summary.byStatus).map(([status, count]) => (
                        <Badge key={status} variant="outline" className="text-xs">
                          {status}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary by Year */}
                {Object.keys(purgeResult.summary.byYear).length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-xs">Events by Year</h5>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(purgeResult.summary.byYear).map(([year, count]) => (
                        <Badge key={year} variant="secondary" className="text-xs">
                          {year}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {purgeResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="font-medium text-xs text-red-600">Errors</h5>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      {purgeResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-800">{error}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    ⏱️ Operation completed in {purgeResult.purgeTime}ms
                  </p>
                </div>
              </div>
            )}

            {!purgeProgress && !purgeResult && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure and run the purge operation to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Information Panel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Shield className="h-5 w-5" />
            Production Preparation - What This Tool Does
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2 text-green-600">✅ Will Preserve:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• All clubs, zones, and locations</li>
                <li>• All user accounts and roles</li>
                <li>• Public holiday events</li>
                <li>• Recent approved events (last 30 days)</li>
                <li>• Upcoming approved events (next 7 days)</li>
                <li>• System configuration and settings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-red-600">🗑️ Will Remove:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Test events and generated data</li>
                <li>• Old proposed/rejected events</li>
                <li>• Uploaded test schedules</li>
                <li>• Test approval records</li>
                <li>• Events not marked as important</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}