"use client";
import { Suspense, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MapPin, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { clubsMockClient, eventTypesMockClient, zonesMockClient } from '@/lib/admin-data';
import ZoneEditor from '@/components/dashboard/zone-editor';
import { updateZoneAction } from '@/lib/actions';
import type { Zone } from '@/lib/types';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function AdminDashboardPage() {
  const [zoneEditorOpen, setZoneEditorOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  // Use mock data only for clubs, zones, and event types
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
      date: new Date('2025-08-10'),
      clubId: 'club-ballarat',
      eventTypeId: 'event-type-clinic',
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

      {/* Recent Activity & Zone Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ...existing Pending Approvals Card... */}
        {/* ...existing System Configuration Card... */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Zones Management
            </CardTitle>
            <CardDescription>
              Edit zone details, address, and approvers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="font-medium text-base text-gray-900">{zone.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {('streetAddress' in zone && zone.streetAddress) ? 
                        (zone as any).streetAddress : 
                        'No address configured'
                      }
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                        {zone.eventApprovers?.length || 0} Event Approvers
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                        {zone.scheduleApprovers?.length || 0} Schedule Approvers
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => { 
                      setEditingZone(zone); 
                      setZoneEditorOpen(true); 
                    }}
                    className="hover:bg-blue-50 hover:border-blue-300"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Edit Zone
                  </Button>
                </div>
              ))}
              {zones.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No zones configured</p>
                  <p className="text-sm">Add zones to organize your pony clubs</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        <Dialog open={zoneEditorOpen} onOpenChange={setZoneEditorOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            {editingZone && (
              <ZoneEditor
                initialZone={editingZone}
                onSave={async zone => {
                  await updateZoneAction(zone);
                  setZoneEditorOpen(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
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
