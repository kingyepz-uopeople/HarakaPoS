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

-- Display success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Orders table now supports delivery location tracking.';
  RAISE NOTICE 'Using OpenStreetMap (Nominatim) for geocoding - completely FREE!';
END $$;
