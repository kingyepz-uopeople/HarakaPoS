-- Add latitude and longitude columns to customers table
-- Run this in your Supabase SQL Editor

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add helpful comment
COMMENT ON COLUMN customers.latitude IS 'Latitude coordinate for customer delivery location';
COMMENT ON COLUMN customers.longitude IS 'Longitude coordinate for customer delivery location';
