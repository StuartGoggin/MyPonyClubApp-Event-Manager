'use client';

import { Control, UseFormWatch } from 'react-hook-form';
import { CalendarIcon, Calendar as CalendarLucide, Trash2, Wand2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type EventType } from '@/lib/types';

interface SingleEventFormProps {
  eventIndex: number;
  priority: number;
  control: Control<any>;
  watch: UseFormWatch<any>;
  eventTypes: EventType[];
  onAnalyzeDate?: (eventIndex: number) => void;
  onRemoveEvent?: () => void;
  canRemove?: boolean;
  isLoadingSuggestions?: boolean;
  conflictSuggestions?: any;
}

export function SingleEventForm({
  eventIndex,
  priority,
  control,
  watch,
  eventTypes,
  onAnalyzeDate,
  onRemoveEvent,
  canRemove = false,
  isLoadingSuggestions = false,
  conflictSuggestions
}: SingleEventFormProps) {

  const isHistoricallyTraditional = watch(`events.${eventIndex}.isHistoricallyTraditional`);

  const priorityColors = {
    1: 'border-red-200 bg-red-50',
    2: 'border-orange-200 bg-orange-50', 
    3: 'border-yellow-200 bg-yellow-50',
    4: 'border-green-200 bg-green-50'
  };

  const priorityLabels = {
    1: 'Highest Priority',
    2: 'High Priority',
    3: 'Medium Priority', 
    4: 'Lowest Priority'
  };

  // Add historical traditional styling
  const cardStyle = isHistoricallyTraditional 
    ? `${priorityColors[priority as keyof typeof priorityColors] || 'border-gray-200 bg-gray-50'} ring-2 ring-amber-300 ring-opacity-50`
    : priorityColors[priority as keyof typeof priorityColors] || 'border-gray-200 bg-gray-50';

  return (
    <div className={`space-y-4 p-4 rounded-lg border-2 ${cardStyle}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm border-2 border-current">
            {priority}
          </div>
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold">
              Event Request #{priority} - {priorityLabels[priority as keyof typeof priorityLabels]}
            </h3>
            {isHistoricallyTraditional && (
              <div className="flex items-center gap-1 text-sm text-amber-700">
                <CalendarLucide className="h-3 w-3" />
                <span className="font-medium">Historical Traditional Event</span>
              </div>
            )}
          </div>
        </div>
        {canRemove && onRemoveEvent && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRemoveEvent}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Event Name */}
      <FormField
        control={control}
        name={`events.${eventIndex}.name`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter event name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Event Type */}
      <FormField
        control={control}
        name={`events.${eventIndex}.eventTypeId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {eventTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Location */}
      <FormField
        control={control}
        name={`events.${eventIndex}.location`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location *</FormLabel>
            <FormControl>
              <Input placeholder="Enter event location" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Qualifier and Historical Checkboxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`events.${eventIndex}.isQualifier`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  This is a qualifier event
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`events.${eventIndex}.isHistoricallyTraditional`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  Historically traditional event
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  This event has traditionally been held on this date
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Description */}
      <FormField
        control={control}
        name={`events.${eventIndex}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter event description (optional)"
                className="resize-none"
                rows={3}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Coordinator Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`events.${eventIndex}.coordinatorName`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Coordinator Name</FormLabel>
              <FormControl>
                <Input placeholder="Coordinator name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`events.${eventIndex}.coordinatorContact`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Coordinator Contact</FormLabel>
              <FormControl>
                <Input placeholder="Phone or email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Preferred Date */}
      <div className="space-y-3">
        <FormLabel>Preferred Date *</FormLabel>
        <div className="flex items-center gap-2">
          <FormField
            control={control}
            name={`events.${eventIndex}.date`}
            render={({ field }) => (
              <FormItem className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {onAnalyzeDate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAnalyzeDate(eventIndex)}
              disabled={isLoadingSuggestions}
            >
              {isLoadingSuggestions ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Event-specific Notes */}
      <FormField
        control={control}
        name={`events.${eventIndex}.notes`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any additional notes for this event..."
                className="resize-none"
                rows={2}
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Conflict Suggestions */}
      {conflictSuggestions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Date Conflict Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Alternative dates suggested based on analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}