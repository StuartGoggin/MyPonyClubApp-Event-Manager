import { NextRequest, NextResponse } from 'next/server';
import { createCommitteeNomination, getCommitteeNomination } from '@/lib/committee-nominations';
import { CommitteeNominationFormData } from '@/types/committee-nomination';
import { 
  sendCommitteeNominationConfirmationEmail, 
  sendCommitteeNominationZoneManagerEmail,
  sendCommitteeNominationSuperUserEmail 
} from '@/lib/committee-nomination-emails';
import { generateCommitteeNominationPDF } from '@/lib/committee-nomination-pdf';
import { UserService } from '@/lib/user-service';
import { autoSendQueuedEmail } from '@/lib/auto-send-email';
import { adminDb } from '@/lib/firebase-admin';

// Helper function to get super user emails from database
async function getSuperUserEmails(): Promise<string[]> {
  try {
    const superUsers = await UserService.getUsers({ 
      role: 'super_user',
      isActive: true 
    });
    
    const emails = superUsers
      .map(user => user.email)
      .filter((email): email is string => !!email && email.trim().length > 0);
    
    if (emails.length === 0) {
      console.warn('No super users found in database, using fallback');
      return process.env.SUPER_USER_EMAILS 
        ? process.env.SUPER_USER_EMAILS.split(',').map(email => email.trim())
        : ['admin@ponyclub.com.au'];
    }
    
    console.log(`Found ${emails.length} super user(s):`, emails);
    return emails;
  } catch (error) {
    console.error('Error fetching super users:', error);
    return process.env.SUPER_USER_EMAILS 
      ? process.env.SUPER_USER_EMAILS.split(',').map(email => email.trim())
      : ['admin@ponyclub.com.au'];
  }
}

/**
 * POST /api/committee-nominations/submit
 * 
 * Submit a new committee nomination after club AGM
 * Creates nomination record and sends notifications to zone rep
 */
export async function POST(request: NextRequest) {
  try {
    const formData: CommitteeNominationFormData = await request.json();

    console.log('Submitting committee nomination:', {
      clubId: formData.clubId,
      clubName: formData.clubName,
      zoneId: formData.zoneId,
      zoneName: formData.zoneName,
      year: formData.year,
    });

    // Validate required fields
    if (!formData.clubId || !formData.clubName) {
      return NextResponse.json(
        { error: 'Club ID and name are required' },
        { status: 400 }
      );
    }

    if (!formData.zoneId) {
      console.error('Zone ID is missing from form data!');
      return NextResponse.json(
        { error: 'Zone ID is required' },
        { status: 400 }
      );
    }

    if (!formData.agmDate) {
      return NextResponse.json(
        { error: 'AGM date is required' },
        { status: 400 }
      );
    }

    // All committee positions are now optional
    // Zone Representative is optional (can select from dropdown or enter manually)

    // Create the nomination
    const nominationId = await createCommitteeNomination(formData);

    console.log('Created nomination with ID:', nominationId);

    // Fetch the created nomination to get complete data
    const nomination = await getCommitteeNomination(nominationId);
    
    if (!nomination) {
      throw new Error('Failed to fetch created nomination');
    }

    console.log('Created nomination details:', {
      id: nomination.id,
      clubName: nomination.clubName,
      zoneId: nomination.zoneId,
      zoneName: nomination.zoneName,
    });

    // Generate reference number
    const referenceNumber = `CN-${Date.now()}`;

    // Generate PDF
    console.log('Generating PDF for nomination...');
    const pdfBuffer = await generateCommitteeNominationPDF({
      formData: nomination,
      title: 'Committee Nomination Submission',
      submissionDate: new Date(nomination.submittedAt),
      referenceNumber,
    });
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // Get super user emails
    const superUserEmails = await getSuperUserEmails();
    console.log('Super user emails:', superUserEmails);

    // Track email sending results
    const emailResults = {
      confirmation: null as string | null,
      zoneManager: null as string | null,
      superUsers: [] as string[],
    };

    // 1. Send confirmation email to submitter
    try {
      console.log('Sending confirmation email to submitter:', nomination.submittedBy.email);
      const confirmationEmailId = await sendCommitteeNominationConfirmationEmail(
        nomination,
        pdfBuffer,
        referenceNumber
      );
      emailResults.confirmation = confirmationEmailId;
      console.log('Confirmation email queued with ID:', confirmationEmailId);

      // Auto-send the confirmation email
      try {
        const autoSendResult = await autoSendQueuedEmail(confirmationEmailId);
        if (autoSendResult.success) {
          console.log('Confirmation email auto-sent successfully');
        } else {
          console.error('Confirmation email auto-send failed:', autoSendResult.error);
        }
      } catch (autoSendError) {
        console.error('Confirmation email auto-send error:', autoSendError);
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
    }

    // 2. Send notification to zone manager
    try {
      console.log('Sending zone manager notification...');
      const zoneManagerEmailId = await sendCommitteeNominationZoneManagerEmail(
        nomination,
        pdfBuffer,
        referenceNumber
      );
      emailResults.zoneManager = zoneManagerEmailId;
      
      if (zoneManagerEmailId !== 'skipped') {
        console.log('Zone manager email queued with ID:', zoneManagerEmailId);

        // Auto-send the zone manager email
        try {
          const autoSendResult = await autoSendQueuedEmail(zoneManagerEmailId);
          if (autoSendResult.success) {
            console.log('Zone manager email auto-sent successfully');
          } else {
            console.error('Zone manager email auto-send failed:', autoSendResult.error);
          }
        } catch (autoSendError) {
          console.error('Zone manager email auto-send error:', autoSendError);
        }
      }
    } catch (emailError) {
      console.error('Failed to send zone manager email:', emailError);
    }

    // 3. Send notifications to super users
    try {
      console.log('Sending super user notifications...');
      const superUserEmailIds = await sendCommitteeNominationSuperUserEmail(
        nomination,
        pdfBuffer,
        referenceNumber,
        superUserEmails
      );
      emailResults.superUsers = superUserEmailIds;
      console.log('Super user emails queued:', superUserEmailIds.length);

      // Auto-send each super user email
      for (const emailId of superUserEmailIds) {
        try {
          const autoSendResult = await autoSendQueuedEmail(emailId);
          if (autoSendResult.success) {
            console.log('Super user email auto-sent successfully:', emailId);
          } else {
            console.error('Super user email auto-send failed:', emailId, autoSendResult.error);
          }
        } catch (autoSendError) {
          console.error('Super user email auto-send error:', emailId, autoSendError);
        }
      }
    } catch (emailError) {
      console.error('Failed to send super user emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      nominationId,
      referenceNumber,
      message: 'Committee nomination submitted successfully',
      emailsSent: {
        confirmation: emailResults.confirmation !== null,
        zoneManager: emailResults.zoneManager !== null && emailResults.zoneManager !== 'skipped',
        superUsers: emailResults.superUsers.length,
      },
    });

  } catch (error) {
    console.error('Error submitting committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to submit committee nomination' },
      { status: 500 }
    );
  }
}
