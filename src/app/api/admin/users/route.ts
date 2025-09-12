import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';
import { validateUser, validateLoginCredentials } from '@/lib/user-validation';

// GET: Retrieve users with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const options = {
      clubId: searchParams.get('clubId') || undefined,
      zoneId: searchParams.get('zoneId') || undefined,
      role: searchParams.get('role') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    };
    
    const users = await UserService.getUsers(options);
    
    return NextResponse.json({
      success: true,
      users,
      count: users.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validate user data (excluding ID and timestamps)
    const { id, createdAt, updatedAt, ...userDataToValidate } = userData;
    
    // Check if Pony Club ID already exists
    const exists = await UserService.ponyClubIdExists(userData.ponyClubId);
    if (exists) {
      return NextResponse.json(
        { error: `Pony Club ID ${userData.ponyClubId} already exists` },
        { status: 400 }
      );
    }
    
    const newUser = await UserService.createUser(userDataToValidate);
    
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT: Update a user
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const updateData = await request.json();
    
    // If updating Pony Club ID, check for conflicts
    if (updateData.ponyClubId) {
      const exists = await UserService.ponyClubIdExists(updateData.ponyClubId, userId);
      if (exists) {
        return NextResponse.json(
          { error: `Pony Club ID ${updateData.ponyClubId} already exists` },
          { status: 400 }
        );
      }
    }
    
    const updatedUser = await UserService.updateUser(userId, updateData);
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    await UserService.deleteUser(userId);
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
