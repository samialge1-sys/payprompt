/**
 * Minimal mail adapter. Swap for Resend / Postmark / SES without touching the
 * reminder engine - it only needs `send()` to deliver.
 */
export type Outbound = { to: string; from: string; subject: string; body: string };

export async function sendEmail(mail: Outbound): Promise<void> {
  const url = process.env.MAIL_ENDPOINT;
  if (!url) {
    // Local/dev mode: log instead of sending.
    console.log('[mail]', mail.to, '|', mail.subject);
    return;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(mail),
  });
  if (!res.ok) throw new Error(`mail delivery failed: ${res.status}`);
}
