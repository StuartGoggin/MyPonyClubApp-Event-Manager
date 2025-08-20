'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapProps {
  latitude?: number;
  longitude?: number;
  clubName?: string;
  onLocationChange?: (lat: number, lng: number, address: string) => void;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function GoogleMapComponent({ 
  latitude, 
  longitude, 
  clubName, 
  onLocationChange,
  className = "w-full h-64"
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google) {
      setIsLoaded(true);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      setError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize map when Google Maps is loaded and we have coordinates
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !latitude || !longitude) return;

    try {
      const mapOptions = {
        center: { lat: latitude, lng: longitude },
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      const newGeocoder = new window.google.maps.Geocoder();
      
      setMap(newMap);
      setGeocoder(newGeocoder);

      // Create marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: newMap,
        title: clubName || 'Club Location',
        draggable: true
      });

      setMarker(newMarker);

      // Add click listener to map
      newMap.addListener('click', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        newMarker.setPosition({ lat, lng });
        
        // Reverse geocode to get address
        newGeocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            onLocationChange?.(lat, lng, results[0].formatted_address);
          } else {
            onLocationChange?.(lat, lng, '');
          }
        });
      });

      // Add drag listener to marker
      newMarker.addListener('dragend', (event: any) => {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        // Reverse geocode to get address
        newGeocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
          if (status === 'OK' && results[0]) {
            onLocationChange?.(lat, lng, results[0].formatted_address);
          } else {
            onLocationChange?.(lat, lng, '');
          }
        });
      });

    } catch (err) {
      console.error('Error initializing Google Maps:', err);
      setError('Failed to initialize map');
    }
  }, [isLoaded, latitude, longitude, clubName, onLocationChange]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (marker && latitude && longitude) {
      marker.setPosition({ lat: latitude, lng: longitude });
      if (map) {
        map.setCenter({ lat: latitude, lng: longitude });
      }
    }
  }, [marker, map, latitude, longitude]);

  if (error) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-600 font-medium">Map Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">📍</div>
          <p className="text-gray-500">No coordinates available</p>
          <p className="text-sm text-gray-400">Click "Accept Location" when coordinates are available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <p className="text-xs text-gray-500 mt-2 text-center">
        Click on the map or drag the marker to adjust the location
      </p>
    </div>
  );
}
