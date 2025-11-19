import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * POST /api/committee-nominations/[id]/withdraw
 * 
 * Withdraw a pending committee nomination
 * Only allowed if status is 'pending_dc_approval'
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the nomination
    const nominationRef = adminDb.collection('committee_nominations').doc(id);
    const nominationDoc = await nominationRef.get();

    if (!nominationDoc.exists) {
      return NextResponse.json(
        { error: 'Nomination not found' },
        { status: 404 }
      );
    }

    const nomination = nominationDoc.data();

    // Only allow withdrawal of pending nominations
    if (nomination?.status !== 'pending_dc_approval') {
      return NextResponse.json(
        { error: 'Can only withdraw pending nominations' },
        { status: 400 }
      );
    }

    // Update status to withdrawn
    await nominationRef.update({
      status: 'withdrawn',
      withdrawnAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Nomination withdrawn successfully',
    });

  } catch (error) {
    console.error('Error withdrawing committee nomination:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw nomination' },
      { status: 500 }
    );
  }
}
