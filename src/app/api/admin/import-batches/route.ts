import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, DocumentSnapshot } from 'firebase-admin/firestore';

// Import batch management API
export async function POST(request: NextRequest) {
  try {
    const { action, batchData, batchId } = await request.json();

    switch (action) {
      case 'create':
        return await createImportBatch(batchData);
      case 'update':
        return await updateImportBatch(batchId, batchData);
      case 'execute':
        return await executeImportBatch(batchId);
      case 'rollback':
        return await rollbackImportBatch(batchId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in import batch API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (batchId) {
      return await getImportBatch(batchId);
    } else {
      return await getAllImportBatches();
    }
  } catch (error) {
    console.error('Error fetching import batches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function createImportBatch(batchData: any) {
  const batch = {
    ...batchData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'draft'
  };

  const docRef = await adminDb.collection('importBatches').add(batch);
  
  return NextResponse.json({ 
    success: true, 
    batchId: docRef.id,
    batch: { ...batch, id: docRef.id }
  });
}

async function updateImportBatch(batchId: string, batchData: any) {
  await adminDb.collection('importBatches').doc(batchId).update({
    ...batchData,
    updatedAt: Timestamp.now()
  });

  return NextResponse.json({ success: true });
}

async function executeImportBatch(batchId: string) {
  const batchDoc = await adminDb.collection('importBatches').doc(batchId).get();
  
  if (!batchDoc.exists) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const batchData = batchDoc.data();
  const importedEventIds: string[] = [];

  try {
    // Update batch status to importing
    await adminDb.collection('importBatches').doc(batchId).update({
      status: 'importing',
      updatedAt: Timestamp.now()
    });

    // Import each event
    for (const event of batchData?.events || []) {
      if (event.status === 'matched' && event.validationErrors.length === 0) {
        const eventData: any = {
          name: event.name,
          date: Timestamp.fromDate(event.startDate),
          eventTypeId: event.eventTypeId || 'default-type',
          location: event.location || '',
          notes: event.notes || '',
          coordinatorName: event.coordinatorName || '',
          coordinatorContact: event.coordinatorContact || '',
          isQualifier: event.isQualifier || false,
          status: 'approved', // Auto-approve imported events
          source: 'calendar_import',
          importBatchId: batchId,
          createdAt: Timestamp.now(),
          submittedAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Add club or zone association
        if (event.clubId) {
          eventData.clubId = event.clubId;
        } else if (event.zoneId) {
          eventData.zoneId = event.zoneId;
        }

        const eventDoc = await adminDb.collection('events').add(eventData);
        importedEventIds.push(eventDoc.id);
      }
    }

    // Update batch with results
    await adminDb.collection('importBatches').doc(batchId).update({
      status: 'completed',
      importedEventIds,
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({ 
      success: true, 
      importedCount: importedEventIds.length,
      importedEventIds
    });

  } catch (error) {
    console.error('Error executing import batch:', error);
    
    // Update batch status to failed
    await adminDb.collection('importBatches').doc(batchId).update({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}

async function rollbackImportBatch(batchId: string) {
  const batchDoc = await adminDb.collection('importBatches').doc(batchId).get();
  
  if (!batchDoc.exists) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const batchData = batchDoc.data();
  const importedEventIds = batchData?.importedEventIds || [];

  try {
    // Delete all imported events
    const batch = adminDb.batch();
    for (const eventId of importedEventIds) {
      const eventRef = adminDb.collection('events').doc(eventId);
      batch.delete(eventRef);
    }
    await batch.commit();

    // Update batch status
    await adminDb.collection('importBatches').doc(batchId).update({
      status: 'rolled_back',
      rolledBackAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: importedEventIds.length 
    });

  } catch (error) {
    console.error('Error rolling back import batch:', error);
    return NextResponse.json({ error: 'Rollback failed' }, { status: 500 });
  }
}

async function getImportBatch(batchId: string) {
  const doc = await adminDb.collection('importBatches').doc(batchId).get();
  
  if (!doc.exists) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const data = doc.data();
  return NextResponse.json({
    ...data,
    id: doc.id,
    createdAt: data?.createdAt?.toDate(),
    updatedAt: data?.updatedAt?.toDate(),
    completedAt: data?.completedAt?.toDate(),
    rolledBackAt: data?.rolledBackAt?.toDate()
  });
}

async function getAllImportBatches() {
  const snapshot = await adminDb.collection('importBatches')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const batches = snapshot.docs.map((doc: DocumentSnapshot) => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data?.createdAt?.toDate(),
      updatedAt: data?.updatedAt?.toDate(),
      completedAt: data?.completedAt?.toDate(),
      rolledBackAt: data?.rolledBackAt?.toDate()
    };
  });

  return NextResponse.json({ batches });
}
