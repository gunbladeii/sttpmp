import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToLocalStorage, validatePDFFile, deleteFileFromLocalStorage } from '@/lib/googleDrive';
import { createServerSupabaseClient } from '@/lib/supabase';

import { createRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const syorId = formData.get('syorId') as string;

    if (!file || !syorId) {
      return NextResponse.json({ error: 'File and syor ID required' }, { status: 400 });
    }

    // Validate PDF file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Upload to local storage (or your chosen storage solution)
    const uploadResult = await uploadFileToLocalStorage(file, file.name, syorId);

    // Save document info to database, associated with the authenticated user
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
          uploaded_by: user.id, // Securely use the authenticated user's ID
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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document info to verify ownership
    const { data: docData, error: docError } = await supabase
      .from('syor_documents')
      .select('google_drive_id, uploaded_by')
      .eq('id', documentId)
      .single();

    if (docError || !docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get the current user's profile to check their role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Check for authorization: user must be owner or admin
    const isOwner = docData.uploaded_by === user.id;
    const isAdmin = userProfile.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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