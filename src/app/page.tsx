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

        // Handle responses with error checking
        const zonesData = zonesResponse.ok ? await zonesResponse.json() : { zones: [] };
        const clubsData = clubsResponse.ok ? await clubsResponse.json() : { clubs: [] };
        const eventsData = eventsResponse.ok ? await eventsResponse.json() : { events: [] };
        const eventTypesData = eventTypesResponse.ok ? await eventTypesResponse.json() : { eventTypes: [] };

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
