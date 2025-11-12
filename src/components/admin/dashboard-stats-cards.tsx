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
    default: 'from-blue-50/90 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/20 border-blue-200/60 dark:border-blue-700/60',
    success: 'from-emerald-50/90 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/20 border-emerald-200/60 dark:border-emerald-700/60',
    warning: 'from-amber-50/90 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/60 dark:border-amber-700/60',
    destructive: 'from-red-50/90 to-pink-50/80 dark:from-red-950/30 dark:to-pink-950/20 border-red-200/60 dark:border-red-700/60',
  };

  const iconStyles = {
    default: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-300/60 dark:border-blue-700/60',
    success: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-700/60',
    warning: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/60',
    destructive: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-300/60 dark:border-red-700/60',
  };

  const textColorStyles = {
    default: 'text-blue-700 dark:text-blue-400',
    success: 'text-emerald-700 dark:text-emerald-400',
    warning: 'text-amber-700 dark:text-amber-400',
    destructive: 'text-red-700 dark:text-red-400',
  };

  const numberColorStyles = {
    default: 'text-blue-600 dark:text-blue-500',
    success: 'text-emerald-600 dark:text-emerald-500',
    warning: 'text-amber-600 dark:text-amber-500',
    destructive: 'text-red-600 dark:text-red-500',
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-lg border-2 border-gray-200/60 bg-gradient-to-br from-gray-50/90 to-gray-100/80 p-3 animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-7 w-7 bg-gray-200 rounded-md"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {statsData.map((stat) => (
        <div 
          key={stat.title}
          className={`relative overflow-hidden rounded-lg border-2 bg-gradient-to-br shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${variantStyles[stat.variant]}`}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className={`rounded-md p-1.5 ${iconStyles[stat.variant]}`}>
                {stat.icon}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${textColorStyles[stat.variant]}`}>
                {stat.title.split(' ')[0]}
              </span>
            </div>
            <div className={`text-3xl font-black leading-none mb-1 ${numberColorStyles[stat.variant]}`}>
              {stat.value}
            </div>
            <div className={`text-xs font-medium ${textColorStyles[stat.variant]} opacity-80`}>
              {stat.title}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}