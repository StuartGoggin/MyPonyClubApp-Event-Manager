import React, { useState } from 'react';

interface EventScheduleReviewProps {
  eventId: string;
  schedule: {
    id: string;
    fileUrl: string;
    fileType: string;
    status: string;
    submittedBy: string;
    reviewedBy?: string;
    reviewedAt?: string;
    notes?: string;
  };
  reviewer: string;
  onReview?: (status: string) => void;
}

export const EventScheduleReview: React.FC<EventScheduleReviewProps> = ({ eventId, schedule, reviewer, onReview }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleAction = async (action: 'approved' | 'rejected') => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/schedule/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.id,
          action,
          reviewedBy: reviewer,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success && onReview) onReview(data.status);
    } catch (err) {
      setError('Review failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <a href={schedule.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
          Download Schedule ({schedule.fileType})
        </a>
      </div>
      <div>Status: <span className="font-bold">{schedule.status}</span></div>
      <textarea
        placeholder="Review notes (optional)"
        value={notes}
        onChange={e => setNotes(e.target.value)}
        className="w-full border rounded p-2"
      />
      <div className="flex gap-2">
        <button type="button" disabled={submitting} onClick={() => handleAction('approved')} className="btn btn-success">
          Approve
        </button>
        <button type="button" disabled={submitting} onClick={() => handleAction('rejected')} className="btn btn-danger">
          Reject
        </button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};
