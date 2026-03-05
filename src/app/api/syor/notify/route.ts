import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSyorCreatedEmail, sendTindakanEmail } from '@/lib/email'
import '@/lib/ssl-fix'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, syorId, creatorName, tindakanComments, tindakanStatus } = body

    if (!type || !syorId) {
      return NextResponse.json({ error: 'type dan syorId diperlukan' }, { status: 400 })
    }

    if (!['new_syor', 'tindakan'].includes(type)) {
      return NextResponse.json({ error: 'type mestilah new_syor atau tindakan' }, { status: 400 })
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch syor details
    const { data: syor, error: syorError } = await supabase
      .from('syor')
      .select('id, title, priority, due_date, response_deadline, creator:created_by(name)')
      .eq('id', syorId)
      .single()

    if (syorError || !syor) {
      console.error('❌ Syor not found:', syorError)
      return NextResponse.json({ error: 'Syor tidak dijumpai' }, { status: 404 })
    }

    // Find assigned departments and JPNs from status_tracking (skip null-only entries)
    const { data: statusTracking } = await supabase
      .from('status_tracking')
      .select('department_id, jpn_id')
      .eq('syor_id', syorId)

    const deptIds = [
      ...new Set(
        (statusTracking ?? [])
          .filter((st) => st.department_id)
          .map((st) => st.department_id as string)
      ),
    ]
    const jpnIds = [
      ...new Set(
        (statusTracking ?? [])
          .filter((st) => st.jpn_id)
          .map((st) => st.jpn_id as string)
      ),
    ]

    if (deptIds.length === 0 && jpnIds.length === 0) {
      console.log('ℹ️ No assigned departments/JPNs found for syor:', syorId)
      return NextResponse.json({ success: true, message: 'Tiada penyelaras yang perlu diberitahu', emailsSent: 0 })
    }

    // Collect penyelaras recipients
    type Recipient = { email: string; name: string }
    const recipients: Recipient[] = []

    if (deptIds.length > 0) {
      const { data: deptUsers } = await supabase
        .from('users')
        .select('email, name')
        .eq('role', 'penyelaras_bahagian')
        .eq('is_active', true)
        .eq('is_approved', true)
        .in('department_id', deptIds)
      if (deptUsers) recipients.push(...deptUsers)
    }

    if (jpnIds.length > 0) {
      const { data: jpnUsers } = await supabase
        .from('users')
        .select('email, name')
        .in('role', ['penyelaras_jpn', 'penyelaras_jnn'])
        .eq('is_active', true)
        .eq('is_approved', true)
        .in('jpn_id', jpnIds)
      if (jpnUsers) recipients.push(...jpnUsers)
    }

    // De-duplicate by email
    const unique = Array.from(new Map(recipients.map((r) => [r.email, r])).values())

    if (unique.length === 0) {
      console.log('ℹ️ No active penyelaras users found for syor:', syorId)
      return NextResponse.json({ success: true, message: 'Tiada penyelaras aktif dijumpai', emailsSent: 0 })
    }

    const syorUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sttpmp.vercel.app'}/syor/${syorId}`
    const creatorDisplayName = creatorName || (syor.creator as { name?: string } | null)?.name || 'Peneraju'

    const emailsSent: string[] = []
    const emailErrors: string[] = []

    for (const recipient of unique) {
      try {
        if (type === 'new_syor') {
          await sendSyorCreatedEmail({
            to: recipient.email,
            penyelarasName: recipient.name,
            syorTitle: syor.title,
            syorId: syor.id,
            priority: syor.priority,
            dueDate: syor.due_date,
            responseDeadline: syor.response_deadline,
            creatorName: creatorDisplayName,
            syorUrl,
          })
        } else {
          await sendTindakanEmail({
            to: recipient.email,
            penyelarasName: recipient.name,
            syorTitle: syor.title,
            syorId: syor.id,
            tindakanComments: tindakanComments || '',
            tindakanStatus: tindakanStatus || 'belum_selesai',
            updaterName: creatorDisplayName,
            syorUrl,
          })
        }
        emailsSent.push(recipient.email)
      } catch (err) {
        console.error(`❌ Failed to send ${type} email to ${recipient.email}:`, err)
        emailErrors.push(recipient.email)
      }
    }

    console.log(`✅ Syor notify [${type}]: ${emailsSent.length} sent, ${emailErrors.length} failed`)
    return NextResponse.json({ success: true, emailsSent: emailsSent.length, errors: emailErrors.length })
  } catch (error) {
    console.error('❌ Syor notify API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
