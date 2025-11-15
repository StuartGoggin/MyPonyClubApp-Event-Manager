"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState, useMemo, useEffect } from 'react';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  addMonths,
  subMonths,
  differenceInDays,
  getDay,
  getYear,
  setYear,
  startOfYear,
  addDays,
  getDaysInMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle, Clock, Pin, Route, FerrisWheel, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type Event, type Club, type EventType, type Zone } from '@/lib/types';
import { EventDialog } from './event-dialog';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAtom } from 'jotai';
import { eventSourceAtom } from '@/lib/state';

interface EventCalendarProps {
  events: Event[];
  clubs: Club[];
  eventTypes: EventType[];
  zones: Zone[];
  today: Date;
  bypassSourceFiltering?: boolean; // New prop to bypass event source filtering
  currentUser?: {
    id: string;
    role: string;
    zoneId?: string;
    clubId?: string;
  } | null;
}

export function EventCalendar({
  events,
  clubs,
  eventTypes,
  zones,
  today,
  bypassSourceFiltering = false,
  currentUser
}: EventCalendarProps) {
  const currentYear = getYear(new Date());
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i); // 2 years back, 3 forward
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('month');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [eventSources] = useAtom(eventSourceAtom);
  const [filterMode, setFilterMode] = useState<'location' | 'distance'>('location');
  // PDF export state - default to year scope and next year
  const nextYear = currentYear + 1;
  const [pdfScope, setPdfScope] = useState<'month' | 'year' | 'custom'>('year');
  const [pdfYear, setPdfYear] = useState(nextYear);
  const [pdfStartDate, setPdfStartDate] = useState<string>('');
  const [pdfEndDate, setPdfEndDate] = useState<string>('');
  // PDF scope filtering state - default to zone
  const [pdfFilterScope, setPdfFilterScope] = useState<'all' | 'zone' | 'club'>('zone');
  const [pdfSelectedZone, setPdfSelectedZone] = useState<string>('');
  const [pdfSelectedClub, setPdfSelectedClub] = useState<string>('');
  // PDF format state - default to zone format
  const [pdfFormat, setPdfFormat] = useState<'standard' | 'zone'>('zone');
  // PDF section collapsible state - hidden by default
  const [isPdfSectionVisible, setIsPdfSectionVisible] = useState(false);
  // PDF download loading state
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  // Initialize PDF defaults based on user authentication
  useEffect(() => {
    // Set default scope to 'zone'
    setPdfFilterScope('zone');
    
    // If user is authenticated and has a zone, auto-select it
    if (currentUser?.zoneId) {
      setPdfSelectedZone(currentUser.zoneId);
    }
  }, [currentUser]);

  const handleDownloadPDF = async () => {
    setIsPdfGenerating(true);
    try {
      const params = new URLSearchParams({
        scope: pdfScope,
        year: pdfScope === 'year' ? String(pdfYear) : pdfScope === 'month' ? String(pdfYear) : '',
        month: pdfScope === 'month' ? String(selectedMonth) : '',
        startDate: pdfScope === 'custom' ? pdfStartDate : '',
        endDate: pdfScope === 'custom' ? pdfEndDate : '',
        filterScope: pdfFilterScope,
        zoneId: pdfFilterScope === 'zone' ? pdfSelectedZone : '',
        clubId: pdfFilterScope === 'club' ? pdfSelectedClub : '',
        format: pdfFormat,
      });
      const res = await fetch(`/api/calendar/pdf?${params.toString()}`);
      if (!res.ok) {
        alert('Failed to generate PDF');
        return;
      }
      
      // Extract filename from Content-Disposition header
      const contentDisposition = res.headers.get('Content-Disposition');
      let filename = 'calendar.pdf'; // Default fallback
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [homeClubId, setHomeClubId] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(50);

  // Helper function to get club name from clubId or zone name for zone events
  const getClubName = (clubId: string | undefined, event?: Event) => {
    // Check if this is a zone-level event
    if (event?.zoneId && !event?.clubId) {
      const zone = zones.find(z => z.id === event.zoneId);
      return zone ? `${zone.name} (Zone Event)` : 'Zone Event';
    }
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  const filteredClubs = useMemo(() => {
    if (selectedZoneId === 'all') {
      return clubs;
    }
    return clubs.filter(club => club.zoneId === selectedZoneId);
  }, [selectedZoneId, clubs]);

  // Filtered clubs for PDF scope selection based on selected zone
  const pdfFilteredClubs = useMemo(() => {
    if (pdfSelectedZone === '') {
      return clubs;
    }
    return clubs.filter(club => club.zoneId === pdfSelectedZone);
  }, [pdfSelectedZone, clubs]);

  const sourceFilteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    if (bypassSourceFiltering) return events;
    if (eventSources.length === 0) return events;
    return events.filter(event => {
      // Include state events when 'zone' is selected
      if (event.source === 'state' && eventSources.includes('zone')) return true;
      return eventSources.includes(event.source);
    });
  }, [events, eventSources, bypassSourceFiltering]);

  const filteredEvents = useMemo(() => {
    const eventsFromSource = sourceFilteredEvents;
    if (!Array.isArray(eventsFromSource)) return [];
    
    let filtered: Event[] = [];
    
    if (filterMode === 'distance' && homeClubId) {
      const homeClub = clubs.find(c => c.id === homeClubId);
      if (!homeClub || homeClub.latitude === undefined || homeClub.longitude === undefined) return eventsFromSource.filter(e => e.source === 'public_holiday');
      const homeCoords = { lat: homeClub.latitude, lon: homeClub.longitude };
      filtered = eventsFromSource.filter(event => {
        if (event.source === 'public_holiday') return true;
        const eventClub = clubs.find(c => c.id === event.clubId);
        if (!eventClub || eventClub.latitude === undefined || eventClub.longitude === undefined) return false;
        const eventCoords = { lat: eventClub.latitude, lon: eventClub.longitude };
        const dist = haversineDistance(homeCoords, eventCoords);
        return dist <= distance;
      });
    } else {
      // Location-based filtering
      filtered = eventsFromSource.filter(event => {
        if (event.source === 'public_holiday') return true;
        
        // State events (no clubId and no zoneId) should always be visible
        if (!event.clubId && !event.zoneId) return true;
        
        if (selectedClubId !== 'all') {
          return event.clubId === selectedClubId;
        }
        if (selectedZoneId !== 'all') {
          // Zone events (zoneId but no clubId) match the selected zone
          if (event.zoneId && !event.clubId) {
            return event.zoneId === selectedZoneId;
          }
          // Club events match if their club is in the selected zone
          const clubIsInZone = clubs.find(c => c.id === event.clubId)?.zoneId === selectedZoneId;
          return clubIsInZone;
        }
        return true;
      });
    }

    // Sort events to prioritize public holidays first, then by date
    return filtered.sort((a, b) => {
      // First, sort by date
      const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      
      // For events on the same day, public holidays come first
      if (a.source === 'public_holiday' && b.source !== 'public_holiday') return -1;
      if (a.source !== 'public_holiday' && b.source === 'public_holiday') return 1;
      
      // For non-public holidays on the same day, maintain original order
      return 0;
    });
  }, [sourceFilteredEvents, clubs, filterMode, homeClubId, distance, selectedZoneId, selectedClubId]);

  const handleZoneChange = (zoneId: string) => {
    setSelectedZoneId(zoneId);
    setSelectedClubId('all');
  };

  const next = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 12));
    }
  };

  const prev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, -12));
    }
  };

  const handleEventClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDialogOpen(true);
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const selectedClub = clubs.find(c => c.id === selectedEvent?.clubId);
  const selectedZone = zones.find(z => z.id === selectedClub?.zoneId);
  const selectedEventType = eventTypes.find(et => et.id === selectedEvent?.eventTypeId);

  const getNearbyEvents = (event: Event) => {
    if (!event || event.status === 'public_holiday' || !Array.isArray(events)) return [];
    const eventDate = new Date(event.date);
    return events.filter(e => {
      if (e.id === event.id) return false;
      const otherEventDate = new Date(e.date);
      const dayDiff = Math.abs(differenceInDays(eventDate, otherEventDate));
      return dayDiff <= 2;
    });
  };

  const yearMonths = Array.from({ length: 12 }, (_, i) => {
    return setYear(startOfYear(new Date()), getYear(currentDate));
  }).map((d, i) => addMonths(d, i));

  if (!today) {
    return null;
  }

  return (
    <div className="enhanced-card rounded-lg border shadow-lg glass-effect">
      <div className="flex flex-col gap-4 p-4 border-b border-border/50">
        {/* PDF Export Controls - Collapsible Section */}
        <div className="w-full">
          {/* Collapsible Header */}
          <div 
            className="flex items-center justify-between p-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-border/40 shadow-sm cursor-pointer hover:from-primary/15 hover:to-accent/15 transition-colors"
            onClick={() => setIsPdfSectionVisible(!isPdfSectionVisible)}
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C11.4477 2 11 2.44772 11 3V13.5858L7.70711 10.2929C7.31658 9.90237 6.68342 9.90237 6.29289 10.2929C5.90237 10.6834 5.90237 11.3166 6.29289 11.7071L11.2929 16.7071C11.6834 17.0976 12.3166 17.0976 12.7071 16.7071L17.7071 11.7071C18.0976 11.3166 18.0976 10.6834 17.7071 10.2929C17.3166 9.90237 16.6834 9.90237 16.2929 10.2929L13 13.5858V3C13 2.44772 12.5523 2 12 2Z"/>
                <path d="M4 19C4 18.4477 4.44772 18 5 18H19C19.5523 18 20 18.4477 20 19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19Z"/>
              </svg>
              <span className="text-xs font-semibold text-primary">Download Calendar</span>
            </div>
            <ChevronDown 
              className={`h-4 w-4 text-primary transition-transform duration-200 ${isPdfSectionVisible ? 'rotate-180' : ''}`}
            />
          </div>
      
          {/* Collapsible Content */}
          {isPdfSectionVisible && (
            <div className="mt-2 p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-border/30">
              <div className="flex flex-col gap-3">
                {/* Scope Selection Row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-primary whitespace-nowrap">Scope:</label>
                    <Select value={pdfFilterScope} onValueChange={(value: 'all' | 'zone' | 'club') => {
                      setPdfFilterScope(value);
                      if (value !== 'zone') setPdfSelectedZone('');
                      if (value !== 'club') setPdfSelectedClub('');
                    }}>
                      <SelectTrigger className="h-6 text-xs min-w-[130px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs">All Events</SelectItem>
                        <SelectItem value="zone" className="text-xs">Zone Events</SelectItem>
                        <SelectItem value="club" className="text-xs">Club Events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Zone Selection */}
                  {pdfFilterScope === 'zone' && (
                    <Select value={pdfSelectedZone} onValueChange={setPdfSelectedZone}>
                      <SelectTrigger className="h-6 text-xs min-w-[120px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map(zone => (
                          <SelectItem key={zone.id} value={zone.id} className="text-xs">
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Club Selection - Zone and Club on same row */}
                  {pdfFilterScope === 'club' && (
                    <>
                      <Select value={pdfSelectedZone} onValueChange={(zoneId) => {
                        setPdfSelectedZone(zoneId);
                        setPdfSelectedClub(''); // Reset club selection when zone changes
                      }}>
                        <SelectTrigger className="h-6 text-xs min-w-[120px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                          <SelectValue placeholder="Select zone first" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map(zone => (
                            <SelectItem key={zone.id} value={zone.id} className="text-xs">
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={pdfSelectedClub} onValueChange={setPdfSelectedClub} disabled={!pdfSelectedZone}>
                        <SelectTrigger className="h-6 text-xs min-w-[150px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                          <SelectValue placeholder={pdfSelectedZone ? "Select club" : "Select zone first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {pdfFilteredClubs.map(club => (
                            <SelectItem key={club.id} value={club.id} className="text-xs">
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>

                {/* Format Selection Row */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-primary whitespace-nowrap">Format:</label>
                    <Select value={pdfFormat} onValueChange={(value: 'standard' | 'zone') => setPdfFormat(value)}>
                      <SelectTrigger className="h-6 text-xs min-w-[130px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard" className="text-xs">Standard Format</SelectItem>
                        <SelectItem value="zone" className="text-xs">Zone Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Date Range and Download Controls */}
                <div className="flex items-center gap-4 w-full">
                  {/* Date Range Selector - Left Side */}
                  <div className="flex gap-1">
                    <Button
                      variant={pdfScope === 'month' ? 'secondary' : 'outline'}
                      size="sm"
                      className={pdfScope === 'month' ? 'premium-button px-2 py-1 text-xs' : 'premium-button-outline px-2 py-1 text-xs'}
                      onClick={() => setPdfScope('month')}
                    >
                      This Month
                    </Button>
                    <Button
                      variant={pdfScope === 'year' ? 'secondary' : 'outline'}
                      size="sm"
                      className={pdfScope === 'year' ? 'premium-button px-2 py-1 text-xs' : 'premium-button-outline px-2 py-1 text-xs'}
                      onClick={() => setPdfScope('year')}
                    >
                      This Year
                    </Button>
                    <Button
                      variant={pdfScope === 'custom' ? 'secondary' : 'outline'}
                      size="sm"
                      className={pdfScope === 'custom' ? 'premium-button px-2 py-1 text-xs' : 'premium-button-outline px-2 py-1 text-xs'}
                      onClick={() => setPdfScope('custom')}
                    >
                      Custom Range
                    </Button>
                  </div>
                  
                  {/* Date Selectors - Center, taking remaining space */}
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    {pdfScope === 'month' && (
                      <>
                        <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                          <SelectTrigger className="h-6 text-xs min-w-[90px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                            <SelectValue>
                              {monthOptions.find(m => m.value === selectedMonth)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map(m => (
                              <SelectItem key={m.value} value={String(m.value)} className="text-xs">
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={String(pdfYear)} onValueChange={(value) => setPdfYear(Number(value))}>
                          <SelectTrigger className="h-6 text-xs min-w-[70px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                            <SelectValue>{pdfYear}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map(y => (
                              <SelectItem key={y} value={String(y)} className="text-xs">
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    {pdfScope === 'year' && (
                      <Select value={String(pdfYear)} onValueChange={(value) => setPdfYear(Number(value))}>
                        <SelectTrigger className="h-6 text-xs min-w-[70px] px-2 py-0.5 border-primary/40 bg-gradient-to-r from-primary/5 to-accent/5">
                          <SelectValue>{pdfYear}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(y => (
                            <SelectItem key={y} value={String(y)} className="text-xs">
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {pdfScope === 'custom' && (
                      <>
                        <label htmlFor="pdfStartDate" className="text-xs font-semibold text-primary">Start</label>
                        <input
                          id="pdfStartDate"
                          type="date"
                          value={pdfStartDate}
                          onChange={e => setPdfStartDate(e.target.value)}
                          className="border border-primary/40 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary/40 min-w-[90px] text-xs"
                          placeholder="Start date"
                          title="Select start date"
                        />
                        <label htmlFor="pdfEndDate" className="text-xs font-semibold text-primary">End</label>
                        <input
                          id="pdfEndDate"
                          type="date"
                          value={pdfEndDate}
                          onChange={e => setPdfEndDate(e.target.value)}
                          className="border border-primary/40 rounded px-1 py-0.5 focus:ring-1 focus:ring-primary/40 min-w-[90px] text-xs"
                          placeholder="End date"
                          title="Select end date"
                        />
                      </>
                    )}
                  </div>
                  
                  {/* Download Button - Right Side */}
                  <div className="flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="premium-button font-bold px-3 py-1 text-sm shadow ring-1 ring-primary/20 hover:ring-accent/30 transition"
                      onClick={handleDownloadPDF}
                      disabled={isPdfGenerating || (pdfScope === 'custom' && (!pdfStartDate || !pdfEndDate))}
                    >
                      {isPdfGenerating ? (
                        <>
                          <span className="mr-1 animate-spin">⏳</span> Generating...
                        </>
                      ) : (
                        <>
                          <span className="mr-1">📄</span> Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    
    {/* Enhanced Navigation and Filter Section */}
    <div className="space-y-4">
      {/* Top Row: Month/Year Navigation and View Toggle */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prev} 
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-foreground transition-all duration-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg sm:text-xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-2 min-w-[140px] text-center">
            {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy')}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={next} 
            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-foreground transition-all duration-200"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView('month')}
            className={`rounded-lg transition-all duration-200 ${
              view === 'month' 
                ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40' 
                : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Month
          </Button>
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView('year')}
            className={`rounded-lg transition-all duration-200 ${
              view === 'year' 
                ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40' 
                : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Year
          </Button>
        </div>
      </div>
      
      {/* Filter Section */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 p-3 sm:p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
            {/* Filter Mode Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
              <Button 
                variant={filterMode === 'location' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilterMode('location')}
                className={`rounded-lg transition-all duration-200 py-2 sm:py-1.5 ${
                  filterMode === 'location' 
                    ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40' 
                    : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Pin className="mr-2 h-4 w-4" /> Filter by Location
              </Button>
              <Button 
                variant={filterMode === 'distance' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilterMode('distance')}
                className={`rounded-lg transition-all duration-200 py-2 sm:py-1.5 ${
                  filterMode === 'distance' 
                    ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40' 
                    : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Route className="mr-2 h-4 w-4" /> Filter by Distance
              </Button>
            </div>
            
            {/* Filter Controls - Inline on desktop, stacked on mobile */}
            {filterMode === 'location' ? (
              <>
                <div className="hidden sm:block w-px h-6 bg-border/40 mx-1"></div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                  <Select value={selectedZoneId} onValueChange={handleZoneChange}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9 text-sm border-primary/30 bg-background/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                      <SelectItem value="all">All of Victoria</SelectItem>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedClubId} onValueChange={setSelectedClubId} disabled={selectedZoneId === 'all' && filteredClubs.length === clubs.length}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-9 text-sm border-primary/30 bg-background/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Select Club" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                      <SelectItem value="all">All Clubs</SelectItem>
                      {filteredClubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="hidden sm:block w-px h-6 bg-border/40 mx-1"></div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 w-full sm:w-auto">
                  <Select value={homeClubId ?? ''} onValueChange={(val) => setHomeClubId(val === 'none' ? null : val)}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10 sm:h-9 text-sm border-primary/30 bg-background/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Select a home club" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                      <SelectItem value="none">Select a home club</SelectItem>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(distance)} onValueChange={(val) => setDistance(Number(val))} disabled={!homeClubId}>
                    <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-9 text-sm border-primary/30 bg-background/50 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/50">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 bg-background/95 backdrop-blur-md">
                      <SelectItem value="25">Within 25 km</SelectItem>
                      <SelectItem value="50">Within 50 km</SelectItem>
                      <SelectItem value="100">Within 100 km</SelectItem>
                      <SelectItem value="200">Within 200 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
      </div>
    </div>
      
    {view === 'month' && (
      <div className='p-4'>
        <CalendarGrid month={currentDate} events={filteredEvents} onEventClick={handleEventClick} today={today} clubs={clubs} zones={zones}/>
      </div>
    )}
      
    {view === 'year' && (
      <div className="p-4 grid grid-cols-1 gap-8">
        {yearMonths.map(month => (
          <div
            key={month.toString()}
            className="bg-white rounded-lg shadow p-4 flex flex-col w-full"
          >
            <CalendarGrid month={month} events={filteredEvents} onEventClick={handleEventClick} isYearView={true} today={today} clubs={clubs} zones={zones} />
          </div>
        ))}
      </div>
    )}

    <EventDialog
      isOpen={isDialogOpen}
      onOpenChange={setDialogOpen}
      event={selectedEvent || null}
      club={selectedClub}
      zone={selectedZone}
      eventType={selectedEventType}
      nearbyEvents={selectedEvent ? getNearbyEvents(selectedEvent) : []}
      clubs={clubs}
      currentUser={currentUser}
    />
  </div>
  );
}

const haversineDistance = (
  coords1: { lat: number; lon: number },
  coords2: { lat: number; lon: number }
) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lon - coords1.lon);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const weekStartsOn = 3; // Wednesday

const CalendarGrid = ({
  // ...props destructuring...
  month,
  events,
  onEventClick,
  isYearView = false,
  today,
  clubs,
  zones,
}: {
  month: Date;
  events: Event[];
  onEventClick: (eventId: string) => void;
  isYearView?: boolean;
  today: Date;
  clubs: Club[];
  zones: Zone[];
}) => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn });
  
  // Helper function to get club name from clubId or zone name for zone events
  const getClubName = (clubId: string | undefined, event?: Event) => {
    // Check if this is a zone-level event
    if (event?.zoneId && !event?.clubId) {
      const zone = zones.find(z => z.id === event.zoneId);
      return zone ? `${zone.name} (Zone Event)` : 'Zone Event';
    }
    if (!clubId) return 'Unknown Club';
    return clubs.find(club => club.id === clubId)?.name || 'Unknown Club';
  };

  // Helper function to get club logo URL from clubId
  const getClubLogo = (clubId: string | undefined) => {
    if (!clubId) return null;
    return clubs.find(club => club.id === clubId)?.logoUrl || null;
  };
  
  const weeks: Date[][] = [];
  let day = start;
  while (day <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  
  const dayOrder = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  const dayIndexMap = [3, 4, 5, 6, 0, 1, 2]; // Wed=3, Thu=4, ..., Tue=2

  const activeDaysOfMonth = useMemo(() => {
    if (!isYearView) return new Set();
    if (!Array.isArray(events)) return new Set();

    const activeDays = new Set<number>();
    const monthEvents = events.filter(event => isSameMonth(new Date(event.date), month));
    
    monthEvents.forEach(event => {
      activeDays.add(getDay(new Date(event.date)));
    });
    
    return activeDays;
  }, [events, month, isYearView]);

  return (
    <div className={cn("enhanced-card rounded-lg border shadow-md overflow-x-auto", { "p-2": isYearView, "p-4": !isYearView })}>
      {isYearView && (
        <h3 className="text-base font-semibold font-headline mb-2 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{format(month, 'MMMM')}</h3>
      )}
  <table className={cn("w-full min-w-full text-xs text-center font-medium text-muted-foreground bg-muted/30 rounded-t-lg", { "max-h-[22rem]": isYearView, "overflow-y-auto": isYearView, "p-2": isYearView })}>
        <thead>
          <tr>
            {dayOrder.map((day) => (
              <th key={day} className="py-2 sm:py-3 font-semibold text-[10px] sm:text-xs">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => {
            if (!week.some(d => isSameMonth(d, month))) {
              return null;
            }
            return (
              <tr key={weekIndex}>
                {dayIndexMap.map(dayIdx => {
                  const day = week.find(d => getDay(d) === dayIdx)!;
                  const isSaturday = getDay(day) === 6;
                  const isSunday = getDay(day) === 0;
                  const isCurrentDayToday = isSameDay(day, today);
                  const dayEvents = Array.isArray(events) ? 
                    events
                      .filter(event => isSameDay(new Date(event.date), day))
                      .sort((a, b) => {
                        // Public holidays come first
                        if ((a.source === 'public_holiday' || a.status === 'public_holiday') && 
                            !(b.source === 'public_holiday' || b.status === 'public_holiday')) return -1;
                        if (!(a.source === 'public_holiday' || a.status === 'public_holiday') && 
                            (b.source === 'public_holiday' || b.status === 'public_holiday')) return 1;
                        return 0;
                      }) 
                    : [];
                  const isDayActiveInMonth = activeDaysOfMonth.has(dayIdx);
                  const isDayInCurrentMonth = isSameMonth(day, month);
                  return (
                    <td key={day.toString()} className={cn('relative p-0.5 sm:p-1.5 min-h-[4rem] sm:min-h-[6rem] align-top', {
                      'text-muted-foreground': !isDayInCurrentMonth,
                      // Uniform darker blue for weekends
                      'bg-blue-100': isSaturday || isSunday,
                      'relative': isCurrentDayToday,
                    })}>
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'font-bold text-[10px] sm:text-sm mb-0.5 sm:mb-1 mt-0 text-center w-full flex justify-center items-start',
                            { 'text-blue-700': isCurrentDayToday, 'text-gray-700': !isCurrentDayToday }
                          )}
                        >
                          {day.getDate()}
                        </span>
                        {/* Events for this day */}
                        <div className="flex flex-col gap-1 sm:gap-2 w-full items-center">
                          {dayEvents.map((event, i) => (
                            <button
                              key={event.id || i}
                              className={cn(
                                "rounded-lg sm:rounded-xl shadow-sm border p-1 sm:p-2 text-left transition hover:ring-2 hover:ring-primary inline-block max-w-full",
                                // Zone events get distinctive brighter background
                                event.zoneId && !event.clubId ? "bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 border-blue-300" :
                                // Only apply bg-white for non-public holidays and non-zone events
                                !(event.status === 'public_holiday' || event.source === 'public_holiday') && "bg-white",
                                event.status === 'approved' ? 'event-approved' :
                                event.status === 'proposed' ? 'event-proposed' :
                                (event.status === 'public_holiday' || event.source === 'public_holiday') ? 'event-holiday' :
                                event.status === 'rejected' ? 'event-rejected' :
                                'event-default',
                                isYearView ? "text-xs" : "text-sm"
                              )}
                              onClick={() => onEventClick(event.id)}
                            >
                              <div className={cn("flex items-stretch gap-1 sm:gap-2 h-full")}> 
                                {/* Left side content */}
                                <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-1.5">
                                  <div className="flex-shrink-0 pt-0.5">
                                    {event.status === 'approved' ? <CheckCircle className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     event.status === 'proposed' ? <AlertCircle className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     (event.status === 'public_holiday' || event.source === 'public_holiday') ? <FerrisWheel className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-white flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     event.status === 'rejected' ? <Clock className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     <Clock className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent flex-shrink-0", { "h-2 w-2": isYearView })}/>}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className={cn("font-medium leading-tight truncate", 
                                      isYearView ? "text-[10px]" : "text-[9px] sm:text-xs",
                                      event.status === 'approved' ? 'text-primary' : 
                                      event.status === 'proposed' ? 'text-amber-800' :
                                      (event.status === 'public_holiday' || event.source === 'public_holiday') ? 'text-white font-bold' :
                                      event.status === 'rejected' ? 'text-red-700' :
                                      'text-accent'
                                    )}>{event.name}</div>
                                    {event.source !== 'public_holiday' && (
                                      <div className={cn("text-muted-foreground font-medium leading-tight truncate",
                                        isYearView ? "text-[8px]" : "text-[8px] sm:text-[9px]",
                                        // Make zone events brighter
                                        event.zoneId && !event.clubId ? "text-blue-700 font-semibold" : ""
                                      )}>
                                        {getClubName(event.clubId, event)}
                                      </div>
                                    )}
                                    <div className="flex">
                                      {event.status === 'proposed' && (
                                        <span className={cn("inline-flex items-center rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200",
                                          isYearView ? "px-1 py-0.5 text-[7px]" : "px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px]"
                                        )}>
                                          Pending
                                        </span>
                                      )}
                                      {event.status === 'approved' && (
                                        <span className={cn("inline-flex items-center rounded-full font-medium bg-green-100 text-green-700 border border-green-200",
                                          isYearView ? "px-1 py-0.5 text-[7px]" : "px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px]"
                                        )}>
                                          Approved
                                        </span>
                                      )}
                                      {event.status === 'rejected' && (
                                        <span className={cn("inline-flex items-center rounded-full font-medium bg-red-100 text-red-700 border border-red-200",
                                          isYearView ? "px-1 py-0.5 text-[7px]" : "px-1.5 py-0.5 text-[8px]"
                                        )}>
                                          Rejected
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Club Logo - Full height right side */}
                                {event.source !== 'public_holiday' && getClubLogo(event.clubId) && (
                                  <div className="flex-shrink-0 flex items-center">
                                    <img 
                                      src={getClubLogo(event.clubId)!} 
                                      alt={`${getClubName(event.clubId, event)} logo`}
                                      className={cn(
                                        "rounded object-contain bg-white border border-gray-200 max-w-full max-h-full",
                                        isYearView ? "w-10 h-10" : "w-14 h-14"
                                      )}
                                      onError={(e) => {
                                        // Hide the image if it fails to load
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

}
