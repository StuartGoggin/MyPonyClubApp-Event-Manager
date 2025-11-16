import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.vic.equestrian.org.au';

// Define Event type (adjust based on your actual event structure)
interface Event {
  name: string;
  url: string;
  start_date: string;
  end_date: string;
  discipline: string | null;
  location: string | null;
  tier: string | null;
}

/**
 * Helper function to parse DD/MM/YYYY date string to Date object
 */
function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Helper function to format Date object to DD/MM/YYYY string
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Helper function to get all dates between start and end (inclusive)
 */
function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const startDate = parseDate(startDateStr);
  const endDate = parseDate(endDateStr);
  const dates: string[] = [];
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Extracts specific details (discipline, location, tier) from an individual event page.
 * @param eventUrl The full URL of the event's detail page.
 * @param eventName The event name used to infer tier.
 * @returns An object containing the extracted details.
 */
async function extractEventDetails(eventUrl: string, eventName: string): Promise<{ discipline: string | null, location: string | null, tier: string | null }> {
  try {
    logger.debug(`Fetching event details from: ${eventUrl}`);
    const response = await axios.get(eventUrl, { timeout: 10000 });
    logger.debug(`Successfully fetched event page for: ${eventName}`);
    
    const $ = cheerio.load(response.data);

    let location: string | null = null;
    let discipline: string | null = null;

    // The new website structure uses <dt> and <dd> tags for details
    const dtElements = $('.tribe-events-single-section.tribe-events-event-meta dt');
    logger.debug(`Found ${dtElements.length} dt elements on page`);
    
    $('.tribe-events-single-section.tribe-events-event-meta dt').each((_, dt) => {
      const term = $(dt).text().trim().toLowerCase();
      logger.debug(`Processing dt element: "${term}"`);
      
      if (term.includes('location:')) {
        location = $(dt).next('dd').text().trim();
        logger.debug(`Found location: ${location}`);
      } else if (term.includes('sports')) {
        discipline = $(dt).next('dd').text().trim();
        logger.debug(`Found discipline: ${discipline}`);
      }
    });

    // Infer tier from event name as it's not explicitly listed
    let tier: string | null = null;
    const lowerCaseName = eventName.toLowerCase();
    if (lowerCaseName.includes('national')) {
      tier = 'National';
    } else if (lowerCaseName.includes('state')) {
      tier = 'State';
    } else if (lowerCaseName.includes('championship')) {
      tier = 'Championship';
    } else if (lowerCaseName.includes('show')) {
      tier = 'Show';
    }
    logger.debug(`Inferred tier: ${tier || 'none'}`);

    return { discipline, location, tier };
  } catch (error) {
    logger.error(`Failed to extract details from ${eventUrl}`, error);
    return { discipline: null, location: null, tier: null };
  }
}

/**
 * Scrapes all events for a given month and year from the Equestrian Victoria website.
 * @param year The four-digit year.
 * @param month The month (1-12).
 * @returns A promise that resolves to an array of Event objects.
 */
