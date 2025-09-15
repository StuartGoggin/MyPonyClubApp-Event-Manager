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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  FileText, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Copy,
  Eye,
  Download,
  RefreshCw
} from 'lucide-react';
import { NotificationRule, NotificationTrigger, NotificationDeliveryMethod, NotificationRecipientType, NotificationTemplate, NotificationConfig } from '@/lib/types';
import AdminAuthWrapper from '@/components/admin-auth-wrapper';

function NotificationConfigContent() {
  const { toast } = useToast();
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [testNotification, setTestNotification] = useState({ trigger: '', recipient: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Loading notification data from API...');
      
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer dev-admin-token'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load notification data');
      }

      const result = await response.json();
      console.log('Loaded data:', result);

      if (result.success && result.data) {
        if (result.data.config) {
          console.log('Setting config from API:', result.data.config);
          setConfig(result.data.config);
        } else {
          console.log('No config in API response, using default');
          setConfig(getDefaultConfig());
        }
        
        if (result.data.rules) {
          setRules(result.data.rules);
        } else {
          setRules(getDefaultRules());
        }
        
        if (result.data.templates) {
          setTemplates(result.data.templates);
        }
      } else {
        console.log('No data from API, using defaults');
        setConfig(getDefaultConfig());
        setRules(getDefaultRules());
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading notification data:', error);
      
      // Fall back to default data
      setConfig(getDefaultConfig());
      setRules(getDefaultRules());
      setTemplates([]);
      
      toast({
        title: "Load Warning",
        description: "Failed to load saved settings. Using defaults.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Add toast to dependency array

  // Get default configuration
  const getDefaultConfig = (): NotificationConfig => ({
    id: 'default',
    name: 'MyPonyClub Notifications',
    description: 'Event and system notification configuration',
    enabled: true,
    defaultFromEmail: 'noreply@myponyclub.com',
    defaultFromName: 'MyPonyClub Event Manager',
    replyToEmail: 'support@myponyclub.com',
    smsEnabled: false,
    superUsers: ['admin@myponyclub.com'],
    rules: [],
    templates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastModifiedBy: 'admin'
  });

  // Get default rules
  const getDefaultRules = (): NotificationRule[] => [
    {
      id: 'rule-event-request-submitted',
      name: 'Event Request Submitted',
      description: 'Notify relevant parties when a new event request is submitted',
      trigger: 'event_request_submitted',
      enabled: true,
      recipients: [
        { type: 'requester' },
        { type: 'zone_approver' },
        { type: 'super_admin' }
      ],
      deliveryMethods: ['email'],
      attachments: {
        includePDF: true,
        includeJSON: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastModifiedBy: 'system'
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save configuration settings
  const saveConfiguration = async () => {
    if (!config) return;
    
    console.log('Saving configuration:', config);
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-admin-token'
        },
        body: JSON.stringify({
          action: 'save-config',
          config
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      const result = await response.json();
      console.log('Save result:', result);

      toast({
        title: "Settings Saved",
        description: "Notification configuration has been saved successfully.",
        variant: "default"
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save notification configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!testNotification.trigger || !testNotification.recipient) {
      toast({
        title: "Test Failed",
        description: "Please select a trigger and enter a recipient email.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev-admin-token'
        },
        body: JSON.stringify({
          trigger: testNotification.trigger,
          testEmail: testNotification.recipient
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      toast({
        title: "Test Sent",
        description: `Test notification sent to ${testNotification.recipient}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test notification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notification configuration...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2">Failed to load notification configuration</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Configuration</h1>
          <p className="text-muted-foreground">
            Configure email notifications for event requests and system events
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Notification Rules</h2>
            <Button onClick={() => setIsCreatingRule(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>

          <div className="grid gap-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      {rule.enabled ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          // Toggle rule enabled state with feedback
                          const newEnabledState = !rule.enabled;
                          
                          try {
                            // Update local state immediately for better UX
                            const updatedRules = rules.map(r => 
                              r.id === rule.id ? { ...r, enabled: newEnabledState } : r
                            );
                            setRules(updatedRules);

                            // Show immediate feedback
                            toast({
                              title: "Rule Updated",
                              description: `"${rule.name}" has been ${newEnabledState ? 'enabled' : 'disabled'}.`,
                              variant: "default"
                            });

                            // TODO: Make API call to persist the change
                            // For now, just log the change
                            console.log(`Rule ${rule.id} ${newEnabledState ? 'enabled' : 'disabled'}`);
                          } catch (error) {
                            // Revert on error
                            const revertedRules = rules.map(r => 
                              r.id === rule.id ? { ...r, enabled: rule.enabled } : r
                            );
                            setRules(revertedRules);

                            toast({
                              title: "Update Failed",
                              description: "Failed to update rule status. Please try again.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        {rule.enabled ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Trigger</Label>
                      <p className="capitalize">{rule.trigger.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Recipients</Label>
                      <div className="flex gap-1 flex-wrap">
                        {rule.recipients.map((recipient, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {recipient.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Delivery</Label>
                      <div className="flex gap-1">
                        {rule.deliveryMethods.map((method) => (
                          <Badge key={method} variant="secondary" className="text-xs">
                            {method === 'email' && <Mail className="h-3 w-3 mr-1" />}
                            {method === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {config && (
            <Card>
              <CardHeader>
                <CardTitle>Global Notification Settings</CardTitle>
                <CardDescription>Configure system-wide notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">Master switch for all notifications</p>
                  </div>
                  <Switch 
                    checked={config.enabled} 
                    onCheckedChange={(checked) => {
                      setConfig({ ...config, enabled: checked });
                      setHasUnsavedChanges(true);
                      toast({
                        title: "Settings Updated",
                        description: `Notifications have been ${checked ? 'enabled' : 'disabled'}. Click "Save Settings" to persist changes.`,
                        variant: "default"
                      });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromEmail">Default From Email</Label>
                    <Input
                      id="fromEmail"
                      value={config.defaultFromEmail}
                      onChange={(e) => {
                        setConfig({ ...config, defaultFromEmail: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">Default From Name</Label>
                    <Input
                      id="fromName"
                      value={config.defaultFromName}
                      onChange={(e) => {
                        setConfig({ ...config, defaultFromName: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="replyTo">Reply-To Email</Label>
                  <Input
                    id="replyTo"
                    value={config.replyToEmail || ''}
                    onChange={(e) => {
                      setConfig({ ...config, replyToEmail: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="support@myponyclub.com"
                  />
                </div>

                <div>
                  <Label htmlFor="superUsers">Super User Email Addresses</Label>
                  <Textarea
                    id="superUsers"
                    value={config?.superUsers?.join('\n') || ''}
                    onChange={(e) => {
                      if (config) {
                        setConfig({ 
                          ...config, 
                          superUsers: e.target.value.split('\n').filter(email => email.trim()) 
                        });
                        setHasUnsavedChanges(true);
                      }
                    }}
                    placeholder="admin@myponyclub.com&#10;manager@myponyclub.com"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter one email address per line
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="text-base font-medium">Enable SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch 
                    checked={config.smsEnabled} 
                    onCheckedChange={(checked) => {
                      setConfig({ ...config, smsEnabled: checked });
                      setHasUnsavedChanges(true);
                      toast({
                        title: "SMS Settings Updated",
                        description: `SMS notifications have been ${checked ? 'enabled' : 'disabled'}. Click "Save Settings" to persist changes.`,
                        variant: "default"
                      });
                    }}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={saveConfiguration}
                    disabled={isSaving}
                    variant={hasUnsavedChanges ? "default" : "outline"}
                    className={hasUnsavedChanges ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {hasUnsavedChanges && <AlertTriangle className="mr-2 h-4 w-4" />}
                        {hasUnsavedChanges ? 'Save Settings*' : 'Save Settings'}
                      </>
                    )}
                  </Button>
                </div>
                {hasUnsavedChanges && (
                  <p className="text-sm text-orange-600 text-right mt-2">
                    * You have unsaved changes
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test & Preview Tab */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>Send test notifications to verify your configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testTrigger">Select Trigger</Label>
                  <Select 
                    value={testNotification.trigger} 
                    onValueChange={(value) => setTestNotification({ ...testNotification, trigger: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a notification trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_request_submitted">Event Request Submitted</SelectItem>
                      <SelectItem value="event_request_approved">Event Request Approved</SelectItem>
                      <SelectItem value="event_request_rejected">Event Request Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="testRecipient">Test Recipient Email</Label>
                  <Input
                    id="testRecipient"
                    type="email"
                    value={testNotification.recipient}
                    onChange={(e) => setTestNotification({ ...testNotification, recipient: e.target.value })}
                    placeholder="test@example.com"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={sendTestNotification}
                  disabled={!testNotification.trigger || !testNotification.recipient || isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Test Notification
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NotificationConfigPage() {
  return (
    <AdminAuthWrapper>
      <NotificationConfigContent />
    </AdminAuthWrapper>
  );
}