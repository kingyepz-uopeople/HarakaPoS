-- ============================================
-- MIGRATION: Upgrade Sales Table to Use Customers FK
-- ============================================
-- This migration updates the sales table to:
-- 1. Add customer_id as foreign key to customers table
-- 2. Add total_amount field
-- 3. Update price_per_kg to be a stored field (not generated)
-- 4. Keep customer_name for historical records (make nullable)
-- 5. Add stock reduction trigger on sale insert

-- Step 1: Add new columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Step 2: Add customer_name column if it doesn't exist (for backward compatibility)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Step 3: Drop the generated price_per_kg column if it exists and recreate as regular column
ALTER TABLE sales DROP COLUMN IF EXISTS price_per_kg;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10, 2);

-- Step 4: Update existing sales to set total_amount = amount
UPDATE sales SET total_amount = amount WHERE total_amount IS NULL;

-- Step 5: Update existing sales to set price_per_kg = amount / quantity_sold
UPDATE sales 
SET price_per_kg = ROUND(amount / NULLIF(quantity_sold, 0), 2) 
WHERE price_per_kg IS NULL AND quantity_sold > 0;

-- Step 6: Make price_per_kg required for new sales
ALTER TABLE sales ALTER COLUMN price_per_kg SET NOT NULL;

-- Step 7: Add constraints
ALTER TABLE sales ALTER COLUMN total_amount SET NOT NULL;

-- Add check constraints (use DO block to handle existing constraints)
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

-- Step 8: Add index for customer_id
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);

-- Step 9: Create function to reduce stock when sale is recorded
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

-- Step 10: Create trigger to automatically reduce stock
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
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'sales'
-- ORDER BY ordinal_position;

-- 2. Test inserting a sale with customer_id
-- INSERT INTO sales (customer_id, quantity_sold, price_per_kg, total_amount, payment_method, date)
-- VALUES (
--   (SELECT id FROM customers LIMIT 1),
--   10.5,
--   120,
--   1260,
--   'Cash',
--   CURRENT_DATE
-- );

-- 3. Verify stock was reduced
-- SELECT * FROM stock ORDER BY date DESC LIMIT 1;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- To rollback this migration:
-- DROP TRIGGER IF EXISTS trigger_reduce_stock_on_sale ON sales;
-- DROP FUNCTION IF EXISTS reduce_stock_on_sale();
-- ALTER TABLE sales DROP COLUMN IF EXISTS customer_id;
-- ALTER TABLE sales DROP COLUMN IF EXISTS total_amount;
-- ALTER TABLE sales ALTER COLUMN customer_name SET NOT NULL;
