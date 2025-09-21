import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface ClubWithPcaId {
  id: string;
  name: string;
  logoUrlId: string;
  fullUrl: string;
}

interface DownloadClubLogosResponse {
  success: boolean;
  summary: {
    totalClubs: number;
    clubsWithLogoUrls: number;
    clubsWithPcaIds: number;
    examplePcaId: string | null;
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
}

// Function to format PCA logo URL
function formatPcaLogoUrl(logoId: string): string {
  // Remove any existing URL parts if logoId contains them
  const cleanId = logoId.replace(/^.*[\/\\]/, ''); // Remove any path prefix
  
  return `https://pca.justgo.com/Store/DownloadPublic?f=${cleanId}&t=repo&p=248547&p1=&p2=2`;
}

// Function to download a single logo
async function downloadLogo(url: string): Promise<{ data: string; contentType: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  
  return {
    data: `data:${contentType};base64,${base64}`,
    contentType
  };
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

    // Find clubs with PCA logo IDs - check both logoUrl and image fields
    const clubsWithPcaIds: ClubWithPcaId[] = clubs
      .filter((club: any) => {
        const logoUrl = club.logoUrl;
        const imageField = club.image;
        
        // Check if logoUrl field contains a PCA logo ID (GUID.png format)
        const hasLogoUrl = logoUrl && typeof logoUrl === 'string' && 
                          logoUrl.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png/i);
        
        // Check if image field contains a PCA logo ID (GUID.png format)
        const hasImageId = imageField && typeof imageField === 'string' && 
                          imageField.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png/i);
        
        return hasLogoUrl || hasImageId;
      })
      .map((club: any) => {
        // Use logoUrl field if it has PCA ID, otherwise use image field
        const logoUrlField = club.logoUrl;
        const imageField = club.image;
        
        const hasLogoUrl = logoUrlField && typeof logoUrlField === 'string' && 
                          logoUrlField.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png/i);
        
        const logoId = hasLogoUrl ? logoUrlField : imageField;
        
        return {
          id: club.id,
          name: club.name || 'Unknown Club',
          logoUrlId: logoId,
          fullUrl: formatPcaLogoUrl(logoId)
        };
      });

    console.log(`Found ${clubsWithPcaIds.length} clubs with PCA logo IDs`);

    // Download logos if requested
    const downloads = await processClubLogosInBatches(clubsWithPcaIds, downloadLogos);

    const response: DownloadClubLogosResponse = {
      success: true,
      summary: {
        totalClubs: clubs.length,
        clubsWithLogoUrls: clubsWithPcaIds.length,
        clubsWithPcaIds: clubsWithPcaIds.length,
        examplePcaId: clubsWithPcaIds.length > 0 ? clubsWithPcaIds[0].logoUrlId : null
      },
      clubsWithPcaIds,
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