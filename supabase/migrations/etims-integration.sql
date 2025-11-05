-- =====================================================
-- eTIMS (KRA Tax Integration) MODULE
-- For HarakaPOS - Haraka Wedges Supplies
-- Kenya Revenue Authority Tax Compliance System
-- =====================================================

-- 1. eTIMS Configuration Table
-- Stores business and Control Unit (CU) settings
CREATE TABLE IF NOT EXISTS etims_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Information
  business_name TEXT NOT NULL DEFAULT 'Haraka Wedges Supplies',
  kra_pin TEXT NOT NULL, -- Business KRA PIN (e.g., P051234567X)
  business_type TEXT DEFAULT 'sole_proprietorship',
  
  -- Control Unit (CU) Information
  cu_serial_number TEXT UNIQUE, -- Device serial number from KRA
  cu_model TEXT, -- Device model
  cu_status TEXT DEFAULT 'inactive' CHECK (cu_status IN ('active', 'inactive', 'pending')),
  
  -- eTIMS Environment
  environment TEXT DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  api_base_url TEXT,
  
  -- Credentials
  bhf_id TEXT, -- Branch ID
  tin TEXT, -- Tax Identification Number
  device_initialization_date TIMESTAMPTZ,
  
  -- Invoice Numbering
  last_invoice_number INTEGER DEFAULT 0,
  invoice_prefix TEXT DEFAULT 'INV', -- e.g., INV-2025-001
  
  -- Settings
  auto_submit BOOLEAN DEFAULT true, -- Auto-submit to KRA
  require_internet BOOLEAN DEFAULT true, -- Require internet for sales
  print_qr_code BOOLEAN DEFAULT true, -- Print QR on receipts
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  configured_by UUID REFERENCES auth.users(id)
);

-- 2. eTIMS Invoices Table
-- Stores all tax invoices submitted to KRA
CREATE TABLE IF NOT EXISTS etims_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invoice Identification
  invoice_number TEXT UNIQUE NOT NULL, -- INV-2025-001
  internal_data TEXT UNIQUE, -- KRA internal reference
  receipt_number TEXT, -- Links to receipts table
  
  -- Related Records
  sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  order_id UUID, -- If from delivery order
  
  -- Customer Information
  customer_tin TEXT, -- Customer's KRA PIN (optional for individuals)
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Invoice Details
  invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Amounts
  total_before_tax DECIMAL(10, 2) NOT NULL,
  vat_amount DECIMAL(10, 2) DEFAULT 0,
  total_after_tax DECIMAL(10, 2) NOT NULL,
  
  -- Tax Information
  vat_rate DECIMAL(5, 2) DEFAULT 0, -- 0% or 16% in Kenya
  tax_type TEXT DEFAULT 'VAT_EXEMPT' CHECK (tax_type IN ('VAT_EXEMPT', 'VAT_STANDARD', 'VAT_ZERO')),
  
  -- KRA Submission
  submission_status TEXT DEFAULT 'pending' CHECK (submission_status IN (
    'pending',      -- Not yet submitted
    'submitted',    -- Sent to KRA
    'approved',     -- KRA approved
    'rejected',     -- KRA rejected
    'failed'        -- Technical failure
  )),
  submission_date TIMESTAMPTZ,
  
  -- KRA Response
  kra_response JSONB, -- Full KRA API response
  kra_invoice_number TEXT, -- KRA-generated invoice number
  kra_verification_url TEXT, -- URL to verify on KRA portal
  qr_code_data TEXT, -- QR code content for receipt
  
  -- Receipt Signature (KRA Digital Signature)
  receipt_signature TEXT,
  signature_date TIMESTAMPTZ,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_date TIMESTAMPTZ,
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. eTIMS Invoice Items Table
-- Line items for each invoice
CREATE TABLE IF NOT EXISTS etims_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES etims_invoices(id) ON DELETE CASCADE,
  
  -- Item Details
  item_sequence INTEGER NOT NULL, -- Line number (1, 2, 3...)
  item_code TEXT, -- Product code
  item_name TEXT NOT NULL,
  
  -- Quantity & Pricing
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Tax Information
  tax_type TEXT DEFAULT 'VAT_EXEMPT',
  vat_category TEXT, -- A, B, C, D, E (KRA categories)
  vat_rate DECIMAL(5, 2) DEFAULT 0,
  vat_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Packaging
  package_unit TEXT DEFAULT 'BAG', -- BAG, KG, UNIT, etc.
  package_quantity DECIMAL(10, 2),
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. eTIMS Sync Log
-- Track all API communications with KRA
CREATE TABLE IF NOT EXISTS etims_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Request Details
  operation_type TEXT NOT NULL, -- 'submit_invoice', 'device_init', 'check_status', etc.
  request_payload JSONB,
  request_timestamp TIMESTAMPTZ DEFAULT now(),
  
  -- Response Details
  response_payload JSONB,
  response_timestamp TIMESTAMPTZ,
  response_code INTEGER,
  
  -- Status
  status TEXT CHECK (status IN ('success', 'failed', 'timeout')),
  error_message TEXT,
  
  -- Related Records
  invoice_id UUID REFERENCES etims_invoices(id),
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_etims_invoices_invoice_number ON etims_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_etims_invoices_sale_id ON etims_invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_etims_invoices_submission_status ON etims_invoices(submission_status);
CREATE INDEX IF NOT EXISTS idx_etims_invoices_invoice_date ON etims_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_etims_invoice_items_invoice_id ON etims_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_etims_sync_log_invoice_id ON etims_sync_log(invoice_id);
CREATE INDEX IF NOT EXISTS idx_etims_sync_log_created_at ON etims_sync_log(created_at);

