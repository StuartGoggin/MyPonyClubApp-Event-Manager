export const CALENDAR_TIME_ZONE = 'Australia/Melbourne';

type CalendarDateParts = {
  year: string;
  month: string;
  day: string;
};

const calendarDateFormatter = new Intl.DateTimeFormat('en-AU', {
  timeZone: CALENDAR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const calendarDisplayFormatter = new Intl.DateTimeFormat('en-AU', {
  timeZone: CALENDAR_TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function toDate(value: Date | string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return date;
}

export function getCalendarDateParts(value: Date | string): CalendarDateParts {
  const parts = calendarDateFormatter.formatToParts(toDate(value));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

export function toCalendarDate(value: Date | string): string {
  const { year, month, day } = getCalendarDateParts(value);
  return `${year}-${month}-${day}`;
}

export function formatCalendarDate(value: Date | string): string {
  return calendarDisplayFormatter.format(toDate(value));
}
