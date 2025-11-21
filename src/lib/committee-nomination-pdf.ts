import { PDFDocument } from 'pdf-lib';
import { CommitteeNomination, CommitteeNominationFormData } from '@/types/committee-nomination';
import * as fs from 'fs';
import * as path from 'path';

export interface CommitteeNominationPDFOptions {
  formData: CommitteeNominationFormData | CommitteeNomination;
  title?: string;
  submissionDate?: Date;
  referenceNumber?: string;
}

function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export async function generateCommitteeNominationPDF(options: CommitteeNominationPDFOptions): Promise<Buffer> {
  const { formData, submissionDate = new Date() } = options;

  // Load the template PDF
  let templateBytes: ArrayBuffer;
  
  try {
    if (typeof window === 'undefined') {
      // Server-side: try filesystem first (works in dev and some production)
      try {
        const templatePath = path.join(process.cwd(), 'public', 'committee-nomination-template.pdf');
        const buffer = fs.readFileSync(templatePath);
        templateBytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      } catch (fsError) {
        // If filesystem fails, fetch from public URL (production fallback)
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002';
        const response = await fetch(`${baseUrl}/committee-nomination-template.pdf`);
        if (!response.ok) {
          throw new Error(`Failed to load PDF template from ${baseUrl}: ${response.status}`);
        }
        templateBytes = await response.arrayBuffer();
      }
    } else {
      // Client-side (shouldn't happen but handle it)
      const response = await fetch('/committee-nomination-template.pdf');
      if (!response.ok) {
        throw new Error('Failed to load PDF template');
      }
      templateBytes = await response.arrayBuffer();
    }
  } catch (error) {
    console.error('Error loading PDF template:', error);
    throw new Error('Could not load committee nomination PDF template');
  }
  
  // Load the PDF with pdf-lib
  const pdfDoc = await PDFDocument.load(templateBytes);
  
  // Get the form
  const form = pdfDoc.getForm();
  
  // Get all field names (for debugging)
  const fields = form.getFields();
  console.log('PDF Form Fields:', fields.map(f => ({ name: f.getName(), type: f.constructor.name })));

  // Helper function to safely set text field
  const setTextField = (fieldName: string, value: string) => {
    try {
      const field = form.getTextField(fieldName);
      field.setText(value || '');
    } catch (error) {
      // Silently fail - field doesn't exist
    }
  };

  // Extract submitter data
  const submitterData = 'submittedBy' in formData 
    ? formData.submittedBy 
    : { 
        name: formData.submitterName, 
        email: formData.submitterEmail, 
        phone: formData.submitterPhone 
      };

  // Try multiple field name variations for each field
  // Club information
  setTextField('Club Name', formData.clubName);
  setTextField('ClubName', formData.clubName);
  setTextField('club_name', formData.clubName);
  setTextField('club', formData.clubName);
  setTextField('your pony club', formData.clubName);
  
  setTextField('Zone', formData.zoneName || '');
  setTextField('zone', formData.zoneName || '');
  
  setTextField('AGM Date', formatDate(formData.agmDate));
  setTextField('agm_date', formatDate(formData.agmDate));
  setTextField('AGMDate', formatDate(formData.agmDate));
  setTextField('Date of AGM', formatDate(formData.agmDate));
  setTextField('date AGM held', formatDate(formData.agmDate));
  
  setTextField('Year', formData.year?.toString() || '');
  setTextField('year', formData.year?.toString() || '');
  setTextField('Committee Year', formData.year?.toString() || '');
  setTextField('fin year', formData.year?.toString() || '');
  
  // Submitter information (bottom of form)
  setTextField('your name', submitterData.name || '');
  setTextField('your position', submitterData.position || 'Secretary');
  
  // District Commissioner - don't fill header fields, only data fields
  if (formData.districtCommissioner) {
    // 'Commissioner' is the header - don't fill it
    // Use unnumbered Email field for DC's email (but this conflicts with club email)
    // setTextField('Email', formData.districtCommissioner.email || '');
    setTextField('no', formData.districtCommissioner.mobile || '');
  }
  
  // President - don't fill header field
  if (formData.president) {
    // 'President' is the header - don't fill it
    setTextField('Name1', formData.president.name || '');
    setTextField('Email1', formData.president.email || '');
    setTextField('no1', formData.president.mobile || '');
  }
  
  // Vice President - don't fill header field
  if (formData.vicePresident) {
    // 'President1' is the header - don't fill it
    setTextField('Name2', formData.vicePresident.name || '');
    setTextField('Email2', formData.vicePresident.email || '');
    setTextField('no2', formData.vicePresident.mobile || '');
  }
  
  // Secretary - don't fill header field
  if (formData.secretary) {
    // 'Secretary' is the header - don't fill it
    setTextField('Name3', formData.secretary.name || '');
    setTextField('Email3', formData.secretary.email || '');
    setTextField('no3', formData.secretary.mobile || '');
  }
  
  // Treasurer - don't fill header field
  if (formData.treasurer) {
    // 'Treasurer' is the header - don't fill it
    setTextField('Name5', formData.treasurer.name || '');
    setTextField('Email5', formData.treasurer.email || '');
    setTextField('no4', formData.treasurer.mobile || '');
  }
  
  // Zone Representative
  const zoneRep = 'zoneRepresentative' in formData 
    ? formData.zoneRepresentative 
    : ('zoneRepOther' in formData ? formData.zoneRepOther : null);
    
  if (zoneRep && zoneRep.name) {
    setTextField('Zone Rep Name', zoneRep.name || '');
    setTextField('zonerep_name', zoneRep.name || '');
    setTextField('ZoneRep Name', zoneRep.name || '');
    setTextField('Zone Representative', zoneRep.name || '');
    
    setTextField('Zone Rep PC ID', zoneRep.ponyClubId || '');
    setTextField('zonerep_pcid', zoneRep.ponyClubId || '');
    setTextField('Zone Rep PCA Number', zoneRep.ponyClubId || '');
    
    setTextField('Zone Rep Email', zoneRep.email || '');
    setTextField('zonerep_email', zoneRep.email || '');
    
    setTextField('Zone Rep Mobile', zoneRep.mobile || '');
    setTextField('zonerep_mobile', zoneRep.mobile || '');
    setTextField('Zone Rep Best Contact no:', zoneRep.mobile || '');
    setTextField('zonerep_best_contact_no', zoneRep.mobile || '');
    setTextField('ZoneRepBestContactNo', zoneRep.mobile || '');
  }

  // Flatten the form so fields become static text
  form.flatten();

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
