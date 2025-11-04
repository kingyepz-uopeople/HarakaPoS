# Dispatch System Testing Guide

## Prerequisites
1. ✅ Applied `dispatch-system.sql` migration
2. ✅ Applied `update-old-status.sql` migration
3. ✅ Have at least one driver user account
4. ✅ Have at least one customer
5. ✅ Have stock available

## Test Scenario 1: Complete Order Flow (Happy Path)

### Setup
```sql
-- Ensure you have a driver
SELECT id, name, role FROM users WHERE role = 'driver';

-- Ensure you have a customer
SELECT id, name, phone, location FROM customers LIMIT 1;

-- Check current stock
SELECT * FROM stock WHERE quantity_in_stock > 0 LIMIT 1;
```

### Step 1: Admin Creates Order (as Admin)
1. Navigate to `/dashboard/orders`
2. Click "Add Order"
3. Fill in order details:
   - Customer: Select any customer
   - Quantity: 10 kg
   - Price per kg: 120 (or your default)
   - Payment Mode: Cash
   - Status: **Scheduled**
   - Delivery Date: Tomorrow
   - Assigned Driver: Leave empty
4. Click "Add Order"
5. **Verify**: Order appears in "Scheduled" tab

### Step 2: Admin Assigns Driver (as Admin)
1. In the orders table, find the new order
2. In the "Driver" column dropdown, select a driver
3. **Verify**: 
   - Driver name appears
   - Status remains "Scheduled"

### Step 3: Admin Updates to Pending (as Admin)
1. In the same row, Status dropdown → Select "Pending"
2. **Verify**:
   - Status badge turns yellow
   - Order appears in "Pending" tab
   - Check database:
     ```sql
     SELECT * FROM order_status_logs 
     WHERE order_id = 'YOUR_ORDER_ID' 
     ORDER BY changed_at DESC;
     ```
   - Should see log: `Scheduled` → `Pending`

### Step 4: Driver Starts Delivery (as Driver)
1. Logout from admin
2. Login with driver credentials
3. Navigate to `/driver`
4. **Verify**: See the pending order
5. Click "Start Delivery" button
6. **Verify**:
   - Toast/success message
   - Order badge turns blue "Out for Delivery"
   - Order moves to "Out for Delivery" section
7. **Check Database**:
   ```sql
   -- Check sale was auto-created
   SELECT * FROM sales WHERE order_id = 'YOUR_ORDER_ID';
   
   -- Check stock was reduced
   SELECT * FROM stock;
   
   -- Check status log
   SELECT * FROM order_status_logs 
   WHERE order_id = 'YOUR_ORDER_ID' 
   ORDER BY changed_at DESC LIMIT 1;
   
   -- Check driver status (should be 'busy')
   SELECT * FROM driver_status WHERE driver_id = 'YOUR_DRIVER_ID';
   ```

### Step 5: Driver Completes Delivery (as Driver)
1. Still on `/driver` page
2. Find the order (now in "Out for Delivery")
3. Click "Complete Delivery" button
4. **Verify**: Payment confirmation modal appears with:
   - Payment method dropdown (Cash, M-Pesa, Bank Transfer, Credit Card)
   - Customer notes textarea
   - Cancel and "Confirm Payment" buttons
5. Select payment method: **M-Pesa**
6. Add notes: "Customer paid via M-Pesa. Transaction ID: ABC123"
7. Click "Confirm Payment"
8. **Verify**:
   - Modal closes
   - Success message appears
   - Order disappears from driver dashboard (status = "Completed")
9. **Check Database**:
   ```sql
   -- Check order status updated
   SELECT delivery_status FROM orders WHERE id = 'YOUR_ORDER_ID';
   -- Should be: 'Completed'
   
   -- Check sale payment method updated
   SELECT payment_method FROM sales WHERE order_id = 'YOUR_ORDER_ID';
   -- Should be: 'M-Pesa'
   
   -- Check delivery proof created
   SELECT * FROM delivery_proof WHERE order_id = 'YOUR_ORDER_ID';
   -- Should have: payment_method, notes, driver_id, timestamps
   
   -- Check status logs
   SELECT * FROM order_status_logs 
   WHERE order_id = 'YOUR_ORDER_ID' 
   ORDER BY changed_at;
   -- Should have 3 entries: Scheduled→Pending, Pending→Out for Delivery, Out for Delivery→Completed
   
   -- Check driver status (should be 'available' again)
   SELECT * FROM driver_status WHERE driver_id = 'YOUR_DRIVER_ID';
   ```

### Step 6: Admin Reviews Completed Order (as Admin)
1. Login as admin
2. Navigate to `/dashboard/orders`
3. Click "Completed" tab
4. **Verify**: See the completed order with green "Completed" badge
5. **Verify Stats Cards**:
   - Completed: 1 (or +1)
   - Revenue: Includes this order's total
