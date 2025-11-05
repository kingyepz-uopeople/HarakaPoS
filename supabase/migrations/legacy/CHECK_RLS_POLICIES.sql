-- =====================================================
-- CHECK AND FIX RLS (Row Level Security) POLICIES
-- If error is {} it might be an RLS permissions issue
-- =====================================================

-- 1. Check if RLS is enabled on orders table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'orders';

-- 2. Check existing policies on orders table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders';

-- 3. TEMPORARY FIX: Disable RLS for testing
-- WARNING: This makes the table accessible to everyone
-- Only use this temporarily to test if RLS is the issue
-- Uncomment below to test:

/*
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
*/

-- 4. PROPER FIX: Enable RLS with correct policies
-- Run this after testing with RLS disabled

/*
-- Re-enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON orders;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON orders;

-- Create new policies
-- Allow SELECT for authenticated users
CREATE POLICY "Enable read access for authenticated users" ON orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow INSERT for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow UPDATE for authenticated users
CREATE POLICY "Enable update for authenticated users" ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow DELETE for authenticated users
CREATE POLICY "Enable delete for authenticated users" ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow all operations for service role (for server-side operations)
CREATE POLICY "Service role has full access" ON orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
*/
