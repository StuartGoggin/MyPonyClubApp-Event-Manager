import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

interface StoredLogo {
  clubId: string;
  clubName: string;
  logoData: string;
  contentType: string;
  downloadedAt: string;
}

interface StoreClubLogosRequest {
  selectedLogos: StoredLogo[];
}

interface StoreClubLogosResponse {
  success: boolean;
  summary: {
    totalSelected: number;
    successfulStores: number;
    errors: number;
  };
  results: {
    clubId: string;
    clubName: string;
    success: boolean;
    error?: string;
  }[];
}

export async function POST(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not available' }, 
        { status: 503 }
      );
    }

    const body: StoreClubLogosRequest = await request.json();
    const { selectedLogos } = body;

    if (!selectedLogos || !Array.isArray(selectedLogos)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request: selectedLogos array required' },
        { status: 400 }
      );
    }

    console.log(`Processing ${selectedLogos.length} logo storage requests`);

    const results: StoreClubLogosResponse['results'] = [];
    const batchSize = 10;

    // Process in batches to avoid overwhelming Firestore
    for (let i = 0; i < selectedLogos.length; i += batchSize) {
      const batch = adminDb.batch();
      const currentBatch = selectedLogos.slice(i, i + batchSize);

      for (const logo of currentBatch) {
        try {
          const clubRef = adminDb.collection('clubs').doc(logo.clubId);
          
          // Update club document with logo data
          batch.update(clubRef, {
            logoUrl: logo.logoData,
            logoContentType: logo.contentType,
            logoUpdatedAt: new Date().toISOString(),
            logoSource: 'pca-download'
          });

          results.push({
            clubId: logo.clubId,
            clubName: logo.clubName,
            success: true
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error preparing update for club ${logo.clubId}:`, errorMessage);
          
          results.push({
            clubId: logo.clubId,
            clubName: logo.clubName,
            success: false,
            error: errorMessage
          });
        }
      }

      // Commit the batch
      try {
        await batch.commit();
        console.log(`Successfully committed batch ${Math.floor(i / batchSize) + 1}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error committing batch ${Math.floor(i / batchSize) + 1}:`, errorMessage);
        
        // Mark all items in this batch as failed
        for (let j = 0; j < currentBatch.length; j++) {
          const resultIndex = results.length - currentBatch.length + j;
          if (results[resultIndex]) {
            results[resultIndex].success = false;
            results[resultIndex].error = `Batch commit failed: ${errorMessage}`;
          }
        }
      }
    }

    const successfulStores = results.filter(r => r.success).length;
    const errors = results.filter(r => !r.success).length;

    const response: StoreClubLogosResponse = {
      success: true,
      summary: {
        totalSelected: selectedLogos.length,
        successfulStores,
        errors
      },
      results
    };

    console.log(`Logo storage completed: ${successfulStores} successful, ${errors} errors`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in store-club-logos API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }, 
      { status: 500 }
    );
  }
}