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

    console.log(`🗺️ Geolocation request for: ${clubName} (ID: ${clubId})`);
    console.log(`📍 Existing address: ${existingAddress || 'None'}`);

    // Check if Google Maps API key is available
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
      console.error('❌ Google Maps API key not configured');
      return NextResponse.json({
        clubId,
        clubName,
        searchQuery: clubName,
        status: 'not_found',
        error: 'Google Maps API key not configured'
      } as GeolocationResult);
    }

    console.log('✅ Google Maps API key is configured');

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
    console.log(`🔍 Prepared ${searchStrategies.length} search strategies:`);
    searchStrategies.forEach((strategy, index) => {
      console.log(`  ${index + 1}. ${strategy.description}: "${strategy.query}"`);
    });

    for (const strategy of searchStrategies) {
      console.log(`🔄 Trying strategy: ${strategy.description} - "${strategy.query}"`);
      
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(strategy.query)}&key=${googleMapsApiKey}`;
      
      try {
        const placesResponse = await fetch(placesUrl);
        console.log(`📡 API Response status: ${placesResponse.status}`);
        
        if (!placesResponse.ok) {
          console.error(`❌ API request failed: ${placesResponse.status} ${placesResponse.statusText}`);
          continue;
        }
        const placesData = await placesResponse.json();
        console.log(`📋 API Response:`, {
          status: placesData.status,
          resultCount: placesData.results?.length || 0,
          errorMessage: placesData.error_message
        });

        if (placesData.status === 'OK' && placesData.results && placesData.results.length > 0) {
          console.log(`✅ Success with strategy: ${strategy.description}`);
          console.log(`🏆 Found result:`, {
            name: placesData.results[0].name,
            address: placesData.results[0].formatted_address,
            types: placesData.results[0].types
          });
          return NextResponse.json(processPlaceResult(clubId, clubName, strategy.query, placesData.results[0]));
        } else {
          console.log(`❌ No results for strategy: ${strategy.description}`);
          if (placesData.status !== 'OK') {
            console.error(`🚫 API error: ${placesData.status} - ${placesData.error_message || 'Unknown error'}`);
          }
        }
      } catch (fetchError) {
        console.error(`🔥 Fetch error for strategy ${strategy.description}:`, fetchError);
        continue;
      }
    }
    
    // If Places API failed but we have an address, try Geocoding API as final fallback
    if (existingAddress && existingAddress.trim()) {
      console.log(`🗺️ Trying Geocoding API fallback with existing address: "${existingAddress}"`);
      
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(existingAddress)}&region=au&key=${googleMapsApiKey}`;
      
      try {
        const geocodingResponse = await fetch(geocodingUrl);
        console.log(`📍 Geocoding API Response status: ${geocodingResponse.status}`);
        
        if (geocodingResponse.ok) {
          const geocodingData = await geocodingResponse.json();
          console.log(`📍 Geocoding API Response:`, {
            status: geocodingData.status,
            resultCount: geocodingData.results?.length || 0,
            errorMessage: geocodingData.error_message
          });

          if (geocodingData.status === 'OK' && geocodingData.results && geocodingData.results.length > 0) {
            const result = geocodingData.results[0];
            const location = result.geometry?.location;
            
            if (location && location.lat && location.lng) {
              console.log(`🎯 Geocoding success! Found coordinates: ${location.lat}, ${location.lng}`);
              
              return NextResponse.json({
                clubId,
                clubName,
                searchQuery: `Geocoding: ${existingAddress}`,
                latitude: location.lat,
                longitude: location.lng,
                address: existingAddress,
                formattedAddress: result.formatted_address || existingAddress,
                confidence: 0.8, // High confidence for geocoding with existing address
                status: 'found'
              } as GeolocationResult);
            }
          } else if (geocodingData.status !== 'OK') {
            console.error(`🚫 Geocoding API error: ${geocodingData.status} - ${geocodingData.error_message || 'Unknown error'}`);
          }
        }
      } catch (geocodingError) {
        console.error(`🔥 Geocoding API fetch error:`, geocodingError);
      }
    }
    
    // If all strategies failed
    console.log(`💔 All ${searchStrategies.length} search strategies failed for ${clubName}`);
    return NextResponse.json({
      clubId,
      clubName,
      searchQuery: searchStrategies[0]?.query || clubName,
      status: 'not_found',
      error: 'No location found with any search strategy'
    } as GeolocationResult);

  } catch (error) {
    console.error(`🚨 Geolocation API error for ${request.url}:`, error);
    return NextResponse.json(
      { error: 'Failed to geolocate club', details: error instanceof Error ? error.message : 'Unknown error' },
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
