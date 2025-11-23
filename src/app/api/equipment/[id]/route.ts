/**
 * Equipment Detail API Routes
 * GET /api/equipment/[id] - Get specific equipment
 * PUT /api/equipment/[id] - Update equipment
 * DELETE /api/equipment/[id] - Delete equipment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getEquipment,
  updateEquipment,
  deleteEquipment,
} from '@/lib/equipment-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/equipment/[id]
 * Get equipment by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const equipment = await getEquipment(id);

    if (!equipment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Equipment not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: equipment,
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
 * PUT /api/equipment/[id]
 * Update equipment
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    // TODO: Add authentication check for zone manager role

    // Check if equipment exists
    const existing = await getEquipment(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Equipment not found',
        },
        { status: 404 }
      );
    }

    // Update equipment
    await updateEquipment(id, body);

    // Fetch updated equipment
    const updated = await getEquipment(id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Equipment updated successfully',
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/equipment/[id]
 * Delete equipment
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // TODO: Add authentication check for zone manager role

    // Check if equipment exists
    const existing = await getEquipment(id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Equipment not found',
        },
        { status: 404 }
      );
    }

    await deleteEquipment(id);

    return NextResponse.json({
      success: true,
      message: 'Equipment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
