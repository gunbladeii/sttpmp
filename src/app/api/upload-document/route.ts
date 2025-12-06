import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToLocalStorage, validatePDFFile, deleteFileFromLocalStorage } from '@/lib/googleDrive';
import { createServerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import { sanitizeString, uuidSchema, fileSchema, checkRateLimit } from '@/lib/input-validation';

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

    // Rate limiting per user
    const rateLimit = checkRateLimit(`upload:${user.id}`, 10, 60000) // 10 uploads per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Terlalu banyak upload. Sila cuba lagi sebentar.' 
      }, { status: 429 })
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const syorIdRaw = formData.get('syorId') as string;

    if (!file || !syorIdRaw) {
      return NextResponse.json({ error: 'File and syor ID required' }, { status: 400 });
    }

    // Validate and sanitize syorId
    const syorIdValidation = uuidSchema.safeParse(sanitizeString(syorIdRaw))
    if (!syorIdValidation.success) {
      return NextResponse.json({ error: 'Syor ID tidak sah' }, { status: 400 });
    }
    const syorId = syorIdValidation.data

    // Validate file metadata
    const fileValidation = fileSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type,
    })
    
    if (!fileValidation.success) {
      return NextResponse.json({ 
        error: fileValidation.error.errors[0]?.message || 'Fail tidak sah' 
      }, { status: 400 });
    }

    // Additional PDF file validation
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verify user has permission to upload to this syor
    const { data: syorData, error: syorError } = await supabase
      .from('syor')
      .select('id')
      .eq('id', syorId)
      .single()

    if (syorError || !syorData) {
      return NextResponse.json({ error: 'Syor tidak dijumpai atau tiada akses' }, { status: 403 });
    }

    // Sanitize filename
    const sanitizedFileName = sanitizeString(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')

    // Upload to local storage (or your chosen storage solution)
    const uploadResult = await uploadFileToLocalStorage(file, sanitizedFileName, syorId);

    // Save document info to database, associated with the authenticated user
    const { data: docData, error: docError } = await supabase
      .from('syor_documents')
      .insert([
        {
          syor_id: syorId,
          file_name: sanitizedFileName,
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

    // Rate limiting per user
    const rateLimit = checkRateLimit(`delete:${user.id}`, 20, 60000) // 20 deletes per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Terlalu banyak permintaan. Sila cuba lagi sebentar.' 
      }, { status: 429 })
    }

    const { searchParams } = new URL(request.url);
    const documentIdRaw = searchParams.get('documentId');

    if (!documentIdRaw) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Validate and sanitize documentId
    const documentIdValidation = uuidSchema.safeParse(sanitizeString(documentIdRaw))
    if (!documentIdValidation.success) {
      return NextResponse.json({ error: 'Document ID tidak sah' }, { status: 400 });
    }
    const documentId = documentIdValidation.data

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