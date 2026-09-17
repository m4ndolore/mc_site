/**
 * Transactional email.
 *
 * Sends via Resend when RESEND_API_KEY is configured, otherwise falls back
 * to MailChannels. `sendEmail` is the generic primitive; `sendOtpEmail`
 * renders the verification-code message on top of it.
 */

export interface EmailConfig {
  from: string
  apiKey?: string
  provider: 'mailchannels' | 'resend'
}

export interface SendEmailParams {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}

export interface SendResult {
  sent: boolean
  error?: string
}

interface SendOtpEmailParams {
  to: string
  code: string
  name?: string
}

export async function sendEmail(config: EmailConfig, params: SendEmailParams): Promise<SendResult> {
  if (config.provider === 'resend' && config.apiKey) {
    return sendViaResend(config.apiKey, config.from, params)
  }
  return sendViaMailChannels(config.from, params)
}

/**
 * Send OTP verification email.
 */
export async function sendOtpEmail(
  config: EmailConfig,
  params: SendOtpEmailParams
): Promise<SendResult> {
  const { to, code, name } = params
  const greeting = name ? `Hi ${name},` : 'Hi,'

  const subject = `${code} is your Merge Combinator verification code`
  const text = `${greeting}\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.\n\n— Merge Combinator`
  const html = `
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

  return sendEmail(config, { to, subject, text, html })
}

async function sendViaMailChannels(from: string, p: SendEmailParams): Promise<SendResult> {
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: p.to }] }],
        from: { email: from, name: 'Merge Combinator' },
        ...(p.replyTo ? { reply_to: { email: p.replyTo } } : {}),
        subject: p.subject,
        content: [
          { type: 'text/plain', value: p.text },
          { type: 'text/html', value: p.html },
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

async function sendViaResend(apiKey: string, from: string, p: SendEmailParams): Promise<SendResult> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: p.to,
        subject: p.subject,
        text: p.text,
        html: p.html,
        ...(p.replyTo ? { reply_to: p.replyTo } : {}),
      }),
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
