'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Edit, Plus } from 'lucide-react';
import { Event } from '@/lib/types';

interface PublicHolidayManagementProps {
  onEventsUpdate: () => void;
}

export function PublicHolidayManagement({ onEventsUpdate }: PublicHolidayManagementProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      const allEvents = data.events || data || [];
      
      // Filter for public holidays
      const publicHolidays = allEvents.filter((event: Event) => 
        event.source === 'public_holiday'
      );
      
      setEvents(publicHolidays);
    } catch (error) {
      console.error('Error loading public holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this public holiday? This action cannot be undone.')) {
      return;
    }

    setDeleting(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete public holiday');
      }

      // Refresh the events list
      await loadEvents();
      onEventsUpdate();
    } catch (error) {
      console.error('Error deleting public holiday:', error);
      alert('Failed to delete public holiday. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = sortedEvents.filter(event => new Date(event.date) >= now);
  const pastEvents = sortedEvents.filter(event => new Date(event.date) < now);

  if (loading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="p-6 text-center">
          <p>Loading public holidays...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upcoming Public Holidays */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            Upcoming Public Holidays
          </CardTitle>
          <CardDescription>
            Future public holidays and school holidays
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming public holidays found
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{event.name}</h3>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        {new Date(event.date).toLocaleDateString('en-AU', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Public Holidays */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            Past Public Holidays
          </CardTitle>
          <CardDescription>
            Historical public holidays and school holidays
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pastEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No past public holidays found
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pastEvents.reverse().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors opacity-70"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{event.name}</h3>
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                        {new Date(event.date).toLocaleDateString('en-AU', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      disabled={deleting === event.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
