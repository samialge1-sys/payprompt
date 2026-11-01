import { DEFAULT_POLICY, type Invoice, type Policy, type Reminder } from './types';

/** Whole days between two YYYY-MM-DD dates (UTC, no time-of-day drift). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/**
 * Pure decision function: given an invoice and a policy, return the reminder
 * that should be sent right now, or null if nothing is due.
 *
 * `sentSteps` are the escalation steps already sent for this invoice.
 * `today` is YYYY-MM-DD.
 */
export function nextReminderFor(
  invoice: Invoice,
  policy: Policy = DEFAULT_POLICY,
  sentSteps: number[] = [],
  today: string = new Date().toISOString().slice(0, 10)
): Reminder | null {
  if (invoice.status !== 'open') return null;

  const overdueBy = daysBetween(invoice.due_date, today);
  if (overdueBy < policy.grace_days) return null;

  const sent = new Set(sentSteps);
  if (sent.size >= policy.max_reminders) return null;

  // First step that has not been sent yet and is already due.
  for (const step of [...policy.steps].sort((a, b) => a - b)) {
    if (sent.has(step)) continue;
    if (overdueBy < step) return null; // a later step is not due yet either
    return { step, dueInDays: overdueBy, tone: toneFor(step, policy), kind: 'email' };
  }
  return null;
}

export function toneFor(step: number, policy: Policy = DEFAULT_POLICY): Reminder['tone'] {
  const sorted = [...policy.steps].sort((a, b) => a - b);
  const idx = sorted.indexOf(step);
  if (idx <= 0) return 'friendly';
  if (idx === sorted.length - 1) return 'final';
  return 'firm';
}

/** After the last step has been sent, the invoice needs a human touch. */
export function needsAttention(invoice: Invoice, policy: Policy = DEFAULT_POLICY): boolean {
  return invoice.status === 'open' && policy.max_reminders <= 0;
}
