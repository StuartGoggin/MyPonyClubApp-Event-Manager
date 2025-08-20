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

    // Try multiple search strategies in order of preference
    const searchStrategies = [];
    
    // Strategy 1: If we have an existing address, try it alone first
    if (existingAddress && existingAddress.trim()) {
      searchStrategies.push({
        query: existingAddress.trim(),
        description: 'existing address only'
      });
    }
    
    // Strategy 2: Club name with location context
    let baseClubQuery = clubName;
    if (!clubName.toLowerCase().includes('pony club')) {
      baseClubQuery += ' Pony Club';
    }
    searchStrategies.push({
      query: `${baseClubQuery} Victoria Australia`,
      description: 'club name with location'
    });
    
    // Strategy 3: Just the club name
    searchStrategies.push({
      query: baseClubQuery,
      description: 'club name only'
    });
    
    // Strategy 4: If we have address, try address + club name (simplified)
    if (existingAddress && existingAddress.trim()) {
      // Extract just the street address part (before any club name repetition)
      const addressParts = existingAddress.split(',');
      const streetAddress = addressParts[0]?.trim();
      if (streetAddress) {
        searchStrategies.push({
          query: `${streetAddress}, Victoria Australia`,
          description: 'street address with location'
        });
      }
    }

    // Try each strategy until we find results
    for (const strategy of searchStrategies) {
      console.log(`Trying strategy: ${strategy.description} - "${strategy.query}"`);
      
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(strategy.query)}&key=${googleMapsApiKey}`;
      
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();

      if (placesData.status === 'OK' && placesData.results && placesData.results.length > 0) {
        console.log(`Success with strategy: ${strategy.description}`);
        return NextResponse.json(processPlaceResult(clubId, clubName, strategy.query, placesData.results[0]));
      } else {
        console.log(`No results for strategy: ${strategy.description}`);
      }
    }
    
    // If all strategies failed
    return NextResponse.json({
      clubId,
      clubName,
      searchQuery: searchStrategies[0]?.query || clubName,
      status: 'not_found'
    } as GeolocationResult);

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
