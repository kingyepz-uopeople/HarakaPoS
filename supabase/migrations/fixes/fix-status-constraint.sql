-- =====================================================
-- FIX ORDER STATUS CONSTRAINT
-- Updates the delivery_status check constraint to support new statuses
-- =====================================================

-- Drop old constraint if exists
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

-- Add new constraint with all 6 statuses
ALTER TABLE orders ADD CONSTRAINT orders_delivery_status_check 
  CHECK (delivery_status IN (
    'Scheduled', 
    'Pending', 
    'Out for Delivery', 
    'Delivered', 
    'Completed', 
    'Cancelled'
  ));

-- Verify constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'orders_delivery_status_check';
