import { NextRequest, NextResponse } from 'next/server';
import { EmailTemplateService } from '@/lib/email-template-service';
import { 
  EmailTemplateFilters, 
  EmailTemplateSortOptions,
  CreateEmailTemplateRequest
} from '@/lib/types-email-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters from query parameters
    const filters: EmailTemplateFilters = {};
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as any;
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as any;
    }
    if (searchParams.get('isDefault') !== null) {
      filters.isDefault = searchParams.get('isDefault') === 'true';
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    // Parse sort options
    const sort: EmailTemplateSortOptions | undefined = searchParams.get('sortField') ? {
      field: searchParams.get('sortField') as any,
      direction: (searchParams.get('sortDirection') as 'asc' | 'desc') || 'asc'
    } : undefined;

    const templates = await EmailTemplateService.getAllTemplates(filters, sort);
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch email templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateEmailTemplateRequest = await request.json();
    
    // Basic validation
    if (!body.name || !body.type || !body.content) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: name, type, and content are required' 
        },
        { status: 400 }
      );
    }

    if (!body.content.subject || !body.content.htmlBody) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email content must include subject and htmlBody' 
        },
        { status: 400 }
      );
    }

    // TODO: Get actual user ID from authentication
    const createdBy = 'admin'; // Placeholder

    const template = await EmailTemplateService.createTemplate(body, createdBy);
    
    if (!template) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create email template' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create email template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}