async function scrapeEventsForMonth(year: number, month: number, discipline?: string): Promise<Event[]> {
  // NOTE: The website uses month without zero-padding (e.g., '2025-1' not '2025-01')
  const monthStr = String(month); // No padding needed
  const disciplineSegment = discipline ? `${discipline}/` : '';
  const targetUrl = `${BASE_URL}/event-calendar/month/${disciplineSegment}${year}-${monthStr}`;
  logger.info(`Scraping month: ${targetUrl}${discipline ? ` (discipline: ${discipline})` : ''}`);

  try {
    logger.debug(`Fetching calendar page for ${year}-${monthStr}...`);
    const response = await axios.get(targetUrl, { timeout: 15000 });
    logger.debug(`Received response, status: ${response.status}, content length: ${response.data.length}`);
    
    const $ = cheerio.load(response.data);
    const eventDetailPromises: Promise<Event[]>[] = [];

    // DEBUG: Let's see what table/calendar structure exists
    const allTables = $('table');
    logger.debug(`Found ${allTables.length} tables on page`);
    
    const allTds = $('td');
    logger.debug(`Found ${allTds.length} total td elements on page`);
    
    // Try different possible selectors
    const tribeThisMonth = $('td.tribe-events-thismonth');
    const tribeHasEvents = $('td.tribe-events-has-events');
    const tribeEvents = $('td[class*="tribe"]');
    const dataDay = $('td[data-day]');
    
    logger.debug(`Selector results:
      - td.tribe-events-thismonth: ${tribeThisMonth.length}
      - td.tribe-events-has-events: ${tribeHasEvents.length}
      - td[class*="tribe"]: ${tribeEvents.length}
      - td[data-day]: ${dataDay.length}`);
    
    // Log sample classes from first few td elements
    $('td').slice(0, 10).each((idx, el) => {
      const classes = $(el).attr('class') || 'no-class';
      const dataDay = $(el).attr('data-day') || 'no-data-day';
      const html = $(el).html()?.substring(0, 200) || 'no-html'; // First 200 chars of HTML
      logger.debug(`Sample td[${idx}]: class="${classes}", data-day="${dataDay}"`);
      logger.debug(`  HTML: ${html}`);
    });

    // Look for cells that might contain events - try various selectors
    const dateBoxes = $('td.date-box');
    const singleDays = $('td.single-day');
    const multiDays = $('td.multi-day');
    const hasEvents = $('td').filter((_, el) => $(el).find('a').length > 0);
    
    logger.debug(`Alternative selectors:
      - td.date-box: ${dateBoxes.length}
      - td.single-day: ${singleDays.length}
      - td.multi-day: ${multiDays.length}
      - td with links: ${hasEvents.length}`);

    // Use the actual website structure - look for div.item elements within table cells
    const eventItems = $('div.item');
    logger.debug(`Found ${eventItems.length} event items on this calendar page`);
    
    eventItems.each((idx, item) => {
      // Find the event title link within each item
      const titleLink = $(item).find('a').first();
      const relativeUrl = titleLink.attr('href');
      
      if (!relativeUrl) {
        logger.debug(`Skipping item ${idx} - no URL found`);
        return;
      }

      const name = titleLink.text().trim();
      if (!name) {
        logger.debug(`Skipping item ${idx} - no event name found`);
        return;
      }
      
      // Construct full URL from relative path
      // If it's already a full URL (starts with http), use as-is, otherwise prepend BASE_URL
      const url = relativeUrl.startsWith('http') ? relativeUrl : `${BASE_URL}${relativeUrl}`;
      
      logger.debug(`Event ${idx + 1}: "${name}"`);
      logger.debug(`Event URL: ${url}`);
      
      const promise = (async (): Promise<Event[]> => {
        const details = await extractEventDetails(url, name);

        // Extract dates from the span elements with date-display-start and date-display-end
        const startSpan = $(item).find('span.date-display-start');
        const endSpan = $(item).find('span.date-display-end');
        
        let start_date: string;
        let end_date: string;

        if (startSpan.length > 0) {
          // Extract date from text like "01/11/2025 (All day)"
          const startText = startSpan.text().trim();
          const dateMatch = startText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dateMatch) {
            start_date = dateMatch[1];
            logger.debug(`Extracted start date from span: ${start_date}`);
          } else {
            start_date = startText.split(' ')[0]; // Fallback to first part
            logger.debug(`Using start text: ${start_date}`);
          }
        } else {
          // Fallback to data-date attribute on the parent td element
          const parentTd = $(item).closest('td[data-date]');
          const dataDate = parentTd.attr('data-date');
          if (dataDate) {
            // Convert from YYYY-MM-DD to DD/MM/YYYY
            const [y, m, d] = dataDate.split('-');
            start_date = `${d}/${m}/${y}`;
            logger.debug(`Using data-date attribute: ${start_date}`);
          } else {
            // Final fallback
            start_date = `01/${monthStr.padStart(2, '0')}/${year}`;
            logger.debug(`Using fallback date: ${start_date}`);
          }
        }

        if (endSpan.length > 0) {
          // Extract date from text like "02/11/2025 (All day)"
          const endText = endSpan.text().trim();
          const dateMatch = endText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
          if (dateMatch) {
            end_date = dateMatch[1];
            logger.debug(`Extracted end date from span: ${end_date}`);
          } else {
            end_date = endText.split(' ')[0]; // Fallback to first part
            logger.debug(`Using end text: ${end_date}`);
          }
        } else {
          // If no end date, use start date
          end_date = start_date;
          logger.debug(`No end date found, using start date: ${end_date}`);
        }

        // Create the base event object
        // If scraping with a discipline filter, use it to override/set the discipline
        const baseEvent = {
          name,
          url,
          start_date,
          end_date,
          ...details,
          // Override discipline if we're scraping a specific discipline URL
          discipline: discipline || details.discipline
        };
          
        logger.debug(`Created event object:`, baseEvent);
        
        // For multi-day events, create separate instances for each day
        if (start_date !== end_date) {
          const dateRange = getDateRange(start_date, end_date);
          logger.debug(`Splitting multi-day event across ${dateRange.length} days: ${start_date} to ${end_date}`);
          
          // Return an array of events, one for each day
          return dateRange.map(date => ({
            ...baseEvent,
            start_date: date,
            end_date: date,
            name: `${name} (Day ${dateRange.indexOf(date) + 1}/${dateRange.length})`
          }));
        }
        
        return [baseEvent];
      })();
      eventDetailPromises.push(promise);
    });

    logger.info(`Processing ${eventDetailPromises.length} event detail promises for ${year}-${monthStr}`);
    const eventArrays = await Promise.all(eventDetailPromises);
    // Flatten the array of arrays and filter out any empty arrays
    const events = eventArrays.flat().filter((e): e is Event => e !== null);
    logger.info(`Successfully scraped ${events.length} events for ${year}-${monthStr} (after splitting multi-day events)`);
    return events;

  } catch (error) {
    logger.error(`Error scraping event list for ${year}-${monthStr}:`, error);
    if (axios.isAxiosError(error)) {
      logger.error(`Axios error details - Status: ${error.response?.status}, Message: ${error.message}`);
    }
    return []; // Return empty array to not fail the entire year's scrape
  }
}

