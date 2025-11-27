import { NextRequest, NextResponse } from 'next/server';
import { addEmailToQueue } from '@/lib/email-queue-admin';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handoverChain, contextName, contextType } = body;

    if (!handoverChain || !handoverChain.current) {
      return NextResponse.json(
        { error: 'Handover chain data is required' },
        { status: 400 }
      );
    }

    const formatDate = (date: any) => {
      if (!date) return 'TBD';
      const d = new Date(date);
      return !isNaN(d.getTime()) ? format(d, 'PPP') : 'TBD';
    };

    // Collect all relevant email addresses
    const recipients = [
      handoverChain.current.custodian.email,
      handoverChain.previous?.custodian.email,
      handoverChain.next?.custodian.email,
    ].filter(Boolean);

    // Build detailed subject line
    const subject = `Equipment Handover: ${handoverChain.current.equipmentName} - ${handoverChain.current.clubName} (${formatDate(handoverChain.current.pickupDate)} to ${formatDate(handoverChain.current.returnDate)})`;

    // Generate HTML email body
    const htmlContent = generateHandoverEmailHTML(handoverChain, contextName, contextType, formatDate);

    // Generate plain text version
    const textContent = generateHandoverEmailText(handoverChain, contextName, contextType, formatDate);

    // Queue the email
    const emailId = await addEmailToQueue({
      to: recipients,
      subject,
      htmlContent,
      textContent,
      type: 'equipment-handover',
      priority: 'normal',
      status: 'pending',
      metadata: {
        equipmentId: handoverChain.current.equipmentId,
        bookingId: handoverChain.current.id,
        equipmentName: handoverChain.current.equipmentName,
        clubName: handoverChain.current.clubName,
        contextType,
        contextName,
      },
    });

    return NextResponse.json({
      success: true,
      emailId,
      message: 'Equipment handover email queued successfully',
    });
  } catch (error) {
    console.error('Error queuing equipment handover email:', error);
    return NextResponse.json(
      { error: 'Failed to queue email' },
      { status: 500 }
    );
  }
}

