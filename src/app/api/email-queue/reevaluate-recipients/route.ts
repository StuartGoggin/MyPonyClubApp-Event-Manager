import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';

// Function to get super user emails
async function getSuperUserEmails(): Promise<string[]> {
  try {
    const superUsers = await UserService.getUsers({
      role: 'super_user',
      isActive: true
    });
    
    const superUserEmails = superUsers
      .filter(user => user.email && user.email.trim() !== '')
      .map(user => user.email as string);
    
    console.log('Found super users:', superUserEmails);
    
    if (superUserEmails.length > 0) {
      return superUserEmails;
    }
    
    // Fallback to environment variable or default
    const fallbackEmails = process.env.SUPER_USER_EMAILS?.split(',') || ['admin@ponyclub.com.au'];
    console.log('Using fallback super user emails:', fallbackEmails);
    return fallbackEmails;
  } catch (error) {
    console.error('Error fetching super users:', error);
    // Fallback to default
    return ['admin@ponyclub.com.au'];
  }
}

// Function to get zone approver emails
async function getZoneApproverEmails(zoneId?: string): Promise<string[]> {
  try {
    if (!zoneId) return [];
    
    const zoneApprovers = await UserService.getUsers({
      role: 'zone_approver',
      isActive: true,
      zoneId: zoneId
    });
    
    return zoneApprovers
      .filter(user => user.email && user.email.trim() !== '')
      .map(user => user.email as string);
  } catch (error) {
    console.error('Error fetching zone approvers:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailType, metadata } = body;
    
    let suggestedRecipients: string[] = [];
    
    // Reevaluate recipients based on email type
    switch (emailType) {
      case 'event_request':
        // For event requests, determine recipient based on metadata
        if (metadata?.superUserEmail) {
          suggestedRecipients = await getSuperUserEmails();
        } else if (metadata?.zoneId) {
          suggestedRecipients = await getZoneApproverEmails(metadata.zoneId);
        }
        
        // Always include the requester email if available
        if (metadata?.requesterEmail) {
          suggestedRecipients.push(metadata.requesterEmail);
        }
        break;
        
      case 'committee_nomination':
        // Committee nominations go to super users
        suggestedRecipients = await getSuperUserEmails();
        break;
        
      case 'event_approval':
        // Event approvals go to zone approvers
        if (metadata?.zoneId) {
          suggestedRecipients = await getZoneApproverEmails(metadata.zoneId);
        }
        break;
        
      case 'club_notification':
        // Club notifications might have specific recipients in metadata
        if (metadata?.clubAdminEmails) {
          suggestedRecipients = metadata.clubAdminEmails;
        }
        break;
        
      default:
        // For unknown types, return empty array
        console.log('Unknown email type:', emailType);
        break;
    }
    
    // Remove duplicates
    suggestedRecipients = [...new Set(suggestedRecipients)];
    
    return NextResponse.json({
      success: true,
      data: {
        suggestedRecipients,
        emailType,
        metadata
      }
    });
    
  } catch (error) {
    console.error('Error reevaluating recipients:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reevaluate recipients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
