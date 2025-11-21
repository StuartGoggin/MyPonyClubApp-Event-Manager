import { NextRequest, NextResponse } from 'next/server';
import { generateCommitteeNominationPDF } from '@/lib/committee-nomination-pdf';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Validate required data
    if (!requestData.formData) {
      return NextResponse.json(
        { error: 'Form data is required' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateCommitteeNominationPDF({
      formData: requestData.formData,
      title: requestData.title || 'Committee Nomination Submission',
      submissionDate: requestData.submissionDate ? new Date(requestData.submissionDate) : new Date(),
      referenceNumber: requestData.referenceNumber || `CN-${Date.now()}`
    });

    // Return PDF as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="committee-nomination-${Date.now()}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating committee nomination PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
