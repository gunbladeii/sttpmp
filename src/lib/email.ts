import * as brevo from '@getbrevo/brevo'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Handle SSL certificate issues in development/corporate networks
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '')

function getConfiguredSender() {
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.BREVO_FROM_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'STTPMP - Jemaah Nazir'

  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY tidak ditetapkan')
  }

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL atau BREVO_FROM_EMAIL tidak ditetapkan')
  }

  return { senderEmail, senderName }
}

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
    const { senderEmail, senderName } = getConfiguredSender()
    
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
    const { senderEmail, senderName } = getConfiguredSender()
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
            <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 42px; width: auto; display: inline-block;" />
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 13px;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
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
              Tahniah! Permohonan akaun anda untuk sistem <strong>STRiKe</strong> telah diluluskan oleh Administrator. Anda kini adalah sebahagian daripada Sistem Tindakan Rekod iKeberkesanan Pemeriksaan Jemaah Nazir.
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
                🔐 Log Masuk ke STRiKe
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
                © ${new Date().getFullYear()} STRiKe - Semua hak cipta terpelihara
              </p>
            </div>
          </div>

        </body>
        </html>
      `

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
    sendSmtpEmail.to = [{ email: to, name: userName }]
    sendSmtpEmail.subject = '✅ Akaun STRiKe Anda Telah Diluluskan'
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
    const { senderEmail, senderName } = getConfiguredSender()
    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
    sendSmtpEmail.to = [{ email: to, name: userName }]
    sendSmtpEmail.subject = '❌ Permohonan Akaun STRiKe'
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
            <div style="margin-bottom: 16px;">
              <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 70px; height: auto; display: inline-block;" />
            </div>
            <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 42px; width: auto; display: inline-block;" />
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 13px;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
          </div>

          <!-- Main Content -->
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <p style="font-size: 16px; color: #475569; margin-bottom: 24px;">
              Assalamualaikum <strong style="color: #0f172a;">${userName}</strong>,
            </p>

            <p style="font-size: 15px; color: #475569; line-height: 1.8; margin-bottom: 24px;">
              Terima kasih atas permohonan akaun STRiKe anda. Setelah semakan, permohonan anda tidak dapat diluluskan pada masa ini.
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
            <div style="margin-bottom: 16px;">
              <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 70px; height: auto; display: inline-block;" />
            </div>
            <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 42px; width: auto; display: inline-block;" />
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 13px;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
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
              Terima kasih kerana mendaftar untuk menggunakan sistem <strong>STRiKe</strong> (Sistem Tindakan Rekod iKeberkesanan Pemeriksaan).
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
      subject: '✅ Pendaftaran STRiKe Diterima - Menunggu Kelulusan',
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
            <div style="margin-bottom: 16px;">
              <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 70px; height: auto; display: inline-block;" />
            </div>
            <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 42px; width: auto; display: inline-block;" />
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 13px;">Admin Notification | Jemaah Nazir KPM</p>
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
            <p style="margin: 0;">Email notifikasi automatik - STRiKe Admin Panel</p>
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
        subject: '🔔 Pendaftaran Baharu Memerlukan Kelulusan - STRiKe',
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
            <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 42px; width: auto; display: inline-block;" />
            <p style="color: #cbd5e1; margin: 10px 0 0 0; font-size: 13px;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
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
              Email ini dihantar secara automatik oleh sistem STRiKe.
            </p>
            <p style="margin: 0 0 16px 0;">
              Peringatan ini akan dihantar <strong>3 hari sebelum</strong> tarikh akhir maklum balas.
            </p>
            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px;">
              <p style="margin: 0; font-weight: 600; color: #475569;">
                Jemaah Nazir | Kementerian Pendidikan Malaysia
              </p>
              <p style="margin: 8px 0 0 0; font-size: 12px;">
                © ${new Date().getFullYear()} STRiKe - Semua hak cipta terpelihara
              </p>
            </div>
          </div>

        </body>
        </html>
      `

    const sendSmtpEmail = new brevo.SendSmtpEmail()
    sendSmtpEmail.sender = { email: senderEmail, name: senderName }
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

// ─── New Syor Notification ────────────────────────────────────────────────────

interface SendSyorCreatedEmailParams {
  to: string
  penyelarasName: string
  syorTitle: string
  syorId: string
  priority: string
  dueDate: string
  responseDeadline: string
  creatorName: string
  syorUrl: string
}

