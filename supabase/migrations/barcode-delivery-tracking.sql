-- =============================================
-- Barcode Delivery Tracking System
-- For HarakaPOS - Haraka Wedges Supplies
-- =============================================

-- 1. Delivery Barcodes Table
-- Stores unique barcodes for each delivery/order
CREATE TABLE IF NOT EXISTS delivery_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  
  -- Generation info
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  
  -- Delivery info
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  delivery_location TEXT,
  quantity_kg NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'printed', 'loading', 'in_transit', 'delivered', 'failed', 'cancelled')),
  
  -- Scan tracking
  first_scan_at TIMESTAMP WITH TIME ZONE,
  first_scanned_by UUID REFERENCES auth.users(id),
  last_scan_at TIMESTAMP WITH TIME ZONE,
  last_scanned_by UUID REFERENCES auth.users(id),
  scan_count INTEGER DEFAULT 0,
  
  -- Delivery completion
  delivered_at TIMESTAMP WITH TIME ZONE,
  delivered_by UUID REFERENCES auth.users(id),
  delivery_photo_url TEXT,
  delivery_signature_url TEXT,
  delivery_notes TEXT,
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Barcode Scan Log Table
-- Tracks every scan of a barcode for audit trail
CREATE TABLE IF NOT EXISTS barcode_scan_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode_id UUID REFERENCES delivery_barcodes(id) ON DELETE CASCADE NOT NULL,
  barcode VARCHAR(50) NOT NULL,
  
  -- Scan details
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scanned_by UUID REFERENCES auth.users(id),
  scan_type VARCHAR(50) NOT NULL CHECK (scan_type IN ('generate', 'print', 'loading', 'departure', 'arrival', 'delivery', 'verification')),
  
  -- Location
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  location_accuracy NUMERIC(5, 2), -- meters
  location_address TEXT,
  
  -- Device info
  device_type VARCHAR(50), -- 'mobile', 'pda', 'scanner', 'web'
  device_id VARCHAR(255),
  user_agent TEXT,
  
  -- Status change
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  
  -- Notes and attachments
  notes TEXT,
  photo_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Delivery Route Tracking
