import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToStorage, validatePDFFile, deleteFileFromStorage } from '@/lib/storage';
import { createClient } from '@supabase/supabase-js';
import { sanitizeString, uuidSchema, fileSchema, checkRateLimit } from '@/lib/input-validation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userEmail = formData.get('userEmail') as string;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 });
    }

    console.log('✅ User email from request:', userEmail);

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user profile to verify and get user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role, department_id, jpn_id')
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError);
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    const user = userData;
    console.log('✅ User authenticated:', user.email, 'Role:', user.role);

    // Rate limiting per user
    const rateLimit = checkRateLimit(`upload:${user.id}`, 10, 60000) // 10 uploads per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Terlalu banyak upload. Sila cuba lagi sebentar.' 
      }, { status: 429 })
    }

    // Extract file and syorId from formData (already extracted above)
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
        error: fileValidation.error.issues[0]?.message || 'Fail tidak sah' 
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
      .select(`
        id,
        created_by,
        status_tracking(
          department_id,
          jpn_id
        )
      `)
      .eq('id', syorId)
      .single()

    if (syorError || !syorData) {
      console.error('❌ Syor not found:', syorError)
      return NextResponse.json({ error: 'Syor tidak dijumpai atau tiada akses' }, { status: 403 });
    }

    // Permission check: Admin, Peneraju, or assigned Penyelaras
    // (user already contains role, department_id, jpn_id from auth check above)
    const isAdmin = user.role === 'admin'
    const isPeneraju = user.role === 'peneraju_pemeriksaan'
    const isCreator = syorData.created_by === user.id
    
    // Check if user is assigned via status_tracking
    const statusTracking = Array.isArray(syorData.status_tracking) ? syorData.status_tracking : []
    const isAssignedPenyelarasBahagian = user.role === 'penyelaras_bahagian' && 
      statusTracking.some((st: any) => st.department_id === user.department_id)
    const isAssignedPenyelarasJPN = user.role === 'penyelaras_jpn' && 
      statusTracking.some((st: any) => st.jpn_id === user.jpn_id)

    const hasPermission = isAdmin || isPeneraju || isCreator || isAssignedPenyelarasBahagian || isAssignedPenyelarasJPN

    if (!hasPermission) {
      console.warn('⚠️ User has no permission to upload:', {
        userId: user.id,
        role: user.role,
        syorId
      })
      return NextResponse.json({ 
        error: 'Anda tidak mempunyai kebenaran untuk memuat naik dokumen ke syor ini' 
      }, { status: 403 });
    }

    console.log('✅ Permission check passed:', {
      userId: user.id,
      role: user.role,
      hasPermission: true
    })

    // Sanitize filename
    const sanitizedFileName = sanitizeString(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')

    console.log('📤 Starting file upload:', {
      fileName: sanitizedFileName,
      fileSize: file.size,
      syorId,
      userId: user.id
    })

    // Upload to Supabase Storage
    const uploadResult = await uploadFileToStorage(file, syorId, user.id);

    console.log('✅ File uploaded to Supabase Storage:', uploadResult)

    // Save document info to database, associated with the authenticated user
    const { data: docData, error: docError } = await supabase
      .from('syor_documents')
      .insert([
        {
          syor_id: syorId,
          file_name: sanitizedFileName,
          file_size: file.size,
          file_type: file.type,
          google_drive_id: uploadResult.id,       // stores storage file path
          google_drive_link: uploadResult.publicUrl, // stores signed URL
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
    console.error('❌ Upload error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    const documentIdRaw = searchParams.get('documentId');

    if (!userEmail) {
      return NextResponse.json({ error: 'User email required' }, { status: 401 });
    }

    if (!documentIdRaw) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user profile to verify
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', userEmail)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError);
      return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
    }

    const user = userData;

    // Rate limiting per user
    const rateLimit = checkRateLimit(`delete:${user.id}`, 20, 60000) // 20 deletes per minute
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Terlalu banyak permintaan. Sila cuba lagi sebentar.' 
      }, { status: 429 })
    }

    // Validate and sanitize documentId
    const documentIdValidation = uuidSchema.safeParse(sanitizeString(documentIdRaw));
    if (!documentIdValidation.success) {
      return NextResponse.json({ error: 'Document ID tidak sah' }, { status: 400 });
    }
    const documentId = documentIdValidation.data;

    // Get document info to verify ownership
    const { data: docData, error: docError } = await supabase
      .from('syor_documents')
      .select('google_drive_id, uploaded_by')
      .eq('id', documentId)
      .single();

    if (docError || !docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check for authorization: user must be owner or admin
    const isOwner = docData.uploaded_by === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Anda tidak mempunyai kebenaran' }, { status: 403 });
    }
    
    // Delete from Supabase Storage
    await deleteFileFromStorage(docData.google_drive_id);

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