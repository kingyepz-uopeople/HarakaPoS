# Orders Module Implementation Guide

## Overview
The Orders Module is a comprehensive pre-order and delivery management system for HarakaPOS. It enables scheduling future deliveries, automatic status transitions, and driver-specific delivery views.

## Database Schema

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Store customer information for repeat orders
**Key Features:**
- Unique customer profiles
- Phone number for contact
- Optional location for delivery planning

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quantity_kg DECIMAL(10, 2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg DECIMAL(10, 2) NOT NULL CHECK (price_per_kg >= 0),
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity_kg * price_per_kg) STORED,
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('Cash', 'M-Pesa', 'Bank Transfer', 'Credit Card')),
  delivery_status TEXT NOT NULL DEFAULT 'Pending' CHECK (delivery_status IN ('Scheduled', 'Pending', 'On the Way', 'Delivered', 'Cancelled')),
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  delivery_notes TEXT,
  assigned_driver UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose:** Track customer orders with delivery scheduling
**Key Features:**
- Auto-calculated `total_price` (quantity × price per kg)
- 5 delivery statuses: Scheduled, Pending, On the Way, Delivered, Cancelled
- Optional delivery time for scheduling
- Driver assignment for delivery coordination
- Delivery notes for special instructions

## Order Statuses

1. **Scheduled** - Pre-orders for future dates (not yet due)
2. **Pending** - Orders ready for delivery (due today)
3. **On the Way** - Driver is currently delivering
4. **Delivered** - Completed successfully
5. **Cancelled** - Order was cancelled

## Status Workflow

```
┌──────────┐
│Scheduled │ (Future delivery date)
└────┬─────┘
     │ (At 6:00 AM on delivery date)
     ↓
┌────────┐
│Pending │ (Ready for delivery today)
└────┬───┘
     │ (Driver starts delivery)
     ↓
┌───────────┐
│On the Way │ (In transit)
└─────┬─────┘
     │ (Delivery complete)
     ↓
┌──────────┐
│Delivered │ (Final status)
└──────────┘

     OR
     
┌──────────┐
│Cancelled │ (Any time before delivery)
└──────────┘
```

## Database Migration

Run this SQL in your Supabase SQL Editor:

```bash
# Navigate to your Supabase project
# Go to SQL Editor
# Open migration-create-orders-module.sql
# Execute the entire file
```

The migration includes:
- ✅ Customers table with RLS policies
- ✅ Orders table with constraints and RLS
- ✅ Indexes for performance
- ✅ Auto-update trigger for `updated_at`
- ✅ Sample customer data (commented out)

## TypeScript Types

Added to `lib/types.ts`:

```typescript
export type OrderStatus = "Scheduled" | "Pending" | "On the Way" | "Delivered" | "Cancelled";
export type PaymentMethod = "Cash" | "M-Pesa" | "Bank Transfer" | "Credit Card";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  location?: string;
  created_at?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  quantity_kg: number;
  price_per_kg: number;
  total_price?: number;
  payment_mode: PaymentMethod;
  delivery_status: OrderStatus;
  delivery_date: string;
  delivery_time?: string;
  delivery_notes?: string;
  assigned_driver?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderWithDetails extends Order {
  customer?: Customer;
  driver?: User;
}
```

## Admin UI Features

### Orders Page (`/dashboard/orders`)

**Stats Dashboard:**
- Scheduled Orders Count
- Pending Orders Count
- On the Way Count
- Delivered Count
- Cancelled Count
- Total Revenue from Delivered Orders

**Status Tabs:**
- All Orders
- Scheduled
- Pending
- On the Way
- Delivered
- Cancelled

**Filters:**
- Filter by Delivery Date
- Filter by Assigned Driver
- Clear Filters button

**Orders Table:**
Displays:
- Customer (name, phone, location)
- Order Details (quantity, price per kg, total, payment mode)
- Delivery Info (date, time, notes)
- Assigned Driver
- Status (dropdown for quick updates)
- Delete Action

**Add Order Modal:**
Form fields:
- Customer (select from existing)
- Quantity (kg)
- Price per kg (auto-filled from settings)
- Payment Mode
- Delivery Status
- Delivery Date
- Delivery Time (optional)
- Assign Driver (optional)
- Delivery Notes (optional)

### Customers Page (`/dashboard/customers`)

**Features:**
- Total Customers count
- Add Customer button
- Customers table (name, phone, location)
- Delete customer (protected if they have orders)

**Add Customer Modal:**
- Name (required)
- Phone (required)
- Location (optional)

## Navigation

Updated sidebar with new links:
```
Dashboard
Sales
Orders       ← NEW
Customers    ← NEW
Stock
Deliveries
Reports
Settings
```

## Automated Status Updates (Future Enhancement)

To automatically change `Scheduled` → `Pending` at 6:00 AM on delivery day:

### Option 1: Supabase Edge Function (Recommended)

