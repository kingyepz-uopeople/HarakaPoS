# Quick Start: Sales ↔ Orders Integration

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)
1. Open your Supabase project: https://xvwvcowuwvvlvyxcvtlg.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Open `migration-upgrade-sales-to-customers.sql` in this project
5. Copy the **entire contents**
6. Paste into Supabase SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Wait for "Success" message

### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

## Step 2: Verify Migration

Run this query in Supabase SQL Editor:

```sql
-- Check if order_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'order_id';

-- Check if index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'sales';

-- Expected: idx_sales_customer, idx_sales_order
```

**Expected Result:**
```
column_name | data_type | is_nullable
------------|-----------|------------
order_id    | uuid      | YES
```

## Step 3: Start the Development Server

```bash
npm run dev
```

Open http://localhost:3000/dashboard/sales

## Step 4: Test the Integration

### Test 1: Create an Order (if you don't have one)
1. Go to http://localhost:3000/dashboard/customers
2. Click "Add Customer" and create a test customer
3. Go to http://localhost:3000/dashboard/orders
4. Click "Create Order"
5. Fill in:
   - Customer: (select the test customer)
   - Quantity: 50 kg
   - Delivery Date: Tomorrow
   - Delivery Time: 10:00
6. Submit

### Test 2: Record Order-Based Sale
1. Go to http://localhost:3000/dashboard/sales
2. Click "Record Sale"
3. Select **"From Order"** radio button
4. Choose your test order from dropdown
5. Notice:
   - Customer auto-filled ✓
   - Quantity auto-filled ✓
   - Price auto-filled ✓
   - Fields disabled (read-only) ✓
6. Select payment method (e.g., "Cash")
7. Click "Record Sale"
8. **Verify**:
   - Sale appears in table with blue "Order" badge
   - Order # column shows order ID
   - Go to Orders page → order status = "Delivered"

### Test 3: Record Walk-In Sale
1. Click "Record Sale" again
2. Select **"Walk-In Sale"** radio button
3. Manually select customer
4. Enter quantity: 25
5. Enter price: 120 (or leave default)
6. Verify total auto-calculates (25 × 120 = 3000)
7. Select payment method
8. Click "Record Sale"
9. **Verify**:
   - Sale appears with green "Walk-in" badge
   - Order # shows "-"

## Common Issues & Solutions

### Issue 1: "Column order_id does not exist"
**Solution**: Migration not applied. Go back to Step 1.

### Issue 2: "No pending orders available"
**Solution**: All your orders are already "Delivered" or "Cancelled". Create a new order with status "Pending".

To reset an order for testing:
```sql
UPDATE orders SET delivery_status = 'Pending' WHERE id = 'YOUR_ORDER_ID';
```

### Issue 3: "Insufficient stock"
**Solution**: Add stock before recording sale:
1. Go to http://localhost:3000/dashboard/stock
2. Add new stock entry with sufficient quantity

### Issue 4: "Settings not found"
**Solution**: Add default price setting:
```sql
INSERT INTO settings (key, value, type, description)
VALUES ('price_per_kg', '120', 'number', 'Default price per kilogram')
ON CONFLICT (key) DO UPDATE SET value = '120';
```

## Verification Checklist

After testing, verify:

- [x] Sales table shows "Type" column with badges
- [x] Order-based sales show blue "Order" badge
- [x] Walk-in sales show green "Walk-in" badge
- [x] Order # column shows ID for order sales, "-" for walk-in
- [x] Order status changes to "Delivered" when sale recorded
- [x] Stock quantity reduces after each sale
- [x] Auto-calculated total is correct
- [x] Read-only fields prevent editing in order mode
- [x] No console errors in browser DevTools

## Rollback (If Needed)

If something goes wrong:

```sql
-- Remove order_id column
ALTER TABLE sales DROP COLUMN IF EXISTS order_id;

-- Remove index
DROP INDEX IF EXISTS idx_sales_order;
```

Then restart the app and fix issues before re-applying migration.

## Next Steps

Once integration is working:

1. ✅ Test with real customer data
2. ✅ Train users on dual-mode sales entry
3. ✅ Monitor stock levels after sales
4. ✅ Generate reports filtering by sale type
5. ✅ Set up automatic order status notifications

## Support

**Build Failed?** Run: `npm run build` and check for errors

**TypeScript Errors?** Check `lib/types.ts` for correct interface definitions

**Database Errors?** Check Supabase Logs in Dashboard → Database → Logs

---

**Questions?** Review `SALES-ORDERS-INTEGRATION.md` for detailed documentation.
