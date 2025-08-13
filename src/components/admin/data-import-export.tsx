'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DataImportExportProps<T> {
  data: T[];
  entityName: string;
  filename: string;
  columns: Array<{
    key: string; // Changed from keyof T to string to support nested keys
    label: string;
    required?: boolean;
  }>;
  onImport: (data: T[]) => void;
  generateId?: () => string;
  compareFunction?: (existing: T, imported: Partial<T>) => boolean;
}

export function DataImportExport<T extends { id: string }>({
  data,
  entityName,
  filename,
  columns,
  onImport,
  generateId = () => crypto.randomUUID(),
  compareFunction
}: DataImportExportProps<T>) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState<Array<{ data: Partial<T>; exists: boolean; selected: boolean }>>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default compare function if none provided
  const defaultCompareFunction = (existing: T, imported: Partial<T>): boolean => {
    return Object.keys(imported).every(key => {
      const importedValue = imported[key as keyof T];
      const existingValue = existing[key as keyof T];
      return importedValue === existingValue;
    });
  };

  const compare = compareFunction || defaultCompareFunction;

  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to set nested property value
  const setNestedValue = (obj: any, path: string, value: any): void => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  };

  const handleExport = () => {
    const exportData = data.map(item => {
      const exportItem: any = {};
      columns.forEach(col => {
        const value = getNestedValue(item, col.key);
        exportItem[col.key] = value;
      });
      return exportItem;
    });

    const csvContent = [
      // Header row
      columns.map(col => col.label).join(','),
      // Data rows
      ...exportData.map(item => 
        columns.map(col => {
          const value = item[col.key];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          setImportErrors(['File must contain header row and at least one data row']);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const expectedHeaders = columns.map(col => col.label);
        
        // Validate headers
        const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          setImportErrors([`Missing required columns: ${missingHeaders.join(', ')}`]);
          return;
        }

        const errors: string[] = [];
        const parsedData: Array<{ data: Partial<T>; exists: boolean; selected: boolean }> = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length !== headers.length) {
            errors.push(`Row ${i}: Expected ${headers.length} columns, got ${values.length}`);
            continue;
          }

          const rowData: Partial<T> = {};
          let hasRequiredFields = true;

          columns.forEach((col, index) => {
            const headerIndex = headers.indexOf(col.label);
            if (headerIndex !== -1) {
              const value = values[headerIndex];
              if (col.required && !value) {
                errors.push(`Row ${i}: Missing required field '${col.label}'`);
                hasRequiredFields = false;
              }
              
              if (value) {
                // Handle numeric fields for latitude/longitude
                if ((col.key === 'latitude' || col.key === 'longitude')) {
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue)) {
                    setNestedValue(rowData, col.key, numValue);
                  }
                } else {
                  setNestedValue(rowData, col.key, value);
                }
              }
            }
          });

          if (hasRequiredFields) {
            // Check if this data already exists
            const exists = data.some(existing => compare(existing, rowData));
            parsedData.push({
              data: rowData,
              exists,
              selected: !exists // Only select non-existing items by default
            });
          }
        }

        setImportErrors(errors);
        setImportData(parsedData);
        setIsImportDialogOpen(true);
      } catch (error) {
        setImportErrors(['Failed to parse CSV file. Please check the format.']);
      }
    };

    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = () => {
    const selectedItems = importData
      .filter(item => item.selected && !item.exists)
      .map(item => ({
        ...item.data,
        id: generateId()
      } as T));

    onImport(selectedItems);
    setIsImportDialogOpen(false);
    setImportData([]);
    setImportErrors([]);
  };

  const toggleSelection = (index: number) => {
    setImportData(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleSelectAll = () => {
    const availableItems = importData.filter(item => !item.exists);
    const allSelected = availableItems.every(item => item.selected);
    
    setImportData(prev => prev.map(item => 
      item.exists ? item : { ...item, selected: !allSelected }
    ));
  };

  const newItemsCount = importData.filter(item => !item.exists).length;
  const existingItemsCount = importData.filter(item => item.exists).length;
  const selectedCount = importData.filter(item => item.selected && !item.exists).length;

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export {entityName}
        </Button>
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          variant="outline" 
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import {entityName}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Import {entityName} Data
            </DialogTitle>
            <DialogDescription>
              Review the data below and select which items you want to import.
            </DialogDescription>
          </DialogHeader>

          {importErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {importErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {newItemsCount} new items
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    {existingItemsCount} existing items (will be skipped)
                  </span>
                </div>
                {newItemsCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleSelectAll}
                  >
                    {importData.filter(item => !item.exists).every(item => item.selected) 
                      ? 'Deselect All' 
                      : 'Select All New'
                    }
                  </Button>
                )}
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Import</TableHead>
                      <TableHead className="w-20">Status</TableHead>
                      {columns.map(col => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Checkbox
                            checked={item.selected}
                            disabled={item.exists}
                            onCheckedChange={() => toggleSelection(index)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.exists ? "secondary" : "default"}>
                            {item.exists ? 'Exists' : 'New'}
                          </Badge>
                        </TableCell>
                        {columns.map(col => (
                          <TableCell key={col.key}>
                            {String(getNestedValue(item.data, col.key) || '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={selectedCount === 0}
            >
              Import {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
