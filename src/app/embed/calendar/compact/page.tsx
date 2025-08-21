'use client';

import { useState, useEffect } from 'react';
import { Event, Zone, Club, EventType } from '@/lib/types';
import { EventCalendar } from '@/components/dashboard/event-calendar';

export default function CompactCalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [zonesRes, clubsRes, eventsRes, eventTypesRes] = await Promise.all([
          fetch('/api/zones'),
          fetch('/api/clubs'),
          fetch('/api/events'),
          fetch('/api/event-types')
        ]);

        if (!zonesRes.ok || !clubsRes.ok || !eventsRes.ok || !eventTypesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [zonesData, clubsData, eventsData, eventTypesData] = await Promise.all([
          zonesRes.json(),
          clubsRes.json(),
          eventsRes.json(),
          eventTypesRes.json()
        ]);

        setZones(zonesData);
        setClubs(clubsData);
        setEvents(eventsData);
        setEventTypes(eventTypesData);
      } catch (err) {
        console.error('Error fetching calendar data:', err);
        setError('Failed to load calendar data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading Events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-2">
      {/* Compact Header */}
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Pony Club Events
        </h2>
        <p className="text-gray-600 text-sm">
          Victorian Pony Club Event Calendar
        </p>
      </div>

      {/* Compact Calendar */}
      <div className="bg-gray-50 rounded-lg p-3">
        <EventCalendar 
          events={events}
          zones={zones}
          clubs={clubs}
          eventTypes={eventTypes}
          today={new Date()}
        />
      </div>

      {/* Compact Footer */}
      <div className="mt-3 text-center">
        <p className="text-xs text-gray-500">
          Powered by MyPonyClub Event Manager
        </p>
      </div>
    </div>
  );
}
