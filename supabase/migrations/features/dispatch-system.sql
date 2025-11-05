-- =====================================================
-- DISPATCH SYSTEM MIGRATION
-- Adds tracking, status logs, and delivery proof
-- =====================================================

-- 1. Create order_status_logs table for audit trail
CREATE TABLE IF NOT EXISTS order_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON order_status_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_logs_changed_at ON order_status_logs(changed_at DESC);

-- 2. Create delivery_proof table
CREATE TABLE IF NOT EXISTS delivery_proof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  photo_url TEXT,
  signature_url TEXT,
  delivered_at TIMESTAMP DEFAULT NOW(),
  delivered_by UUID REFERENCES users(id),
  customer_notes TEXT,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  payment_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_proof_order_id ON delivery_proof(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proof_delivered_by ON delivery_proof(delivered_by);

-- 3. Create driver_status table for tracking driver availability
CREATE TABLE IF NOT EXISTS driver_status (
  driver_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('available', 'busy', 'offline')) DEFAULT 'offline',
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  last_updated TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_status_status ON driver_status(status);

-- 4. Update orders table - ensure we have all needed columns
-- (Most columns should already exist, this is just to be safe)
DO $$ 
BEGIN
  -- Add sale_id column to link order to auto-created sale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'sale_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN sale_id UUID REFERENCES sales(id) ON DELETE SET NULL;
  END IF;

  -- Add delivery_proof_id for quick reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'delivery_proof_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_proof_id UUID REFERENCES delivery_proof(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Create function to automatically log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.delivery_status IS DISTINCT FROM NEW.delivery_status) 
     OR TG_OP = 'INSERT' THEN
    INSERT INTO order_status_logs (order_id, status, changed_by, notes)
    VALUES (
      NEW.id, 
      NEW.delivery_status,
      NEW.updated_by, -- You may need to track who made the change
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'Order created'
        ELSE 'Status changed from ' || COALESCE(OLD.delivery_status, 'none') || ' to ' || NEW.delivery_status
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status logging
DROP TRIGGER IF EXISTS trigger_log_order_status ON orders;
CREATE TRIGGER trigger_log_order_status
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- 6. Create function to auto-update driver status based on orders
CREATE OR REPLACE FUNCTION update_driver_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When order status changes to "Out for Delivery", mark driver as busy
  IF NEW.delivery_status = 'Out for Delivery' AND NEW.assigned_driver IS NOT NULL THEN
    INSERT INTO driver_status (driver_id, status, last_updated)
    VALUES (NEW.assigned_driver, 'busy', NOW())
    ON CONFLICT (driver_id) 
    DO UPDATE SET status = 'busy', last_updated = NOW();
  
  -- When order is delivered or completed, check if driver has other active deliveries
  ELSIF NEW.delivery_status IN ('Delivered', 'Completed') AND NEW.assigned_driver IS NOT NULL THEN
    -- Check if driver has other active deliveries
    IF NOT EXISTS (
      SELECT 1 FROM orders 
      WHERE assigned_driver = NEW.assigned_driver 
      AND delivery_status IN ('Scheduled', 'Pending', 'Out for Delivery')
      AND id != NEW.id
    ) THEN
      -- No other active deliveries, mark as available
      INSERT INTO driver_status (driver_id, status, last_updated)
      VALUES (NEW.assigned_driver, 'available', NOW())
      ON CONFLICT (driver_id) 
      DO UPDATE SET status = 'available', last_updated = NOW();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for driver status updates
DROP TRIGGER IF EXISTS trigger_update_driver_status ON orders;
CREATE TRIGGER trigger_update_driver_status
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_status();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proof ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_status_logs (drop existing first)
DROP POLICY IF EXISTS "Allow all authenticated users to read status logs" ON order_status_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert status logs" ON order_status_logs;

CREATE POLICY "Allow all authenticated users to read status logs"
  ON order_status_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert status logs"
  ON order_status_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for delivery_proof (drop existing first)
DROP POLICY IF EXISTS "Allow all authenticated users to read delivery proof" ON delivery_proof;
DROP POLICY IF EXISTS "Allow drivers to insert delivery proof" ON delivery_proof;
DROP POLICY IF EXISTS "Allow drivers to update their own delivery proof" ON delivery_proof;

CREATE POLICY "Allow all authenticated users to read delivery proof"
  ON delivery_proof FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow drivers to insert delivery proof"
  ON delivery_proof FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow drivers to update their own delivery proof"
  ON delivery_proof FOR UPDATE
  TO authenticated
  USING (delivered_by = auth.uid());

-- RLS Policies for driver_status (drop existing first)
DROP POLICY IF EXISTS "Allow all authenticated users to read driver status" ON driver_status;
DROP POLICY IF EXISTS "Allow drivers to update their own status" ON driver_status;

CREATE POLICY "Allow all authenticated users to read driver status"
  ON driver_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow drivers to update their own status"
  ON driver_status FOR ALL
  TO authenticated
  USING (driver_id = auth.uid());

-- 8. Create helpful views
CREATE OR REPLACE VIEW order_timeline AS
SELECT 
  o.id as order_id,
  o.customer_id,
  c.name as customer_name,
  o.delivery_status as current_status,
  o.assigned_driver,
  u.name as driver_name,
  o.delivery_date,
  o.sale_id,
  o.delivery_proof_id,
  json_agg(
    json_build_object(
      'status', osl.status,
      'changed_at', osl.changed_at,
      'notes', osl.notes
    ) ORDER BY osl.changed_at ASC
  ) as status_history
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.assigned_driver = u.id
LEFT JOIN order_status_logs osl ON o.id = osl.order_id
GROUP BY o.id, c.name, u.name;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_sale_id ON orders(sale_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver ON orders(assigned_driver);

-- Done!
COMMENT ON TABLE order_status_logs IS 'Tracks all status changes for orders (audit trail)';
COMMENT ON TABLE delivery_proof IS 'Stores proof of delivery (photos, signatures, payment confirmation)';
COMMENT ON TABLE driver_status IS 'Tracks real-time driver availability and location';