-- 6. Row Level Security (RLS) Policies
ALTER TABLE etims_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE etims_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE etims_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE etims_sync_log ENABLE ROW LEVEL SECURITY;

-- Admin-only access to eTIMS configuration
CREATE POLICY "Admin full access to etims_config"
ON etims_config FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can view all invoices, drivers can view their own
CREATE POLICY "Admin view all etims_invoices"
ON etims_invoices FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin insert etims_invoices"
ON etims_invoices FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin update etims_invoices"
ON etims_invoices FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin-only access to invoice items
CREATE POLICY "Admin access etims_invoice_items"
ON etims_invoice_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin-only access to sync logs
CREATE POLICY "Admin access etims_sync_log"
ON etims_sync_log FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 7. Functions for Invoice Number Generation
CREATE OR REPLACE FUNCTION generate_etims_invoice_number()
RETURNS TEXT AS $$
DECLARE
  config_row RECORD;
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get current config
  SELECT * INTO config_row FROM etims_config LIMIT 1;
  
  IF config_row IS NULL THEN
    RAISE EXCEPTION 'eTIMS not configured. Please configure eTIMS settings first.';
  END IF;
  
  -- Increment invoice number
  next_number := config_row.last_invoice_number + 1;
  
  -- Format: INV-2025-001
  invoice_num := config_row.invoice_prefix || '-' || 
                 TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || 
                 LPAD(next_number::TEXT, 5, '0');
  
  -- Update config
  UPDATE etims_config SET last_invoice_number = next_number;
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to Get eTIMS Statistics
CREATE OR REPLACE FUNCTION get_etims_statistics(
  start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_invoices BIGINT,
  approved_invoices BIGINT,
  pending_invoices BIGINT,
  rejected_invoices BIGINT,
  total_revenue DECIMAL,
  total_vat_collected DECIMAL,
  compliance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_invoices,
    COUNT(*) FILTER (WHERE submission_status = 'approved')::BIGINT as approved_invoices,
    COUNT(*) FILTER (WHERE submission_status = 'pending')::BIGINT as pending_invoices,
    COUNT(*) FILTER (WHERE submission_status = 'rejected')::BIGINT as rejected_invoices,
    COALESCE(SUM(total_after_tax), 0) as total_revenue,
    COALESCE(SUM(vat_amount), 0) as total_vat_collected,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE submission_status = 'approved')::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0 
    END as compliance_rate
  FROM etims_invoices
  WHERE invoice_date >= start_date AND invoice_date <= end_date;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger to Update Timestamps
CREATE OR REPLACE FUNCTION update_etims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER etims_config_updated_at
BEFORE UPDATE ON etims_config
FOR EACH ROW EXECUTE FUNCTION update_etims_updated_at();

CREATE TRIGGER etims_invoices_updated_at
BEFORE UPDATE ON etims_invoices
FOR EACH ROW EXECUTE FUNCTION update_etims_updated_at();

-- 10. Insert Default Configuration
INSERT INTO etims_config (
  business_name,
  kra_pin,
  business_type,
  environment,
  api_base_url,
  invoice_prefix
) VALUES (
  'Haraka Wedges Supplies',
  'P000000000A', -- CHANGE THIS to your actual KRA PIN
  'sole_proprietorship',
  'sandbox',
  'https://etims-api-sbx.kra.go.ke/etims-api', -- Sandbox URL
  'INV'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP COMPLETE
-- Next steps:
-- 1. Update KRA PIN in etims_config table
-- 2. Get CU (Control Unit) from KRA
-- 3. Register device and get serial number
-- 4. Update cu_serial_number in config
-- 5. Test in sandbox environment
-- =====================================================
