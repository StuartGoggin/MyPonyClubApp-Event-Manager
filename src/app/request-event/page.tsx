import { MultiEventRequestForm } from '@/components/multi-event-request-form';
import { getClubs, getEventTypes, getEvents, getZones } from '@/lib/data';
import { RequestEventHeader } from '@/components/request-event-header';

export const dynamic = 'force-dynamic';

export default async function RequestEventPage() {
  const clubs = await getClubs();
  const eventTypes = await getEventTypes();
  const events = await getEvents();
  const zones = await getZones();

  return (
    <div className="space-y-6">
      <RequestEventHeader />
      <MultiEventRequestForm clubs={clubs} eventTypes={eventTypes} allEvents={events} zones={zones} />
    </div>
  );
}
