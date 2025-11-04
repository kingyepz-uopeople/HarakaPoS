-- =====================================================
-- PAYMENTS & RECEIPTS SYSTEM
-- For HarakaPOS Potato Business
-- Supports: M-Pesa STK Push, Cash, Bank Transfer, Credit
-- =====================================================

-- 1. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'cash', 'bank_transfer', 'credit')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- M-Pesa specific fields
  transaction_id TEXT, -- M-Pesa transaction ID
  phone_number TEXT, -- Customer phone for M-Pesa (254712345678)
  mpesa_request_id TEXT, -- CheckoutRequestID from STK push
  mpesa_receipt_number TEXT, -- M-Pesa receipt number after successful payment
  
  -- Tracking fields
  initiated_by UUID REFERENCES auth.users(id), -- Who initiated the payment
  initiated_from TEXT CHECK (initiated_from IN ('admin', 'driver', 'customer')),
  failure_reason TEXT, -- Why payment failed
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  receipt_number TEXT UNIQUE NOT NULL, -- Auto-generated: RCP-YYYYMMDD-XXXXX
  
  -- Customer info
  issued_to TEXT NOT NULL, -- Customer name
  issued_by UUID REFERENCES auth.users(id), -- Who issued the receipt
  
  -- Line items (stored as JSON)
  items JSONB NOT NULL, -- Array of {description, quantity, unit_price, total}
  
  -- Totals
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  payment_method TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_mpesa_request ON payments(mpesa_request_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_receipts_number ON receipts(receipt_number);

-- 4. Function to generate unique receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_part TEXT;
  new_number TEXT;
  counter INT;
BEGIN
  -- Get current date in YYYYMMDD format
  date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- Get count of receipts created today
  SELECT COUNT(*) INTO counter
  FROM receipts
  WHERE receipt_number LIKE 'RCP-' || date_part || '-%';
  
  -- Increment counter and pad with zeros
  counter := counter + 1;
  sequence_part := LPAD(counter::TEXT, 5, '0');
  
  -- Combine parts: RCP-20251104-00001
  new_number := 'RCP-' || date_part || '-' || sequence_part;
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger to auto-generate receipt number
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

-- 6. Function to update payment updated_at
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

-- 7. Function to auto-complete order when payment is completed
CREATE OR REPLACE FUNCTION auto_complete_order_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to 'completed', mark order as completed
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    UPDATE orders 
    SET 
      delivery_status = 'Completed',
      updated_at = now()
    WHERE id = NEW.order_id
      AND delivery_status = 'Delivered'; -- Only auto-complete if already delivered
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_complete_order ON payments;
CREATE TRIGGER trigger_auto_complete_order
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_order_on_payment();

-- 8. Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for payments
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

-- 10. RLS Policies for receipts
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

-- 11. Service role full access
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

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('payments', 'receipts')
ORDER BY table_name;

-- Check receipt number generation works
SELECT generate_receipt_number() as sample_receipt_number;

-- You should see: RCP-20251104-00001 (or similar with today's date)
