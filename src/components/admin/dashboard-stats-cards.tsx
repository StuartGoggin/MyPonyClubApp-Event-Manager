'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Calendar, Users, MapPin, Clock, CheckCircle } from 'lucide-react';

interface DashboardStats {
  eventTypes: number;
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  clubs: number;
  zones: number;
}

export function DashboardStatsCards() {
  const [stats, setStats] = useState<DashboardStats>({
    eventTypes: 0,
    totalEvents: 0,
    pendingEvents: 0,
    approvedEvents: 0,
    clubs: 0,
    zones: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all data in parallel
        const [eventTypesRes, eventsRes, clubsRes, zonesRes] = await Promise.all([
          fetch('/api/event-types'),
          fetch('/api/events'),
          fetch('/api/clubs'),
          fetch('/api/zones')
        ]);

        // Handle potential API failures gracefully
        const eventTypesData = eventTypesRes.ok ? await eventTypesRes.json() : { eventTypes: [] };
        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
        const clubsData = clubsRes.ok ? await clubsRes.json() : { clubs: [] };
        const zonesData = zonesRes.ok ? await zonesRes.json() : { zones: [] };

        // Extract counts from API responses
        const eventTypesCount = Array.isArray(eventTypesData) 
          ? eventTypesData.length 
          : eventTypesData.eventTypes?.length || 0;

        // Parse events data and calculate metrics
        const eventsArray = Array.isArray(eventsData) 
          ? eventsData 
          : eventsData.events || [];
        
        const totalEventsCount = eventsArray.length;
        const pendingEventsCount = eventsArray.filter((event: any) => 
          event.status === 'proposed' || event.status === 'pending'
        ).length;
        const approvedEventsCount = eventsArray.filter((event: any) => 
          event.status === 'approved'
        ).length;

        const clubsCount = Array.isArray(clubsData) 
          ? clubsData.length 
          : clubsData.clubs?.length || 0;

        const zonesCount = Array.isArray(zonesData) 
          ? zonesData.length 
          : zonesData.zones?.length || 0;

        setStats({
          eventTypes: eventTypesCount,
          totalEvents: totalEventsCount,
          pendingEvents: pendingEventsCount,
          approvedEvents: approvedEventsCount,
          clubs: clubsCount,
          zones: zonesCount
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsData = [
    {
      title: 'Pending Events',
      value: stats.pendingEvents,
      icon: <Clock className="h-4 w-4" />,
      variant: 'warning' as const
    },
    {
      title: 'Approved Events', 
      value: stats.approvedEvents,
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'success' as const
    },
    {
      title: 'Total Clubs',
      value: stats.clubs,
      icon: <Users className="h-4 w-4" />,
      variant: 'default' as const
    },
    {
      title: 'Total Zones',
      value: stats.zones,
      icon: <MapPin className="h-4 w-4" />,
      variant: 'default' as const
    },
    {
      title: 'Event Types',
      value: stats.eventTypes,
      icon: <FileText className="h-4 w-4" />,
      variant: 'default' as const
    }
  ];

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statsData.map((stat) => (
        <div 
          key={stat.title}
          className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${variantStyles[stat.variant]}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col justify-center">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${iconStyles[stat.variant]}`}>
                {stat.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}