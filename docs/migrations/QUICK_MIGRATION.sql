-- =====================================================
-- SIMPLIFIED MIGRATION - Run this FIRST
-- Copy and paste this entire file into Supabase SQL Editor
-- =====================================================

-- 1. Add eTIMS tax fields to receipts table
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 16.00;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_verification_url TEXT;

-- 2. Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 10,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_perishable BOOLEAN DEFAULT false,
  expiry_date DATE,
  wastage_quantity DECIMAL(10,2) DEFAULT 0,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  reference_id UUID,
  reference_type VARCHAR(50),
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert sample inventory data
INSERT INTO inventory (product_name, product_code, category, current_stock, unit, reorder_level, unit_cost, unit_price, is_perishable) VALUES
('Potatoes', 'POT-001', 'Vegetables', 500, 'kg', 100, 80, 120, true),
('Tomatoes', 'TOM-001', 'Vegetables', 300, 'kg', 50, 90, 150, true),
('Onions', 'ONI-001', 'Vegetables', 200, 'kg', 50, 100, 140, true),
('Carrots', 'CAR-001', 'Vegetables', 150, 'kg', 40, 110, 160, true),
('Cabbage', 'CAB-001', 'Vegetables', 100, 'kg', 30, 70, 100, true),
('Spinach', 'SPI-001', 'Vegetables', 50, 'kg', 20, 120, 180, true),
('Kale', 'KAL-001', 'Vegetables', 80, 'kg', 25, 100, 150, true),
('Delivery Bags', 'BAG-001', 'Packaging', 1000, 'pieces', 200, 5, 10, false),
('Labels', 'LAB-001', 'Packaging', 5000, 'pieces', 500, 1, 2, false)
ON CONFLICT (product_code) DO NOTHING;

-- 6. Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- 7. Create basic policies (allow all authenticated users)
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory;
CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory;
CREATE POLICY "Enable insert for authenticated users" ON inventory FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON inventory;
CREATE POLICY "Enable update for authenticated users" ON inventory FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON inventory;
CREATE POLICY "Enable delete for authenticated users" ON inventory FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read for stock_movements" ON stock_movements;
CREATE POLICY "Enable read for stock_movements" ON stock_movements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for stock_movements" ON stock_movements;
CREATE POLICY "Enable insert for stock_movements" ON stock_movements FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for stock_movements" ON stock_movements;
CREATE POLICY "Enable delete for stock_movements" ON stock_movements FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
CREATE POLICY "Users can view notifications" ON notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
CREATE POLICY "Users can update notifications" ON notifications FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;
CREATE POLICY "Users can delete notifications" ON notifications FOR DELETE TO authenticated USING (true);

-- 8. Verify tables created
SELECT 'SUCCESS! Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory', 'stock_movements', 'notifications')
ORDER BY table_name;

-- 9. Verify sample data loaded
SELECT 'Sample inventory items:' as status, COUNT(*) as count FROM inventory;
