'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FerrisWheel, RefreshCw, Calendar, AlertCircle } from 'lucide-react';

interface SyncResult {
  success: boolean;
  message: string;
  stats?: {
    added: number;
    updated: number;
    deleted: number;
    unchanged: number;
    total: number;
  };
  lastSyncDate?: string;
  errors?: string[];
}

interface SyncStatus {
  synced: boolean;
  lastSyncDate?: string;
  daysSinceSync?: number;
  needsSync?: boolean;
  lastSyncSuccess?: boolean;
  holidaysCount?: number;
}

export function PublicHolidaySyncTile() {
  const { toast } = useToast();
  const [syncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/admin/sync-public-holidays');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleSync = async (force: boolean = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-public-holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force, yearsAhead: 5 }),
      });

      const result: SyncResult = await response.json();

      if (result.success) {
        toast({
          title: 'Sync Successful',
          description: `${result.message}. Added: ${result.stats?.added}, Updated: ${result.stats?.updated}, Deleted: ${result.stats?.deleted}`,
          variant: 'default',
        });
        // Refresh status
        await fetchStatus();
      } else {
        toast({
          title: 'Sync Info',
          description: result.message,
          variant: result.message.includes('not needed') ? 'default' : 'destructive',
        });
        if (!result.message.includes('not needed')) {
          console.error('Sync errors:', result.errors);
        }
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch status on mount
  useState(() => {
    fetchStatus();
  });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-50/80 via-green-50/60 to-emerald-50/40 dark:from-green-950/40 dark:via-green-950/30 dark:to-emerald-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-emerald-400/5"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-400/10 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-green-100 dark:bg-green-900/50 p-3 border border-green-200 dark:border-green-700">
            <FerrisWheel className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Public Holidays</h3>
            <p className="text-sm text-muted-foreground">Sync from external source</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {loadingStatus ? (
            <Badge variant="outline" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Checking status...
            </Badge>
          ) : status?.synced ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={status.needsSync ? 'destructive' : 'default'} className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {status.holidaysCount || 0} holidays
                </Badge>
                {status.lastSyncDate && (
                  <Badge variant="outline" className="text-xs">
                    {status.daysSinceSync} days ago
                  </Badge>
                )}
                {status.needsSync && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Sync needed
                  </Badge>
                )}
              </div>
              {status.lastSyncDate && (
                <p className="text-xs text-muted-foreground">
                  Last synced: {new Date(status.lastSyncDate).toLocaleDateString('en-AU', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Never synced
            </Badge>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleSync(false)}
              disabled={syncing}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Auto Sync
                </>
              )}
            </Button>
            <Button
              onClick={() => handleSync(true)}
              disabled={syncing}
              variant="default"
              size="sm"
              className="w-full"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Force Sync
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Auto sync respects 7-day limit. Force sync overrides the restriction.
          </p>
        </div>
      </div>
    </div>
  );
}
