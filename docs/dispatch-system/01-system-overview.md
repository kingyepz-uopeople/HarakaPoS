# Dispatch System Status Update

## Summary
Updated the entire application to support the new 6-status dispatch system workflow:
1. **Scheduled** - Order created, awaiting assignment
2. **Pending** - Order assigned, ready for pickup
3. **Out for Delivery** - Driver has started delivery (auto-creates sale)
4. **Delivered** - Driver has delivered, awaiting payment confirmation
5. **Completed** - Payment confirmed, order fully closed
6. **Cancelled** - Order cancelled at any stage

## Old vs New Status Flow

### Old System (3 statuses)
```
Scheduled → Pending → On the Way → Delivered
```

### New System (6 statuses)
```
Scheduled → Pending → Out for Delivery → Delivered → Completed
                ↓
            Cancelled (from any stage)
```

## Files Updated

### 1. Type Definitions (`lib/types.ts`)
- ✅ Updated `OrderStatus` type with 6 statuses
- ✅ Added detailed comments for each status
- ✅ Added `OrderStatusLog` interface for audit trail
- ✅ Added `DeliveryProof` interface for payment confirmation
- ✅ Added `DriverStatus` interface for availability tracking

### 2. Database Migration (`supabase/migrations/dispatch-system.sql`)
- ✅ Created `order_status_logs` table - tracks all status changes
- ✅ Created `delivery_proof` table - stores delivery confirmation and payment details
- ✅ Created `driver_status` table - real-time driver availability
- ✅ Added triggers for auto-logging status changes
- ✅ Added triggers for auto-updating driver availability
- ✅ Created `order_timeline` view for complete order history
- ✅ Implemented Row Level Security (RLS) policies

### 3. Driver Dashboard (`app/driver/page.tsx`)
- ✅ Updated status filters to use new statuses
- ✅ Updated `getStatusColor()` function for all 6 statuses
- ✅ Updated `getStatusIcon()` function for all 6 statuses
- ✅ Implemented `startDelivery()` - creates sale automatically on "Out for Delivery"
- ✅ Implemented `confirmDelivery()` - records payment and marks order "Completed"
- ✅ Added payment confirmation modal with 4 payment methods
- ✅ Added customer notes field for delivery confirmation
- ✅ Updated action buttons to handle new workflow

**Driver Workflow:**
```typescript
1. View orders with status "Pending" or "Out for Delivery"
2. Click "Start Delivery" → 
   - Auto-creates sale linked to order
   - Updates order to "Out for Delivery"
   - Reduces stock quantity
3. Navigate to customer (GPS integration)
4. Click "Complete Delivery" →
   - Opens payment confirmation modal
   - Select payment method (Cash/M-Pesa/Bank/Card)
   - Add customer notes (optional)
5. Confirm →
   - Updates sale payment method
   - Creates delivery_proof record
   - Updates order to "Completed"
   - Updates driver status to "available"
```

### 4. Orders Page (`app/dashboard/orders/page.tsx`)
- ✅ Updated stats cards from 6 to 7 cards (added "Completed")
- ✅ Updated stats calculation to track all 6 statuses
- ✅ Updated revenue calculation to include both "Delivered" and "Completed"
- ✅ Updated status tabs to include all 6 statuses
- ✅ Updated status select dropdown in table with all 6 options
- ✅ Updated status color coding for visual distinction
- ✅ Updated form modal status select with all 6 options
- ✅ Added `whitespace-nowrap` to prevent tab wrapping

**Status Colors:**
- **Scheduled**: Gray (bg-gray-100, text-gray-800)
- **Pending**: Yellow (bg-yellow-100, text-yellow-800)
- **Out for Delivery**: Blue (bg-blue-100, text-blue-800)
- **Delivered**: Green (bg-green-100, text-green-800)
- **Completed**: Emerald (bg-emerald-100, text-emerald-800)
- **Cancelled**: Red (bg-red-100, text-red-800)

### 5. Deliveries Page (`app/dashboard/deliveries/page.tsx`)
- ✅ Updated query to fetch "Out for Delivery" instead of "On the Way"
- ✅ Updated stats calculation for new status
- ✅ Updated stats card label from "On the Way" to "Out for Delivery"
- ✅ Updated filter dropdown with new statuses
- ✅ Updated status select in table with new options
- ✅ Updated status color coding

