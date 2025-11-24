import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/user-service';
import { validateLoginCredentials } from '@/lib/user-validation';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
);

// POST: Authenticate user with Pony Club ID and mobile number
export async function POST(request: NextRequest) {
  try {
    const credentials = await request.json();
    
    // Validate credentials
    const validatedCredentials = validateLoginCredentials(credentials);
    
    // Authenticate user
    const user = await UserService.getUserByCredentials(
      validatedCredentials.ponyClubId,
      validatedCredentials.mobileNumber
    );
    
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          message: 'Pony Club ID and mobile number combination not found'
        },
        { status: 401 }
      );
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { 
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact an administrator.'
        },
        { status: 403 }
      );
    }
    
    // Generate JWT token
    const token = await new SignJWT({ 
      userId: user.id,
      ponyClubId: user.ponyClubId,
      role: user.role,
      clubId: user.clubId,
      zoneId: user.zoneId
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
    
    // Return user object (mobileNumber is included as user's own data)
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: user,
      token
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Invalid input',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Verify token and get current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Get current user data
    const user = await UserService.getUserById(payload.userId as string);
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Return user object (mobileNumber is included as user's own data)
    return NextResponse.json({
      success: true,
      user: user,
      tokenPayload: payload
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
