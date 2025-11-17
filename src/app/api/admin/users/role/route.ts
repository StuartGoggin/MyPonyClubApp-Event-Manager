import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';

// PATCH: Update user roles
export async function PATCH(request: NextRequest) {
  try {
    const { userId, roles } = await request.json();
    
    if (!userId || !roles) {
      return NextResponse.json(
        { error: 'User ID and roles are required' },
        { status: 400 }
      );
    }

    // Ensure roles is an array
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    // Validate roles
    const validRoles = ['standard', 'club_manager', 'zone_rep', 'state_admin', 'super_user'];
    const invalidRoles = rolesArray.filter((role: string) => !validRoles.includes(role));
    
    if (invalidRoles.length > 0) {
      return NextResponse.json(
        { 
          error: `Invalid roles: ${invalidRoles.join(', ')}. Must be one of: ${validRoles.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Ensure at least one role is assigned
    if (rolesArray.length === 0) {
      return NextResponse.json(
        { error: 'At least one role must be assigned' },
        { status: 400 }
      );
    }
    
    // Update with both roles array and legacy role field (highest privilege)
    const primaryRole = rolesArray.includes('super_user') ? 'super_user' :
                       rolesArray.includes('state_admin') ? 'state_admin' :
                       rolesArray.includes('zone_rep') ? 'zone_rep' :
                       rolesArray.includes('club_manager') ? 'club_manager' : 'standard';
    
    const updatedUser = await UserService.updateUser(userId, { 
      roles: rolesArray,
      role: primaryRole // Keep legacy field for backwards compatibility
    });
    
    return NextResponse.json({
      success: true,
      message: 'User roles updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user roles error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update user roles',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
