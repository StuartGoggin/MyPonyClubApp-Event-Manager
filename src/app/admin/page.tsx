import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MapPin, FileText, AlertTriangle, CheckCircle, Clock, Map, ExternalLink, Database, Upload, Settings, Globe, Download, Package, TestTube, FileUp, Factory, Trash2, UserCheck, Mail } from 'lucide-react';
import Link from 'next/link';
import { getAllZones, getAllClubs, getAllEventTypes } from '@/lib/server-data';
import { getDatabaseErrorMessage, isDatabaseConnected } from '@/lib/firebase-admin';
import { getEmailQueueStats } from '@/lib/email-queue-admin';
import { RouteGuard } from '@/components/auth/route-guard';
import { DataExportTile } from '@/components/admin/data-export-tile';
import { BackupScheduleTile } from '@/components/admin/backup-schedule-tile';

async function AdminDashboardContent() {
  // Check database connection
  const isDatabaseAvailable = isDatabaseConnected();
  const databaseErrorMessage = getDatabaseErrorMessage();
  
  // Use server data instead of mock data
  const clubs = await getAllClubs();
  const zones = await getAllZones();
  const eventTypes = await getAllEventTypes();

  // Get email queue statistics
  let emailStats = null;
  try {
    emailStats = await getEmailQueueStats();
  } catch (error) {
    console.log('Could not fetch email queue stats:', error);
    // Continue without email stats - it's not critical for the admin page
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <StatsCard
          title="Event Types"
          value={eventTypes.length}
          icon={<FileText className="h-4 w-4" />}
          variant="default"
        />
      </div>

      {/* System Configuration Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-600" />
          System Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Zones Configuration */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/80 via-indigo-50/60 to-blue-50/40 dark:from-indigo-950/40 dark:via-indigo-950/30 dark:to-blue-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/5 to-blue-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/50 p-3 border border-indigo-200 dark:border-indigo-700">
                  <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Zones</h3>
                  <p className="text-sm text-muted-foreground">Configure geographical zones</p>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant={zones.length > 0 ? 'default' : 'outline'} className="text-xs">
                  {zones.length} zones configured
                </Badge>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/zones">
                    <MapPin className="h-4 w-4 mr-2" />
                    Manage Zones
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Clubs Configuration */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50/80 via-orange-50/60 to-amber-50/40 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-amber-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-amber-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-100 dark:bg-orange-900/50 p-3 border border-orange-200 dark:border-orange-700">
                  <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Clubs</h3>
                  <p className="text-sm text-muted-foreground">Manage club registry</p>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant={clubs.length > 0 ? 'default' : 'outline'} className="text-xs">
                  {clubs.length} clubs registered
                </Badge>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/clubs">
                    <Users className="h-4 w-4 mr-2" />
                    Manage Clubs
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Event Types Configuration */}
          <div className="relative overflow-hidden rounded-2xl border border-teal-200/50 bg-gradient-to-br from-teal-50/80 via-teal-50/60 to-cyan-50/40 dark:from-teal-950/40 dark:via-teal-950/30 dark:to-cyan-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400/5 to-cyan-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-teal-100 dark:bg-teal-900/50 p-3 border border-teal-200 dark:border-teal-700">
                  <FileText className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Event Types</h3>
                  <p className="text-sm text-muted-foreground">Configure event categories</p>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant={eventTypes.length > 0 ? 'default' : 'outline'} className="text-xs">
                  {eventTypes.length} types available
                </Badge>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/event-types">
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Types
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="relative overflow-hidden rounded-2xl border border-sky-200/50 bg-gradient-to-br from-sky-50/80 via-sky-50/60 to-blue-50/40 dark:from-sky-950/40 dark:via-sky-950/30 dark:to-blue-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400/5 to-blue-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-sky-100 dark:bg-sky-900/50 p-3 border border-sky-200 dark:border-sky-700">
                  <UserCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">User Management</h3>
                  <p className="text-sm text-muted-foreground">Manage user accounts & roles</p>
                </div>
              </div>
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs">
                  Authentication & roles
                </Badge>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/users">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Users
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Email Queue Management */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-pink-50/40 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-pink-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-pink-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
                  <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Email Queue</h3>
                  <p className="text-sm text-muted-foreground">Manage email notifications</p>
                </div>
              </div>
              <div className="space-y-2">
                {emailStats ? (
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={emailStats.pending > 0 ? 'default' : 'outline'} className="text-xs">
                      {emailStats.pending} Pending
                    </Badge>
                    <Badge variant={emailStats.failed > 0 ? 'destructive' : 'outline'} className="text-xs">
                      {emailStats.failed} Failed
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {emailStats.sent} Sent
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Queue & approval system
                  </Badge>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/email-queue">
                    <Mail className="h-4 w-4 mr-2" />
                    Manage Email Queue
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Data Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Events Management */}
          <div className="relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-cyan-50/40 dark:from-blue-950/40 dark:via-blue-950/30 dark:to-cyan-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-cyan-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-blue-100 dark:bg-blue-900/50 p-3 border border-blue-200 dark:border-blue-700">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Events</h3>
                  <p className="text-sm text-muted-foreground">Manage event calendar</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {pendingEvents} Pending
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {approvedEvents} Approved
                  </Badge>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/events">
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Data Export */}
          <DataExportTile />

          {/* Automatic Backup Scheduling */}
          <BackupScheduleTile />
        </div>
      </div>

      {/* Database Seeding Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-600" />
          Database Seeding
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Import Calendar */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 via-emerald-50/60 to-green-50/40 dark:from-emerald-950/40 dark:via-emerald-950/30 dark:to-green-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-green-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-3 border border-emerald-200 dark:border-emerald-700">
                  <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Import Calendar</h3>
                  <p className="text-sm text-muted-foreground">Upload CSV calendar data</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Import events from CSV files with automatic club and zone matching
                </p>
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/admin/import-calendar">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Database Seed */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-pink-50/40 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-pink-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-pink-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
                  <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Database Seed</h3>
                  <p className="text-sm text-muted-foreground">Initialize sample data</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Populate database with sample zones, clubs, and event types
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/seed">
                    <Database className="h-4 w-4 mr-2" />
                    Seed Database
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API & Integration Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Globe className="h-5 w-5 text-violet-600" />
          API & Integration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Embed Calendar */}
          <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-violet-50/80 via-violet-50/60 to-purple-50/40 dark:from-violet-950/40 dark:via-violet-950/30 dark:to-purple-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/5 to-purple-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-violet-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-3 border border-violet-200 dark:border-violet-700">
                  <ExternalLink className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Embed Calendar</h3>
                  <p className="text-sm text-muted-foreground">External calendar API</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-violet-700 dark:text-violet-300">
                  Public API endpoint for embedding calendars in external websites
                </p>
                <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  <Link href="/api/embed/calendar" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open API
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="relative overflow-hidden rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-50/80 via-rose-50/60 to-pink-50/40 dark:from-rose-950/40 dark:via-rose-950/30 dark:to-pink-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-400/5 to-pink-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-rose-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-rose-100 dark:bg-rose-900/50 p-3 border border-rose-200 dark:border-rose-700">
                  <Globe className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">API Endpoints</h3>
                  <p className="text-sm text-muted-foreground">Monitor all endpoints</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Manage and monitor all application API endpoints
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/api-endpoints">
                    <Globe className="h-4 w-4 mr-2" />
                    View Endpoints
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Club Geolocation */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 via-emerald-50/60 to-green-50/40 dark:from-emerald-950/40 dark:via-emerald-950/30 dark:to-green-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-green-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/50 p-3 border border-emerald-200 dark:border-emerald-700">
                  <Map className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Club Geolocation</h3>
                  <p className="text-sm text-muted-foreground">Set club locations</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Use Google Maps to find and set club GPS coordinates
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/geolocate-clubs">
                    <Map className="h-4 w-4 mr-2" />
                    Set Locations
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Import PCA Club Data */}
          <div className="relative overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50/80 via-orange-50/60 to-red-50/40 dark:from-orange-950/40 dark:via-orange-950/30 dark:to-red-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-red-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-orange-100 dark:bg-orange-900/50 p-3 border border-orange-200 dark:border-orange-700">
                  <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Import PCA Club Data</h3>
                  <p className="text-sm text-muted-foreground">Extract club information</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Import club data from PCA website including logos, addresses and contacts
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/import-pca-data">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testing Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          Testing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Event Export Tool */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-violet-50/40 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-violet-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-violet-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Event Export</h3>
                  <p className="text-sm text-muted-foreground">Export event data archive</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Export all events with schedules and metadata as a complete ZIP archive
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/testing/export-events">
                    <Download className="h-4 w-4 mr-2" />
                    Export Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Event Import Tool */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-violet-50/40 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-violet-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-violet-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
                  <FileUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Event Import</h3>
                  <p className="text-sm text-muted-foreground">Restore from archive</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Import events from exported ZIP archives with conflict detection and validation
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/testing/import-events">
                    <FileUp className="h-4 w-4 mr-2" />
                    Import Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Test Data Generator */}
          <div className="relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-violet-50/40 dark:from-purple-950/40 dark:via-purple-950/30 dark:to-violet-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/5 to-violet-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-purple-100 dark:bg-purple-900/50 p-3 border border-purple-200 dark:border-purple-700">
                  <Factory className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Test Data Generator</h3>
                  <p className="text-sm text-muted-foreground">Generate realistic test data</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-purple-700 dark:text-purple-300">
                  Create synthetic event data in export-compatible ZIP format for testing
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/testing/generate-test-data">
                    <Factory className="h-4 w-4 mr-2" />
                    Generate Test Data
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Event Purge Tool */}
          <div className="relative overflow-hidden rounded-2xl border border-red-200/50 bg-gradient-to-br from-red-50/80 via-red-50/60 to-orange-50/40 dark:from-red-950/40 dark:via-red-950/30 dark:to-orange-950/20 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/5 to-orange-400/5"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-400/10 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-red-100 dark:bg-red-900/50 p-3 border border-red-200 dark:border-red-700">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Event Purge Tool</h3>
                  <p className="text-sm text-muted-foreground">Safe event removal</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-700 dark:text-red-300">
                  Safely remove events from the database using exported ZIP archives with intelligent matching
                </p>
                <Button asChild variant="outline" className="w-full border-red-200 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-950/30">
                  <Link href="/admin/testing/purge-events">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Purge Events
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* User Data Deletion Tool */}
          <div className="relative overflow-hidden rounded-2xl border border-red-300/60 bg-gradient-to-br from-red-100/90 via-red-50/70 to-orange-50/50 dark:from-red-950/50 dark:via-red-950/40 dark:to-orange-950/30 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/15 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl bg-red-200 dark:bg-red-800/60 p-3 border border-red-300 dark:border-red-600">
                  <UserCheck className="h-5 w-5 text-red-700 dark:text-red-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    User Data Deletion
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </h3>
                  <p className="text-sm text-muted-foreground">⚠️ TESTING ONLY</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-red-800 dark:text-red-200 font-medium">
                  DANGER: Permanently delete user data from database. For testing purposes only!
                </p>
                <Button asChild variant="outline" className="w-full border-red-300 hover:bg-red-100 dark:border-red-600 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300">
                  <Link href="/admin/testing/delete-users">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Delete User Data
                  </Link>
                </Button>
              </div>
            </div>
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
    <RouteGuard requireAuth={true} requiredRoles={['super_user']}>
      <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
        <AdminDashboardContent />
      </Suspense>
    </RouteGuard>
  );
}
