import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MapPin, FileText, AlertTriangle, CheckCircle, Clock, Map } from 'lucide-react';
import Link from 'next/link';
import { getAllZones, getAllClubs, getAllEventTypes } from '@/lib/server-data';
import { getDatabaseErrorMessage, isDatabaseConnected } from '@/lib/firebase-admin';

async function AdminDashboardContent() {
  // Check database connection
  const isDatabaseAvailable = isDatabaseConnected();
  const databaseErrorMessage = getDatabaseErrorMessage();
  
  // Use server data instead of mock data
  const clubs = await getAllClubs();
  const zones = await getAllZones();
  const eventTypes = await getAllEventTypes();

  // Mock events for demo (this would eventually come from database too)
  const events = [
    {
      id: 'event-1',
      name: 'Spring Rally',
      date: new Date('2025-09-15'),
      clubId: 'club-melbourne',
      eventTypeId: 'event-type-rally',
      status: 'proposed',
      location: 'Melbourne Pony Club Grounds',
      source: 'zone',
      coordinatorName: 'Jane Smith',
      coordinatorContact: 'jane@email.com',
      isQualifier: true,
      notes: 'This is our annual spring rally with jumping and dressage competitions.'
    },
    {
      id: 'event-2',
      name: 'Monthly ODE',
      date: new Date('2025-08-22'),
      clubId: 'club-geelong',
      eventTypeId: 'event-type-ode',
      status: 'approved',
      location: 'Geelong Pony Club',
      source: 'zone',
      coordinatorName: 'Bob Johnson',
      coordinatorContact: 'bob@email.com'
    },
    {
      id: 'event-3',
      name: 'Winter Training Day',
      date: new Date('2025-07-10'),
      clubId: 'club-ballarat',
      eventTypeId: 'event-type-training',
      status: 'rejected',
      location: 'Ballarat Pony Club',
      source: 'zone',
      coordinatorName: 'Sarah Wilson',
      coordinatorContact: 'sarah@email.com',
      notes: 'Rejected due to conflict with existing event in the area.'
    }
  ];

  // Calculate statistics
  const pendingEvents = events.filter(e => e.status === 'proposed').length;
  const approvedEvents = events.filter(e => e.status === 'approved').length;
  const rejectedEvents = events.filter(e => e.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Glass Header Panel */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-2xl opacity-20 blur-lg animate-pulse"></div>
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border-2 border-primary/40 backdrop-blur-sm">
                <svg className="h-8 w-8 text-primary drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                Manage zones, clubs, events, and system configuration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Warning */}
      {!isDatabaseAvailable && databaseErrorMessage && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 via-amber-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-orange-950/20 shadow-xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-orange-400/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/50 p-2 border border-amber-200 dark:border-amber-700">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                  Database Connection Issue
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {databaseErrorMessage} Data shown below may be incomplete or cached.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Events"
          value={pendingEvents}
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <StatsCard
          title="Approved Events"
          value={approvedEvents}
          icon={<CheckCircle className="h-4 w-4" />}
          variant="success"
        />
        <StatsCard
          title="Total Clubs"
          value={clubs.length}
          icon={<Users className="h-4 w-4" />}
          variant="default"
        />
        <StatsCard
          title="Total Zones"
          value={zones.length}
          icon={<MapPin className="h-4 w-4" />}
          variant="default"
        />
      </div>

      {/* System Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-blue/5 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-3 border border-blue-200 dark:border-blue-700">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">System Configuration</h3>
                <p className="text-sm text-muted-foreground">Manage core system settings and data</p>
              </div>
            </div>
            <div className="space-y-4">
              <ConfigItem
                label="Zones"
                value={`${zones.length} zones configured`}
                href="/admin/zones"
                isConfigured={zones.length > 0}
              />
              <ConfigItem
                label="Clubs"
                value={`${clubs.length} clubs registered`}
                href="/admin/clubs"
                isConfigured={clubs.length > 0}
              />
              <ConfigItem
                label="Event Types"
                value={`${eventTypes.length} event types available`}
                href="/admin/event-types"
                isConfigured={eventTypes.length > 0}
              />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-emerald/5 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-3 border border-emerald-200 dark:border-emerald-700">
                <MapPin className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Zones Overview</h3>
                <p className="text-sm text-muted-foreground">Quick view of zone configuration</p>
              </div>
            </div>
            <div className="space-y-4">
              {zones.slice(0, 5).map(zone => (
                <div key={zone.id} className="relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-r from-background/80 to-background/60 backdrop-blur-sm p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-base text-foreground">{zone.name}</div>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
                          {zone.eventApprovers?.length || 0} Event Approvers
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
                          {zone.scheduleApprovers?.length || 0} Schedule Approvers
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="relative bg-background/80 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-300 transition-all duration-300">
                      <Link href="/admin/zones">
                        <MapPin className="h-3 w-3 mr-1" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {zones.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="rounded-2xl bg-muted/20 p-4 mb-4 inline-block">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  </div>
                  <p className="font-medium">No zones configured</p>
                  <p className="text-sm">Add zones to organize your pony clubs</p>
                  <Button asChild size="sm" className="mt-4 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm">
                    <Link href="/admin/zones">Get Started</Link>
                  </Button>
                </div>
              )}
              {zones.length > 5 && (
                <div className="text-center pt-4 border-t border-border/30">
                  <Button asChild variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
                    <Link href="/admin/zones">View All {zones.length} Zones</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Tools Section */}
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-purple/5 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple/10 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
              <Map className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Admin Tools</h3>
              <p className="text-sm text-muted-foreground">Advanced tools for data management and system maintenance</p>
            </div>
          </div>
          <div className="space-y-4">
            <ConfigItem
              label="Club Geolocation"
              value="Use Google Maps to find and set club locations"
              href="/admin/geolocate-clubs"
              isConfigured={true}
            />
            <ConfigItem
              label="API Endpoints"
              value="Manage and monitor all application endpoints"
              href="/admin/api-endpoints"
              isConfigured={true}
            />
            <ConfigItem
              label="Database Seed"
              value="Initialize the database with sample data"
              href="/admin/seed"
              isConfigured={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'warning' | 'destructive';
}

function StatsCard({ title, value, icon, variant }: StatsCardProps) {
  const variantStyles = {
    default: 'from-blue-50/80 to-cyan-50/60 dark:from-blue-950/40 dark:to-cyan-950/30 border-blue-200/50 dark:border-blue-800/50',
    success: 'from-emerald-50/80 to-green-50/60 dark:from-emerald-950/40 dark:to-green-950/30 border-emerald-200/50 dark:border-emerald-800/50',
    warning: 'from-amber-50/80 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/50',
    destructive: 'from-red-50/80 to-pink-50/60 dark:from-red-950/40 dark:to-pink-950/30 border-red-200/50 dark:border-red-800/50',
  };

  const iconStyles = {
    default: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-700',
    success: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
    warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700',
    destructive: 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${variantStyles[variant]}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
      <div className="relative p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-xl border ${iconStyles[variant]}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConfigItemProps {
  label: string;
  value: string;
  href: string;
  isConfigured: boolean;
}

function ConfigItem({ label, value, href, isConfigured }: ConfigItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex flex-col">
        <span className="font-medium text-sm">{label}</span>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isConfigured ? 'default' : 'outline'} className="text-xs px-2 py-1">
          {isConfigured ? 'Ready' : 'Setup Required'}
        </Badge>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Manage</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
