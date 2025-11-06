-- =====================================================
-- BUSINESS ASSETS MANAGEMENT SYSTEM
-- Track equipment, vehicles, and other business assets
-- =====================================================

-- 1. Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name VARCHAR(255) NOT NULL,
  asset_code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  purchase_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  current_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
  purchase_date DATE NOT NULL,
  condition VARCHAR(50) NOT NULL DEFAULT 'Good' CHECK (condition IN ('Excellent', 'Good', 'Fair', 'Poor')),
  location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_code ON assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets(condition);

-- 3. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS trigger_update_assets_timestamp ON assets;
CREATE TRIGGER trigger_update_assets_timestamp
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_assets_timestamp();

-- 5. Enable Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view assets" ON assets;
CREATE POLICY "Authenticated users can view assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create assets" ON assets;
CREATE POLICY "Authenticated users can create assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update assets" ON assets;
CREATE POLICY "Authenticated users can update assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete assets" ON assets;
CREATE POLICY "Authenticated users can delete assets"
  ON assets FOR DELETE
  TO authenticated
  USING (true);

-- 7. Insert sample assets
INSERT INTO assets (asset_name, asset_code, category, purchase_value, current_value, purchase_date, condition, location, notes) VALUES
('Delivery Truck - Toyota Hilux', 'TRK-001', 'Vehicles', 2500000.00, 2000000.00, '2023-01-15', 'Good', 'Main Depot', 'Primary delivery vehicle'),
('Weighing Scale - Digital', 'EQP-001', 'Equipment', 15000.00, 12000.00, '2023-06-10', 'Excellent', 'Warehouse', '500kg capacity'),
('Dell Laptop', 'TECH-001', 'Technology', 75000.00, 50000.00, '2022-09-20', 'Good', 'Office', 'Admin laptop'),
('Office Desk', 'FUR-001', 'Furniture', 25000.00, 20000.00, '2023-03-05', 'Excellent', 'Office', 'Manager desk'),
('Mobile PDA Scanner', 'TECH-002', 'Technology', 35000.00, 28000.00, '2023-07-01', 'Excellent', 'Delivery Team', 'For driver use')
ON CONFLICT (asset_code) DO NOTHING;

-- 8. Verification
SELECT 'Assets table created successfully!' as status;
SELECT COUNT(*) as total_assets, SUM(current_value) as total_value 
FROM assets;
