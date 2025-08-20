import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const envInfo = {
    nodeEnv: process.env.NODE_ENV,
    hasGoogleMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
    hasPublicGoogleMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    googleMapsKeyLength: process.env.GOOGLE_MAPS_API_KEY?.length || 0,
    publicGoogleMapsKeyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
    timestamp: new Date().toISOString()
  };

  console.log('🔧 Environment check:', envInfo);
  
  return NextResponse.json(envInfo);
}
