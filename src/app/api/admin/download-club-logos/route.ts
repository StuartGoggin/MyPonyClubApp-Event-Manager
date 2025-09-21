import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Force dynamic rendering
export const runtime = 'nodejs';

interface ClubWithPcaId {
  id: string;
  name: string;
  logoUrlId: string;
  docId: number;
  fullUrl: string;
}

interface DownloadClubLogosResponse {
  success: boolean;
  summary: {
    totalClubs: number;
    clubsWithLogoUrls: number;
    clubsWithPcaIds: number;
    examplePcaId: string | null;
    exampleUrl: string | null;
    sampleClubData?: any; // For diagnostics
  };
  clubsWithPcaIds: ClubWithPcaId[];
  downloads?: {
    clubId: string;
    clubName: string;
    logoData: string;
    contentType: string;
    downloadedAt: string;
  }[];
  errors?: string[];
  diagnostics?: {
    sampleClubs: any[];
    filteringLog: string[];
  };
}

// Function to format PCA logo URL
function formatPcaLogoUrl(logoId: string, docId: number): string {
  // Extract GUID from logoId (remove .png extension if present)
  const cleanId = logoId.replace(/\.png$/i, '');
  
  return `https://pca.justgo.com/Store/DownloadPublic?f=${cleanId}&t=repo&p=${docId}&p1=&p2=2`;
}

