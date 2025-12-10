import { NextRequest, NextResponse } from 'next/server';
import { EmailTemplateService } from '@/lib/email-template-service';
import { UpdateEmailTemplateRequest } from '@/lib/types-email-templates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const template = await EmailTemplateService.getTemplateById((await params).id);
    
    if (!template) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email template not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch email template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body: UpdateEmailTemplateRequest = await request.json();
    
    // TODO: Get actual user ID from authentication
    const modifiedBy = 'admin'; // Placeholder

    const template = await EmailTemplateService.updateTemplate((await params).id, body, modifiedBy);
    
    if (!template) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to update email template or template not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update email template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const success = await EmailTemplateService.deleteTemplate((await params).id);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to delete email template or template not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete email template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}