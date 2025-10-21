import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToLocalStorage, validatePDFFile, deleteFileFromLocalStorage } from '@/lib/googleDrive';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Use service role to bypass RLS for now since we use custom auth
    const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // For now, let's get the user from the form data or temporary bypass auth for testing
    // TODO: Implement proper session-based auth later

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const syorId = formData.get('syorId') as string;
    const userId = formData.get('userId') as string; // We'll send this from client

    if (!file || !syorId) {
      return NextResponse.json({ error: 'File and syor ID required' }, { status: 400 });
    }

    // Validate PDF file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // For testing, use a default user ID if not provided
    const defaultUserId = userId || 'c47c6c9e-8b4a-4c1a-9c1e-6e4a8b9c1d2e'; // Admin user ID from sample data

    // Upload to local storage
    const uploadResult = await uploadFileToLocalStorage(file, file.name, syorId);

    // Save document info to database
    const { data: docData, error: docError } = await supabase
      .from('syor_documents')
      .insert([
        {
          syor_id: syorId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          google_drive_id: uploadResult.id,
          google_drive_link: uploadResult.webViewLink,
          uploaded_by: defaultUserId,
          uploaded_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (docError) {
      console.error('Database error:', docError);
      return NextResponse.json({ error: 'Failed to save document info' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      document: {
        id: docData.id,
        fileName: docData.file_name,
        fileSize: docData.file_size,
        googleDriveLink: docData.google_drive_link,
        uploadedAt: docData.uploaded_at,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use service role to bypass RLS for now since we use custom auth
    const supabase = createServerSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document info
    const { data: docData, error: docError } = await supabase
      .from('syor_documents')
      .select('google_drive_id')
      .eq('id', documentId)
      .single();

    if (docError) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from local storage
    await deleteFileFromLocalStorage(docData.google_drive_id);

    // Delete from database
    const { error: deleteError } = await supabase
      .from('syor_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}