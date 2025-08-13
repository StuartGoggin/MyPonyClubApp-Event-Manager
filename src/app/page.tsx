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

        const [zonesData, clubsData, eventsData, eventTypesData] = await Promise.all([
          zonesResponse.json(),
          clubsResponse.json(),
          eventsResponse.json(),
          eventTypesResponse.json()
        ]);

        console.log('Main dashboard API responses:', { zonesData, clubsData, eventsData, eventTypesData });

        // Extract arrays from API responses
        setZones(zonesData.zones || zonesData || []);
        setClubs(clubsData.clubs || clubsData || []);
        setEvents(eventsData.events || eventsData || []);
        setEventTypes(eventTypesData.eventTypes || eventTypesData || []);

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Event Calendar</h1>
        <p className="text-muted-foreground">
          View and manage all proposed and approved events.
        </p>
      </div>
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
