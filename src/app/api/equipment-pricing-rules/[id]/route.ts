/**
 * Individual Equipment Pricing Rule API
 * GET /api/equipment-pricing-rules/[id] - Get specific pricing rule
 * PUT /api/equipment-pricing-rules/[id] - Update pricing rule
 * DELETE /api/equipment-pricing-rules/[id] - Delete pricing rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { updatePricingRule, deletePricingRule } from '@/lib/equipment-service';
import { adminDb } from '@/lib/firebase-admin';
import { requireZoneManager } from '@/lib/api-auth';
import type { PricingRule } from '@/types/equipment';

const PRICING_RULES_COLLECTION = 'equipment-pricing-rules';

/**
 * GET /api/equipment-pricing-rules/[id]
 * Get specific pricing rule by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb
      .collection(PRICING_RULES_COLLECTION)
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pricing rule not found',
        },
        { status: 404 }
      );
    }

    const rule = {
      id: doc.id,
      ...doc.data(),
    } as PricingRule;

    return NextResponse.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/equipment-pricing-rules/[id]
 * Update pricing rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get existing rule to check zone
    const doc = await adminDb
      .collection(PRICING_RULES_COLLECTION)
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pricing rule not found',
        },
        { status: 404 }
      );
    }

    const existingRule = { id: doc.id, ...doc.data() } as PricingRule;

    // Require zone manager authentication for the rule's zone
    const authResult = await requireZoneManager(request, existingRule.zoneId);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    const updates: Partial<PricingRule> = {};

    if (body.active !== undefined) updates.active = body.active;
    if (body.pricePerDay !== undefined) updates.pricePerDay = body.pricePerDay;
    if (body.pricePerWeek !== undefined) updates.pricePerWeek = body.pricePerWeek;
    if (body.discountPercentage !== undefined) updates.discountPercentage = body.discountPercentage;
    if (body.minimumCharge !== undefined) updates.minimumCharge = body.minimumCharge;
    if (body.seasonalPricing !== undefined) updates.seasonalPricing = body.seasonalPricing;
    if (body.validFrom !== undefined) updates.validFrom = body.validFrom ? new Date(body.validFrom) : undefined;
    if (body.validUntil !== undefined) updates.validUntil = body.validUntil ? new Date(body.validUntil) : undefined;

    const updatedRule = await updatePricingRule(id, updates);

    return NextResponse.json({
      success: true,
      data: updatedRule,
      message: 'Pricing rule updated successfully',
    });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update pricing rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/equipment-pricing-rules/[id]
 * Delete pricing rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get existing rule to check zone
    const doc = await adminDb
      .collection(PRICING_RULES_COLLECTION)
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pricing rule not found',
        },
        { status: 404 }
      );
    }

    const existingRule = { id: doc.id, ...doc.data() } as PricingRule;

    // Require zone manager authentication for the rule's zone
    const authResult = await requireZoneManager(request, existingRule.zoneId);
    
    if ('error' in authResult) {
      return authResult.error;
    }

    await deletePricingRule(id);

    return NextResponse.json({
      success: true,
      message: 'Pricing rule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete pricing rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
