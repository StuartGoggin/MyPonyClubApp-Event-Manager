'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Calendar, 
  AlertCircle, 
  FerrisWheel,
  Settings,
  Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

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
  eventsCount?: number;
  yearsSync?: number[];
  disciplinesSync?: string[];
  config?: SyncConfig;
}

interface SyncConfig {
  disciplines: string[];
  yearsAhead: number;
  syncIntervalDays: number;
  isActive: boolean;
}

const DISCIPLINES = [
  { id: 'interschool', label: 'Interschool' },
  { id: 'parequestrian', label: 'Para Equestrian' },
  { id: 'endurance', label: 'Endurance' },
  { id: 'dressage', label: 'Dressage' },
  { id: 'jumping', label: 'Jumping' },
  { id: 'vaulting', label: 'Vaulting' },
  { id: 'eventing', label: 'Eventing' },
  { id: 'driving', label: 'Driving' },
  { id: 'education', label: 'Education' },
  { id: 'showhorse', label: 'Show Horse' },
];

export function EvEventsSyncTile() {
  const { toast } = useToast();
  const [syncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  // Config form state
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [yearsAhead, setYearsAhead] = useState<number>(2);
  const [syncIntervalDays, setSyncIntervalDays] = useState<number>(7);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const response = await fetch('/api/admin/sync-ev-events');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        
        // Update form state if config exists
        if (data.config) {
          setSelectedDisciplines(data.config.disciplines || []);
          setYearsAhead(data.config.yearsAhead || 2);
          setSyncIntervalDays(data.config.syncIntervalDays || 7);
          setIsActive(data.config.isActive ?? true);
        }
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async (force: boolean = false) => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync-ev-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      });

      const result: SyncResult = await response.json();

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
          variant: 'default',
        });
        
        if (result.stats) {
          toast({
            title: 'Sync Statistics',
            description: `Added: ${result.stats.added}, Updated: ${result.stats.updated}, Deleted: ${result.stats.deleted}, Unchanged: ${result.stats.unchanged}`,
            variant: 'default',
          });
        }
      } else {
        toast({
          title: 'Sync Information',
          description: result.message,
          variant: result.message.includes('not needed') ? 'default' : 'destructive',
        });
      }

      // Refresh status after sync
      await fetchStatus();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync EV events. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const response = await fetch('/api/admin/sync-ev-events', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disciplines: selectedDisciplines,
          yearsAhead,
          syncIntervalDays,
          isActive,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Sync configuration saved successfully',
          variant: 'default',
        });
        setConfigDialogOpen(false);
        await fetchStatus();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save configuration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDisciplineToggle = (disciplineId: string) => {
    setSelectedDisciplines(prev => 
      prev.includes(disciplineId)
        ? prev.filter(id => id !== disciplineId)
        : [...prev, disciplineId]
    );
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-4 border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
            <FerrisWheel className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">EV Events</h3>
            <p className="text-sm text-muted-foreground">Sync from Equestrian Victoria</p>
          </div>
        </div>
        
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>EV Events Sync Configuration</DialogTitle>
              <DialogDescription>
                Configure which disciplines to sync and how often
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Disciplines</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
                  {DISCIPLINES.map(discipline => (
                    <div key={discipline.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`config-${discipline.id}`}
                        checked={selectedDisciplines.includes(discipline.id)}
                        onCheckedChange={() => handleDisciplineToggle(discipline.id)}
                      />
                      <label
                        htmlFor={`config-${discipline.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {discipline.label}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to sync all events
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearsAhead">Years Ahead</Label>
                <Input
                  id="yearsAhead"
                  type="number"
                  min={1}
                  max={5}
                  value={yearsAhead}
                  onChange={(e) => setYearsAhead(parseInt(e.target.value) || 2)}
                />
                <p className="text-xs text-muted-foreground">
                  Sync current year plus next {yearsAhead} years
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="syncInterval">Sync Interval (days)</Label>
                <Input
                  id="syncInterval"
                  type="number"
                  min={1}
                  max={30}
                  value={syncIntervalDays}
                  onChange={(e) => setSyncIntervalDays(parseInt(e.target.value) || 7)}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum days between automatic syncs
                </p>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="isActive">Enable Automatic Sync</Label>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} disabled={savingConfig}>
                {savingConfig ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="space-y-3">
        {loadingStatus ? (
          <Badge variant="outline" className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Checking status...
          </Badge>
        ) : !status?.config ? (
          <div className="space-y-2">
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not configured
            </Badge>
            <p className="text-xs text-muted-foreground">
              Click the settings icon to configure sync
            </p>
          </div>
        ) : status?.synced ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={status.needsSync ? 'destructive' : 'default'} className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {status.eventsCount || 0} events
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
              {status.config && !status.config.isActive && (
                <Badge variant="outline" className="text-xs text-gray-600">
                  Auto-sync disabled
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
            {status.disciplinesSync && status.disciplinesSync.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Disciplines: {status.disciplinesSync.join(', ')}
              </p>
            )}
            {status.yearsSync && status.yearsSync.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Years: {status.yearsSync.join(', ')}
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
            disabled={syncing || !status?.config}
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
            disabled={syncing || !status?.config}
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
          Auto sync respects interval limit. Force sync overrides the restriction.
        </p>
      </div>
    </div>
  );
}
