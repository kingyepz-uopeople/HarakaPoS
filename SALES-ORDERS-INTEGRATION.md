# Sales ↔ Orders Integration

## Overview
The Sales module has been upgraded to support **dual-mode operation**:
1. **Order-Based Sales**: Convert pre-orders to sales with automatic data fetching
2. **Walk-In Sales**: Manual entry for customers without pre-orders

## Database Changes

### Sales Table Updates
Added `order_id` column to link sales with orders:

```sql
ALTER TABLE sales ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_order ON sales(order_id);
```

**Complete Sales Table Structure:**
- `id` (UUID, Primary Key)
- `date` (DATE)
- `customer_id` (UUID, FK → customers) - New
- `order_id` (UUID, FK → orders) - **NEW**
- `customer_name` (TEXT) - For backward compatibility
- `customer_phone` (TEXT)
- `quantity_sold` (DECIMAL)
- `price_per_kg` (DECIMAL) - New
- `total_amount` (DECIMAL) - New
- `amount` (DECIMAL) - Legacy field
- `payment_method` (TEXT)
- `driver_id` (UUID, FK → users)
- `delivery_location` (TEXT)
- `delivery_status` (TEXT)
- `created_at` (TIMESTAMP)

## Business Logic

### Order-Based Sale Flow
1. User selects "From Order" radio button
2. Dropdown shows pending/on-the-way orders
3. Upon order selection:
   - **Auto-fill** customer, quantity, price, location
   - **Disable manual editing** of these fields (read-only)
   - Only payment method can be selected
4. On submit:
   - Record sale with `order_id` set
   - **Mark order status as "Delivered"**
   - Reduce stock (via trigger)

### Walk-In Sale Flow
1. User selects "Walk-In Sale" radio button
2. Manual customer selection from dropdown
3. All fields editable:
   - Quantity (kg)
   - Price per kg (auto-fetched from settings)
   - Total amount (auto-calculated)
   - Payment method
   - Delivery location
4. On submit:
   - Record sale with `order_id = NULL`
   - Reduce stock (via trigger)

## TypeScript Updates

### Types (lib/types.ts)
```typescript
export interface Sale {
  id: string;
  date: string;
  order_id?: string; // NEW: Link to order
  customer_id?: string;
  quantity_sold: number;
  price_per_kg: number;
  total_amount: number;
  payment_method: PaymentMethod;
  // ... other fields
}

export interface SaleWithDelivery extends Sale {
  customer?: Customer;
  driver?: User;
  order?: Order; // NEW: Joined order data
}
```

## UI Features

### Sales Table Display
- **Type Badge**: 
  - Blue "Order" badge for order-based sales (order_id present)
  - Green "Walk-in" badge for walk-in sales (order_id null)
- **Order #**: Shows order ID (first 8 chars) or "-"
- Columns: Date, Type, Order #, Customer, Quantity, Price/kg, Total, Payment, Location

### Record Sale Modal
- **Sale Type Selector**: Radio buttons for "From Order" vs "Walk-In Sale"
- **Order Dropdown**: Shows pending/on-the-way orders with customer, quantity, location, date
- **Conditional Fields**:
  - Order mode: Read-only quantity, price, customer, location
  - Walk-in mode: All fields editable
- **Auto-calculation**: Total = Quantity × Price/kg
- **Validation**: Prevents submission without customer or with invalid amounts

## Migration File
**File**: `migration-upgrade-sales-to-customers.sql`

**Key Steps**:
1. Add `order_id` column with FK constraint
2. Add `customer_id` column with FK constraint
3. Add `price_per_kg` and `total_amount` columns
4. Create indexes for performance
5. Add stock reduction trigger
6. Add check constraints for data integrity

**To Apply**:
1. Open Supabase SQL Editor
2. Copy contents of `migration-upgrade-sales-to-customers.sql`
3. Execute the migration
4. Verify with:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'sales';
   ```

## Stock Integration
**Automatic Stock Reduction**: When a sale is recorded (order-based OR walk-in), the `reduce_stock_on_sale()` trigger automatically:
1. Fetches latest stock entry
2. Validates sufficient stock available
3. Reduces stock by `quantity_sold`
4. Raises exception if insufficient stock

## Order Status Automation
When an order-based sale is recorded:
```typescript
if (order_id) {
  await supabase
    .from('orders')
    .update({ delivery_status: 'Delivered' })
    .eq('id', order_id);
}
```

## Testing Checklist

### Prerequisites
- [x] Migration file applied to database
- [x] TypeScript types updated
- [x] No build errors (`npm run build` succeeds)

### Test Order-Based Sale
1. Create a test order in Orders page (status: Pending or On the Way)
2. Go to Sales page → Record Sale
3. Select "From Order"
4. Choose the test order from dropdown
5. Verify:
   - Customer auto-filled
   - Quantity auto-filled
   - Price auto-filled
   - Location auto-filled
   - Fields are read-only
6. Select payment method
7. Submit
8. Verify:
   - Sale appears in table with blue "Order" badge
   - Order # shows correctly
   - Order status changed to "Delivered" in Orders page
   - Stock reduced by sold quantity

### Test Walk-In Sale
1. Go to Sales page → Record Sale
2. Select "Walk-In Sale"
3. Manually select customer
4. Enter quantity and price
5. Verify total auto-calculates
6. Submit
7. Verify:
   - Sale appears in table with green "Walk-in" badge
   - Order # shows "-"
   - Stock reduced

### Edge Cases
- [ ] No pending orders → Show warning message
- [ ] Insufficient stock → Should show error
- [ ] Missing customer → Form validation prevents submit
- [ ] Zero quantity → Validation error
- [ ] Negative price → Validation error

## Performance Optimizations
- **Indexed Columns**: `customer_id`, `order_id` for fast lookups
- **Query Optimization**: Single query with joins to fetch sales with related data
- **Conditional Rendering**: Only fetch orders when "From Order" mode selected

## Future Enhancements
1. **Filter by Type**: Add filter to show only order-based or walk-in sales
2. **Order Details View**: Click order # to see full order details
3. **Bulk Sales**: Record multiple sales from multiple orders at once
4. **Sales Analytics**: Track revenue by sale type (order vs walk-in)
5. **Delivery Tracking**: Link sales with delivery status updates
6. **Payment Reconciliation**: Track payments against orders

## Files Modified
- ✅ `app/dashboard/sales/page.tsx` - Complete rebuild with order integration
- ✅ `lib/types.ts` - Added order_id to Sale and SaleWithDelivery
- ✅ `migration-upgrade-sales-to-customers.sql` - Added order_id column
- ✅ `supabase-schema.sql` - Updated sales table definition

## Quick Reference

### Determine Sale Type
```typescript
const saleType = sale.order_id ? 'order-based' : 'walk-in';
```

### Query Sales with Orders
```typescript
const { data } = await supabase
  .from('sales')
  .select(`
    *,
    customer:customers(*),
    driver:users(*),
    order:orders(*, customer:customers(*))
  `)
  .order('date', { ascending: false });
```

### Check Order Status After Sale
```sql
SELECT s.id as sale_id, o.delivery_status
FROM sales s
LEFT JOIN orders o ON s.order_id = o.id
WHERE s.order_id IS NOT NULL;
```

---

**Status**: ✅ Implementation Complete | **Next Step**: Apply migration and test
