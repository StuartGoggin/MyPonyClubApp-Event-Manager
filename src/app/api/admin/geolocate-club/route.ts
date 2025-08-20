import { NextRequest, NextResponse } from 'next/server';

interface GeolocationRequest {
  clubId: string;
  clubName: string;
  existingAddress?: string;
}

interface GeolocationResult {
  clubId: string;
  clubName: string;
  searchQuery: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  formattedAddress?: string;
  placeId?: string;
  confidence?: number;
  status: 'pending' | 'found' | 'not_found' | 'accepted' | 'skipped';
}

export async function POST(request: NextRequest) {
  try {
    const { clubId, clubName, existingAddress }: GeolocationRequest = await request.json();

    // Check if Google Maps API key is available
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
      console.warn('Google Maps API key not configured');
      return NextResponse.json({
        clubId,
        clubName,
        searchQuery: clubName,
        status: 'not_found',
        error: 'Google Maps API key not configured'
      } as GeolocationResult);
    }

    // Construct search query
    let searchQuery = clubName;
    
    // Add "Pony Club" if not already in the name
    if (!clubName.toLowerCase().includes('pony club')) {
      searchQuery += ' Pony Club';
    }
    
    // Add location context for Victoria, Australia
    searchQuery += ' Victoria Australia';
    
    // If we have an existing address, try that first
    if (existingAddress) {
      searchQuery = `${existingAddress} ${clubName} Pony Club Victoria Australia`;
    }

    console.log(`Searching for: ${searchQuery}`);

    // Call Google Places API (Text Search)
    const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleMapsApiKey}`;
    
    const placesResponse = await fetch(placesUrl);
    const placesData = await placesResponse.json();

    if (placesData.status !== 'OK' || !placesData.results || placesData.results.length === 0) {
      console.log(`No results found for: ${searchQuery}`);
      
      // Try a simpler search without existing address
      if (existingAddress) {
        const simpleQuery = `${clubName} Pony Club Victoria Australia`;
        console.log(`Trying simpler search: ${simpleQuery}`);
        
        const simpleUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(simpleQuery)}&key=${googleMapsApiKey}`;
        const simpleResponse = await fetch(simpleUrl);
        const simpleData = await simpleResponse.json();
        
        if (simpleData.status === 'OK' && simpleData.results && simpleData.results.length > 0) {
          return NextResponse.json(processPlaceResult(clubId, clubName, simpleQuery, simpleData.results[0]));
        }
      }
      
      return NextResponse.json({
        clubId,
        clubName,
        searchQuery,
        status: 'not_found'
      } as GeolocationResult);
    }

    // Process the first result
    const place = placesData.results[0];
    return NextResponse.json(processPlaceResult(clubId, clubName, searchQuery, place));

  } catch (error) {
    console.error('Geolocation API error:', error);
    return NextResponse.json(
      { error: 'Failed to geolocate club' },
      { status: 500 }
    );
  }
}

function processPlaceResult(clubId: string, clubName: string, searchQuery: string, place: any): GeolocationResult {
  const result: GeolocationResult = {
    clubId,
    clubName,
    searchQuery,
    status: 'found'
  };

  // Extract coordinates
  if (place.geometry && place.geometry.location) {
    result.latitude = place.geometry.location.lat;
    result.longitude = place.geometry.location.lng;
  }

  // Extract address
  if (place.formatted_address) {
    result.formattedAddress = place.formatted_address;
    result.address = place.formatted_address;
  }

  // Extract place ID
  if (place.place_id) {
    result.placeId = place.place_id;
  }

  // Calculate confidence based on name similarity and type
  let confidence = 0;
  
  // Name similarity check
  const placeName = place.name?.toLowerCase() || '';
  const searchName = clubName.toLowerCase();
  
  if (placeName.includes(searchName) || searchName.includes(placeName)) {
    confidence += 40;
  }
  
  if (placeName.includes('pony club')) {
    confidence += 30;
  }
  
  // Check place types for relevant categories
  const placeTypes = place.types || [];
  if (placeTypes.includes('establishment') || placeTypes.includes('point_of_interest')) {
    confidence += 20;
  }
  
  // Location in Victoria, Australia
  if (place.formatted_address?.includes('VIC') || place.formatted_address?.includes('Victoria')) {
    confidence += 10;
  }

  result.confidence = Math.min(confidence, 100);

  console.log(`Found location for ${clubName}: ${result.formattedAddress} (confidence: ${result.confidence}%)`);

  return result;
}
