import { MultiEventRequestForm } from '@/components/multi-event-request-form';
import { getClubs, getEventTypes, getEvents, getZones } from '@/lib/data';
import { RequestEventHeader } from '@/components/request-event-header';
import { serializeFirestoreData, createLightweightClubs, createLightweightEvents, estimateDataSize } from '@/lib/data-utils';

export const dynamic = 'force-dynamic';
export const revalidate = false; // Disable caching to prevent 16MB+ cache overflow

export default async function RequestEventPage() {
  // Use Promise.all for parallel loading but with optimized data
  const [rawClubs, rawEventTypes, rawEvents, rawZones] = await Promise.all([
    getClubs(),
    getEventTypes(), 
    getEvents(),
    getZones()
  ]);

  // Serialize Firestore data and create lightweight versions
  const clubs = serializeFirestoreData(createLightweightClubs(rawClubs));
  const eventTypes = serializeFirestoreData(rawEventTypes);
  const events = serializeFirestoreData(createLightweightEvents(rawEvents));
  const zones = serializeFirestoreData(rawZones);

  // Log data sizes for debugging
  console.log('Data sizes:', {
    clubs: `${(estimateDataSize(clubs) / 1024).toFixed(1)}KB`,
    eventTypes: `${(estimateDataSize(eventTypes) / 1024).toFixed(1)}KB`, 
    events: `${(estimateDataSize(events) / 1024).toFixed(1)}KB`,
    zones: `${(estimateDataSize(zones) / 1024).toFixed(1)}KB`,
    total: `${(estimateDataSize({clubs, eventTypes, events, zones}) / (1024 * 1024)).toFixed(1)}MB`
  });

  return (
    <div className="space-y-6">
      <RequestEventHeader />
      <MultiEventRequestForm clubs={clubs} eventTypes={eventTypes} allEvents={events} zones={zones} />
    </div>
  );
}
