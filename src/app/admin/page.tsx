import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MapPin, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { getAllZones, getAllClubs, getAllEventTypes } from '@/lib/server-data';

async function AdminDashboardContent() {
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage zones, clubs, events, and system configuration
        </p>
      </div>

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
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Manage core system settings and data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Zones Overview
            </CardTitle>
            <CardDescription>
              Quick view of zone configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zones.slice(0, 5).map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-base text-gray-900">{zone.name}</div>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                        {zone.eventApprovers?.length || 0} Event Approvers
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        {zone.scheduleApprovers?.length || 0} Schedule Approvers
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                    <Link href="/admin/zones">
                      <MapPin className="h-3 w-3 mr-1" />
                      Manage
                    </Link>
                  </Button>
                </div>
              ))}
              {zones.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No zones configured</p>
                  <p className="text-sm">Add zones to organize your pony clubs</p>
                  <Button asChild size="sm" className="mt-4">
                    <Link href="/admin/zones">Get Started</Link>
                  </Button>
                </div>
              )}
              {zones.length > 5 && (
                <div className="text-center pt-4 border-t">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/zones">View All {zones.length} Zones</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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
    default: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-amber-50 text-amber-600 border-amber-200',
    destructive: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-lg border ${variantStyles[variant]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
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
