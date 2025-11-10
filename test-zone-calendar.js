// Test script for the updated zone calendar format
const fs = require('fs');

// Since we can't directly require TypeScript, let's create a simple test
// We'll check if the file compiles correctly with the TypeScript compiler

// Test data similar to what might be in the system
const testOptions = {
  title: 'SMZ Event Calendar 2026',
  months: [
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
    { year: 2026, month: 3 }
  ],
  events: [
    {
      name: 'State Council Meeting',
      date: '2026-01-07',
      status: 'confirmed',
      club: 'Various',
      eventType: 'state council',
      location: 'State Office',
      contact: 'State Secretary',
      zone: 'All Zones',
      state: 'VIC'
    },
    {
      name: 'Freshmans Showjumping series number 1',
      date: '2026-01-10',
      status: 'confirmed',
      club: 'Mountain District',
      eventType: 'freshmans',
      location: 'Mountain District Grounds',
      contact: 'Event Coordinator',
      zone: 'SMZ',
      state: 'VIC'
    },
    {
      name: 'Freshmans Showjumping Day',
      date: '2026-01-17',
      status: 'confirmed',
      club: 'Mountain District',
      eventType: 'freshmans',
      location: 'Mountain District Grounds',
      contact: 'Event Coordinator',
      zone: 'SMZ',
      state: 'VIC'
    },
    {
      name: 'SMZ Zone Meeting',
      date: '2026-02-15',
      status: 'confirmed',
      club: 'Zone Committee',
      eventType: 'smz meeting',
      location: 'Zone Headquarters',
      contact: 'Zone Secretary',
      zone: 'SMZ',
      state: 'VIC'
    },
    {
      name: 'State Championship Qualifier',
      date: '2026-03-20',
      status: 'confirmed',
      club: 'Central District',
      eventType: 'qualifier',
      location: 'State Equestrian Centre',
      contact: 'Championship Coordinator',
      zone: 'SMZ',
      state: 'VIC'
    }
  ],
  zones: [
    {
      id: 'smz1',
      name: 'SMZ Zone',
      state: 'VIC'
    }
  ],
  clubs: [
    {
      id: 'mountain1',
      name: 'Mountain District',
      zoneId: 'smz1',
      state: 'VIC'
    },
    {
      id: 'central1', 
      name: 'Central District',
      zoneId: 'smz1',
      state: 'VIC'
    }
  ]
};

try {
  console.log('Generating zone calendar PDF with new format...');
  const pdfBuffer = generateZoneFormatCalendarPDF(testOptions);
  
  // Save the PDF to test the output
  fs.writeFileSync('test-zone-calendar-output.pdf', pdfBuffer);
  console.log('✅ PDF generated successfully! Check test-zone-calendar-output.pdf');
  console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
  
} catch (error) {
  console.error('❌ Error generating PDF:', error);
}
