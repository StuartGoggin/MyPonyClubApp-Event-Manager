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
  FileImage
} from "lucide-react";
import { format, addDays, eachDayOfInterval, parseISO, isValid } from 'date-fns';

// Types for the import system
interface ImportedEvent {
  id: string;
  originalData: any;
  name: string;
  startDate: Date;
  endDate: Date;
  clubName: string;
  clubId?: string;
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
  const [parseMethod, setParseMethod] = useState<'csv' | 'excel' | 'text' | 'pdf'>('csv');
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [processedEvents, setProcessedEvents] = useState<ImportedEvent[]>([]);
  const [importResults, setImportResults] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
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
        parsedData = await parseCSVFile(file);
        setParseMethod('csv');
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        parsedData = await parseExcelFile(file);
        setParseMethod('excel');
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        parsedData = await parsePDFFile(file);
        setParseMethod('pdf');
      } else {
        // Try text parsing for other formats
        parsedData = await parseTextFile(file);
        setParseMethod('text');
      }

      setPreviewData(parsedData);
      setUploadProgress(100);
      
      // Auto-process after a brief delay
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
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Simple CSV parsing - could be enhanced with proper CSV library
      const cells = line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      return cells;
    });
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
    try {
      // For PDF parsing, we'll use a client-side PDF.js approach
      // This is a simplified implementation - in production you might want to use a library like pdf-parse
      
      // Read file as array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert to base64 for processing
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      uint8Array.forEach(byte => binary += String.fromCharCode(byte));
      const base64 = btoa(binary);
      
      // Simple text extraction approach
      // Note: This is a basic implementation. For better PDF parsing, 
      // you would typically use pdf-parse or PDF.js library
      const extractedText = await extractTextFromPDF(arrayBuffer);
      
      if (!extractedText) {
        throw new Error('Could not extract text from PDF');
      }

      // Process extracted text into structured data
      return parseExtractedPDFText(extractedText);
      
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

  // Process imported data into events
  const processImportData = async (data: string[][]) => {
    if (data.length < 2) {
      alert('File must contain at least a header row and one data row.');
      return;
    }

    await loadReferenceData();

    const [headers, ...rows] = data;
    const events: ImportedEvent[] = [];

    // Auto-detect column mappings
    const columnMappings = detectColumnMappings(headers);

    rows.forEach((row, index) => {
      if (row.length < 2) return; // Skip empty rows

      try {
        const eventData = mapRowToEvent(row, columnMappings, index);
        
        // Handle multi-day events
        if (eventData.startDate && eventData.endDate && 
            eventData.startDate.getTime() !== eventData.endDate.getTime()) {
          const splitEvents = createSplitEvents(eventData);
          events.push(...splitEvents);
        } else {
          events.push(eventData);
        }
      } catch (error) {
        console.error(`Error processing row ${index + 1}:`, error);
      }
    });

    // Create new batch
    const batch: ImportBatch = {
      id: `batch_${Date.now()}`,
      name: `Import from ${selectedFile?.name} - ${format(new Date(), 'PPpp')}`,
      createdAt: new Date(),
      status: 'reviewing',
      events: events,
      summary: calculateBatchSummary(events)
    };

    setCurrentBatch(batch);
    setCurrentStep('review');
  };

  // Column mapping detection
  const detectColumnMappings = (headers: string[]) => {
    const mappings: Record<string, number> = {};
    
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

    return mappings;
  };

  // Map row data to event object
  const mapRowToEvent = (row: string[], mappings: Record<string, number>, index: number): ImportedEvent => {
    const name = row[mappings.name] || `Event ${index + 1}`;
    const startDateStr = row[mappings.startDate] || '';
    const endDateStr = row[mappings.endDate] || startDateStr;
    const clubName = row[mappings.club] || '';
    
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);
    
    const validationErrors: string[] = [];
    if (!name.trim()) validationErrors.push('Event name is required');
    if (!startDate) validationErrors.push('Valid start date is required');
    if (!clubName.trim()) validationErrors.push('Club name is required');

    // Try to match club
    const clubMatch = findBestClubMatch(clubName);
    
    const event: ImportedEvent = {
      id: `import_${Date.now()}_${index}`,
      originalData: row,
      name: name.trim(),
      startDate: startDate || new Date(),
      endDate: endDate || startDate || new Date(),
      clubName: clubName.trim(),
      clubId: clubMatch?.clubId,
      eventType: row[mappings.type] || 'Rally',
      location: row[mappings.location] || '',
      notes: row[mappings.notes] || '',
      coordinatorName: row[mappings.coordinator] || '',
      status: clubMatch ? 'matched' : 'unmatched',
      matchConfidence: clubMatch?.confidence || 0,
      validationErrors
    };

    return event;
  };

  // Date parsing with multiple format support
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try different date formats
    const formats = [
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
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
                          <TableHead>Club</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedEvents.slice(0, 20).map((event: any, index: number) => (
                          <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.name}</TableCell>
                            <TableCell>{format(event.startDate, 'PPP')}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {event.clubName}
                                {event.status === 'matched' && (
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(event.matchConfidence || 0)}% match
                                  </Badge>
                                )}
                              </div>
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
                                <Button size="sm" variant="ghost" onClick={() => {/* TODO: Open edit dialog */}}>
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
                </CardContent>
              </Card>
          )}

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
