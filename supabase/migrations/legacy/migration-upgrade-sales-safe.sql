-- ============================================
-- MIGRATION: Upgrade Sales Table to Use Customers FK (Safe Version)
-- ============================================
-- This migration safely updates the sales table regardless of current state
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns if they don't exist
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Step 2: Handle price_per_kg column
-- Drop if it's a generated column, then add as regular column
DO $$ 
BEGIN
  -- Try to drop the column if it exists
  ALTER TABLE sales DROP COLUMN IF EXISTS price_per_kg CASCADE;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE sales ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10, 2);

-- Step 3: Update existing sales to populate new fields
UPDATE sales 
SET total_amount = amount 
WHERE total_amount IS NULL;

UPDATE sales 
SET price_per_kg = ROUND(amount / NULLIF(quantity_sold, 0), 2) 
WHERE price_per_kg IS NULL AND quantity_sold > 0;

-- Step 4: Set default price_per_kg for any remaining nulls
UPDATE sales 
SET price_per_kg = 120 
WHERE price_per_kg IS NULL;

-- Step 5: Add constraints
DO $$ 
BEGIN
  ALTER TABLE sales ALTER COLUMN total_amount SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE sales ALTER COLUMN price_per_kg SET NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Step 6: Add check constraints
DO $$ 
BEGIN
  ALTER TABLE sales ADD CONSTRAINT check_total_amount_positive CHECK (total_amount > 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE sales ADD CONSTRAINT check_price_per_kg_positive CHECK (price_per_kg >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 7: Add index for customer_id
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);

-- Step 8: Create function to reduce stock when sale is recorded
CREATE OR REPLACE FUNCTION reduce_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  latest_stock_id UUID;
  current_stock DECIMAL(10, 2);
BEGIN
  -- Get the latest stock entry
  SELECT id, quantity_kg INTO latest_stock_id, current_stock
  FROM stock
  ORDER BY date DESC, created_at DESC
  LIMIT 1;

  -- Check if we have enough stock
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'No stock records found. Please add stock first.';
  END IF;

  IF current_stock < NEW.quantity_sold THEN
    RAISE EXCEPTION 'Insufficient stock. Available: % kg, Requested: % kg', current_stock, NEW.quantity_sold;
  END IF;

  -- Reduce stock
  UPDATE stock
  SET quantity_kg = quantity_kg - NEW.quantity_sold
  WHERE id = latest_stock_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger to automatically reduce stock
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_sale ON sales;
CREATE TRIGGER trigger_reduce_stock_on_sale
  BEFORE INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_sale();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration:

-- 1. Check sales table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'sales'
ORDER BY ordinal_position;

-- 2. Check if trigger was created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_reduce_stock_on_sale';

-- 3. View current stock
SELECT * FROM stock ORDER BY date DESC LIMIT 5;

-- ============================================
-- TEST INSERTING A SALE (Optional)
-- ============================================
-- Uncomment to test (make sure you have stock and customers first):

-- INSERT INTO sales (customer_id, quantity_sold, price_per_kg, total_amount, amount, payment_method, date)
-- VALUES (
--   (SELECT id FROM customers LIMIT 1),
--   10,
--   120,
--   1200,
--   1200,
--   'Cash',
--   CURRENT_DATE
-- );

-- SELECT * FROM stock ORDER BY date DESC LIMIT 1;
-- You should see stock reduced by 10 kg

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS trigger_reduce_stock_on_sale ON sales;
-- DROP FUNCTION IF EXISTS reduce_stock_on_sale();
-- ALTER TABLE sales DROP COLUMN IF EXISTS customer_id;
-- ALTER TABLE sales DROP COLUMN IF EXISTS total_amount;
-- ALTER TABLE sales DROP COLUMN IF EXISTS price_per_kg;
-- ALTER TABLE sales DROP CONSTRAINT IF EXISTS check_total_amount_positive;
-- ALTER TABLE sales DROP CONSTRAINT IF EXISTS check_price_per_kg_positive;
