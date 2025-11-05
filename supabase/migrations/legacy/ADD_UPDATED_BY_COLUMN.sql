-- =====================================================
-- ✅ QUICK FIX: Add updated_by column to orders table
-- Copy this line and run it in Supabase SQL Editor
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- =====================================================
-- That's it! Your orders will now work. Test by:
-- 1. Going to http://localhost:3000/test-db and clicking "Run Test"
-- 2. OR adding an order in the Orders page
-- =====================================================

-- VERIFICATION (Optional): Check the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'updated_by';

-- You should see:
-- column_name | data_type | is_nullable
-- updated_by  | uuid      | YES
