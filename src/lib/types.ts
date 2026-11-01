export type Policy = {
  /** Days after the due date before the first reminder may fire. */
  grace_days: number;
  /** Day offsets (after due date) at which each escalation step fires. */
  steps: number[];
  /** Hard cap on reminders per invoice. */
  max_reminders: number;
  /** Late fee in cents mentioned in the final notice, 0 = none. */
  late_fee_cents: number;
};

export type Invoice = {
  id: number;
  user_id: number;
  number: string;
  client_name: string;
  client_email: string;
  amount_cents: number;
  currency: string;
  due_date: string; // YYYY-MM-DD
  payment_url: string | null;
  notes: string | null;
  status: 'open' | 'paid' | 'void' | 'needs_attention';
};

export type Reminder = {
  step: number;
  dueInDays: number;
  tone: 'friendly' | 'firm' | 'final';
  kind: 'email';
};

export const DEFAULT_POLICY: Policy = {
  grace_days: 3,
  steps: [3, 7, 14, 21],
  max_reminders: 4,
  late_fee_cents: 0,
};
