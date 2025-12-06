import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { supabase } from '@/lib/supabase'
import { sendApprovalEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sanitizeString, emailSchema, passwordSchema, nameSchema, roleSchema, uuidSchema, checkRateLimit } from '@/lib/input-validation'

// Admin create user schema
const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: roleSchema,
  department_id: z.string().uuid().optional().nullable(),
  jpn_id: z.string().uuid().optional().nullable(),
  sector: z.string().min(1).max(100).optional().nullable(),
}).refine((data) => {
  if (data.role === 'penyelaras_bahagian' && !data.department_id) {
    return false
  }
  if (data.role === 'penyelaras_jpn' && !data.jpn_id) {
    return false
  }
  if (data.role === 'peneraju_pemeriksaan' && !data.sector) {
    return false
  }
  return true
}, {
  message: 'Field yang diperlukan untuk peranan ini tidak lengkap'
})

export async function POST(req: NextRequest) {
  try {
    // Check if the requester is an admin
    const userEmail = req.headers.get('x-user-email')
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: requester } = await supabase
      .from('users')
      .select('role, id')
      .eq('email', sanitizeString(userEmail.toLowerCase()))
      .single()

    if (!requester || requester.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Rate limiting per admin
    const rateLimit = checkRateLimit(`admin-create:${requester.id}`, 20, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Terlalu banyak permintaan. Sila cuba lagi sebentar.' 
      }, { status: 429 })
    }

    const body = await req.json()
    
    // Sanitize all inputs
    const sanitizedBody = {
      name: typeof body.name === 'string' ? sanitizeString(body.name) : body.name,
      email: typeof body.email === 'string' ? sanitizeString(body.email.toLowerCase()) : body.email,
      password: body.password,
      role: body.role,
      department_id: typeof body.department_id === 'string' && body.department_id.trim() !== '' ? body.department_id : null,
      jpn_id: typeof body.jpn_id === 'string' && body.jpn_id.trim() !== '' ? body.jpn_id : null,
      sector: typeof body.sector === 'string' && body.sector.trim() !== '' ? sanitizeString(body.sector) : null,
    }

    // Validate with schema
    const validation = createUserSchema.safeParse(sanitizedBody)
    if (!validation.success) {
      return NextResponse.json({ 
        error: validation.error.errors[0]?.message || 'Data tidak sah' 
      }, { status: 400 })
    }

    const { name, email, password, role, department_id, jpn_id, sector } = validation.data

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Pengguna dengan email ini sudah wujud' 
      }, { status: 400 })
    }

    // Create user in auth.users
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      return NextResponse.json({ 
        error: `Ralat mencipta akaun: ${authError.message}` 
      }, { status: 400 })
    }

    // Create user in public.users table
    const passwordHash = await bcrypt.hash(password, 10)
    
    const userData: any = {
      id: authUser.user.id,
      email,
      name,
      role,
      password_hash: passwordHash,
      is_active: true,
      is_approved: true,
      email_verified: true,
      created_at: new Date().toISOString()
    }

    // Add role-specific fields
    if (role === 'penyelaras_bahagian') {
      userData.department_id = department_id
    } else if (role === 'penyelaras_jpn') {
      userData.jpn_id = jpn_id
    } else if (role === 'peneraju_pemeriksaan') {
      userData.sector = sector
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert([userData])

    if (userError) {
      // If user creation fails, delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ 
        error: `Ralat menyimpan maklumat pengguna: ${userError.message}` 
      }, { status: 400 })
    }

    // Send approval email notification
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`
      
      await sendApprovalEmail({
        to: email,
        userName: name || email,
        userRole: role,
        loginUrl,
      })
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({ 
      message: 'Pengguna admin berjaya dicipta',
      user: userData
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      error: 'Ralat dalaman server' 
    }, { status: 500 })
  }
}