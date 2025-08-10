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

export interface Event {
  id:string;
  name: string;
  date: Date;
  clubId: string;
  eventTypeId: string;
  status: EventStatus;
  location: string;
}
