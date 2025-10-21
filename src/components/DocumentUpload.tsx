'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuthSimple';

interface DocumentUploadProps {
  syorId: string;
  onUploadSuccess: (document: any) => void;
  disabled?: boolean;
}

export default function DocumentUpload({ syorId, onUploadSuccess, disabled }: DocumentUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous errors
    setError(null);

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Hanya fail PDF dibenarkan');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Saiz fail mesti kurang dari 10MB');
      return;
    }

    setUploading(true);

    try {
      if (!user) {
        setError('Sila log masuk untuk memuat naik dokumen');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('syorId', syorId);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload document');
      }

      onUploadSuccess(result.document);
      
      // Reset file input
      event.target.value = '';

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Ralat semasa memuat naik dokumen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <label className="block">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            disabled={uploading || disabled}
            className="hidden"
          />
          <div
            className={`px-4 py-2 border border-dashed rounded-lg text-center cursor-pointer transition-all duration-200 ${
              uploading || disabled
                ? 'bg-slate-800/30 cursor-not-allowed text-slate-500 border-slate-600'
                : 'bg-slate-700/30 border-slate-500 text-slate-200 hover:bg-slate-600/40 hover:border-slate-400 hover:text-white'
            }`}
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Memuat naik...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Pilih Fail PDF</span>
              </div>
            )}
          </div>
        </label>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-600/30 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="text-xs text-slate-400">
        Hanya fail PDF dibenarkan. Maksimum saiz: 10MB
      </div>
    </div>
  );
}