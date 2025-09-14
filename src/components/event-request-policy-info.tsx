'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Calendar, Clock, Users, FileText, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export function EventRequestPolicyInfo() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>Events Calendar Policy & Application Process</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Please read the following policy information before submitting your event requests.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Request Process */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Application Process
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Submit up to 4 event requests with priority rankings (1-4)</li>
              <li>• Priority 1 = Highest priority, Priority 4 = Lowest priority</li>
              <li>• Each event must have a unique priority level</li>
              <li>• Provide preferred date for each event</li>
              <li>• Mark events as historically traditional if applicable</li>
              <li>• Include detailed event information and coordinator details</li>
            </ul>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Timeline & Deadlines
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Applications must be submitted by required deadlines</li>
              <li>• Events require minimum advance notice for approval</li>
              <li>• Zone approval process may take several weeks</li>
              <li>• Priority ranking helps with scheduling conflicts</li>
              <li>• Approved events will be added to the calendar</li>
            </ul>
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Event Requirements
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Must be registered Pony Club events</li>
              <li>• Require designated event coordinator</li>
              <li>• Must specify if event is a qualifier</li>
              <li>• Location must be confirmed and accessible</li>
              <li>• Insurance and safety requirements must be met</li>
            </ul>
          </div>

          {/* Approval Criteria */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              Approval Criteria
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• No conflicts with existing zone events</li>
              <li>• Compliance with Pony Club regulations</li>
              <li>• Adequate preparation time provided</li>
              <li>• Resource availability considered</li>
              <li>• Priority ranking influences final selection</li>
              <li>• Historical traditional events given special consideration</li>
            </ul>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium text-blue-900">Historical Traditional Events</h4>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 rounded-full p-2">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-amber-800 mb-2">What are Historical Traditional Events?</h5>
                <p className="text-sm text-amber-700 mb-3">
                  Events that have been consistently held on the same date or time period for multiple years, 
                  establishing a tradition within your club or the broader Pony Club community.
                </p>
                <div className="text-sm text-amber-700">
                  <strong>Examples:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Annual Club Championships held every first Saturday in March</li>
                    <li>Traditional Hunter Trials held during Easter holidays</li>
                    <li>Memorial events held on specific commemorative dates</li>
                    <li>Seasonal events tied to specific calendar periods</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Priority System Explanation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-red-100 p-2 rounded border-l-4 border-red-500">
              <div className="font-medium text-red-800">Priority 1</div>
              <div className="text-red-600">Must Have</div>
            </div>
            <div className="bg-orange-100 p-2 rounded border-l-4 border-orange-500">
              <div className="font-medium text-orange-800">Priority 2</div>
              <div className="text-orange-600">High Importance</div>
            </div>
            <div className="bg-yellow-100 p-2 rounded border-l-4 border-yellow-500">
              <div className="font-medium text-yellow-800">Priority 3</div>
              <div className="text-yellow-600">Would Like</div>
            </div>
            <div className="bg-green-100 p-2 rounded border-l-4 border-green-500">
              <div className="font-medium text-green-800">Priority 4</div>
              <div className="text-green-600">If Possible</div>
            </div>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Note:</strong> This information is based on the Events Calendar Policy and Date Application 2025. 
            For complete details, please refer to the official policy document or contact your Zone Representative.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}