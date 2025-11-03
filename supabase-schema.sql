-- HarakaPOS Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Note: Supabase Auth creates users automatically
-- We extend it with a custom users table for role management

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to view all users (needed for dropdowns and assignments)
CREATE POLICY "Authenticated users can view all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own record during signup
CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- STOCK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
  source TEXT NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost >= 0),
  cost_per_kg DECIMAL(10, 2) GENERATED ALWAYS AS (total_cost / NULLIF(quantity_kg, 0)) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for stock table
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view stock
CREATE POLICY "Authenticated users can view stock" ON stock
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert stock
CREATE POLICY "Authenticated users can insert stock" ON stock
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'M-Pesa')),
  quantity_sold DECIMAL(10, 2) NOT NULL CHECK (quantity_sold > 0),
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Pending', 'On the Way', 'Delivered')),
  delivery_location TEXT,
  price_per_kg DECIMAL(10, 2) GENERATED ALWAYS AS (amount / NULLIF(quantity_sold, 0)) STORED,
  profit DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for sales table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view sales
CREATE POLICY "Authenticated users can view sales" ON sales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert sales
CREATE POLICY "Authenticated users can insert sales" ON sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update sales (for delivery status)
CREATE POLICY "Authenticated users can update sales" ON sales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- DELIVERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'On the Way', 'Delivered')) DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for deliveries table
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all deliveries
CREATE POLICY "Authenticated users can view deliveries" ON deliveries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert deliveries
CREATE POLICY "Authenticated users can insert deliveries" ON deliveries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update deliveries (for status changes)
CREATE POLICY "Authenticated users can update deliveries" ON deliveries
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL DEFAULT 'Haraka Wedges Supplies',
  phone TEXT NOT NULL DEFAULT '+254 712 345 678',
  address TEXT NOT NULL DEFAULT 'Nairobi, Kenya',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (company_name, phone, address) 
VALUES ('Haraka Wedges Supplies', '+254 712 345 678', 'Nairobi, Kenya')
ON CONFLICT DO NOTHING;

-- RLS Policies for settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view settings
CREATE POLICY "Everyone can view settings" ON settings FOR SELECT USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Authenticated users can update settings" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_stock_date ON stock(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_driver ON sales(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created ON deliveries(created_at DESC);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- You'll need to create admin and driver users via Supabase Auth UI first
-- Then run these to link them to the users table:

-- Example: After creating users in Supabase Auth, insert them here
-- Replace the UUIDs with actual user IDs from auth.users

-- INSERT INTO users (id, name, email, role) VALUES
-- ('your-admin-user-id-from-auth', 'Admin User', 'admin@harakapos.co.ke', 'admin'),
-- ('your-driver-user-id-from-auth', 'John Driver', 'driver@harakapos.co.ke', 'driver');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
