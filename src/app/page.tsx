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
        <div className="text-center enhanced-card p-8 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">Loading event calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center enhanced-card p-8 rounded-lg">
          <p className="text-red-500 mb-6 text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="premium-button px-6 py-3 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="enhanced-card p-6 rounded-lg">
        <h1 className="text-4xl font-bold tracking-tight font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Event Calendar
        </h1>
        <p className="text-muted-foreground text-lg mt-2">
          View and manage all proposed and approved events across Victoria.
        </p>
      </div>
      
      {databaseWarning && (
        <div className="enhanced-card p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Database Connection Warning
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                {databaseWarning}
              </p>
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
