'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle, Info } from 'lucide-react';
import { EventType, Zone } from '@/lib/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ZoneEventSubmissionProps {
  zones: Zone[];
  eventTypes: EventType[];
  onEventSubmitted: () => void;
  defaultZoneId?: string; // Optional default zone to select
}

export function ZoneEventSubmission({ 
  zones,
  eventTypes, 
  onEventSubmitted,
  defaultZoneId
}: ZoneEventSubmissionProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    date: undefined as Date | undefined,
    eventTypeId: '',
    zoneId: defaultZoneId || '', // Initialize with default zone
    location: '',
    eventLink: '',
    coordinatorName: '',
    coordinatorContact: '',
    isQualifier: false,
    isHistoricallyTraditional: false,
    description: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date || !formData.eventTypeId || !formData.coordinatorName || !formData.zoneId) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required fields: Event Name, Date, Event Type, Zone, and Coordinator Name.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        name: formData.name,
        date: formData.date?.toISOString(), // Ensure date is properly formatted
        eventTypeId: formData.eventTypeId,
        zoneId: formData.zoneId,
        location: formData.location,
        eventLink: formData.eventLink,
        coordinatorName: formData.coordinatorName,
        coordinatorContact: formData.coordinatorContact,
        isQualifier: formData.isQualifier,
        isHistoricallyTraditional: formData.isHistoricallyTraditional,
        description: formData.description,
        notes: formData.notes,
        // For zone events, explicitly set clubId to null/undefined
        clubId: undefined,
        status: 'approved', // Zone events are auto-approved
        source: 'zone',
        submittedBy: formData.coordinatorName,
        submittedByContact: formData.coordinatorContact
      };

      console.log('Submitting zone event:', eventData);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        toast({
          title: 'Zone Event Created Successfully!',
          description: 'Your zone-level event has been created and is automatically approved.',
          variant: 'default',
        });
        
        setShowSuccess(true);
        setFormData({
          name: '',
          date: undefined,
          eventTypeId: '',
          zoneId: defaultZoneId || '', // Reset to default zone
          location: '',
          eventLink: '',
          coordinatorName: '',
          coordinatorContact: '',
          isQualifier: false,
          isHistoricallyTraditional: false,
          description: '',
          notes: ''
        });
        onEventSubmitted();
        
        setTimeout(() => setShowSuccess(false), 6000);
      } else {
        const errorText = responseData.error || 'Failed to create zone event';
        console.error('Failed to create event:', errorText, responseData);
        throw new Error(errorText);
      }
    } catch (error) {
      console.error('Error creating zone event:', error);
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to create zone event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    const selectedZone = zones.find(z => z.id === formData.zoneId);
    const zoneName = selectedZone?.name || 'the selected zone';
    
    return (
      <div className="space-y-6">
        <Card className="enhanced-card border-green-200 bg-green-50 glass-effect">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Zone Event Created Successfully!
            </h3>
            <p className="text-green-700 mb-6 max-w-md mx-auto">
              Your zone-level event for {zoneName} has been created and automatically approved.
              It will appear in the zone calendar immediately.
            </p>
            
            <div className="bg-white/70 rounded-lg p-4 mb-6 text-left max-w-sm mx-auto">
              <h4 className="font-medium text-green-800 mb-2">Event Status:</h4>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Event created and saved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Automatically approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Visible on zone calendar</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowSuccess(false)}
                className="distinctive-button-primary bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white font-bold px-6 py-3 rounded-xl border-2 border-emerald-400/50 hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Add Another Zone Event
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information Alert */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Zone-level events are <strong>automatically approved</strong> and do not require additional approval. 
          They will be visible immediately on the zone calendar and to all clubs in the selected zone.
        </AlertDescription>
      </Alert>

      <Card className="enhanced-card glass-effect border-2 border-border/40 shadow-xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter zone event name"
                className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm"
                required
              />
            </div>

            {/* Date and Event Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Date */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  Event Date <span className="text-red-500">*</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm hover:bg-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, 'PPP') : <span>Select date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-effect">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData({ ...formData, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Event Type */}
              <div className="space-y-2">
                <Label htmlFor="eventType" className="text-sm font-semibold flex items-center gap-2">
                  Event Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.eventTypeId}
                  onValueChange={(value) => setFormData({ ...formData, eventTypeId: value })}
                >
                  <SelectTrigger className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="glass-effect">
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Zone Selection */}
            <div className="space-y-2">
              <Label htmlFor="zone" className="text-sm font-semibold flex items-center gap-2">
                Zone <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.zoneId}
                onValueChange={(value) => setFormData({ ...formData, zoneId: value })}
              >
                <SelectTrigger className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent className="glass-effect">
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold">
                Event Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location (address, venue, etc.)"
                className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm"
              />
            </div>

            {/* Event Link */}
            <div className="space-y-2">
              <Label htmlFor="eventLink" className="text-sm font-semibold">
                Event Link (URL)
              </Label>
              <Input
                id="eventLink"
                type="url"
                value={formData.eventLink}
                onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
                placeholder="https://example.com/event"
                className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm"
              />
            </div>

            {/* Coordinator Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinatorName" className="text-sm font-semibold flex items-center gap-2">
                  Coordinator Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="coordinatorName"
                  value={formData.coordinatorName}
                  onChange={(e) => setFormData({ ...formData, coordinatorName: e.target.value })}
                  placeholder="Event coordinator name"
                  className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coordinatorContact" className="text-sm font-semibold">
                  Coordinator Contact
                </Label>
                <Input
                  id="coordinatorContact"
                  value={formData.coordinatorContact}
                  onChange={(e) => setFormData({ ...formData, coordinatorContact: e.target.value })}
                  placeholder="Email or phone number"
                  className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">
                Event Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about this zone event..."
                className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm min-h-[100px]"
              />
            </div>

            {/* Event Flags */}
            <div className="space-y-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-border/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isQualifier"
                  checked={formData.isQualifier}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isQualifier: checked as boolean })
                  }
                />
                <Label htmlFor="isQualifier" className="text-sm font-medium cursor-pointer">
                  This is a Zone Qualifier Event
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isHistoricallyTraditional"
                  checked={formData.isHistoricallyTraditional}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isHistoricallyTraditional: checked as boolean })
                  }
                />
                <Label htmlFor="isHistoricallyTraditional" className="text-sm font-medium cursor-pointer">
                  This is a Historically Traditional Event
                </Label>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information or special requirements..."
                className="enhanced-input bg-white/90 backdrop-blur-sm border border-border/50 shadow-sm"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-border/20">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="distinctive-button-primary bg-gradient-to-r from-primary via-primary/90 to-accent hover:from-primary/90 hover:via-primary hover:to-accent/90 text-white font-bold px-8 py-3 rounded-xl border-2 border-primary/50 hover:border-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Creating Zone Event...
                  </>
                ) : (
                  'Create Zone Event'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
