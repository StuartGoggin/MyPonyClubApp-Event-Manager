import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';

// PATCH: Update user role
export async function PATCH(request: NextRequest) {
  try {
    const { userId, role } = await request.json();
    
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      );
    }
    
    // Validate role
    const validRoles = ['standard', 'zone_rep', 'super_user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: standard, zone_rep, super_user' },
        { status: 400 }
      );
    }
    
    const updatedUser = await UserService.updateUser(userId, { role });
    
    return NextResponse.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update user role',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
