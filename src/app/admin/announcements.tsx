"use client";

import { useState, useEffect } from "react";
import AnnouncementBox from "@/components/AnnouncementBox";
import { useAnnouncementApi, type Announcement } from "@/hooks/useAnnouncementApi";
import { useAuth } from "@/hooks/useAuthSimple";
import TipTapEditor from '@/components/TipTapEditor';

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: ""
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", image_url: "" });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const {
    loading,
    error,
    fetchAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
  } = useAnnouncementApi();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchAnnouncements().then(setAnnouncements);
    }
  }, [authLoading, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const success = await addAnnouncement(form);
    if (success) {
       setForm({ title: "", description: "", image_url: "" });
       setShowCreateForm(false);
      fetchAnnouncements().then(setAnnouncements);
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Padam pengumuman ini?")) {
       const success = await deleteAnnouncement(id);
      if (success) fetchAnnouncements().then(setAnnouncements);
    }
  }

  async function handlePublish(id: string, published: boolean) {
    const success = await publishAnnouncement(id, published);
    if (success) fetchAnnouncements().then(setAnnouncements);
  }

  function startEdit(a: Announcement) {
    setEditId(a.id);
    setEditForm({ title: a.title, description: a.description || "", image_url: a.image_url || "" });
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editId) {
      const success = await updateAnnouncement({ id: editId, ...editForm });
      if (success) {
        setEditId(null);
        fetchAnnouncements().then(setAnnouncements);
      }
    }
  }

  // Helper functions
  const extractFirstImage = (html: string) => {
    // Try multiple patterns to handle different HTML formats
    const patterns = [
      /<img[^>]+src=["']([^"'>]+)["']/i,  // Standard: src="URL" or src='URL'
      /<img[^>]+src=([^\s>]+)/i,           // No quotes: src=URL
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        console.log('✅ Image extracted from HTML:', match[1]);
        return match[1];
      }
    }
    
    console.warn('⚠️ No image found in HTML:', html.substring(0, 200));
    return null;
  };

  const removeImages = (html: string) => {
    return html.replace(/<img[^>]*>/g, '');
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    const stripped = stripHtml(text);
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength).trim() + '...';
  };

  // Pagination
  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const paginatedAnnouncements = announcements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <div className="max-w-6xl mx-auto py-6 sm:py-8 md:py-10 px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-white">Pengurusan Hebahan / Pengumuman</h2>
        {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
        
        {/* Create Button */}
        {!showCreateForm && !editId && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2 sm:gap-3 text-base sm:text-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Cipta Pengumuman Baharu
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <form onSubmit={handleSubmit} className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                ✨ Cipta Pengumuman Baharu
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setForm({ title: "", description: "", image_url: "" });
                }}
                className="text-white hover:text-red-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Tajuk Pengumuman</label>
              <input
                type="text"
                placeholder="Masukkan tajuk pengumuman..."
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Deskripsi</label>
              <TipTapEditor value={form.description} onChange={val => setForm({ ...form, description: val })} />
            </div>
            
            <div className="flex gap-3">
              <button 
                type="submit" 
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? "⏳ Menyimpan..." : "➕ Tambah Hebahan"}
              </button>
              <button 
                type="button" 
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors shadow-lg" 
                onClick={() => {
                  setShowCreateForm(false);
                  setForm({ title: "", description: "", image_url: "" });
                }}
              >
                ❌ Batal
              </button>
            </div>
          </form>
        )}

        {/* Edit form */}
        {editId && (
          <form onSubmit={handleEditSubmit} className="mb-8 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                ✏️ Edit Pengumuman
              </h3>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="text-gray-600 hover:text-red-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Tajuk Pengumuman</label>
              <input
                type="text"
                placeholder="Masukkan tajuk pengumuman..."
                className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={editForm.title}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Deskripsi</label>
              <TipTapEditor value={editForm.description} onChange={val => setEditForm({ ...editForm, description: val })} />
            </div>
            
            <div className="flex gap-3">
              <button 
                type="submit" 
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                ✅ Simpan Perubahan
              </button>
              <button 
                type="button" 
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors shadow-lg" 
                onClick={() => setEditId(null)}
              >
                ❌ Batal
              </button>
            </div>
          </form>
        )}

        {/* List announcements */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            📋 Senarai Pengumuman
          </h3>
          
          {announcements.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl text-white text-center font-semibold shadow-lg">
              📭 Tiada pengumuman terkini.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedAnnouncements.map(a => {
                  const imageUrl = a.image_url || extractFirstImage(a.description || '');
                  const contentWithoutImages = removeImages(a.description || '');
                  const previewText = truncateText(contentWithoutImages, 120);
                  const needsTruncation = stripHtml(contentWithoutImages).length > 120;
                  
                  // Debug: Log image URL extraction
                  if (imageUrl) {
                    console.log('📸 Admin announcement image URL:', { title: a.title, imageUrl });
                  }
                  
                  return (
                    <div key={a.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-48">
                      <div className="flex gap-4 h-full p-4">
                        {/* Image Section - Fixed size */}
                        {imageUrl && (
                          <div className="w-36 h-full relative flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                            <img
                              src={imageUrl}
                              alt={a.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('❌ Image failed to load:', imageUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                              onLoad={() => console.log('✅ Image loaded:', imageUrl)}
                              crossOrigin="anonymous"
                            />
                          </div>
                        )}
                        
                        {/* Content Section */}
                        <div className="flex-1 flex flex-col min-h-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1">{a.title}</h4>
                            <span className={`px-3 py-1 rounded-full font-medium text-xs whitespace-nowrap ${
                              a.published 
                                ? 'bg-green-100 text-green-700 border border-green-300' 
                                : 'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {a.published ? '✅ Published' : '⏳ Draft'}
                            </span>
                          </div>
                          
                          <div className="text-gray-700 text-sm leading-relaxed mb-2 flex-1 overflow-hidden">
                            <p className="line-clamp-2">{previewText}</p>
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
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200 mt-auto">
                            <button 
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg font-medium transition-colors shadow-sm flex items-center gap-1" 
                              onClick={() => startEdit(a)}
                            >
                              ✏️ Edit
                            </button>
                            <button 
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg font-medium transition-colors shadow-sm flex items-center gap-1" 
                              onClick={() => handleDelete(a.id)}
                            >
                              🗑️ Padam
                            </button>
                            <button 
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shadow-sm flex items-center gap-1 ${
                                a.published 
                                  ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`} 
                              onClick={() => handlePublish(a.id, !a.published)}
                            >
                              {a.published ? '👁️ Unpublish' : '📢 Publish'}
                            </button>
                            <span className="text-xs text-gray-500 ml-auto self-center">
                              📅 {new Date(a.created_at).toLocaleDateString('ms-MY', { 
                                day: '2-digit', 
                                month: 'short', 
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20"
                  >
                    ← Sebelum
                  </button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg transition-all font-semibold ${
                          currentPage === page 
                            ? 'bg-blue-500 text-white shadow-lg' 
                            : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/20"
                  >
                    Seterusnya →
                  </button>
                </div>
              )}
            </>
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
              {/* Image if exists - MINIMAL SIZE */}
              {selectedAnnouncement.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden flex justify-center bg-gray-50">
                  <img
                    src={selectedAnnouncement.image_url}
                    alt={selectedAnnouncement.title}
                    style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                    className="rounded-lg"
                  />
                </div>
              )}

              {/* Full Content */}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.description || '' }}
              />
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  {new Date(selectedAnnouncement.created_at).toLocaleDateString('ms-MY', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                  selectedAnnouncement.published 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedAnnouncement.published ? '✅ Published' : '⏳ Draft'}
                </span>
              </div>
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
        .prose img {
          max-width: 100% !important;
          max-height: 200px !important;
          height: auto !important;
          border-radius: 8px;
          margin: 0.5em auto;
          display: block;
          object-fit: contain;
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
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #111827 !important;
        }
        .prose ul, .prose ol {
          color: #374151 !important;
        }
        .prose li {
          color: #374151 !important;
        }
      `}</style>
    </>
  );
}
