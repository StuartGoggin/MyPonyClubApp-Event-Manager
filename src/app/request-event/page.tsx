import { EventRequestForm } from '@/components/event-request-form';
import { getClubs, getEventTypes, getEvents, getZones } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RequestEventPage() {
  const clubs = await getClubs();
  const eventTypes = await getEventTypes();
  const events = await getEvents();
  const zones = await getZones();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Request an Event Date</h1>
        <p className="text-muted-foreground">
          Fill out the form below to submit new event requests for zone approval.
        </p>
      </div>
      <EventRequestForm clubs={clubs} eventTypes={eventTypes} allEvents={events} zones={zones} />
    </div>
  );
}
