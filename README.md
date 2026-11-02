# PayPrompt

**Automatic invoice reminders for freelancers and small agencies.**

PayPrompt chases unpaid invoices for you: polite, escalating reminder emails that carry *your* name and sign-off, plus a dashboard of who owes what and for how long.

- Live landing page: https://payprompt-992i58la.agent.mira.tg
- Pricing: $9 (Starter) / $19 (Pro) / $39 (Agency) per month - flat, no commission on collected revenue
- North star: 100 customers x $19 = $1,900 MRR

## Why this and not another app

Late invoices are not a collections problem, they are an *awkward-email* problem. Freelancers lose 5-15% of billed revenue to late payment (on $2,000/mo billed that is $100-$300/mo - more than the Pro plan). PayPrompt removes the awkwardness, so the founder does not have to.

The product deliberately does ONE thing well: send the right reminder at the right time, in the owner's voice, and stop when it should.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Postgres (Supabase) via `pg` - plain SQL, no heavy ORM lock-in
- Stripe (optional) + PayPal (optional) payment links
- Cron-triggered worker via `POST /api/cron/reminders`

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, CRON_SECRET
npm run dev                  # http://localhost:3000
```

Schema bootstrap:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

## Architecture

```
src/lib/reminders.ts        # the core engine: which invoices are due for a nudge
src/lib/templates.ts        # escalation templates, tone-of-voice rendering
src/lib/db.ts               # tiny query helper (no ORM)
src/app/api/cron/reminders  # worker endpoint, runs every hour
src/app/api/invoices/[id]   # public payment page data
db/schema.sql               # tables: users, invoices, reminders, events
docs/marketing.md            # go-to-market plan
docs/growth-playbook.md      # funnel, channels, weekly cadence
docs/onboarding.md           # 5-minute path to first reminder
```

### Reminder engine

`nextReminderFor(invoice, rules)` is pure and unit-testable: given an invoice and a policy it returns the next reminder to send, or `null`. The scheduler is a thin wrapper that loads overdue invoices and sends what the engine asks for.

Default policy:

| Step | Days after due | Tone |
|---|---|---|
| 1 | +3 | friendly nudge |
| 2 | +7 | firm, payment link highlighted |
| 3 | +14 | final notice, late fee mentioned if set |
| 4 | +21 | stop, flag `needs_attention` |

The policy is per-user and stored on the user row, so "polite but firm" is configurable without a code change.

## Roadmap

- [x] Landing page + pricing + FAQ
- [x] Core reminder engine with escalation policy
- [x] DB schema + cron worker endpoint
- [x] CI (typecheck + tests) and Vercel deploy workflows
- [x] Growth playbook + onboarding spec
- [ ] Stripe Checkout for subscriptions
- [ ] PayPal invoice automation (MCP connection pending)
- [ ] Client-facing payment page (shareable link per invoice)
- [ ] Dashboard: overdue list sorted by amount x age
- [ ] Import from CSV
- [ ] Recurring / retainer invoices

## License

MIT - (c) 2026 samilge1-sys
