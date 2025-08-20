# Club Geolocation Feature

## Overview
A comprehensive admin tool for finding and setting geographic coordinates and addresses for pony clubs using Google Maps integration.

## Features

### 🎯 **Flexible Scope Selection**
- **All Zones**: Process all 172+ clubs across Victoria
- **Single Zone**: Focus on clubs within a specific zone
- **Single Club**: Test or update individual clubs

### 🗺️ **Google Maps Integration**
- **Intelligent Search**: Automatically searches for clubs using name + "Pony Club" + location context
- **Interactive Map**: Full Google Maps display with draggable markers
- **Address Validation**: Reverse geocoding to get formatted addresses
- **Manual Override**: Edit coordinates and addresses directly

### ⚡ **Iterative Processing**
- **Progress Tracking**: Real-time progress bar and counters
- **Pause/Resume**: Stop processing and continue later
- **User Decisions**: Review each location before accepting
- **Skip Option**: Skip clubs that can't be found or are incorrect

### 📊 **Smart Results**
- **Confidence Scoring**: Algorithm rates location accuracy
- **Status Tracking**: Accepted, Skipped, Not Found statuses
- **Batch Operations**: Process multiple clubs efficiently
- **Data Persistence**: Automatically saves to Firebase

## User Workflow

1. **Setup Selection**
   - Choose scope (All Zones / Single Zone / Single Club)
   - View filtered club count
   - Start geolocation process

2. **Automatic Processing**
   - App searches Google Maps for each club
   - Finds best location match using intelligent queries
   - Shows progress and current club being processed

3. **Manual Review (when location found)**
   - Modal displays interactive Google Map
   - Shows found coordinates and address
   - User can:
     - **Accept**: Save location to database
     - **Edit**: Modify coordinates/address before saving
     - **Skip**: Move to next club without saving
     - **Drag marker**: Adjust location on map

4. **Results Summary**
   - View all processed clubs
   - See success/skip/failure rates
   - Review coordinates for each club

## Technical Architecture

### Frontend Components
- **`/admin/geolocate-clubs`**: Main geolocation interface
- **`GoogleMapComponent`**: Reusable Google Maps React component
- **Modal Interface**: Full-screen location review dialog

### Backend APIs
- **`/api/admin/geolocate-club`**: Google Places API integration
- **`/api/admin/update-club-location`**: Database updates

### Data Flow
1. Frontend requests geolocation for club
2. Backend searches Google Places API with intelligent queries:
   - `"[Club Name] Pony Club Victoria Australia"`
   - Fallback to simpler searches if needed
3. Returns coordinates, address, and confidence score
4. User reviews on interactive map
5. Confirmed data saved to Firestore

## Configuration

### Required Environment Variables
```env
# Server-side Google Maps API key
GOOGLE_MAPS_API_KEY=your_server_key_here

# Client-side Google Maps API key  
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_client_key_here
```

### Required Google Cloud APIs
- **Maps JavaScript API**: Map display
- **Places API**: Location search
- **Geocoding API**: Address conversion

### Database Updates
Updates Club documents in Firestore with:
- `latitude`: Geographic latitude
- `longitude`: Geographic longitude  
- `physicalAddress`: Formatted address string
- `updatedAt`: Timestamp

## Search Algorithm

The geolocation uses intelligent search strategies:

1. **Primary Search**: `"{Club Name} Pony Club Victoria Australia"`
2. **Address Enhancement**: If existing address available, include it
3. **Fallback Search**: Simpler query if primary fails
4. **Confidence Scoring**:
   - Name similarity: +40 points
   - Contains "pony club": +30 points
   - Establishment type: +20 points
   - Victoria location: +10 points

## Benefits

### For Administrators
- **Batch Processing**: Handle hundreds of clubs efficiently
- **Quality Control**: Review each location before saving
- **Flexible Scope**: Start small or go big
- **Resume Capability**: Pause and continue later

### For the Application
- **Enhanced Events**: Location-aware event planning
- **Mapping Features**: Display clubs on maps
- **Distance Calculations**: Find nearby clubs/events
- **Future Integrations**: Support for direction/navigation features

## Usage Tips

1. **Start Small**: Test with a single club first
2. **Review Carefully**: Check coordinates match expected location
3. **Use Map Tools**: Drag markers for precise positioning
4. **Save Progress**: Results are saved immediately when accepted
5. **API Limits**: Be mindful of Google Maps API quotas for large batches

## Access
Available in Admin Dashboard → Admin Tools → Club Geolocation

Requires admin access and configured Google Maps API keys.
