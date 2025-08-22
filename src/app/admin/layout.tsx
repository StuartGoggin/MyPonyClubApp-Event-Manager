'use client';

import { PropsWithChildren } from 'react';
import { Shield, Database, Users, Calendar, MapPin, Settings, FileText, Upload } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage system configuration, users, and events
              </p>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminNavCard
              href="/admin/seed"
              icon={<Database className="h-6 w-6" />}
              title="Manage Data"
              description="Initialize zones, clubs, and event types"
              badge="System"
            />
            <AdminNavCard
              href="/manage-events"
              icon={<Calendar className="h-6 w-6" />}
              title="Manage Events"
              description="Review and manage event requests"
              badge="Events"
            />
            <AdminNavCard
              href="/admin/zones"
              icon={<MapPin className="h-6 w-6" />}
              title="Zone Management"
              description="Add, edit, and manage zones"
              badge="Config"
            />
            <AdminNavCard
              href="/admin/clubs"
              icon={<Users className="h-6 w-6" />}
              title="Club Management"
              description="Manage clubs and their zone assignments"
              badge="Config"
            />
            <AdminNavCard
              href="/admin/event-types"
              icon={<FileText className="h-6 w-6" />}
              title="Event Types"
              description="Configure available event types"
              badge="Config"
            />
            <AdminNavCard
              href="/admin/import-calendar"
              icon={<Upload className="h-6 w-6" />}
              title="Import Calendar"
              description="Upload and import calendar events"
              badge="Import"
              badgeVariant="default"
            />
            <AdminNavCard
              href="/admin/settings"
              icon={<Settings className="h-6 w-6" />}
              title="System Settings"
              description="Configure app settings and preferences"
              badge="System"
            />
          </div>

          <Separator />

          {/* Main Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdminNavCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function AdminNavCard({ href, icon, title, description, badge, badgeVariant = 'secondary' }: AdminNavCardProps) {
  return (
    <Link href={href}>
      <Card className="transition-all hover:shadow-md hover:bg-card/80 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
            {badge && (
              <Badge variant={badgeVariant} className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
