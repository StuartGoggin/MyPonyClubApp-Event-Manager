'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RequestEventHeader() {
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-background via-background/95 to-primary/5 shadow-lg backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative p-4 sm:p-6">
        {/* Header Section */}
        <div className="mb-2">
          <div className="flex items-center gap-3 mb-2 group">
            {/* Logo with beautiful effects */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg sm:rounded-xl opacity-30 blur-lg animate-pulse group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/40 backdrop-blur-sm group-hover:border-primary/60 transition-all duration-300 group-hover:scale-105 overflow-hidden h-7 sm:h-8 md:h-9 w-14 sm:w-16 md:w-18">
                <Image
                  src="/MyPonyClub - Logo - Request Event.png"
                  alt="MyPonyClub Request Event Logo"
                  fill
                  className="object-cover drop-shadow-lg transition-transform duration-300"
                  priority
                />
              </div>
            </div>
            
            {/* Title matching Event Calendar style */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-accent bg-clip-text text-transparent">
              MyPonyClub - Request Event Dates
            </h1>
            <HelpTooltip 
              content="Submit up to 4 event requests with priority rankings. Your zone coordinator will review and approve dates based on availability and policy guidelines."
              side="right"
            />
          </div>
        </div>

        {/* Collapsible Policy Toggle */}
        <div className="border-t border-border/30 pt-2">
          <Button
            variant="ghost" 
            onClick={() => setIsPolicyVisible(!isPolicyVisible)}
            className="flex items-center gap-2 w-full justify-between p-2 hover:bg-primary/5 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm sm:text-base font-medium text-foreground">
                Events Calendar Policy & Application Process
              </span>
            </div>
            {isPolicyVisible ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {/* Collapsible Policy Content */}
          {isPolicyVisible && (
            <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Application Process */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    Application Process
                  </h3>
                  <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                    <li>• Submit up to 4 event requests with priority rankings (1-4)</li>
                    <li>• Priority 1 = Highest priority, Priority 4 = Lowest priority</li>
                    <li>• Each event must have a unique priority level</li>
                    <li>• Mark events as historically traditional if applicable</li>
                  </ul>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    Timeline & Deadlines
                  </h3>
                  <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                    <li>• Applications must be submitted by required deadlines</li>
                    <li>• Events require minimum advance notice for approval</li>
                    <li>• Zone coordinators review within 2-4 weeks</li>
                    <li>• Email notifications sent upon approval/rejection</li>
                  </ul>
                </div>

                {/* Requirements */}
                <div className="space-y-3 md:col-span-2 lg:col-span-1">
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    Requirements
                  </h3>
                  <ul className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                    <li>• Complete event details and coordinator information</li>
                    <li>• Preferred dates with flexibility for adjustments</li>
                    <li>• Compliance with zone and state guidelines</li>
                    <li>• Insurance and safety requirements must be met</li>
                  </ul>
                </div>
              </div>

              {/* Important Notice */}
              <div className="mt-4 p-3 rounded-lg bg-blue-50/50 border border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-800/50">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                    <strong>Important:</strong> Please read all policy information carefully before submitting your requests. 
                    Priority rankings help zone coordinators make scheduling decisions when multiple clubs request similar dates.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}