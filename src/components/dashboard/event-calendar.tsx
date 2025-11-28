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
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle, Clock, Pin, Route, FerrisWheel, AlertCircle, Database, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type Event, type Club, type EventType, type Zone } from '@/lib/types';
import { EventDialog } from './event-dialog';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAtom } from 'jotai';
import { eventSourceAtom, type EventSource } from '@/lib/state';

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
  const [eventSources, setEventSources] = useAtom(eventSourceAtom);
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
  // PDF section collapsible state - hidden by default
  const [isPdfSectionVisible, setIsPdfSectionVisible] = useState(false);
  // PDF download loading state
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  // PDF event sources - independent from main calendar event sources
  const [pdfEventSources, setPdfEventSources] = useState<EventSource[]>(['pca', 'zone', 'state', 'public_holiday']);

  // State logo
  const [stateLogo, setStateLogo] = useState<string | null>(null);
  
  // Equestrian Victoria logo
  const [evLogo, setEvLogo] = useState<string | null>(null);

  // Fetch state logo
  useEffect(() => {
    const fetchStateLogo = async () => {
      try {
        const response = await fetch('/api/state-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
            setStateLogo(data.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching state logo:', error);
      }
    };
    fetchStateLogo();
  }, []);

  // Fetch Equestrian Victoria logo
  useEffect(() => {
    const fetchEVLogo = async () => {
      try {
        const response = await fetch('/api/ev-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.imageUrl && data.imageUrl.startsWith('data:image')) {
            setEvLogo(data.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching EV logo:', error);
      }
    };
    fetchEVLogo();
  }, []);

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
        format: 'zone', // Always use zone format
        eventSources: pdfEventSources.join(','), // Send PDF-specific event sources
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
    if (!clubId) return '';
    return clubs.find(club => club.id === clubId)?.name || '';
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
  // For zone events or EV events, look up zone directly from event.zoneId
  const selectedZone = selectedEvent?.zoneId 
    ? zones.find(z => z.id === selectedEvent.zoneId)
    : zones.find(z => z.id === selectedClub?.zoneId);
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
      <div className="flex flex-col gap-4 p-3 sm:p-4 border-b border-border/50">
        {/* PDF Export Controls - Collapsible Section */}
        <div className="w-full">
          {/* Collapsible Header */}
          <div 
            className="flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 rounded-lg border border-blue-200/60 dark:border-blue-800/60 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group"
            onClick={() => setIsPdfSectionVisible(!isPdfSectionVisible)}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-sm group-hover:scale-105 transition-transform flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C11.4477 2 11 2.44772 11 3V13.5858L7.70711 10.2929C7.31658 9.90237 6.68342 9.90237 6.29289 10.2929C5.90237 10.6834 5.90237 11.3166 6.29289 11.7071L11.2929 16.7071C11.6834 17.0976 12.3166 17.0976 12.7071 16.7071L17.7071 11.7071C18.0976 11.3166 18.0976 10.6834 17.7071 10.2929C17.3166 9.90237 16.6834 9.90237 16.2929 10.2929L13 13.5858V3C13 2.44772 12.5523 2 12 2Z"/>
                  <path d="M4 19C4 18.4477 4.44772 18 5 18H19C19.5523 18 20 18.4477 20 19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19Z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent truncate">
                  Download Calendar PDF
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  Customize and export your event calendar
                </p>
              </div>
            </div>
            <ChevronDown 
              className={`h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 flex-shrink-0 ${isPdfSectionVisible ? 'rotate-180' : ''}`}
            />
          </div>
      
          {/* Collapsible Content */}
          {isPdfSectionVisible && (
            <div className="mt-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-inner">
              {/* Responsive Layout: Single line on desktop with framed groups */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Event Sources Group - Framed */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 lg:flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Event Sources
                  </label>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pdf-source-zone" 
                        checked={pdfEventSources.includes('zone')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPdfEventSources([...pdfEventSources, 'zone']);
                          } else {
                            setPdfEventSources(pdfEventSources.filter(s => s !== 'zone'));
                          }
                        }}
                      />
                      <Label htmlFor="pdf-source-zone" className="text-sm font-medium cursor-pointer">
                        Zone
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pdf-source-ev" 
                        checked={pdfEventSources.includes('ev_scraper')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPdfEventSources([...pdfEventSources, 'ev_scraper']);
                          } else {
                            setPdfEventSources(pdfEventSources.filter(s => s !== 'ev_scraper'));
                          }
                        }}
                      />
                      <Label htmlFor="pdf-source-ev" className="text-sm font-medium cursor-pointer">
                        EV Events
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pdf-source-holiday" 
                        checked={pdfEventSources.includes('public_holiday')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPdfEventSources([...pdfEventSources, 'public_holiday']);
                          } else {
                            setPdfEventSources(pdfEventSources.filter(s => s !== 'public_holiday'));
                          }
                        }}
                      />
                      <Label htmlFor="pdf-source-holiday" className="text-sm font-medium cursor-pointer">
                        Holidays
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pdf-source-equipment" 
                        checked={pdfEventSources.includes('equipment_booking')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPdfEventSources([...pdfEventSources, 'equipment_booking']);
                          } else {
                            setPdfEventSources(pdfEventSources.filter(s => s !== 'equipment_booking'));
                          }
                        }}
                      />
                      <Label htmlFor="pdf-source-equipment" className="text-sm font-medium cursor-pointer">
                        Equipment
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Scope Group - Framed */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 lg:flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Scope
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={pdfFilterScope} onValueChange={(value: 'all' | 'zone' | 'club') => {
                      setPdfFilterScope(value);
                      if (value !== 'zone') setPdfSelectedZone('');
                      if (value !== 'club') setPdfSelectedClub('');
                    }}>
                      <SelectTrigger className="h-9 w-auto min-w-[140px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="zone">Zone Events</SelectItem>
                        <SelectItem value="club">Club Events</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {pdfFilterScope === 'zone' && (
                      <Select value={pdfSelectedZone} onValueChange={setPdfSelectedZone}>
                        <SelectTrigger className="h-9 w-auto min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                          <SelectValue placeholder="Select zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map(zone => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {pdfFilterScope === 'club' && (
                      <>
                        <Select value={pdfSelectedZone} onValueChange={(zoneId) => {
                          setPdfSelectedZone(zoneId);
                          setPdfSelectedClub('');
                        }}>
                          <SelectTrigger className="h-9 w-auto min-w-[140px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.map(zone => (
                              <SelectItem key={zone.id} value={zone.id}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={pdfSelectedClub} onValueChange={setPdfSelectedClub} disabled={!pdfSelectedZone}>
                          <SelectTrigger className="h-9 w-auto min-w-[160px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <SelectValue placeholder={pdfSelectedZone ? "Select club" : "Select zone first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {pdfFilteredClubs.map(club => (
                              <SelectItem key={club.id} value={club.id}>
                                {club.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </div>

                {/* Date Range Group - Framed */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 lg:flex-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Date Range
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={pdfScope} onValueChange={(value: 'month' | 'year' | 'custom') => setPdfScope(value)}>
                      <SelectTrigger className="h-9 w-auto min-w-[140px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>

                    {pdfScope === 'month' && (
                      <>
                        <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                          <SelectTrigger className="h-9 w-auto min-w-[100px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <SelectValue>
                              {monthOptions.find(m => m.value === selectedMonth)?.label}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map(m => (
                              <SelectItem key={m.value} value={String(m.value)}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={String(pdfYear)} onValueChange={(value) => setPdfYear(Number(value))}>
                          <SelectTrigger className="h-9 w-auto min-w-[90px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            <SelectValue>{pdfYear}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {yearOptions.map(y => (
                              <SelectItem key={y} value={String(y)}>
                                {y}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                    
                    {pdfScope === 'year' && (
                      <Select value={String(pdfYear)} onValueChange={(value) => setPdfYear(Number(value))}>
                        <SelectTrigger className="h-9 w-auto min-w-[90px] bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                          <SelectValue>{pdfYear}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map(y => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {pdfScope === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={pdfStartDate}
                          onChange={(e) => setPdfStartDate(e.target.value)}
                          placeholder="Start Date"
                          className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                        />
                        <input
                          type="date"
                          value={pdfEndDate}
                          onChange={(e) => setPdfEndDate(e.target.value)}
                          placeholder="End Date"
                          className="h-9 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Download Button - Full Width Below */}
              <div className="mt-4">
                <Button
                    className="w-full h-11 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 hover:from-blue-600 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                    onClick={handleDownloadPDF}
                    disabled={isPdfGenerating || (pdfScope === 'custom' && (!pdfStartDate || !pdfEndDate))}
                  >
                    {isPdfGenerating ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating PDF...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6"/>
                          <path d="M12 18v-6"/>
                          <path d="M9 15l3 3 3-3"/>
                        </svg>
                        <span>Download PDF</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
          )}
        </div>
      </div>
    
      {/* Enhanced Navigation and Filter Section */}
      <div className="space-y-3 sm:space-y-4 p-3 sm:p-0">
      {/* Top Row: Month/Year Navigation and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prev} 
            className="h-9 w-9 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-foreground transition-all duration-200 flex-shrink-0"
          >
            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent px-1 sm:px-2 min-w-[120px] sm:min-w-[140px] text-center flex-1">
            {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy')}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={next} 
            className="h-9 w-9 sm:h-8 sm:w-8 rounded-lg text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-foreground transition-all duration-200 flex-shrink-0"
          >
            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => setView('month')}
            className={`rounded-lg transition-all duration-200 flex-1 sm:flex-none ${
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
            className={`rounded-lg transition-all duration-200 flex-1 sm:flex-none ${
              view === 'year' 
                ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40' 
                : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            Year
          </Button>
        </div>
      </div>
      
      {/* Filter Section - Single line on desktop with framed groups */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2 p-3 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-border/40 shadow-md">
            {/* Filter Mode Group - Framed */}
            <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50">
              <Button 
                variant={filterMode === 'location' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setFilterMode('location')}
                className={`rounded-lg transition-all duration-200 justify-start sm:justify-center ${
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
                className={`rounded-lg transition-all duration-200 justify-start sm:justify-center ${
                  filterMode === 'distance' 
                    ? 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-lg border border-primary/40' 
                    : 'text-muted-foreground hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Route className="mr-2 h-4 w-4" /> Filter by Distance
              </Button>
            </div>
            
            {/* Filter Controls Group - Framed */}
            {filterMode === 'location' ? (
              <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50">
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
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50">
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
            )}

            {/* Event Source Filter Group - Framed */}
            {!bypassSourceFiltering && (
              <div className="flex flex-col lg:flex-row gap-2 p-2 rounded-lg bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-700/50 lg:flex-1">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                    <Database className="h-4 w-4 flex-shrink-0" />
                    <span>Event Sources:</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-zone" 
                        checked={eventSources.includes('zone')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEventSources([...eventSources, 'zone']);
                          } else {
                            setEventSources(eventSources.filter(s => s !== 'zone'));
                          }
                        }}
                      />
                      <Label htmlFor="source-zone" className="text-sm font-medium cursor-pointer">
                        Zone
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-ev" 
                        checked={eventSources.includes('ev_scraper')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEventSources([...eventSources, 'ev_scraper']);
                          } else {
                            setEventSources(eventSources.filter(s => s !== 'ev_scraper'));
                          }
                        }}
                      />
                      <Label htmlFor="source-ev" className="text-sm font-medium cursor-pointer">
                        EV Events
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-holiday" 
                        checked={eventSources.includes('public_holiday')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEventSources([...eventSources, 'public_holiday']);
                          } else {
                            setEventSources(eventSources.filter(s => s !== 'public_holiday'));
                          }
                        }}
                      />
                      <Label htmlFor="source-holiday" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        <FerrisWheel className="h-3.5 w-3.5" /> Holidays
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="source-equipment" 
                        checked={eventSources.includes('equipment_booking')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEventSources([...eventSources, 'equipment_booking']);
                          } else {
                            setEventSources(eventSources.filter(s => s !== 'equipment_booking'));
                          }
                        }}
                      />
                      <Label htmlFor="source-equipment" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" /> Equipment
                      </Label>
                    </div>
                  </div>
                </div>
            )}
      </div>
    </div>
      
    {view === 'month' && (
      <div className="p-4 min-w-0">
        <CalendarGrid month={currentDate} events={filteredEvents} onEventClick={handleEventClick} today={today} clubs={clubs} zones={zones} stateLogo={stateLogo} evLogo={evLogo}/>
      </div>
    )}
      
    {view === 'year' && (
      <div className="p-4 grid grid-cols-1 gap-8">
        {yearMonths.map(month => (
          <div key={month.toString()}>
            <CalendarGrid month={month} events={filteredEvents} onEventClick={handleEventClick} isYearView={true} today={today} clubs={clubs} zones={zones} stateLogo={stateLogo} evLogo={evLogo} />
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
  stateLogo,
  evLogo,
}: {
  month: Date;
  events: Event[];
  onEventClick: (eventId: string) => void;
  isYearView?: boolean;
  today: Date;
  clubs: Club[];
  zones: Zone[];
  stateLogo: string | null;
  evLogo: string | null;
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
    if (!clubId) return '';
    return clubs.find(club => club.id === clubId)?.name || '';
  };

  // Helper function to get club logo URL from clubId
  const getClubLogo = (clubId: string | undefined) => {
    if (!clubId) return null;
    return clubs.find(club => club.id === clubId)?.logoUrl || null;
  };

  // Helper function to get zone logo URL from zoneId
  const getZoneLogo = (zoneId: string | undefined) => {
    if (!zoneId) return null;
    const zoneLogo = zones.find(zone => zone.id === zoneId)?.imageUrl || null;
    // Only return if it's a valid base64 data URI
    return zoneLogo && zoneLogo.startsWith('data:image') ? zoneLogo : null;
  };

  // Helper function to get the appropriate logo for an event
  const getEventLogo = (event: Event) => {
    // Don't show logo for public holidays
    if (event.source === 'public_holiday') return null;
    
    // For Equestrian Victoria events (both legacy and scraped), use EV logo
    if (event.source === 'equestrian_victoria' || event.source === 'ev_scraper') {
      return evLogo || (event.clubId ? getClubLogo(event.clubId) : null);
    }
    
    // For state events, use state logo
    if (event.source === 'state') {
      return stateLogo || (event.clubId ? getClubLogo(event.clubId) : null);
    }
    
    // For zone events, try zone logo first, then club logo
    if (event.source === 'zone' && event.zoneId) {
      return getZoneLogo(event.zoneId) || (event.clubId ? getClubLogo(event.clubId) : null);
    }
    
    // For club events, use club logo
    return event.clubId ? getClubLogo(event.clubId) : null;
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
    <div className={cn("enhanced-card rounded-lg border shadow-md", { "p-2": isYearView, "p-4": !isYearView })}>
      {isYearView && (
        <h3 className="text-base font-semibold font-headline mb-2 text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{format(month, 'MMMM')}</h3>
      )}
      <div className="overflow-x-auto w-full">
        <table className={cn("w-full text-xs text-center font-medium text-muted-foreground bg-muted/30 rounded-t-lg", { "max-h-[22rem]": isYearView, "overflow-y-auto": isYearView, "p-2": isYearView }, "min-w-[640px]")}>
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
                                // Equipment bookings get teal/cyan background
                                event.source === 'equipment_booking' ? "bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-orange-300" :
                                // Zone events get distinctive brighter background
                                event.zoneId && !event.clubId ? "bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 border-blue-300" :
                                // EV events get purple background
                                event.status === 'ev_event' ? "bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 border-purple-300" :
                                // Only apply bg-white for non-public holidays and non-zone events
                                !(event.status === 'public_holiday' || event.source === 'public_holiday') && "bg-white",
                                event.status === 'approved' ? 'event-approved' :
                                event.status === 'proposed' ? 'event-proposed' :
                                (event.status === 'public_holiday' || event.source === 'public_holiday') ? 'event-holiday' :
                                event.status === 'rejected' ? 'event-rejected' :
                                event.status === 'ev_event' ? 'event-default' :
                                event.source === 'equipment_booking' ? 'event-equipment' :
                                'event-default',
                                isYearView ? "text-xs" : "text-sm"
                              )}
                              onClick={() => onEventClick(event.id)}
                            >
                              <div className={cn("flex items-stretch gap-1 sm:gap-2 h-full")}> 
                                {/* Left side content */}
                                <div className="flex-1 min-w-0 flex items-start gap-1 sm:gap-1.5">
                                  <div className="flex-shrink-0 pt-0.5">
                                    {event.source === 'equipment_booking' ? <Package className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     event.status === 'approved' ? <CheckCircle className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     event.status === 'proposed' ? <AlertCircle className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     (event.status === 'public_holiday' || event.source === 'public_holiday') ? <FerrisWheel className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-white flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     event.status === 'rejected' ? <Clock className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     event.status === 'ev_event' ? <CheckCircle className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600 flex-shrink-0", { "h-2 w-2": isYearView })}/> :
                                     <Clock className={cn("h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent flex-shrink-0", { "h-2 w-2": isYearView })}/>}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className={cn("font-medium leading-tight truncate", 
                                      isYearView ? "text-[10px]" : "text-[9px] sm:text-xs",
                                      event.source === 'equipment_booking' ? 'text-orange-800 font-semibold' :
                                      event.status === 'approved' ? 'text-primary' : 
                                      event.status === 'proposed' ? 'text-amber-800' :
                                      (event.status === 'public_holiday' || event.source === 'public_holiday') ? 'text-white font-bold' :
                                      event.status === 'rejected' ? 'text-red-700' :
                                      event.status === 'ev_event' ? 'text-purple-700' :
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
                                      {event.source === 'equipment_booking' && (event.metadata as any)?.equipmentName && (
                                        <span className={cn("inline-flex items-center rounded-full font-medium bg-orange-100 text-orange-800 border border-orange-200",
                                          isYearView ? "px-1 py-0.5 text-[7px]" : "px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px]"
                                        )}>
                                          {(event.metadata as any).equipmentName}
                                        </span>
                                      )}
                                      {event.source !== 'equipment_booking' && event.status === 'proposed' && (
                                        <span className={cn("inline-flex items-center rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200",
                                          isYearView ? "px-1 py-0.5 text-[7px]" : "px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px]"
                                        )}>
                                          Pending
                                        </span>
                                      )}
                                      {event.source !== 'equipment_booking' && event.status === 'approved' && (
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
                                      {event.status === 'ev_event' && (
                                        <span className={cn("inline-flex items-center rounded-full font-medium bg-purple-100 text-purple-700 border border-purple-200",
                                          isYearView ? "px-1 py-0.5 text-[7px]" : "px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px]"
                                        )}>
                                          EV Event
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Event Logo - Full height right side (Club, Zone, State, or EV) */}
                                {getEventLogo(event) && (
                                  <div className="flex-shrink-0 flex items-center">
                                    <img 
                                      src={getEventLogo(event)!} 
                                      alt={`${event.source === 'equestrian_victoria' ? 'Equestrian Victoria' : event.source === 'state' ? 'State' : event.source === 'zone' ? 'Zone' : getClubName(event.clubId, event)} logo`}
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
    </div>
  );

}
