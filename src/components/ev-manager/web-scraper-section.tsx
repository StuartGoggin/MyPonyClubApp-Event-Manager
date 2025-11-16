'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Globe, RefreshCw, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScrapedEvent {
  name: string;
  url: string;
  start_date: string;
  end_date: string;
  discipline: string | null;
  location: string | null;
  tier: string | null;
}

export function WebScraperSection() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<ScrapedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate year options (current year + 2 years forward and 1 year back)
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - 1 + i);

  const handleScrape = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setEvents([]);

    try {
      const response = await fetch(
        `https://scrapeequestrianevents-gt54xuwvaq-de.a.run.app?year=${selectedYear}`
      );

      if (!response.ok) {
        throw new Error(`Failed to scrape events: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
        setSuccess(`Successfully scraped ${data.events.length} events for ${selectedYear}`);
      } else {
        throw new Error('Invalid response format from scraper');
      }
    } catch (err) {
      console.error('Scraping error:', err);
      setError(err instanceof Error ? err.message : 'Failed to scrape events');
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `equestrian_events_${selectedYear}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-indigo-600" />
          Web Scraper - Equestrian Victoria Events
        </CardTitle>
        <CardDescription>
          Scrape events from the Equestrian Victoria website for a selected year
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="year-select" className="text-sm font-medium">
              Select Year
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year-select" className="w-full sm:w-48">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleScrape}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Scrape Events
                </>
              )}
            </Button>
            {events.length > 0 && (
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </Button>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Results Table */}
        {events.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[300px]">Event Name</TableHead>
                    <TableHead className="w-[120px]">Start Date</TableHead>
                    <TableHead className="w-[120px]">End Date</TableHead>
                    <TableHead className="w-[150px]">Discipline</TableHead>
                    <TableHead className="w-[200px]">Location</TableHead>
                    <TableHead className="w-[100px]">Tier</TableHead>
                    <TableHead className="w-[100px]">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={`${event.url}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.start_date}</TableCell>
                      <TableCell>{event.end_date}</TableCell>
                      <TableCell>
                        {event.discipline ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {event.discipline}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{event.location || '-'}</TableCell>
                      <TableCell>
                        {event.tier ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {event.tier}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <a
                          href={`https://www.vic.equestrian.org.au${event.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline text-sm"
                        >
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a year and click "Scrape Events" to fetch data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
