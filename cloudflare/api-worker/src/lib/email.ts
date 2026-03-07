/**
 * Email sending for OTP codes.
 *
 * Uses Authentik's transactional email endpoint or falls back to
 * a simple MailChannels-via-Workers approach.
 *
 * In production, this should be replaced with a proper transactional
 * email provider (e.g., Resend, Postmark, SES).
 */

interface SendOtpEmailParams {
  to: string
  code: string
  name?: string
}

interface EmailConfig {
  from: string
  apiKey?: string
  provider: 'mailchannels' | 'resend'
}

/**
 * Send OTP verification email via MailChannels (free for CF Workers)
 * or Resend (if configured).
 */
export async function sendOtpEmail(
  config: EmailConfig,
  params: SendOtpEmailParams
): Promise<{ sent: boolean; error?: string }> {
  const { to, code, name } = params
  const greeting = name ? `Hi ${name},` : 'Hi,'

  const subject = `${code} is your Merge Combinator verification code`
  const textBody = `${greeting}\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— Merge Combinator`
  const htmlBody = `
    <div style="font-family: -apple-system, 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <p style="color: #666; font-size: 15px;">${greeting}</p>
      <p style="color: #333; font-size: 15px;">Your verification code is:</p>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111;">${code}</span>
      </div>
      <p style="color: #999; font-size: 13px;">This code expires in 10 minutes.</p>
      <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
      <p style="color: #bbb; font-size: 11px;">Merge Combinator</p>
    </div>
  `

  if (config.provider === 'resend' && config.apiKey) {
    return sendViaResend(config.apiKey, config.from, to, subject, textBody, htmlBody)
  }

  return sendViaMailChannels(config.from, to, subject, textBody, htmlBody)
}

async function sendViaMailChannels(
  from: string, to: string, subject: string, text: string, html: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: 'Merge Combinator' },
        subject,
        content: [
          { type: 'text/plain', value: text },
          { type: 'text/html', value: html },
        ],
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { sent: false, error: `MailChannels ${res.status}: ${body}` }
    }
    return { sent: true }
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

async function sendViaResend(
  apiKey: string, from: string, to: string, subject: string, text: string, html: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { sent: false, error: `Resend ${res.status}: ${body}` }
    }
    return { sent: true }
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
