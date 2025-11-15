import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendDeadlineReminder } from '@/lib/email'

// This endpoint checks for syor approaching their response deadline (3 days before)
// and creates notifications for assigned penyelaras
// Email reminders will be added in Phase 4

export async function GET(request: NextRequest) {
  try {
    // Verify request is from Vercel Cron (security check)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate the date 3 days from now
    const today = new Date()
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    const targetDate = threeDaysFromNow.toISOString().split('T')[0] // Format: YYYY-MM-DD

    console.log(`🔍 Checking for syor with response_deadline on ${targetDate}`)

    // Query syor that have response_deadline exactly 3 days from now
    const { data: syorList, error: queryError } = await supabase
      .from('syor')
      .select(`
        id,
        title,
        response_deadline,
        assigned_to_department,
        assigned_to_jpn,
        department:assigned_to_department(name),
        jpn:assigned_to_jpn(name)
      `)
      .eq('response_deadline', targetDate) as { 
        data: Array<{
          id: string
          title: string
          response_deadline: string
          assigned_to_department: string | null
          assigned_to_jpn: string | null
          department?: { name: string } | null
          jpn?: { name: string } | null
        }> | null
        error: Error | null
      }

    if (queryError) {
      console.error('Error querying syor:', queryError)
      return NextResponse.json({ error: queryError.message }, { status: 500 })
    }

    if (!syorList || syorList.length === 0) {
      console.log('✅ No syor approaching deadline today')
      return NextResponse.json({ 
        message: 'No deadlines approaching',
        checked_date: targetDate,
        count: 0
      })
    }

    console.log(`📋 Found ${syorList.length} syor approaching deadline`)

    const results = []

    // Process each syor
    for (const syor of syorList) {
      try {
        // Get the assigned penyelaras (either bahagian or jpn)
        let penyelarasId = null
        let penyelarasEmail = null
        let penyelarasName = null
        let assignedTo = null

        if (syor.assigned_to_department) {
          // Get penyelaras bahagian
          const { data: penyelaras } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('role', 'penyelaras_bahagian')
            .eq('department_id', syor.assigned_to_department)
            .eq('is_active', true)
            .single()

          if (penyelaras) {
            penyelarasId = penyelaras.id
            penyelarasEmail = penyelaras.email
            penyelarasName = penyelaras.name
            assignedTo = syor.department?.name || 'Bahagian'
          }
        } else if (syor.assigned_to_jpn) {
          // Get penyelaras jpn
          const { data: penyelaras } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('role', 'penyelaras_jpn')
            .eq('jpn_id', syor.assigned_to_jpn)
            .eq('is_active', true)
            .single()

          if (penyelaras) {
            penyelarasId = penyelaras.id
            penyelarasEmail = penyelaras.email
            penyelarasName = penyelaras.name
            assignedTo = syor.jpn?.name || 'JPN'
          }
        }

        if (!penyelarasId || !penyelarasEmail) {
          console.warn(`⚠️ No active penyelaras found for syor ${syor.id}`)
          results.push({
            syor_id: syor.id,
            status: 'skipped',
            reason: 'No active penyelaras assigned'
          })
          continue
        }

        // Create notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: penyelarasId,
            type: 'deadline',
            title: 'Peringatan: Syor Hampir Tamat Tempoh',
            message: `Syor "${syor.title}" akan tamat tempoh dalam 3 hari (${targetDate}). Sila kemukakan maklum balas segera.`,
            syor_id: syor.id,
            read: false
          })

        if (notifError) {
          console.error(`Error creating notification for ${syor.id}:`, notifError)
        }

        // Send email reminder to penyelaras
        try {
          await sendDeadlineReminder({
            to: penyelarasEmail,
            penyelarasName: penyelarasName,
            syorTitle: syor.title,
            syorId: syor.id,
            responseDeadline: targetDate,
            assignedTo: assignedTo
          })
          console.log(`✅ Email reminder sent to ${penyelarasEmail} for syor ${syor.id}`)
        } catch (emailError) {
          console.error(`Error sending email to ${penyelarasEmail}:`, emailError)
          // Don't fail the entire process if email fails
        }

        console.log(`✅ Notification created for syor ${syor.id} → ${penyelarasEmail}`)

        results.push({
          syor_id: syor.id,
          syor_title: syor.title,
          penyelaras_email: penyelarasEmail,
          penyelaras_name: penyelarasName,
          assigned_to: assignedTo,
          deadline: targetDate,
          status: 'notified'
        })

      } catch (error) {
        console.error(`Error processing syor ${syor.id}:`, error)
        results.push({
          syor_id: syor.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Processed ${results.length} syor`)

    return NextResponse.json({
      message: 'Deadline check completed',
      checked_date: targetDate,
      total_found: syorList.length,
      processed: results.length,
      results
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
