-- PayPrompt schema (Postgres / Supabase)

CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  business_name   TEXT,
  sign_off        TEXT DEFAULT 'Best regards',
  reply_to        TEXT,
  plan            TEXT NOT NULL DEFAULT 'starter',   -- starter | pro | agency
  policy          JSONB NOT NULL DEFAULT '{"grace_days":3,"steps":[3,7,14,21],"max_reminders":4,"late_fee_cents":0}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number          TEXT NOT NULL,
  client_name     TEXT NOT NULL,
  client_email    TEXT NOT NULL,
  amount_cents    BIGINT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  due_date        DATE NOT NULL,
  payment_url     TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'open',        -- open | paid | void | needs_attention
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, number)
);

CREATE TABLE IF NOT EXISTS reminders (
  id              BIGSERIAL PRIMARY KEY,
  invoice_id      BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  step            INT NOT NULL,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind            TEXT NOT NULL,                       -- email | manual | sms
  UNIQUE (invoice_id, step)
);

CREATE TABLE IF NOT EXISTS events (
  id              BIGSERIAL PRIMARY KEY,
  invoice_id      BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
  user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,                       -- invoice_created | reminder_sent | paid | escalated
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON invoices (status, due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices (user_id);