-- Tracks driver's route during delivery
CREATE TABLE IF NOT EXISTS delivery_route_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode_id UUID REFERENCES delivery_barcodes(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Location
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  accuracy NUMERIC(5, 2),
  altitude NUMERIC(8, 2),
  speed NUMERIC(6, 2), -- km/h
  heading NUMERIC(5, 2), -- degrees
  
  -- Timestamp
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Battery and connectivity
  battery_level INTEGER, -- 0-100
  is_online BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX idx_delivery_barcodes_barcode ON delivery_barcodes(barcode);
CREATE INDEX idx_delivery_barcodes_order ON delivery_barcodes(order_id);
CREATE INDEX idx_delivery_barcodes_sale ON delivery_barcodes(sale_id);
CREATE INDEX idx_delivery_barcodes_status ON delivery_barcodes(status);
CREATE INDEX idx_delivery_barcodes_generated_at ON delivery_barcodes(generated_at);

CREATE INDEX idx_barcode_scan_log_barcode_id ON barcode_scan_log(barcode_id);
CREATE INDEX idx_barcode_scan_log_scanned_at ON barcode_scan_log(scanned_at);
CREATE INDEX idx_barcode_scan_log_scanned_by ON barcode_scan_log(scanned_by);
CREATE INDEX idx_barcode_scan_log_scan_type ON barcode_scan_log(scan_type);

CREATE INDEX idx_delivery_route_tracking_barcode ON delivery_route_tracking(barcode_id);
CREATE INDEX idx_delivery_route_tracking_driver ON delivery_route_tracking(driver_id);
CREATE INDEX idx_delivery_route_tracking_recorded_at ON delivery_route_tracking(recorded_at);

-- 5. Function to generate unique barcode
CREATE OR REPLACE FUNCTION generate_delivery_barcode()
RETURNS TEXT AS $$
DECLARE
  new_barcode TEXT;
  barcode_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate barcode: HWS-YYYYMMDD-NNNN (e.g., HWS-20251105-0001)
    new_barcode := 'HWS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                   LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Check if barcode already exists
    SELECT EXISTS(SELECT 1 FROM delivery_barcodes WHERE barcode = new_barcode) INTO barcode_exists;
    
    -- If unique, return it
    IF NOT barcode_exists THEN
      RETURN new_barcode;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to log barcode scan
CREATE OR REPLACE FUNCTION log_barcode_scan(
  p_barcode TEXT,
  p_user_id UUID,
  p_scan_type TEXT,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_photo_url TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_barcode_id UUID;
  v_old_status TEXT;
  v_scan_log_id UUID;
BEGIN
  -- Get barcode ID and current status
  SELECT id, status INTO v_barcode_id, v_old_status
  FROM delivery_barcodes
  WHERE barcode = p_barcode;

  IF v_barcode_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Barcode not found');
  END IF;

  -- Insert scan log
  INSERT INTO barcode_scan_log (
    barcode_id, barcode, scanned_by, scan_type,
    latitude, longitude, old_status, new_status, notes, photo_url
  ) VALUES (
    v_barcode_id, p_barcode, p_user_id, p_scan_type,
    p_latitude, p_longitude, v_old_status, p_new_status, p_notes, p_photo_url
  ) RETURNING id INTO v_scan_log_id;

  -- Update barcode record
  UPDATE delivery_barcodes SET
    last_scan_at = NOW(),
    last_scanned_by = p_user_id,
    scan_count = scan_count + 1,
    status = COALESCE(p_new_status, status),
    first_scan_at = COALESCE(first_scan_at, NOW()),
    first_scanned_by = COALESCE(first_scanned_by, p_user_id),
    updated_at = NOW()
  WHERE id = v_barcode_id;

  -- If status is delivered, update delivery timestamp
  IF p_new_status = 'delivered' THEN
    UPDATE delivery_barcodes SET
      delivered_at = NOW(),
      delivered_by = p_user_id,
      delivery_photo_url = COALESCE(p_photo_url, delivery_photo_url),
      delivery_notes = COALESCE(p_notes, delivery_notes)
    WHERE id = v_barcode_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'barcode_id', v_barcode_id,
    'scan_log_id', v_scan_log_id,
    'old_status', v_old_status,
    'new_status', COALESCE(p_new_status, v_old_status)
  );
END;
$$ LANGUAGE plpgsql;

-- 7. Function to get barcode details with history
CREATE OR REPLACE FUNCTION get_barcode_details(p_barcode TEXT)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'barcode', db.barcode,
    'status', db.status,
    'customer_name', db.customer_name,
    'customer_phone', db.customer_phone,
    'delivery_location', db.delivery_location,
    'quantity_kg', db.quantity_kg,
    'total_amount', db.total_amount,
    'generated_at', db.generated_at,
    'first_scan_at', db.first_scan_at,
    'last_scan_at', db.last_scan_at,
    'scan_count', db.scan_count,
    'delivered_at', db.delivered_at,
    'delivery_photo_url', db.delivery_photo_url,
    'delivery_notes', db.delivery_notes,
    'customer_rating', db.customer_rating,
    'scan_history', (
      SELECT json_agg(
        json_build_object(
          'scanned_at', bsl.scanned_at,
          'scan_type', bsl.scan_type,
          'old_status', bsl.old_status,
          'new_status', bsl.new_status,
          'latitude', bsl.latitude,
          'longitude', bsl.longitude,
          'notes', bsl.notes,
          'photo_url', bsl.photo_url
        ) ORDER BY bsl.scanned_at DESC
      )
      FROM barcode_scan_log bsl
      WHERE bsl.barcode_id = db.id
    )
  ) INTO v_result
  FROM delivery_barcodes db
  WHERE db.barcode = p_barcode;

  RETURN COALESCE(v_result, json_build_object('error', 'Barcode not found'));
END;
$$ LANGUAGE plpgsql;

-- 8. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_delivery_barcodes_updated_at
  BEFORE UPDATE ON delivery_barcodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. RLS Policies
ALTER TABLE delivery_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_scan_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_route_tracking ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all barcodes
CREATE POLICY "Allow authenticated users to read barcodes"
  ON delivery_barcodes FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create barcodes
CREATE POLICY "Allow authenticated users to create barcodes"
  ON delivery_barcodes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update barcodes
CREATE POLICY "Allow authenticated users to update barcodes"
  ON delivery_barcodes FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to read scan logs
CREATE POLICY "Allow authenticated users to read scan logs"
  ON barcode_scan_log FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create scan logs
CREATE POLICY "Allow authenticated users to create scan logs"
  ON barcode_scan_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to track routes
CREATE POLICY "Allow authenticated users to track routes"
  ON delivery_route_tracking FOR ALL
  TO authenticated
  USING (true);

-- 10. Sample data (optional - remove in production)
-- Uncomment to add sample barcode
/*
INSERT INTO delivery_barcodes (
  barcode, customer_name, customer_phone, delivery_location,
  quantity_kg, total_amount, status
) VALUES (
  'HWS-20251105-0001',
  'Test Customer',
  '254712345678',
  'Nairobi, Kenya',
  50,
  6000,
  'pending'
);
*/

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Barcode Delivery Tracking System installed successfully!';
  RAISE NOTICE 'Tables created: delivery_barcodes, barcode_scan_log, delivery_route_tracking';
  RAISE NOTICE 'Functions created: generate_delivery_barcode(), log_barcode_scan(), get_barcode_details()';
END $$;
