'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EventDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
}

function getPlanningYear(today: Date) {
  return today.getFullYear() + (today.getMonth() >= 6 ? 1 : 0);
}

export function EventDatePicker({ value, onChange }: EventDatePickerProps) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const planningYear = getPlanningYear(today);
  const endYear = today.getFullYear() + 3;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ?? new Date(planningYear, 0, 1));

  const years = Array.from(
    { length: endYear - today.getFullYear() + 1 },
    (_, index) => today.getFullYear() + index
  );

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) {
      setMonth(date);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'w-full pl-3 text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          {value ? format(value, 'PPP') : <span>Pick a date</span>}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-3" align="start">
        <div className="mb-3 grid grid-cols-[1fr_7rem] gap-2">
          <Select
            value={String(month.getMonth())}
            onValueChange={(value) => setMonth(new Date(month.getFullYear(), Number(value), 1))}
          >
            <SelectTrigger aria-label="Select month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, index) => (
                <SelectItem key={index} value={String(index)}>
                  {format(new Date(2026, index, 1), 'LLLL')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(month.getFullYear())}
            onValueChange={(value) => setMonth(new Date(Number(value), month.getMonth(), 1))}
          >
            <SelectTrigger className="h-11 text-lg font-bold" aria-label="Select year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)} className="text-lg font-semibold">
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Calendar
          mode="single"
          month={month}
          onMonthChange={setMonth}
          selected={value}
          onSelect={handleSelect}
          disabled={{ before: startOfToday }}
          startMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
          endMonth={new Date(endYear, 11, 1)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
