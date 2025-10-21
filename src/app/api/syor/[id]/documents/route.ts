import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use service role to bypass RLS
    const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { id: syorId } = await params;
    
    if (!syorId) {
      return NextResponse.json({ error: 'Syor ID required' }, { status: 400 });
    }

    const { data, error } = await supabase
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
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    const documents = data?.map(doc => ({
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}