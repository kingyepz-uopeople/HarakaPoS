-- =====================================================
-- COMPLETE FIX: Add updated_by column to orders table
-- This fixes the "record new has no field updated_by" error
-- =====================================================

-- Step 1: Add the missing updated_by column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Step 2: Set a default value for existing records (optional - use current user or null)
UPDATE orders SET updated_by = NULL WHERE updated_by IS NULL;

-- Step 3: Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'updated_by';

-- Step 4: Test that the trigger now works
-- You should now be able to insert orders without errors!

-- =====================================================
-- VERIFICATION: Check the trigger is working
-- =====================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders'
  AND trigger_name = 'trigger_log_order_status';

-- This should show the trigger that logs status changes
