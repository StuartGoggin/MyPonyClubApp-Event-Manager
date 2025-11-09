import { NextRequest, NextResponse } from 'next/server';
import { EmailTemplateService } from '@/lib/email-template-service';

export async function POST(request: NextRequest) {
  try {
    console.log('Initializing default email templates...');
    
    await EmailTemplateService.initializeDefaultTemplates();
    
    return NextResponse.json({
      success: true,
      message: 'Default email templates initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing default templates:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to initialize default email templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}