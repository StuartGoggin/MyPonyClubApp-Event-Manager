'use client';

import { useEffect, useState, Suspense } from 'react';
import { ZoneEquipmentDashboard } from '@/components/zone-manager/zone-equipment-dashboard';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Opt out of static generation since this page uses search params
export const dynamic = 'force-dynamic';

interface Zone {
  id: string;
  name: string;
}

function ZoneEquipmentPageContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [zoneData, setZoneData] = useState<{ zoneId: string; zoneName: string } | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && isAuthenticated) {
      // Check if user has zone manager permissions
      const userRole = (user as any).role || '';
      const userRoles = (user as any).roles || [];
      const hasPermission = userRole === 'zone_rep' || userRole === 'super_user' || 
                           userRoles.includes('zone_rep') || userRoles.includes('super_user');
      const isSU = userRole === 'super_user' || userRoles.includes('super_user');
      
      if (!hasPermission) {
        console.log('No permission - role:', userRole, 'roles:', userRoles);
        router.push('/');
        return;
      }

      setIsSuperUser(isSU);

      // Get zone information from user or URL params
      const userZoneId = (user as any).zoneId;
      const urlZoneId = searchParams?.get('zoneId');
      const zoneId = urlZoneId || userZoneId;

      if (isSU && !zoneId) {
        // Super user without zone - fetch all zones for selection
        fetch('/api/zones')
          .then(res => res.json())
          .then(data => {
            const zoneList = data.zones || data || [];
            setZones(zoneList);
            if (zoneList.length > 0) {
              setSelectedZoneId(zoneList[0].id);
            }
          })
          .catch(err => {
            console.error('Error fetching zones:', err);
          });
        return;
      }

      if (!zoneId) {
        // Regular zone rep without zone assignment
        return;
      }

      // Fetch zone name
      fetch(`/api/zones/${zoneId}`)
        .then(res => res.json())
        .then(data => {
          setZoneData({
            zoneId,
            zoneName: data.name || 'Unknown Zone',
          });
        })
        .catch(() => {
          setZoneData({
            zoneId,
            zoneName: 'Unknown Zone',
          });
        });
    }
  }, [user, isAuthenticated, loading, router, searchParams]);

  // When super user selects a zone
  useEffect(() => {
    if (isSuperUser && selectedZoneId && !zoneData) {
      fetch(`/api/zones/${selectedZoneId}`)
        .then(res => res.json())
        .then(data => {
          setZoneData({
            zoneId: selectedZoneId,
            zoneName: data.name || 'Unknown Zone',
          });
        })
        .catch(() => {
          setZoneData({
            zoneId: selectedZoneId,
            zoneName: 'Unknown Zone',
          });
        });
    }
  }, [selectedZoneId, isSuperUser, zoneData]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h2 className="text-lg font-semibold text-destructive">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You need to be logged in to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Show zone selector for super users without a zone selected
  if (isSuperUser && !zoneData && zones.length > 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please select a zone to manage equipment:
            </p>
            <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a zone..." />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!zoneData) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h2 className="text-lg font-semibold text-destructive">No Zone Assignment</h2>
          <p className="text-sm text-muted-foreground">
            You need to be assigned to a zone to manage equipment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <ZoneEquipmentDashboard zoneId={zoneData.zoneId} zoneName={zoneData.zoneName} />
    </div>
  );
}

export default function ZoneEquipmentPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <ZoneEquipmentPageContent />
    </Suspense>
  );
}
