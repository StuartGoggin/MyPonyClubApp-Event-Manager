'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, AlertTriangle } from 'lucide-react';
import { Event, EventType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface InlineEditEventFormProps {
  event: Event;
  eventTypes: EventType[];
  onEventUpdated: () => void;
  onCancel: () => void;
}

export function InlineEditEventForm({ 
  event, 
  eventTypes, 
  onEventUpdated,
  onCancel
}: InlineEditEventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    eventTypeId: '',
    location: '',
    coordinatorName: '',
    coordinatorContact: '',
    isQualifier: false,
    notes: ''
  });

  // Track if date was changed for reapproval logic
  const [originalDate, setOriginalDate] = useState('');
  const [dateChanged, setDateChanged] = useState(false);

  // Initialize form data when component mounts
  useEffect(() => {
    if (event) {
      const eventDate = event.date instanceof Date 
        ? event.date.toISOString().split('T')[0]
        : new Date(event.date).toISOString().split('T')[0];
      
      setOriginalDate(eventDate);
      setFormData({
        name: event.name || '',
        date: eventDate,
        eventTypeId: event.eventTypeId || '',
        location: event.location || '',
        coordinatorName: event.coordinatorName || '',
        coordinatorContact: event.coordinatorContact || '',
        isQualifier: event.isQualifier || false,
        notes: event.notes || ''
      });
    }
  }, [event]);

  // Check if date was changed
  useEffect(() => {
    setDateChanged(formData.date !== originalDate);
  }, [formData.date, originalDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the update data
      const updateData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        // If date was changed and event was approved, set status back to proposed
        ...(dateChanged && event.status === 'approved' && { status: 'proposed' })
      };

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      toast({
        title: "Event Updated",
        description: dateChanged && event.status === 'approved' 
          ? "Event updated successfully. Since the date was changed, the event will need to be re-approved."
          : "Event updated successfully.",
      });

      onEventUpdated();
      onCancel(); // Close the inline form
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 rounded-lg border border-blue-200/60 shadow-inner">
      <div className="mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Edit Event Details
        </h3>
        <p className="text-sm text-muted-foreground">
          Make changes to your event information below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">Event Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="mt-1"
            />
          </div>

          {/* Event Date */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium">Event Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              className="mt-1"
            />
            {dateChanged && event.status === 'approved' && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Changing the date will require re-approval from zone administrators.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Event Type */}
          <div>
            <Label htmlFor="eventType" className="text-sm font-medium">Event Type</Label>
            <Select value={formData.eventTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, eventTypeId: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1"
              placeholder="Event location"
            />
          </div>

          {/* Coordinator Name */}
          <div>
            <Label htmlFor="coordinatorName" className="text-sm font-medium">Coordinator Name</Label>
            <Input
              id="coordinatorName"
              value={formData.coordinatorName}
              onChange={(e) => setFormData(prev => ({ ...prev, coordinatorName: e.target.value }))}
              className="mt-1"
              placeholder="Event coordinator"
            />
          </div>

          {/* Coordinator Contact */}
          <div>
            <Label htmlFor="coordinatorContact" className="text-sm font-medium">Coordinator Contact</Label>
            <Input
              id="coordinatorContact"
              value={formData.coordinatorContact}
              onChange={(e) => setFormData(prev => ({ ...prev, coordinatorContact: e.target.value }))}
              className="mt-1"
              placeholder="Phone or email"
            />
          </div>
        </div>

        {/* Zone Qualifier */}
        <div className="flex items-center space-x-2">
          <Switch
            id="isQualifier"
            checked={formData.isQualifier}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isQualifier: checked }))}
          />
          <Label htmlFor="isQualifier" className="text-sm font-medium">Zone Qualifier Event</Label>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="mt-1"
            placeholder="Any additional information about the event..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
