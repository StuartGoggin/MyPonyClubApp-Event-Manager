import { NextRequest, NextResponse } from 'next/server';
import { generateEventRequestPDF, generateReferenceNumber, type EventRequestFormData } from '@/lib/event-request-pdf';
import { getClubs, getEventTypes } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const formData: EventRequestFormData = await request.json();
    
    // Validate required fields
    if (!formData.submittedBy || !formData.events || formData.events.length === 0) {
      return NextResponse.json(
        { error: 'Missing required form data' },
        { status: 400 }
      );
    }

    // Enrich the form data with additional information
    let clubs: any[] = [];
    let eventTypes: any[] = [];
    
    try {
      clubs = await getClubs();
      eventTypes = await getEventTypes();
    } catch (error) {
      console.warn('Failed to load clubs or event types for PDF generation:', error);
      // Continue without enrichment - PDF will use provided data only
    }

    // Enrich club information
    const club = clubs.find(c => c.id === formData.clubId);
    if (club) {
      formData.clubName = club.name;
    }

    // Enrich event type information for each event
    formData.events = formData.events.map(event => {
      const eventType = eventTypes.find(et => et.id === event.eventTypeId);
      return {
        ...event,
        eventTypeName: eventType?.name || 'Unknown Event Type'
      };
    });

    // Generate reference number
    const referenceNumber = generateReferenceNumber();
    
    // Generate PDF (now async)
    const pdfBuffer = await generateEventRequestPDF({
      formData,
      title: 'Pony Club Event Request Form',
      submissionDate: new Date(),
      referenceNumber
    });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `Event-Request-${timestamp}.pdf`;

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache',
        'X-Reference-Number': referenceNumber
      }
    });

  } catch (error) {
    console.error('Event Request PDF API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET method for testing/health check
export async function GET() {
  return NextResponse.json({
    message: 'Event Request PDF API is operational',
    endpoint: '/api/event-request/pdf',
    method: 'POST',
    description: 'Generate PDF document from event request form data'
  });
}