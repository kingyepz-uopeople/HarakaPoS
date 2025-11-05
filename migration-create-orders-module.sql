-- ============================================
-- MIGRATION: Create Orders Module
-- ============================================
-- This migration creates the customers and orders tables
-- for the Orders Module with pre-order scheduling capabilities.
-- Run this in your Supabase SQL editor.

-- ============================================
-- CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view customers" ON customers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" ON customers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg DECIMAL(10, 2) NOT NULL CHECK (price_per_kg >= 0),
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card')),
  delivery_status TEXT NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Scheduled', 'Pending', 'On the Way', 'Delivered', 'Cancelled')),
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  delivery_notes TEXT,
  assigned_driver UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver ON orders(assigned_driver);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at on orders
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - uncomment to use)
-- ============================================
-- INSERT INTO customers (name, phone, location) VALUES
--   ('John Kamau', '0712345678', 'Nairobi CBD'),
--   ('Mary Wanjiku', '0723456789', 'Westlands'),
--   ('Peter Otieno', '0734567890', 'Karen');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration was successful:

-- 1. Check customers table
-- SELECT * FROM customers;

-- 2. Check orders table structure
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'orders'
-- ORDER BY ordinal_position;

-- 3. Verify indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('customers', 'orders');

-- 4. Test RLS policies
-- SELECT * FROM orders; -- Should work for authenticated users
