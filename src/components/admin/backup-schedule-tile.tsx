'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Plus, Settings, Mail, CloudUpload, Calendar, CheckCircle, AlertCircle, Play, Pause, Trash2, Edit, Zap } from 'lucide-react';
import { BackupSchedule, BackupStats, ScheduleConfig, DeliveryConfig, ExportConfig } from '@/lib/types-backup';

interface BackupScheduleTileProps {
  onScheduleCreated?: () => void;
}

export function BackupScheduleTile({ onScheduleCreated }: BackupScheduleTileProps) {
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<BackupSchedule | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
    time: '02:00',
    timezone: 'UTC',
    weekday: 0,
    dayOfMonth: 1,
    customCron: '',
    deliveryMethod: 'email' as 'email' | 'storage' | 'both',
    emailRecipients: '',
    emailSubject: 'Automated Backup - {date}',
    storageProvider: 'firebase' as 'firebase' | 'aws-s3' | 'google-drive',
    storagePath: '/backups',
    retentionDays: 30,
    includeEvents: true,
    includeUsers: true,
    includeClubs: true,
    includeZones: true,
    includeEventTypes: true,
    includeSchedules: true,
    includeMetadata: true,
    includeManifest: true,
    compressionLevel: 'medium' as 'low' | 'medium' | 'high',
    isActive: true
  });

  useEffect(() => {
    fetchSchedules();
    fetchStats();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/admin/backup-schedules');
      const data = await response.json();
      if (data.success) {
        setSchedules(data.schedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/backup-stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateSchedule = async () => {
    try {
      setIsLoading(true);

      const scheduleConfig: ScheduleConfig = {
        frequency: formData.frequency,
        time: formData.time,
        timezone: formData.timezone,
        customCron: formData.customCron || undefined,
        weekday: formData.weekday,
        dayOfMonth: formData.dayOfMonth
      };

      const deliveryConfig: DeliveryConfig = {
        method: formData.deliveryMethod,
        email: formData.deliveryMethod === 'email' || formData.deliveryMethod === 'both' ? {
          recipients: formData.emailRecipients.split(',').map(email => email.trim()),
          subject: formData.emailSubject,
          includeMetadata: true,
          maxFileSize: 25 // MB
        } : undefined,
        storage: formData.deliveryMethod === 'storage' || formData.deliveryMethod === 'both' ? {
          provider: formData.storageProvider,
          path: formData.storagePath,
          retentionDays: formData.retentionDays,
          compress: true
        } : undefined
      };

      const exportConfig: ExportConfig = {
        includeEvents: formData.includeEvents,
        includeUsers: formData.includeUsers,
        includeClubs: formData.includeClubs,
        includeZones: formData.includeZones,
        includeEventTypes: formData.includeEventTypes,
        includeSchedules: formData.includeSchedules,
        includeMetadata: formData.includeMetadata,
        includeManifest: formData.includeManifest,
        compressionLevel: formData.compressionLevel
      };

      const scheduleData = {
        name: formData.name,
        description: formData.description,
        schedule: scheduleConfig,
        deliveryOptions: deliveryConfig,
        exportConfig: exportConfig,
        isActive: formData.isActive
      };

      const response = await fetch('/api/admin/backup-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData)
      });

      const result = await response.json();
      if (result.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchSchedules();
        fetchStats();
        onScheduleCreated?.();
      } else {
        console.error('Failed to create schedule:', result.error);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleScheduleStatus = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/backup-schedules/${scheduleId}/toggle`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        fetchSchedules();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this backup schedule?')) return;
    
    try {
      const response = await fetch(`/api/admin/backup-schedules/${scheduleId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        fetchSchedules();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const executeBackupNow = async (scheduleId: string) => {
    if (!confirm('Execute this backup schedule now?')) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/backup-schedules/${scheduleId}/execute`, {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        alert('Backup executed successfully!');
        fetchSchedules();
        fetchStats();
      } else {
        alert(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error executing backup:', error);
      alert('Failed to execute backup');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      time: '02:00',
      timezone: 'UTC',
      weekday: 0,
      dayOfMonth: 1,
      customCron: '',
      deliveryMethod: 'email',
      emailRecipients: '',
      emailSubject: 'Automated Backup - {date}',
      storageProvider: 'firebase',
      storagePath: '/backups',
      retentionDays: 30,
      includeEvents: true,
      includeUsers: true,
      includeClubs: true,
      includeZones: true,
      includeEventTypes: true,
      includeSchedules: true,
      includeMetadata: true,
      includeManifest: true,
      compressionLevel: 'medium',
      isActive: true
    });
  };

  const formatNextRun = (date: Date | undefined) => {
    if (!date) return 'Not scheduled';
    
    // Handle both Date objects and date strings
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(dateObj);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50/80 via-orange-50/60 to-amber-50/40 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-amber-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-amber-400/5"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-orange-100 dark:bg-orange-900/50 p-3 border border-orange-200 dark:border-orange-700">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Automatic Backup</h3>
            <p className="text-sm text-muted-foreground">Schedule automated backups</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Badge variant="outline" className="justify-center">
              {stats?.activeSchedules || 0} Active
            </Badge>
            <Badge variant="outline" className="justify-center">
              {stats?.totalExecutions || 0} Total Runs
            </Badge>
          </div>

          {/* Next scheduled backup */}
          {stats?.nextScheduledBackup && (
            <div className="p-3 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg border border-orange-200/30">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-muted-foreground">Next backup:</span>
              </div>
              <div className="text-sm font-medium">
                {formatNextRun(stats.nextScheduledBackup)}
              </div>
            </div>
          )}

          {/* Schedule list */}
          {schedules.length > 0 && (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {schedules.slice(0, 3).map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${schedule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="font-medium truncate max-w-24">{schedule.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-blue-500"
                      onClick={() => executeBackupNow(schedule.id)}
                      title="Run backup now"
                    >
                      <Zap className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleScheduleStatus(schedule.id)}
                    >
                      {schedule.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500"
                      onClick={() => deleteSchedule(schedule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {schedules.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{schedules.length - 3} more schedules
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Backup Schedule</DialogTitle>
                  <DialogDescription>
                    Set up an automated backup schedule with custom delivery options.
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="general" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Schedule Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Daily Database Backup"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the purpose of this backup schedule..."
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Activate schedule immediately</Label>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="schedule" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom (Cron)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                      />
                    </div>
                    
                    {formData.frequency === 'weekly' && (
                      <div className="space-y-2">
                        <Label htmlFor="weekday">Day of Week</Label>
                        <Select value={formData.weekday.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, weekday: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {formData.frequency === 'monthly' && (
                      <div className="space-y-2">
                        <Label htmlFor="dayOfMonth">Day of Month</Label>
                        <Input
                          id="dayOfMonth"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.dayOfMonth}
                          onChange={(e) => setFormData(prev => ({ ...prev, dayOfMonth: parseInt(e.target.value) }))}
                        />
                      </div>
                    )}
                    
                    {formData.frequency === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="customCron">Cron Expression</Label>
                        <Input
                          id="customCron"
                          value={formData.customCron}
                          onChange={(e) => setFormData(prev => ({ ...prev, customCron: e.target.value }))}
                          placeholder="0 2 * * *"
                        />
                        <p className="text-xs text-muted-foreground">
                          Use standard cron format (minute hour day month weekday)
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="delivery" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryMethod">Delivery Method</Label>
                      <Select value={formData.deliveryMethod} onValueChange={(value: any) => setFormData(prev => ({ ...prev, deliveryMethod: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="storage">Storage Only</SelectItem>
                          <SelectItem value="both">Email + Storage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(formData.deliveryMethod === 'email' || formData.deliveryMethod === 'both') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="emailRecipients">Email Recipients</Label>
                          <Input
                            id="emailRecipients"
                            value={formData.emailRecipients}
                            onChange={(e) => setFormData(prev => ({ ...prev, emailRecipients: e.target.value }))}
                            placeholder="admin@example.com, backup@company.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            Separate multiple emails with commas
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emailSubject">Email Subject</Label>
                          <Input
                            id="emailSubject"
                            value={formData.emailSubject}
                            onChange={(e) => setFormData(prev => ({ ...prev, emailSubject: e.target.value }))}
                            placeholder="Automated Backup - {date}"
                          />
                        </div>
                      </>
                    )}
                    
                    {(formData.deliveryMethod === 'storage' || formData.deliveryMethod === 'both') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="storageProvider">Storage Provider</Label>
                          <Select value={formData.storageProvider} onValueChange={(value: any) => setFormData(prev => ({ ...prev, storageProvider: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="firebase">Firebase Storage</SelectItem>
                              <SelectItem value="aws-s3">AWS S3</SelectItem>
                              <SelectItem value="google-drive">Google Drive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="storagePath">Storage Path</Label>
                          <Input
                            id="storagePath"
                            value={formData.storagePath}
                            onChange={(e) => setFormData(prev => ({ ...prev, storagePath: e.target.value }))}
                            placeholder="/backups"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="retentionDays">Retention (Days)</Label>
                          <Input
                            id="retentionDays"
                            type="number"
                            min="1"
                            value={formData.retentionDays}
                            onChange={(e) => setFormData(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="content" className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Data to Include</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'includeEvents', label: 'Events' },
                          { key: 'includeUsers', label: 'Users' },
                          { key: 'includeClubs', label: 'Clubs' },
                          { key: 'includeZones', label: 'Zones' },
                          { key: 'includeEventTypes', label: 'Event Types' },
                          { key: 'includeSchedules', label: 'Schedules' },
                          { key: 'includeMetadata', label: 'Metadata' },
                          { key: 'includeManifest', label: 'Manifest' }
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Switch
                              checked={formData[key as keyof typeof formData] as boolean}
                              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [key]: checked }))}
                            />
                            <Label className="text-sm">{label}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="compressionLevel">Compression Level</Label>
                      <Select value={formData.compressionLevel} onValueChange={(value: any) => setFormData(prev => ({ ...prev, compressionLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Faster)</SelectItem>
                          <SelectItem value="medium">Medium (Balanced)</SelectItem>
                          <SelectItem value="high">High (Smaller)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSchedule} disabled={isLoading || !formData.name}>
                    {isLoading ? 'Creating...' : 'Create Schedule'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm" onClick={() => { fetchSchedules(); fetchStats(); }}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}