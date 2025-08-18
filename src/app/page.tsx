'use client';

import { useState, useEffect } from 'react';
import { EventCalendar } from '@/components/dashboard/event-calendar';
import { Event, Club, EventType, Zone } from '@/lib/types';

export default function DashboardPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [databaseWarning, setDatabaseWarning] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data from APIs
        const [zonesResponse, clubsResponse, eventsResponse, eventTypesResponse] = await Promise.all([
          fetch('/api/zones', { cache: 'no-store' }),
          fetch('/api/clubs', { cache: 'no-store' }),
          fetch('/api/events', { cache: 'no-store' }),
          fetch('/api/event-types', { cache: 'no-store' })
        ]);

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
        setZones(Array.isArray(zonesData.zones) ? zonesData.zones : Array.isArray(zonesData) ? zonesData : []);
        setClubs(Array.isArray(clubsData.clubs) ? clubsData.clubs : Array.isArray(clubsData) ? clubsData : []);
        setEvents(Array.isArray(eventsData.events) ? eventsData.events : Array.isArray(eventsData) ? eventsData : []);
        setEventTypes(Array.isArray(eventTypesData.eventTypes) ? eventTypesData.eventTypes : Array.isArray(eventTypesData) ? eventTypesData : []);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-2xl backdrop-blur-sm p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl"></div>
          <div className="relative text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
            <p className="text-muted-foreground text-lg">Loading event calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-red/5 shadow-2xl backdrop-blur-sm p-8">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-orange-500/5 to-red-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red/10 to-transparent rounded-full blur-2xl"></div>
          <div className="relative text-center">
            <p className="text-red-500 mb-6 text-lg">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm hover:from-primary/30 hover:to-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                Event Calendar
              </h1>
              <p className="text-muted-foreground text-lg mt-2">
                View and manage all proposed and approved events across Victoria.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {databaseWarning && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/80 via-amber-50/60 to-orange-50/40 dark:from-amber-950/40 dark:via-amber-950/30 dark:to-orange-950/20 shadow-xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-orange-400/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/10 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative p-4 border-l-4 border-amber-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/50 p-2 border border-amber-200 dark:border-amber-700">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
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
      />
    </div>
  );
}
