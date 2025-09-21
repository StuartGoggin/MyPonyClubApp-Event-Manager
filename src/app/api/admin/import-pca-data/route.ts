import { NextRequest, NextResponse } from 'next/server';
import { NextApiResponse } from 'next';
import { getClubs, updateClub } from '@/lib/data';

interface PCAClubData {
  club_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  PCAid?: string;
}

interface ExtractedClubData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  contactPerson?: string;
  contactRole?: string;
  additionalInfo?: string;
}

interface ClubMatch {
  clubId: string;
  existingClubName: string;
  extractedData: ExtractedClubData;
  matchConfidence: number;
  matchType: 'exact' | 'high' | 'medium' | 'low' | 'none';
  suggestedAction: 'update' | 'review' | 'skip';
}

interface ImportRequest {
  jsonContent: string;
  mode: 'preview' | 'import';
  selectedMatches?: string[]; // Club IDs to import
  logSessionId?: string; // Optional session for SSE logging
}

interface ImportResponse {
  success: boolean;
  mode: 'preview' | 'import';
  matches: ClubMatch[];
  summary: {
    totalExtracted: number;
    highConfidenceMatches: number;
    mediumConfidenceMatches: number;
    lowConfidenceMatches: number;
    noMatches: number;
    imported?: number;
    skipped?: number;
  };
  error?: string;
}

// --- Simple in-memory log event system ---
const logSessions: Record<string, string[]> = {};
function addLog(sessionId: string | undefined, message: string) {
  if (sessionId) {
    if (!logSessions[sessionId]) logSessions[sessionId] = [];
    logSessions[sessionId].push(message);
  }
}

function getLogs(sessionId: string | undefined): string[] {
  return sessionId && logSessions[sessionId] ? logSessions[sessionId] : [];
}

function clearLogs(sessionId: string | undefined) {
  if (sessionId) delete logSessions[sessionId];
}

// Helper function to clean and normalize text
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s@.-]/g, '')
    .trim();
}

// Helper function to calculate similarity between strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1 === s2) return 1.0;
  
  // Calculate Levenshtein distance
  const matrix = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
}

