import * as brevo from '@getbrevo/brevo'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Handle SSL certificate issues in development/corporate networks
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '')

interface EmailRecipient {
  email: string
  name?: string
}

interface SendEmailParams {
  to: EmailRecipient[] | string
  subject: string
  html?: string
  htmlContent?: string
  name?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  htmlContent,
  name = 'User'
}: SendEmailParams) {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail()
    
    // Use BREVO_SENDER_EMAIL from env
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL || 'noreply@sttpmp.com'
    const senderName = process.env.BREVO_SENDER_NAME || 'STTPMP - Jemaah Nazir'
    
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
    
    // Handle both array and string formats for 'to'
    if (Array.isArray(to)) {
      sendSmtpEmail.to = to
    } else {
      sendSmtpEmail.to = [{ email: to, name }]
    }
    
    sendSmtpEmail.subject = subject
    
    // Handle both html and htmlContent
    sendSmtpEmail.htmlContent = htmlContent || html || ''

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    console.log('✅ Email sent successfully to:', Array.isArray(to) ? to.map(t => t.email).join(', ') : to)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    throw error // Throw error so caller can handle
  }
}

interface SendApprovalEmailParams {
  to: string
  userName: string
  userRole: string
  loginUrl: string
}

export async function sendApprovalEmail({
  to,
  userName,
  userRole,
  loginUrl,
}: SendApprovalEmailParams) {
  try {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      peneraju_pemeriksaan: 'Peneraju Pemeriksaan',
      penyelaras_bahagian: 'Penyelaras Bahagian',
      penyelaras_jpn: 'Penyelaras JPN',
      penyelaras_jnn: 'Penyelaras JNN (View Only)',
      pemantau: 'Pemantau',
    }

    const roleName = roleNames[userRole] || userRole

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Akaun Diluluskan</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <!-- Logo Jemaah Nazir -->
            <div style="margin-bottom: 20px;">
              <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 80px; height: auto; display: inline-block;" />
            </div>
            <h1 style="color: #a78bfa; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">STTPMP</h1>
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 14px;">Kementerian Pendidikan Malaysia</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Success Badge -->
            <div style="background: #dcfce7; border: 2px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
              <h2 style="color: #15803d; margin: 0; font-size: 20px;">Akaun Anda Telah Diluluskan!</h2>
            </div>

            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Assalamualaikum <strong style="color: #0f172a;">${userName}</strong>,
            </p>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Tahniah! Permohonan akaun anda untuk sistem <strong>STTPMP (Dashboard Status Tindakan Terhadap Perakuan Menteri Pendidikan)</strong> telah diluluskan oleh Administrator.
            </p>

            <!-- Role Information -->
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b; font-weight: 600;">PERANAN YANG DIBERIKAN:</p>
              <p style="margin: 0; font-size: 18px; color: #1e40af; font-weight: 700;">${roleName}</p>
            </div>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Anda kini boleh log masuk ke sistem menggunakan email dan password yang telah didaftarkan.
            </p>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                🔐 Log Masuk ke STTPMP
              </a>
            </div>

            <!-- System Info -->
            <div style="background: #fef3c7; border: 1px solid #fde047; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #854d0e; font-weight: 600;">ℹ️ Maklumat Penting:</p>
              <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px; color: #92400e;">
                <li>Email: <strong>${to}</strong></li>
                <li>Peranan: <strong>${roleName}</strong></li>
                <li>Status: <strong>Aktif</strong></li>
              </ul>
            </div>

            <!-- Security Notice -->
            <div style="background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">🔒 Keselamatan Akaun:</p>
              <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.6;">
                Jangan kongsikan password anda dengan sesiapa. Sistem ini dilindungi dengan reCAPTCHA untuk keselamatan maksimum.
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="margin-top: 24px; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            <p style="margin: 0 0 8px 0;">
              Email ini dihantar secara automatik oleh sistem STTPMP.
            </p>
            <p style="margin: 0 0 16px 0;">
              Jika anda mempunyai sebarang pertanyaan, sila hubungi Administrator.
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-weight: 600; color: #475569;">
                Jemaah Nazir | Kementerian Pendidikan Malaysia
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} STTPMP - Semua hak cipta terpelihara
              </p>
            </div>
          </div>

        </body>
        </html>
      `

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL || 'noreply@sttpmp.com', name: 'STTPMP - Jemaah Nazir' }
    sendSmtpEmail.to = [{ email: to, name: userName }]
    sendSmtpEmail.subject = '✅ Akaun STTPMP Anda Telah Diluluskan'
    sendSmtpEmail.htmlContent = htmlContent

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    console.log('✅ Approval email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error sending approval email:', error)
    return { success: false, error }
  }
}

interface SendRejectionEmailParams {
  to: string
  userName: string
  reason?: string
}

export async function sendRejectionEmail({
  to,
  userName,
  reason,
}: SendRejectionEmailParams) {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL || 'noreply@sttpmp.com', name: 'STTPMP - Jemaah Nazir' }
    sendSmtpEmail.to = [{ email: to, name: userName }]
    sendSmtpEmail.subject = '❌ Permohonan Akaun STTPMP'
    sendSmtpEmail.htmlContent = `
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Permohonan Akaun</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #a78bfa; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">STTPMP</h1>
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 14px;">Kementerian Pendidikan Malaysia</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Assalamualaikum <strong style="color: #0f172a;">${userName}</strong>,
            </p>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Terima kasih atas permohonan akaun STTPMP anda. Setelah semakan, permohonan anda tidak dapat diluluskan pada masa ini.
            </p>

            ${reason ? `
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">Sebab:</p>
                <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${reason}</p>
              </div>
            ` : ''}

            <p style="font-size: 15px; color: #475569; line-height: 1.8;">
              Jika anda percaya ini adalah kesilapan atau ingin membuat rayuan, sila hubungi Administrator sistem.
            </p>

          </div>

          <!-- Footer -->
          <div style="margin-top: 24px; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">🇲🇾 Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
          </div>

        </body>
        </html>
      `

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    console.log('✅ Rejection email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error sending rejection email:', error)
    return { success: false, error }
  }
}

interface SendDeadlineReminderParams {
  to: string
  penyelarasName: string
  syorTitle: string
  syorId: string
  responseDeadline: string
  assignedTo: string
}

// Send email to user confirming registration pending approval
interface SendRegistrationPendingEmailParams {
  to: string
  userName: string
}

export async function sendRegistrationPendingEmail({
  to,
  userName,
}: SendRegistrationPendingEmailParams) {
  try {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pendaftaran Diterima</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #a78bfa; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">STTPMP</h1>
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 14px;">Kementerian Pendidikan Malaysia</p>
          </div>

          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">✅</div>
              <h2 style="color: #1e40af; margin: 0; font-size: 20px;">Pendaftaran Diterima</h2>
            </div>

            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Assalamualaikum <strong style="color: #0f172a;">${userName}</strong>,
            </p>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Terima kasih kerana mendaftar untuk menggunakan Sistem Tindakan Terhadap Perakuan Menteri Pendidikan (STTPMP).
            </p>

            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 600;">📋 Status Permohonan:</p>
              <p style="margin: 0; font-size: 15px; color: #15803d;">Permohonan anda sedang menunggu kelulusan dari Administrator sistem.</p>
            </div>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Anda akan menerima notifikasi email apabila akaun anda telah diluluskan dan diaktifkan oleh Administrator.
            </p>

            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400e; font-weight: 600;">⏳ Seterusnya:</p>
              <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px; color: #92400e;">
                <li>Sila tunggu kelulusan dari Administrator (biasanya dalam 1-2 hari bekerja)</li>
                <li>Anda akan menerima email pengesahan setelah akaun diluluskan</li>
                <li>Selepas itu, anda boleh log masuk menggunakan kredential yang didaftarkan</li>
              </ul>
            </div>

          </div>

          <div style="margin-top: 24px; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">🇲🇾 Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
          </div>

        </body>
        </html>
      `

    await sendEmail({
      to,
      subject: '✅ Pendaftaran STTPMP Diterima - Menunggu Kelulusan',
      htmlContent,
      name: userName
    })

    console.log('✅ Registration pending email sent to:', to)
    return { success: true }
  } catch (error) {
    console.error('❌ Error sending registration pending email:', error)
    throw error
  }
}

