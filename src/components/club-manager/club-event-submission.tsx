'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, CheckCircle, History } from 'lucide-react';
import { EventType } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ClubEventSubmissionProps {
  clubId: string;
  clubName: string;
  zoneName: string;
  eventTypes: EventType[];
  onEventSubmitted: () => void;
}

export function ClubEventSubmission({ 
  clubId, 
  clubName, 
  zoneName, 
  eventTypes, 
  onEventSubmitted 
}: ClubEventSubmissionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: undefined as Date | undefined,
    eventTypeId: '',
    location: '',
    coordinatorName: '',
    coordinatorContact: '',
    isQualifier: false,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.eventTypeId || !formData.coordinatorName) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        ...formData,
        clubId,
        status: 'proposed',
        source: 'zone',
        submittedBy: formData.coordinatorName,
        submittedByContact: formData.coordinatorContact
      };

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        // Show immediate success feedback
        toast({
          title: 'Event Submitted Successfully!',
          description: 'Your event request has been saved and submitted for approval.',
          variant: 'default',
        });
        
        setShowSuccess(true);
        setFormData({
          name: '',
          date: undefined,
          eventTypeId: '',
          location: '',
          coordinatorName: '',
          coordinatorContact: '',
          isQualifier: false,
          notes: ''
        });
        onEventSubmitted();
        
        // Hide success message after 8 seconds (longer for more detailed message)
        setTimeout(() => setShowSuccess(false), 8000);
      } else {
        throw new Error('Failed to submit event');
      }
    } catch (error) {
      console.error('Error submitting event:', error);
      alert('Failed to submit event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="space-y-6">
        {/* Success Confirmation Card */}
        <Card className="enhanced-card border-green-200 bg-green-50 glass-effect">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Event Successfully Submitted!
            </h3>
            <p className="text-green-700 mb-6 max-w-md mx-auto">
              Your event request has been submitted to {zoneName} for approval.
              The event data has been securely saved and zone managers have been notified.
            </p>
            
            {/* Confirmation Details */}
            <div className="bg-white/70 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
              <h4 className="font-medium text-green-800 mb-2">What happens next:</h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Event data saved successfully</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Zone managers notified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>You'll receive status updates</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowSuccess(false)}
                className="distinctive-button-primary bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white font-bold px-6 py-3 rounded-xl border-2 border-emerald-400/50 hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Submit Another Event
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSuccess(false);
                  // Switch to Event Status tab (this would require a callback)
                }}
                className="distinctive-button-secondary bg-gradient-to-r from-teal-50 via-teal-100 to-cyan-100 hover:from-teal-100 hover:via-teal-200 hover:to-cyan-200 border-2 border-teal-300/70 hover:border-teal-400 text-teal-800 hover:text-teal-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                View Event Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Process Timeline */}
        <Card className="enhanced-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Submission Timeline
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-medium">✓</div>
                <div className="flex-1">
                  <div className="font-medium text-green-600">Event Submitted</div>
                  <div className="text-sm text-muted-foreground">Just now - Data saved successfully</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-medium">2</div>
                <div className="flex-1">
                  <div className="font-medium">Zone Review</div>
                  <div className="text-sm text-muted-foreground">Pending - {zoneName} will review your request</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-medium">3</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-400">Decision</div>
                  <div className="text-sm text-muted-foreground">You'll be notified of approval or feedback</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="enhanced-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Submit New Event Request
            </span>
          </CardTitle>
          <CardDescription>
            Submit an event request for {clubName} to {zoneName} for approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter event name..."
                  className="enhanced-select"
                  required
                />
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select 
                  value={formData.eventTypeId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, eventTypeId: value }))}
                >
                  <SelectTrigger className="enhanced-select">
                    <SelectValue placeholder="Select event type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Input
                  type="date"
                  value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      setFormData(prev => ({ ...prev, date: new Date(e.target.value) }));
                    } else {
                      setFormData(prev => ({ ...prev, date: undefined }));
                    }
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="distinctive-button-input w-full h-10 bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 border-2 border-gray-300/70 hover:border-gray-400 text-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location (if different from club)"
                />
              </div>
            </div>

            {/* Coordinator Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Event Coordinator</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="coordinatorName">Coordinator Name *</Label>
                  <Input
                    id="coordinatorName"
                    value={formData.coordinatorName}
                    onChange={(e) => setFormData(prev => ({ ...prev, coordinatorName: e.target.value }))}
                    placeholder="Event coordinator name..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coordinatorContact">Coordinator Contact *</Label>
                  <Input
                    id="coordinatorContact"
                    value={formData.coordinatorContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, coordinatorContact: e.target.value }))}
                    placeholder="Email or phone number..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Additional Information</h3>
              
              {/* Qualifier Event */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isQualifier"
                  checked={formData.isQualifier}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isQualifier: !!checked }))}
                />
                <Label htmlFor="isQualifier" className="text-sm font-medium leading-none">
                  This is a qualifier event
                </Label>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional information about the event..."
                  rows={4}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="distinctive-button-submit min-w-[160px] px-8 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl border-2 border-blue-400/50 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Event Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <div className="font-medium">Submit Request</div>
                <div className="text-muted-foreground">Fill out the event details and submit for approval</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <div className="font-medium">Zone Review</div>
                <div className="text-muted-foreground">{zoneName} will review your event request</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <div className="font-medium">Notification</div>
                <div className="text-muted-foreground">You'll be notified of the approval or rejection status</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
