'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommitteeNominationForm } from '@/components/forms/committee-nomination-form';
import { CheckCircle, Info } from 'lucide-react';

interface NominateCommitteeFormProps {
  clubs: any[];
  zones: any[];
}

export function NominateCommitteeForm({ clubs, zones }: NominateCommitteeFormProps) {
  const [submitted, setSubmitted] = useState(false);

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
              onClick={() => setSubmitted(false)}
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
    <CommitteeNominationForm
      clubId=""
      clubName=""
      zoneId=""
      zoneName=""
      onSubmitSuccess={handleSubmitSuccess}
    />
  );
}