Create a Deno function in Supabase:

```typescript
// supabase/functions/update-order-statuses/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('orders')
    .update({ delivery_status: 'Pending' })
    .eq('delivery_status', 'Scheduled')
    .eq('delivery_date', today)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ success: true, updated: data?.length || 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Set up a cron job to trigger this function daily at 6:00 AM.

### Option 2: Database Trigger (Alternative)

Create a PostgreSQL function that runs on a schedule:

```sql
-- Function to update scheduled orders
CREATE OR REPLACE FUNCTION update_scheduled_orders()
RETURNS void AS $$
BEGIN
  UPDATE orders
  SET delivery_status = 'Pending'
  WHERE delivery_status = 'Scheduled'
    AND delivery_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Use pg_cron (if enabled) to schedule
-- SELECT cron.schedule('update-orders', '0 6 * * *', 'SELECT update_scheduled_orders()');
```

## Integration Points

### With Stock Module
When an order is marked as **Delivered**, you should:
1. Reduce `stock.quantity_kg` by `order.quantity_kg`
2. Optionally create a `sale` record for tracking

Example implementation (add to orders page):

```typescript
const handleMarkAsDelivered = async (orderId: string, quantityKg: number) => {
  // Update order status
  const { error: orderError } = await supabase
    .from('orders')
    .update({ delivery_status: 'Delivered' })
    .eq('id', orderId);

  if (orderError) throw orderError;

  // Reduce stock (get latest stock entry)
  const { data: latestStock } = await supabase
    .from('stock')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (latestStock) {
    await supabase
      .from('stock')
      .update({ quantity_kg: latestStock.quantity_kg - quantityKg })
      .eq('id', latestStock.id);
  }
};
```

### With Settings Module
The orders module integrates with settings for:
- Auto-fetching `price_per_kg` default value
- Using configured payment methods
- Currency formatting

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Verify customers table exists
- [ ] Verify orders table exists
- [ ] Test adding a customer
- [ ] Test creating an order with "Scheduled" status
- [ ] Test creating an order with "Pending" status
- [ ] Test all status transitions
- [ ] Test date and driver filters
- [ ] Test deleting an order
- [ ] Try deleting a customer with orders (should fail)
- [ ] Verify total_price auto-calculates correctly
- [ ] Test orders page loads without errors
- [ ] Test customers page loads without errors

## Quick Start

1. **Run Database Migration:**
   ```sql
   -- In Supabase SQL Editor
   -- Copy and paste migration-create-orders-module.sql
   -- Execute
   ```

2. **Add Sample Customers:**
   ```sql
   INSERT INTO customers (name, phone, location) VALUES
     ('John Kamau', '0712345678', 'Nairobi CBD'),
     ('Mary Wanjiku', '0723456789', 'Westlands'),
     ('Peter Otieno', '0734567890', 'Karen');
   ```

3. **Create Test Orders:**
   - Navigate to `/dashboard/customers`
   - Add 2-3 customers
   - Navigate to `/dashboard/orders`
   - Click "Add Order"
   - Create orders with different delivery dates and statuses

4. **Test Filters:**
   - Use date filter to show orders for a specific day
   - Use driver filter to show orders for a specific driver
   - Switch between status tabs

## Future Enhancements

1. **Customer Order History:**
   - Show all past orders for each customer
   - Calculate customer lifetime value

2. **Bulk Order Import:**
   - Import orders from CSV file
   - Useful for pre-ordering season

3. **SMS Notifications:**
   - Send SMS to customers when order status changes
   - Remind drivers of pending deliveries

4. **Route Optimization:**
   - Suggest optimal delivery routes for drivers
   - Group orders by location

5. **Recurring Orders:**
   - Allow customers to set up weekly/monthly orders
   - Auto-create orders on schedule

6. **Payment Integration:**
   - M-Pesa API integration for automatic payment verification
   - Payment reminders for unpaid orders

## Troubleshooting

### Orders not appearing?
- Check RLS policies are enabled
- Verify you're authenticated
- Check browser console for errors

### Can't delete customer?
- Customer likely has existing orders
- Delete their orders first, or keep customer for historical records

### Status not updating?
- Verify you have permissions
- Check database triggers are enabled
- Look for error messages in console

### Total price not calculating?
- This is a generated column - do not insert it manually
- Supabase automatically calculates: quantity_kg × price_per_kg

## Summary

The Orders Module adds powerful pre-order and delivery management capabilities to HarakaPOS:

✅ Customer database for repeat business
✅ Pre-order scheduling with future delivery dates
✅ 5-stage delivery status workflow
✅ Driver assignment and tracking
✅ Comprehensive filtering and tabs
✅ Auto-calculated pricing
✅ Integration with Settings module
✅ Foundation for automated status updates
✅ Clean, intuitive admin UI

Your HarakaPOS system now supports the complete order lifecycle from scheduling to delivery! 🚀