/**
 * Cloud Function to scrape Equestrian Victoria events for a given year
 * 
 * SECURITY OPTIONS (choose one):
 * 
 * 1. PUBLIC ACCESS (current) - Anyone can call this
 *    URL: https://REGION-PROJECT_ID.cloudfunctions.net/scrapeEquestrianEvents?year=2025
 * 
 * 2. REQUIRE AUTHENTICATION - Add invoker: 'private' below
 *    Only authenticated users with proper IAM permissions can call
 * 
 * 3. API KEY - Check for API key in request headers (custom implementation)
 * 
 * Call with: GET /scrapeEquestrianEvents?year=2025
 */
export const scrapeEquestrianEvents = onRequest(
  {
    timeoutSeconds: 540,  // Max timeout (9 minutes)
    memory: "1GiB",       // Allocate more memory for scraping
    cors: true,           // Enable CORS for cross-origin requests
    // invoker: 'private', // Uncomment to require authentication
    region: 'asia-east1', // Match your project region
  },
  async (request, response) => {
    try {
      // OPTIONAL: Add API key validation
      // const apiKey = request.headers['x-api-key'] || request.query.apiKey;
      // if (apiKey !== process.env.SCRAPER_API_KEY) {
      //   logger.warn("Unauthorized access attempt - invalid API key");
      //   response.status(401).json({ error: "Unauthorized" });
      //   return;
      // }

      // Only allow GET requests
      if (request.method !== 'GET') {
        response.status(405).json({ error: 'Method not allowed. Use GET.' });
        return;
      }

      // Extract year from query parameters
      const yearParam = request.query.year;

      // Validate year parameter
      if (!yearParam || typeof yearParam !== "string" || !/^\d{4}$/.test(yearParam)) {
        logger.warn("Invalid or missing year parameter.", { query: request.query });
        response.status(400).json({ error: "Please provide a valid 4-digit year." });
        return;
      }

      const parsedYear = parseInt(yearParam, 10);
      
      // Validate year is reasonable (2020-2030)
      if (parsedYear < 2020 || parsedYear > 2030) {
        response.status(400).json({ error: "Year must be between 2020 and 2030." });
        return;
      }

      // Extract optional disciplines parameter (comma-separated list)
      const disciplinesParam = request.query.disciplines;
      let disciplines: string[] = [];
      
      if (disciplinesParam && typeof disciplinesParam === "string" && disciplinesParam.trim() !== "") {
        disciplines = disciplinesParam.split(',').map(d => d.trim()).filter(d => d.length > 0);
        logger.info(`Filtering by disciplines: ${disciplines.join(', ')}`);
      } else {
        logger.info(`No discipline filter specified, scraping all events`);
      }

      logger.info(`Starting scrape for year: ${parsedYear}`, { 
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        disciplines: disciplines.length > 0 ? disciplines : 'all'
      });

      // Scrape all 12 months in parallel
      logger.debug(`Creating scrape promises for all 12 months...`);
      
      let scrapePromises: Promise<Event[]>[];
      
      if (disciplines.length > 0) {
        // Scrape each discipline separately for all 12 months
        scrapePromises = disciplines.flatMap(discipline => 
          Array.from({ length: 12 }, (_, i) => 
            scrapeEventsForMonth(parsedYear, i + 1, discipline)
          )
        );
        logger.debug(`Created ${scrapePromises.length} scrape promises (${disciplines.length} disciplines × 12 months)`);
      } else {
        // Scrape general calendar (no discipline filter)
        scrapePromises = Array.from({ length: 12 }, (_, i) => 
          scrapeEventsForMonth(parsedYear, i + 1)
        );
        logger.debug(`Created ${scrapePromises.length} scrape promises (12 months, all events)`);
      }

      logger.debug(`Waiting for all months to complete scraping...`);
      const monthlyResults = await Promise.all(scrapePromises);
      logger.debug(`All months completed. Results per month:`, monthlyResults.map((r, i) => `Month ${i+1}: ${r.length} events`));
      
      const allEvents = monthlyResults.flat();
      logger.info(`Total events before deduplication: ${allEvents.length}`);

      // Deduplicate events by URL + start date (to preserve multi-day event instances)
      const uniqueEventsMap = new Map<string, Event>();
      for (const event of allEvents) {
        // Use URL + start_date as unique key to preserve split multi-day events
        const uniqueKey = `${event.url}|${event.start_date}`;
        uniqueEventsMap.set(uniqueKey, event);
      }
      const uniqueEvents = Array.from(uniqueEventsMap.values());

      logger.info(`Scraped ${uniqueEvents.length} unique events for ${parsedYear} (removed ${allEvents.length - uniqueEvents.length} duplicates).`);
      
      if (uniqueEvents.length === 0) {
        logger.warn(`No events found for year ${parsedYear}. This might indicate a scraping issue.`);
      } else {
        logger.debug(`Sample event:`, uniqueEvents[0]);
      }

      // Return success response
      response.status(200).json({
        success: true,
        year: parsedYear,
        eventCount: uniqueEvents.length,
        events: uniqueEvents,
      });

    } catch (error) {
      logger.error("An unexpected error occurred in scrapeEquestrianEvents:", error);
      response.status(500).json({ 
        success: false,
        error: "An internal server error occurred.",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
);