// Send email to admin notifying new registration
interface SendAdminNewRegistrationEmailParams {
  userName: string
  userEmail: string
  requestedRole: string | null
  registrationId: string
}

export async function sendAdminNewRegistrationEmail({
  userName,
  userEmail,
  requestedRole,
  registrationId,
}: SendAdminNewRegistrationEmailParams) {
  try {
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/users`
    
    const roleNames: Record<string, string> = {
      penyelaras_bahagian: 'Penyelaras Bahagian',
      penyelaras_jpn: 'Penyelaras JPN',
      penyelaras_jnn: 'Penyelaras JNN (View Only)',
      peneraju_pemeriksaan: 'Peneraju Pemeriksaan',
      pemantau: 'Pemantau',
    }

    const requestedRoleName = requestedRole ? roleNames[requestedRole] || requestedRole : 'Tidak dinyatakan'

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pendaftaran Baharu</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #a78bfa; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">STTPMP</h1>
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 14px;">Admin Notification</p>
          </div>

          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">👤</div>
              <h2 style="color: #92400e; margin: 0; font-size: 20px;">Pendaftaran Pengguna Baharu</h2>
            </div>

            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Terdapat permohonan pendaftaran baharu yang memerlukan kelulusan anda.
            </p>

            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase;">MAKLUMAT PENGGUNA:</p>
              
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Nama:</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600;">${userName}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Email:</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600;">${userEmail}</p>
              </div>

              <div>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Peranan Dimohon:</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600;">${requestedRoleName}</p>
              </div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${adminUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
                🔍 Semak Permohonan
              </a>
            </div>

            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">ℹ️ Tindakan Diperlukan:</p>
              <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px; color: #075985;">
                <li>Klik butang "Semak Permohonan" untuk menyemak detail lengkap</li>
                <li>Luluskan atau tolak permohonan melalui panel admin</li>
                <li>Tetapkan peranan dan bahagian/JPN yang sesuai jika diluluskan</li>
              </ul>
            </div>

          </div>

          <div style="margin-top: 24px; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            <p style="margin: 0;">Email notifikasi automatik - STTPMP Admin Panel</p>
          </div>

        </body>
        </html>
      `

    // Send to all admins
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('role', 'admin')
      .eq('is_active', true)
      .eq('is_approved', true)

    if (admins && admins.length > 0) {
      const adminRecipients = admins.map(admin => ({
        email: admin.email,
        name: admin.name
      }))

      await sendEmail({
        to: adminRecipients,
        subject: '🔔 Pendaftaran Baharu Memerlukan Kelulusan - STTPMP',
        htmlContent
      })

      console.log('✅ Admin notification sent to:', adminRecipients.map(a => a.email).join(', '))
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error)
    // Don't throw error - registration should succeed even if email fails
    return { success: false, error }
  }
}

