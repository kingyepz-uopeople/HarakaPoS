-- Migration: Add Cost Tracking to Stock Table
-- Run this in Supabase SQL Editor if you already have the stock table created
-- This will add the cost tracking columns without dropping existing data

-- Add total_cost column (required, defaults to 0 for existing records)
ALTER TABLE stock
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0);

-- Add cost_per_kg as a generated column
ALTER TABLE stock
ADD COLUMN IF NOT EXISTS cost_per_kg DECIMAL(10, 2) GENERATED ALWAYS AS (total_cost / NULLIF(quantity_kg, 0)) STORED;

-- Optional: Remove the default value after updating existing records
-- ALTER TABLE stock ALTER COLUMN total_cost DROP DEFAULT;

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'stock'
ORDER BY ordinal_position;
