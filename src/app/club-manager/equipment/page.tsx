'use client';

import { useEffect, useState } from 'react';
import { EquipmentCatalog } from '@/components/equipment/equipment-catalog';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function EquipmentPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [catalogData, setCatalogData] = useState<{
    zoneId: string;
    zoneName: string;
    clubId: string;
    clubName: string;
    userEmail: string;
    userName: string;
    userPhone: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && isAuthenticated) {
      const clubId = (user as any).clubId;
      
      if (!clubId) {
        return;
      }

      // Fetch club and zone information
      Promise.all([
        fetch(`/api/clubs/${clubId}`).then(res => res.json()),
      ])
        .then(([clubData]) => {
          const zoneId = clubData.zoneId;
          
          if (!zoneId) {
            return;
          }

          return fetch(`/api/zones/${zoneId}`)
            .then(res => res.json())
            .then(zoneData => {
              setCatalogData({
                zoneId,
                zoneName: zoneData.name || 'Unknown Zone',
                clubId,
                clubName: clubData.name || 'Unknown Club',
                userEmail: user.email || '',
                userName: `${user.firstName} ${user.lastName}`,
                userPhone: (user as any).phone || '',
              });
            });
        })
        .catch(err => {
          console.error('Error fetching club/zone data:', err);
        });
    }
  }, [user, isAuthenticated, loading, router]);

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
            You need to be logged in to access equipment.
          </p>
        </div>
      </div>
    );
  }

  if (!catalogData) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h2 className="text-lg font-semibold text-destructive">No Club Association</h2>
          <p className="text-sm text-muted-foreground">
            You need to be associated with a club to browse equipment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <EquipmentCatalog {...catalogData} />
    </div>
  );
}
