'use client';

import { atom, Provider as JotaiProvider } from 'jotai';
import { type EventSource as AppEventSource } from './types';

export type EventSource = AppEventSource;

export const eventSourceAtom = atom<EventSource[]>(['pca', 'event_secretary', 'zone']);

export { JotaiProvider };