function generateHandoverEmailHTML(
  handoverChain: any,
  contextName: string,
  contextType: 'zone' | 'club',
  formatDate: (date: any) => string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; border-bottom: 2px solid #e2e8f0;">
              <h1 style="margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #0f172a;">
                Equipment Handover Details
              </h1>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #334155;">Equipment:</strong> ${handoverChain.current.equipmentName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #334155;">${contextType === 'zone' ? 'Zone' : 'Club'}:</strong> ${contextName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 14px; color: #64748b;">
                    <strong style="color: #334155;">Generated:</strong> ${format(new Date(), 'PPP p')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pickup Section -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; height: 48px; background: linear-gradient(135deg, ${handoverChain.previous ? '#3b82f6, #2563eb' : '#64748b, #475569'}); border-radius: 12px; text-align: center; font-size: 24px; vertical-align: middle;">
                          ${handoverChain.previous ? '📦' : '🏢'}
                        </td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                          Pickup From
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    ${handoverChain.previous ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-left: 4px solid #3b82f6; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Club:</td>
                                <td style="color: #0f172a;">${handoverChain.previous.clubName}</td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-radius: 8px; border: 1px solid #e2e8f0;">
                              <tr>
                                <td style="padding: 16px;">
                                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 15px;">Contact Person</div>
                                  <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                      <td style="font-weight: 600; color: #475569; width: 120px;">Name:</td>
                                      <td style="color: #0f172a;">${handoverChain.previous.custodian.name}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Email:</td>
                                      <td style="color: #0f172a;">${handoverChain.previous.custodian.email}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Phone:</td>
                                      <td style="color: #0f172a;">${handoverChain.previous.custodian.phone}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Event:</td>
                                <td style="color: #0f172a;">${handoverChain.previous.eventName || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Location:</td>
                                <td style="color: #0f172a;">${handoverChain.previous.useLocation?.address || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Return Date:</td>
                                <td style="color: #0f172a;">${formatDate(handoverChain.previous.returnDate)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    ` : `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-left: 4px solid #64748b; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <div style="font-weight: 700; font-size: 16px; color: #334155; margin-bottom: 8px;">Zone Storage</div>
                            <div style="color: #64748b; font-size: 14px;">Equipment will be collected from the zone storage location</div>
                          </td>
                        </tr>
                      </table>
                    `}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Connector -->
          <tr>
            <td align="center" style="padding: 0;">
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
              <div style="width: 12px; height: 12px; background: #94a3b8; border-radius: 50%; margin: 8px 0;"></div>
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
            </td>
          </tr>

          <!-- Current Booking Section -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; text-align: center; font-size: 24px; vertical-align: middle;">
                          ✓
                        </td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                          ${contextType === 'club' ? 'Your Booking' : 'Current Booking'}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f0fdf4, #dcfce7); border: 2px solid #10b981; border-radius: 8px; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);">
                      <tr>
                        <td style="padding: 20px;">
                          <table width="100%" cellpadding="4" cellspacing="0">
                            <tr>
                              <td style="font-weight: 600; color: #475569; width: 120px;">Club:</td>
                              <td style="color: #0f172a;">${handoverChain.current.clubName}</td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; background: linear-gradient(to bottom right, #ecfdf5, #d1fae5); border-radius: 8px; border: 1px solid #86efac;">
                            <tr>
                              <td style="padding: 16px;">
                                <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 15px;">Contact Person</div>
                                <table width="100%" cellpadding="4" cellspacing="0">
                                  <tr>
                                    <td style="font-weight: 600; color: #475569; width: 120px;">Name:</td>
                                    <td style="color: #0f172a;">${handoverChain.current.custodian.name}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-weight: 600; color: #475569;">Email:</td>
                                    <td style="color: #0f172a;">${handoverChain.current.custodian.email}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-weight: 600; color: #475569;">Phone:</td>
                                    <td style="color: #0f172a;">${handoverChain.current.custodian.phone}</td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="4" cellspacing="0">
                            <tr>
                              <td style="font-weight: 600; color: #475569; width: 120px;">Event:</td>
                              <td style="color: #0f172a;">${handoverChain.current.eventName || 'TBD'}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #475569;">Location:</td>
                              <td style="color: #0f172a;">${handoverChain.current.useLocation?.address || 'TBD'}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #475569;">Pickup Date:</td>
                              <td style="color: #0f172a;">${formatDate(handoverChain.current.pickupDate)}</td>
                            </tr>
                            <tr>
                              <td style="font-weight: 600; color: #475569;">Return Date:</td>
                              <td style="color: #0f172a;">${formatDate(handoverChain.current.returnDate)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Connector -->
          <tr>
            <td align="center" style="padding: 0;">
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
              <div style="width: 12px; height: 12px; background: #94a3b8; border-radius: 50%; margin: 8px 0;"></div>
              <div style="width: 2px; height: 20px; background: linear-gradient(to bottom, #cbd5e1, #94a3b8);"></div>
            </td>
          </tr>

          <!-- Drop-off Section -->
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 48px; height: 48px; background: linear-gradient(135deg, ${handoverChain.next ? '#a855f7, #9333ea' : '#64748b, #475569'}); border-radius: 12px; text-align: center; font-size: 24px; vertical-align: middle;">
                          ${handoverChain.next ? '🎯' : '🏢'}
                        </td>
                        <td style="padding-left: 12px; font-size: 18px; font-weight: 700; color: #0f172a; vertical-align: middle;">
                          Drop-off To
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 16px;">
                    ${handoverChain.next ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-left: 4px solid #a855f7; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Club:</td>
                                <td style="color: #0f172a;">${handoverChain.next.clubName}</td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0; background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-radius: 8px; border: 1px solid #e2e8f0;">
                              <tr>
                                <td style="padding: 16px;">
                                  <div style="font-weight: 700; color: #0f172a; margin-bottom: 8px; font-size: 15px;">Contact Person</div>
                                  <table width="100%" cellpadding="4" cellspacing="0">
                                    <tr>
                                      <td style="font-weight: 600; color: #475569; width: 120px;">Name:</td>
                                      <td style="color: #0f172a;">${handoverChain.next.custodian.name}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Email:</td>
                                      <td style="color: #0f172a;">${handoverChain.next.custodian.email}</td>
                                    </tr>
                                    <tr>
                                      <td style="font-weight: 600; color: #475569;">Phone:</td>
                                      <td style="color: #0f172a;">${handoverChain.next.custodian.phone}</td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <table width="100%" cellpadding="4" cellspacing="0">
                              <tr>
                                <td style="font-weight: 600; color: #475569; width: 120px;">Event:</td>
                                <td style="color: #0f172a;">${handoverChain.next.eventName || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Location:</td>
                                <td style="color: #0f172a;">${handoverChain.next.useLocation?.address || 'TBD'}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: 600; color: #475569;">Pickup Date:</td>
                                <td style="color: #0f172a;">${formatDate(handoverChain.next.pickupDate)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    ` : `
                      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, #f8fafc, #f1f5f9); border-left: 4px solid #64748b; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <div style="font-weight: 700; font-size: 16px; color: #334155; margin-bottom: 8px;">Zone Storage</div>
                            <div style="color: #64748b; font-size: 14px;">Equipment will be returned to the zone storage location</div>
                          </td>
                        </tr>
                      </table>
                    `}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateHandoverEmailText(
  handoverChain: any,
  contextName: string,
  contextType: 'zone' | 'club',
  formatDate: (date: any) => string
): string {
  return `
Equipment Handover Details

Equipment: ${handoverChain.current.equipmentName}
${contextType === 'zone' ? 'Zone' : 'Club'}: ${contextName}
Generated: ${format(new Date(), 'PPP p')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PICKUP FROM:
${handoverChain.previous ? `
Club: ${handoverChain.previous.clubName}

Contact Person:
  Name: ${handoverChain.previous.custodian.name}
  Email: ${handoverChain.previous.custodian.email}
  Phone: ${handoverChain.previous.custodian.phone}

Event: ${handoverChain.previous.eventName || 'TBD'}
Location: ${handoverChain.previous.useLocation?.address || 'TBD'}
Return Date: ${formatDate(handoverChain.previous.returnDate)}
` : `
Zone Storage
Equipment will be collected from the zone storage location
`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextType === 'club' ? 'YOUR BOOKING' : 'CURRENT BOOKING'}:

Club: ${handoverChain.current.clubName}

Contact Person:
  Name: ${handoverChain.current.custodian.name}
  Email: ${handoverChain.current.custodian.email}
  Phone: ${handoverChain.current.custodian.phone}

Event: ${handoverChain.current.eventName || 'TBD'}
Location: ${handoverChain.current.useLocation?.address || 'TBD'}
Pickup Date: ${formatDate(handoverChain.current.pickupDate)}
Return Date: ${formatDate(handoverChain.current.returnDate)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP-OFF TO:
${handoverChain.next ? `
Club: ${handoverChain.next.clubName}

Contact Person:
  Name: ${handoverChain.next.custodian.name}
  Email: ${handoverChain.next.custodian.email}
  Phone: ${handoverChain.next.custodian.phone}

Event: ${handoverChain.next.eventName || 'TBD'}
Location: ${handoverChain.next.useLocation?.address || 'TBD'}
Pickup Date: ${formatDate(handoverChain.next.pickupDate)}
` : `
Zone Storage
Equipment will be returned to the zone storage location
`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}
