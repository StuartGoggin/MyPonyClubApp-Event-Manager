import { PDFDocument, PDFFont, StandardFonts, rgb } from 'pdf-lib';
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
  
  // Embed bold font
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Get the form
  const form = pdfDoc.getForm();
  
  // Enable appearance streams so we can set custom fonts
  form.updateFieldAppearances(boldFont);
  
  // Get all field names (for debugging)
  const fields = form.getFields();
  console.log('PDF Form Fields:', fields.map(f => ({ name: f.getName(), type: f.constructor.name })));
  console.log('Club contact details in form data:', formData.clubContactDetails ? {
    hasClubContactDetails: true,
    postalAddress: formData.clubContactDetails.postalAddress,
    physicalAddress: formData.clubContactDetails.physicalAddress,
    email: formData.clubContactDetails.email,
    clubColours: formData.clubContactDetails.clubColours,
    cavIncorporationNumber: formData.clubContactDetails.cavIncorporationNumber,
    rallyDay: formData.clubContactDetails.rallyDay
  } : { hasClubContactDetails: false });

  // Helper function to safely set text field with font size
  const setTextField = (fieldName: string, value: string, fontSize: number = 10) => {
    try {
      const field = form.getTextField(fieldName);
      field.setText(value || '');
      
      // Set font size using default appearance
      const widgets = field.acroField.getWidgets();
      widgets.forEach(widget => {
        const context = widget.dict.context;
        widget.setDefaultAppearance(`/Helv-Bold ${fontSize} Tf 0 g`);
      });
      
      field.updateAppearances(boldFont);
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
  setTextField('Club Name', formData.clubName, 10);
  setTextField('ClubName', formData.clubName, 10);
  setTextField('club_name', formData.clubName, 10);
  setTextField('club', formData.clubName, 10);
  setTextField('your pony club', formData.clubName, 10);
  
  setTextField('Zone', formData.zoneName || '', 10);
  setTextField('zone', formData.zoneName || '', 10);
  
  setTextField('AGM Date', formatDate(formData.agmDate), 10);
  setTextField('agm_date', formatDate(formData.agmDate), 10);
  setTextField('AGMDate', formatDate(formData.agmDate), 10);
  setTextField('Date of AGM', formatDate(formData.agmDate), 10);
  setTextField('date AGM held', formatDate(formData.agmDate), 10);
  
  setTextField('Year', formData.year?.toString() || '', 10);
  setTextField('year', formData.year?.toString() || '', 10);
  setTextField('Committee Year', formData.year?.toString() || '', 10);
  setTextField('fin year', formData.year?.toString() || '', 10);
  
  // Main Club Contact Details (from formData.clubContactDetails if available)
  if (formData.clubContactDetails) {
    console.log('Attempting to populate Main Club Contact Details fields from form data...');
    
    // Club Postal Address - use 'Address' field
    setTextField('Address', formData.clubContactDetails.postalAddress || '', 10);
    
    // Site/Grounds Address - use 'Address1' field
    setTextField('Address1', formData.clubContactDetails.physicalAddress || '', 10);
    
    // Club Email - use 'Email' field (not Email1, that's for committee members)
    setTextField('Email', formData.clubContactDetails.email || '', 10);
    
    // Club Colours - exact match from PDF
    setTextField('club colours', formData.clubContactDetails.clubColours || '', 10);
    
    // CAV Incorporation Number - exact match from PDF
    setTextField('incorp number', formData.clubContactDetails.cavIncorporationNumber || '', 10);
    
    // Club Rally Day - exact match from PDF
    setTextField('club rally day', formData.clubContactDetails.rallyDay || '', 10);
    
    console.log('Finished attempting to populate club contact details from form data');
  } else {
    console.log('No club contact details in form data - Main Club Contact Details will be empty');
  }
  
  // Submitter information (bottom of form)
  setTextField('your name', submitterData.name || '', 10);
  setTextField('your position', 'Secretary', 10);
  
  // District Commissioner - uses Name1, Email1, no, but Address2 (addresses are offset by 1)
  if (formData.districtCommissioner) {
    // Don't fill 'Commissioner' - it's just a header label
    setTextField('Name1', formData.districtCommissioner.name || '', 10);
    setTextField('Address2', formData.districtCommissioner.address || '', 10);
    setTextField('Email1', formData.districtCommissioner.email || '', 10);
    setTextField('no', formData.districtCommissioner.mobile || '', 10);
    
    // Set New or Existing checkbox
    setCheckbox('new', formData.districtCommissioner.isNewDC === true);
    setCheckbox('existing DC?', formData.districtCommissioner.isNewDC === false);
  }
  
  // President - uses Name2, Email2, no1, but Address3
  if (formData.president) {
    // Don't fill 'President' - it's just a header label
    setTextField('Name2', formData.president.name || '', 10);
    setTextField('Address3', formData.president.address || '', 10);
    setTextField('Email2', formData.president.email || '', 10);
    setTextField('no1', formData.president.mobile || '', 10);
  }
  
  // Vice President - uses Name3, Email3, no2, but Address4
  if (formData.vicePresident) {
    // Don't fill 'President1' - it's just a header label
    setTextField('Name3', formData.vicePresident.name || '', 10);
    setTextField('Address4', formData.vicePresident.address || '', 10);
    setTextField('Email3', formData.vicePresident.email || '', 10);
    setTextField('no2', formData.vicePresident.mobile || '', 10);
  }
  
  // Secretary - uses Name4, Email4, no3, but Address5
  if (formData.secretary) {
    // Don't fill 'Secretary' - it's just a header label
    setTextField('Name4', formData.secretary.name || '', 10);
    setTextField('Address5', formData.secretary.address || '', 10);
    setTextField('Email4', formData.secretary.email || '', 10);
    setTextField('no3', formData.secretary.mobile || '', 10);
  }
  
  // Treasurer - uses Name5, Email5, no4, and Address6
  if (formData.treasurer) {
    // Don't fill 'Treasurer' - it's just a header label
    setTextField('Name5', formData.treasurer.name || '', 10);
    setTextField('Address6', formData.treasurer.address || '', 10);
    setTextField('Email5', formData.treasurer.email || '', 10);
    setTextField('no4', formData.treasurer.mobile || '', 10);
  }
  
  // Zone Representative
  const zoneRep = 'zoneRepresentative' in formData 
    ? formData.zoneRepresentative 
    : ('zoneRepOther' in formData ? formData.zoneRepOther : null);
    
  if (zoneRep && zoneRep.name) {
    setTextField('Zone Rep Name', zoneRep.name || '', 10);
    setTextField('zonerep_name', zoneRep.name || '', 10);
    setTextField('ZoneRep Name', zoneRep.name || '', 10);
    setTextField('Zone Representative', zoneRep.name || '', 10);
    
    setTextField('Zone Rep PC ID', zoneRep.ponyClubId || '', 10);
    setTextField('zonerep_pcid', zoneRep.ponyClubId || '', 10);
    setTextField('Zone Rep PCA Number', zoneRep.ponyClubId || '', 10);
    
    setTextField('Zone Rep Email', zoneRep.email || '', 10);
    setTextField('zonerep_email', zoneRep.email || '', 10);
    
    setTextField('Zone Rep Mobile', zoneRep.mobile || '', 10);
    setTextField('zonerep_mobile', zoneRep.mobile || '', 10);
    setTextField('Zone Rep Best Contact no:', zoneRep.mobile || '', 10);
    setTextField('zonerep_best_contact_no', zoneRep.mobile || '', 10);
    setTextField('ZoneRepBestContactNo', zoneRep.mobile || '', 10);
  }

  // Flatten the form so fields become static text
  form.flatten();

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
