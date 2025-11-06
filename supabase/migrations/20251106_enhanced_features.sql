-- =====================================================
-- HarakaPOS - Enhanced Features Migration
-- eTIMS Integration, Inventory Management, Notifications
-- Created: November 6, 2025
-- =====================================================

-- =====================================================
-- 1. RECEIPTS TABLE - Add eTIMS fields
-- =====================================================

ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 16.00;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_verification_url TEXT;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_submitted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_receipts_etims_invoice ON receipts(etims_invoice_number);
CREATE INDEX IF NOT EXISTS idx_receipts_etims_status ON receipts(etims_status);

-- =====================================================
-- 2. INVENTORY TABLE - Real-time stock management
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_inventory_product_code ON inventory(product_code);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_level ON inventory(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry ON inventory(expiry_date) WHERE is_perishable = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_timestamp();

-- =====================================================
-- 3. STOCK MOVEMENTS TABLE - Track all inventory changes
-- =====================================================

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL, -- 'in', 'out', 'adjustment', 'wastage'
  quantity DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  reference_id UUID, -- order_id, sale_id, etc
  reference_type VARCHAR(50), -- 'order', 'sale', 'adjustment', 'wastage'
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_id, reference_type);

-- =====================================================
-- 4. NOTIFICATIONS TABLE - System-wide alerts
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'low_stock', 'expiring_soon', 'payment_received', 'order_created', 'wastage_alert', 'general'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 5. FUNCTIONS - Automated notification triggers
-- =====================================================

-- Function to create low stock notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock <= NEW.reorder_level AND OLD.current_stock > OLD.reorder_level THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      u.id,
      'low_stock',
      'Low Stock Alert',
      'Product "' || NEW.product_name || '" is low on stock. Current: ' || NEW.current_stock || ' ' || NEW.unit || ', Reorder at: ' || NEW.reorder_level,
      '/dashboard/inventory'
    FROM auth.users u
    WHERE u.role IN ('admin', 'manager');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_low_stock_trigger
  AFTER UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock();

-- Function to create expiring soon notifications
CREATE OR REPLACE FUNCTION check_expiring_items()
RETURNS void AS $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN 
    SELECT * FROM inventory 
    WHERE is_perishable = true 
    AND expiry_date IS NOT NULL
    AND expiry_date <= CURRENT_DATE + INTERVAL '7 days'
    AND expiry_date >= CURRENT_DATE
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    SELECT 
      u.id,
      'expiring_soon',
      'Product Expiring Soon',
      'Product "' || item.product_name || '" expires on ' || item.expiry_date || '. Current stock: ' || item.current_stock || ' ' || item.unit,
      '/dashboard/inventory'
    FROM auth.users u
    WHERE u.role IN ('admin', 'manager')
    AND NOT EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = u.id 
      AND n.type = 'expiring_soon' 
      AND n.message LIKE '%' || item.product_name || '%'
      AND n.created_at > CURRENT_DATE
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create payment notification
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  SELECT 
    u.id,
    'payment_received',
    'Payment Received',
    'Payment of KES ' || NEW.amount || ' received via ' || NEW.payment_method,
    '/dashboard/receipts'
  FROM auth.users u
  WHERE u.role IN ('admin', 'manager');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_received_trigger
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- =====================================================
-- 6. SEED DATA - Sample inventory items
-- =====================================================

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

-- =====================================================
-- 7. RLS POLICIES - Row Level Security
-- =====================================================

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Inventory policies
CREATE POLICY "Users can view inventory" ON inventory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage inventory" ON inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND role IN ('admin', 'manager')
    )
  );

-- Stock movements policies
CREATE POLICY "Users can view stock movements" ON stock_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can create stock movements" ON stock_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.uid() = id 
      AND role IN ('admin', 'manager')
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. VIEWS - Helpful analytics views
-- =====================================================

-- Low stock items view
CREATE OR REPLACE VIEW low_stock_items AS
SELECT 
  i.*,
  (i.current_stock * i.unit_cost) as total_value,
  (i.reorder_level - i.current_stock) as quantity_to_order
FROM inventory i
WHERE i.current_stock <= i.reorder_level
ORDER BY (i.current_stock / NULLIF(i.reorder_level, 0)) ASC;

-- Expiring items view
CREATE OR REPLACE VIEW expiring_items AS
SELECT 
  i.*,
  (i.expiry_date - CURRENT_DATE) as days_until_expiry,
  (i.current_stock * i.unit_cost) as potential_loss
FROM inventory i
WHERE i.is_perishable = true
  AND i.expiry_date IS NOT NULL
  AND i.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
  AND i.expiry_date >= CURRENT_DATE
ORDER BY i.expiry_date ASC;

-- Stock value view
CREATE OR REPLACE VIEW inventory_value AS
SELECT 
  category,
  COUNT(*) as item_count,
  SUM(current_stock) as total_stock,
  SUM(current_stock * unit_cost) as total_cost_value,
  SUM(current_stock * unit_price) as total_sales_value,
  SUM((unit_price - unit_cost) * current_stock) as potential_profit
FROM inventory
GROUP BY category;

-- =====================================================
-- 9. SCHEDULED JOBS - Daily checks (requires pg_cron extension)
-- =====================================================

-- Note: Uncomment if pg_cron extension is available

-- SELECT cron.schedule(
--   'check-expiring-items',
--   '0 8 * * *', -- Every day at 8 AM
--   $$ SELECT check_expiring_items(); $$
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant permissions
GRANT ALL ON inventory TO authenticated;
GRANT ALL ON stock_movements TO authenticated;
GRANT ALL ON notifications TO authenticated;

-- Verify tables
SELECT 
  'inventory' as table_name, 
  COUNT(*) as row_count 
FROM inventory
UNION ALL
SELECT 
  'notifications' as table_name, 
  COUNT(*) as row_count 
FROM notifications
UNION ALL
SELECT 
  'stock_movements' as table_name, 
  COUNT(*) as row_count 
FROM stock_movements;