// Function to download a single logo
async function downloadLogo(url: string): Promise<{ data: string; contentType: string }> {
  console.log(`🔄 Attempting to download logo from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log(`✅ Successfully downloaded ${arrayBuffer.byteLength} bytes, content-type: ${contentType}`);
    
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return {
      data: `data:${contentType};base64,${base64}`,
      contentType
    };
  } catch (error) {
    console.error(`❌ Download failed for ${url}:`, error);
    throw error;
  }
}

// Function to process downloads in batches
async function processClubLogosInBatches(
  clubs: ClubWithPcaId[], 
  downloadLogos: boolean = false
): Promise<DownloadClubLogosResponse['downloads']> {
  if (!downloadLogos) {
    return undefined;
  }
  
  const downloads: DownloadClubLogosResponse['downloads'] = [];
  const errors: string[] = [];
  const batchSize = 5;
  const delayBetweenBatches = 1000; // 1 second
  const requestTimeout = 30000; // 30 seconds
  
  for (let i = 0; i < clubs.length; i += batchSize) {
    const batch = clubs.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clubs.length / batchSize)}`);
    
    const batchPromises = batch.map(async (club) => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), requestTimeout)
        );
        
        const downloadPromise = downloadLogo(club.fullUrl);
        const result = await Promise.race([downloadPromise, timeoutPromise]) as { data: string; contentType: string };
        
        return {
          clubId: club.id,
          clubName: club.name,
          logoData: result.data,
          contentType: result.contentType,
          downloadedAt: new Date().toISOString()
        };
      } catch (error) {
        const errorMessage = `Failed to download logo for ${club.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMessage);
        errors.push(errorMessage);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    downloads.push(...batchResults.filter(result => result !== null) as NonNullable<typeof batchResults[0]>[]);
    
    // Add delay between batches to be respectful to the server
    if (i + batchSize < clubs.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  if (errors.length > 0) {
    console.warn(`Encountered ${errors.length} errors during download:`, errors);
  }
  
  return downloads;
}

export async function GET(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not available' }, 
        { status: 503 }
      );
    }

    const url = new URL(request.url);
    const downloadLogos = url.searchParams.get('download') === 'true';

    // Fetch all clubs
    const clubsSnapshot = await adminDb.collection('clubs').get();
    const clubs = clubsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${clubs.length} total clubs`);

    // Add detailed diagnostics for first few clubs
    console.log('=== CLUB ANALYSIS DIAGNOSTICS ===');
    const firstFewClubs = clubs.slice(0, 5);
    firstFewClubs.forEach((club: any, index: number) => {
      console.log(`Club ${index + 1}: ${club.name || 'Unnamed'}`);
      console.log(`  - ID: ${club.id}`);
      console.log(`  - logoUrl field: ${JSON.stringify(club.logoUrl)}`);
      console.log(`  - image field: ${JSON.stringify(club.image)}`);
      console.log(`  - docId field: ${JSON.stringify(club.docId)}`);
      console.log(`  - DocId field (uppercase): ${JSON.stringify(club.DocId)}`);
      
      // Check all field names that might contain logo or doc info
      const relevantFields = Object.keys(club).filter(key => 
        key.toLowerCase().includes('logo') || 
        key.toLowerCase().includes('image') || 
        key.toLowerCase().includes('doc')
      );
      if (relevantFields.length > 0) {
        console.log(`  - Other relevant fields: ${relevantFields.map(field => `${field}: ${JSON.stringify(club[field])}`).join(', ')}`);
      }
      console.log('');
    });

    // Find clubs with PCA logo IDs - check both logoUrl and image fields, and ensure docId exists
    const clubsWithPcaIds: ClubWithPcaId[] = clubs
      .filter((club: any) => {
        const logoUrl = club.logoUrl;
        const imageField = club.image;
        const docId = club.docId; // Note: docId is lowercase in the club data
        
        console.log(`Filtering club: ${club.name || 'Unnamed'} (ID: ${club.id})`);
        console.log(`  - logoUrl: ${JSON.stringify(logoUrl)}`);
        console.log(`  - image: ${JSON.stringify(imageField)}`);
        console.log(`  - docId: ${JSON.stringify(docId)}`);
        
        // Must have a docId to construct the URL
        if (!docId || typeof docId !== 'number') {
          console.log(`  ❌ No valid docId (missing or not a number)`);
          return false;
        }
        
        // Check if logoUrl field contains a PCA logo ID (GUID.png format)
        const guidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png/i;
        const hasLogoUrl = logoUrl && typeof logoUrl === 'string' && 
                          logoUrl.match(guidPattern);
        
        // Check if image field contains a PCA logo ID (GUID.png format)
        const hasImageId = imageField && typeof imageField === 'string' && 
                          imageField.match(guidPattern);
        
        console.log(`  - logoUrl matches GUID pattern: ${hasLogoUrl}`);
        console.log(`  - image matches GUID pattern: ${hasImageId}`);
        
        const result = hasLogoUrl || hasImageId;
        console.log(`  - Filter result: ${result ? '✅ INCLUDED' : '❌ EXCLUDED'}`);
        console.log('');
        
        return result;
      })
      .map((club: any) => {
        // Use logoUrl field if it has PCA ID, otherwise use image field
        const logoUrlField = club.logoUrl;
        const imageField = club.image;
        const docId = club.docId; // Note: docId is lowercase in the club data
        
        const guidPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png/i;
        const hasLogoUrl = logoUrlField && typeof logoUrlField === 'string' && 
                          logoUrlField.match(guidPattern);
        
        const logoId = hasLogoUrl ? logoUrlField : imageField;
        
        console.log(`Mapping club: ${club.name || 'Unnamed'}`);
        console.log(`  - Using logoId: ${logoId} (from ${hasLogoUrl ? 'logoUrl' : 'image'} field)`);
        console.log(`  - docId: ${docId}`);
        
        // Only include clubs that have both logoId and docId
        if (!logoId || !docId) {
          console.log(`  ❌ Missing required data (logoId: ${!!logoId}, docId: ${!!docId})`);
          return null;
        }
        
        const fullUrl = formatPcaLogoUrl(logoId, docId);
        console.log(`  - Generated URL: ${fullUrl}`);
        
        return {
          id: club.id,
          name: club.name || 'Unknown Club',
          logoUrlId: logoId,
          docId: docId,
          fullUrl: fullUrl
        };
      })
      .filter((club: any) => club !== null); // Remove null entries

    console.log(`=== FILTERING RESULTS ===`);
    console.log(`Found ${clubsWithPcaIds.length} clubs with PCA logo IDs`);
    
    if (clubsWithPcaIds.length > 0) {
      console.log('First few clubs with PCA IDs:');
      clubsWithPcaIds.slice(0, 3).forEach((club, index) => {
        console.log(`  ${index + 1}. ${club.name}`);
        console.log(`     - Logo ID: ${club.logoUrlId}`);
        console.log(`     - Doc ID: ${club.docId}`);
        console.log(`     - Full URL: ${club.fullUrl}`);
      });
    } else {
      console.log('❌ No clubs found with valid PCA logo IDs and docIds');
      console.log('Checking what data is available in clubs:');
      
      // Sample a few clubs to see what data structure we have
      const sampleClubs = clubs.slice(0, 10);
      sampleClubs.forEach((club: any, index: number) => {
        console.log(`Sample club ${index + 1}: ${club.name || 'Unnamed'}`);
        console.log(`  All fields: ${Object.keys(club).join(', ')}`);
        
        // Show values for potential logo/image fields
        const imageFields = Object.keys(club).filter(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('logo')
        );
        imageFields.forEach(field => {
          console.log(`  ${field}: ${JSON.stringify(club[field])}`);
        });
        
        // Show values for potential doc ID fields
        const docFields = Object.keys(club).filter(key => 
          key.toLowerCase().includes('doc')
        );
        docFields.forEach(field => {
          console.log(`  ${field}: ${JSON.stringify(club[field])}`);
        });
      });
    }

    // Download logos if requested
    const downloads = await processClubLogosInBatches(clubsWithPcaIds, downloadLogos);

    const response: DownloadClubLogosResponse = {
      success: true,
      summary: {
        totalClubs: clubs.length,
        clubsWithLogoUrls: clubsWithPcaIds.length,
        clubsWithPcaIds: clubsWithPcaIds.length,
        examplePcaId: clubsWithPcaIds.length > 0 ? clubsWithPcaIds[0].logoUrlId : null,
        exampleUrl: clubsWithPcaIds.length > 0 ? clubsWithPcaIds[0].fullUrl : null,
        sampleClubData: clubs.slice(0, 3).map((club: any) => ({
          name: club.name,
          id: club.id,
          logoUrl: club.logoUrl,
          image: club.image,
          docId: club.docId,
          DocId: club.DocId // Check both cases
        }))
      },
      clubsWithPcaIds,
      diagnostics: {
        sampleClubs: clubs.slice(0, 5).map((club: any) => ({
          name: club.name,
          fields: Object.keys(club),
          logoFields: Object.keys(club).filter(key => 
            key.toLowerCase().includes('logo') || 
            key.toLowerCase().includes('image')
          ).map(key => ({ [key]: club[key] })),
          docFields: Object.keys(club).filter(key => 
            key.toLowerCase().includes('doc')
          ).map(key => ({ [key]: club[key] }))
        })),
        filteringLog: [
          `Total clubs found: ${clubs.length}`,
          `Clubs with valid PCA IDs: ${clubsWithPcaIds.length}`,
          `Download requested: ${downloadLogos}`
        ]
      },
      ...(downloads && { downloads })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in download-club-logos API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, 
      { status: 500 }
    );
  }
}