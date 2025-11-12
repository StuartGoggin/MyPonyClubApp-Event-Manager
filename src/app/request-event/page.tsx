import { MultiEventRequestForm } from '@/components/multi-event-request-form';
import { getAllClubs, getAllEventTypes, getAllZones } from '@/lib/server-data';
import { RequestEventHeader } from '@/components/request-event-header';
import { serializeFirestoreData, createLightweightClubs, estimateDataSize } from '@/lib/data-utils';

export const dynamic = 'force-dynamic';
export const revalidate = false; // Disable caching to prevent 16MB+ cache overflow

export default async function RequestEventPage() {
  // Use Promise.all for parallel loading with cached data from server-data
  // Note: We don't fetch events here as they're not used in the request form
  const [rawClubs, rawEventTypes, rawZones] = await Promise.all([
    getAllClubs(),
    getAllEventTypes(), 
    getAllZones()
  ]);

  // Serialize Firestore data and create lightweight versions
  const clubs = serializeFirestoreData(createLightweightClubs(rawClubs));
  const eventTypes = serializeFirestoreData(rawEventTypes);
  const zones = serializeFirestoreData(rawZones);

  // Log data sizes for debugging
  console.log('Data sizes:', {
    clubs: `${(estimateDataSize(clubs) / 1024).toFixed(1)}KB`,
    eventTypes: `${(estimateDataSize(eventTypes) / 1024).toFixed(1)}KB`, 
    zones: `${(estimateDataSize(zones) / 1024).toFixed(1)}KB`,
    total: `${(estimateDataSize({clubs, eventTypes, zones}) / (1024 * 1024)).toFixed(1)}MB`
  });

  return (
    <div className="space-y-6">
      <RequestEventHeader />
      <MultiEventRequestForm clubs={clubs} eventTypes={eventTypes} zones={zones} />
    </div>
  );
}
