'use client';

import { useState, useEffect } from 'react';
import { Event, Zone, Club, EventType } from '@/lib/types';
import { EventCalendar } from '@/components/dashboard/event-calendar';

export default function EmbedCalendarPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Pony Club Events Calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pony Club Events Calendar
          </h1>
          <p className="text-gray-600">
            View upcoming events across all Victorian Pony Club zones
          </p>
        </div>

        {/* Calendar Component */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <EventCalendar 
            events={events}
            zones={zones}
            clubs={clubs}
            eventTypes={eventTypes}
            today={new Date()}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by MyPonyClub Event Manager</p>
        </div>
      </div>
    </div>
  );
}
