import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { getClubs } from '@/lib/data';

interface ClubData {
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  rawHtml?: string;
}

interface PageStructureAnalysis {
  url: string;
  title: string;
  totalClubs: number;
  clubElements: Array<{
    selector: string;
    count: number;
    sampleData: ClubData[];
  }>;
  pageStructure: {
    headings: string[];
    forms: number;
    scripts: number;
    dynamicContent: boolean;
  };
  recommendations: string[];
}

// Helper function to extract club data from an element
function extractClubDataFromElement(element: any): ClubData {
  return {
    name: element.name || '',
    location: element.location || '',
    address: element.address || '',
    phone: element.phone || '',
    email: element.email || '',
    website: element.website || '',
    logoUrl: element.logoUrl || '',
    rawHtml: element.rawHtml || ''
  };
}

// GET endpoint to analyze page structure with Puppeteer
export async function GET(request: NextRequest) {
  let browser;
  
  try {
    const url = 'https://ponyclubaustralia.com.au/about-us/find-a-pony-club/';
    
    console.log(`🚀 Launching headless browser to analyze: ${url}`);
    
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the page
    console.log('📄 Loading page...');
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait a bit more for any lazy-loaded content
    console.log('⏳ Waiting for dynamic content to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get basic page info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent?.trim() || ''),
        forms: document.querySelectorAll('form').length,
        scripts: document.querySelectorAll('script').length,
        bodyText: document.body.textContent?.substring(0, 1000) || ''
      };
    });
    
    console.log(`📊 Page loaded: ${pageInfo.title}`);
    
    // Try different selectors to find club elements
    const possibleSelectors = [
      '.club-card',
      '.club-item',
      '.club-listing',
      '.club',
      '.pony-club',
      '.directory-item',
      '.listing-item',
      '[data-club]',
      '.wp-block-group',
      '.entry-content .wp-block',
      'article',
      '.club-info',
      '.club-entry',
      '.member-directory',
      '.directory-entry',
      // More specific WordPress/common CMS selectors
      '.post',
      '.entry',
      '.content-item',
      '.grid-item',
      '.card',
      '.list-item'
    ];
    
    console.log('🔍 Testing selectors for club elements...');
    
    const clubElements = [];
    
    for (const selector of possibleSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
          
          // Extract sample data from first few elements
          const sampleData = [];
          const sampleCount = Math.min(3, elements.length);
          
          for (let i = 0; i < sampleCount; i++) {
            const elementData = await page.evaluate((el) => {
              const getText = (sel: string) => {
                const element = el.querySelector(sel);
                return element ? element.textContent?.trim() || '' : '';
              };
              
              const getAttr = (sel: string, attr: string) => {
                const element = el.querySelector(sel);
                return element ? element.getAttribute(attr) || '' : '';
              };
              
              const getLink = (sel: string) => {
                const element = el.querySelector(sel);
                return element ? element.getAttribute('href') || '' : '';
              };
              
              return {
                name: getText('h1, h2, h3, h4, h5, h6, .title, .name, .club-name') ||
                      getText('.wp-block-heading') ||
                      el.textContent?.split('\n')[0]?.trim() || '',
                location: getText('.location, .address, .suburb, .state, .region'),
                phone: getText('.phone, .tel, [href^="tel:"]'),
                email: getText('.email, [href^="mailto:"]') || getAttr('[href^="mailto:"]', 'href').replace('mailto:', ''),
                website: getLink('.website, .url, [href^="http"]'),
                logoUrl: getAttr('img', 'src'),
                rawHtml: el.innerHTML.substring(0, 500)
              };
            }, elements[i]);
            
            if (elementData.name) {
              sampleData.push(elementData);
            }
          }
          
          clubElements.push({
            selector,
            count: elements.length,
            sampleData
          });
          
          // If we found a good match with actual data, break
          if (sampleData.length > 0 && sampleData[0].name) {
            console.log(`🎯 Good match found with ${selector}, stopping search`);
            break;
          }
        }
      } catch (error) {
        console.log(`❌ Error testing selector ${selector}:`, error);
      }
    }
    
    // Look for text patterns if no structured elements found
    let textBasedClubs: Array<{name: string; source: string}> = [];
    if (clubElements.length === 0 || clubElements.every(ce => ce.sampleData.length === 0)) {
      console.log('🔍 No structured elements found, analyzing text content...');
      
      textBasedClubs = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const clubPatterns = [
          /([A-Za-z\s&'\-]+)\s*Pony Club/gi,
          /Pony Club\s*([A-Za-z\s&'\-]+)/gi,
          /([A-Za-z\s&'\-]+)\s*PC(?![A-Z])/gi
        ];
        
        const foundClubs = new Set<string>();
        
        clubPatterns.forEach(pattern => {
          const matches = bodyText.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const cleanName = match.replace(/pony\s*club|pc$/gi, '').trim();
              if (cleanName.length > 2) {
                foundClubs.add(cleanName);
              }
            });
          }
        });
        
        return Array.from(foundClubs).map(name => ({ name, source: 'text-analysis' }));
      });
    }
    
    // Look for pagination or load more buttons
    const paginationInfo = await page.evaluate(() => {
      const loadMoreBtn = document.querySelector('.load-more, .show-more, [data-load], .pagination a');
      const pagination = document.querySelectorAll('.pagination, .pager, .page-numbers');
      
      return {
        hasLoadMore: !!loadMoreBtn,
        loadMoreText: loadMoreBtn?.textContent?.trim() || '',
        hasPagination: pagination.length > 0,
        paginationCount: pagination.length
      };
    });
    
    console.log(`📋 Analysis complete. Found ${clubElements.reduce((sum, ce) => sum + ce.count, 0)} total elements across ${clubElements.length} selectors`);
    
    const analysis: PageStructureAnalysis = {
      url,
      title: pageInfo.title,
      totalClubs: clubElements.reduce((sum, ce) => sum + ce.count, 0) + textBasedClubs.length,
      clubElements,
      pageStructure: {
        headings: pageInfo.headings.slice(0, 10),
        forms: pageInfo.forms,
        scripts: pageInfo.scripts,
        dynamicContent: pageInfo.scripts > 5
      },
      recommendations: [
        clubElements.length === 0 ? 'No structured club elements found - website may use complex JavaScript rendering' : null,
        paginationInfo.hasLoadMore ? 'Load more button detected - may need to click to see all clubs' : null,
        paginationInfo.hasPagination ? 'Pagination detected - may need to scrape multiple pages' : null,
        textBasedClubs.length > 0 ? `Found ${textBasedClubs.length} club names in text - consider text-based extraction` : null,
        clubElements.length > 0 ? `Best selector appears to be: ${clubElements[0].selector}` : null
      ].filter((item): item is string => item !== null)
    };
    
    return NextResponse.json({
      success: true,
      analysis,
      textBasedClubs: textBasedClubs.slice(0, 10), // First 10 as sample
      paginationInfo,
      debug: {
        pageInfo,
        bodyTextSample: pageInfo.bodyText
      }
    });
    
  } catch (error) {
    console.error('❌ Puppeteer analysis failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed',
      analysis: null
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// POST endpoint to scrape clubs using the identified structure
export async function POST(request: NextRequest) {
  let browser;
  
  try {
    const { bestSelector, maxPages = 1 } = await request.json();
    const url = 'https://ponyclubaustralia.com.au/about-us/find-a-pony-club/';
    
    console.log(`🚀 Starting dynamic scraping with selector: ${bestSelector}`);
    
    // Get existing clubs from database
    const existingClubs = await getClubs();
    console.log(`📊 Found ${existingClubs.length} existing clubs in database`);
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate and wait for content
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Extract all clubs using the identified selector
    const scrapedClubs = await page.evaluate((selector) => {
      const elements = document.querySelectorAll(selector);
      const clubs = [];
      
      for (const el of elements) {
        const getText = (sel: string) => {
          const element = el.querySelector(sel);
          return element ? element.textContent?.trim() || '' : '';
        };
        
        const getAttr = (sel: string, attr: string) => {
          const element = el.querySelector(sel);
          return element ? element.getAttribute(attr) || '' : '';
        };
        
        const clubData = {
          name: getText('h1, h2, h3, h4, h5, h6, .title, .name, .club-name') ||
                getText('.wp-block-heading') ||
                el.textContent?.split('\n')[0]?.trim() || '',
          location: getText('.location, .address, .suburb, .state, .region'),
          phone: getText('.phone, .tel, [href^="tel:"]'),
          email: getText('.email, [href^="mailto:"]') || getAttr('[href^="mailto:"]', 'href').replace('mailto:', ''),
          website: getAttr('.website, .url, [href^="http"]', 'href'),
          logoUrl: getAttr('img', 'src')
        };
        
        if (clubData.name && clubData.name.length > 2) {
          clubs.push(clubData);
        }
      }
      
      return clubs;
    }, bestSelector);
    
    console.log(`🎯 Extracted ${scrapedClubs.length} clubs from page`);
    
    return NextResponse.json({
      success: true,
      clubsFound: scrapedClubs.length,
      clubs: scrapedClubs,
      summary: {
        totalScraped: scrapedClubs.length,
        withNames: scrapedClubs.filter(c => c.name).length,
        withLocations: scrapedClubs.filter(c => c.location).length,
        withContact: scrapedClubs.filter(c => c.phone || c.email).length
      }
    });
    
  } catch (error) {
    console.error('❌ Dynamic scraping failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Scraping failed'
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
