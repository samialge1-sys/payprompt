import type { Invoice, Policy, Reminder } from './types';

export type Sender = {
  business_name: string | null;
  email: string;
  sign_off: string | null;
  reply_to: string | null;
};

export function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function formatDue(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

/**
 * Renders the reminder email in the owner's voice. The client must never see
 * that this came from an automated service.
 */
export function renderReminder(
  invoice: Invoice,
  reminder: Reminder,
  sender: Sender,
  policy: Policy = { grace_days: 3, steps: [3, 7, 14, 21], max_reminders: 4, late_fee_cents: 0 }
): { subject: string; body: string } {
  const who = sender.business_name ?? 'me';
  const amount = money(invoice.amount_cents, invoice.currency);
  const due = formatDue(invoice.due_date);
  const link = invoice.payment_url;
  const pay = link ? `You can settle it here: ${link}` : 'You can reply to this email to arrange payment.';

  switch (reminder.tone) {
    case 'friendly':
      return {
        subject: `Invoice ${invoice.number} - a gentle reminder`,
        body: `Hi ${invoice.client_name},

Hope you're well. Just a quick note that invoice ${invoice.number} for ${amount} was due on ${due}.

${pay}

If it's already on its way, no worries at all - thanks ${who}.

${sender.sign_off ?? 'Best regards'},
${sender.business_name ?? who}`,
      };
    case 'firm':
      return {
        subject: `Invoice ${invoice.number} is now overdue`,
        body: `Hi ${invoice.client_name},

Invoice ${invoice.number} for ${amount} was due on ${due}, and it is now ${reminder.dueInDays} days past due.${policy.late_fee_cents > 0 ? ` A late fee of ${money(policy.late_fee_cents, invoice.currency)} applies.` : ''}

${pay}

Could you let me know when I can expect payment? If anything is holding it up on your side, tell me and we'll sort it out.

${sender.sign_off ?? 'Best regards'},
${sender.business_name ?? who}`,
      };
    case 'final':
      return {
        subject: `Final notice - invoice ${invoice.number}`,
        body: `Hi ${invoice.client_name},

This is the last reminder I'm sending about invoice ${invoice.number} for ${amount}, due since ${due}.${policy.late_fee_cents > 0 ? ` A late fee of ${money(policy.late_fee_cents, invoice.currency)} applies.` : ''}

${pay}

If I don't hear back by the end of the week I'll follow up through ${sender.reply_to ?? sender.email} to close this off.

${sender.sign_off ?? 'Best regards'},
${sender.business_name ?? who}`,
      };
  }
}
