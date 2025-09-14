import { MultiEventRequestForm } from '@/components/multi-event-request-form';
import { getClubs, getEventTypes, getEvents, getZones } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function RequestEventPage() {
  const clubs = await getClubs();
  const eventTypes = await getEventTypes();
  const events = await getEvents();
  const zones = await getZones();

  return (
    <div className="space-y-4">
      {/* Enhanced Glass Header Panel */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className="relative rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-3 border border-primary/40 backdrop-blur-sm">
                <svg className="h-7 w-7 text-primary drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                Request Event Dates
              </h1>
              <p className="text-muted-foreground text-base mt-1">
                Submit up to 4 event requests with priority preferences for zone approval
              </p>
            </div>
          </div>
          
          {/* Priority Indicator */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-medium">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Priority 1: Must Have
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-medium">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              Priority 2: High Importance
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Priority 3: Would Like
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Priority 4: If Possible
            </div>
          </div>
        </div>
      </div>
      
      <MultiEventRequestForm clubs={clubs} eventTypes={eventTypes} allEvents={events} zones={zones} />
    </div>
  );
}
