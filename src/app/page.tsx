'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { Event, Club, EventType, Zone } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useAtom } from 'jotai';
import { eventSourceAtom } from '@/lib/state';

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseWarning, setDatabaseWarning] = useState<string | null>(null);
  const [eventSources] = useAtom(eventSourceAtom);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data from APIs
        const requests = [
          fetch('/api/zones', { cache: 'no-store' }),
          fetch('/api/clubs', { cache: 'no-store' }),
          fetch('/api/events', { cache: 'no-store' }),
          fetch('/api/event-types', { cache: 'no-store' }),
          fetch('/api/calendar/equipment-bookings', { cache: 'no-store' })
        ];

        const responses = await Promise.all(requests);
        const [zonesResponse, clubsResponse, eventsResponse, eventTypesResponse, equipmentResponse] = responses;

        // Handle responses with error checking
        const zonesData = zonesResponse.ok ? await zonesResponse.json() : { zones: [] };
        const clubsData = clubsResponse.ok ? await clubsResponse.json() : { clubs: [] };
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
        const eventTypesData = eventTypesResponse.ok ? await eventTypesResponse.json() : { eventTypes: [] };

        // Check for database warnings
        let warnings: string[] = [];
        if (!eventsResponse.ok && eventsData.message) {
          warnings.push(`Events: ${eventsData.message}`);
        }
        if (!eventTypesResponse.ok && eventTypesData.message) {
          warnings.push(`Event Types: ${eventTypesData.message}`);
        }
        if (!zonesResponse.ok && zonesData.message) {
          warnings.push(`Zones: ${zonesData.message}`);
        }
        if (!clubsResponse.ok && clubsData.message) {
          warnings.push(`Clubs: ${clubsData.message}`);
        }
        
        if (warnings.length > 0) {
          setDatabaseWarning(`Database connection issues detected: ${warnings.join('; ')}`);
        } else {
          setDatabaseWarning(null);
        }

        console.log('Main dashboard API responses:', { zonesData, clubsData, eventsData, eventTypesData });

        // Extract arrays from API responses, ensuring they are always arrays
        const extractedEvents = Array.isArray(eventsData.events) ? eventsData.events : Array.isArray(eventsData) ? eventsData : [];
        
        // Fetch and merge equipment bookings if enabled
        let equipmentEvents: Event[] = [];
        if (eventSources.includes('equipment_booking')) {
          const equipmentData = equipmentResponse.ok ? await equipmentResponse.json() : { data: [] };
          equipmentEvents = Array.isArray(equipmentData.data) ? equipmentData.data : [];
          console.log('📦 Equipment bookings loaded:', equipmentEvents.length);
        }
        
        // Merge regular events with equipment booking events
        const allEvents = [...extractedEvents, ...equipmentEvents];
        
        setZones(Array.isArray(zonesData.zones) ? zonesData.zones : Array.isArray(zonesData) ? zonesData : []);
        setClubs(Array.isArray(clubsData.clubs) ? clubsData.clubs : Array.isArray(clubsData) ? clubsData : []);
        setEvents(allEvents);
        setEventTypes(Array.isArray(eventTypesData.eventTypes) ? eventTypesData.eventTypes : Array.isArray(eventTypesData) ? eventTypesData : []);
        
        console.log('📅 Calendar - Total events loaded:', allEvents.length);
        console.log('🎯 Calendar - State events (no zoneId/clubId):', allEvents.filter((e: Event) => !e.zoneId && !e.clubId));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventSources]); // Re-fetch when event sources change

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
              <p className="text-muted-foreground">Loading event calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="mb-6 sm:mb-8 relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 p-4 sm:p-8 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex-shrink-0">
                <Image
                  src="/myponyclub-logo-calendar-events.png"
                  alt="Event Calendar Logo"
                  width={48}
                  height={48}
                  className="drop-shadow-lg sm:w-16 sm:h-16"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                  Event Calendar
                </h1>
                <p className="text-blue-100 mt-0.5 sm:mt-1 text-xs sm:text-sm">
                  Manage your clubs events
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {databaseWarning && (
          <div className="mb-6 relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 via-amber-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-orange-950/20 shadow-lg">
            <div className="p-4 border-l-4 border-amber-500">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 rounded-lg bg-amber-100 dark:bg-amber-900/50 p-2">
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Database Connection Warning
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    {databaseWarning}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <EventCalendar 
          events={events} 
          clubs={clubs} 
          eventTypes={eventTypes} 
          zones={zones} 
          today={new Date()}
          currentUser={user} 
        />
      </div>
    </div>
  );
}
