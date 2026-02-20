'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuthSimple';

interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  googleDriveLink: string;
  uploadedAt: string;
  uploader?: {
    name: string;
  };
}

interface DocumentListProps {
  documents: Document[];
  onDocumentDeleted: (documentId: string) => void;
  canDelete: boolean;
}

export default function DocumentList({ documents, onDocumentDeleted, canDelete }: DocumentListProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ms-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Adakah anda pasti untuk memadam dokumen ini?')) return;

    setDeleting(documentId);

    try {
      // Check if user is authenticated with our custom auth system
      if (!user) {
        alert('Sila log masuk semula');
        return;
      }

      const response = await fetch(`/api/upload-document?documentId=${documentId}&userEmail=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memadam dokumen');
      }

      onDocumentDeleted(documentId);

    } catch (error) {
      console.error('Delete error:', error);
      alert('Ralat semasa memadam dokumen');
    } finally {
      setDeleting(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Tiada dokumen sokongan dimuat naik</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-700/30">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white">{doc.fileName}</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Saiz: {formatFileSize(doc.fileSize)}</p>
                <p>Dimuat naik: {formatDate(doc.uploadedAt)}</p>
                {doc.uploader && <p>Oleh: {doc.uploader.name}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={doc.googleDriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg"
            >
              Lihat PDF
            </a>
            
            {canDelete && (
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deleting === doc.id}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 shadow-lg"
              >
                {deleting === doc.id ? (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    <span>Padam</span>
                  </div>
                ) : (
                  'Padam'
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}