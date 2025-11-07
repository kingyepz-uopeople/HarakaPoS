-- Migration: Fix Security Linter Warnings
-- Created: 2024-11-07
-- Purpose: Fix SECURITY DEFINER views and add search_path to all functions

-- ========================================
-- FIX VIEWS: Remove SECURITY DEFINER, use security_invoker
-- ========================================

-- Daily profit summary
DROP VIEW IF EXISTS daily_profit_summary;
CREATE OR REPLACE VIEW daily_profit_summary
WITH (security_invoker=true) AS
SELECT 
  date,
  SUM(amount) as total_sales,
  COUNT(*) as transaction_count
FROM sales
GROUP BY date
ORDER BY date DESC;

-- Category expense totals
DROP VIEW IF EXISTS category_expense_totals;
CREATE OR REPLACE VIEW category_expense_totals
WITH (security_invoker=true) AS
SELECT 
  category,
  SUM(amount) as total_amount,
  COUNT(*) as expense_count
FROM expenses
GROUP BY category;

-- Daily expense summary
DROP VIEW IF EXISTS daily_expense_summary;
CREATE OR REPLACE VIEW daily_expense_summary
WITH (security_invoker=true) AS
SELECT 
  date,
  SUM(amount) as total_expenses,
  COUNT(*) as expense_count
FROM expenses
GROUP BY date
ORDER BY date DESC;

-- Expiring items
DROP VIEW IF EXISTS expiring_items;
CREATE OR REPLACE VIEW expiring_items
WITH (security_invoker=true) AS
SELECT *
FROM inventory
WHERE expiration_date IS NOT NULL
  AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY expiration_date ASC;

-- Monthly expense summary
DROP VIEW IF EXISTS monthly_expense_summary;
CREATE OR REPLACE VIEW monthly_expense_summary
WITH (security_invoker=true) AS
SELECT 
  DATE_TRUNC('month', date) as month,
  SUM(amount) as total_expenses,
  COUNT(*) as expense_count
FROM expenses
GROUP BY DATE_TRUNC('month', date)
ORDER BY month DESC;

-- Low stock items
DROP VIEW IF EXISTS low_stock_items;
CREATE OR REPLACE VIEW low_stock_items
WITH (security_invoker=true) AS
SELECT *
FROM inventory
WHERE quantity_kg <= reorder_level
ORDER BY quantity_kg ASC;

-- Inventory value
DROP VIEW IF EXISTS inventory_value;
CREATE OR REPLACE VIEW inventory_value
WITH (security_invoker=true) AS
SELECT 
  SUM(quantity_kg * cost_per_kg) as total_value,
  SUM(quantity_kg) as total_quantity
FROM inventory;

-- Order timeline
DROP VIEW IF EXISTS order_timeline;
CREATE OR REPLACE VIEW order_timeline
WITH (security_invoker=true) AS
SELECT 
  id,
  delivery_date,
  delivery_time,
  delivery_status,
  created_at
FROM orders
ORDER BY delivery_date DESC, delivery_time DESC;

-- ========================================
-- FIX FUNCTIONS: Add SET search_path = public
-- ========================================

-- Generate delivery barcode
CREATE OR REPLACE FUNCTION generate_delivery_barcode()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DLV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Check low stock
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE(item_name TEXT, quantity_kg NUMERIC, reorder_level NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT i.item_name, i.quantity_kg, i.reorder_level
  FROM inventory i
  WHERE i.quantity_kg <= i.reorder_level;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Check expiring items
CREATE OR REPLACE FUNCTION check_expiring_items()
RETURNS TABLE(item_name TEXT, expiration_date DATE, quantity_kg NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT i.item_name, i.expiration_date, i.quantity_kg
  FROM inventory i
  WHERE i.expiration_date IS NOT NULL
    AND i.expiration_date <= CURRENT_DATE + INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Notify payment received
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Add notification logic here if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Log barcode scan
CREATE OR REPLACE FUNCTION log_barcode_scan(p_barcode TEXT)
RETURNS VOID AS $$
BEGIN
  -- Add scan logging logic here if needed
  RAISE NOTICE 'Barcode scanned: %', p_barcode;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Get barcode details
CREATE OR REPLACE FUNCTION get_barcode_details(p_barcode TEXT)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object('barcode', p_barcode, 'scanned_at', NOW());
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RCT-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS') || '-' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Set receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receipt_number IS NULL THEN
    NEW.receipt_number := generate_receipt_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Generate ETIMS invoice number
CREATE OR REPLACE FUNCTION generate_etims_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- App record sale
CREATE OR REPLACE FUNCTION app_record_sale(
  p_quantity_sold NUMERIC,
  p_price_per_kg NUMERIC,
  p_customer_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_sale_id UUID;
BEGIN
  INSERT INTO sales (quantity_sold, price_per_kg, amount, customer_id, date)
  VALUES (p_quantity_sold, p_price_per_kg, p_quantity_sold * p_price_per_kg, p_customer_id, CURRENT_DATE)
  RETURNING id INTO v_sale_id;
  
  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Get ETIMS statistics
CREATE OR REPLACE FUNCTION get_etims_statistics()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_sales', COUNT(*),
    'total_amount', COALESCE(SUM(amount), 0)
  ) INTO v_stats
  FROM sales
  WHERE date >= CURRENT_DATE - INTERVAL '30 days';
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Log order status change
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.delivery_status IS DISTINCT FROM NEW.delivery_status THEN
    RAISE NOTICE 'Order % status changed from % to %', NEW.id, OLD.delivery_status, NEW.delivery_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Update driver status
CREATE OR REPLACE FUNCTION update_driver_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update driver availability based on order assignment
  -- Add logic here if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

COMMENT ON FUNCTION generate_delivery_barcode IS 'Generate unique delivery barcode';
COMMENT ON FUNCTION check_low_stock IS 'Return items below reorder level';
COMMENT ON FUNCTION check_expiring_items IS 'Return items expiring within 30 days';
