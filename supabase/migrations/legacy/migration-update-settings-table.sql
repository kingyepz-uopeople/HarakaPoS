-- Migration: Update Settings Table to Key-Value Structure
-- Run this in Supabase SQL Editor if you have an existing settings table

-- Drop old settings table if it exists
DROP TABLE IF EXISTS settings CASCADE;

-- Create new key-value settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings
INSERT INTO settings (key, value, type, description) VALUES
('price_per_kg', '120', 'number', 'Default price per kg for potato sales'),
('delivery_fee_flat', '100', 'number', 'Flat delivery fee'),
('payment_modes', '["Cash", "M-Pesa", "Bank Transfer"]', 'json', 'Available payment methods'),
('business_name', 'Haraka Wedges Supplies', 'string', 'Business name'),
('business_phone', '+254 712 345 678', 'string', 'Business phone number'),
('business_address', 'Nairobi, Kenya', 'string', 'Business address'),
('currency', 'KES', 'string', 'Currency code'),
('tax_rate', '0', 'number', 'Tax rate percentage (0 = no tax)')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Everyone can view settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users can update settings" ON settings;

-- Create new policies
CREATE POLICY "Everyone can view settings" ON settings 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update settings" ON settings
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_settings_timestamp ON settings;
CREATE TRIGGER update_settings_timestamp
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Verify the migration
SELECT * FROM settings ORDER BY key;
