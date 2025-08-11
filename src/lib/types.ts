export interface Zone {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  zoneId: string;
  latitude?: number;
  longitude?: number;
}

export interface EventType {
  id: string;
  name: string;
}

export type EventStatus = 'proposed' | 'approved' | 'rejected' | 'public_holiday';
export type EventSource = 'pca' | 'event_secretary' | 'zone' | 'public_holiday';

export interface Event {
  id:string;
  name: string;
  date: Date;
  clubId: string;
  eventTypeId: string;
  status: EventStatus;
  location: string;
  source: EventSource;

  // New fields from form
  coordinatorName?: string;
  coordinatorContact?: string;
  isQualifier?: boolean;
  notes?: string;
  submittedBy?: string;
  submittedByContact?: string;
}
