-- Migration: Add location fields to orders table
-- Description: Adds delivery address and GPS coordinates to orders for Google Maps integration
-- Date: 2025-11-05

-- Add delivery location columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8);

-- Add index for location-based queries (optional, for future features like radius search)
CREATE INDEX IF NOT EXISTS idx_orders_location 
ON orders (delivery_latitude, delivery_longitude)
WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;

-- Add comment to columns
COMMENT ON COLUMN orders.delivery_address IS 'Customer delivery address (text)';
COMMENT ON COLUMN orders.delivery_latitude IS 'GPS latitude for delivery location (decimal degrees)';
COMMENT ON COLUMN orders.delivery_longitude IS 'GPS longitude for delivery location (decimal degrees)';

-- Optional: Add Google Maps API key to settings if not exists
INSERT INTO settings (key, value, type, description)
VALUES (
  'google_maps_api_key',
  '',
  'string',
  'Google Maps JavaScript API key for location features (autocomplete, maps)'
)
ON CONFLICT (key) DO NOTHING;

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Orders table now supports delivery location tracking.';
  RAISE NOTICE 'Please add your Google Maps API key in the settings page.';
END $$;
