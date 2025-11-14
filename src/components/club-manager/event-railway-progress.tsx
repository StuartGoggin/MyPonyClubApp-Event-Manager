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
        // Event submitted, now in date review
        return 'date-review';
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
  const latestSchedule = schedules.length > 0 ? schedules[schedules.length - 1] : null;
  
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
      title: 'Approval Pending',
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
      title: 'Schedule Approval Pending',
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
    let mainFlow: string[];
    
    // If event is proposed (awaiting approval), show "Approval Pending" instead of "Date Approved"
    if (event.status === 'proposed') {
      mainFlow = ['date-submitted', 'date-review', 'schedule-required', 'schedule-submitted', 'fully-approved'];
    } else {
      // Once approved, show "Date Approved"
      mainFlow = ['date-submitted', 'date-approved', 'schedule-required', 'schedule-submitted', 'fully-approved'];
    }
    
    // Add rejection loops if applicable
    if (currentStage === 'date-rejected' || event.status === 'rejected') {
      const approvalIndex = mainFlow.indexOf('date-approved');
      const reviewIndex = mainFlow.indexOf('date-review');
      const insertIndex = approvalIndex !== -1 ? approvalIndex : reviewIndex;
      if (insertIndex !== -1) {
        mainFlow.splice(insertIndex, 0, 'date-rejected');
      }
    }
    
    if (currentStage === 'schedule-rejected') {
      const index = mainFlow.indexOf('fully-approved');
      mainFlow.splice(index, 0, 'schedule-rejected');
    }
    
    return stages.filter(stage => mainFlow.includes(stage.id));
  };

  const visibleStages = getVisibleStages();

  const getStageStatus = (stageId: string) => {
    // Special handling for specific stages
    
    // Date Submitted is always green once event is submitted (proposed status)
    if (stageId === 'date-submitted' && event.status === 'proposed') {
      return 'completed';
    }
    
    // Date Review (Approval Pending) is yellow when event is proposed
    if (stageId === 'date-review' && event.status === 'proposed') {
      return 'current';
    }
    
    // Date Approved is green when event is approved
    if (stageId === 'date-approved' && event.status === 'approved') {
      return 'completed';
    }
    
    // Schedule Required logic - RED as soon as event is submitted (proposed or approved)
    if (stageId === 'schedule-required') {
      if (event.status === 'proposed' || event.status === 'approved') {
        // Red (requires action) if no schedule uploaded
        if (!latestSchedule) {
          return 'action-required';
        }
        // Green if schedule uploaded
        return 'completed';
      }
    }
    
    // Schedule Submitted is green if schedule is uploaded
    if (stageId === 'schedule-submitted' && latestSchedule) {
      return 'completed';
    }
    
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
    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h5 className="font-semibold text-blue-800">Approval Progress</h5>
      </div>
      
      {/* Railway Progress Track - Responsive Grid Layout */}
      <div className="relative w-full mb-4">
        {/* Grid container with responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6 sm:gap-x-6 lg:gap-x-8">
          {visibleStages.map((stage, index) => {
            const status = getStageStatus(stage.id);
            const Icon = stage.icon;
            const nextStage = visibleStages[index + 1];
            const hasNext = !!nextStage;
            // Check if next item is in the same row
            const currentCol = index % (5); // Adjust based on your max columns
            const nextCol = (index + 1) % (5);
            const isLastInRow = (
              (currentCol === 1 && nextCol === 0) || // 2 cols mobile: last is col 1
              (currentCol === 2 && nextCol === 0) || // 3 cols tablet: last is col 2
              (currentCol === 4 && nextCol === 0)    // 5 cols desktop: last is col 4
            );
            
            return (
              <div key={stage.id} className="relative flex flex-col items-center">
                {/* Connecting line to next station */}
                {hasNext && !isLastInRow && (
                  <>
                    {/* Desktop line */}
                    <div className="absolute left-1/2 top-6 w-full hidden lg:block pointer-events-none z-0">
                      <div className={`h-0.5 ml-6 mr-[-2rem] ${
                        status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    </div>
                    {/* Tablet line */}
                    <div className="absolute left-1/2 top-6 w-full hidden sm:block lg:hidden pointer-events-none z-0">
                      <div className={`h-0.5 ml-6 mr-[-1.5rem] ${
                        status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    </div>
                    {/* Mobile line */}
                    <div className="absolute left-1/2 top-6 w-full block sm:hidden pointer-events-none z-0">
                      <div className={`h-0.5 ml-6 mr-[-1rem] ${
                        status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                      }`} />
                    </div>
                  </>
                )}
                
                {/* Station Circle */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 sm:border-3 flex items-center justify-center mx-auto relative z-10 transition-all duration-300 bg-white
                    ${status === 'completed'
                      ? 'border-green-600 text-green-900 shadow-lg bg-green-100'
                      : status === 'action-required'
                      ? 'border-red-500 text-red-700 shadow-lg bg-red-50 ring-2 ring-red-300 ring-offset-2 animate-pulse'
                      : status === 'current'
                      ? stage.type === 'rejection'
                        ? 'border-red-500 text-red-700 shadow-lg bg-red-50 ring-2 ring-red-300 ring-offset-2 animate-pulse'
                        : 'border-yellow-500 text-yellow-700 shadow-lg bg-yellow-50 ring-2 ring-yellow-300 ring-offset-2 animate-pulse'
                      : 'border-gray-300 text-gray-500 bg-gray-50'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                
                {/* Station Label */}
                <div className="mt-2 text-center w-full px-1">
                  <div className={`text-xs sm:text-sm font-semibold leading-tight ${
                    status === 'completed' ? 'text-green-700' : 
                    status === 'action-required' ? 'text-red-700' :
                    status === 'current' ? 'text-yellow-700' : 
                    'text-gray-600'
                  }`}>{stage.title}</div>
                  {(status === 'current' || status === 'action-required') && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{stage.description}</div>
                  )}
                </div>
                
                {/* Rejection Loop Indicator */}
                {stage.isLoop && (status === 'current' || status === 'action-required') && (
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                    <RefreshCw className="h-3 w-3 text-red-500 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-blue-700 pt-3 border-t border-blue-200">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-600"></div>
          <span className="font-medium">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-50 border-2 border-yellow-500"></div>
          <span className="font-medium">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-50 border-2 border-gray-300"></div>
          <span className="font-medium">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-50 border-2 border-red-500"></div>
          <span className="font-medium">Requires Action</span>
        </div>
      </div>
    </div>
  );
}
