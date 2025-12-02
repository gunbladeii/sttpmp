
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to get user and role from Supabase session
async function getUserRole(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    console.log('🔑 Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('❌ No Authorization header');
      return null;
    }
    
    const jwt = authHeader.replace('Bearer ', '');
    
    // Get user from JWT using anon key
    const { data, error } = await supabase.auth.getUser(jwt);
    console.log('👤 JWT user:', data?.user?.email);
    
    if (error || !data?.user) {
      console.log('❌ JWT error:', error?.message);
      return null;
    }
    
    // Get user profile from users table using service role key (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, is_active, is_approved')
      .eq('email', data.user.email)  // Use email instead of id for better matching
      .single();
    
    console.log('📋 Profile found:', profile?.email, 'Role:', profile?.role);
    
    if (profileError || !profile) {
      console.log('❌ Profile error:', profileError?.message);
      return null;
    }
    
    if (!profile.is_active) {
      console.log('❌ User not active');
      return null;
    }
    
    if (!profile.is_approved) {
      console.log('❌ User not approved');
      return null;
    }
    
    console.log('✅ User authenticated:', profile.email, 'as', profile.role);
    return profile;
  } catch (err) {
    console.error('❌ getUserRole error:', err);
    return null;
  }
}

export async function GET(req: Request) {
  console.log('📖 GET /api/announcements - Fetch announcements');
  
  const profile = await getUserRole(req);
  
  // Admin gets ALL announcements (published & unpublished) using service role
  if (profile && profile.role === 'admin') {
    console.log('✅ Admin access - fetching all announcements');
    const { data, error } = await supabaseAdmin
      .from('announcements')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Fetch error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('📦 Returning', data?.length || 0, 'announcements for admin');
    return NextResponse.json(data ?? []);
  }
  
  // Public/non-admin users only get published announcements
  console.log('👤 Public access - fetching published only');
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select(`
      *,
      author:users!author_id (
        id,
        name,
        email
      )
    `)
    .eq('published', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('❌ Fetch error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('📦 Returning', data?.length || 0, 'published announcements');
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  console.log('📝 POST /api/announcements - Create new announcement');
  
  const profile = await getUserRole(req);
  
  if (!profile) {
    console.log('❌ No profile found - unauthorized');
    return NextResponse.json({ error: 'Unauthorized - Please login again' }, { status: 403 });
  }
  
  if (profile.role !== 'admin') {
    console.log('❌ Not admin role:', profile.role);
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 });
  }
  
  const body = await req.json();
  const { title, description, image_url } = body;
  
  console.log('📄 Creating announcement:', { title, hasDescription: !!description, hasImage: !!image_url });
  
  // Use supabaseAdmin to bypass RLS
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .insert({
      title,
      description: description,  // Fixed: use 'description' not 'content'
      image_url,
      author_id: profile.id,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.log('❌ Insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('✅ Announcement created:', data?.id);
  return NextResponse.json({ success: true, data });
}

export async function PUT(req: Request) {
  console.log('✏️ PUT /api/announcements - Update announcement');
  
  const profile = await getUserRole(req);
  
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const body = await req.json();
  const { id, title, description, image_url, published } = body;
  
  // Use supabaseAdmin to bypass RLS
  const { error } = await supabaseAdmin
    .from('announcements')
    .update({
      title,
      description: description,  // Fixed: use 'description' not 'content'
      image_url,
      published: published,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) {
    console.log('❌ Update error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('✅ Announcement updated:', id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  console.log('🗑️ DELETE /api/announcements - Delete announcement');
  
  const profile = await getUserRole(req);
  
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const body = await req.json();
  const { id } = body;
  
  // Use supabaseAdmin to bypass RLS
  const { error } = await supabaseAdmin
    .from('announcements')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.log('❌ Delete error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  console.log('✅ Announcement deleted:', id);
  return NextResponse.json({ success: true });
}
