import { MultiEventRequestForm } from '@/components/multi-event-request-form';
import { getClubs, getEventTypes, getEvents, getZones } from '@/lib/data';
import { HelpSection } from '@/components/ui/help-section';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function RequestEventPage() {
  const clubs = await getClubs();
  const eventTypes = await getEventTypes();
  const events = await getEvents();
  const zones = await getZones();

  return (
    <div className="space-y-6">
      {/* Enhanced Glass Header Panel */}
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl"></div>
        
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="relative rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 p-3 border border-primary/40 backdrop-blur-sm">
                  <svg className="h-7 w-7 text-primary drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
                    Request Event Dates
                  </h1>
                  <HelpTooltip 
                    content="Submit up to 4 event requests with priority rankings. Your zone coordinator will review and approve dates based on availability and policy guidelines."
                    side="right"
                  />
                </div>
                <p className="text-muted-foreground text-base mt-1">
                  Submit up to 4 event requests with priority preferences for zone approval
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <MultiEventRequestForm clubs={clubs} eventTypes={eventTypes} allEvents={events} zones={zones} />
    </div>
  );
}
