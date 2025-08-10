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

export type EventStatus = 'proposed' | 'approved' | 'rejected';
export type EventSource = 'pca' | 'event_secretary' | 'zone';

export interface Event {
  id:string;
  name: string;
  date: Date;
  clubId: string;
  eventTypeId: string;
  status: EventStatus;
  location: string;
  source: EventSource;
}
