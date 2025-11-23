/**
 * Equipment Pricing Rules API
 * GET /api/equipment-pricing-rules - List pricing rules
 * POST /api/equipment-pricing-rules - Create pricing rule
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPricingRule } from '@/lib/equipment-service';
import { adminDb } from '@/lib/firebase-admin';
import type { PricingRule } from '@/types/equipment';

const PRICING_RULES_COLLECTION = 'equipment-pricing-rules';

/**
 * GET /api/equipment-pricing-rules
 * List pricing rules with optional filters
 * Query params: zoneId, equipmentId, clubId, active
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    let query: any = adminDb.collection(PRICING_RULES_COLLECTION);

    const zoneId = searchParams.get('zoneId');
    const equipmentId = searchParams.get('equipmentId');
    const clubId = searchParams.get('clubId');
    const active = searchParams.get('active');

    if (zoneId) {
      query = query.where('zoneId', '==', zoneId);
    }

    if (equipmentId) {
      query = query.where('equipmentId', '==', equipmentId);
    }

    if (clubId) {
      query = query.where('clubId', '==', clubId);
    }

    if (active !== null && active !== undefined) {
      query = query.where('active', '==', active === 'true');
    }

    const snapshot = await query.get();
    const rules = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    })) as PricingRule[];

    return NextResponse.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pricing rules',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment-pricing-rules
 * Create new pricing rule
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Add authentication check for zone manager role
    const createdBy = body.createdBy || 'system';

    // Validate required fields
    if (!body.zoneId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Zone ID is required',
        },
        { status: 400 }
      );
    }

    // At least one of equipmentId or category should be specified
    if (!body.equipmentId && !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either equipmentId or category must be specified',
        },
        { status: 400 }
      );
    }

    // At least one pricing field should be provided
    if (!body.pricePerDay && !body.pricePerWeek && !body.discountPercentage) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one pricing field must be provided (pricePerDay, pricePerWeek, or discountPercentage)',
        },
        { status: 400 }
      );
    }

    const ruleData = {
      zoneId: body.zoneId,
      equipmentId: body.equipmentId || undefined,
      category: body.category || undefined,
      clubId: body.clubId || undefined,
      clubName: body.clubName || undefined,
      pricePerDay: body.pricePerDay || undefined,
      pricePerWeek: body.pricePerWeek || undefined,
      discountPercentage: body.discountPercentage || undefined,
      minimumCharge: body.minimumCharge || undefined,
      seasonalPricing: body.seasonalPricing || undefined,
      validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
      validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
      active: body.active !== undefined ? body.active : true,
      createdBy,
    };

    const rule = await createPricingRule(ruleData, createdBy);

    return NextResponse.json(
      {
        success: true,
        data: rule,
        message: 'Pricing rule created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create pricing rule',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
