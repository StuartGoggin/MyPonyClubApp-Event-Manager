import { NextRequest, NextResponse } from 'next/server';
import { EmailTemplateService } from '@/lib/email-template-service';
import { EmailTemplateRenderOptions } from '@/lib/types-email-templates';

export async function POST(request: NextRequest) {
  try {
    const body: EmailTemplateRenderOptions = await request.json();
    
    // Basic validation
    if (!body.templateId || !body.variables) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: templateId and variables are required' 
        },
        { status: 400 }
      );
    }

    const result = await EmailTemplateService.renderTemplate(body);
    
    if (!result) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to render template or template not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rendered: result
    });
  } catch (error) {
    console.error('Error rendering email template:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to render email template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}