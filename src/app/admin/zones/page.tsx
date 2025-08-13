import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';
import { getAllZones, getAllClubs } from '@/lib/server-data';
import ZoneManagementClient from '@/components/admin/zone-management-client';

async function ZonesContent() {
  const zones = await getAllZones();
  const clubs = await getAllClubs();

  const getClubCountForZone = (zoneId: string) => {
    return clubs.filter(club => club.zoneId === zoneId).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Zone Management</h1>
          <p className="text-muted-foreground">
            Manage zones across Victoria for organizing pony clubs
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Zones</p>
                <p className="text-2xl font-bold">{zones.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clubs</p>
                <p className="text-2xl font-bold">{clubs.length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Clubs/Zone</p>
                <p className="text-2xl font-bold">
                  {zones.length > 0 ? Math.round(clubs.length / zones.length * 10) / 10 : 0}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Editor */}
      <ZoneManagementClient zones={zones} />

      {/* Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Zones</CardTitle>
          <CardDescription>
            List of all zones and their associated clubs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone Name</TableHead>
                <TableHead>Secretary</TableHead>
                <TableHead>Event Approvers</TableHead>
                <TableHead>Schedule Approvers</TableHead>
                <TableHead>Club Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map(zone => {
                const clubCount = getClubCountForZone(zone.id);
                return (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      {zone.secretary ? (
                        <div className="text-sm">
                          <div className="font-medium">{zone.secretary.name}</div>
                          <div className="text-muted-foreground">{zone.secretary.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {zone.eventApprovers?.length || 0} approver{(zone.eventApprovers?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {zone.scheduleApprovers?.length || 0} approver{(zone.scheduleApprovers?.length || 0) !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {clubCount} club{clubCount !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={clubCount > 0 ? 'default' : 'outline'}>
                        {clubCount > 0 ? 'Active' : 'Empty'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {zones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No zones configured yet. Use the Zone Editor above to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminZonesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading zones...</div>}>
      <ZonesContent />
    </Suspense>
  );
}
