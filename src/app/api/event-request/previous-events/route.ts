import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyEventRequestToken } from '@/lib/event-request-verification';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const toDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const templateName = (name: string) => name.replace(/\s*\(Priority \d+(?: - Traditional)?\)$/i, '');

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    const verification = token ? await verifyEventRequestToken(token) : null;

    if (!verification) {
      return NextResponse.json({ error: 'Email verification is required.' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection unavailable.' }, { status: 503 });
    }

    const snapshot = await adminDb.collection('events').where('clubId', '==', verification.clubId).get();
    const templates = snapshot.docs
      .map((doc: any) => {
        const event = doc.data();
        const date = toDate(event.date);
        if (!date || event.status === 'rejected') return null;

        return {
          id: doc.id,
          name: templateName(event.name || 'Untitled event'),
          date: date.toISOString(),
          eventTypeId: event.eventTypeId || '',
          location: event.location || '',
          eventLink: event.eventLink || '',
          isQualifier: Boolean(event.isQualifier),
          isHistoricallyTraditional: Boolean(event.isHistoricallyTraditional),
          description: event.description || '',
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))
      .slice(0, 24);

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('Previous event templates error:', error);
    return NextResponse.json({ error: 'Unable to load previous events.' }, { status: 500 });
  }
}
