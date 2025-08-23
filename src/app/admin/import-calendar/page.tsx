'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  FileText, 
  Calendar, 
  Users, 
  CheckCircle2, 
  CheckCircle,
  AlertTriangle, 
  X, 
  Eye, 
  Edit3, 
  Download,
  RefreshCw,
  Trash2,
  Database,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Tag,
  FileEdit,
  Import,
  Undo2,
  Settings,
  Plus,
  FileImage,
  FileX
} from "lucide-react";
import { format, addDays, eachDayOfInterval, parseISO, isValid } from 'date-fns';

// Types for the import system
interface ImportedEvent {
  id: string;
  originalData: any;
  name: string;
  startDate: Date;
  endDate: Date;
  // Event can be associated with either a club OR a zone
  clubName?: string;      // For club-specific events
  clubId?: string;
  zoneName?: string;      // For zone-wide events  
  zoneId?: string;
  eventType: string;
  eventTypeId?: string;
  location?: string;
  notes?: string;
  coordinatorName?: string;
  coordinatorContact?: string;
  isQualifier?: boolean;
  status: 'pending' | 'matched' | 'unmatched' | 'error';
  matchConfidence?: number;
  validationErrors: string[];
  splitEvents?: ImportedEvent[]; // For multi-day events
  originalIndex?: number; // For editing purposes
}

interface ImportBatch {
  id: string;
  name: string;
  createdAt: Date;
  status: 'draft' | 'reviewing' | 'ready' | 'importing' | 'completed' | 'failed' | 'rolled_back';
  events: ImportedEvent[];
  importedEventIds?: string[]; // Track actual imported events for rollback
  summary: {
    totalEvents: number;
    matchedClubs: number;
    unmatchedClubs: number;
    multiDayEvents: number;
    validationErrors: number;
  };
}

interface ClubMatchSuggestion {
  clubId: string;
  clubName: string;
  confidence: number;
  reason: string;
}

interface ZoneMatchSuggestion {
  zoneId: string;
  zoneName: string;
  confidence: number;
  reason: string;
}

