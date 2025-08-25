'use client';

import { useState, useEffect } from 'react';
import { EventRequestForm } from '@/components/event-request-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmbedRequestEventPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState<any>(null);

  const handleFormSubmit = (data: any) => {
    setSubmissionData(data);
    setIsSubmitted(true);
  };

  const handleNewRequest = () => {
    setIsSubmitted(false);
    setSubmissionData(null);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">Event Request Submitted Successfully!</CardTitle>
              <CardDescription className="text-lg">
                Thank you for submitting your event request. We'll review it and get back to you soon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Request ID:</strong> {submissionData?.id || 'Generated automatically'}
                  <br />
                  <strong>Event:</strong> {submissionData?.eventName}
                  <br />
                  <strong>Date:</strong> {submissionData?.eventDate}
                  <br />
                  <strong>Club:</strong> {submissionData?.clubName}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">What happens next?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Your zone coordinator will review the request
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    They'll check for date conflicts with other events
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    You'll receive an email with the approval decision
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    Approved events will appear on the public calendar
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleNewRequest} className="flex-1">
                  Submit Another Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open('/embed/calendar', '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Calendar
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 border-t pt-4">
                Powered by PonyClub Events Manager
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Request an Event Date</CardTitle>
            <CardDescription className="text-center">
              Submit your pony club event request for zone coordinator approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventRequestForm 
              embedMode={true}
              onSubmit={handleFormSubmit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
