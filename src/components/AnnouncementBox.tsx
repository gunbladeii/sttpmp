"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Database } from '@/types/database.types';

type Announcement = Database['public']['Tables']['announcements']['Row'];

const AnnouncementBox: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const itemsPerPage = 5;

  // Extract first image from HTML content
  const extractFirstImage = (html: string) => {
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = html.match(imgRegex);
    return match ? match[1] : null;
  };

  // Remove all images from HTML content
  const removeImages = (html: string) => {
    return html.replace(/<img[^>]*>/g, '');
  };

  // Strip HTML tags for preview
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') {
      // Server-side: use regex fallback
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    }
    // Client-side: use DOM parser
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Truncate text with character limit
  const truncateText = (text: string, maxLength: number = 150) => {
    const stripped = stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength).trim() + '...';
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        
        // Get total count
        const { count } = await supabase
          .from('announcements')
          .select('*', { count: 'exact', head: true })
          .eq('published', true);
        
        if (count !== null) setTotalCount(count);

        // Get paginated data
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, description, image_url, published, author_id, created_at, updated_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
        
        if (error) {
          console.error('Error fetching announcements:', error);
          setAnnouncements([]);
        } else if (data) {
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnnouncements();
  }, [currentPage]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="text-white/90 text-lg">Memuatkan pengumuman...</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (announcements.length === 0) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="inline-block p-4 bg-white/10 rounded-full mb-4">
              <svg className="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Tiada Pengumuman</h3>
            <p className="text-white/70">Tiada pengumuman terkini pada masa ini.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
          <div className="space-y-4">
            {announcements.map((a) => {
              const imageUrl = a.image_url || extractFirstImage(a.description || '');
              const contentWithoutImages = removeImages(a.description || '');
              const previewText = truncateText(contentWithoutImages, 150);
              const needsTruncation = stripHtml(contentWithoutImages).length > 150;
              
              return (
              <div 
                key={a.id} 
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-4 md:p-5 min-h-[16rem] md:h-64"
              >
                <div className="flex flex-col sm:flex-row gap-4 h-full">
                  {/* Image Section - Responsive size */}
                  {imageUrl && (
                    <div className="w-full sm:w-40 md:w-48 h-48 sm:h-full relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={imageUrl}
                        alt={a.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Content Section */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3 line-clamp-2">
                      {a.title}
                    </h3>
                    
                    <div className="text-gray-800 text-sm leading-relaxed mb-3 flex-1 overflow-hidden">
                      <p className="line-clamp-3">{previewText}</p>
                      {needsTruncation && (
                        <button
                          onClick={() => setSelectedAnnouncement(a)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm mt-2 inline-flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Lihat Selanjutnya
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-center pt-3 border-t border-gray-200 mt-auto">
                      <span className="text-sm text-gray-700 flex items-center gap-2" style={{ color: '#374151' }}>
                        <span className="text-lg">📅</span>
                        {new Date(a.created_at).toLocaleDateString('ms-MY', { 
                          day: '2-digit', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/20">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Sebelum
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      currentPage === page 
                        ? 'bg-blue-500 text-white font-bold' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Seterusnya →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Full Content */}
      {selectedAnnouncement && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between border-b border-blue-800">
              <h2 className="text-2xl font-bold pr-8">{selectedAnnouncement.title}</h2>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Image if exists */}
              {selectedAnnouncement.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img
                    src={selectedAnnouncement.image_url}
                    alt={selectedAnnouncement.title}
                    className="w-full h-auto max-h-96 object-contain bg-gray-100"
                  />
                </div>
              )}

              {/* Full Content */}
              <div 
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.description || '' }}
              />
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-lg">📅</span>
                {new Date(selectedAnnouncement.created_at).toLocaleDateString('ms-MY', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .prose img {
          max-width: 100% !important;
          height: auto !important;
          border-radius: 8px;
          margin: 1em 0;
        }
        .prose {
          color: #1f2937 !important;
        }
        .prose p {
          color: #374151 !important;
        }
        .prose strong {
          color: #111827 !important;
        }
        .prose em {
          color: #374151 !important;
        }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #111827 !important;
        }
        .prose ul, .prose ol {
          color: #374151 !important;
        }
        .prose li {
          color: #374151 !important;
        }
        .prose a {
          color: #2563eb !important;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default AnnouncementBox;

