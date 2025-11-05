-- =====================================================
-- DIAGNOSTIC: Check Current Database Constraints
-- Run this in Supabase SQL Editor to see what's wrong
-- =====================================================

-- 1. Check the current delivery_status constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'orders_delivery_status_check';

-- 2. Check ALL constraints on the orders table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass
ORDER BY conname;

-- 3. Check the orders table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 4. Try to insert a test order (THIS WILL FAIL IF CONSTRAINT IS WRONG)
-- Uncomment the lines below to test
/*
INSERT INTO orders (
  customer_id,
  quantity_kg,
  price_per_kg,
  payment_mode,
  delivery_status,
  delivery_date
) VALUES (
  (SELECT id FROM customers LIMIT 1),
  10.5,
  120,
  'Cash',
  'Pending',
  CURRENT_DATE
);

-- If the above fails, you'll see the exact error
-- If it succeeds, roll it back:
-- ROLLBACK;
*/
