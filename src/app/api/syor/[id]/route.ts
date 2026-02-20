import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * DELETE /api/syor/[id]
 * Admin-only endpoint to delete a syor and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: syorId } = await params;
    
    if (!syorId) {
      return NextResponse.json({ error: 'Syor ID diperlukan' }, { status: 400 });
    }

    // Get user email from query params (sent by client)
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 });
    }

    // Use service role key for admin operations
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseKey) {
      console.error('❌ No Supabase key available');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createServerSupabaseClient(supabaseKey);

    // Get user details from database by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, role, email')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('❌ User fetch error:', userError);
      return NextResponse.json({ error: 'Pengguna tidak dijumpai' }, { status: 404 });
    }

    // Authorization check - only admin can delete
    if (userData.role !== 'admin') {
      console.warn('⚠️ Non-admin attempted to delete syor:', {
        userId: userData.id,
        userName: userData.name,
        role: userData.role,
        syorId
      });
      return NextResponse.json({ 
        error: 'Akses ditolak. Hanya admin boleh memadam syor.' 
      }, { status: 403 });
    }

    // Verify syor exists before deletion
    const { data: syorData, error: syorCheckError } = await supabase
      .from('syor')
      .select('id, title, created_by, created_at')
      .eq('id', syorId)
      .single();

    if (syorCheckError || !syorData) {
      console.error('❌ Syor not found:', syorCheckError);
      return NextResponse.json({ error: 'Syor tidak dijumpai' }, { status: 404 });
    }

    console.log('🗑️ Admin deleting syor:', {
      adminId: userData.id,
      adminName: userData.name,
      syorId,
      syorTitle: syorData.title,
      createdBy: syorData.created_by,
      createdAt: syorData.created_at
    });

    // Step 1: Delete related notifications (syor_id is nullable, so we can set to null or delete)
    // We'll delete them to clean up orphaned notifications
    const { error: notifDeleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('syor_id', syorId);

    if (notifDeleteError) {
      console.error('❌ Failed to delete notifications:', notifDeleteError);
      // Continue anyway - notifications are not critical
    } else {
      console.log('✅ Notifications deleted for syor:', syorId);
    }

    // Step 2: Delete related documents (if syor_documents table exists)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: docsDeleteError } = await (supabase as any)
        .from('syor_documents')
        .delete()
        .eq('syor_id', syorId);

      if (docsDeleteError) {
        console.warn('⚠️ Failed to delete documents (table may not exist):', docsDeleteError);
      } else {
        console.log('✅ Documents deleted for syor:', syorId);
      }
    } catch (err) {
      console.warn('⚠️ Documents table not accessible:', err);
    }

    // Step 3: Delete the syor
    // Note: status_tracking will be automatically deleted via ON DELETE CASCADE
    const { error: syorDeleteError } = await supabase
      .from('syor')
      .delete()
      .eq('id', syorId);

    if (syorDeleteError) {
      console.error('❌ Failed to delete syor:', syorDeleteError);
      return NextResponse.json({ 
        error: 'Gagal memadam syor',
        details: syorDeleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Syor deleted successfully:', syorId);

    // Step 4: Create audit log entry
    try {
      const { error: auditError } = await supabase
        .from('audit_logs')
        .insert({
          user_id: userData.id,
          action: 'delete',
          table_name: 'syor',
          record_id: syorId,
          changes: {
            deleted_syor: {
              id: syorData.id,
              title: syorData.title,
              created_by: syorData.created_by,
              created_at: syorData.created_at
            },
            deleted_by: {
              id: userData.id,
              name: userData.name,
              email: userData.email
            }
          }
        });

      if (auditError) {
        console.warn('⚠️ Failed to create audit log:', auditError);
        // Don't fail the request if audit logging fails
      }
    } catch (err) {
      console.warn('⚠️ Audit logging error:', err);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Syor berjaya dipadam',
      deletedId: syorId
    });

  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/syor/[id]:', error);
    return NextResponse.json({ 
      error: 'Ralat tidak dijangka berlaku',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
