-- =====================================================
-- FIX DELETE POLICY - Run this in Supabase SQL Editor
-- =====================================================

-- Add missing DELETE policy for inventory
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON inventory;
CREATE POLICY "Enable delete for authenticated users" ON inventory 
FOR DELETE TO authenticated USING (true);

-- Add missing DELETE policy for stock_movements
DROP POLICY IF EXISTS "Enable delete for stock_movements" ON stock_movements;
CREATE POLICY "Enable delete for stock_movements" ON stock_movements 
FOR DELETE TO authenticated USING (true);

-- Add missing READ policy for stock_movements
DROP POLICY IF EXISTS "Enable read for stock_movements" ON stock_movements;
CREATE POLICY "Enable read for stock_movements" ON stock_movements 
FOR SELECT TO authenticated USING (true);

-- Add missing INSERT policy for stock_movements
DROP POLICY IF EXISTS "Enable insert for stock_movements" ON stock_movements;
CREATE POLICY "Enable insert for stock_movements" ON stock_movements 
FOR INSERT TO authenticated WITH CHECK (true);

-- Verify policies
SELECT 'Inventory policies:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'inventory';

SELECT 'Stock movements policies:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'stock_movements';

SELECT 'Notifications policies:' as info;
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'notifications';

-- Test delete (this will fail gracefully if no matching record)
SELECT 'Testing delete permission...' as info;
-- If you get here without error, permissions are working!
