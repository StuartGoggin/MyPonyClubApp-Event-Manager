import { NextResponse } from 'next/server';
import { callSeedData } from '@/lib/actions';

export async function POST() {
  try {
    console.log('🌱 Starting database seeding...');
    const result = await callSeedData();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Seeding API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to seed database',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to seed the database',
    method: 'POST'
  });
}
