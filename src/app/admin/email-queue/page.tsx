'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Mail, Send, Trash2, Edit, Eye, CheckCircle, XCircle, Clock, AlertTriangle, Settings, Download, Filter, Search, RefreshCw, FileText, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { QueuedEmail, EmailStatus, EmailQueueStats, EmailQueueConfig, EmailLog } from '@/lib/types';
import { cn } from '@/lib/utils';
import AdminAuthWrapper from '@/components/admin-auth-wrapper';

function EmailQueueAdminContent() {
  const [emails, setEmails] = useState<QueuedEmail[]>([]);
  const [stats, setStats] = useState<EmailQueueStats | null>(null);
  const [config, setConfig] = useState<EmailQueueConfig | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<EmailStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEmail, setEditingEmail] = useState<QueuedEmail | null>(null);
  const [resendingEmail, setResendingEmail] = useState<QueuedEmail | null>(null);
  const [resendEmailData, setResendEmailData] = useState<{to: string[]; cc?: string[]; bcc?: string[]}>({ to: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch data functions
  const fetchEmails = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/email-queue?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setEmails(result.data || []);
      } else {
        console.error('Failed to fetch emails:', result.error);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  }, [filterStatus, filterType]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/email-queue?action=stats');
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      } else {
        console.error('Failed to fetch stats:', result.error);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/email-queue/config');
      const result = await response.json();
      
      if (result.success) {
        setConfig(result.data);
      } else {
        console.error('Failed to fetch config:', result.error);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  }, []);

  const saveConfig = async () => {
    if (!config) return;
    
    try {
      const response = await fetch('/api/email-queue/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('Configuration saved successfully');
      } else {
        console.error('Failed to save config:', result.error);
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const response = await fetch('/api/email-queue/logs');
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.data);
      } else {
        console.error('Failed to fetch logs:', result.error);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEmails(), fetchStats(), fetchConfig(), fetchLogs()]);
      setIsLoading(false);
    };
    
    loadData();
  }, [fetchEmails, fetchStats, fetchConfig, fetchLogs]);

  // Refetch emails when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchEmails();
    }
  }, [fetchEmails, isLoading]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchEmails(), fetchStats()]);
    setIsRefreshing(false);
  };

  const getStatusColor = (status: EmailStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case 'draft': return <Edit className="h-3 w-3" />;
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'sent': return <CheckCircle className="h-3 w-3" />;
      case 'failed': return <XCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesStatus = filterStatus === 'all' || email.status === filterStatus;
    const matchesType = filterType === 'all' || email.type === filterType;
    const matchesSearch = searchQuery === '' || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.to.some(to => to.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleBulkAction = async (action: 'approve' | 'delete' | 'send') => {
    setIsRefreshing(true);
    
    try {
      if (action === 'delete') {
        const response = await fetch('/api/email-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk-delete', emailIds: selectedEmails }),
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      } else if (action === 'approve') {
        const response = await fetch('/api/email-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'bulk-update', 
            emailIds: selectedEmails,
            updates: { 
              status: 'pending',
              approvedBy: 'admin',
              approvedAt: new Date()
            }
          }),
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      } else if (action === 'send') {
        // Send emails one by one
        for (const emailId of selectedEmails) {
          await fetch('/api/email-queue/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailId, sentById: 'admin' }),
          });
        }
        await fetchEmails();
      }
    } catch (error) {
      console.error('Bulk action error:', error);
    }
    
    setSelectedEmails([]);
    setIsRefreshing(false);
    await fetchStats();
  };

  const handleEmailAction = async (emailId: string, action: 'approve' | 'delete' | 'send' | 'cancel' | 'resend') => {
    setIsRefreshing(true);
    
    try {
      if (action === 'delete') {
        const response = await fetch(`/api/email-queue?emailId=${emailId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      } else if (action === 'approve') {
        const response = await fetch('/api/email-queue', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            emailId,
            updates: { 
              status: 'pending',
              approvedBy: 'admin',
              approvedAt: new Date()
            }
          }),
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      } else if (action === 'send') {
        const response = await fetch('/api/email-queue/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId, sentById: 'admin' }),
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      } else if (action === 'resend') {
        // Create a duplicate email based on the existing one and mark it as pending
        const response = await fetch('/api/email-queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'duplicate',
            emailId: emailId,
            resetStatus: true
          }),
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      } else if (action === 'cancel') {
        const response = await fetch('/api/email-queue', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            emailId,
            updates: { status: 'cancelled' }
          }),
        });
        
        if (response.ok) {
          await fetchEmails();
        }
      }
    } catch (error) {
      console.error('Email action error:', error);
    }
    
    setIsRefreshing(false);
    await fetchStats();
  };

  const saveEmailChanges = async () => {
    if (!editingEmail) return;
    
    try {
      const response = await fetch('/api/email-queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailId: editingEmail.id,
          updates: {
            subject: editingEmail.subject,
            textContent: editingEmail.textContent,
            htmlContent: editingEmail.htmlContent,
            lastEditedBy: 'admin',
            lastEditedAt: new Date()
          }
        }),
      });
      
      if (response.ok) {
        await fetchEmails();
        setEditingEmail(null);
      }
    } catch (error) {
      console.error('Error saving email changes:', error);
    }
  };

  const handleEditResend = (email: QueuedEmail) => {
    setResendingEmail(email);
    setResendEmailData({
      to: Array.isArray(email.to) ? email.to : [email.to],
      cc: email.cc,
      bcc: email.bcc
    });
  };

  const handleResendWithEdits = async () => {
    if (!resendingEmail) return;
    
    setIsRefreshing(true);
    
    try {
      const response = await fetch('/api/email-queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          emailId: resendingEmail.id,
          resetStatus: true,
          updates: {
            to: resendEmailData.to,
            cc: resendEmailData.cc,
            bcc: resendEmailData.bcc
          }
        }),
      });
      
      if (response.ok) {
        await fetchEmails();
        setResendingEmail(null);
        setResendEmailData({ to: [] });
      }
    } catch (error) {
      console.error('Error resending email with edits:', error);
    }
    
    setIsRefreshing(false);
    await fetchStats();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Mail className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Email Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Queue Management</h1>
          <p className="text-muted-foreground">Review, edit, and manage queued emails before sending</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="queue">Email Queue</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="logs">Diagnostic Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Edit className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.draft || 0}</p>
                    <p className="text-xs text-muted-foreground">Draft</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.sent || 0}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.failed || 0}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 items-center flex-1">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as EmailStatus | 'all')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="event_request">Event Request</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="backup">Backup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedEmails.length > 0 && (
                  <div className="flex gap-2">
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Selected ({selectedEmails.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4 mr-2" />
                        Send Selected ({selectedEmails.length})
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedEmails.length})
                      </Button>
                    </AlertDialogTrigger>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email List */}
          <Card>
            <CardHeader>
              <CardTitle>Email Queue ({filteredEmails.length})</CardTitle>
              <CardDescription>
                Manage and review emails in the queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedEmails(filteredEmails.map(email => email.id));
                          } else {
                            setSelectedEmails([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmails.includes(email.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEmails([...selectedEmails, email.id]);
                            } else {
                              setSelectedEmails(selectedEmails.filter(id => id !== email.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(email.status))}>
                          {getStatusIcon(email.status)}
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{email.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{email.subject}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {Array.isArray(email.to) 
                            ? email.to.slice(0, 2).join(', ')
                            : email.to
                          }
                          {Array.isArray(email.to) && email.to.length > 2 && ` +${email.to.length - 2} more`}
                        </div>
                      </TableCell>
                      <TableCell>{format(email.createdAt, 'MMM dd, HH:mm')}</TableCell>
                      <TableCell>
                        {email.scheduledFor ? format(email.scheduledFor, 'MMM dd, HH:mm') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Email Preview</DialogTitle>
                                <DialogDescription>{email.subject}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">To:</Label>
                                    <div className="text-sm">
                                      {Array.isArray(email.to) ? email.to.join(', ') : email.to}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status:</Label>
                                    <Badge className={cn("ml-2", getStatusColor(email.status))}>
                                      {email.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Content:</Label>
                                  <div 
                                    className="mt-2 p-4 border rounded-md max-h-96 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: email.htmlContent || '' }}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingEmail(email)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {email.status === 'draft' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEmailAction(email.id, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {email.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEmailAction(email.id, 'send')}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {(email.status === 'sent' || email.status === 'failed') && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEmailAction(email.id, 'resend')}
                                title="Resend email"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditResend(email)}
                                title="Edit recipients and resend"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Email</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this email? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleEmailAction(email.id, 'delete')}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">{stats?.successRate || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Processing Time</span>
                    <span className="text-sm font-medium">{stats?.averageProcessingTimeMinutes || 0}min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Sent Today</span>
                    <span className="text-sm font-medium">{stats?.sentToday || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sent This Week</span>
                    <span className="text-sm font-medium">{stats?.sentThisWeek || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sent This Month</span>
                    <span className="text-sm font-medium">{stats?.sentThisMonth || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Failed Emails</span>
                    <span className="text-sm font-medium">{stats?.failed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Failure</span>
                    <span className="text-sm font-medium">
                      {stats?.mostRecentFailure ? format(stats.mostRecentFailure, 'MMM dd') : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Oldest Pending</span>
                    <span className="text-sm font-medium">
                      {stats?.oldestPendingEmail ? format(stats.oldestPendingEmail, 'MMM dd') : 'None'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Queue Configuration</CardTitle>
              <CardDescription>
                Configure how the email queue system operates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Queue Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maxRetries">Max Retries</Label>
                      <Input 
                        id="maxRetries" 
                        type="number" 
                        value={config?.maxRetries || 3} 
                        onChange={(e) => config && setConfig({...config, maxRetries: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="retryDelay">Retry Delay (minutes)</Label>
                      <Input 
                        id="retryDelay" 
                        type="number" 
                        value={config?.retryDelayMinutes || 30} 
                        onChange={(e) => config && setConfig({...config, retryDelayMinutes: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxQueueSize">Max Queue Size</Label>
                      <Input 
                        id="maxQueueSize" 
                        type="number" 
                        value={config?.maxQueueSize || 100} 
                        onChange={(e) => config && setConfig({...config, maxQueueSize: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Approval Requirements</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="approveEventRequests"
                        checked={config?.requireApprovalForEventRequests || false}
                        onCheckedChange={(checked) => config && setConfig({...config, requireApprovalForEventRequests: !!checked})}
                      />
                      <Label htmlFor="approveEventRequests">Event Requests</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="approveNotifications"
                        checked={config?.requireApprovalForNotifications || false}
                        onCheckedChange={(checked) => config && setConfig({...config, requireApprovalForNotifications: !!checked})}
                      />
                      <Label htmlFor="approveNotifications">Notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="approveReminders"
                        checked={config?.requireApprovalForReminders || false}
                        onCheckedChange={(checked) => config && setConfig({...config, requireApprovalForReminders: !!checked})}
                      />
                      <Label htmlFor="approveReminders">Reminders</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="approveGeneral"
                        checked={config?.requireApprovalForGeneral || false}
                        onCheckedChange={(checked) => config && setConfig({...config, requireApprovalForGeneral: !!checked})}
                      />
                      <Label htmlFor="approveGeneral">General Emails</Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={saveConfig}>
                  <Settings className="h-4 w-4 mr-2" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Diagnostic Logs
              </CardTitle>
              <CardDescription>
                View email send operation history and diagnostic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button onClick={fetchLogs} variant="outline" size="sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Refresh Logs
                  </Button>
                </div>
              </div>
              
              {isLoadingLogs ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Email ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Recipients</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No logs available
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">
                              {new Date(log.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.emailId || 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.subject || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {Array.isArray(log.recipients) 
                                ? log.recipients.length 
                                : (log.recipients ? 1 : 0)
                              } recipient(s)
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  log.status === 'success' ? 'default' :
                                  log.status === 'error' ? 'destructive' :
                                  log.status === 'retry' ? 'secondary' : 'outline'
                                }
                                className="flex items-center gap-1 w-fit"
                              >
                                {log.status === 'error' && <AlertCircle className="h-3 w-3" />}
                                {log.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate" title={log.message}>
                                {log.message || 'No message'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Edit Dialog */}
      {editingEmail && (
        <Dialog open={!!editingEmail} onOpenChange={() => setEditingEmail(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Email</DialogTitle>
              <DialogDescription>
                Make changes to the email content before sending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editSubject">Subject</Label>
                <Input 
                  id="editSubject"
                  value={editingEmail.subject}
                  onChange={(e) => setEditingEmail({...editingEmail, subject: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="editContent">Content</Label>
                <Textarea 
                  id="editContent"
                  value={editingEmail.textContent}
                  onChange={(e) => setEditingEmail({...editingEmail, textContent: e.target.value})}
                  rows={10}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEmail(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Save email changes
                  saveEmailChanges();
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit & Resend Email Dialog */}
      {resendingEmail && (
        <Dialog open={!!resendingEmail} onOpenChange={() => setResendingEmail(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Recipients & Resend</DialogTitle>
              <DialogDescription>
                Modify the email recipients and resend: {resendingEmail.subject}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTo">To (comma-separated)</Label>
                <Input
                  id="editTo"
                  value={resendEmailData.to.join(', ')}
                  onChange={(e) => setResendEmailData({
                    ...resendEmailData, 
                    to: e.target.value.split(',').map(email => email.trim()).filter(email => email)
                  })}
                  placeholder="recipient@example.com, another@example.com"
                />
              </div>
              <div>
                <Label htmlFor="editCc">CC (optional, comma-separated)</Label>
                <Input
                  id="editCc"
                  value={(resendEmailData.cc || []).join(', ')}
                  onChange={(e) => setResendEmailData({
                    ...resendEmailData, 
                    cc: e.target.value ? e.target.value.split(',').map(email => email.trim()).filter(email => email) : undefined
                  })}
                  placeholder="cc@example.com, another@example.com"
                />
              </div>
              <div>
                <Label htmlFor="editBcc">BCC (optional, comma-separated)</Label>
                <Input
                  id="editBcc"
                  value={(resendEmailData.bcc || []).join(', ')}
                  onChange={(e) => setResendEmailData({
                    ...resendEmailData, 
                    bcc: e.target.value ? e.target.value.split(',').map(email => email.trim()).filter(email => email) : undefined
                  })}
                  placeholder="bcc@example.com, another@example.com"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResendingEmail(null)}>
                  Cancel
                </Button>
                <Button onClick={handleResendWithEdits} disabled={resendEmailData.to.length === 0}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Action Confirmation Dialogs */}
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to perform this action on {selectedEmails.length} selected emails?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleBulkAction('approve')}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EmailQueueAdminPage() {
  return (
    <AdminAuthWrapper>
      <EmailQueueAdminContent />
    </AdminAuthWrapper>
  );
}