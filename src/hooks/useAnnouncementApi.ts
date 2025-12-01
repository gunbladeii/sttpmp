import { useState } from 'react';

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
    const headers = { ...(await getAuthHeader()), 'Content-Type': 'application/json' };
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) return true;
    setError(data.error || 'Gagal tambah pengumuman');
    return false;
  }

  async function updateAnnouncement(payload: Partial<Announcement> & { id: string }): Promise<boolean> {
    setLoading(true);
    setError(null);
    const headers = { ...(await getAuthHeader()), 'Content-Type': 'application/json' };
    const res = await fetch('/api/announcements', {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) return true;
    setError(data.error || 'Gagal update pengumuman');
    return false;
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
