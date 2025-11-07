-- Migration: Add phone column to users table (idempotent)
-- Reason: Frontend expects users.phone for driver profile editing
-- Safe to run multiple times

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Optional: Backfill NULL phones to empty string for consistency (won't overwrite existing values)
UPDATE users SET phone = '' WHERE phone IS NULL;

-- (Optional future) CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
