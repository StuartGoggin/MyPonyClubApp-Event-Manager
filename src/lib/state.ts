'use client';

import { atom, Provider as JotaiProvider } from 'jotai';
import { type EventSource as AppEventSource } from './types';

export type EventSource = AppEventSource;

export const eventSourceAtom = atom<EventSource[]>(['pca', 'zone', 'public_holiday']);

export { JotaiProvider };
