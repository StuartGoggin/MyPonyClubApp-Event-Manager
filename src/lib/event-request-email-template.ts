import { EventRequestExport } from './event-request-json-export';

export interface EmailTemplateData {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  clubName: string;
  zoneName: string;
  submissionDate: string;
  referenceNumber: string;
  events: Array<{
    priority: number;
    name: string;
    eventTypeName: string;
    date: string;
    location: string;
    isQualifier: boolean;
    isHistoricallyTraditional: boolean;
    coordinatorName?: string;
    coordinatorContact?: string;
    notes?: string;
  }>;
  generalNotes?: string;
  isForSuperUser?: boolean;
}

export function generateEventRequestEmailHTML(data: EmailTemplateData): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const priorityLabels = ['', '1st Priority', '2nd Priority', '3rd Priority', '4th Priority'];

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Request Submission</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .email-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .reference {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 6px;
            display: inline-block;
            margin-top: 12px;
            font-weight: 600;
        }
        .content {
            padding: 40px;
        }
        .summary-section {
            background: #f1f5f9;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 30px;
            border-left: 4px solid #3b82f6;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 16px;
        }
        .summary-item {
            display: flex;
            flex-direction: column;
        }
        .summary-label {
            font-weight: 600;
            color: #64748b;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .summary-value {
            font-size: 16px;
            color: #1e293b;
            font-weight: 500;
        }
        .events-section h2 {
            color: #1e293b;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 24px;
        }
        .event-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
            transition: box-shadow 0.2s;
        }
        .event-card:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .event-header {
            background: #f8fafc;
            padding: 16px 20px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .priority-badge {
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .priority-1 { background: #dc2626; }
        .priority-2 { background: #ea580c; }
        .priority-3 { background: #ca8a04; }
        .priority-4 { background: #16a34a; }
        .event-details {
            padding: 20px;
        }
        .event-meta {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 16px;
        }
        .event-meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .event-meta-icon {
            width: 16px;
            height: 16px;
            color: #64748b;
        }
        .special-badges {
            margin-top: 12px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-right: 8px;
        }
        .qualifier-badge {
            background: #fef3c7;
            color: #92400e;
        }
        .traditional-badge {
            background: #ddd6fe;
            color: #5b21b6;
        }
        .coordinator-info {
            background: #f0f9ff;
            padding: 12px;
            border-radius: 6px;
            margin-top: 12px;
            border-left: 3px solid #0ea5e9;
        }
        .notes-section {
            background: #fffbeb;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .footer {
            background: #f8fafc;
            padding: 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
            border-top: 1px solid #e2e8f0;
        }
        .attachments-info {
            background: #ecfdf5;
            border: 1px solid #10b981;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
        }
        ${data.isForSuperUser ? `
        .super-user-notice {
            background: #fef2f2;
            border: 1px solid #ef4444;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            color: #dc2626;
            font-weight: 600;
        }
        ` : ''}
        @media (max-width: 600px) {
            .summary-grid {
                grid-template-columns: 1fr;
            }
            .event-meta {
                grid-template-columns: 1fr;
            }
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🏇 Event Request Submission</h1>
            <div class="reference">Reference: ${data.referenceNumber}</div>
        </div>
        
        <div class="content">
            ${data.isForSuperUser ? `
            <div class="super-user-notice">
                🔒 SUPER USER NOTIFICATION: This email includes JSON export data for administrative purposes.
            </div>
            ` : ''}
            
            <div class="summary-section">
                <h2 style="margin: 0 0 16px 0; color: #1e293b;">📋 Submission Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">Submitted By</div>
                        <div class="summary-value">${data.requesterName}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Email</div>
                        <div class="summary-value">${data.requesterEmail}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Phone</div>
                        <div class="summary-value">${data.requesterPhone}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Submission Date</div>
                        <div class="summary-value">${formatDate(data.submissionDate)}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Club</div>
                        <div class="summary-value">${data.clubName}</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">Zone</div>
                        <div class="summary-value">${data.zoneName}</div>
                    </div>
                </div>
            </div>

            <div class="events-section">
                <h2>🎯 Requested Events (${data.events.length} event${data.events.length !== 1 ? 's' : ''})</h2>
                
                ${data.events.map(event => `
                <div class="event-card">
                    <div class="event-header">
                        <h3 style="margin: 0; color: #1e293b;">${event.name}</h3>
                        <span class="priority-badge priority-${event.priority}">${priorityLabels[event.priority]}</span>
                    </div>
                    <div class="event-details">
                        <div class="event-meta">
                            <div class="event-meta-item">
                                <span class="event-meta-icon">📅</span>
                                <span><strong>Date:</strong> ${formatDate(event.date)}</span>
                            </div>
                            <div class="event-meta-item">
                                <span class="event-meta-icon">📍</span>
                                <span><strong>Location:</strong> ${event.location}</span>
                            </div>
                            <div class="event-meta-item">
                                <span class="event-meta-icon">🏆</span>
                                <span><strong>Type:</strong> ${event.eventTypeName}</span>
                            </div>
                        </div>
                        
                        <div class="special-badges">
                            ${event.isQualifier ? '<span class="badge qualifier-badge">🏅 Qualifier Event</span>' : ''}
                            ${event.isHistoricallyTraditional ? '<span class="badge traditional-badge">🏛️ Traditional Event</span>' : ''}
                        </div>
                        
                        ${event.coordinatorName || event.coordinatorContact ? `
                        <div class="coordinator-info">
                            <strong>📞 Event Coordinator:</strong><br>
                            ${event.coordinatorName ? `Name: ${event.coordinatorName}<br>` : ''}
                            ${event.coordinatorContact ? `Contact: ${event.coordinatorContact}` : ''}
                        </div>
                        ` : ''}
                        
                        ${event.notes ? `
                        <div style="margin-top: 12px;">
                            <strong>📝 Event Notes:</strong><br>
                            <em>${event.notes}</em>
                        </div>
                        ` : ''}
                    </div>
                </div>
                `).join('')}
            </div>

            ${data.generalNotes ? `
            <div class="notes-section">
                <h3 style="margin: 0 0 12px 0; color: #92400e;">💬 General Notes</h3>
                <p style="margin: 0;">${data.generalNotes}</p>
            </div>
            ` : ''}

            <div class="attachments-info">
                <h3 style="margin: 0 0 8px 0; color: #059669;">📎 Attachments</h3>
                <p style="margin: 0;">
                    ✅ Event Request PDF (detailed submission)<br>
                    ${data.isForSuperUser ? '✅ JSON Export (administrative data)<br>' : ''}
                    📋 Complete event details and contact information
                </p>
            </div>
        </div>

        <div class="footer">
            <p><strong>Next Steps:</strong></p>
            <p>
                ${data.isForSuperUser 
                    ? 'As a super user, please review this submission and coordinate with the zone approver for processing.' 
                    : 'Your zone coordinator will review this request and contact you regarding approval status and any additional requirements.'
                }
            </p>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                This is an automated notification from the Pony Club Event Management System.<br>
                Generated on ${formatDate(new Date().toISOString())}
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

export function generateEventRequestEmailText(data: EmailTemplateData): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const priorityLabels = ['', '1st Priority', '2nd Priority', '3rd Priority', '4th Priority'];

  return `
EVENT REQUEST SUBMISSION
Reference: ${data.referenceNumber}

${data.isForSuperUser ? 'SUPER USER NOTIFICATION: This email includes JSON export data for administrative purposes.\n\n' : ''}

SUBMISSION SUMMARY
==================
Submitted By: ${data.requesterName}
Email: ${data.requesterEmail}
Phone: ${data.requesterPhone}
Club: ${data.clubName}
Zone: ${data.zoneName}
Submission Date: ${formatDate(data.submissionDate)}

REQUESTED EVENTS (${data.events.length} event${data.events.length !== 1 ? 's' : ''})
================

${data.events.map(event => `
${priorityLabels[event.priority]} - ${event.name}
Date: ${formatDate(event.date)}
Location: ${event.location}
Type: ${event.eventTypeName}
${event.isQualifier ? 'Qualifier Event' : ''}
${event.isHistoricallyTraditional ? 'Traditional Event' : ''}
${event.coordinatorName ? `Coordinator: ${event.coordinatorName}` : ''}
${event.coordinatorContact ? `Contact: ${event.coordinatorContact}` : ''}
${event.notes ? `Notes: ${event.notes}` : ''}
`).join('\n---\n')}

${data.generalNotes ? `
GENERAL NOTES
=============
${data.generalNotes}
` : ''}

ATTACHMENTS
===========
- Event Request PDF (detailed submission)
${data.isForSuperUser ? '- JSON Export (administrative data)' : ''}
- Complete event details and contact information

NEXT STEPS
==========
${data.isForSuperUser 
  ? 'As a super user, please review this submission and coordinate with the zone approver for processing.' 
  : 'Your zone coordinator will review this request and contact you regarding approval status and any additional requirements.'
}

---
This is an automated notification from the Pony Club Event Management System.
Generated on ${formatDate(new Date().toISOString())}
  `;
}