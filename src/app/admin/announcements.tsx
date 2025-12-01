"use client";
"use client";

import { useState, useEffect } from "react";
import AnnouncementBox, { Announcement } from "@/components/AnnouncementBox";
import { useAnnouncementApi } from "@/hooks/useAnnouncementApi";
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
      fetchAnnouncements().then(setAnnouncements);
    }
  }

  async function handleDelete(id: number) {
    if (confirm("Padam pengumuman ini?")) {
       const success = await deleteAnnouncement(id.toString());
      if (success) fetchAnnouncements().then(setAnnouncements);
    }
  }

  async function handlePublish(id: number, published: boolean) {
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

  return (
    <div className="max-w-4xl mx-auto py-10 px-6">
      <h2 className="text-3xl font-bold mb-8 text-white">Pengurusan Hebahan / Pengumuman</h2>
      {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
      
      <form onSubmit={handleSubmit} className="mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 space-y-5">
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
        
        <button 
          type="submit" 
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed" 
          disabled={loading}
        >
          {loading ? "⏳ Menyimpan..." : "➕ Tambah Hebahan"}
        </button>
      </form>

      {/* Edit form */}
      {editId && (
        <form onSubmit={handleEditSubmit} className="mb-8 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-5 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            ✏️ Edit Pengumuman
          </h3>
          
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

      {/* List announcements with actions */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white mb-4">📋 Senarai Pengumuman</h3>
        {announcements.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl text-white text-center font-semibold shadow-lg">
            📭 Tiada pengumuman terkini.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex gap-4 mb-4">
                {a.image_url && (
                  <img src={a.image_url} alt="Gambar" className="w-40 h-40 object-cover rounded-lg shadow-md flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-gray-900 mb-2">{a.title}</h4>
                  <div 
                    className="text-gray-800 leading-relaxed" 
                    style={{ color: '#1f2937' }}
                    dangerouslySetInnerHTML={{ __html: a.description || '' }} 
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                <button 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors shadow-md flex items-center gap-2" 
                  onClick={() => startEdit(a)}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md flex items-center gap-2" 
                  onClick={() => handleDelete(a.id)}
                >
                  🗑️ Padam
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-colors shadow-md flex items-center gap-2 ${
                    a.published 
                      ? 'bg-gray-500 hover:bg-gray-600 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`} 
                  onClick={() => handlePublish(a.id, !a.published)}
                >
                  {a.published ? '👁️ Unpublish' : '📢 Publish'}
                </button>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t border-gray-100">
                <span className={`px-3 py-1 rounded-full font-medium ${
                  a.published 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {a.published ? '✅ Telah diterbitkan' : '⏳ Belum diterbitkan'}
                </span>
                <span>📅 {new Date(a.created_at).toLocaleString('ms-MY', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
