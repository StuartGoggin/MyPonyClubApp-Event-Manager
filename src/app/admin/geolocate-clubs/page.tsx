'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Play, Pause, SkipForward, Check, X, Globe, Building, Map } from "lucide-react";
import { Club, Zone } from "@/lib/types";
import GoogleMapComponent from "@/components/GoogleMap";

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
  error?: string;
}

export default function GeolocateClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedClub, setSelectedClub] = useState<string>('all-clubs');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [currentResult, setCurrentResult] = useState<GeolocationResult | null>(null);
  const [results, setResults] = useState<GeolocationResult[]>([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editableAddress, setEditableAddress] = useState('');
  const [editableLatitude, setEditableLatitude] = useState('');
  const [editableLongitude, setEditableLongitude] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);

  // Load clubs and zones
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clubsRes, zonesRes] = await Promise.all([
          fetch('/api/clubs'),
          fetch('/api/zones')
        ]);
        
        if (clubsRes.ok && zonesRes.ok) {
          const clubsData = await clubsRes.json();
          const zonesData = await zonesRes.json();
          setClubs(clubsData);
          setZones(zonesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Get filtered clubs based on selection
  const getFilteredClubs = () => {
    if (selectedClub && selectedClub !== 'all-clubs') {
      return clubs.filter(club => club.id === selectedClub);
    }
    if (selectedZone === 'all') {
      return clubs;
    }
    return clubs.filter(club => club.zoneId === selectedZone);
  };

  // Start geolocation process
  const startGeolocation = async () => {
    const filteredClubs = getFilteredClubs();
    console.log(`🚀 Starting geolocation for ${filteredClubs.length} clubs`);
    console.log('📋 Clubs to process:', filteredClubs.map(c => c.name));
    
    setTotalCount(filteredClubs.length);
    setProcessedCount(0);
    setResults([]);
    setIsProcessing(true);
    setIsPaused(false);

    for (let i = 0; i < filteredClubs.length; i++) {
      if (isPaused) {
        console.log('⏸️ Processing paused by user');
        break;
      }
      
      const club = filteredClubs[i];
      console.log(`\n🏇 Processing club ${i + 1}/${filteredClubs.length}: ${club.name} (ID: ${club.id})`);
      console.log(`📍 Existing address: ${club.physicalAddress || club.address?.street || 'None'}`);
      
      setCurrentClub(club);
      
      try {
        console.log('📡 Calling geolocation API...');
        
        // Call geolocation API
        const requestBody = { 
          clubId: club.id,
          clubName: club.name,
          existingAddress: club.physicalAddress || club.address?.street
        };
        console.log('📤 Request body:', requestBody);
        
        const response = await fetch('/api/admin/geolocate-club', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });

        console.log(`📥 API Response status: ${response.status}`);

        if (response.ok) {
          const result: GeolocationResult = await response.json();
          console.log('✅ API Response data:', JSON.stringify(result, null, 2));
          console.log('🔍 Response status:', result.status);
          console.log('🔍 Search query used:', result.searchQuery);
          if (result.error) {
            console.log('❌ Error in response:', result.error);
          }
          setCurrentResult(result);
          
          if (result.status === 'found') {
            console.log(`🎯 Found location for ${club.name}:`, {
              lat: result.latitude,
              lng: result.longitude,
              address: result.formattedAddress || result.address
            });
            
            setEditableAddress(result.formattedAddress || result.address || '');
            setEditableLatitude(result.latitude?.toString() || '');
            setEditableLongitude(result.longitude?.toString() || '');
            setShowMapModal(true);
            
            // Wait for user decision
            console.log('⏳ Waiting for user decision...');
            await new Promise(resolve => {
              const checkDecision = () => {
                if (currentResult?.status === 'accepted' || currentResult?.status === 'skipped') {
                  console.log(`👤 User decision: ${currentResult.status}`);
                  resolve(true);
                } else {
                  setTimeout(checkDecision, 100);
                }
              };
              checkDecision();
            });
          } else {
            // Auto-skip if not found
            console.log(`⏭️ Auto-skipping ${club.name} - Status: ${result.status}`);
            const skippedResult = { ...result, status: 'skipped' as const };
            setResults(prev => [...prev, skippedResult]);
          }
        } else {
          console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
          const responseText = await response.text();
          console.error('❌ Response body:', responseText);
          
          const errorResult: GeolocationResult = {
            clubId: club.id,
            clubName: club.name,
            searchQuery: club.name,
            status: 'not_found'
          };
          setResults(prev => [...prev, errorResult]);
        }
      } catch (error) {
        console.error(`💥 Geolocation error for club: ${club.name}`, error);
        const errorResult: GeolocationResult = {
          clubId: club.id,
          clubName: club.name,
          searchQuery: club.name,
          status: 'not_found'
        };
        setResults(prev => [...prev, errorResult]);
      }
      
      setProcessedCount(i + 1);
      console.log(`✅ Completed processing ${club.name} (${i + 1}/${filteredClubs.length})`);
    }

    console.log('🏁 Geolocation processing completed');
    console.log('📊 Final results:', results);
    setIsProcessing(false);
    setCurrentClub(null);
    setCurrentResult(null);
  };

  // Accept current location
  const acceptLocation = async () => {
    if (!currentResult) return;

    const finalResult = {
      ...currentResult,
      latitude: parseFloat(editableLatitude),
      longitude: parseFloat(editableLongitude),
      formattedAddress: editableAddress,
      status: 'accepted' as const
    };

    try {
      // Save to database
      await fetch('/api/admin/update-club-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId: currentResult.clubId,
          latitude: finalResult.latitude,
          longitude: finalResult.longitude,
          address: finalResult.formattedAddress
        })
      });

      setResults(prev => [...prev, finalResult]);
    } catch (error) {
      console.error('Error saving location:', error);
    }

    setShowMapModal(false);
    setCurrentResult({ ...currentResult, status: 'accepted' });
  };

  // Skip current location
  const skipLocation = () => {
    if (!currentResult) return;

    const skippedResult = { ...currentResult, status: 'skipped' as const };
    setResults(prev => [...prev, skippedResult]);
    setShowMapModal(false);
    setCurrentResult(skippedResult);
  };

  // Pause/Resume processing
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Stop processing
  const stopProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentClub(null);
    setCurrentResult(null);
    setShowMapModal(false);
  };

  const getZoneName = (zoneId: string) => {
    return zones.find(z => z.id === zoneId)?.name || 'Unknown Zone';
  };

  const getClubName = (clubId: string) => {
    return clubs.find(c => c.id === clubId)?.name || 'Unknown Club';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/20 p-2">
          <Map className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Club Geolocation</h1>
          <p className="text-muted-foreground">Use Google Maps to find and set club locations</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Geolocation Settings</CardTitle>
          <CardDescription>
            Select clubs to geolocate and set their coordinates and addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone-select">Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones ({clubs.length} clubs)</SelectItem>
                  {zones.map(zone => {
                    const clubCount = clubs.filter(c => c.zoneId === zone.id).length;
                    return (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name} ({clubCount} clubs)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="club-select">Single Club (Optional)</Label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a specific club or leave blank for all" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-clubs">All clubs in selected zone</SelectItem>
                  {getFilteredClubs()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(club => (
                      <SelectItem key={club.id} value={club.id}>
                        {club.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            {!isProcessing ? (
              <>
                <Button onClick={startGeolocation} disabled={getFilteredClubs().length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  Start Geolocation ({getFilteredClubs().length} clubs)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    console.log('🔧 Testing API connection...');
                    try {
                      const response = await fetch('/api/admin/debug-env');
                      const envInfo = await response.json();
                      console.log('🔧 Environment info:', envInfo);
                      
                      // Test with a sample club
                      const testClub = clubs[0];
                      if (testClub) {
                        console.log('🧪 Testing geolocation API with sample club:', testClub.name);
                        const testResponse = await fetch('/api/admin/geolocate-club', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            clubId: testClub.id,
                            clubName: testClub.name,
                            existingAddress: testClub.physicalAddress || testClub.address?.street
                          })
                        });
                        console.log('🧪 Test response status:', testResponse.status);
                        const testResult = await testResponse.json();
                        console.log('🧪 Test response data:', testResult);
                      }
                    } catch (error) {
                      console.error('🔧 Debug test failed:', error);
                    }
                  }}
                >
                  🔧 Test API
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={togglePause}>
                  {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button variant="destructive" onClick={stopProcessing}>
                  <X className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {processedCount} / {totalCount}</span>
                <span>{Math.round((processedCount / totalCount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(processedCount / totalCount) * 100}%` }}
                />
              </div>
              {currentClub && (
                <p className="text-sm text-muted-foreground">
                  Currently processing: {currentClub.name} ({getZoneName(currentClub.zoneId)})
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geolocation Results</CardTitle>
            <CardDescription>
              Summary of processed clubs and their geolocation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-primary/20 p-1">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{result.clubName}</p>
                      <p className="text-sm text-muted-foreground">
                        {getZoneName(clubs.find(c => c.id === result.clubId)?.zoneId || '')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.latitude && result.longitude && (
                      <Badge variant="outline" className="text-xs">
                        {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                      </Badge>
                    )}
                    <Badge 
                      variant={
                        result.status === 'accepted' ? 'default' :
                        result.status === 'skipped' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {result.status === 'accepted' ? <Check className="h-3 w-3 mr-1" /> :
                       result.status === 'skipped' ? <SkipForward className="h-3 w-3 mr-1" /> :
                       <X className="h-3 w-3 mr-1" />}
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Modal */}
      <Dialog open={showMapModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Confirm Location for {currentClub?.name}
            </DialogTitle>
            <DialogDescription>
              Review the found location and coordinates. You can edit the address and coordinates if needed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={editableAddress}
                  onChange={(e) => setEditableAddress(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={editableLatitude}
                    onChange={(e) => setEditableLatitude(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={editableLongitude}
                    onChange={(e) => setEditableLongitude(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Google Maps Component */}
            <GoogleMapComponent
              latitude={parseFloat(editableLatitude) || undefined}
              longitude={parseFloat(editableLongitude) || undefined}
              clubName={currentClub?.name}
              onLocationChange={(lat, lng, address) => {
                setEditableLatitude(lat.toString());
                setEditableLongitude(lng.toString());
                if (address) {
                  setEditableAddress(address);
                }
              }}
              className="h-64"
            />

            {mapError && (
              <Alert>
                <AlertDescription>{mapError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={skipLocation}>
                <SkipForward className="h-4 w-4 mr-2" />
                Skip This Club
              </Button>
              <Button 
                onClick={acceptLocation}
                disabled={!editableLatitude || !editableLongitude}
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
