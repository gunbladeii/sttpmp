import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: syorId } = await params;
    
    if (!syorId) {
      return NextResponse.json({ error: 'Syor ID required' }, { status: 400 });
    }

    // Use service role if available, otherwise use anon key
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('No Supabase key available');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createServerSupabaseClient(supabaseKey);

    // Query syor_documents table (bypassing type checking as table not in generated types yet)
    const { data, error } = await (supabase as any)
      .from('syor_documents')
      .select(`
        id,
        file_name,
        file_size,
        google_drive_link,
        uploaded_at,
        uploader:uploaded_by(name)
      `)
      .eq('syor_id', syorId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: 'Failed to fetch documents', details: error.message }, { status: 500 });
    }

    const documents = data?.map((doc: any) => ({
      id: doc.id,
      fileName: doc.file_name,
      fileSize: doc.file_size,
      googleDriveLink: doc.google_drive_link,
      uploadedAt: doc.uploaded_at,
      uploader: doc.uploader
    })) || [];

    return NextResponse.json({ documents });

  } catch (error) {
    console.error('API error:', error);
    // If table doesn't exist or connection fails, return empty documents
    // This is acceptable as documents feature is optional
    return NextResponse.json({ documents: [] });
  }
}