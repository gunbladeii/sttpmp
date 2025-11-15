import * as brevo from '@getbrevo/brevo'

const apiInstance = new brevo.TransactionalEmailsApi()
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '')

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