export async function sendSyorCreatedEmail({
  to,
  penyelarasName,
  syorTitle,
  syorId,
  priority,
  dueDate,
  responseDeadline,
  creatorName,
  syorUrl,
}: SendSyorCreatedEmailParams) {
  const priorityLabel: Record<string, string> = {
    rendah: 'Rendah',
    sederhana: 'Sederhana',
    tinggi: 'Tinggi',
    kritikal: '🔴 Kritikal',
  }
  const priorityColor: Record<string, string> = {
    rendah: '#22c55e',
    sederhana: '#3b82f6',
    tinggi: '#f59e0b',
    kritikal: '#ef4444',
  }
  const formatDate = (d: string) => {
    if (!d || d === '-') return '-'
    return new Date(d).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Syor Baharu Ditujukan Kepada Anda</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 32px 24px; text-align: center; border-radius: 14px 14px 0 0;">
        <div style="margin-bottom: 14px;">
          <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 64px; height: auto; display: inline-block;" />
        </div>
        <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 40px; width: auto; display: inline-block;" />
        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 0.5px;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
      </div>

      <!-- Body -->
      <div style="background: #ffffff; padding: 36px 28px; border-radius: 0 0 14px 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

        <!-- Badge -->
        <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 10px; padding: 18px; margin-bottom: 28px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">📋</div>
          <h2 style="color: #1d4ed8; margin: 0; font-size: 18px; font-weight: 700;">Syor Baharu Telah Ditujukan Kepada Anda</h2>
        </div>

        <p style="font-size: 15px; color: #475569; margin-bottom: 20px;">
          Assalamualaikum <strong style="color: #0f172a;">${penyelarasName}</strong>,
        </p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.8; margin-bottom: 24px;">
          Satu Perakuan Menteri baharu telah dicipta oleh <strong>${creatorName}</strong> dan ditujukan kepada anda untuk tindakan lanjut.
        </p>

        <!-- Syor Details Card -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 14px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Butiran Syor</p>

          <div style="margin-bottom: 14px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tajuk Syor</p>
            <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600; line-height: 1.4;">${syorTitle}</p>
          </div>

          <div style="display: inline-block; margin-bottom: 14px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Keutamaan</p>
            <span style="display: inline-block; background: ${priorityColor[priority] || '#64748b'}22; color: ${priorityColor[priority] || '#64748b'}; border: 1px solid ${priorityColor[priority] || '#64748b'}44; padding: 3px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${priorityLabel[priority] || priority}</span>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; gap: 24px;">
            <div style="flex: 1;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tarikh Akhir Maklum Balas</p>
              <p style="margin: 0; font-size: 14px; color: #dc2626; font-weight: 600;">${formatDate(responseDeadline)}</p>
            </div>
            <div style="flex: 1;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tarikh Akhir Syor</p>
              <p style="margin: 0; font-size: 14px; color: #475569; font-weight: 600;">${formatDate(dueDate)}</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${syorUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(37,99,235,0.35);">&#128196; Lihat &amp; Ambil Tindakan</a>
        </div>

        <!-- Notice -->
        <div style="background: #fefce8; border: 1px solid #fde047; border-radius: 8px; padding: 14px 16px; margin-top: 16px;">
          <p style="margin: 0; font-size: 13px; color: #713f12; line-height: 1.6;">⚠️ Sila pastikan maklum balas dikemukakan sebelum <strong>Tarikh Akhir Maklum Balas</strong> yang ditetapkan.</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="margin-top: 20px; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0 0 6px 0;">Email ini dihantar secara automatik oleh sistem STRiKe.</p>
        <p style="margin: 0 0 12px 0;">Jangan balas email ini. Untuk pertanyaan, hubungi Administrator sistem.</p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <p style="margin: 0; font-weight: 600; color: #64748b;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
          <p style="margin: 6px 0 0 0; font-size: 11px;">© ${new Date().getFullYear()} STRiKe - Semua hak cipta terpelihara</p>
        </div>
      </div>

    </body>
    </html>
  `

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL || 'noreply@sttpmp.com', name: 'STRiKe - Jemaah Nazir' }
  sendSmtpEmail.to = [{ email: to, name: penyelarasName }]
  sendSmtpEmail.subject = `📋 Syor Baharu Ditujukan Kepada Anda: ${syorTitle.substring(0, 60)}${syorTitle.length > 60 ? '...' : ''}`
  sendSmtpEmail.htmlContent = htmlContent

  const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
  console.log('✅ Syor created notification sent to:', to)
  return { success: true, data }
}

// ─── Tindakan / Maklum Balas Notification ────────────────────────────────────

interface SendTindakanEmailParams {
  to: string
  penyelarasName: string
  syorTitle: string
  syorId: string
  tindakanComments: string
  tindakanStatus: string
  updaterName: string
  syorUrl: string
}

export async function sendTindakanEmail({
  to,
  penyelarasName,
  syorTitle,
  syorId,
  tindakanComments,
  tindakanStatus,
  updaterName,
  syorUrl,
}: SendTindakanEmailParams) {
  const statusLabel: Record<string, string> = {
    belum_selesai: 'Belum Selesai',
    dalam_tindakan: 'Dalam Tindakan',
    selesai: 'Selesai',
  }
  const statusColor: Record<string, string> = {
    belum_selesai: '#ef4444',
    dalam_tindakan: '#f59e0b',
    selesai: '#22c55e',
  }
  const statusIcon: Record<string, string> = {
    belum_selesai: '🔴',
    dalam_tindakan: '🟡',
    selesai: '🟢',
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ms">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tindakan Baharu pada Syor</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f1f5f9;">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f1629 0%, #1a2236 50%, #0f1629 100%); padding: 32px 24px; text-align: center; border-radius: 14px 14px 0 0;">
        <div style="margin-bottom: 14px;">
          <img src="https://raw.githubusercontent.com/gunbladeii/sttpmp/main/public/logoJN.png" alt="Logo Jemaah Nazir" style="width: 64px; height: auto; display: inline-block;" />
        </div>
        <img src="https://sttpmp.vercel.app/LogoStrike.png" alt="STRiKe" style="height: 40px; width: auto; display: inline-block;" />
        <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 12px; letter-spacing: 0.5px;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
      </div>

      <!-- Body -->
      <div style="background: #ffffff; padding: 36px 28px; border-radius: 0 0 14px 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">

        <!-- Badge -->
        <div style="background: #fff7ed; border: 2px solid #f97316; border-radius: 10px; padding: 18px; margin-bottom: 28px; text-align: center;">
          <div style="font-size: 40px; margin-bottom: 8px;">🔔</div>
          <h2 style="color: #c2410c; margin: 0; font-size: 18px; font-weight: 700;">Tindakan Baharu Telah Dikemukakan</h2>
        </div>

        <p style="font-size: 15px; color: #475569; margin-bottom: 20px;">
          Assalamualaikum <strong style="color: #0f172a;">${penyelarasName}</strong>,
        </p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.8; margin-bottom: 24px;">
          <strong>${updaterName}</strong> telah mengemukakan tindakan/maklum balas baharu bagi syor yang ditujukan kepada anda.
        </p>

        <!-- Syor Details -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Butiran Syor</p>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8; text-transform: uppercase;">Tajuk Syor</p>
          <p style="margin: 0; font-size: 15px; color: #0f172a; font-weight: 600; line-height: 1.4;">${syorTitle}</p>
        </div>

        <!-- Tindakan Details -->
        <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #92400e; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Tindakan / Maklum Balas</p>

          <div style="margin-bottom: 14px;">
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #92400e; text-transform: uppercase;">Status Terkini</p>
            <span style="display: inline-flex; align-items: center; gap: 6px; background: ${statusColor[tindakanStatus] || '#64748b'}18; color: ${statusColor[tindakanStatus] || '#64748b'}; border: 1px solid ${statusColor[tindakanStatus] || '#64748b'}40; padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 700;">${statusIcon[tindakanStatus] || '⚪'} ${statusLabel[tindakanStatus] || tindakanStatus}</span>
          </div>

          <div>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: #92400e; text-transform: uppercase;">Catatan / Maklum Balas</p>
            <div style="background: #ffffff; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px 14px;">
              <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.7; white-space: pre-wrap;">${tindakanComments}</p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${syorUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(249,115,22,0.35);">&#128196; Lihat Syor Penuh</a>
        </div>

      </div>

      <!-- Footer -->
      <div style="margin-top: 20px; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0 0 6px 0;">Email ini dihantar secara automatik oleh sistem STRiKe.</p>
        <p style="margin: 0 0 12px 0;">Jangan balas email ini. Untuk pertanyaan, hubungi Administrator sistem.</p>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
          <p style="margin: 0; font-weight: 600; color: #64748b;">Jemaah Nazir | Kementerian Pendidikan Malaysia</p>
          <p style="margin: 6px 0 0 0; font-size: 11px;">© ${new Date().getFullYear()} STRiKe - Semua hak cipta terpelihara</p>
        </div>
      </div>

    </body>
    </html>
  `

  const sendSmtpEmail = new brevo.SendSmtpEmail()
  sendSmtpEmail.sender = { email: process.env.BREVO_FROM_EMAIL || 'noreply@sttpmp.com', name: 'STRiKe - Jemaah Nazir' }
  sendSmtpEmail.to = [{ email: to, name: penyelarasName }]
  sendSmtpEmail.subject = `🔔 Tindakan Baharu pada Syor: ${syorTitle.substring(0, 55)}${syorTitle.length > 55 ? '...' : ''}`
  sendSmtpEmail.htmlContent = htmlContent

  const data = await apiInstance.sendTransacEmail(sendSmtpEmail)
  console.log('✅ Tindakan notification sent to:', to)
  return { success: true, data }
}
