import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Get the event with schedule
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    
    if (!eventData?.schedule?.fileUrl) {
      return NextResponse.json(
        { error: 'Event has no schedule to review' },
        { status: 400 }
      );
    }

    // Download the schedule file
    const scheduleUrl = eventData.schedule.fileUrl;
    const response = await fetch(scheduleUrl);
    
    if (!response.ok) {
      throw new Error('Failed to download schedule file');
    }

    const fileBuffer = await response.arrayBuffer();
    const fileType = eventData.schedule.fileType;

    // Convert buffer to base64 for Gemini
    const base64Data = Buffer.from(fileBuffer).toString('base64');

    // Prepare the AI model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create the prompt for schedule compliance review
    const prompt = `You are an expert Pony Club event schedule reviewer. Review the following event schedule document for compliance with Pony Club standards.

Event Details:
- Event Name: ${eventData.name}
- Event Type: ${eventData.eventTypeId}
- Date: ${eventData.date}
- Location: ${eventData.location || 'Not specified'}

Please analyze the schedule and provide:

1. A list of compliance issues found (if any)
2. Safety concerns or missing safety requirements
3. Timing and scheduling conflicts
4. Missing required activities or information
5. Suggested improvements

Format your response as a JSON object with the following structure:
{
  "summary": "Brief overall assessment",
  "issues": [
    {
      "severity": "high|medium|low",
      "category": "safety|timing|compliance|content",
      "description": "Issue description"
    }
  ],
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "overallScore": 0-100,
  "compliant": true|false
}`;

    // Call Gemini API with the document
    let result;
    if (fileType === 'pdf') {
      result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Data,
          },
        },
        prompt,
      ]);
    } else {
      // For text-based documents
      const textContent = Buffer.from(fileBuffer).toString('utf-8');
      result = await model.generateContent([
        `${prompt}\n\nSchedule Content:\n${textContent}`,
      ]);
    }

    const responseText = result.response.text();
    
    // Parse the JSON response
    let aiReview;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/```\n([\s\S]*?)\n```/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      aiReview = JSON.parse(jsonText);
    } catch (parseError) {
      // If parsing fails, create a structured response from the text
      aiReview = {
        summary: responseText.substring(0, 200),
        issues: [],
        suggestions: [],
        overallScore: 50,
        compliant: true,
        rawResponse: responseText
      };
    }

    // Save the AI review to the event schedule
    await eventRef.update({
      'schedule.aiReview': {
        ...aiReview,
        reviewedAt: new Date(),
        model: 'gemini-1.5-flash'
      }
    });

    return NextResponse.json({
      success: true,
      review: aiReview
    });

  } catch (error) {
    console.error('Error performing AI review:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform AI review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Get the event with schedule
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventData = eventDoc.data();
    
    if (!eventData?.schedule?.aiReview) {
      return NextResponse.json(
        { error: 'No AI review available for this schedule' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      review: eventData.schedule.aiReview
    });

  } catch (error) {
    console.error('Error fetching AI review:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch AI review',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
