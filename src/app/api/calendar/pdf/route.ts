import { NextRequest, NextResponse } from 'next/server';
import { generateCalendarPDF } from '@/lib/calendar-pdf';
// You will need to implement this function to fetch events for a date range
import { adminDb } from '@/lib/firebase-admin';
import PDFDocument from 'pdfkit';

// GET: Generate a PDF of the calendar (month or year view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'month';
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Fetch events for the requested range (stub)
    // TODO: Implement actual Firestore query for events in the range
    const events: any[] = [
      // Example event for demo
      { name: 'Demo Event', date: `${year}-${month}-15`, status: 'approved' },
    ];

    // Create PDF document
    const doc = new PDFDocument({ autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: any) => chunks.push(chunk));
    doc.on('end', () => {});

    // Prepare months array for PDF utility
    const months = [];
    if (scope === 'month') {
      months.push({ year, month });
    } else if (scope === 'year') {
      for (let m = 1; m <= 12; m++) months.push({ year, month: m });
    } else if (scope === 'custom' && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let y = start.getFullYear(), m = start.getMonth() + 1;
      const endY = end.getFullYear(), endM = end.getMonth() + 1;
      while (y < endY || (y === endY && m <= endM)) {
        months.push({ year: y, month: m });
        m++;
        if (m > 12) { m = 1; y++; }
      }
    }

    // Generate PDF
    const pdfBuffer = generateCalendarPDF({ months, events, title: 'PonyClub Events Calendar' });

    const filename = scope === 'month' ? `calendar_month_${year}_${month.toString().padStart(2, '0')}.pdf` :
                    scope === 'year' ? `calendar_year_${year}.pdf` :
                    `calendar_custom_${startDate}_to_${endDate}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed.' }, { status: 500 });
  }
}
