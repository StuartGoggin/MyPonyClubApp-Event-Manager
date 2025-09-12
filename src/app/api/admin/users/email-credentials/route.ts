import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';

// POST: Send credentials email to user
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get user details
    const user = await UserService.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if user has email address
    if (!user.email) {
      return NextResponse.json(
        { error: 'User does not have an email address on file' },
        { status: 400 }
      );
    }
    
    // Send credentials email
    await UserService.sendCredentialsEmail(user);
    
    return NextResponse.json({
      success: true,
      message: 'Credentials email sent successfully',
      recipient: user.email
    });
    
  } catch (error) {
    console.error('Send credentials email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send credentials email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
