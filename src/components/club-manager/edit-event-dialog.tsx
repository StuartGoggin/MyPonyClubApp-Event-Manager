'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, Clock, CheckCircle, Edit3, Save, X } from 'lucide-react';
import { Event, EventType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface EditEventDialogProps {
  event: Event;
  eventTypes: EventType[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
}

export function EditEventDialog({ 
  event, 
  eventTypes, 
  open, 
  onOpenChange, 
  onEventUpdated 
}: EditEventDialogProps) {
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

  // Initialize form data when dialog opens
  useEffect(() => {
    if (open && event) {
      const eventDate = event.date instanceof Date 
        ? event.date.toISOString().split('T')[0]
        : new Date(event.date).toISOString().split('T')[0];
      
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
      
      setOriginalDate(eventDate);
      setDateChanged(false);
    }
  }, [open, event]);

  // Check if date changed
  useEffect(() => {
    setDateChanged(formData.date !== originalDate);
  }, [formData.date, originalDate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.date || !formData.eventTypeId || !formData.coordinatorName) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        ...formData,
        // If date changed and event was approved, reset to proposed for reapproval
        status: (dateChanged && event.status === 'approved') ? 'proposed' : event.status
      };

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const statusMessage = (dateChanged && event.status === 'approved') 
          ? 'Event updated and sent for reapproval due to date change'
          : 'Event updated successfully';
        
        toast({
          title: 'Event Updated!',
          description: statusMessage,
          variant: 'default',
        });
        
        onEventUpdated();
        onOpenChange(false);
      } else {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isApproved = event.status === 'approved';
  const willRequireReapproval = dateChanged && isApproved;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Edit Event
          </DialogTitle>
          <DialogDescription>
            Make changes to your event details. Changes to approved events may require reapproval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Status:</span>
              {event.status === 'proposed' && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting Approval
                </Badge>
              )}
              {event.status === 'approved' && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {event.status === 'rejected' && (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
            </div>
          </div>

          {/* Reapproval Warning */}
          {willRequireReapproval && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Date Change Detected:</strong> Changing the date of an approved event will reset its status to "Awaiting Approval" and require zone manager reapproval.
              </AlertDescription>
            </Alert>
          )}

          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="event-name">
              Event Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="event-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter event name"
              required
            />
          </div>

          {/* Date and Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">
                Event Date <span className="text-red-500">*</span>
                {dateChanged && (
                  <span className="text-amber-600 ml-2 text-xs">(Changed)</span>
                )}
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="event-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Event Type <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.eventTypeId} 
                onValueChange={(value) => handleInputChange('eventTypeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
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
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Event location"
            />
          </div>

          {/* Coordinator Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coordinator-name">
                Event Coordinator <span className="text-red-500">*</span>
              </Label>
              <Input
                id="coordinator-name"
                value={formData.coordinatorName}
                onChange={(e) => handleInputChange('coordinatorName', e.target.value)}
                placeholder="Coordinator name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coordinator-contact">Contact Details</Label>
              <Input
                id="coordinator-contact"
                value={formData.coordinatorContact}
                onChange={(e) => handleInputChange('coordinatorContact', e.target.value)}
                placeholder="Phone or email"
              />
            </div>
          </div>

          {/* Qualifier Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="qualifier"
              checked={formData.isQualifier}
              onCheckedChange={(checked) => handleInputChange('isQualifier', checked)}
            />
            <Label htmlFor="qualifier">This is a Zone Qualifier Event</Label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information about the event"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="distinctive-button-cancel px-6 py-3 bg-gradient-to-r from-gray-100 via-gray-200 to-slate-200 hover:from-gray-200 hover:via-gray-300 hover:to-slate-300 text-gray-700 hover:text-gray-900 font-bold rounded-xl border-2 border-gray-300/70 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="distinctive-button-save min-w-[140px] px-6 py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-green-700 text-white font-bold rounded-xl border-2 border-emerald-400/50 hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4 drop-shadow-sm" />
                  Save Changes
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