**Deliveries Page Query:**
```typescript
// Only shows active deliveries (not completed or cancelled)
.in("delivery_status", ["Scheduled", "Pending", "Out for Delivery"])
```

### 6. Sales Page (`app/dashboard/sales/page.tsx`)
- ✅ Updated orders query to fetch "Out for Delivery" instead of "On the Way"
- ✅ Ensures order-based sales only show active orders

**Sales Page Query:**
```typescript
// Shows orders available for sale creation
.in('delivery_status', ['Pending', 'Scheduled', 'Out for Delivery'])
```

## Database Schema Changes

### New Tables

#### 1. order_status_logs
Tracks every status change for complete audit trail.

```sql
CREATE TABLE order_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);
```

**Triggers**: Automatically logs all status changes via trigger function.

#### 2. delivery_proof
Stores delivery confirmation and payment details.

```sql
CREATE TABLE delivery_proof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES sales(id),
  driver_id UUID REFERENCES users(id),
  delivered_at TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT,
  payment_confirmed BOOLEAN DEFAULT false,
  customer_signature TEXT,
  photo_url TEXT,
  notes TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8)
);
```

**Created by**: Driver dashboard when confirming delivery.

#### 3. driver_status
Tracks real-time driver availability and location.

```sql
CREATE TABLE driver_status (
  driver_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline',
  current_order_id UUID REFERENCES orders(id),
  last_location_lat DECIMAL(10, 8),
  last_location_lon DECIMAL(11, 8),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);
```

**Statuses**: `available`, `busy`, `offline`
**Updated by**: Trigger when order status changes to/from "Out for Delivery".

### Views

#### order_timeline
Comprehensive view of complete order journey with all status changes.

```sql
CREATE VIEW order_timeline AS
SELECT 
  o.id as order_id,
  o.delivery_status as current_status,
  c.name as customer_name,
  u.name as driver_name,
  json_agg(
    json_build_object(
      'timestamp', l.changed_at,
      'status', l.new_status,
      'changed_by', uc.name,
      'notes', l.notes
    ) ORDER BY l.changed_at
  ) as status_history
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN users u ON o.assigned_driver = u.id
LEFT JOIN order_status_logs l ON o.id = l.order_id
LEFT JOIN users uc ON l.changed_by = uc.id
GROUP BY o.id, o.delivery_status, c.name, u.name;
```

**Usage**: Admin can view complete order history with timestamps.

## Testing Checklist

### Before Testing - Apply Migration
```bash
# Copy contents of supabase/migrations/dispatch-system.sql
# Paste into Supabase SQL Editor
# Execute to create new tables, triggers, and views
```

### Driver Dashboard Testing
- [ ] Login as driver role
- [ ] View orders with status "Pending"
- [ ] Click "Start Delivery" on an order
  - [ ] Verify sale auto-created in sales table
  - [ ] Verify order status changed to "Out for Delivery"
  - [ ] Verify stock quantity reduced
  - [ ] Verify order_status_logs entry created
- [ ] Click "Complete Delivery"
  - [ ] Verify payment modal appears
  - [ ] Select payment method
  - [ ] Add customer notes
  - [ ] Click "Confirm Payment"
- [ ] Verify delivery_proof record created
- [ ] Verify order status changed to "Completed"
- [ ] Verify sale payment_method updated
- [ ] Verify driver_status updated to "available"

### Orders Page Testing
- [ ] View all 7 stats cards (Scheduled, Pending, Out for Delivery, Delivered, Completed, Cancelled, Revenue)
- [ ] Click each status tab, verify filtering works
- [ ] Change order status using dropdown, verify update
- [ ] Create new order, verify all 6 statuses available
- [ ] Verify revenue counts both "Delivered" and "Completed" orders

### Deliveries Page Testing
- [ ] View only active deliveries (Scheduled, Pending, Out for Delivery)
- [ ] Verify "Completed" and "Cancelled" orders don't show
- [ ] Assign driver to order
- [ ] Update status using dropdown

### Sales Page Testing
- [ ] Create order-based sale
- [ ] Verify only active orders appear (Pending, Scheduled, Out for Delivery)
- [ ] Verify "Completed" orders don't appear in order selection

## Status Workflow Logic

### Admin → Driver → Customer → Admin

```
1. ADMIN CREATES ORDER
   ├─ Status: "Scheduled"
   └─ Assigns driver (optional)

2. ADMIN ASSIGNS DRIVER (if not done)
   └─ Status: "Pending"

3. DRIVER STARTS DELIVERY
   ├─ Status: "Out for Delivery"
   ├─ Auto-creates sale (linked to order)
   ├─ Reduces stock quantity
   ├─ Logs status change
   └─ Updates driver status to "busy"

4. DRIVER DELIVERS TO CUSTOMER
   └─ Status: "Delivered"

5. DRIVER CONFIRMS PAYMENT
   ├─ Status: "Completed"
   ├─ Updates sale payment method
   ├─ Creates delivery_proof record
   ├─ Logs status change
   └─ Updates driver status to "available"
```

### Cancellation Flow

```
AT ANY STAGE
   └─ Status: "Cancelled"
      ├─ Logs status change
      └─ If driver assigned, updates driver status to "available"
```

## Key Features Implemented

### 1. Auto-Sale Creation
- **When**: Driver clicks "Start Delivery"
- **What**: Creates sale record automatically
- **Benefits**:
  - Eliminates manual data entry
  - Ensures sale-order linkage
  - Reduces human error
  - Tracks exact delivery start time

### 2. Payment Collection Workflow
- **When**: Driver completes delivery
- **What**: Modal for payment confirmation
- **Data Captured**:
  - Payment method (Cash/M-Pesa/Bank/Card)
  - Customer notes
  - GPS coordinates (if enabled)
  - Timestamp
- **Benefits**:
  - Accurate payment tracking
  - Delivery proof for disputes
  - Customer feedback capture

### 3. Status Audit Trail
- **What**: Complete log of all status changes
- **Data Tracked**:
  - Old status → New status
  - Who made the change
  - Timestamp
  - GPS coordinates
  - Notes
- **Benefits**:
  - Accountability
  - Dispute resolution
  - Performance analytics
  - Compliance/auditing

### 4. Driver Availability Tracking
- **What**: Real-time driver status
- **Statuses**:
  - `available` - Ready for new orders
  - `busy` - Currently on delivery
  - `offline` - Not available
- **Benefits**:
  - Smart order assignment
  - Workload balancing
  - Capacity planning

## Migration Path

### Step 1: Apply Database Migration
```bash
# In Supabase Dashboard → SQL Editor
# Paste and run: supabase/migrations/dispatch-system.sql
```

### Step 2: Verify Tables Created
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('order_status_logs', 'delivery_proof', 'driver_status');
```

### Step 3: Test Driver Workflow
1. Login as driver
2. Start delivery (creates sale)
3. Complete delivery (records payment)
4. Check all tables for data

### Step 4: Verify Triggers Working
```sql
-- Check status logs
SELECT * FROM order_status_logs ORDER BY changed_at DESC LIMIT 10;

-- Check driver status updates
SELECT * FROM driver_status;

-- Check delivery proof
SELECT * FROM delivery_proof ORDER BY delivered_at DESC LIMIT 10;
```

## Future Enhancements (Not Yet Implemented)

### Phase 4: Admin Dispatch Dashboard
- Real-time map view of all drivers
- Live order tracking
- Driver workload analytics
- Route optimization suggestions

### Phase 5: Customer Notifications
- SMS/Email on status changes
- Real-time delivery tracking
- ETA calculations
- Delivery confirmation receipt

### Phase 6: Advanced Analytics
- Driver performance metrics
- Delivery time analysis
- Route efficiency scoring
- Payment method trends

### Phase 7: Mobile App
- Dedicated driver mobile app
- Offline support
- Camera integration for proof photos
- Signature capture

## Notes
- All status changes are now logged automatically via triggers
- Driver availability updates automatically when starting/completing deliveries
- Revenue calculation includes both "Delivered" and "Completed" statuses
- Sales page only shows active orders (not completed/cancelled)
- Deliveries page only shows active deliveries
- Driver dashboard filters "Pending" and "Out for Delivery" by default

## Backward Compatibility
- Old "On the Way" status has been replaced with "Out for Delivery"
- Existing orders may need status migration if they have "On the Way"
- Run this to migrate existing orders:
  ```sql
  UPDATE orders 
  SET delivery_status = 'Out for Delivery' 
  WHERE delivery_status = 'On the Way';
  ```

## Security (RLS Policies Applied)
- ✅ order_status_logs: Authenticated users can view, only system can insert
- ✅ delivery_proof: Authenticated users can view, drivers can insert
- ✅ driver_status: Authenticated users can view, only system updates via triggers
