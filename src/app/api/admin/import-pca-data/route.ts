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
    // Clean the content - look for the start of the JSON array
    let cleanedContent = jsonContent.trim();
    
    // Find the first occurrence of '[' which should be the start of our JSON array
    const jsonStartIndex = cleanedContent.indexOf('[');
    if (jsonStartIndex === -1) {
      throw new Error('No JSON array found in the content');
    }
    
    // Extract only the JSON part
    cleanedContent = cleanedContent.substring(jsonStartIndex);
    
    // Find the last occurrence of ']' to get the end of the JSON array
    const jsonEndIndex = cleanedContent.lastIndexOf(']');
    if (jsonEndIndex === -1) {
      throw new Error('JSON array is not properly closed');
    }
    
    // Extract the complete JSON array
    cleanedContent = cleanedContent.substring(0, jsonEndIndex + 1);
    
    const pcaClubs: PCAClubData[] = JSON.parse(cleanedContent);
    
    if (!Array.isArray(pcaClubs)) {
      throw new Error('JSON content is not an array');
    }
    
    const clubs: ExtractedClubData[] = pcaClubs.map(pcaClub => {
      // Support new format fields
      const name = cleanText((pcaClub as any).Name || pcaClub.club_name || (pcaClub as any).name || "");
      const logoUrl = (pcaClub as any).Image || pcaClub.logo_url || (pcaClub as any).logoUrl || (pcaClub as any).imageUrl;
      const phone = (pcaClub as any).PhoneNumber || pcaClub.phone || (pcaClub as any).phoneNumber;
      const email = (pcaClub as any).EmailAddress || pcaClub.email || (pcaClub as any).contactEmail;
      const clubId = (pcaClub as any).ClubId || (pcaClub as any).PCAid || (pcaClub as any).clubId;
      const docId = (pcaClub as any).DocId;
      const syncGuid = (pcaClub as any).SyncGuid;
      const totalRows = (pcaClub as any).TotalRows;
      const distance = (pcaClub as any).Distance;

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
        contactPerson,
        contactRole,
        additionalInfo: `Imported from new club JSON format`,
        // New fields for preview (not in ExtractedClubData interface, but can be added if needed)
        clubId,
        docId,
        syncGuid,
        totalRows,
        distance,
        latitude,
        longitude
      };
    });

    // Filter out clubs with empty names
    return clubs.filter(club => club.name && club.name.length > 0);
    
  } catch (error) {
    console.error('Error parsing JSON content:', error);
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
  try {
  const { jsonContent, mode, selectedMatches, logSessionId }: ImportRequest = await request.json();

    if (!jsonContent) {
      return NextResponse.json({
        success: false,
        error: 'JSON content is required'
      }, { status: 400 });
    }
    
  addLog(logSessionId, `🕷️ Starting PCA club data ${mode} from JSON content`);
  addLog(logSessionId, `📄 JSON content length: ${jsonContent.length} characters`);
  addLog(logSessionId, `📄 JSON content preview: ${jsonContent.substring(0, 100)}...`);
    
    // Extract club data from JSON
  const extractedClubs = extractClubsFromJSON(jsonContent);
  addLog(logSessionId, `📊 Extracted ${extractedClubs.length} clubs from JSON`);
    
    // Find matches with existing clubs
  const matches = await findMatches(extractedClubs);
    
    // Calculate summary statistics
    const summary = {
      totalExtracted: extractedClubs.length,
      highConfidenceMatches: matches.filter(m => m.matchType === 'exact' || m.matchType === 'high').length,
      mediumConfidenceMatches: matches.filter(m => m.matchType === 'medium').length,
      lowConfidenceMatches: matches.filter(m => m.matchType === 'low').length,
      noMatches: matches.filter(m => m.matchType === 'none').length
    };
    
    if (mode === 'preview') {
      addLog(logSessionId, `✅ Preview completed. Found ${matches.length} potential matches`);
      return NextResponse.json({
        success: true,
        mode: 'preview',
        matches,
        summary
      });
    }
    
    // Import mode - actually update the database
    if (mode === 'import' && selectedMatches) {
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
            addLog(logSessionId, `✅ Updated club ${match.existingClubName} with new data`);
          } catch (error) {
            addLog(logSessionId, `❌ Failed to update club ${match.existingClubName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            skipped++;
          }
        } else {
          skipped++;
        }
      }
      addLog(logSessionId, `✅ Import completed. Updated ${imported} clubs, skipped ${skipped}`);
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
          if ((extractedClubs as any).diagnostics) {
            for (const diag of (extractedClubs as any).diagnostics) {
              addLog(logSessionId, `🔎 [DIAGNOSTIC] ${diag}`);
            }
          }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });
    
  } catch (error) {
    addLog(undefined, `❌ PCA club data import failed: ${error instanceof Error ? error.message : 'Unknown import error'}`);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown import error',
      matches: [],
      summary: {
        totalExtracted: 0,
        highConfidenceMatches: 0,
        mediumConfidenceMatches: 0,
        lowConfidenceMatches: 0,
        noMatches: 0
      }
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