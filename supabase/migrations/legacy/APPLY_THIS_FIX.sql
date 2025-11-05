-- =====================================================
-- QUICK FIX: Apply Status Constraint Update
-- Copy and paste this into Supabase SQL Editor and run
-- =====================================================

-- Step 1: Drop old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

-- Step 2: Add new constraint with all 6 statuses
ALTER TABLE orders ADD CONSTRAINT orders_delivery_status_check 
  CHECK (delivery_status IN (
    'Scheduled', 
    'Pending', 
    'Out for Delivery', 
    'Delivered', 
    'Completed', 
    'Cancelled'
  ));

-- Step 3: Verify the constraint was added
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'orders_delivery_status_check';

-- You should see output showing the constraint with all 6 statuses