export async function sendDeadlineReminder({
  to,
  penyelarasName,
  syorTitle,
  syorId,
  responseDeadline,
  assignedTo,
}: SendDeadlineReminderParams) {
  try {
    const syorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/syor/${syorId}`
    
    // Format date to Malay format
    const deadlineDate = new Date(responseDeadline)
    const formattedDate = deadlineDate.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ms">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Peringatan Tarikh Akhir</title>
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <!-- Logo Jemaah Nazir -->
            <div style="margin-bottom: 20px;">
              <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 80px; height: auto; display: inline-block;" />
            </div>
            <h1 style="color: #a78bfa; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 2px;">STTPMP</h1>
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 14px;">Kementerian Pendidikan Malaysia</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <!-- Warning Badge -->
            <div style="background: #fff7ed; border: 2px solid #fb923c; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 8px;">⏰</div>
              <h2 style="color: #c2410c; margin: 0; font-size: 20px;">Peringatan: Syor Hampir Tamat Tempoh</h2>
            </div>

            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Assalamualaikum <strong style="color: #0f172a;">${penyelarasName}</strong>,
            </p>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Ini adalah peringatan automatik bahawa syor yang dipertanggungjawabkan kepada <strong>${assignedTo}</strong> akan tamat tempoh dalam <strong style="color: #ea580c;">3 hari</strong>.
            </p>

            <!-- Syor Information -->
            <div style="background: #f1f5f9; border-left: 4px solid #f97316; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; font-weight: 600; text-transform: uppercase;">MAKLUMAT SYOR:</p>
              
              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Tajuk Syor:</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600; line-height: 1.4;">${syorTitle}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Dipertanggungjawabkan kepada:</p>
                <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600;">${assignedTo}</p>
              </div>

              <div>
                <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">Tarikh Akhir Maklum Balas:</p>
                <p style="margin: 0; font-size: 18px; color: #ea580c; font-weight: 700;">${formattedDate}</p>
              </div>
            </div>

            <!-- Urgent Notice -->
            <div style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b; font-weight: 600;">⚠️ TINDAKAN SEGERA DIPERLUKAN:</p>
              <p style="margin: 0; font-size: 13px; color: #7f1d1d; line-height: 1.6;">
                Sila kemukakan maklum balas anda sebelum tarikh akhir untuk mengelakkan status syor menjadi <strong>TERTUNGGAK</strong>.
              </p>
            </div>

            <!-- Call to Action Button -->
            <div style="text-align: center; margin: 32px 0;">
              <a href="${syorUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3);">
                📋 Lihat Syor Sekarang
              </a>
            </div>

            <!-- Help Text -->
            <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; margin-top: 24px;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #0c4a6e; font-weight: 600;">ℹ️ Panduan:</p>
              <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px; color: #075985;">
                <li>Klik butang "Lihat Syor Sekarang" untuk akses syor ini</li>
                <li>Kemaskini status tindakan dan maklum balas anda</li>
                <li>Muat naik dokumen sokongan jika diperlukan</li>
                <li>Pastikan maklum balas dikemukakan sebelum tarikh akhir</li>
              </ul>
            </div>

          </div>

          <!-- Footer -->
          <div style="margin-top: 24px; padding: 20px; text-align: center; color: #64748b; font-size: 13px;">
            <p style="margin: 0 0 8px 0;">
              Email ini dihantar secara automatik oleh sistem STTPMP.
            </p>
            <p style="margin: 0 0 16px 0;">
              Peringatan ini akan dihantar <strong>3 hari sebelum</strong> tarikh akhir maklum balas.
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-weight: 600; color: #475569;">
                Jemaah Nazir | Kementerian Pendidikan Malaysia
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} STTPMP - Semua hak cipta terpelihara
              </p>
            </div>
          </div>

        </body>
        </html>
      `

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL || 'noreply@sttpmp.com', name: 'STTPMP - Jemaah Nazir' }
    sendSmtpEmail.to = [{ email: to, name: penyelarasName }]
    sendSmtpEmail.subject = '⏰ PERINGATAN: Syor Hampir Tamat Tempoh (3 Hari Lagi)'
    sendSmtpEmail.htmlContent = htmlContent

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    console.log('✅ Deadline reminder email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error sending deadline reminder email:', error)
    return { success: false, error }
  }
}
