import { useState } from 'react';
import { compressHtmlImages, willExceedLimit, calculateHtmlImageSize } from '@/lib/image-compression';

export type Announcement = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  created_at: string;
  published: boolean;
};

export function useAnnouncementApi() {
  const [loading, setLoading] = useState(false); // for submit actions only
  const [fetching, setFetching] = useState(false); // for fetch only
  const [error, setError] = useState<string | null>(null);

  async function getAuthHeader() {
    // Get Supabase JWT from current session
    const { data } = await (await import('@/lib/supabase')).supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      throw new Error('Sesi tamat atau token tidak wujud. Sila login semula.');
    }
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchAnnouncements(): Promise<Announcement[]> {
    setFetching(true);
    setError(null);
    let headers = {};
    try {
      headers = await getAuthHeader();
    } catch (err: any) {
      setFetching(false);
      setError(err.message || 'Sesi tamat. Sila login semula.');
      return [];
    }
    const res = await fetch('/api/announcements', {
      method: 'GET',
      headers,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      setFetching(false);
      setError('Gagal parse data pengumuman.');
      return [];
    }
    setFetching(false);
    if (res.ok) return data;
    setError(data?.error || 'Gagal fetch pengumuman');
    return [];
  }

  async function addAnnouncement(payload: { title: string; description: string; image_url?: string }): Promise<boolean> {
    setLoading(true);
    setError(null);
    
    try {
      // 🖼️ Check if content has images and compress if needed
      const imageSize = calculateHtmlImageSize(payload.description);
      console.log(`📊 Original content image size: ${imageSize}KB`);
      
      let processedDescription = payload.description;
      
      if (imageSize > 500) { // If images > 500KB, compress
        console.log('🗜️ Compressing images to reduce payload size...');
        processedDescription = await compressHtmlImages(payload.description, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
        });
        
        const newImageSize = calculateHtmlImageSize(processedDescription);
        console.log(`✅ Compressed to ${newImageSize}KB (${Math.round((imageSize - newImageSize) / imageSize * 100)}% reduction)`);
      }
      
      // Check if still exceeds limit
      if (willExceedLimit(processedDescription, 4.0)) {
        setLoading(false);
        setError('⚠️ Kandungan terlalu besar! Sila kurangkan bilangan atau saiz imej.');
        return false;
      }
      
      const headers = { ...(await getAuthHeader()), 'Content-Type': 'application/json' };
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          description: processedDescription,
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) return true;
      setError(data.error || 'Gagal tambah pengumuman');
      return false;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Gagal tambah pengumuman');
      return false;
    }
  }

  async function updateAnnouncement(payload: Partial<Announcement> & { id: string }): Promise<boolean> {
    setLoading(true);
    setError(null);
    
    try {
      // 🖼️ Compress images if description is being updated
      let processedPayload = { ...payload };
      
      if (payload.description) {
        const imageSize = calculateHtmlImageSize(payload.description);
        console.log(`📊 Original content image size: ${imageSize}KB`);
        
        if (imageSize > 500) {
          console.log('🗜️ Compressing images to reduce payload size...');
          processedPayload.description = await compressHtmlImages(payload.description, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.8,
          });
          
          const newImageSize = calculateHtmlImageSize(processedPayload.description);
          console.log(`✅ Compressed to ${newImageSize}KB (${Math.round((imageSize - newImageSize) / imageSize * 100)}% reduction)`);
        }
        
        // Check if still exceeds limit
        if (willExceedLimit(processedPayload.description, 4.0)) {
          setLoading(false);
          setError('⚠️ Kandungan terlalu besar! Sila kurangkan bilangan atau saiz imej.');
          return false;
        }
      }
      
      const headers = { ...(await getAuthHeader()), 'Content-Type': 'application/json' };
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers,
        body: JSON.stringify(processedPayload),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok) return true;
      setError(data.error || 'Gagal update pengumuman');
      return false;
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Gagal update pengumuman');
      return false;
    }
  }

  async function deleteAnnouncement(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    const headers = { ...(await getAuthHeader()), 'Content-Type': 'application/json' };
    const res = await fetch('/api/announcements', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) return true;
    setError(data.error || 'Gagal padam pengumuman');
    return false;
  }

    async function publishAnnouncement(id: string | number, published: boolean): Promise<boolean> {
      return updateAnnouncement({ id: id.toString(), published });
  }

  return {
    loading,
    fetching,
    error,
    fetchAnnouncements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
  };
}
