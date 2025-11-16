'use client';

import { useState } from 'react';
import Image from 'next/image';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, CheckCircle, AlertCircle, ChevronDown, ChevronUp, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function RequestEventHeader() {
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);

  return (
    <div className="space-y-6">
      {/* Modern Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-900 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative bg-white/20 backdrop-blur-sm rounded-xl overflow-hidden h-20 w-auto aspect-[16/10] flex items-center justify-center p-2">
              <Image
                src="/myponyclub-logo-request-event.png"
                alt="Request Event Logo"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white flex items-center gap-3 flex-wrap">
                Request Event Dates
                <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                  Club Request
                </Badge>
              </h1>
              <p className="text-blue-100 mt-1">
                Submit up to 4 event requests with priority rankings
              </p>
            </div>
          </div>
          
          <div className="w-full sm:w-auto">
            <HelpTooltip 
              content="Your zone coordinator will review and approve dates based on availability and policy guidelines."
              side="left"
            />
          </div>
        </div>
      </div>

      {/* Collapsible Policy Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-6">
        <Button
          onClick={() => setIsPolicyVisible(!isPolicyVisible)}
          variant="ghost"
          className="w-full sm:w-auto px-4 py-2 gap-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950 transition-all duration-200"
        >
          {isPolicyVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isPolicyVisible ? 'Hide' : 'View'} Request Policy & Guidelines
          <CalendarPlus className="h-4 w-4 ml-1 text-blue-600" />
        </Button>
        
        {isPolicyVisible && (
          <div className="mt-6 space-y-6 animate-in fade-in-50 slide-in-from-top-5 duration-300">
            {/* Policy Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Application Process */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border-l-4 border-blue-500 shadow-md hover:shadow-lg transition-all duration-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-2 text-blue-600 dark:text-blue-400">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Application Process</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">•</span>
                    <span>Submit up to 4 event requests with priority rankings (1-4)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">•</span>
                    <span>Priority 1 = Highest priority, Priority 4 = Lowest priority</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">•</span>
                    <span>Each event must have a unique priority level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-medium">•</span>
                    <span>Mark events as historically traditional if applicable</span>
                  </li>
                </ul>
              </div>

              {/* Timeline & Deadlines */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border-l-4 border-purple-500 shadow-md hover:shadow-lg transition-all duration-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-purple-100 dark:bg-purple-900/50 p-2 text-purple-600 dark:text-purple-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Timeline & Deadlines</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-medium">•</span>
                    <span>Applications must be submitted by required deadlines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-medium">•</span>
                    <span>Events require minimum advance notice for approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-medium">•</span>
                    <span>Zone coordinators review within 2-4 weeks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 font-medium">•</span>
                    <span>Email notifications sent upon approval/rejection</span>
                  </li>
                </ul>
              </div>

              {/* Requirements */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border-l-4 border-emerald-500 shadow-md hover:shadow-lg transition-all duration-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/50 p-2 text-emerald-600 dark:text-emerald-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">Requirements</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-medium">•</span>
                    <span>Complete event details and coordinator information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-medium">•</span>
                    <span>Preferred dates with flexibility for adjustments</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-medium">•</span>
                    <span>Compliance with zone and state guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-medium">•</span>
                    <span>Insurance and safety requirements must be met</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-xl border border-blue-200 dark:border-blue-800 shadow-md p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-2.5 text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-base text-blue-900 dark:text-blue-100">Important Notes</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    Please read all policy information carefully before submitting your requests. 
                    Priority rankings help zone coordinators make scheduling decisions when multiple clubs request similar dates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}