/**
 * Equipment API Routes
 * GET /api/equipment - List all equipment (with filters)
 * POST /api/equipment - Create new equipment (zone managers only)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listEquipment,
  createEquipment,
} from '@/lib/equipment-service';
import type { CreateEquipmentRequest } from '@/types/equipment';

/**
 * GET /api/equipment
 * List equipment with optional filters
 * Query params: zoneId, category, availability
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      zoneId: searchParams.get('zoneId') || undefined,
      category: searchParams.get('category') || undefined,
      availability: searchParams.get('availability') || undefined,
    };

    const equipment = await listEquipment(filters);

    return NextResponse.json({
      success: true,
      data: equipment,
      count: equipment.length,
    });
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/equipment
 * Create new equipment item
 * Requires zone manager authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Add authentication check for zone manager role
    const createdBy = body.createdBy || 'system';

    // Validate required fields
    const requiredFields = ['zoneId', 'name', 'category', 'quantity', 'depositRequired'];
    const missingFields = requiredFields.filter(field => body[field] === undefined || body[field] === null);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          missingFields,
        },
        { status: 400 }
      );
    }

    const equipmentData: CreateEquipmentRequest = {
      zoneId: body.zoneId,
      name: body.name,
      category: body.category,
      description: body.description || '',
      icon: body.icon || '',
      quantity: body.quantity,
      basePricePerDay: body.hirePrice || body.basePricePerDay || 0, // Store hirePrice as basePricePerDay
      basePricePerWeek: 0, // Not used - pricing is per hire
      depositRequired: body.depositRequired || 0,
      bondAmount: body.bondAmount || 0,
      requiresTrailer: body.requiresTrailer || false,
      storageLocation: body.storageLocation || 'Zone Storage',
      images: body.images || [],
      pricingType: body.pricingType || 'per_day',
    };

    const equipment = await createEquipment(equipmentData, createdBy);

    return NextResponse.json(
      {
        success: true,
        data: equipment,
        message: 'Equipment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
