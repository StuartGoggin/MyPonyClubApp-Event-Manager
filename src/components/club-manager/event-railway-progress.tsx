'use client';

import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Event, EventSchedule } from '@/lib/types';

interface EventRailwayProgressProps {
  event: Event;
  schedules?: EventSchedule[];
}

export function EventRailwayProgress({ event, schedules = [] }: EventRailwayProgressProps) {
  // Determine current stage based on event status and schedule status
  const getCurrentStage = () => {
    const latestSchedule = schedules.length > 0 ? schedules[schedules.length - 1] : null;
    
    switch (event.status) {
      case 'proposed':
        return 'date-submitted';
      case 'rejected':
        return 'date-rejected';
      case 'approved':
        if (!latestSchedule) {
          return 'schedule-required';
        }
        switch (latestSchedule.status) {
          case 'pending':
            return 'schedule-submitted';
          case 'rejected':
            return 'schedule-rejected';
          case 'approved':
            return 'fully-approved';
          default:
            return 'schedule-required';
        }
      default:
        return 'date-submitted';
    }
  };

  const currentStage = getCurrentStage();
  
  // Define all possible stages in order
  const stages = [
    {
      id: 'date-submitted',
      title: 'Date Submitted',
      description: 'Event date proposal submitted',
      icon: Calendar,
      type: 'completed'
    },
    {
      id: 'date-review',
      title: 'Date Review',
      description: 'Zone manager reviewing date',
      icon: Clock,
      type: 'process'
    },
    {
      id: 'date-rejected',
      title: 'Date Rejected',
      description: 'Date requires revision',
      icon: XCircle,
      type: 'rejection',
      isLoop: true
    },
    {
      id: 'date-approved',
      title: 'Date Approved',
      description: 'Event date confirmed',
      icon: CheckCircle,
      type: 'completed'
    },
    {
      id: 'schedule-required',
      title: 'Schedule Required',
      description: 'Event schedule needs uploading',
      icon: FileText,
      type: 'action-required'
    },
    {
      id: 'schedule-submitted',
      title: 'Schedule Submitted',
      description: 'Schedule uploaded for review',
      icon: FileText,
      type: 'process'
    },
    {
      id: 'schedule-review',
      title: 'Schedule Review',
      description: 'Zone manager reviewing schedule',
      icon: Clock,
      type: 'process'
    },
    {
      id: 'schedule-rejected',
      title: 'Schedule Rejected',
      description: 'Schedule requires revision',
      icon: XCircle,
      type: 'rejection',
      isLoop: true
    },
    {
      id: 'fully-approved',
      title: 'Fully Approved',
      description: 'Event ready to proceed',
      icon: CheckCircle,
      type: 'completed'
    }
  ];

  // Determine which stages to show based on current status
  const getVisibleStages = () => {
    const mainFlow = ['date-submitted', 'date-approved', 'schedule-required', 'schedule-submitted', 'fully-approved'];
    
    // Add rejection loops if applicable
    if (currentStage === 'date-rejected' || event.status === 'rejected') {
      const index = mainFlow.indexOf('date-approved');
      mainFlow.splice(index, 0, 'date-rejected');
    }
    
    if (currentStage === 'schedule-rejected') {
      const index = mainFlow.indexOf('fully-approved');
      mainFlow.splice(index, 0, 'schedule-rejected');
    }
    
    return stages.filter(stage => mainFlow.includes(stage.id));
  };

  const visibleStages = getVisibleStages();

  const getStageStatus = (stageId: string) => {
    if (stageId === currentStage) return 'current';
    
    const stageIndex = visibleStages.findIndex(s => s.id === stageId);
    const currentIndex = visibleStages.findIndex(s => s.id === currentStage);
    
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getNextAction = () => {
    switch (currentStage) {
      case 'date-submitted':
        return 'Awaiting zone manager approval';
      case 'date-rejected':
        return 'Update event date and resubmit';
      case 'schedule-required':
        return 'Upload event schedule document';
      case 'schedule-submitted':
        return 'Awaiting schedule approval';
      case 'schedule-rejected':
        return 'Update schedule and resubmit';
      case 'fully-approved':
        return 'Event approved - ready to proceed';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="space-y-4">
      {/* Railway Progress Track - Centered and Evenly Spaced */}
      <div className="relative w-full">
        <div className="flex items-center justify-between w-full">
          {/* Track line */}
          <div className="absolute top-7 left-0 right-0 h-0.5 bg-gray-300 z-0" />
          {visibleStages.map((stage, index) => {
            const status = getStageStatus(stage.id);
            const Icon = stage.icon;
            return (
              <div key={stage.id} className="flex flex-col items-center flex-1 relative z-10">
                {/* Station */}
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mx-auto
                    ${status === 'completed'
                      ? 'bg-green-200 border-green-600 text-green-900 shadow-lg'
                      : status === 'current'
                      ? stage.type === 'rejection'
                        ? 'bg-red-100 border-red-500 text-red-700 animate-pulse'
                        : stage.type === 'action-required'
                        ? 'bg-amber-100 border-amber-500 text-amber-700 animate-pulse'
                        : 'bg-blue-100 border-blue-500 text-blue-700 animate-pulse'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {/* Station Label */}
                <div className="mt-2 text-center w-full">
                  <div className={`text-sm font-medium ${status === 'current' ? 'text-blue-700' : 'text-gray-600'}`}>{stage.title}</div>
                  {status === 'current' && (
                    <div className="text-xs text-muted-foreground mt-1">{stage.description}</div>
                  )}
                </div>
                {/* Rejection Loop Indicator */}
                {stage.isLoop && status === 'current' && (
                  <div className="absolute -top-2 -right-1">
                    <RefreshCw className="h-3 w-3 text-red-500 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status and Next Action */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {currentStage.includes('rejected') ? (
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            ) : currentStage === 'fully-approved' ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : currentStage.includes('required') ? (
              <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            )}
          </div>
          <div className="flex-grow">
            <div className="font-medium text-sm text-gray-900">
              Current Status: {visibleStages.find(s => s.id === currentStage)?.title || 'Processing'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-medium">Next Action: </span>
              {getNextAction()}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-500"></div>
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div>
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-100 border border-red-500"></div>
          <span>Requires Action</span>
        </div>
      </div>
    </div>
  );
}
