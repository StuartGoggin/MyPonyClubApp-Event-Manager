/**
 * API Endpoint Registry
 * 
 * This file maintains a registry of all API endpoints in the application.
 * When new endpoints are created, they should be added to this registry.
 * 
 * To add a new endpoint:
 * 1. Add the endpoint definition to the ENDPOINTS array below
 * 2. The endpoint will automatically appear in the Admin API Endpoints page
 * 3. Enable/disable functionality will be available through the admin interface
 */

export interface APIEndpointDefinition {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  category: 'public' | 'admin' | 'embed' | 'data';
  name: string;
  description: string;
  enabled: boolean;
  requiresAuth: boolean;
  rateLimit?: number;
  params?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  example?: string;
  icon: string; // Icon name from lucide-react
}

export const ENDPOINTS: APIEndpointDefinition[] = [
  // Public API Endpoints
  {
    id: 'zones-get',
    path: '/api/zones',
    method: 'GET',
    category: 'public',
    name: 'Get Zones',
    description: 'Retrieve all pony club zones with their details',
    enabled: true,
    requiresAuth: false,
    icon: 'MapPin',
    example: 'GET /api/zones'
  },
  {
    id: 'clubs-get',
    path: '/api/clubs',
    method: 'GET',
    category: 'public',
    name: 'Get Clubs',
    description: 'Retrieve all pony clubs with optional zone filtering',
    enabled: true,
    requiresAuth: false,
    icon: 'Users',
    params: [
      { name: 'zone', type: 'string', required: false, description: 'Filter by zone ID' }
    ],
    example: 'GET /api/clubs?zone=zone-1'
  },
  {
    id: 'events-get',
    path: '/api/events',
    method: 'GET',
    category: 'public',
    name: 'Get Events',
    description: 'Retrieve all events with comprehensive filtering options',
    enabled: true,
    requiresAuth: false,
    icon: 'Calendar',
    params: [
      { name: 'upcoming', type: 'boolean', required: false, description: 'Show only upcoming events' },
      { name: 'club', type: 'string', required: false, description: 'Filter by club ID' },
      { name: 'zone', type: 'string', required: false, description: 'Filter by zone ID' },
      { name: 'status', type: 'string', required: false, description: 'Filter by approval status' }
    ],
    example: 'GET /api/events?upcoming=true&zone=zone-1&status=approved'
  },
  {
    id: 'event-types-get',
    path: '/api/event-types',
    method: 'GET',
    category: 'public',
    name: 'Get Event Types',
    description: 'Retrieve all available event types and categories',
    enabled: true,
    requiresAuth: false,
    icon: 'Calendar',
    example: 'GET /api/event-types'
  },
  {
    id: 'event-details',
    path: '/api/events/[id]',
    method: 'GET',
    category: 'public',
    name: 'Get Event Details',
    description: 'Retrieve detailed information for a specific event',
    enabled: true,
    requiresAuth: false,
    icon: 'FileText',
    params: [
      { name: 'id', type: 'string', required: true, description: 'Event ID' }
    ],
    example: 'GET /api/events/event-123'
  },

  // Embed Endpoints
  {
    id: 'embed-calendar-full',
    path: '/embed/calendar',
    method: 'GET',
    category: 'embed',
    name: 'Embed Calendar (Full)',
    description: 'Full-featured calendar view optimized for iframe embedding',
    enabled: true,
    requiresAuth: false,
    icon: 'Globe',
    example: '<iframe src="/embed/calendar" width="800" height="600"></iframe>'
  },
  {
    id: 'embed-calendar-compact',
    path: '/embed/calendar/compact',
    method: 'GET',
    category: 'embed',
    name: 'Embed Calendar (Compact)',
    description: 'Compact calendar view for smaller embedding spaces',
    enabled: true,
    requiresAuth: false,
    icon: 'Globe',
    example: '<iframe src="/embed/calendar/compact" width="400" height="400"></iframe>'
  },
  {
    id: 'embed-api-calendar',
    path: '/api/embed/calendar',
    method: 'GET',
    category: 'embed',
    name: 'Embed Calendar API',
    description: 'Calendar data API with JSON and iCal export formats',
    enabled: true,
    requiresAuth: false,
    icon: 'Database',
    params: [
      { name: 'format', type: 'string', required: false, description: 'Response format: json or ical' },
      { name: 'upcoming', type: 'boolean', required: false, description: 'Filter to upcoming events only' },
      { name: 'limit', type: 'number', required: false, description: 'Maximum number of events to return' },
      { name: 'zone', type: 'string', required: false, description: 'Filter by zone name or ID' }
    ],
    example: 'GET /api/embed/calendar?format=ical&upcoming=true&limit=10'
  },

  // Admin Management Endpoints
  {
    id: 'admin-geolocate-club',
    path: '/api/admin/geolocate-club',
    method: 'POST',
    category: 'admin',
    name: 'Geolocate Club',
    description: 'Find geographic coordinates for a club using Google Maps',
    enabled: true,
    requiresAuth: true,
    icon: 'MapPin',
    params: [
      { name: 'clubId', type: 'string', required: true, description: 'Unique club identifier' },
      { name: 'clubName', type: 'string', required: true, description: 'Club name for search' },
      { name: 'existingAddress', type: 'string', required: false, description: 'Known club address' }
    ],
    example: 'POST /api/admin/geolocate-club'
  },
  {
    id: 'admin-update-club-location',
    path: '/api/admin/update-club-location',
    method: 'POST',
    category: 'admin',
    name: 'Update Club Location',
    description: 'Update club geographic coordinates and address information',
    enabled: true,
    requiresAuth: true,
    icon: 'MapPin',
    params: [
      { name: 'clubId', type: 'string', required: true, description: 'Club ID to update' },
      { name: 'latitude', type: 'number', required: true, description: 'Latitude coordinate' },
      { name: 'longitude', type: 'number', required: true, description: 'Longitude coordinate' },
      { name: 'address', type: 'string', required: false, description: 'Formatted address' }
    ],
    example: 'POST /api/admin/update-club-location'
  },
  {
    id: 'admin-debug-env',
    path: '/api/admin/debug-env',
    method: 'GET',
    category: 'admin',
    name: 'Debug Environment',
    description: 'Check environment variables and system configuration',
    enabled: true,
    requiresAuth: true,
    icon: 'Settings',
    example: 'GET /api/admin/debug-env'
  },

  // Data Management Endpoints
  {
    id: 'admin-export-data',
    path: '/api/admin/export-data',
    method: 'GET',
    category: 'data',
    name: 'Export All Data',
    description: 'Export complete system data as JSON for backup',
    enabled: true,
    requiresAuth: true,
    icon: 'Download',
    example: 'GET /api/admin/export-data'
  },
  {
    id: 'admin-export-events',
    path: '/api/admin/export-events',
    method: 'GET',
    category: 'data',
    name: 'Export Events',
    description: 'Export events data with club and zone information',
    enabled: true,
    requiresAuth: true,
    icon: 'Download',
    example: 'GET /api/admin/export-events'
  },
  {
    id: 'admin-clubs-export',
    path: '/api/admin/clubs/export',
    method: 'GET',
    category: 'data',
    name: 'Export Clubs',
    description: 'Export clubs data with complete details as JSON',
    enabled: true,
    requiresAuth: true,
    icon: 'Download',
    example: 'GET /api/admin/clubs/export'
  },
  {
    id: 'admin-clubs-import',
    path: '/api/admin/clubs/import',
    method: 'POST',
    category: 'data',
    name: 'Import Clubs',
    description: 'Import clubs data from JSON file upload',
    enabled: true,
    requiresAuth: true,
    icon: 'Upload',
    example: 'POST /api/admin/clubs/import'
  },
  {
    id: 'admin-zones-export',
    path: '/api/admin/zones/export',
    method: 'GET',
    category: 'data',
    name: 'Export Zones',
    description: 'Export zones data with configuration as JSON',
    enabled: true,
    requiresAuth: true,
    icon: 'Download',
    example: 'GET /api/admin/zones/export'
  },
  {
    id: 'admin-zones-import',
    path: '/api/admin/zones/import',
    method: 'POST',
    category: 'data',
    name: 'Import Zones',
    description: 'Import zones data from JSON file upload',
    enabled: true,
    requiresAuth: true,
    icon: 'Upload',
    example: 'POST /api/admin/zones/import'
  },
  {
    id: 'admin-event-types-export',
    path: '/api/admin/event-types/export',
    method: 'GET',
    category: 'data',
    name: 'Export Event Types',
    description: 'Export event types and categories as JSON',
    enabled: true,
    requiresAuth: true,
    icon: 'Download',
    example: 'GET /api/admin/event-types/export'
  },
  {
    id: 'admin-event-types-import',
    path: '/api/admin/event-types/import',
    method: 'POST',
    category: 'data',
    name: 'Import Event Types',
    description: 'Import event types data from JSON file upload',
    enabled: true,
    requiresAuth: true,
    icon: 'Upload',
    example: 'POST /api/admin/event-types/import'
  },
  {
    id: 'admin-seed-database',
    path: '/api/admin/seed-database',
    method: 'POST',
    category: 'data',
    name: 'Seed Database',
    description: 'Initialize database with comprehensive sample data',
    enabled: true,
    requiresAuth: true,
    icon: 'Database',
    example: 'POST /api/admin/seed-database'
  },
  {
    id: 'admin-purge-database',
    path: '/api/admin/purge-database',
    method: 'DELETE',
    category: 'data',
    name: 'Purge Database',
    description: 'Remove all data from database (DANGER - IRREVERSIBLE)',
    enabled: false,
    requiresAuth: true,
    icon: 'Database',
    example: 'DELETE /api/admin/purge-database'
  },

  // Additional Admin Endpoints
  {
    id: 'admin-load-clubzone-data',
    path: '/api/admin/load-clubzone-data',
    method: 'POST',
    category: 'admin',
    name: 'Load Club Zone Data',
    description: 'Load and process club zone data from external sources',
    enabled: true,
    requiresAuth: true,
    icon: 'RefreshCw',
    example: 'POST /api/admin/load-clubzone-data'
  },
  {
    id: 'admin-cleanup-duplicates',
    path: '/api/admin/cleanup-duplicates',
    method: 'POST',
    category: 'admin',
    name: 'Cleanup Duplicates',
    description: 'Remove duplicate entries from database',
    enabled: true,
    requiresAuth: true,
    icon: 'Trash2',
    example: 'POST /api/admin/cleanup-duplicates'
  },
  {
    id: 'admin-test-firebase',
    path: '/api/admin/test-firebase',
    method: 'GET',
    category: 'admin',
    name: 'Test Firebase',
    description: 'Test Firebase connection and configuration',
    enabled: true,
    requiresAuth: true,
    icon: 'Database',
    example: 'GET /api/admin/test-firebase'
  },

  // Event Management
  {
    id: 'event-status-update',
    path: '/api/events/[id]/status',
    method: 'PUT',
    category: 'admin',
    name: 'Update Event Status',
    description: 'Update event approval status',
    enabled: true,
    requiresAuth: true,
    icon: 'CheckCircle',
    params: [
      { name: 'id', type: 'string', required: true, description: 'Event ID' },
      { name: 'status', type: 'string', required: true, description: 'New status: approved, pending, or rejected' }
    ],
    example: 'PUT /api/events/event-123/status'
  },

  // Seed Data
  {
    id: 'seed-data',
    path: '/api/seed',
    method: 'GET',
    category: 'data',
    name: 'Seed Data',
    description: 'Get initial seed data for application setup',
    enabled: true,
    requiresAuth: false,
    icon: 'Sprout',
    example: 'GET /api/seed'
  }
];

/**
 * Get endpoint by ID
 */
export function getEndpointById(id: string): APIEndpointDefinition | undefined {
  return ENDPOINTS.find(endpoint => endpoint.id === id);
}

/**
 * Get endpoints by category
 */
export function getEndpointsByCategory(category: string): APIEndpointDefinition[] {
  return ENDPOINTS.filter(endpoint => endpoint.category === category);
}

/**
 * Get enabled endpoints
 */
export function getEnabledEndpoints(): APIEndpointDefinition[] {
  return ENDPOINTS.filter(endpoint => endpoint.enabled);
}

/**
 * Get disabled endpoints
 */
export function getDisabledEndpoints(): APIEndpointDefinition[] {
  return ENDPOINTS.filter(endpoint => !endpoint.enabled);
}

/**
 * Check if endpoint is enabled
 */
export function isEndpointEnabled(path: string, method: string): boolean {
  const endpoint = ENDPOINTS.find(e => e.path === path && e.method === method);
  return endpoint ? endpoint.enabled : true; // Default to enabled if not found
}
