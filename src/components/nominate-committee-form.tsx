'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommitteeNominationForm } from '@/components/forms/committee-nomination-form';
import { Building, MapPin, CheckCircle, Info } from 'lucide-react';
import { Club, Zone } from '@/lib/types';

interface NominateCommitteeFormProps {
  clubs: Club[];
  zones: Zone[];
}

export function NominateCommitteeForm({ clubs, zones }: NominateCommitteeFormProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);

  const selectedClub = useMemo(() => 
    clubs.find(club => club.id === selectedClubId),
    [clubs, selectedClubId]
  );

  const selectedZone = useMemo(() => 
    zones.find(zone => zone.id === selectedClub?.zoneId),
    [zones, selectedClub]
  );

  const handleSubmitSuccess = () => {
    setSubmitted(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <Card className="border-l-4 border-l-green-500 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            Committee Nomination Submitted Successfully!
          </CardTitle>
          <CardDescription>
            Your nomination has been submitted and is awaiting approval from your Zone Representative.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens next?</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Your Zone Representative will review the nomination</li>
                <li>They will approve or request changes to the District Commissioner nomination</li>
                <li>You will be notified via email once a decision is made</li>
                <li>You can edit or withdraw the nomination if needed before approval</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setSelectedClubId('');
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Another Nomination
            </button>
            <Link
              href="/"
              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-center"
            >
              Return to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Club Selection Card */}
      {!selectedClubId ? (
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Select Your Pony Club
            </CardTitle>
            <CardDescription>
              Choose your club to begin the committee nomination process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="club-select">Pony Club</Label>
                <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                  <SelectTrigger id="club-select" className="h-12">
                    <SelectValue placeholder="Choose your pony club..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {clubs
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(club => {
                        const zone = zones.find(z => z.id === club.zoneId);
                        return (
                          <SelectItem key={club.id} value={club.id}>
                            <div className="flex items-center gap-3">
                              <Building className="h-4 w-4 text-primary" />
                              <div>
                                <div className="font-semibold">{club.name}</div>
                                {zone && (
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {zone.name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Before you begin:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Ensure you have held your Annual General Meeting</li>
                    <li>Have committee member details ready (names, Pony Club IDs, contact information)</li>
                    <li>The District Commissioner nomination must be approved by your Zone Representative</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Selected Club Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 border-2 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-lg">{selectedClub?.name}</p>
                    {selectedZone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedZone.name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClubId('')}
                  className="px-4 py-2 text-sm bg-white dark:bg-slate-700 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                >
                  Change Club
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Committee Nomination Form */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Committee Nomination Form</CardTitle>
              <CardDescription>
                Fill in the details of your committee members elected at the AGM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClub && (
                <CommitteeNominationForm
                  clubId={selectedClub.id}
                  clubName={selectedClub.name}
                  zoneId={selectedClub.zoneId}
                  zoneName={selectedZone?.name || ''}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
