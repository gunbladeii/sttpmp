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

  useEffect(() => {
    const fetchAnnouncements = async () => {
      // Get total count
      const { count } = await supabase
        .from('announcements')
        .select('*', { count: 'exact', head: true })
        .eq('published', true);
      
      if (count) setTotalCount(count);

      // Get paginated data
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, description, image_url, published, author_id, created_at, updated_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      if (!error && data) {
        setAnnouncements(data);
      }
      setLoading(false);
    };
    fetchAnnouncements();
  }, [currentPage]);

  if (announcements.length === 0) {
    return (
      <div className="w-full p-4 bg-white rounded-lg shadow text-gray-500">Tiada pengumuman terkini.</div>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-2xl">
        <div className="space-y-4">
          {announcements.map((a) => {
            const imageUrl = a.image_url || extractFirstImage(a.description || '');
            const contentWithoutImages = removeImages(a.description || '');
            
            return (
            <div 
              key={a.id} 
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 p-4 md:p-5"
            >
              <div className="flex gap-4">
                {/* Image Section - Show image_url or first image from content */}
                {imageUrl && (
                  <div className="w-48 h-48 relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={a.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Content Section */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-3">
                    {a.title}
                  </h3>
                  
                  <div 
                    className="text-gray-800 text-sm leading-relaxed mb-3 prose prose-sm max-w-none flex-1" 
                    style={{ color: '#1f2937' }}
                    dangerouslySetInnerHTML={{ __html: contentWithoutImages }} 
                  />
                  
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
      
      <style jsx global>{`
        .prose img {
          max-width: 300px !important;
          height: auto !important;
          border-radius: 8px;
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  );
};

export default AnnouncementBox;
