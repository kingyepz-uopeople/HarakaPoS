-- Migration: Upgrade Sales Table with Full Transaction Details
-- Run this in Supabase SQL Editor if you already have the sales table created

-- Add new columns to sales table
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'On the Way', 'Delivered')),
ADD COLUMN IF NOT EXISTS delivery_location TEXT,
ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10, 2) GENERATED ALWAYS AS (amount / NULLIF(quantity_sold, 0)) STORED,
ADD COLUMN IF NOT EXISTS profit DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove default from customer_name after updating existing records
-- ALTER TABLE sales ALTER COLUMN customer_name DROP DEFAULT;

-- Add update policy for sales (to allow drivers to update delivery status)
DROP POLICY IF EXISTS "Authenticated users can update sales" ON sales;
CREATE POLICY "Authenticated users can update sales" ON sales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;
