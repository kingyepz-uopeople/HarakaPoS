# 🚨 URGENT: Fix Inventory Error - Apply Database Migration

## The Problem
```
Error fetching inventory: {}
```

**Cause**: The `inventory` table doesn't exist in your database yet.

**Solution**: Apply the database migration now!

---

## ⚡ Quick Fix (5 Minutes)

### Option 1: Supabase Dashboard (EASIEST)

1. **Open Supabase**:
   - Go to: https://supabase.com/dashboard
   - Login with your account
   - Select your **HarakaPOS** project

2. **Open SQL Editor**:
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"**

3. **Copy Migration**:
   - Open file: `supabase/migrations/20251106_enhanced_features.sql`
   - Press `Ctrl+A` (select all)
   - Press `Ctrl+C` (copy)

4. **Execute SQL**:
   - Paste in SQL Editor (`Ctrl+V`)
   - Click **"Run"** button (or press `Ctrl+Enter`)
   - Wait for green success message ✅

5. **Verify Tables Created**:
   Run this query:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('inventory', 'stock_movements', 'notifications');
   ```
   
   Should return:
   ```
   inventory
   stock_movements
   notifications
   ```

6. **Refresh Your App**:
   - Go back to http://localhost:3000/dashboard/inventory
   - Refresh page (`F5`)
   - Should see 9 products now! ✅

---

### Option 2: Supabase CLI (IF YOU HAVE IT INSTALLED)

```powershell
# Check if Supabase CLI is installed
supabase --version

# If installed, run:
cd "c:\Users\USER 01\Desktop\HarakaPOS\HarakaPoS"

# Login (if not already)
supabase login

# Link to your project
supabase link

# Push migration
supabase db push

# Verify
supabase db diff
```

---

### Option 3: Manual SQL Execution

If you prefer, you can execute each section manually:

#### Step 1: Add eTIMS fields to receipts
```sql
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 16.00;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_verification_url TEXT;
```

#### Step 2: Create inventory table
```sql
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  reorder_level DECIMAL(10,2) NOT NULL DEFAULT 10,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_perishable BOOLEAN DEFAULT false,
  expiry_date DATE,
  wastage_quantity DECIMAL(10,2) DEFAULT 0,
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Step 3: Insert sample data
```sql
INSERT INTO inventory (product_name, product_code, category, current_stock, unit, reorder_level, unit_cost, unit_price, is_perishable) VALUES
('Potatoes', 'POT-001', 'Vegetables', 500, 'kg', 100, 80, 120, true),
('Tomatoes', 'TOM-001', 'Vegetables', 300, 'kg', 50, 90, 150, true),
('Onions', 'ONI-001', 'Vegetables', 200, 'kg', 50, 100, 140, true)
ON CONFLICT (product_code) DO NOTHING;
```

---

## 🎯 After Migration

Once the migration is complete:

### Test Inventory Page:
1. Go to http://localhost:3000/dashboard/inventory
2. Should see:
   - ✅ 9 products listed
   - ✅ Dashboard stats (Total Items: 9)
   - ✅ No errors in console
   - ✅ Search working
   - ✅ Alerts if any items low on stock

### Test Other Features:
1. **Receipts**: http://localhost:3000/dashboard/receipts
   - Should show tax column
   - No syntax errors

2. **Analytics**: http://localhost:3000/dashboard/analytics
   - Should load without errors
   - Shows metrics

3. **Notifications**: http://localhost:3000/dashboard/notifications
   - Should request permission
   - Empty list initially (normal)

---

## 🐛 Still Having Issues?

### Check Browser Console:
1. Press `F12`
2. Go to "Console" tab
3. Look for errors
4. Share the error message

### Check Supabase Logs:
1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Check for errors
4. Look for "relation does not exist" messages

### Verify Connection:
```sql
-- Run in Supabase SQL Editor
SELECT current_database();
```

Should return your database name.

---

## 📋 Migration Checklist

After running the migration, verify:

- [ ] `inventory` table exists
- [ ] `stock_movements` table exists
- [ ] `notifications` table exists
- [ ] `receipts` table has `tax_rate` column
- [ ] `receipts` table has `etims_invoice_number` column
- [ ] Sample inventory data loaded (9 items)
- [ ] `/dashboard/inventory` page loads
- [ ] `/dashboard/receipts` page loads
- [ ] `/dashboard/analytics` page loads
- [ ] `/dashboard/notifications` page loads
- [ ] No console errors

---

## 💡 Pro Tip

Save this SQL query to quickly check your tables:

```sql
-- Quick table check
SELECT 
  t.table_name,
  COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
  ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;
```

This shows all your tables and how many columns each has.

---

## 🚀 Once Fixed

After the migration succeeds:

1. ✅ All 5 new features will work
2. ✅ No more "inventory not found" errors
3. ✅ Sample products will appear
4. ✅ Notifications will be functional
5. ✅ Analytics will show data
6. ✅ Receipts will show tax

---

**DO THIS NOW**: Go to Supabase Dashboard and run the migration! 🎯
