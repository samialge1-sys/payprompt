const test = require('node:test');
const assert = require('node:assert');
const { nextReminderFor, daysBetween } = require('../src/lib/reminders.ts');

const inv = (over = {}) => ({
  id: 1, user_id: 1, number: 'INV-001', client_name: 'Acme', client_email: 'a@b.co',
  amount_cents: 120000, currency: 'USD', due_date: '2026-10-01', payment_url: 'https://pay.test/1',
  notes: null, status: 'open', ...over,
});
const policy = { grace_days: 3, steps: [3, 7, 14, 21], max_reminders: 4, late_fee_cents: 0 };

test('daysBetween is calendar based', () => {
  assert.strictEqual(daysBetween('2026-10-01', '2026-10-08'), 7);
  assert.strictEqual(daysBetween('2026-10-01', '2026-10-01'), 0);
});

test('nothing before the grace period', () => {
  assert.strictEqual(nextReminderFor(inv(), policy, [], '2026-10-03'), null);
});

test('first reminder fires on day 3', () => {
  const r = nextReminderFor(inv(), policy, [], '2026-10-04');
  assert.strictEqual(r.step, 3);
  assert.strictEqual(r.tone, 'friendly');
});

test('skips steps that were already sent', () => {
  const r = nextReminderFor(inv(), policy, [3], '2026-10-09');
  assert.strictEqual(r.step, 7);
  assert.strictEqual(r.tone, 'firm');
});

test('stops after max_reminders', () => {
  assert.strictEqual(nextReminderFor(inv(), policy, [3, 7, 14, 21], '2026-11-30'), null);
});

test('paid invoices are never chased', () => {
  assert.strictEqual(nextReminderFor(inv({ status: 'paid' }), policy, [], '2026-11-30'), null);
});
