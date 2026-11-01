import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { nextReminderFor } from '@/lib/reminders';
import { renderReminder } from '@/lib/templates';
import { DEFAULT_POLICY, type Invoice, type Policy } from '@/lib/types';
import { sendEmail } from '@/lib/mail';

export const dynamic = 'force-dynamic';

/**
 * Hourly worker. Protected by CRON_SECRET.
 * Finds overdue invoices, asks the reminder engine what is due, sends it.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('x-cron-secret') ?? new URL(request.url).searchParams.get('secret');
  if (secret && header !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const invoices = await query<Invoice & { policy: Policy; business_name: string | null; sign_off: string | null; reply_to: string | null; owner_email: string }>(
    `SELECT i.*, u.policy, u.business_name, u.sign_off, u.reply_to, u.email AS owner_email
       FROM invoices i JOIN users u ON u.id = i.user_id
      WHERE i.status = 'open' AND i.due_date < $1`,
    [today]
  );

  let sent = 0;
  for (const invoice of invoices) {
    const sentRows = await query<{ step: number }>(
      'SELECT step FROM reminders WHERE invoice_id = $1', [invoice.id]
    );
    const policy = invoice.policy ?? DEFAULT_POLICY;
    const reminder = nextReminderFor(invoice, policy, sentRows.map((r) => r.step), today);
    if (!reminder) continue;

    const email = renderReminder(
      invoice,
      reminder,
      {
        business_name: invoice.business_name,
        email: invoice.owner_email,
        sign_off: invoice.sign_off,
        reply_to: invoice.reply_to,
      },
      policy
    );

    await sendEmail({ to: invoice.client_email, from: invoice.owner_email, ...email });
    await query('INSERT INTO reminders (invoice_id, step, kind) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [invoice.id, reminder.step, reminder.kind]);
    await query(`INSERT INTO events (invoice_id, user_id, type, payload) VALUES ($1,$2,'reminder_sent',$3)`,
      [invoice.id, invoice.user_id, JSON.stringify({ step: reminder.step, tone: reminder.tone })]);
    sent++;
  }

  return NextResponse.json({ ok: true, scanned: invoices.length, sent, date: today });
}
