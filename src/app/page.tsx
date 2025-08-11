import { EventCalendar } from '@/components/dashboard/event-calendar';
import { getEvents, getClubs, getEventTypes, getZones } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // In a real app, you would fetch this data from a database.
  const events = await getEvents();
  const clubs = await getClubs();
  const eventTypes = await getEventTypes();
  const zones = await getZones();
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Event Calendar</h1>
        <p className="text-muted-foreground">
          View and manage all proposed and approved events.
        </p>
      </div>
      <EventCalendar events={events} clubs={clubs} eventTypes={eventTypes} zones={zones} today={today} />
    </div>
  );
}