export default function ImportCalendarPage() {
  const [step, setStep] = useState(1); // 1: Upload, 2: Process, 3: Review, 4: Complete
  const [currentStep, setCurrentStep] = useState<'upload' | 'review' | 'import' | 'complete'>('upload');
  const [currentBatch, setCurrentBatch] = useState<ImportBatch | null>(null);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [savedBatches, setSavedBatches] = useState<ImportBatch[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseMethod, setParseMethod] = useState<'csv' | 'excel' | 'text' | 'pdf' | 'docx'>('csv');
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [processedEvents, setProcessedEvents] = useState<ImportedEvent[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [editingEvent, setEditingEvent] = useState<ImportedEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reference data
  const loadReferenceData = async () => {
    try {
      const [clubsRes, eventTypesRes, zonesRes] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/event-types'),
        fetch('/api/zones')
      ]);

      const clubsData = await clubsRes.json();
      const eventTypesData = await eventTypesRes.json();
      const zonesData = await zonesRes.json();

      setClubs(Array.isArray(clubsData) ? clubsData : clubsData.clubs || []);
      setEventTypes(Array.isArray(eventTypesData) ? eventTypesData : eventTypesData.eventTypes || []);
      setZones(Array.isArray(zonesData) ? zonesData : zonesData.zones || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  // File upload handler
  const handleFileUpload = useCallback(async (file: File) => {
    console.log('File upload started:', file.name, file.type, file.size);
    setSelectedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Parse file based on type
      let parsedData: string[][] = [];
      
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        console.log('Processing as CSV file');
        parsedData = await parseCSVFile(file);
        setParseMethod('csv');
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        console.log('Processing as Excel file');
        parsedData = await parseExcelFile(file);
        setParseMethod('excel');
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        console.log('Processing as PDF file');
        parsedData = await parsePDFFile(file);
        setParseMethod('pdf');
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        console.log('Processing as DOCX file');
        parsedData = await parseDocxFile(file);
        setParseMethod('docx');
      } else {
        console.log('Processing as text file');
        // Try text parsing for other formats
        parsedData = await parseTextFile(file);
        setParseMethod('text');
      }

      console.log('File parsed successfully, data rows:', parsedData.length);
      setPreviewData(parsedData);
      setUploadProgress(100);
      
      // Auto-process after a brief delay
      console.log('Starting processImportData in 500ms');
      setTimeout(() => {
        processImportData(parsedData);
      }, 500);

    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the format and try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // File parsing functions
  const parseCSVFile = async (file: File): Promise<string[][]> => {
    const text = await file.text();
    console.log('CSV file text length:', text.length);
    console.log('First 500 characters:', text.substring(0, 500));
    
    const lines = text.split('\n').filter(line => line.trim());
    console.log('Total lines after filtering:', lines.length);
    console.log('Last few lines:', lines.slice(-5));
    
    const parsedRows = lines.map((line, index) => {
      // Simple CSV parsing - could be enhanced with proper CSV library
      const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      if (index < 5 || index >= lines.length - 5) {
        console.log(`Row ${index}:`, cells);
      }
      return cells;
    });
    
    console.log('Total parsed rows:', parsedRows.length);
    return parsedRows;
  };

  const parseExcelFile = async (file: File): Promise<string[][]> => {
    // For now, return a placeholder - would need xlsx library for real parsing
    return [
      ['Event Name', 'Start Date', 'End Date', 'Club', 'Location', 'Type'],
      ['Sample Rally', '2025-09-15', '2025-09-15', 'Melbourne Pony Club', 'Melbourne', 'Rally']
    ];
  };

  const parseTextFile = async (file: File): Promise<string[][]> => {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    // Try to detect delimiters and parse accordingly
    return lines.map(line => line.split(/\t|,|;/).map(cell => cell.trim()));
  };

  const parsePDFFile = async (file: File): Promise<string[][]> => {
    console.log('Starting PDF parsing for file:', file.name, 'Size:', file.size);
    try {
      // For PDF parsing, we'll use a client-side PDF.js approach
      // This is a simplified implementation - in production you might want to use a library like pdf-parse
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('PDF arrayBuffer length:', arrayBuffer.byteLength);
      
      // Convert to base64 for processing
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      uint8Array.forEach(byte => binary += String.fromCharCode(byte));
      const base64 = btoa(binary);
      
      // Simple text extraction approach
      // Note: This is a basic implementation. For better PDF parsing, 
      // you would typically use pdf-parse or PDF.js library
      const extractedText = await extractTextFromPDF(arrayBuffer);
      console.log('Extracted text length:', extractedText.length);
      console.log('First 200 chars:', extractedText.substring(0, 200));
      
      if (!extractedText) {
        throw new Error('Could not extract text from PDF');
      }

      // Process extracted text into structured data
      const parsedData = parseExtractedPDFText(extractedText);
      console.log('Parsed PDF data rows:', parsedData.length);
      console.log('First few rows:', parsedData.slice(0, 3));
      
      return parsedData;
      
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Fallback: return a template structure
      return [
        ['Event Name', 'Start Date', 'End Date', 'Club', 'Location', 'Type'],
        ['PDF Import Failed', '2025-01-01', '2025-01-01', 'Unknown Club', 'Unknown Location', 'Rally']
      ];
    }
  };

  // Extract text from PDF using basic approach
  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // This is a simplified approach - in a real implementation you'd use PDF.js
      // For now, we'll create a mock extraction that looks for common patterns
      
      // Convert buffer to string and look for text patterns
      const uint8Array = new Uint8Array(arrayBuffer);
      let text = '';
      
      // Simple approach: look for readable text in the PDF structure
      for (let i = 0; i < uint8Array.length - 10; i++) {
        if (uint8Array[i] === 0x42 && uint8Array[i+1] === 0x54) { // Look for "BT" (Begin Text)
          // Extract text content - this is very simplified
          let j = i + 2;
          let textContent = '';
          while (j < uint8Array.length && uint8Array[j] !== 0x45) { // Until "ET" (End Text)
            if (uint8Array[j] >= 32 && uint8Array[j] <= 126) {
              textContent += String.fromCharCode(uint8Array[j]);
            }
            j++;
          }
          text += textContent + '\n';
        }
      }
      
      // If no text found, return a placeholder
      if (!text.trim()) {
        text = `PDF Document Import
Event Name,Date,Club,Location,Type
Sample Event,2025-09-15,Sample Club,Sample Location,Rally
Note: PDF text extraction is limited. Please verify the imported data.`;
      }
      
      return text;
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      return 'PDF text extraction failed. Please convert to CSV or text format.';
    }
  };

  // Parse extracted PDF text into structured data
  const parseExtractedPDFText = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    const data: string[][] = [];
    
    // Look for common event patterns
    const eventPatterns = [
      /(\w+\s+\w+)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(.+)/i, // Event Date Club
      /(.+?)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+(.+)/i,      // Name Date Location
    ];
    
    // Add headers if not present
    if (data.length === 0) {
      data.push(['Event Name', 'Start Date', 'End Date', 'Club', 'Location', 'Type']);
    }
    
    lines.forEach(line => {
      // Skip empty lines and headers
      if (!line.trim() || line.toLowerCase().includes('event') && line.toLowerCase().includes('date')) {
        return;
      }
      
      // Try to match event patterns
      for (const pattern of eventPatterns) {
        const match = line.match(pattern);
        if (match) {
          const [, name, date, details] = match;
          
          // Try to extract club and location from details
          const words = details.split(/\s+/);
          const club = words.slice(0, 3).join(' '); // First 3 words as club
          const location = words.slice(3).join(' ') || club; // Rest as location
          
          data.push([
            name?.trim() || 'Unnamed Event',
            date?.trim() || '',
            date?.trim() || '', // Same date for start and end
            club?.trim() || 'Unknown Club',
            location?.trim() || '',
            'Rally' // Default type
          ]);
          break;
        }
      }
      
      // If no pattern matched, try simple comma/tab separation
      if (line.includes(',') || line.includes('\t')) {
        const cells = line.split(/[,\t]/).map(cell => cell.trim());
        if (cells.length >= 3) {
          data.push(cells);
        }
      }
    });
    
    // If no events found, add a placeholder
    if (data.length <= 1) {
      data.push([
        'PDF Import - Manual Review Required',
        '2025-01-01',
        '2025-01-01',
        'Please Review',
        'Extracted from PDF',
        'Rally'
      ]);
    }
    
    return data;
  };

  const parseDocxFile = async (file: File): Promise<string[][]> => {
    console.log('Starting DOCX parsing for file:', file.name, 'Size:', file.size);
    try {
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('DOCX arrayBuffer length:', arrayBuffer.byteLength);
      
      // Extract text from DOCX using basic ZIP parsing
      const extractedText = await extractTextFromDocx(arrayBuffer);
      console.log('Extracted DOCX text length:', extractedText.length);
      console.log('First 500 chars:', extractedText.substring(0, 500));
      
      if (!extractedText) {
        throw new Error('Could not extract text from DOCX');
      }

      // Process extracted text into structured data for Pony Club calendar format
      const parsedData = parseDocxCalendarText(extractedText);
      console.log('Parsed DOCX data rows:', parsedData.length);
      console.log('First few rows:', parsedData.slice(0, 3));
      
      return parsedData;
      
    } catch (error) {
      console.error('DOCX parsing error:', error);
      // Fallback: return a template structure
      return [
        ['Event Name', 'Start Date', 'End Date', 'Club', 'Location', 'Type'],
        ['DOCX Import Failed - Manual Review Required', '2025-01-01', '2025-01-01', 'Unknown Club', 'Unknown Location', 'Rally']
      ];
    }
  };

  // Extract text from DOCX file using basic ZIP/XML parsing
  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      // DOCX files are ZIP archives containing XML files
      // We'll use a simple approach to extract text from document.xml
      
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Look for document.xml content within the ZIP structure
      // This is a simplified approach - in production you'd use a proper DOCX library
      let docXmlStart = -1;
      let docXmlEnd = -1;
      
      // Convert to string for searching
      const binaryString = Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join('');
      
      // Look for XML content patterns
      const xmlStart = binaryString.indexOf('<?xml');
      const documentStart = binaryString.indexOf('<w:document');
      const documentEnd = binaryString.indexOf('</w:document>');
      
      if (documentStart > -1 && documentEnd > -1) {
        const xmlContent = binaryString.substring(documentStart, documentEnd + 13);
        
        // Extract text from XML by removing tags
        let text = xmlContent
          .replace(/<[^>]*>/g, ' ') // Remove XML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // If still no readable text, try alternative extraction
        if (text.length < 50) {
          text = extractFallbackText(binaryString);
        }
        
        return text;
      }
      
      // Fallback text extraction
      return extractFallbackText(binaryString);
      
    } catch (error) {
      console.error('DOCX text extraction failed:', error);
      return 'DOCX text extraction failed. Please convert to CSV or text format.';
    }
  };

  // Fallback text extraction for DOCX
  const extractFallbackText = (binaryString: string): string => {
    // Look for readable text patterns in the binary data
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < binaryString.length; i++) {
      const char = binaryString[i];
      const charCode = char.charCodeAt(0);
      
      // Include printable ASCII characters
      if (charCode >= 32 && charCode <= 126) {
        currentLine += char;
      } else if (currentLine.length > 10) {
        // End of line - save if meaningful
        const cleanLine = currentLine.trim();
        if (cleanLine.length > 5 && /[a-zA-Z]/.test(cleanLine)) {
          lines.push(cleanLine);
        }
        currentLine = '';
      }
    }
    
    // Add final line if meaningful
    if (currentLine.length > 10) {
      const cleanLine = currentLine.trim();
      if (cleanLine.length > 5 && /[a-zA-Z]/.test(cleanLine)) {
        lines.push(cleanLine);
      }
    }
    
    return lines.join('\n');
  };

  // Parse DOCX calendar text specifically for Pony Club format
  const parseDocxCalendarText = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim().length > 3);
    const data: string[][] = [];
    
    // Add headers
    data.push(['Event Name', 'Start Date', 'End Date', 'Club', 'Zone', 'State', 'Type']);
    
    // Pony Club calendar patterns to look for
    const monthPatterns = [
      /January|February|March|April|May|June|July|August|September|October|November|December/i
    ];
    
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, // DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/ig, // DD MMM YYYY
      /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/ig
    ];
    
    const eventTypePatterns = [
      /rally/i,
      /competition/i,
      /championship/i,
      /clinic/i,
      /camp/i,
      /training/i,
      /meeting/i,
      /show/i
    ];
    
    let currentMonth = '';
    let currentYear = '2025';
    
    lines.forEach(line => {
      const cleanLine = line.trim();
      
      // Skip very short lines or obvious headers
      if (cleanLine.length < 5 || 
          cleanLine.toLowerCase().includes('calendar') ||
          cleanLine.toLowerCase().includes('pony club')) {
        return;
      }
      
      // Check for month headers
      for (const monthPattern of monthPatterns) {
        if (monthPattern.test(cleanLine) && cleanLine.length < 50) {
          currentMonth = cleanLine;
          return;
        }
      }
      
      // Look for date patterns in the line
      let hasDate = false;
      let extractedDate = '';
      
      for (const datePattern of datePatterns) {
        const matches = [...cleanLine.matchAll(datePattern)];
        if (matches.length > 0) {
          hasDate = true;
          const match = matches[0];
          
          if (match.length === 4) { // DD/MM/YYYY format
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            extractedDate = `${year}-${month}-${day}`;
          } else if (match.length === 4 && typeof match[2] === 'string') { // DD MMM YYYY format
            const day = match[1].padStart(2, '0');
            const monthName = match[2];
            const year = match[3];
            const monthNum = getMonthNumber(monthName);
            extractedDate = `${year}-${monthNum.padStart(2, '0')}-${day}`;
          }
          break;
        }
      }
      
      // If we found a date, try to extract event information
      if (hasDate || currentMonth) {
        // Extract event name (text before the date or significant text)
        let eventName = cleanLine;
        
        // Remove date patterns from event name
        for (const datePattern of datePatterns) {
          eventName = eventName.replace(datePattern, '').trim();
        }
        
        // Clean up event name
        eventName = eventName
          .replace(/^\W+/, '') // Remove leading non-word chars
          .replace(/\W+$/, '') // Remove trailing non-word chars
          .trim();
        
        if (eventName.length < 3) {
          eventName = 'Calendar Event';
        }
        
        // Try to identify event type
        let eventType = 'Rally';
        for (const typePattern of eventTypePatterns) {
          if (typePattern.test(cleanLine)) {
            eventType = cleanLine.match(typePattern)?.[0] || 'Rally';
            break;
          }
        }
        
        // Try to extract club/zone information
        const words = cleanLine.split(/\s+/);
        let club = 'Unknown Club';
        let zone = '';
        let state = '';
        
        // Look for common club name patterns
        const clubPatterns = ['Pony Club', 'PC', 'Club'];
        for (let i = 0; i < words.length - 1; i++) {
          if (clubPatterns.some(pattern => words[i + 1]?.toLowerCase().includes(pattern.toLowerCase()))) {
            club = `${words[i]} ${words[i + 1]}`;
            break;
          }
        }
        
        // Use extracted date or create one from current month
        if (!extractedDate && currentMonth) {
          // Try to extract day from the line
          const dayMatch = cleanLine.match(/\b(\d{1,2})\b/);
          if (dayMatch) {
            const day = dayMatch[1].padStart(2, '0');
            const monthNum = getMonthNumber(currentMonth);
            extractedDate = `${currentYear}-${monthNum.padStart(2, '0')}-${day}`;
          }
        }
        
        if (extractedDate || currentMonth) {
          data.push([
            eventName,
            extractedDate || `${currentYear}-01-01`,
            extractedDate || `${currentYear}-01-01`,
            club,
            zone,
            state,
            eventType
          ]);
        }
      }
    });
    
    // If no events found, add a placeholder
    if (data.length <= 1) {
      data.push([
        'DOCX Import - Manual Review Required',
        '2025-01-01',
        '2025-01-01',
        'Please Review Content',
        'Unknown Zone',
        'Unknown State',
        'Rally'
      ]);
    }
    
    return data;
  };

  // Helper function to convert month name to number
  const getMonthNumber = (monthName: string): string => {
    const months = {
      'jan': '01', 'january': '01',
      'feb': '02', 'february': '02',
      'mar': '03', 'march': '03',
      'apr': '04', 'april': '04',
      'may': '05',
      'jun': '06', 'june': '06',
      'jul': '07', 'july': '07',
      'aug': '08', 'august': '08',
      'sep': '09', 'september': '09',
      'oct': '10', 'october': '10',
      'nov': '11', 'november': '11',
      'dec': '12', 'december': '12'
    };
    
    const key = monthName.toLowerCase().substring(0, 3);
    return months[key as keyof typeof months] || '01';
  };

  // Process imported data into events
  const processImportData = async (data: string[][]) => {
    console.log('processImportData called with data rows:', data.length);
    console.log('First few rows:', data.slice(0, 3));
    
    if (data.length < 1) {
      alert('File must contain at least one data row.');
      return;
    }

    await loadReferenceData();

    // Auto-detect column mappings from first row
    const firstRow = data[0];
    const columnMappings = detectColumnMappings(firstRow);
    console.log('Column mappings detected:', columnMappings);
    
    // Check if first row looks like data (no proper headers)
    const firstColumnLooksLikeDate = firstRow[0] && /\d+(st|nd|rd|th)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(firstRow[0]);
    const hasProperHeaders = firstRow.some(h => 
      h.toLowerCase().includes('event') || 
      h.toLowerCase().includes('name') || 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('club')
    );
    
    let rows: string[][];
    if (firstColumnLooksLikeDate && !hasProperHeaders) {
      console.log('First row appears to be data, not headers - processing all rows');
      rows = data; // Process all rows including the first one
    } else {
      console.log('First row appears to be headers - skipping first row');
      const [headers, ...dataRows] = data;
      rows = dataRows;
    }
    
    console.log('Processing', rows.length, 'data rows');
    const events: ImportedEvent[] = [];

    rows.forEach((row, index) => {
      if (row.length < 2) {
        console.log(`Skipping row ${index + 1} (length ${row.length}):`, row);
        return; // Skip empty rows
      }

      try {
        console.log(`Processing row ${index + 1}:`, row);
        const eventData = mapRowToEvent(row, columnMappings, index);
        console.log(`Mapped event data for row ${index + 1}:`, eventData.name, eventData.startDate);
        
        // Handle multi-day events
        if (eventData.startDate && eventData.endDate && 
            eventData.startDate.getTime() !== eventData.endDate.getTime()) {
          const splitEvents = createSplitEvents(eventData);
          events.push(...splitEvents);
          console.log(`Added ${splitEvents.length} split events for row ${index + 1}`);
        } else {
          events.push(eventData);
          console.log(`Added single event for row ${index + 1}`);
        }
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error, 'Row data:', row);
      }
    });

    console.log('Processed events count:', events.length);
    console.log('Moving to step 3 (review)');
    
    // Create processed events and move to review step
    setProcessedEvents(events);
    setStep(3);

    // Create batch for API tracking
    try {
      const batchResponse = await fetch('/api/admin/import-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          batchData: {
            fileName: selectedFile?.name || 'unknown',
            fileSize: selectedFile?.size || 0,
            events: events,
            summary: calculateBatchSummary(events)
          }
        })
      });

      const batchResult = await batchResponse.json();
      if (batchResult.success) {
        setCurrentBatchId(batchResult.batchId);
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      // Continue anyway - batch creation is not critical for the review step
    }
  };

  // Column mapping detection
  const detectColumnMappings = (headers: string[]) => {
    const mappings: Record<string, number> = {};
    
    console.log('Detecting column mappings for headers:', headers);
    
    // Check if this looks like a data row rather than headers
    // (if first column looks like a date and headers don't contain expected keywords)
    const firstColumnLooksLikeDate = headers[0] && /\d+(st|nd|rd|th)?\s*(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(headers[0]);
    const hasProperHeaders = headers.some(h => 
      h.toLowerCase().includes('event') || 
      h.toLowerCase().includes('name') || 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('club')
    );
    
    if (firstColumnLooksLikeDate && !hasProperHeaders) {
      console.log('Detected data row as headers - using positional mapping for Pony Club format');
      // Assume Pony Club format: Date, Qualifier, Club, Event Name, Location
      mappings.startDate = 0;  // Date column
      mappings.type = 1;       // Qualifier column (optional)
      mappings.club = 2;       // Club column
      mappings.name = 3;       // Event Name column
      mappings.location = 4;   // Location column (optional)
      mappings.endDate = 0;    // Use same as start date
      
      console.log('Applied Pony Club positional mapping:', mappings);
      return mappings;
    }
    
    // Standard header-based detection
    headers.forEach((header, index) => {
      const lower = header.toLowerCase();
      if (lower.includes('event') || lower.includes('name') || lower.includes('title')) {
        mappings.name = index;
      } else if (lower.includes('start') || lower.includes('date')) {
        mappings.startDate = index;
      } else if (lower.includes('end')) {
        mappings.endDate = index;
      } else if (lower.includes('club')) {
        mappings.club = index;
      } else if (lower.includes('zone')) {
        mappings.zone = index;
      } else if (lower.includes('location') || lower.includes('venue')) {
        mappings.location = index;
      } else if (lower.includes('type') || lower.includes('category')) {
        mappings.type = index;
      } else if (lower.includes('notes') || lower.includes('description')) {
        mappings.notes = index;
      } else if (lower.includes('coordinator') || lower.includes('contact')) {
        mappings.coordinator = index;
      }
    });

    console.log('Standard header-based mapping:', mappings);
    return mappings;
  };

  // Map row data to event object
  const mapRowToEvent = (row: string[], mappings: Record<string, number>, index: number): ImportedEvent => {
    const name = row[mappings.name] || `Event ${index + 1}`;
    const startDateStr = row[mappings.startDate] || '';
    const endDateStr = row[mappings.endDate] || startDateStr;
    const clubName = row[mappings.club] || '';
    const zoneName = row[mappings.zone] || '';
    
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    
    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push('Event name is required');
    if (!startDate) validationErrors.push('Valid start date is required');
    if (!clubName.trim() && !zoneName.trim()) {
      validationErrors.push('Either club name or zone name is required');
    }

    // Try to match club or zone
    let clubMatch = null;
    let zoneMatch = null;
    
    if (clubName.trim()) {
      clubMatch = findBestClubMatch(clubName);
    }
    
    if (zoneName.trim()) {
      zoneMatch = findBestZoneMatch(zoneName);
    }
    
    const event: ImportedEvent = {
      id: `import_${Date.now()}_${index}`,
      originalData: row,
      name: name.trim(),
      startDate: startDate || new Date(),
      endDate: endDate || startDate || new Date(),
      clubName: clubName.trim() || undefined,
      clubId: clubMatch?.clubId,
      zoneName: zoneName.trim() || undefined,
      zoneId: zoneMatch?.zoneId,
      eventType: row[mappings.type] || 'Rally',
      location: row[mappings.location] || '',
      notes: row[mappings.notes] || '',
      coordinatorName: row[mappings.coordinator] || '',
      status: (clubMatch || zoneMatch) ? 'matched' : 'unmatched',
      matchConfidence: clubMatch?.confidence || zoneMatch?.confidence || 0,
      validationErrors
    };

    return event;
  };

  // Date parsing with multiple format support
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    console.log('Parsing date string:', dateStr);
    
    // Try different date formats
    const formats = [
      // Handle formats like "6thFebruary", "20th February", "22nd February"
      () => {
        // Remove ordinal suffixes (st, nd, rd, th) and normalize spacing
        const cleanStr = dateStr.replace(/(\d+)(st|nd|rd|th)\s*/gi, '$1 ').trim();
        console.log('Cleaned date string:', cleanStr);
        
        // Split into day and month
        const parts = cleanStr.split(/\s+/);
        if (parts.length >= 2) {
          const day = parseInt(parts[0]);
          const monthStr = parts[1].toLowerCase();
          
          // Month mapping
          const months: { [key: string]: number } = {
            'january': 0, 'jan': 0,
            'february': 1, 'feb': 1,
            'march': 2, 'mar': 2,
            'april': 3, 'apr': 3,
            'may': 4,
            'june': 5, 'jun': 5,
            'july': 6, 'jul': 6,
            'august': 7, 'aug': 7,
            'september': 8, 'sep': 8, 'sept': 8,
            'october': 9, 'oct': 9,
            'november': 10, 'nov': 10,
            'december': 11, 'dec': 11
          };
          
          const month = months[monthStr];
          if (month !== undefined && day >= 1 && day <= 31) {
            // Use 2025 as the default year (current calendar year)
            const date = new Date(2025, month, day);
            console.log(`Parsed date: ${day} ${monthStr} -> ${date.toDateString()}`);
            return date;
          }
        }
        return null;
      },
      // Handle ranges like "10th March -Mon Labour Day" - extract first date
      () => {
        const rangeMatch = dateStr.match(/^([^-]+)/);
        if (rangeMatch) {
          const firstDateStr = rangeMatch[1].trim();
          // Recursively parse the first date
          return parseDate(firstDateStr);
        }
        return null;
      },
      // ISO formats
      () => parseISO(dateStr),
      // DD/MM/YYYY
      () => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
      },
      // MM/DD/YYYY
      () => {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
        }
        return null;
      },
      // Natural parsing
      () => new Date(dateStr)
    ];

    for (const format of formats) {
      try {
        const date = format();
        if (date && isValid(date)) {
          return date;
        }
      } catch (error) {
        continue;
      }
    }

    return null;
  };

  // Club matching with fuzzy search
  const findBestClubMatch = (clubName: string): ClubMatchSuggestion | null => {
    if (!clubName || clubs.length === 0) return null;

    const normalizedInput = clubName.toLowerCase().replace(/[^\w\s]/g, '');
    let bestMatch: ClubMatchSuggestion | null = null;
    let bestScore = 0;

    clubs.forEach(club => {
      const normalizedClub = club.name.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Exact match
      if (normalizedClub === normalizedInput) {
        return { clubId: club.id, clubName: club.name, confidence: 100, reason: 'Exact match' };
      }

      // Contains match
      if (normalizedClub.includes(normalizedInput) || normalizedInput.includes(normalizedClub)) {
        const score = Math.max(normalizedInput.length / normalizedClub.length, normalizedClub.length / normalizedInput.length) * 80;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { clubId: club.id, clubName: club.name, confidence: score, reason: 'Contains match' };
        }
      }

      // Word match
      const inputWords = normalizedInput.split(/\s+/);
      const clubWords = normalizedClub.split(/\s+/);
      const matchingWords = inputWords.filter((word: string) => clubWords.some((clubWord: string) => clubWord.includes(word) || word.includes(clubWord)));
      
      if (matchingWords.length > 0) {
        const score = (matchingWords.length / Math.max(inputWords.length, clubWords.length)) * 60;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { clubId: club.id, clubName: club.name, confidence: score, reason: `${matchingWords.length} word matches` };
        }
      }
    });

    return bestScore > 30 ? bestMatch : null;
  };

  // Zone matching with fuzzy search
  const findBestZoneMatch = (zoneName: string): ZoneMatchSuggestion | null => {
    if (!zoneName || zones.length === 0) return null;

    const normalizedInput = zoneName.toLowerCase().replace(/[^\w\s]/g, '');
    let bestMatch: ZoneMatchSuggestion | null = null;
    let bestScore = 0;

    zones.forEach(zone => {
      const normalizedZone = zone.name.toLowerCase().replace(/[^\w\s]/g, '');
      
      // Exact match
      if (normalizedZone === normalizedInput) {
        return { zoneId: zone.id, zoneName: zone.name, confidence: 100, reason: 'Exact match' };
      }

      // Contains match
      if (normalizedZone.includes(normalizedInput) || normalizedInput.includes(normalizedZone)) {
        const score = Math.max(normalizedInput.length / normalizedZone.length, normalizedZone.length / normalizedInput.length) * 80;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { zoneId: zone.id, zoneName: zone.name, confidence: score, reason: 'Contains match' };
        }
      }

      // Word match
      const inputWords = normalizedInput.split(/\s+/);
      const zoneWords = normalizedZone.split(/\s+/);
      const matchingWords = inputWords.filter((word: string) => zoneWords.some((zoneWord: string) => zoneWord.includes(word) || word.includes(zoneWord)));
      
      if (matchingWords.length > 0) {
        const score = (matchingWords.length / Math.max(inputWords.length, zoneWords.length)) * 60;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = { zoneId: zone.id, zoneName: zone.name, confidence: score, reason: `${matchingWords.length} word matches` };
        }
      }
    });

    return bestScore > 30 ? bestMatch : null;
  };

  // Create split events for multi-day events
  const createSplitEvents = (event: ImportedEvent): ImportedEvent[] => {
    const days = eachDayOfInterval({ start: event.startDate, end: event.endDate });
    
    return days.map((day, index) => ({
      ...event,
      id: `${event.id}_day_${index + 1}`,
      startDate: day,
      endDate: day,
      name: days.length > 1 ? `${event.name} (Day ${index + 1})` : event.name,
      notes: `${event.notes} ${days.length > 1 ? `\nMulti-day event: Day ${index + 1} of ${days.length}` : ''}`.trim()
    }));
  };

  // Calculate batch summary
  const calculateBatchSummary = (events: ImportedEvent[]) => {
    return {
      totalEvents: events.length,
      matchedClubs: events.filter(e => e.status === 'matched').length,
      unmatchedClubs: events.filter(e => e.status === 'unmatched').length,
      multiDayEvents: events.filter(e => e.splitEvents && e.splitEvents.length > 1).length,
      validationErrors: events.filter(e => e.validationErrors.length > 0).length
    };
  };

  // Event editing functions
  const editEvent = (index: number, updates: Partial<ImportedEvent>) => {
    const updatedEvents = [...processedEvents];
    updatedEvents[index] = { ...updatedEvents[index], ...updates };
    setProcessedEvents(updatedEvents);
  };

  const deleteEvent = (index: number) => {
    const updatedEvents = processedEvents.filter((_: any, i: number) => i !== index);
    setProcessedEvents(updatedEvents);
  };

  const openEditDialog = (event: ImportedEvent, index: number) => {
    setEditingEvent({ ...event, originalIndex: index });
    setEditDialogOpen(true);
  };

  const saveEditedEvent = (updatedEvent: ImportedEvent) => {
    const index = updatedEvent.originalIndex;
    if (index !== undefined) {
      const updatedEvents = [...processedEvents];
      
      // Re-validate club/zone match
      let clubMatch = null;
      let zoneMatch = null;
      
      if (updatedEvent.clubName) {
        clubMatch = findBestClubMatch(updatedEvent.clubName);
        updatedEvent.clubId = clubMatch?.clubId;
      }
      
      if (updatedEvent.zoneName) {
        zoneMatch = findBestZoneMatch(updatedEvent.zoneName);
        updatedEvent.zoneId = zoneMatch?.zoneId;
      }
      
      updatedEvent.status = (clubMatch || zoneMatch) ? 'matched' : 'unmatched';
      updatedEvent.matchConfidence = clubMatch?.confidence || zoneMatch?.confidence || 0;
      
      // Update validation errors
      const validationErrors: string[] = [];
      if (!updatedEvent.name.trim()) validationErrors.push('Event name is required');
      if (!updatedEvent.startDate) validationErrors.push('Valid start date is required');
      if (!updatedEvent.clubName?.trim() && !updatedEvent.zoneName?.trim()) {
        validationErrors.push('Either club name or zone name is required');
      }
      updatedEvent.validationErrors = validationErrors;
      
      updatedEvents[index] = updatedEvent;
      setProcessedEvents(updatedEvents);
    }
    setEditDialogOpen(false);
    setEditingEvent(null);
  };

  // Import execution functions
  const executeImport = async () => {
    if (!currentBatchId) return;

    setImporting(true);
    try {
      const response = await fetch('/api/admin/import-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          batchId: currentBatchId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setImportResults(result);
        setStep(4);
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import execution failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const rollbackImport = async () => {
    if (!currentBatchId) return;

    const confirmed = confirm('Are you sure you want to rollback this import? This will delete all imported events.');
    if (!confirmed) return;

    try {
      const response = await fetch('/api/admin/import-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rollback',
          batchId: currentBatchId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Successfully rolled back ${result.deletedCount} events.`);
        // Reset to step 1
        setStep(1);
        setProcessedEvents([]);
        setCurrentBatchId(null);
        setImportResults(null);
      } else {
        throw new Error(result.error || 'Rollback failed');
      }
    } catch (error) {
      console.error('Rollback failed:', error);
      alert('Rollback failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/20 p-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Calendar Import System</h1>
          <p className="text-muted-foreground">Import events from 2025 calendar documents with intelligent processing</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            {['upload', 'review', 'import', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep === step ? 'bg-primary text-primary-foreground' :
                  ['upload', 'review', 'import', 'complete'].indexOf(currentStep) > index ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {['upload', 'review', 'import', 'complete'].indexOf(currentStep) > index ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="ml-2 text-sm font-medium capitalize">{step}</span>
                {index < 3 && <div className="w-16 h-0.5 bg-gray-200 mx-4" />}
              </div>
            ))}
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="w-full">
        {/* Step 1: Upload */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Calendar Document
              </CardTitle>
              <CardDescription>
                Upload your 2025 calendar document. Supports CSV, Excel, PDF, and text formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drag and drop your calendar file here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse for files
                </p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Choose File
                    </>
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls,.txt,.doc,.docx,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
              
              {selectedFile && (
                <>
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Selected file: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </AlertDescription>
                  </Alert>
                  
                  {selectedFile.name.toLowerCase().endsWith('.pdf') && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>PDF Import Notice:</strong> PDF text extraction may require manual review. 
                        For best results, ensure your PDF contains selectable text (not scanned images).
                        Complex layouts may need corrections before import.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileSpreadsheet className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium">CSV Format</h4>
                    <p className="text-sm text-gray-600">Comma-separated values with headers</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium">Excel Format</h4>
                    <p className="text-sm text-gray-600">Excel spreadsheets (.xlsx, .xls)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileEdit className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium">Text Format</h4>
                    <p className="text-sm text-gray-600">Tab or delimiter-separated text</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileImage className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <h4 className="font-medium">PDF Format</h4>
                    <p className="text-sm text-gray-600">PDF documents with text extraction</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileX className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-medium">DOCX Format</h4>
                    <p className="text-sm text-gray-600">Word documents with calendar data</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && processedEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review Import Batch
              </CardTitle>
              <CardDescription>
                Review and edit the imported events before proceeding with the import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processedEvents.length}</div>
                  <div className="text-sm text-blue-800">Total Events</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{processedEvents.filter(e => e.status === 'matched').length}</div>
                  <div className="text-sm text-green-800">Matched Clubs</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{processedEvents.filter(e => e.status === 'unmatched').length}</div>
                  <div className="text-sm text-orange-800">Unmatched Clubs</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{processedEvents.filter(e => e.validationErrors?.length > 0).length}</div>
                  <div className="text-sm text-purple-800">With Errors</div>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={executeImport} 
                  disabled={processedEvents.filter(e => e.status === 'unmatched').length > 0 || importing}
                >
                      {importing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Import className="h-4 w-4 mr-2" />
                          Execute Import
                        </>
                      )}
                </Button>
                <Button variant="outline" onClick={() => setStep(2)}>
                  <Undo2 className="h-4 w-4 mr-2" />
                  Back to Upload
                </Button>
              </div>

                  {/* Events Table */}
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Event Name</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Club/Zone</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(showAllEvents ? processedEvents : processedEvents.slice(0, 20)).map((event: any, index: number) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">
                              <div>
                                {event.name}
                                {event.validationErrors?.length > 0 && (
                                  <div className="text-xs text-red-600 mt-1">
                                    {event.validationErrors.length} error(s)
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                {format(event.startDate, 'PPP')}
                                {event.endDate && event.startDate.getTime() !== event.endDate.getTime() && (
                                  <div className="text-xs text-gray-600">
                                    to {format(event.endDate, 'PPP')}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {event.eventType}
                              </Badge>
                              {event.isQualifier && (
                                <Badge variant="secondary" className="text-xs ml-1">
                                  Qualifier
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div>
                                  {event.clubName && (
                                    <div className="flex items-center gap-1">
                                      <Badge variant="outline" className="text-xs">Club</Badge>
                                      {event.clubName}
                                    </div>
                                  )}
                                  {event.zoneName && (
                                    <div className="flex items-center gap-1">
                                      <Badge variant="secondary" className="text-xs">Zone</Badge>
                                      {event.zoneName}
                                    </div>
                                  )}
                                  {!event.clubName && !event.zoneName && (
                                    <span className="text-gray-500">No club/zone</span>
                                  )}
                                </div>
                                {event.status === 'matched' && (
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(event.matchConfidence || 0)}% match
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {event.location || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                event.status === 'matched' ? 'default' :
                                event.status === 'unmatched' ? 'destructive' :
                                'secondary'
                              }>
                                {event.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => openEditDialog(event, index)}>
                                  <Edit3 className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteEvent(index)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Show All/Pagination Controls */}
                  {processedEvents.length > 20 && (
                    <div className="flex justify-center mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAllEvents(!showAllEvents)}
                      >
                        {showAllEvents ? 
                          `Show First 20 Events` : 
                          `Show All ${processedEvents.length} Events`
                        }
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
          )}

          {/* Edit Event Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update the event details and validate the data before import.
                </DialogDescription>
              </DialogHeader>
              
              {editingEvent && (
                <div className="space-y-4">
                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="event-name">Event Name *</Label>
                    <Input
                      id="event-name"
                      value={editingEvent.name}
                      onChange={(e) => setEditingEvent({...editingEvent, name: e.target.value})}
                      placeholder="Enter event name"
                    />
                  </div>

                  {/* Event Type */}
                  <div className="space-y-2">
                    <Label htmlFor="event-type">Event Type</Label>
                    <Select
                      value={editingEvent.eventType}
                      onValueChange={(value) => setEditingEvent({...editingEvent, eventType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={editingEvent.startDate ? editingEvent.startDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : new Date();
                        setEditingEvent({...editingEvent, startDate: date, endDate: editingEvent.endDate || date});
                      }}
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={editingEvent.endDate ? editingEvent.endDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : editingEvent.startDate;
                        setEditingEvent({...editingEvent, endDate: date});
                      }}
                    />
                  </div>

                  {/* Club/Zone Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="organization">Club/Zone *</Label>
                    <Select
                      value={editingEvent.clubId || editingEvent.zoneId || editingEvent.clubName || editingEvent.zoneName || ''}
                      onValueChange={(value) => {
                        // Check if it's a club
                        const selectedClub = clubs.find(club => club.id === value || club.name === value);
                        if (selectedClub) {
                          setEditingEvent({
                            ...editingEvent, 
                            clubName: selectedClub.name,
                            clubId: selectedClub.id,
                            // Clear zone selection
                            zoneName: undefined,
                            zoneId: undefined
                          });
                          return;
                        }

                        // Check if it's a zone
                        const selectedZone = zones.find(zone => zone.id === value || zone.name === value);
                        if (selectedZone) {
                          setEditingEvent({
                            ...editingEvent, 
                            zoneName: selectedZone.name,
                            zoneId: selectedZone.id,
                            // Clear club selection
                            clubName: undefined,
                            clubId: undefined
                          });
                          return;
                        }

                        // If neither found, treat as manual entry for club
                        setEditingEvent({
                          ...editingEvent, 
                          clubName: value, 
                          clubId: undefined,
                          zoneName: undefined,
                          zoneId: undefined
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select club or zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Current selection */}
                        {(editingEvent.clubName || editingEvent.zoneName) && (
                          <SelectItem value={editingEvent.clubName || editingEvent.zoneName || ''}>
                            {editingEvent.clubName 
                              ? `${editingEvent.clubName} (Club - Current)` 
                              : `${editingEvent.zoneName} (Zone - Current)`}
                          </SelectItem>
                        )}
                        
                        {/* Zones Section */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">ZONES</div>
                        {zones
                          .filter(zone => zone.name !== editingEvent.zoneName)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((zone) => (
                          <SelectItem key={`zone-${zone.id}`} value={zone.id}>
                            <span className="font-medium">{zone.name}</span> <span className="text-sm text-muted-foreground">(Zone)</span>
                          </SelectItem>
                        ))}
                        
                        {/* Clubs Section */}
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">CLUBS</div>
                        {clubs
                          .filter(club => club.name !== editingEvent.clubName)
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((club) => (
                          <SelectItem key={`club-${club.id}`} value={club.id}>
                            <span className="font-medium">{club.name}</span> <span className="text-sm text-muted-foreground">({club.zone?.name || 'No Zone'})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Or type club/zone name manually"
                      value={editingEvent.clubName || editingEvent.zoneName || ''}
                      onChange={(e) => setEditingEvent({
                        ...editingEvent, 
                        clubName: e.target.value, 
                        clubId: undefined,
                        zoneName: undefined,
                        zoneId: undefined
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-600">
                      Select either a club or a zone. Zone events are for zone-wide activities.
                    </p>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editingEvent.location || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                      placeholder="Enter event location"
                    />
                  </div>

                  {/* Coordinator */}
                  <div className="space-y-2">
                    <Label htmlFor="coordinator">Coordinator</Label>
                    <Input
                      id="coordinator"
                      value={editingEvent.coordinatorName || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, coordinatorName: e.target.value})}
                      placeholder="Enter coordinator name"
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={editingEvent.notes || ''}
                      onChange={(e) => setEditingEvent({...editingEvent, notes: e.target.value})}
                      placeholder="Enter additional notes"
                      rows={3}
                    />
                  </div>

                  {/* Qualifier Flag */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="qualifier"
                      checked={editingEvent.isQualifier || false}
                      onCheckedChange={(checked) => setEditingEvent({...editingEvent, isQualifier: checked === true})}
                    />
                    <Label htmlFor="qualifier">This is a qualifier event</Label>
                  </div>

                  {/* Validation Errors */}
                  {editingEvent.validationErrors && editingEvent.validationErrors.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Validation Issues:</strong>
                        <ul className="list-disc list-inside mt-2">
                          {editingEvent.validationErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => editingEvent && saveEditedEvent(editingEvent)}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Step 4: Import Complete */}
          {step === 4 && importResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Import Complete
                  </CardTitle>
                  <CardDescription>
                    Your calendar import has been successfully completed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{importResults.importedCount}</div>
                      <div className="text-sm text-green-800">Events Imported</div>
                    </div>
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{processedEvents.length}</div>
                      <div className="text-sm text-blue-800">Total Processed</div>
                    </div>
                    <div className="text-center p-6 bg-purple-50 rounded-lg">
                      <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{currentBatchId ? currentBatchId.slice(-8) : 'N/A'}</div>
                      <div className="text-sm text-purple-800">Batch ID</div>
                    </div>
                  </div>

                  <Alert className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Important:</strong> All imported events have been created with "approved" status. 
                      You can view and manage them in the Events section of the admin panel.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => {
                      setStep(1);
                      setProcessedEvents([]);
                      setCurrentBatchId(null);
                      setImportResults(null);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Import Another Calendar
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/admin/events'}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Events
                    </Button>
                    <Button variant="destructive" onClick={rollbackImport}>
                      <Undo2 className="h-4 w-4 mr-2" />
                      Rollback Import
                    </Button>
                  </div>
                </CardContent>
              </Card>
          )}

      </div>
    </div>
  );
}
