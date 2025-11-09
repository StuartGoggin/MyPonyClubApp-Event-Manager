'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Plus, Edit, Trash2, UserPlus } from 'lucide-react';

export default function DistributionListsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Distribution Lists</h1>
          <p className="text-muted-foreground">
            Manage email distribution lists for notifications and communications
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      {/* Coming Soon Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Distribution Lists Management
          </CardTitle>
          <CardDescription>
            Create and manage email distribution lists for different user groups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              Distribution list management functionality will be available in a future update.
            </p>
            <Badge variant="outline">Feature In Development</Badge>
          </div>
          
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold">Planned Features:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create custom distribution lists by role, zone, or club
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Manage subscriber lists for automated notifications
              </li>
              <li className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Bulk email operations and list maintenance
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Integration with user roles and permissions
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