6. Navigate to `/dashboard/sales`
7. **Verify**: See the auto-created sale with:
   - Order ID linked
   - Payment method: M-Pesa
   - Correct customer, quantity, price

## Test Scenario 2: Cancellation Flow

### Step 1: Create Order (as Admin)
1. Create new order with status "Scheduled"

### Step 2: Cancel Order (as Admin)
1. In orders table, change status to "Cancelled"
2. **Verify**:
   - Status badge turns red
   - Order appears in "Cancelled" tab
3. **Check Database**:
   ```sql
   -- Check status log
   SELECT * FROM order_status_logs 
   WHERE order_id = 'YOUR_ORDER_ID';
   -- Should have: Scheduled → Cancelled
   ```

## Test Scenario 3: Multi-Driver Workflow

### Setup
Create 3 orders, assign to 3 different drivers:
```sql
-- Order 1: Driver A, Status: Pending
-- Order 2: Driver B, Status: Pending
-- Order 3: Driver C, Status: Pending
```

### Test
1. Login as Driver A
   - **Verify**: Only see Order 1
2. Start delivery on Order 1
   - **Verify**: Driver A status = 'busy'
3. Login as Driver B
   - **Verify**: Only see Order 2
4. Start delivery on Order 2
   - **Verify**: Driver B status = 'busy'
5. Login as Driver A again
6. Complete delivery on Order 1
   - **Verify**: Driver A status = 'available'
7. **Check Database**:
   ```sql
   SELECT driver_id, status FROM driver_status;
   -- Driver A: available
   -- Driver B: busy
   -- Driver C: offline (or available if they logged in)
   ```

## Test Scenario 4: Deliveries Page Filtering

### Setup
Create orders with different statuses:
- 2 orders: Scheduled
- 2 orders: Pending
- 2 orders: Out for Delivery
- 2 orders: Completed
- 1 order: Cancelled

### Test (as Admin)
1. Navigate to `/dashboard/deliveries`
2. **Verify Stats Cards**:
   - Scheduled: 2
   - Pending: 2
   - Out for Delivery: 2
3. **Verify Table**:
   - Only shows 6 orders (Scheduled + Pending + Out for Delivery)
   - Does NOT show Completed or Cancelled
4. Filter by status: "Pending"
   - **Verify**: Only 2 pending orders show
5. Filter by driver
   - **Verify**: Only that driver's orders show

## Test Scenario 5: Sales Page Order Selection

### Setup
Create orders with different statuses:
- 1 order: Scheduled
- 1 order: Pending  
- 1 order: Out for Delivery
- 1 order: Completed

### Test (as Admin)
1. Navigate to `/dashboard/sales`
2. Click "Add Sale"
3. Select mode: "From Order"
4. **Verify Order Dropdown**:
   - Shows 3 orders (Scheduled, Pending, Out for Delivery)
   - Does NOT show Completed order
5. Select an order
6. **Verify**:
   - Customer auto-fills
   - Quantity auto-fills
   - Price auto-fills
   - Location auto-fills
   - Driver auto-fills

## Test Scenario 6: Order Timeline View

### Test (as Admin)
```sql
-- View complete order journey
SELECT * FROM order_timeline WHERE order_id = 'YOUR_COMPLETED_ORDER_ID';

-- Expected JSON structure:
{
  "order_id": "uuid",
  "current_status": "Completed",
  "customer_name": "John Doe",
  "driver_name": "Driver Name",
  "status_history": [
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "status": "Scheduled",
      "changed_by": "Admin Name",
      "notes": null
    },
    {
      "timestamp": "2024-01-01T11:00:00Z",
      "status": "Pending",
      "changed_by": "Admin Name",
      "notes": null
    },
    {
      "timestamp": "2024-01-01T14:00:00Z",
      "status": "Out for Delivery",
      "changed_by": "Driver Name",
      "notes": "Started delivery"
    },
    {
      "timestamp": "2024-01-01T15:30:00Z",
      "status": "Completed",
      "changed_by": "Driver Name",
      "notes": "Customer paid via M-Pesa. Transaction ID: ABC123"
    }
  ]
}
```

## Performance Testing

