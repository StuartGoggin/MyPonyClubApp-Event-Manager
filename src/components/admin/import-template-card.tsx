'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Info } from 'lucide-react';

export default function ImportTemplateCard() {
  const downloadTemplate = () => {
    // Create a CSV template with the required columns
    const headers = [
      'Pony Club ID',
      'First Name', 
      'Last Name',
      'Mobile Number',
      'Email',
      'Club Name',
      'Zone Name',
      'Role',
      'Membership Status'
    ];
    
    const sampleData = [
      'PC123456,John,Smith,0412345678,john.smith@email.com,Example Pony Club,Metropolitan Zone,Standard,active',
      'PC234567,Jane,Doe,0423456789,jane.doe@email.com,Another Club,Regional Zone,Zone Rep,active',
      'PC345678,Bob,Wilson,0434567890,,Historical Club,Northern Zone,Standard,historical membership'
    ];
    
    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Download Template
        </CardTitle>
        <CardDescription>
          Get a sample spreadsheet with the correct format and example data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={downloadTemplate} variant="outline" className="w-full" size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Required Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Pony Club ID</strong> - Unique identifier (e.g., PC123456)</li>
                <li>• <strong>Mobile Number</strong> - Australian format (e.g., 0412345678)</li>
                <li>• <strong>Club Name</strong> - Must exist in system</li>
                <li>• <strong>Zone Name</strong> - Must exist in system</li>
                <li>• <strong>Role</strong> - Standard, Zone Rep, Super User</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Optional Columns:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>First Name</strong> - User's given name</li>
                <li>• <strong>Last Name</strong> - User's family name</li>
                <li>• <strong>Email</strong> - Contact email address</li>
                <li>• <strong>Membership Status</strong> - active, inactive, or "historical membership"</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Import Process:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Mapping Phase</strong> - Club and zone data mapping can take 5+ minutes for large files</li>
                <li>• <strong>Historical Membership</strong> - Users with "historical membership" status will be automatically deactivated</li>
                <li>• <strong>Re-import Detection</strong> - Check "re-import" option to preserve existing roles and show changes</li>
                <li>• <strong>Progress Tracking</strong> - Real-time progress display during the entire import process</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}