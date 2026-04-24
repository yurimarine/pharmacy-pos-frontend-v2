-- Step 1: Add force_closed to existing enum
ALTER TYPE till_session_status ADD VALUE 'force_closed';

-- Step 2: Rename columns for consistent naming convention
ALTER TABLE till_sessions
  RENAME COLUMN opening_amount TO opening_cash;
ALTER TABLE till_sessions
  RENAME COLUMN closing_amount TO closing_cash;
ALTER TABLE till_sessions
  RENAME COLUMN expected_amount TO expected_cash;

-- Step 3: Add missing columns
ALTER TABLE till_sessions
  ADD COLUMN IF NOT EXISTS transaction_count      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_notes          text,
  ADD COLUMN IF NOT EXISTS closing_notes          text,
  ADD COLUMN IF NOT EXISTS updated_at             timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS opening_cash_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS closing_cash_breakdown jsonb;

-- Step 4: Drop old unique index if it exists, create correct one
DROP INDEX IF EXISTS idx_till_sessions_one_open_per_pharmacy;

CREATE UNIQUE INDEX IF NOT EXISTS idx_till_sessions_one_open_per_user
  ON till_sessions (pharmacy_id, opened_by)
  WHERE status = 'open';

-- Step 5: General lookup index
CREATE INDEX IF NOT EXISTS idx_till_sessions_pharmacy_status
  ON till_sessions (pharmacy_id, status);

-- ===========================================================================
-- pg_cron Auto-Close Job
-- NOTE: Run this block separately in Supabase SQL Editor AFTER enabling pg_cron:
--   Dashboard → Database → Extensions → search "pg_cron" → enable it
-- Verify afterward: SELECT * FROM cron.job WHERE jobname = 'auto-close-till-sessions';
-- ===========================================================================

-- Auto-close all open till sessions at midnight every day
SELECT cron.schedule(
  'auto-close-till-sessions',
  '0 0 * * *',
  $$
    UPDATE till_sessions
    SET
      status        = 'force_closed',
      closed_at     = now(),
      closing_notes = 'Auto-closed at end of day',
      updated_at    = now()
    WHERE status = 'open';
  $$
);
