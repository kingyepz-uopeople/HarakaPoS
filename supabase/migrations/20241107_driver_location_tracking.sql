-- Migration: Driver Real-time Location Tracking
-- Created: 2024-11-07
-- Purpose: Enable real-time tracking of driver locations for customer delivery updates

-- Create driver_locations table for real-time GPS tracking
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION, -- GPS accuracy in meters
  heading DOUBLE PRECISION, -- Compass direction (0-360)
  speed DOUBLE PRECISION, -- Speed in m/s
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for fast queries by order and driver
CREATE INDEX IF NOT EXISTS idx_driver_locations_order ON driver_locations(order_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_driver_locations_timestamp ON driver_locations(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Drivers can insert/update their own locations
CREATE POLICY driver_locations_insert_own ON driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY driver_locations_update_own ON driver_locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id);

-- RLS Policy: Anyone can read driver locations (for public tracking page)
CREATE POLICY driver_locations_read_all ON driver_locations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_driver_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Trigger to auto-update updated_at
CREATE TRIGGER driver_locations_updated_at
  BEFORE UPDATE ON driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_driver_location_timestamp();

-- Enable Realtime for driver_locations
ALTER PUBLICATION supabase_realtime ADD TABLE driver_locations;

-- Create view for latest driver positions per order
CREATE OR REPLACE VIEW latest_driver_positions 
WITH (security_invoker=true) AS
SELECT DISTINCT ON (order_id)
  id,
  driver_id,
  order_id,
  latitude,
  longitude,
  accuracy,
  heading,
  speed,
  timestamp,
  created_at
FROM driver_locations
ORDER BY order_id, timestamp DESC;

-- Add delivery tracking URL to orders table (for SMS notifications)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Add estimated arrival time to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_arrival_time TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS route_distance_km DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS route_duration_minutes INTEGER;

-- Create function to calculate distance between two GPS points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  r DOUBLE PRECISION := 6371000; -- Earth radius in meters
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = public;

-- Create function to check if driver is within geofence (for auto-arrival)
CREATE OR REPLACE FUNCTION is_driver_near_destination(
  p_order_id UUID,
  p_radius_meters DOUBLE PRECISION DEFAULT 50
)
RETURNS BOOLEAN AS $$
DECLARE
  v_driver_lat DOUBLE PRECISION;
  v_driver_lng DOUBLE PRECISION;
  v_dest_lat DOUBLE PRECISION;
  v_dest_lng DOUBLE PRECISION;
  v_distance DOUBLE PRECISION;
BEGIN
  -- Get latest driver position
  SELECT latitude, longitude INTO v_driver_lat, v_driver_lng
  FROM driver_locations
  WHERE order_id = p_order_id
  ORDER BY timestamp DESC
  LIMIT 1;
  
  -- Get order destination
  SELECT delivery_latitude, delivery_longitude INTO v_dest_lat, v_dest_lng
  FROM orders
  WHERE id = p_order_id;
  
  -- Return false if any coordinate is missing
  IF v_driver_lat IS NULL OR v_driver_lng IS NULL OR 
     v_dest_lat IS NULL OR v_dest_lng IS NULL THEN
    RETURN false;
  END IF;
  
  -- Calculate distance
  v_distance := calculate_distance_meters(
    v_driver_lat, v_driver_lng,
    v_dest_lat, v_dest_lng
  );
  
  RETURN v_distance <= p_radius_meters;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Cleanup function to remove old location data (keep last 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_driver_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM driver_locations
  WHERE timestamp < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

COMMENT ON TABLE driver_locations IS 'Real-time GPS tracking of drivers during deliveries';
COMMENT ON FUNCTION calculate_distance_meters IS 'Calculate distance between two GPS coordinates using Haversine formula';
COMMENT ON FUNCTION is_driver_near_destination IS 'Check if driver is within geofence radius of delivery destination';
