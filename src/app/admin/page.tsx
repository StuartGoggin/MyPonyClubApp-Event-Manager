import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MapPin, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { clubsMockClient, eventTypesMockClient, zonesMockClient } from '@/lib/admin-data';

export default function AdminDashboardPage() {
  // Use mock data for now - in a real app, you would fetch this from the database
  const clubs = clubsMockClient;
  const zones = zonesMockClient;
  const eventTypes = eventTypesMockClient;
  
  // Mock events for demo
  const events = [
    {
      id: 'event-1',
      name: 'Spring Rally',
      date: new Date('2025-09-15'),
      clubId: 'club-melbourne',
      eventTypeId: 'event-type-rally',
      status: 'proposed' as const,
      location: 'Melbourne Pony Club Grounds',
      source: 'zone' as const,
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
      status: 'approved' as const,
      location: 'Geelong Pony Club',
      source: 'zone' as const,
      coordinatorName: 'Bob Johnson',
      coordinatorContact: 'bob@email.com'
    },
    {
      id: 'event-3',
      name: 'Winter Training Day',
      date: new Date('2025-08-10'),
      clubId: 'club-ballarat',
      eventTypeId: 'event-type-clinic',
      status: 'rejected' as const,
      location: 'Ballarat Pony Club',
      source: 'zone' as const,
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

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Events waiting for your review and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .filter(e => e.status === 'proposed')
                .slice(0, 5)
                .map(event => {
                  const club = clubs.find(c => c.id === event.clubId);
                  const eventType = eventTypes.find(et => et.id === event.eventTypeId);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{event.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {club?.name} • {eventType?.name} • {event.date.toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    </div>
                  );
                })}
              {pendingEvents === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No pending events to review
                </div>
              )}
              {pendingEvents > 0 && (
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/admin/events">View All Pending Events</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              System Configuration
            </CardTitle>
            <CardDescription>
              Current system configuration status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ConfigItem
                label="Zones"
                value={`${zones.length} configured`}
                href="/admin/zones"
                isConfigured={zones.length > 0}
              />
              <ConfigItem
                label="Clubs"
                value={`${clubs.length} configured`}
                href="/admin/clubs"
                isConfigured={clubs.length > 0}
              />
              <ConfigItem
                label="Event Types"
                value={`${eventTypes.length} configured`}
                href="/admin/event-types"
                isConfigured={eventTypes.length > 0}
              />
              <ConfigItem
                label="Database Seeding"
                value="Configuration data ready"
                href="/admin/seed"
                isConfigured={zones.length > 0 && clubs.length > 0 && eventTypes.length > 0}
              />
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
            {icon}
          </div>
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
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{value}</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={isConfigured ? 'default' : 'outline'} className="text-xs">
          {isConfigured ? 'Ready' : 'Setup Required'}
        </Badge>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>Manage</Link>
        </Button>
      </div>
    </div>
  );
}
