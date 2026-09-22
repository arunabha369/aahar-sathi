import { env, isProduction } from '../config/env.ts';

export interface Email {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Emails sent without a provider (development and tests). Tests read the reset link from
 * here; nothing is kept when a real provider is configured.
 */
export const devOutbox: Email[] = [];

/**
 * Sends one email through Resend (https://resend.com) when RESEND_API_KEY is set. Without a
 * key, development prints it to the server log instead so the flow can be tried locally;
 * production without a key logs an error, because the user will never receive it.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (!env.RESEND_API_KEY) {
    if (isProduction) {
      console.error('[email] RESEND_API_KEY is not set, so this email was not sent:', email.subject, '→', email.to);
      return;
    }
    devOutbox.push(email);
    if (env.NODE_ENV === 'development') {
      console.log(`\n📧 Email to ${email.to} — ${email.subject}\n${email.text}\n`);
    }
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [email.to], subject: email.subject, text: email.text, html: email.html }),
  });
  if (!response.ok) {
    // Logged, not thrown: the caller must answer the same way whether or not the email went out.
    console.error('[email] Resend refused the email:', response.status, await response.text().catch(() => ''));
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** The password reset email: plain text plus simple, table-based HTML that mail apps render reliably. */
export function passwordResetEmail({ name, link, minutes }: { name: string; link: string; minutes: number }): Omit<Email, 'to'> {
  const text = [
    `Namaste ${name},`,
    '',
    'Someone (hopefully you) asked to reset your Aahar Sathi password. Open this link to choose a new one:',
    link,
    '',
    `The link works once and expires in ${minutes} minutes.`,
    "If you didn't ask for this, you can ignore this email — your password stays the same.",
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f6f7f5;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0e1a16">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e3e8e5;border-radius:16px">
      <tr><td style="padding:28px">
        <p style="margin:0 0 16px;font-size:18px;font-weight:700">Aahar Sathi</p>
        <p style="margin:0 0 12px;font-size:15px;line-height:1.5">Namaste ${escapeHtml(name)},</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.5">Someone (hopefully you) asked to reset your password. Choose a new one here:</p>
        <p style="margin:0 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#027a48;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">Choose a new password</a></p>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#5f6f69">The link works once and expires in ${minutes} minutes.</p>
        <p style="margin:0;font-size:13px;line-height:1.5;color:#5f6f69">If you didn't ask for this, ignore this email — your password stays the same.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  return { subject: 'Reset your Aahar Sathi password', text, html };
}
