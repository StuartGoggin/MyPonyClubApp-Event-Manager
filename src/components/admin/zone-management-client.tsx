'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Edit } from 'lucide-react';
import ZoneEditor from '@/components/dashboard/zone-editor';
import type { Zone } from '@/lib/types';
import { updateZoneAction } from '@/lib/actions';

interface ZoneManagementClientProps {
  zones: Zone[];
}

export default function ZoneManagementClient({ zones }: ZoneManagementClientProps) {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleEditZone = (zone: Zone) => {
    setSelectedZone(zone);
    setIsEditorOpen(true);
  };

  const handleCreateZone = () => {
    const newZone: Zone = {
      id: `zone-${Date.now()}`,
      name: 'New Zone',
      streetAddress: '',
      eventApprovers: [],
      scheduleApprovers: []
    };
    setSelectedZone(newZone);
    setIsEditorOpen(true);
  };

  const handleSaveZone = async (zone: Zone) => {
    try {
      await updateZoneAction(zone);
      setIsEditorOpen(false);
      setSelectedZone(null);
      // The page will refresh due to server component re-rendering
      window.location.reload();
    } catch (error) {
      console.error('Error saving zone:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Zone Management
            <Button onClick={handleCreateZone} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Zone
            </Button>
          </CardTitle>
          <CardDescription>
            Configure zone details, addresses, secretaries, and approval workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-base text-gray-900">{zone.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {zone.streetAddress || 'No address configured'}
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
                  onClick={() => handleEditZone(zone)}
                  size="sm" 
                  variant="outline" 
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Zone
                </Button>
              </div>
            ))}
            {zones.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="font-medium">No zones configured</p>
                <p className="text-sm">Click "Add Zone" to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zone Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedZone && (
            <ZoneEditor
              initialZone={selectedZone}
              onSave={handleSaveZone}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
