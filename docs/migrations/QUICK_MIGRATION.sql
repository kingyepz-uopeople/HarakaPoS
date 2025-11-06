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

-- =====================================================
-- 10. PAYMENTS & RECEIPTS SYSTEM (FIX FOR PAYMENT ERROR)
-- =====================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'cash', 'bank_transfer', 'credit')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- M-Pesa specific fields
  transaction_id TEXT,
  phone_number TEXT,
  mpesa_request_id TEXT,
  mpesa_receipt_number TEXT,
  
  -- Tracking fields (NO FOREIGN KEY to auth.users - just store UUID)
  initiated_by UUID,
  initiated_from TEXT CHECK (initiated_from IN ('admin', 'driver', 'customer')),
  failure_reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create receipts table (if not exists)
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  receipt_number TEXT UNIQUE NOT NULL,
  
  issued_to TEXT NOT NULL,
  issued_by UUID, -- NO FOREIGN KEY to auth.users - just store UUID
  
  items JSONB NOT NULL,
  
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  payment_method TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_mpesa_request ON payments(mpesa_request_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);

-- Receipt number generator function
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_part TEXT;
  new_number TEXT;
  counter INT;
BEGIN
  date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COUNT(*) INTO counter
  FROM receipts
  WHERE receipt_number LIKE 'RCP-' || date_part || '-%';
  
  counter := counter + 1;
  sequence_part := LPAD(counter::TEXT, 5, '0');
  
  new_number := 'RCP-' || date_part || '-' || sequence_part;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate receipt number trigger
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
    NEW.receipt_number := generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_receipt_number ON receipts;
CREATE TRIGGER trigger_set_receipt_number
  BEFORE INSERT ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION set_receipt_number();

-- Update payment timestamp trigger
CREATE OR REPLACE FUNCTION update_payment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_timestamp ON payments;
CREATE TRIGGER trigger_update_payment_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_timestamp();

-- Auto-complete order when payment succeeds
CREATE OR REPLACE FUNCTION auto_complete_order_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE orders 
    SET 
      delivery_status = 'Completed',
      updated_at = now()
    WHERE id = NEW.order_id
      AND delivery_status = 'Delivered';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_complete_order ON payments;
CREATE TRIGGER trigger_auto_complete_order
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_order_on_payment();

-- Enable RLS on payments tables
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create payments" ON payments;
CREATE POLICY "Authenticated users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update payments" ON payments;
CREATE POLICY "Authenticated users can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for receipts
DROP POLICY IF EXISTS "Authenticated users can view receipts" ON receipts;
CREATE POLICY "Authenticated users can view receipts"
  ON receipts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create receipts" ON receipts;
CREATE POLICY "Authenticated users can create receipts"
  ON receipts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role full access
DROP POLICY IF EXISTS "Service role has full access to payments" ON payments;
CREATE POLICY "Service role has full access to payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to receipts" ON receipts;
CREATE POLICY "Service role has full access to receipts"
  ON receipts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify payments system created
SELECT 'Payments system ready!' as status 
WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'payments'
);

SELECT generate_receipt_number() as sample_receipt_number;
