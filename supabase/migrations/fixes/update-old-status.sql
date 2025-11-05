-- Migration to update old status to new status
-- Run this AFTER applying dispatch-system.sql

-- Update existing orders with old status
UPDATE orders 
SET delivery_status = 'Out for Delivery' 
WHERE delivery_status = 'On the Way';

-- Verify the update
SELECT 
  delivery_status, 
  COUNT(*) as count 
FROM orders 
GROUP BY delivery_status 
ORDER BY delivery_status;

-- Expected results: No "On the Way" status should exist
