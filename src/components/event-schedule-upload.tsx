import React, { useState } from 'react';

interface EventScheduleUploadProps {
  eventId: string;
  onUploadSuccess?: (schedule: any) => void;
}

export const EventScheduleUpload: React.FC<EventScheduleUploadProps> = ({ eventId, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('submittedBy', 'currentUser'); // Replace with actual user info
    try {
      // Back to Firebase Storage (we'll handle setup properly)
      const res = await fetch(`/api/events/${eventId}/schedule/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && onUploadSuccess) {
        onUploadSuccess(data.schedule);
        setFile(null); // Clear the file input
      } else if (data.instructions) {
        // Special handling for Firebase Storage setup error
        setError(`${data.error}: ${data.details}\n\nSetup Instructions:\n${data.instructions.join('\n')}`);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleFileChange} />
      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? 'Uploading...' : 'Upload Schedule'}
      </button>
      {error && (
        <div className="text-red-500 bg-red-50 p-4 rounded border">
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
    </form>
  );
};
