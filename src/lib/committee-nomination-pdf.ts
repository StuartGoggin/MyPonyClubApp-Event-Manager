import { PDFDocument } from 'pdf-lib';
import { CommitteeNomination, CommitteeNominationFormData } from '@/types/committee-nomination';
import { Club } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';

export interface CommitteeNominationPDFOptions {
  formData: CommitteeNominationFormData | CommitteeNomination;
  clubData?: Club; // Optional club data for Main Club Contact Details
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
  const { formData, clubData, submissionDate = new Date() } = options;

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
  console.log('Club data received for PDF:', clubData ? {
    hasClubData: true,
    postalAddress: clubData.postalAddress,
    physicalAddress: clubData.physicalAddress,
    email: clubData.email,
    clubColours: clubData.clubColours,
    cavIncorporationNumber: clubData.cavIncorporationNumber,
    rallyDay: clubData.rallyDay
  } : { hasClubData: false });

  // Helper function to safely set text field
  const setTextField = (fieldName: string, value: string) => {
    try {
      const field = form.getTextField(fieldName);
      field.setText(value || '');
    } catch (error) {
      // Silently fail - field doesn't exist
    }
  };

  // Helper function to safely check a checkbox
  const setCheckbox = (fieldName: string, checked: boolean) => {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
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
  
  // Main Club Contact Details (from club settings if available)
  if (clubData) {
    console.log('Attempting to populate Main Club Contact Details fields...');
    
    // Club Postal Address
    setTextField('Club Postal Address', clubData.postalAddress || '');
    setTextField('club_postal_address', clubData.postalAddress || '');
    setTextField('postal_address', clubData.postalAddress || '');
    
    // Site/Grounds Address (using physical address)
    setTextField('Site/Grounds Address', clubData.physicalAddress || '');
    setTextField('site_grounds_address', clubData.physicalAddress || '');
    setTextField('grounds_address', clubData.physicalAddress || '');
    setTextField('physical_address', clubData.physicalAddress || '');
    
    // Club Email
    setTextField('Club Email', clubData.email || '');
    setTextField('club_email', clubData.email || '');
    setTextField('email', clubData.email || '');
    
    // Club Colours
    setTextField('Club Colours', clubData.clubColours || '');
    setTextField('club_colours', clubData.clubColours || '');
    setTextField('colours', clubData.clubColours || '');
    
    // CAV Incorporation Number
    setTextField('CAV Incorporation number', clubData.cavIncorporationNumber || '');
    setTextField('cav_incorporation_number', clubData.cavIncorporationNumber || '');
    setTextField('incorporation_number', clubData.cavIncorporationNumber || '');
    
    // Club Rally Day
    setTextField('Club Rally Day', clubData.rallyDay || '');
    setTextField('club_rally_day', clubData.rallyDay || '');
    setTextField('rally_day', clubData.rallyDay || '');
    
    console.log('Finished attempting to populate club contact details');
  } else {
    console.log('No club data available - Main Club Contact Details will be empty');
  }
  
  // Submitter information (bottom of form)
  setTextField('your name', submitterData.name || '');
  setTextField('your position', 'Secretary');
  
  // District Commissioner - uses Name1, Email1, no, but Address2 (addresses are offset by 1)
  if (formData.districtCommissioner) {
    setTextField('Commissioner', formData.districtCommissioner.name || '');
    setTextField('Name1', formData.districtCommissioner.name || '');
    setTextField('Address2', formData.districtCommissioner.address || '');
    setTextField('Email1', formData.districtCommissioner.email || '');
    setTextField('no', formData.districtCommissioner.mobile || '');
    
    // Set New or Existing checkbox
    setCheckbox('new', formData.districtCommissioner.isNewDC === true);
    setCheckbox('existing DC?', formData.districtCommissioner.isNewDC === false);
  }
  
  // President - uses Name2, Email2, no1, but Address3
  if (formData.president) {
    setTextField('President', formData.president.name || '');
    setTextField('Name2', formData.president.name || '');
    setTextField('Address3', formData.president.address || '');
    setTextField('Email2', formData.president.email || '');
    setTextField('no1', formData.president.mobile || '');
  }
  
  // Vice President - uses Name3, Email3, no2, but Address4
  if (formData.vicePresident) {
    setTextField('President1', formData.vicePresident.name || '');
    setTextField('Name3', formData.vicePresident.name || '');
    setTextField('Address4', formData.vicePresident.address || '');
    setTextField('Email3', formData.vicePresident.email || '');
    setTextField('no2', formData.vicePresident.mobile || '');
  }
  
  // Secretary - uses Name4, Email4, no3, but Address5
  if (formData.secretary) {
    setTextField('Secretary', formData.secretary.name || '');
    setTextField('Name4', formData.secretary.name || '');
    setTextField('Address5', formData.secretary.address || '');
    setTextField('Email4', formData.secretary.email || '');
    setTextField('no3', formData.secretary.mobile || '');
  }
  
  // Treasurer - uses Name5, Email5, no4, and Address6
  if (formData.treasurer) {
    setTextField('Treasurer', formData.treasurer.name || '');
    setTextField('Name5', formData.treasurer.name || '');
    setTextField('Address6', formData.treasurer.address || '');
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
