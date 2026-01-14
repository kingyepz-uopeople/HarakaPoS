-- =====================================================
-- Add GavaConnect Provider Support to eTIMS
-- Allows using GavaConnect middleware for eTIMS integration
-- =====================================================

-- Add provider selection and GavaConnect credentials to etims_config
ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'gavaconnect' CHECK (provider IN ('kra', 'gavaconnect'));

ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS gavaconnect_app_id TEXT;

ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS gavaconnect_api_key TEXT;

ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS gavaconnect_api_secret TEXT;

-- Add OSCU-specific fields (for cloud-based integration)
ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS oscu_device_id TEXT;

ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS oscu_serial_number TEXT;

ALTER TABLE etims_config 
ADD COLUMN IF NOT EXISTS oscu_status TEXT DEFAULT 'inactive' CHECK (oscu_status IN ('active', 'inactive', 'pending'));

-- Add OSCU fields to invoices table
ALTER TABLE etims_invoices 
ADD COLUMN IF NOT EXISTS oscu_serial_number TEXT;

ALTER TABLE etims_invoices 
ADD COLUMN IF NOT EXISTS qr_code_url TEXT;

-- Add comment to explain the provider options
COMMENT ON COLUMN etims_config.provider IS 'Integration provider: kra (direct KRA API) or gavaconnect (GavaConnect middleware)';
COMMENT ON COLUMN etims_config.gavaconnect_app_id IS 'GavaConnect Application ID from dashboard';
COMMENT ON COLUMN etims_config.gavaconnect_api_key IS 'GavaConnect API Key for authentication';
COMMENT ON COLUMN etims_config.gavaconnect_api_secret IS 'GavaConnect API Secret for authentication';
COMMENT ON COLUMN etims_config.oscu_device_id IS 'Online Sales Control Unit device identifier (cloud-based)';
COMMENT ON COLUMN etims_config.oscu_status IS 'OSCU initialization status';
