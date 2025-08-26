import { EventRequestForm } from '@/components/event-request-form';
import { getClubs, getEventTypes, getEvents, getZones } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EmbedRequestEventPage() {
  // Get all the required data
  const clubs = await getClubs();
  const eventTypes = await getEventTypes();
  const events = await getEvents();
  const zones = await getZones();

  // Serialize the data to handle Firestore Timestamp objects
  const serializedClubs = JSON.parse(JSON.stringify(clubs));
  const serializedEventTypes = JSON.parse(JSON.stringify(eventTypes));
  const serializedEvents = JSON.parse(JSON.stringify(events));
  const serializedZones = JSON.parse(JSON.stringify(zones));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Request an Event Date
          </h1>
          <p className="text-gray-600 mb-6">
            Fill out the form below to submit new event requests for zone approval.
          </p>
          
          <EventRequestForm 
            clubs={serializedClubs} 
            eventTypes={serializedEventTypes} 
            allEvents={serializedEvents} 
            zones={serializedZones} 
          />
        </div>
      </div>
    </div>
  );
}
