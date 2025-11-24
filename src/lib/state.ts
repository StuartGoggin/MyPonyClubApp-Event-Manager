'use client';

import { atom, Provider as JotaiProvider } from 'jotai';
import { type EventSource as AppEventSource } from './types';

export type EventSource = AppEventSource;

export const eventSourceAtom = atom<EventSource[]>(['pca', 'zone', 'state', 'public_holiday', 'equipment_booking']);

export { JotaiProvider };
