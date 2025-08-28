import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

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
      <div className="space-y-3">
        <label htmlFor="schedule-file" className="block text-sm font-bold text-teal-800">
          Select event schedule file
        </label>
        <input 
          id="schedule-file"
          type="file" 
          accept=".pdf,.doc,.docx,.txt" 
          onChange={handleFileChange}
          className="block w-full text-sm text-teal-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-teal-300/70 file:text-sm file:font-bold file:bg-gradient-to-r file:from-teal-50 file:via-teal-100 file:to-cyan-100 file:text-teal-800 hover:file:from-teal-100 hover:file:via-teal-200 hover:file:to-cyan-200 hover:file:border-teal-400 file:shadow-md hover:file:shadow-lg file:transition-all file:duration-300 border-2 border-teal-200 rounded-xl cursor-pointer bg-teal-25 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-200"
        />
      </div>
      <Button 
        type="submit" 
        disabled={submitting || !file}
        className="distinctive-button-secondary w-full h-10 bg-gradient-to-r from-teal-50 via-teal-100 to-cyan-100 hover:from-teal-100 hover:via-teal-200 hover:to-cyan-200 border-2 border-teal-300/70 hover:border-teal-400 text-teal-800 hover:text-teal-900 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 backdrop-blur-sm"
      >
        <Upload className="h-4 w-4 mr-2 drop-shadow-sm" />
        {submitting ? 'Uploading...' : 'Upload Schedule'}
      </Button>
      {error && (
        <div className="text-red-500 bg-red-50 p-4 rounded border">
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
    </form>
  );
};