// Extract club data from JSON content
function extractClubsFromJSON(jsonContent: string): ExtractedClubData[] {
  try {
    console.log('[PCA Import] Starting JSON extraction');
    console.log(`[PCA Import] Input content length: ${jsonContent.length} characters`);
    
    // Clean the content - look for the start of the JSON array
    let cleanedContent = jsonContent.trim();
    console.log(`[PCA Import] After trim, content length: ${cleanedContent.length}`);
    console.log(`[PCA Import] Content preview (first 200 chars): ${cleanedContent.substring(0, 200)}`);
    console.log(`[PCA Import] Content preview (last 200 chars): ${cleanedContent.substring(Math.max(0, cleanedContent.length - 200))}`);
    
    // Find the first occurrence of '[' which should be the start of our JSON array
    const jsonStartIndex = cleanedContent.indexOf('[');
    console.log(`[PCA Import] JSON array start index: ${jsonStartIndex}`);
    if (jsonStartIndex === -1) {
      console.error('[PCA Import] ERROR: No JSON array found in the content');
      console.log('[PCA Import] Content analysis:');
      console.log(`[PCA Import] - Starts with: "${cleanedContent.substring(0, 50)}"`);
      console.log(`[PCA Import] - Contains '{': ${cleanedContent.includes('{')} at index ${cleanedContent.indexOf('{')}`);
      console.log(`[PCA Import] - Contains 'club': ${cleanedContent.toLowerCase().includes('club')}`);
      console.log(`[PCA Import] - Contains 'name': ${cleanedContent.toLowerCase().includes('name')}`);
      throw new Error('No JSON array found in the content. Expected content to start with "[" but found: ' + cleanedContent.substring(0, 100));
    }
    
    // Extract only the JSON part
    cleanedContent = cleanedContent.substring(jsonStartIndex);
    console.log(`[PCA Import] After extracting from '[', content length: ${cleanedContent.length}`);
    
    // Find the last occurrence of ']' to get the end of the JSON array
    const jsonEndIndex = cleanedContent.lastIndexOf(']');
    console.log(`[PCA Import] JSON array end index: ${jsonEndIndex}`);
    if (jsonEndIndex === -1) {
      console.error('[PCA Import] ERROR: JSON array is not properly closed');
      console.log(`[PCA Import] Content ends with: "${cleanedContent.substring(Math.max(0, cleanedContent.length - 100))}"`);
      throw new Error('JSON array is not properly closed. Expected content to end with "]"');
    }
    
    // Extract the complete JSON array
    cleanedContent = cleanedContent.substring(0, jsonEndIndex + 1);
    console.log(`[PCA Import] Final JSON content length: ${cleanedContent.length}`);
    console.log(`[PCA Import] Final JSON starts with: ${cleanedContent.substring(0, 100)}`);
    console.log(`[PCA Import] Final JSON ends with: ${cleanedContent.substring(Math.max(0, cleanedContent.length - 100))}`);
    
    let pcaClubs: PCAClubData[];
    try {
      pcaClubs = JSON.parse(cleanedContent);
      console.log(`[PCA Import] JSON parsing successful`);
    } catch (parseError) {
      console.error('[PCA Import] JSON parsing failed:', parseError);
      console.log('[PCA Import] Attempting to identify parsing issue:');
      
      // Try to find common JSON issues
      const bracketCount = (cleanedContent.match(/\[/g) || []).length - (cleanedContent.match(/\]/g) || []).length;
      const braceCount = (cleanedContent.match(/\{/g) || []).length - (cleanedContent.match(/\}/g) || []).length;
      console.log(`[PCA Import] Bracket balance: ${bracketCount} (should be 0)`);
      console.log(`[PCA Import] Brace balance: ${braceCount} (should be 0)`);
      
      throw new Error(`JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Check that the file contains valid JSON.`);
    }
    
    if (!Array.isArray(pcaClubs)) {
      console.error('[PCA Import] ERROR: Parsed content is not an array');
      console.log(`[PCA Import] Parsed content type: ${typeof pcaClubs}`);
      console.log(`[PCA Import] Parsed content: ${JSON.stringify(pcaClubs).substring(0, 200)}`);
      throw new Error(`JSON content is not an array. Found ${typeof pcaClubs} instead.`);
    }
    
    console.log(`[PCA Import] Successfully parsed JSON array with ${pcaClubs.length} items`);
    
    if (pcaClubs.length === 0) {
      console.warn('[PCA Import] WARNING: JSON array is empty');
      return [];
    }
    
    // Log first few items to understand structure
    console.log('[PCA Import] Sample data structure analysis:');
    pcaClubs.slice(0, 3).forEach((club, index) => {
      console.log(`[PCA Import] Item ${index + 1} keys:`, Object.keys(club));
      console.log(`[PCA Import] Item ${index + 1} sample:`, JSON.stringify(club).substring(0, 200));
    });
    
    const clubs: ExtractedClubData[] = pcaClubs.map((pcaClub, index) => {
      try {
        // Support new format fields with detailed logging
        const name = cleanText((pcaClub as any).Name || pcaClub.club_name || (pcaClub as any).name || "");
        const logoUrl = (pcaClub as any).Image || pcaClub.logo_url || (pcaClub as any).logoUrl || (pcaClub as any).imageUrl;
        const phone = (pcaClub as any).PhoneNumber || pcaClub.phone || (pcaClub as any).phoneNumber;
        const email = (pcaClub as any).EmailAddress || pcaClub.email || (pcaClub as any).contactEmail;
        const clubId = (pcaClub as any).ClubId || (pcaClub as any).PCAid || (pcaClub as any).clubId;
        const docId = (pcaClub as any).DocId;
        const syncGuid = (pcaClub as any).SyncGuid;
        const totalRows = (pcaClub as any).TotalRows;
        const distance = (pcaClub as any).Distance;

        // Log field extraction for first few items
        if (index < 3) {
          console.log(`[PCA Import] Item ${index + 1} field extraction:`);
          console.log(`[PCA Import] - Name: "${name}" (from: ${(pcaClub as any).Name ? 'Name' : pcaClub.club_name ? 'club_name' : (pcaClub as any).name ? 'name' : 'none'})`);
          console.log(`[PCA Import] - Logo: ${logoUrl ? 'found' : 'not found'}`);
          console.log(`[PCA Import] - Phone: ${phone ? 'found' : 'not found'}`);
          console.log(`[PCA Import] - Email: ${email ? 'found' : 'not found'}`);
        }
        
        if (!name || name.trim() === '') {
          console.warn(`[PCA Import] WARNING: Item ${index + 1} has no valid name`);
          console.log(`[PCA Import] Item ${index + 1} available fields:`, Object.keys(pcaClub));
        }

        // Address object
        let addressObj = (pcaClub as any).Address || {};
        let address = [addressObj.Address1, addressObj.Address2, addressObj.Address3, addressObj.Town, addressObj.County, addressObj.Country, addressObj.Postcode]
          .filter(Boolean)
          .map(a => cleanText(a))
          .join(", ");
        address = address && address.length > 0 ? address : "";

        // Latlng object
        let latlngObj = (pcaClub as any).Latlng || {};
        let latitude = latlngObj.Lat ? parseFloat(latlngObj.Lat) : undefined;
        let longitude = latlngObj.Lng ? parseFloat(latlngObj.Lng) : undefined;

        // Website (if present)
        let website = (pcaClub as any).Website || (pcaClub as any).website || (pcaClub as any).websiteUrl;
        website = website ? cleanText(website) : undefined;

        // Contact person and role
        let contactPerson = (pcaClub as any).ContactPerson || (pcaClub as any).primaryContact || undefined;
        let contactRole = (pcaClub as any).ContactRole || undefined;

        return {
          name,
          address,
          phone: phone ? cleanText(phone) : undefined,
          email: email ? cleanText(email) : undefined,
          website,
          logoUrl: logoUrl ? cleanText(logoUrl) : undefined,
          contactPerson: contactPerson ? cleanText(contactPerson) : undefined,
          contactRole: contactRole ? cleanText(contactRole) : undefined,
          additionalInfo: [clubId, docId, syncGuid, totalRows, distance, latitude, longitude]
            .filter(Boolean)
            .map(String)
            .join(", ") || undefined
        };
      } catch (itemError) {
        console.error(`[PCA Import] Error processing item ${index + 1}:`, itemError);
        console.log(`[PCA Import] Problematic item:`, JSON.stringify(pcaClub).substring(0, 300));
        throw new Error(`Error processing club data item ${index + 1}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    });
    
    const validClubs = clubs.filter(club => club.name && club.name.trim() !== '');
    console.log(`[PCA Import] Extracted ${clubs.length} total items, ${validClubs.length} with valid names`);
    
    if (validClubs.length === 0) {
      console.error('[PCA Import] ERROR: No clubs with valid names found');
      console.log('[PCA Import] Common field patterns found:');
      const allKeys = new Set<string>();
      pcaClubs.slice(0, 10).forEach(club => {
        Object.keys(club).forEach(key => allKeys.add(key));
      });
      console.log(`[PCA Import] Available fields: ${Array.from(allKeys).join(', ')}`);
    }

    return validClubs;
    
  } catch (error) {
    console.error('[PCA Import] Critical error during JSON extraction:', error);
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Find matching clubs in the database
async function findMatches(extractedClubs: ExtractedClubData[]): Promise<ClubMatch[]> {
  const existingClubs = await getClubs();
  const matches: ClubMatch[] = [];
  
  for (const extracted of extractedClubs) {
    let bestMatch: any = null;
    let bestSimilarity = 0;
    // Find best matching existing club
    for (const existing of existingClubs) {
      const similarity = calculateSimilarity(
        extracted.name.replace(/pony club/gi, '').trim(),
        existing.name.replace(/pony club/gi, '').trim()
      );
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = existing;
      }
    }
    // Determine match type and suggested action
    let matchType: ClubMatch['matchType'] = 'none';
    let suggestedAction: ClubMatch['suggestedAction'] = 'skip';
    if (bestSimilarity >= 0.9) {
      matchType = 'exact';
      suggestedAction = 'update';
    } else if (bestSimilarity >= 0.8) {
      matchType = 'high';
      suggestedAction = 'update';
    } else if (bestSimilarity >= 0.6) {
      matchType = 'medium';
      suggestedAction = 'review';
    } else if (bestSimilarity >= 0.4) {
      matchType = 'low';
      suggestedAction = 'review';
    }
    if (bestMatch) {
      matches.push({
        clubId: bestMatch.id,
        existingClubName: bestMatch.name,
        extractedData: extracted,
        matchConfidence: bestSimilarity,
        matchType,
        suggestedAction,
      });
    }
  }
  
  return matches;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let logSessionId: string | undefined;
  
  try {
    console.log('[PCA Import API] Request received');
    
    const { jsonContent, mode, selectedMatches, logSessionId: requestLogSessionId }: ImportRequest = await request.json();
    logSessionId = requestLogSessionId;

    console.log(`[PCA Import API] Mode: ${mode}, Content length: ${jsonContent?.length || 0}, Selected matches: ${selectedMatches?.length || 0}`);
    
    if (!jsonContent) {
      console.error('[PCA Import API] No JSON content provided');
      addLog(logSessionId, '❌ Error: No JSON content provided');
      return NextResponse.json({
        success: false,
        mode: mode || 'unknown',
        matches: [],
        summary: { totalExtracted: 0, highConfidenceMatches: 0, mediumConfidenceMatches: 0, lowConfidenceMatches: 0, noMatches: 0 },
        error: 'JSON content is required'
      }, { status: 400 });
    }
    
    addLog(logSessionId, `� Starting PCA club data ${mode} from JSON content`);
    addLog(logSessionId, `📄 JSON content length: ${jsonContent.length} characters`);
    addLog(logSessionId, `📄 Content preview: ${jsonContent.substring(0, 100)}...`);
    
    console.log(`[PCA Import API] Starting extraction phase`);
    
    // Extract club data from JSON with enhanced error handling
    let extractedClubs: ExtractedClubData[];
    try {
      extractedClubs = extractClubsFromJSON(jsonContent);
      console.log(`[PCA Import API] Successfully extracted ${extractedClubs.length} clubs`);
      addLog(logSessionId, `📊 Successfully extracted ${extractedClubs.length} clubs from JSON`);
      
      if (extractedClubs.length === 0) {
        console.warn('[PCA Import API] No clubs were extracted from the JSON');
        addLog(logSessionId, '⚠️ Warning: No clubs were extracted from the JSON file');
        addLog(logSessionId, '💡 Tip: Check that your JSON file contains an array of club objects with name fields');
        
        return NextResponse.json({
          success: false,
          mode,
          matches: [],
          summary: { totalExtracted: 0, highConfidenceMatches: 0, mediumConfidenceMatches: 0, lowConfidenceMatches: 0, noMatches: 0 },
          error: 'No valid club data found in JSON file. Please check the file format and ensure it contains club objects with name fields.'
        });
      }
      
      // Log sample of extracted clubs for debugging
      if (extractedClubs.length > 0) {
        addLog(logSessionId, `📋 Sample extracted clubs:`);
        extractedClubs.slice(0, 3).forEach((club, index) => {
          addLog(logSessionId, `  ${index + 1}. ${club.name} ${club.address ? '(has address)' : '(no address)'} ${club.phone ? '(has phone)' : '(no phone)'}`);
        });
      }
      
    } catch (extractionError) {
      console.error('[PCA Import API] Error during club extraction:', extractionError);
      addLog(logSessionId, `❌ Error extracting clubs: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`);
      addLog(logSessionId, '💡 Common issues: Invalid JSON format, missing array structure, or unsupported data format');
      
      return NextResponse.json({
        success: false,
        mode,
        matches: [],
        summary: { totalExtracted: 0, highConfidenceMatches: 0, mediumConfidenceMatches: 0, lowConfidenceMatches: 0, noMatches: 0 },
        error: `Failed to extract club data: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}`
      });
    }
    
    console.log(`[PCA Import API] Starting matching phase`);
    addLog(logSessionId, `🔍 Finding matches with existing clubs...`);
    
    // Find matches with existing clubs
    let matches: ClubMatch[];
    try {
      matches = await findMatches(extractedClubs);
      console.log(`[PCA Import API] Found ${matches.length} potential matches`);
      addLog(logSessionId, `🎯 Found ${matches.length} potential matches`);
    } catch (matchingError) {
      console.error('[PCA Import API] Error during matching:', matchingError);
      addLog(logSessionId, `❌ Error finding matches: ${matchingError instanceof Error ? matchingError.message : 'Unknown error'}`);
      
      return NextResponse.json({
        success: false,
        mode,
        matches: [],
        summary: { totalExtracted: extractedClubs.length, highConfidenceMatches: 0, mediumConfidenceMatches: 0, lowConfidenceMatches: 0, noMatches: 0 },
        error: `Failed to find matches: ${matchingError instanceof Error ? matchingError.message : 'Unknown error'}`
      });
    }
    
    // Calculate summary statistics
    const summary = {
      totalExtracted: extractedClubs.length,
      highConfidenceMatches: matches.filter(m => m.matchType === 'exact' || m.matchType === 'high').length,
      mediumConfidenceMatches: matches.filter(m => m.matchType === 'medium').length,
      lowConfidenceMatches: matches.filter(m => m.matchType === 'low').length,
      noMatches: matches.filter(m => m.matchType === 'none').length
    };
    
    console.log(`[PCA Import API] Summary:`, summary);
    addLog(logSessionId, `📈 Match summary: ${summary.highConfidenceMatches} high, ${summary.mediumConfidenceMatches} medium, ${summary.lowConfidenceMatches} low, ${summary.noMatches} no matches`);
    
    if (mode === 'preview') {
      const previewTime = Date.now() - startTime;
      console.log(`[PCA Import API] Preview completed in ${previewTime}ms`);
      addLog(logSessionId, `✅ Preview completed in ${previewTime}ms. Found ${matches.length} potential matches`);
      
      return NextResponse.json({
        success: true,
        mode: 'preview',
        matches,
        summary
      });
    }
    
    // Import mode - actually update the database
    if (mode === 'import' && selectedMatches) {
      console.log(`[PCA Import API] Starting import of ${selectedMatches.length} selected clubs`);
      addLog(logSessionId, `🔄 Starting import of ${selectedMatches.length} selected clubs...`);
      
      let imported = 0;
      let skipped = 0;
      
      for (const match of matches) {
        if (selectedMatches.includes(match.clubId)) {
          try {
            const updateData: any = {};
            if (match.extractedData.address) updateData.physicalAddress = match.extractedData.address;
            if (match.extractedData.phone) updateData.phone = match.extractedData.phone;
            if (match.extractedData.email) updateData.email = match.extractedData.email;
            if (match.extractedData.website) updateData.websiteUrl = match.extractedData.website;
            if (match.extractedData.logoUrl) updateData.logoUrl = match.extractedData.logoUrl;
            
            await updateClub(match.clubId, updateData);
            imported++;
            console.log(`[PCA Import API] Successfully updated club: ${match.existingClubName}`);
            addLog(logSessionId, `✅ Updated club ${match.existingClubName} with new data`);
          } catch (error) {
            console.error(`[PCA Import API] Failed to update club ${match.existingClubName}:`, error);
            addLog(logSessionId, `❌ Failed to update club ${match.existingClubName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            skipped++;
          }
        } else {
          skipped++;
        }
      }
      
      const importTime = Date.now() - startTime;
      console.log(`[PCA Import API] Import completed in ${importTime}ms. Updated ${imported} clubs, skipped ${skipped}`);
      addLog(logSessionId, `✅ Import completed in ${importTime}ms. Updated ${imported} clubs, skipped ${skipped}`);
      
      return NextResponse.json({
        success: true,
        mode: 'import',
        matches,
        summary: {
          ...summary,
          imported,
          skipped
        }
      });
    }
    
    // Invalid mode
    console.error(`[PCA Import API] Invalid mode: ${mode}`);
    addLog(logSessionId, `❌ Invalid mode: ${mode}`);
    
    return NextResponse.json({
      success: false,
      mode,
      matches: [],
      summary: { totalExtracted: 0, highConfidenceMatches: 0, mediumConfidenceMatches: 0, lowConfidenceMatches: 0, noMatches: 0 },
      error: 'Invalid request parameters'
    }, { status: 400 });
    
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error(`[PCA Import API] Critical error after ${errorTime}ms:`, error);
    addLog(logSessionId, `❌ PCA club data import failed after ${errorTime}ms: ${error instanceof Error ? error.message : 'Unknown import error'}`);
    
    return NextResponse.json({
      success: false,
      mode: 'unknown',
      matches: [],
      summary: {
        totalExtracted: 0,
        highConfidenceMatches: 0,
        mediumConfidenceMatches: 0,
        lowConfidenceMatches: 0,
        noMatches: 0
      },
      error: error instanceof Error ? error.message : 'Unknown import error'
    }, { status: 500 });
  }
}

// --- SSE GET handler for log streaming ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('logSessionId') || undefined;
  if (!sessionId) {
    return new Response('Missing logSessionId', { status: 400 });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('retry: 2000\n'));
      let lastIndex = 0;
      const interval = setInterval(() => {
        const logs = getLogs(sessionId);
        while (lastIndex < logs.length) {
          controller.enqueue(encoder.encode(`data: ${logs[lastIndex]}\n\n`));
          lastIndex++;
        }
      }, 500);
      // End stream after 2 minutes or when logs are cleared
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
        clearLogs(sessionId);
      }, 120000);
    }
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}