ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_txid text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_reported_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz;