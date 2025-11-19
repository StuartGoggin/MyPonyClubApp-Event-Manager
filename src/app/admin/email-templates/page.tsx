'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Edit, Eye, Mail, Plus, Save, Trash2, RefreshCw, FileText, Users, User, Shield } from 'lucide-react';
import { EmailTemplate, EmailTemplateType, EmailTemplateStatus, CreateEmailTemplateRequest, UpdateEmailTemplateRequest, EmailTemplateAttachmentSettings } from '@/lib/types-email-templates';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('content');

  const [formData, setFormData] = useState<CreateEmailTemplateRequest>({
    name: '',
    description: '',
    type: 'event-request-requester',
    content: {
      subject: '',
      htmlBody: '',
      textBody: '',
      previewText: '',
    },
    attachments: {
      eventRequestPdf: {
        id: 'event-request-pdf',
        name: 'Event Request PDF',
        type: 'pdf-form',
        description: 'PDF form containing the complete event request details',
        enabled: false,
        filename: 'Event_Request_{{referenceNumber}}.pdf',
      },
      eventDataJson: {
        id: 'event-data-json',
        name: 'Event Data Export',
        type: 'json-data',
        description: 'JSON export containing all event request data for processing',
        enabled: false,
        filename: 'Event_Data_{{referenceNumber}}.json',
      },
    },
  });

  const [filter, setFilter] = useState<{
    type?: EmailTemplateType;
    status?: EmailTemplateStatus;
    search?: string;
  }>({});

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter.type) params.append('type', filter.type);
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);

      const response = await fetch(`/api/admin/email-templates?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        console.error('Failed to fetch templates:', data.error);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const initializeTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates/initialize', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        fetchTemplates(); // Refresh the list
      } else {
        console.error('Failed to initialize templates:', data.error);
      }
    } catch (error) {
      console.error('Error initializing templates:', error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchTemplates();
      } else {
        console.error('Failed to create template:', data.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      const updateData: UpdateEmailTemplateRequest = {
        name: formData.name,
        description: formData.description,
        content: formData.content,
        attachments: formData.attachments,
      };

      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditDialogOpen(false);
        setSelectedTemplate(null);
        resetForm();
        fetchTemplates();
      } else {
        console.error('Failed to update template:', data.error);
      }
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchTemplates();
      } else {
        console.error('Failed to delete template:', data.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const previewTemplate = async (template: EmailTemplate) => {
    try {
      const sampleVariables = {
        requesterName: 'John Smith',
        requesterEmail: 'john.smith@example.com',
        requesterPhone: '0412 345 678',
        clubName: 'Melbourne Pony Club',
        clubId: 'club-melbourne',
        zoneName: 'Metropolitan Zone',
        zoneId: 'zone-metropolitan',
        submissionDate: new Date().toISOString(),
        referenceNumber: 'ER-20251109-001',
        events: [{
          priority: 1,
          name: 'Spring Championship',
          eventTypeName: 'Show Jumping',
          date: '2025-12-15',
          location: 'Melbourne Showgrounds',
          isQualifier: true,
          isHistoricallyTraditional: false,
          coordinatorName: 'Jane Doe',
          coordinatorContact: 'jane.doe@example.com',
          notes: 'This is a sample event for preview purposes'
        }],
        generalNotes: 'Sample general notes for preview',
        systemUrl: 'https://events.ponyclub.com.au',
        supportEmail: 'support@ponyclub.com.au',
        organizationName: 'Pony Club Australia',
        isForSuperUser: template.type === 'event-request-super-user',
        recipientName: 'Preview User',
        recipientRole: template.type.includes('zone-manager') ? 'Zone Manager' : 'User',
      };

      const response = await fetch('/api/admin/email-templates/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          variables: sampleVariables,
          recipientType: 'requester',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewContent(data.rendered);
        setIsPreviewOpen(true);
      } else {
        console.error('Failed to render template:', data.error);
      }
    } catch (error) {
      console.error('Error previewing template:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'event-request-requester',
      content: {
        subject: '',
        htmlBody: '',
        textBody: '',
        previewText: '',
      },
      attachments: {
        eventRequestPdf: {
          id: 'event-request-pdf',
          name: 'Event Request PDF',
          type: 'pdf-form',
          description: 'PDF form containing the complete event request details',
          enabled: false,
          filename: 'Event_Request_{{referenceNumber}}.pdf',
        },
        eventDataJson: {
          id: 'event-data-json',
          name: 'Event Data Export',
          type: 'json-data',
          description: 'JSON export containing all event request data for processing',
          enabled: false,
          filename: 'Event_Data_{{referenceNumber}}.json',
        },
      },
    });
  };

  const openEditDialog = (template: EmailTemplate, initialTab: string = 'content') => {
    setSelectedTemplate(template);
    
    // Handle legacy attachment format (convert old format to new format)
    let attachments = template.attachments;
    if (template.attachments && 'includePdf' in template.attachments) {
      // Legacy format - convert to new format
      attachments = {
        eventRequestPdf: {
          id: 'event-request-pdf',
          name: 'Event Request PDF',
          type: 'pdf-form',
          description: 'PDF form containing the complete event request details',
          enabled: (template.attachments as any).includePdf || false,
          filename: 'Event_Request_{{referenceNumber}}.pdf',
        },
        eventDataJson: {
          id: 'event-data-json',
          name: 'Event Data Export',
          type: 'json-data',
          description: 'JSON export containing all event request data for processing',
          enabled: (template.attachments as any).includeJsonExport || false,
          filename: 'Event_Data_{{referenceNumber}}.json',
        },
      } as EmailTemplateAttachmentSettings;
    }
    
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      content: template.content,
      attachments: attachments,
    });
    setActiveTab(initialTab);
    setIsEditDialogOpen(true);
  };

  const getTypeIcon = (type: EmailTemplateType) => {
    switch (type) {
      case 'event-request-requester':
        return <User className="h-4 w-4" />;
      case 'event-request-zone-manager':
        return <Users className="h-4 w-4" />;
      case 'event-request-club-admin':
        return <FileText className="h-4 w-4" />;
      case 'event-request-super-user':
        return <Shield className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: EmailTemplateType) => {
    switch (type) {
      case 'event-request-requester':
        return 'Event Requester';
      case 'event-request-zone-manager':
        return 'Zone Manager';
      case 'event-request-club-admin':
        return 'Club Admin';
      case 'event-request-super-user':
        return 'Super User';
      default:
        return type;
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (filter.type && template.type !== filter.type) return false;
    if (filter.status && template.status !== filter.status) return false;
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      return (
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage email templates for event request notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={initializeTemplates} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Initialize/Update Templates
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setActiveTab('content')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
                <DialogDescription>
                  Create a new email template for event request notifications
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter template name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Template Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as EmailTemplateType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event-request-requester">Event Requester</SelectItem>
                        <SelectItem value="event-request-zone-manager">Zone Manager</SelectItem>
                        <SelectItem value="event-request-club-admin">Club Admin</SelectItem>
                        <SelectItem value="event-request-super-user">Super User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose of this template"
                  />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList>
                    <TabsTrigger value="content">Email Content</TabsTrigger>
                    <TabsTrigger value="attachments">Attachments</TabsTrigger>
                    <TabsTrigger value="variables">Variables</TabsTrigger>
                  </TabsList>

                  <TabsContent value="content" className="space-y-4">
                    <div>
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={formData.content.subject}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, subject: e.target.value }
                        })}
                        placeholder="Event Request"
                      />
                    </div>

                    <div>
                      <Label htmlFor="previewText">Preview Text (optional)</Label>
                      <Input
                        id="previewText"
                        value={formData.content.previewText || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, previewText: e.target.value }
                        })}
                        placeholder="Preview text shown in email clients"
                      />
                    </div>

                    <div>
                      <Label htmlFor="htmlBody">HTML Content</Label>
                      <Textarea
                        id="htmlBody"
                        value={formData.content.htmlBody}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, htmlBody: e.target.value }
                        })}
                        placeholder="HTML email content with variables"
                        rows={10}
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="textBody">Plain Text Content</Label>
                      <Textarea
                        id="textBody"
                        value={formData.content.textBody}
                        onChange={(e) => setFormData({
                          ...formData,
                          content: { ...formData.content, textBody: e.target.value }
                        })}
                        placeholder="Plain text email content with variables"
                        rows={8}
                        className="font-mono"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="attachments" className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Email Attachments</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Configure which files to attach to emails sent using this template
                      </p>
                      

                      
                      <div className="space-y-4">
                        {/* PDF Form Attachment */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="attach-pdf"
                              title="Include PDF attachment"
                              checked={formData.attachments?.eventRequestPdf?.enabled || false}
                              onChange={(e) => {
                                const newFormData = {
                                  ...formData,
                                  attachments: {
                                    ...formData.attachments,
                                    eventRequestPdf: {
                                      id: 'event-request-pdf',
                                      name: 'Event Request PDF',
                                      type: 'pdf-form' as const,
                                      description: 'PDF form containing the complete event request details',
                                      enabled: e.target.checked,
                                      filename: formData.attachments?.eventRequestPdf?.filename || 'Event_Request_{{referenceNumber}}.pdf',
                                    }
                                  }
                                };
                                setFormData(newFormData);
                              }}
                              className="rounded"
                            />
                            <div>
                              <Label htmlFor="attach-pdf" className="font-medium">Event Request PDF</Label>
                              <p className="text-xs text-muted-foreground">
                                Formatted PDF containing all event request information
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">PDF</Badge>
                        </div>

                        {/* JSON Data Export Attachment */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                const currentEnabled = formData.attachments?.eventDataJson?.enabled || false;
                                const newEnabled = !currentEnabled;
                                
                                const newFormData = {
                                  ...formData,
                                  attachments: {
                                    ...formData.attachments,
                                    eventDataJson: {
                                      id: 'event-data-json',
                                      name: 'Event Data Export',
                                      type: 'json-data' as const,
                                      description: 'JSON export containing all event request data for processing',
                                      enabled: newEnabled,
                                      filename: formData.attachments?.eventDataJson?.filename || 'Event_Data_{{referenceNumber}}.json',
                                    }
                                  }
                                };
                                
                                setFormData(newFormData);
                              }}
                              className={`w-4 h-4 border-2 ${
                                formData.attachments?.eventDataJson?.enabled 
                                ? 'bg-blue-500 border-blue-500' 
                                : 'bg-white border-gray-300'
                              }`}
                            >
                              {formData.attachments?.eventDataJson?.enabled && '✓'}
                            </button>
                            <div>
                              <Label htmlFor="attach-json" className="font-medium">Event Data JSON</Label>
                              <p className="text-xs text-muted-foreground">
                                Machine-readable data export for system integration
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">JSON</Badge>
                        </div>

                        {/* Attachment Filename Customization */}
                        {(formData.attachments?.eventRequestPdf?.enabled || formData.attachments?.eventDataJson?.enabled) && (
                          <div className="mt-4 p-3 border border-blue-200 rounded-lg bg-blue-50/50">
                            <h5 className="font-medium mb-2">Attachment Settings</h5>
                            
                            {formData.attachments?.eventRequestPdf?.enabled && (
                              <div className="mb-3">
                                <Label htmlFor="pdf-filename" className="text-sm">PDF Filename Template</Label>
                                <Input
                                  id="pdf-filename"
                                  value={formData.attachments?.eventRequestPdf?.filename || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    attachments: {
                                      ...formData.attachments,
                                      eventRequestPdf: {
                                        ...formData.attachments?.eventRequestPdf!,
                                        filename: e.target.value
                                      }
                                    }
                                  })}
                                  placeholder="Event_Request_{{referenceNumber}}.pdf"
                                  className="text-sm"
                                />
                              </div>
                            )}
                            
                            {formData.attachments?.eventDataJson?.enabled && (
                              <div>
                                <Label htmlFor="json-filename" className="text-sm">JSON Filename Template</Label>
                                <Input
                                  id="json-filename"
                                  value={formData.attachments?.eventDataJson?.filename || ''}
                                  onChange={(e) => setFormData({
                                    ...formData,
                                    attachments: {
                                      ...formData.attachments,
                                      eventDataJson: {
                                        ...formData.attachments?.eventDataJson!,
                                        filename: e.target.value
                                      }
                                    }
                                  })}
                                  placeholder="Event_Data_{{referenceNumber}}.json"
                                  className="text-sm"
                                />
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground mt-2">
                              Use variables like {'{{referenceNumber}}'}, {'{{clubName}}'}, etc. in filenames
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="variables" className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Available Variables</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Use these variables in your email content by wrapping them in double curly braces, e.g., {'{{requesterName}}'}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><code>{'{{requesterName}}'}</code> - Person who submitted request</div>
                        <div><code>{'{{requesterEmail}}'}</code> - Requester&apos;s email</div>
                        <div><code>{'{{clubName}}'}</code> - Club name</div>
                        <div><code>{'{{zoneName}}'}</code> - Zone name</div>
                        <div><code>{'{{referenceNumber}}'}</code> - Unique reference</div>
                        <div><code>{'{{submissionDate}}'}</code> - Submission date</div>
                        <div><code>{'{{systemUrl}}'}</code> - System website URL</div>
                        <div><code>{'{{supportEmail}}'}</code> - Support contact email</div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="font-medium text-sm">Event Loop:</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Use <code>{'{{#each events}}...{{/each}}'}</code> to loop through events
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><code>{'{{name}}'}</code> - Event name</div>
                          <div><code>{'{{date}}'}</code> - Event date</div>
                          <div><code>{'{{location}}'}</code> - Event location</div>
                          <div><code>{'{{priority}}'}</code> - Event priority</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search templates..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select
                value={filter.type || 'all'}
                onValueChange={(value) => setFilter({ ...filter, type: value === 'all' ? undefined : value as EmailTemplateType })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="event-request-requester">Event Requester</SelectItem>
                  <SelectItem value="event-request-zone-manager">Zone Manager</SelectItem>
                  <SelectItem value="event-request-club-admin">Club Admin</SelectItem>
                  <SelectItem value="event-request-super-user">Super User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filter.status || 'all'}
                onValueChange={(value) => setFilter({ ...filter, status: value === 'all' ? undefined : value as EmailTemplateStatus })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">Loading templates...</div>
        ) : filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No templates found.</p>
              <Button onClick={initializeTemplates} variant="outline" className="mt-2">
                Initialize Default Templates
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(template.type)}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {template.isDefault && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                      {template.status}
                    </Badge>
                    <Badge variant="outline">
                      {getTypeLabel(template.type)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p>Version {template.version} • Created {new Date(template.createdAt).toLocaleDateString()}</p>
                    <p>Last modified by {template.lastModifiedBy}</p>
                  </div>
                  
                  {/* Attachment Status */}
                  {template.attachments && (
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground">Attachments:</span>
                      {(() => {
                        // Handle both legacy and new attachment formats
                        const hasLegacyPdf = 'includePdf' in template.attachments && (template.attachments as any).includePdf;
                        const hasLegacyJson = 'includeJsonExport' in template.attachments && (template.attachments as any).includeJsonExport;
                        const hasNewPdf = template.attachments.eventRequestPdf?.enabled;
                        const hasNewJson = template.attachments.eventDataJson?.enabled;
                        
                        const hasPdf = hasLegacyPdf || hasNewPdf;
                        const hasJson = hasLegacyJson || hasNewJson;
                        
                        return (
                          <>
                            {hasPdf && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                PDF Form
                              </Badge>
                            )}
                            {hasJson && (
                              <Badge variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                JSON Data
                              </Badge>
                            )}
                            {!hasPdf && !hasJson && (
                              <Badge variant="secondary" className="text-xs">
                                No attachments
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => previewTemplate(template)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(template, 'attachments')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Attachments
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(template, 'content')}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={template.isDefault}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Email Template</DialogTitle>
            <DialogDescription>
              Modify the email template content and settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Template Type</Label>
                <Input value={getTypeLabel(formData.type)} disabled />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="content">Email Content</TabsTrigger>
                <TabsTrigger value="attachments">Attachments</TabsTrigger>
                <TabsTrigger value="variables">Variables</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="edit-subject">Subject Line</Label>
                  <Input
                    id="edit-subject"
                    value={formData.content.subject}
                    onChange={(e) => setFormData({
                      ...formData,
                      content: { ...formData.content, subject: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-htmlBody">HTML Content</Label>
                  <Textarea
                    id="edit-htmlBody"
                    value={formData.content.htmlBody}
                    onChange={(e) => setFormData({
                      ...formData,
                      content: { ...formData.content, htmlBody: e.target.value }
                    })}
                    rows={10}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-textBody">Plain Text Content</Label>
                  <Textarea
                    id="edit-textBody"
                    value={formData.content.textBody}
                    onChange={(e) => setFormData({
                      ...formData,
                      content: { ...formData.content, textBody: e.target.value }
                    })}
                    rows={8}
                    className="font-mono"
                  />
                </div>
              </TabsContent>

              <TabsContent value="attachments" className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Email Attachments</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Configure which files to attach to emails sent using this template
                  </p>
                  

                  
                  <div className="space-y-4">
                    {/* PDF Form Attachment */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="edit-attach-pdf"
                          title="Include PDF attachment"
                          checked={formData.attachments?.eventRequestPdf?.enabled || false}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              attachments: {
                                ...formData.attachments,
                                eventRequestPdf: {
                                  ...formData.attachments?.eventRequestPdf,
                                  id: 'event-request-pdf',
                                  name: 'Event Request PDF',
                                  type: 'pdf-form' as const,
                                  description: 'PDF form containing the complete event request details',
                                  filename: 'Event_Request_{{referenceNumber}}.pdf',
                                  enabled: e.target.checked
                                }
                              }
                            });
                          }}
                          className="rounded"
                        />
                        <div>
                          <Label htmlFor="edit-attach-pdf" className="font-medium">Event Request PDF</Label>
                          <p className="text-xs text-muted-foreground">
                            Formatted PDF containing all event request information
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">PDF</Badge>
                    </div>

                    {/* JSON Data Export Attachment */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="edit-attach-json"
                          title="Include JSON attachment"
                          checked={formData.attachments?.eventDataJson?.enabled || false}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              attachments: {
                                ...formData.attachments,
                                eventDataJson: {
                                  ...formData.attachments?.eventDataJson,
                                  id: 'event-data-json',
                                  name: 'Event Data Export',
                                  type: 'json-data' as const,
                                  description: 'JSON export containing all event request data for processing',
                                  filename: 'Event_Data_{{referenceNumber}}.json',
                                  enabled: e.target.checked
                                }
                              }
                            });
                          }}
                          className="rounded"
                        />
                        <div>
                          <Label htmlFor="edit-attach-json" className="font-medium">Event Data JSON</Label>
                          <p className="text-xs text-muted-foreground">
                            Machine-readable data export for system integration
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">JSON</Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="space-y-4">
                {selectedTemplate && (
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Template Variables</h4>
                    <div className="space-y-2">
                      {selectedTemplate.variables.map((variable, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-background rounded border">
                          <div>
                            <code className="text-sm">{`{{${variable.key}}}`}</code>
                            <p className="text-xs text-muted-foreground">{variable.description}</p>
                          </div>
                          <Badge variant={variable.required ? 'default' : 'secondary'}>
                            {variable.required ? 'Required' : 'Optional'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTemplate}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              Preview how the email will appear to recipients
            </DialogDescription>
          </DialogHeader>

          {previewContent && (
            <div className="space-y-4">
              <div>
                <Label>Subject Line</Label>
                <div className="p-3 bg-muted rounded border">
                  {previewContent.subject}
                </div>
              </div>

              <Tabs defaultValue="html" className="w-full">
                <TabsList>
                  <TabsTrigger value="html">HTML Preview</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                </TabsList>

                <TabsContent value="html">
                  <div className="border rounded overflow-hidden">
                    <div 
                      dangerouslySetInnerHTML={{ __html: previewContent.html }}
                      className="p-4 bg-white font-sans"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="text">
                  <ScrollArea className="h-96 w-full border rounded p-4 font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{previewContent.text}</pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}