### Test 1: Large Dataset
```sql
-- Create 100 orders
DO $$
DECLARE
  customer_id UUID;
  driver_id UUID;
BEGIN
  SELECT id INTO customer_id FROM customers LIMIT 1;
  SELECT id INTO driver_id FROM users WHERE role = 'driver' LIMIT 1;
  
  FOR i IN 1..100 LOOP
    INSERT INTO orders (
      customer_id, 
      quantity_kg, 
      price_per_kg, 
      total_price,
      payment_mode,
      delivery_status,
      delivery_date,
      assigned_driver
    ) VALUES (
      customer_id,
      10,
      120,
      1200,
      'Cash',
      CASE 
        WHEN i % 6 = 0 THEN 'Scheduled'
        WHEN i % 6 = 1 THEN 'Pending'
        WHEN i % 6 = 2 THEN 'Out for Delivery'
        WHEN i % 6 = 3 THEN 'Delivered'
        WHEN i % 6 = 4 THEN 'Completed'
        ELSE 'Cancelled'
      END,
      CURRENT_DATE + (i % 30) * INTERVAL '1 day',
      driver_id
    );
  END LOOP;
END $$;
```

### Test 2: Page Load Speed
1. Navigate to `/dashboard/orders`
   - **Measure**: Time to load with 100+ orders
   - **Expected**: < 2 seconds
2. Click different status tabs
   - **Expected**: Instant filter (client-side)

### Test 3: Concurrent Drivers
1. Open 3 browser windows (incognito for each)
2. Login as 3 different drivers
3. All start deliveries simultaneously
4. **Verify**: No race conditions, all sales created correctly

## Error Testing

### Test 1: Stock Shortage
1. Set stock quantity to 5 kg
2. Create order for 10 kg
3. Driver starts delivery
4. **Verify**: Error message or stock goes negative (depends on implementation)

### Test 2: Duplicate Sale Creation
1. Driver starts delivery
2. Quickly click "Start Delivery" again before first completes
3. **Verify**: Second click does nothing OR error message

### Test 3: Payment Confirmation Without Delivery
1. Try to access payment confirmation without being "Out for Delivery"
2. **Verify**: Button disabled or error message

## Database Integrity Checks

```sql
-- Check for orphaned sales (sales without orders)
SELECT s.* FROM sales s 
LEFT JOIN orders o ON s.order_id = o.id 
WHERE s.order_id IS NOT NULL AND o.id IS NULL;
-- Should return 0 rows

-- Check for orders without status logs
SELECT o.* FROM orders o 
LEFT JOIN order_status_logs l ON o.id = l.order_id 
WHERE l.id IS NULL;
-- May have rows if orders created before migration

-- Check driver status consistency
SELECT ds.*, o.delivery_status 
FROM driver_status ds 
LEFT JOIN orders o ON ds.current_order_id = o.id 
WHERE ds.status = 'busy' AND (o.delivery_status != 'Out for Delivery' OR o.delivery_status IS NULL);
-- Should return 0 rows

-- Check delivery proof has corresponding completed orders
SELECT dp.* FROM delivery_proof dp 
INNER JOIN orders o ON dp.order_id = o.id 
WHERE o.delivery_status != 'Completed';
-- Should return 0 rows
```

## Rollback Plan

If issues occur:

```sql
-- Drop new tables
DROP TABLE IF EXISTS delivery_proof CASCADE;
DROP TABLE IF EXISTS order_status_logs CASCADE;
DROP TABLE IF EXISTS driver_status CASCADE;
DROP VIEW IF EXISTS order_timeline;

-- Drop triggers
DROP TRIGGER IF EXISTS log_order_status_changes ON orders;
DROP TRIGGER IF EXISTS update_driver_status_on_order_change ON orders;
DROP FUNCTION IF EXISTS log_order_status_change();
DROP FUNCTION IF EXISTS update_driver_availability();

-- Revert status values in code
-- Change "Out for Delivery" back to "On the Way"
```

## Success Criteria

✅ All test scenarios pass without errors  
✅ Status logs created automatically  
✅ Driver status updates correctly  
✅ Sales auto-created on delivery start  
✅ Payment confirmation recorded  
✅ No orphaned data  
✅ Page load times acceptable  
✅ UI responsive on all pages  
✅ Revenue calculations accurate  
✅ Filtering works correctly  

## Common Issues & Solutions

### Issue: "Start Delivery" button does nothing
**Solution**: Check browser console for errors. Verify sale creation permissions in Supabase RLS.

### Issue: Status logs not created
**Solution**: Verify trigger installed. Run:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'log_order_status_changes';
```

### Issue: Driver status stuck on "busy"
**Solution**: Manually reset:
```sql
UPDATE driver_status SET status = 'available', current_order_id = NULL 
WHERE driver_id = 'YOUR_DRIVER_ID';
```

### Issue: Revenue not updating
**Solution**: Check if both "Delivered" and "Completed" are counted:
```sql
SELECT delivery_status, SUM(total_price) 
FROM orders 
WHERE delivery_status IN ('Delivered', 'Completed') 
GROUP BY delivery_status;
```
