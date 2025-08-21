'use client';

import { useState, useEffect } from 'react';
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
  Seedling
} from "lucide-react";
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
  Seedling
};

export default function APIEndpointsPage() {
  const [endpoints, setEndpoints] = useState<APIEndpointDefinition[]>(ENDPOINTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const filteredEndpoints = endpoints.filter(endpoint => {
    const matchesSearch = endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         endpoint.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || endpoint.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const categoryCounts = {
    all: endpoints.length,
    public: endpoints.filter(e => e.category === 'public').length,
    admin: endpoints.filter(e => e.category === 'admin').length,
    embed: endpoints.filter(e => e.category === 'embed').length,
    data: endpoints.filter(e => e.category === 'data').length,
  };

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {endpoints.filter(e => e.enabled).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({categoryCounts.all})</TabsTrigger>
                <TabsTrigger value="public">Public ({categoryCounts.public})</TabsTrigger>
                <TabsTrigger value="admin">Admin ({categoryCounts.admin})</TabsTrigger>
                <TabsTrigger value="embed">Embed ({categoryCounts.embed})</TabsTrigger>
                <TabsTrigger value="data">Data ({categoryCounts.data})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Base URL Alert */}
      {baseUrl && (
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            <strong>Base URL:</strong> {baseUrl}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(baseUrl)}
              className="ml-2 h-6 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

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

      {/* Endpoints List */}
      <div className="space-y-4">
        {filteredEndpoints.map((endpoint) => {
          const IconComponent = iconMap[endpoint.icon as keyof typeof iconMap] || Settings;
          return (
            <Card key={endpoint.id} className={`transition-opacity ${endpoint.enabled ? 'opacity-100' : 'opacity-60'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/20 p-2">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {endpoint.name}
                        <Badge className={getMethodColor(endpoint.method)}>
                          {endpoint.method}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getCategoryIcon(endpoint.category)}
                          {endpoint.category}
                        </Badge>
                        {endpoint.requiresAuth && (
                          <Badge variant="outline" className="text-orange-600">
                            <Shield className="h-3 w-3 mr-1" />
                            Auth Required
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={endpoint.enabled}
                    onCheckedChange={() => toggleEndpoint(endpoint.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Path */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Endpoint URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                        {baseUrl}{endpoint.path}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(`${baseUrl}${endpoint.path}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Parameters */}
                  {endpoint.params && endpoint.params.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Parameters</label>
                      <div className="mt-1 space-y-2">
                        {endpoint.params.map((param, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <code className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {param.name}
                            </code>
                            <span className="text-gray-600">{param.type}</span>
                            {param.required && (
                              <Badge variant="outline" className="text-red-600 text-xs">required</Badge>
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
                      <label className="text-sm font-medium text-gray-600">Example</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                          {endpoint.example}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.example!)}
                        >
                          <Copy className="h-4 w-4" />
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
