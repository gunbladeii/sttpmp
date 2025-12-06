import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendRegistrationPendingEmail, sendAdminNewRegistrationEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sanitizeString, emailSchema, passwordSchema, nameSchema, roleSchema, checkRateLimit } from '@/lib/input-validation'

// Registration schema with strict validation
const registrationSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(8),
  department_id: z.string().uuid().optional().nullable(),
  jpn_id: z.string().uuid().optional().nullable(),
  requestedRole: roleSchema.optional().nullable(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password dan pengesahan password tidak sama',
  path: ['confirmPassword'],
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimit = checkRateLimit(`register:${ip}`, 5, 300000) // 5 requests per 5 minutes
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        error: 'Terlalu banyak percubaan. Sila cuba lagi dalam beberapa minit.' 
      }, { status: 429 })
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Sanitize all string inputs
    const sanitizedBody = {
      email: typeof body.email === 'string' ? sanitizeString(body.email.toLowerCase()) : body.email,
      name: typeof body.name === 'string' ? sanitizeString(body.name) : body.name,
      password: body.password,
      confirmPassword: body.confirmPassword,
      department_id: typeof body.department_id === 'string' && body.department_id.trim() !== '' ? body.department_id : null,
      jpn_id: typeof body.jpn_id === 'string' && body.jpn_id.trim() !== '' ? body.jpn_id : null,
      requestedRole: body.requestedRole || null,
    }

    // Validate with Zod schema
    const validation = registrationSchema.safeParse(sanitizedBody)
    
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      return NextResponse.json({ 
        error: firstError?.message || 'Data tidak sah' 
      }, { status: 400 })
    }

    const { email, name, password, department_id, jpn_id, requestedRole } = validation.data

    // Check if email already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'Email ini telah berdaftar. Sila gunakan email lain.' }, { status: 400 })
    }

    // Check if email already exists in Supabase Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = users.some(u => u.email === email)
    
    if (authUserExists) {
      return NextResponse.json({ error: 'Email ini telah berdaftar dalam sistem auth.' }, { status: 400 })
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user in Supabase Auth first
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Will be confirmed upon admin approval
      user_metadata: {
        name,
        requested_role: requestedRole
      }
    })

    if (authError || !authUser) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json({ 
        error: `Gagal membuat akaun auth: ${authError?.message || 'Unknown error'}` 
      }, { status: 500 })
    }

    // Insert user record in users table with auth user id
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id, // Use same ID as auth user
        email,
        name,
        role: 'pemantau', // Default role until admin approves
        password_hash: passwordHash,
        department_id: department_id && department_id.trim() !== '' ? department_id : null,
        jpn_id: jpn_id && jpn_id.trim() !== '' ? jpn_id : null,
        requested_role: requestedRole || null,
        email_verified: false,
        is_active: false,
        is_approved: false
      })

    if (insertError) {
      console.error('Registration error:', insertError)
      // Rollback auth user creation
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ 
        error: `Gagal menyimpan permohonan pendaftaran: ${insertError.message}` 
      }, { status: 500 })
    }

    // Send email notifications
    try {
      // Send confirmation email to user
      await sendRegistrationPendingEmail({
        to: email,
        userName: name
      })

      // Send notification to admins
      await sendAdminNewRegistrationEmail({
        userName: name,
        userEmail: email,
        requestedRole: requestedRole || null,
        registrationId: authUser.user.id
      })

      console.log('✅ Registration emails sent successfully')
    } catch (emailError) {
      console.error('❌ Error sending registration emails:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Permohonan pendaftaran berjaya dihantar. Sila tunggu kelulusan dari admin.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Ralat dalaman server' }, { status: 500 })
  }
}