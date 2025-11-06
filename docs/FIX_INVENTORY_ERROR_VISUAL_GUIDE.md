# 🎯 FIX NOW: 3-Step Visual Guide

## Your Error:
```
Error fetching inventory: {}
```

## The Fix (3 minutes):

---

## STEP 1: Open Supabase Dashboard

1. Click this link: https://supabase.com/dashboard/project/xvwvcowuwvvlvyxcvtlg
2. (It will auto-open your HarakaPOS project)
3. Login if needed

---

## STEP 2: Open SQL Editor

1. Look at the LEFT SIDEBAR
2. Find and click: **"SQL Editor"**
3. Click the button: **"New query"**

You should see a blank SQL editor now.

---

## STEP 3: Run the Migration

### Option A: Copy from File (EASIEST)

1. **Open this file**: `QUICK_MIGRATION.sql` (in your project root)
2. **Select all**: Press `Ctrl+A`
3. **Copy**: Press `Ctrl+C`
4. **Go back to Supabase SQL Editor**
5. **Paste**: Press `Ctrl+V`
6. **Run**: Click the green **"Run"** button (or press `Ctrl+Enter`)
7. **Wait**: You should see "Success!" message

### Option B: Copy from Here (BACKUP)

If you can't find the file, copy this SQL:

```sql
-- Add tax fields to receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 16.00;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_invoice_number VARCHAR(100);
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS etims_verification_url TEXT;

-- Create inventory table
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  movement_type VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255),
  reference_id UUID,
  reference_type VARCHAR(50),
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample data
INSERT INTO inventory (product_name, product_code, category, current_stock, unit, reorder_level, unit_cost, unit_price, is_perishable) VALUES
('Potatoes', 'POT-001', 'Vegetables', 500, 'kg', 100, 80, 120, true),
('Tomatoes', 'TOM-001', 'Vegetables', 300, 'kg', 50, 90, 150, true),
('Onions', 'ONI-001', 'Vegetables', 200, 'kg', 50, 100, 140, true),
('Carrots', 'CAR-001', 'Vegetables', 150, 'kg', 40, 110, 160, true),
('Cabbage', 'CAB-001', 'Vegetables', 100, 'kg', 30, 70, 100, true),
('Spinach', 'SPI-001', 'Vegetables', 50, 'kg', 20, 120, 180, true),
('Kale', 'KAL-001', 'Vegetables', 80, 'kg', 25, 100, 150, true),
('Delivery Bags', 'BAG-001', 'Packaging', 1000, 'pieces', 200, 5, 10, false),
('Labels', 'LAB-001', 'Packaging', 5000, 'pieces', 500, 1, 2, false)
ON CONFLICT (product_code) DO NOTHING;

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory;
CREATE POLICY "Enable read access for all users" ON inventory FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory;
CREATE POLICY "Enable insert for authenticated users" ON inventory FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON inventory;
CREATE POLICY "Enable update for authenticated users" ON inventory FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view notifications" ON notifications;
CREATE POLICY "Users can view notifications" ON notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
CREATE POLICY "Users can update notifications" ON notifications FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can delete notifications" ON notifications;
CREATE POLICY "Users can delete notifications" ON notifications FOR DELETE TO authenticated USING (true);
```

Then:
1. Paste into SQL Editor
2. Click **"Run"**
3. Wait for success

---

## STEP 4: Verify It Worked

After running the SQL, run this verification query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory', 'stock_movements', 'notifications')
ORDER BY table_name;
```

**Expected Result**: You should see 3 tables:
```
inventory
notifications
stock_movements
```

---

## STEP 5: Test Your App

1. **Refresh your browser**: Press `F5` on http://localhost:3000/dashboard/inventory
2. **Should see**: 9 products (Potatoes, Tomatoes, etc.)
3. **No errors**: Check browser console (F12)

### What You Should See:
```
✅ Total Items: 9
✅ Low Stock Alerts: (some number)
✅ Expiring Soon: 0
✅ Wastage Loss: KES 0.00
✅ Table with all products
```

---

## 🎉 SUCCESS INDICATORS

After migration, you should see:

### ✅ In Inventory Page:
- 9 products listed
- Potatoes (500 kg)
- Tomatoes (300 kg)
- Onions (200 kg)
- etc.

### ✅ In Receipts Page:
- Tax column visible
- No syntax errors
- Print works

### ✅ In Analytics Page:
- Page loads
- Metrics display
- No console errors

### ✅ In Notifications Page:
- Page loads
- Permission request
- Empty list (normal)

---

## 🚨 If You Get Errors

### Error: "relation already exists"
**Solution**: Tables already created. This is OK! The migration used `IF NOT EXISTS`.

### Error: "permission denied"
**Solution**: 
1. Check you're logged into correct Supabase project
2. Verify you're the project owner/admin

### Error: "syntax error"
**Solution**:
1. Make sure you copied the ENTIRE SQL script
2. Check no characters got cut off
3. Try copying again from `QUICK_MIGRATION.sql` file

---

## 📞 Need More Help?

### Check Supabase Logs:
1. Supabase Dashboard
2. Click "Logs" in sidebar
3. Look for errors

### Check Your Tables:
```sql
-- Run this to see all your tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Verify Row Count:
```sql
-- Should return 9
SELECT COUNT(*) FROM inventory;
```

---

## 🎯 Quick Checklist

- [ ] Opened Supabase Dashboard
- [ ] Went to SQL Editor
- [ ] Copied `QUICK_MIGRATION.sql` content
- [ ] Pasted into editor
- [ ] Clicked "Run"
- [ ] Saw success message
- [ ] Ran verification query
- [ ] Saw 3 tables listed
- [ ] Refreshed app
- [ ] Inventory page shows 9 products
- [ ] No errors in console

---

## 🚀 You're Done!

Once all checkboxes are ticked:
- ✅ Error is fixed
- ✅ All 5 new features work
- ✅ Sample data loaded
- ✅ Ready to use!

---

**NOW**: Go to Supabase and run the migration! ⚡
