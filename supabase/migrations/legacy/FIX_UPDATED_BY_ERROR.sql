-- =====================================================
-- FIX: "record new has no field updated_by" Error
-- This error occurs when a trigger references a non-existent column
-- =====================================================

-- Step 1: Check what triggers exist on the orders table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- Step 2: Check if updated_by column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- =====================================================
-- SOLUTION OPTIONS (Choose ONE based on findings above)
-- =====================================================

-- OPTION A: Add the missing updated_by column
-- (Run this if the column doesn't exist and you want to track who updates records)
-- ALTER TABLE orders ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- OPTION B: Drop the problematic trigger
-- (Run this if you don't need the trigger - replace 'trigger_name' with actual name from Step 1)
-- DROP TRIGGER IF EXISTS update_updated_by_trigger ON orders;

-- OPTION C: Fix the trigger to only set updated_at (not updated_by)
-- First, let's see what the trigger function does:
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%update%';
