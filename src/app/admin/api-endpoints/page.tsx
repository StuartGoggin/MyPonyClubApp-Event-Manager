'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  Database, 
  Users, 
  Calendar, 
  MapPin, 
  Settings, 
  Download, 
  Upload, 
  Search,
  Copy,
  ExternalLink,
  Shield,
  Clock,
  Zap,
  FileText,
  CheckCircle,
  RefreshCw,
  Trash2,
  Sprout,
  Monitor,
  PlusCircle
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENDPOINTS, APIEndpointDefinition } from '@/lib/api-registry';

// Icon mapping for dynamic icon rendering
const iconMap = {
  Globe,
  Database,
  Users,
  Calendar,
  MapPin,
  Settings,
  Download,
  Upload,
  FileText,
  CheckCircle,
  RefreshCw,
  Trash2,
  Sprout,
  Monitor,
  PlusCircle
};

export default function APIEndpointsPage() {
  const [endpoints, setEndpoints] = useState<APIEndpointDefinition[]>(ENDPOINTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [baseUrl, setBaseUrl] = useState('');

  // Base URL options - memoized to prevent re-creation on every render
  const baseUrlOptions = useMemo(() => [
    { value: 'http://localhost:9002', label: 'Local Development' },
    { value: 'https://myponyclub.events', label: 'Production' },
    { value: 'https://myponyclubapp-events--ponyclub-events.asia-east1.hosted.app', label: 'Staging/Firebase' }
  ], []);

  useEffect(() => {
    // Set default to current origin if it matches one of our options, otherwise use localhost
    const currentOrigin = window.location.origin;
    const matchingOption = baseUrlOptions.find(option => option.value === currentOrigin);
    setBaseUrl(matchingOption ? currentOrigin : 'http://localhost:9002');
  }, [baseUrlOptions]);

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group filtered endpoints by category
  const groupedEndpoints = filteredEndpoints.reduce((groups, endpoint) => {
    const category = endpoint.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(endpoint);
    return groups;
  }, {} as Record<string, typeof endpoints>);

  // Sort categories to show pages first, then others alphabetically
  const sortedCategories = Object.keys(groupedEndpoints).sort((a, b) => {
    if (a === 'pages') return -1;
    if (b === 'pages') return 1;
    return a.localeCompare(b);
  });

  const toggleEndpoint = (endpointId: string) => {
    setEndpoints(prev => prev.map(endpoint => 
      endpoint.id === endpointId 
        ? { ...endpoint, enabled: !endpoint.enabled }
        : endpoint
    ));
    
    // Here you could also save the state to localStorage or an API
    // localStorage.setItem('api-endpoints-config', JSON.stringify(endpoints));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'embed': return <ExternalLink className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'pages': return <FileText className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'public': return 'border-blue-200 bg-blue-50';
      case 'admin': return 'border-purple-200 bg-purple-50';
      case 'embed': return 'border-orange-200 bg-orange-50';
      case 'data': return 'border-teal-200 bg-teal-50';
      case 'pages': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const categoryCounts = {
    all: endpoints.length,
    public: endpoints.filter(e => e.category === 'public').length,
    admin: endpoints.filter(e => e.category === 'admin').length,
    embed: endpoints.filter(e => e.category === 'embed').length,
    data: endpoints.filter(e => e.category === 'data').length,
    pages: endpoints.filter(e => e.category === 'pages').length,
  };

  const categories = [
    { key: 'all', name: 'All', icon: <Globe className="h-4 w-4" />, color: 'blue' },
    { key: 'pages', name: 'Pages', icon: <FileText className="h-4 w-4" />, color: 'green' },
    { key: 'public', name: 'Public APIs', icon: <Globe className="h-4 w-4" />, color: 'blue' },
    { key: 'admin', name: 'Admin APIs', icon: <Shield className="h-4 w-4" />, color: 'purple' },
    { key: 'embed', name: 'Embed APIs', icon: <ExternalLink className="h-4 w-4" />, color: 'orange' },
    { key: 'data', name: 'Data APIs', icon: <Database className="h-4 w-4" />, color: 'teal' },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/20 p-2">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">API Endpoints Manager</h1>
          <p className="text-muted-foreground">Manage and monitor all application endpoints</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Endpoints</p>
                <p className="text-2xl font-bold">{endpoints.length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pages</p>
                <p className="text-2xl font-bold text-green-600">
                  {endpoints.filter(e => e.category === 'pages').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Public APIs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {endpoints.filter(e => e.category === 'public').length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin APIs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {endpoints.filter(e => e.category === 'admin').length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {endpoints.filter(e => e.enabled).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All ({categoryCounts.all})</TabsTrigger>
                <TabsTrigger value="pages">Pages ({categoryCounts.pages})</TabsTrigger>
                <TabsTrigger value="public">Public ({categoryCounts.public})</TabsTrigger>
                <TabsTrigger value="admin">Admin ({categoryCounts.admin})</TabsTrigger>
                <TabsTrigger value="embed">Embed ({categoryCounts.embed})</TabsTrigger>
                <TabsTrigger value="data">Data ({categoryCounts.data})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Base URL Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <label className="text-sm font-medium">Base URL:</label>
            </div>
            <div className="flex-1 max-w-md">
              <Select value={baseUrl} onValueChange={setBaseUrl}>
                <SelectTrigger>
                  <SelectValue placeholder="Select base URL" />
                </SelectTrigger>
                <SelectContent>
                  {baseUrlOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.value}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(baseUrl)}
              className="h-8"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Update Instructions */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Auto-Update Instructions:</strong> When you create new endpoints, add them to the{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">ENDPOINTS</code> array in{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">src/lib/api-registry.ts</code>{' '}
          and they will automatically appear here.
        </AlertDescription>
      </Alert>

      {/* Grouped Endpoints/Pages List */}
      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const endpoints = groupedEndpoints[category];
          if (!endpoints || endpoints.length === 0) return null;
          
          const getCategoryTheme = (cat: string) => {
            switch (cat) {
              case 'pages':
                return { 
                  bg: 'bg-purple-50', 
                  border: 'border-purple-200', 
                  text: 'text-purple-900',
                  icon: 'text-purple-600'
                };
              case 'public':
                return { 
                  bg: 'bg-green-50', 
                  border: 'border-green-200', 
                  text: 'text-green-900',
                  icon: 'text-green-600'
                };
              case 'admin':
                return { 
                  bg: 'bg-blue-50', 
                  border: 'border-blue-200', 
                  text: 'text-blue-900',
                  icon: 'text-blue-600'
                };
              case 'embed':
                return { 
                  bg: 'bg-orange-50', 
                  border: 'border-orange-200', 
                  text: 'text-orange-900',
                  icon: 'text-orange-600'
                };
              case 'data':
                return { 
                  bg: 'bg-gray-50', 
                  border: 'border-gray-200', 
                  text: 'text-gray-900',
                  icon: 'text-gray-600'
                };
              default:
                return { 
                  bg: 'bg-gray-50', 
                  border: 'border-gray-200', 
                  text: 'text-gray-900',
                  icon: 'text-gray-600'
                };
            }
          };

          const theme = getCategoryTheme(category);

          return (
            <div key={category} className={`rounded-lg ${theme.bg} ${theme.border} border p-4`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`${theme.icon}`}>
                  {getCategoryIcon(category)}
                </div>
                <h3 className={`text-lg font-semibold ${theme.text} capitalize`}>
                  {category === 'pages' ? 'Application Pages' : `${category} APIs`}
                </h3>
                <Badge variant="secondary" className="ml-auto">
                  {endpoints.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {endpoints.map((endpoint) => {
                  const IconComponent = iconMap[endpoint.icon as keyof typeof iconMap] || Settings;
                  return (
                    <Card key={endpoint.id} className={`transition-opacity ${endpoint.enabled ? 'opacity-100' : 'opacity-60'} bg-white shadow-sm`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/20 p-2">
                              <IconComponent className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="flex items-center gap-2 text-sm">
                                {endpoint.name}
                                {!endpoint.isPage && (
                                  <Badge className={getMethodColor(endpoint.method)}>
                                    {endpoint.method}
                                  </Badge>
                                )}
                                {endpoint.isPage && (
                                  <Badge variant="outline" className="text-purple-600">
                                    <Monitor className="h-3 w-3 mr-1" />
                                    Page
                                  </Badge>
                                )}
                                {endpoint.requiresAuth && (
                                  <Badge variant="outline" className="text-orange-600">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Auth Required
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-xs">{endpoint.description}</CardDescription>
                            </div>
                          </div>
                          <Switch
                            checked={endpoint.enabled}
                            onCheckedChange={() => toggleEndpoint(endpoint.id)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Path */}
                          <div>
                            <label className="text-xs font-medium text-gray-600">
                              {endpoint.isPage ? 'Page URL' : 'Endpoint URL'}
                            </label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="flex-1 px-2 py-1.5 bg-gray-100 rounded text-xs font-mono">
                                {baseUrl}{endpoint.path}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`)}
                                title="Copy URL"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(`${baseUrl}${endpoint.path}`, '_blank')}
                                title={endpoint.isPage ? "Open page in new tab" : "Test endpoint in new tab"}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Parameters */}
                          {endpoint.params && endpoint.params.length > 0 && (
                            <div>
                              <label className="text-xs font-medium text-gray-600">Parameters</label>
                              <div className="mt-1 space-y-1">
                                {endpoint.params.map((param, index) => (
                                  <div key={index} className="flex items-center gap-2 text-xs">
                                    <code className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                      {param.name}
                                    </code>
                                    <span className="text-gray-600">{param.type}</span>
                                    {param.required && (
                                      <Badge variant="outline" className="text-red-600 text-xs h-4">required</Badge>
                                    )}
                                    <span className="text-gray-500">- {param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Example */}
                          {endpoint.example && (
                            <div>
                              <label className="text-xs font-medium text-gray-600">Example</label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="flex-1 px-2 py-1.5 bg-gray-100 rounded text-xs font-mono">
                                  {endpoint.example}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(endpoint.example!)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEndpoints.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
