# ⚠️ IMPORTANT: Run This Before Using Expense Tracking

## The Error You're Seeing

```
Insert error: {}
```

This means the database tables for expense tracking **haven't been created yet**.

---

## ✅ Quick Fix (2 Steps - Takes 2 Minutes)

### Step 1: Run the Database Migration

1. **Open Supabase Dashboard**: Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select Your Project**: Click on your HarakaPOS project
3. **Go to SQL Editor**: Click "SQL Editor" in the left sidebar
4. **Open the Migration File**: In VS Code, open `supabase/migrations/business-expenses.sql`
5. **Copy Everything**: Select all (Ctrl+A), copy (Ctrl+C)
6. **Paste in SQL Editor**: Paste into the Supabase SQL Editor
7. **Click "Run"**: Click the Run button (or press Ctrl+Enter)
8. **Wait for Success**: You should see "Success. No rows returned"

### Step 2: Create Storage Bucket (For Receipt Uploads)

1. **Go to Storage**: In Supabase Dashboard, click "Storage" in the left sidebar
2. **New Bucket**: Click "New bucket" button
3. **Name it**: Type `receipts`
4. **Make it Public**: Toggle "Public bucket" to ON
5. **Create**: Click "Create bucket"
6. **Add Policies**: Go back to SQL Editor and run this (copy the ENTIRE block below):

```sql
-- Allow authenticated users to upload receipts
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'receipts');
```

**IMPORTANT**: Copy the ENTIRE code block above (including both CREATE POLICY statements). Don't copy line by line.

---

## ✅ Verify It Works

1. **Refresh the Expense Page**: Go to `/dashboard/expenses` and refresh
2. **No Red Alert?**: The setup error should be gone
3. **Try Adding an Expense**: Click "Add Expense" button
4. **Fill the Form**: 
   - Amount: 1000
   - Category: Pick any
   - Payment Method: Cash
5. **Submit**: Click "Add Expense"
6. **Success**: You should see your expense in the list!

---

## 🎯 What the Migration Creates

✅ **expense_categories** table - 8 pre-configured categories  
✅ **expenses** table - Your expense tracking data  
✅ **get_profit_analysis()** function - Calculates profit automatically  
✅ **RLS Policies** - Security (admin-only access)  
✅ **Indexes** - Fast queries  

---

## 📊 What You'll See After Setup

### On the Expenses Page:
- Summary cards (Total Expenses, Entry Count, Date Period)
- Add Expense button (opens modal form)
- Category and date filters
- Category breakdown with percentages
- Full expense list with details
- Delete option for each expense

### On the Profit Analysis Page:
- Total Revenue (from your sales)
- Total Expenses (from expense tracking)
- Net Profit calculation
- Profit Margin percentage
- Revenue breakdown by product type
- Expense breakdown by category
- Performance insights
- CSV export button

---

## 🐛 Still Getting Errors?

### Error: "relation 'expense_categories' does not exist"
**Fix**: You didn't run the migration yet. Go back to Step 1 above.

### Error: "function get_profit_analysis does not exist"
**Fix**: The migration didn't complete. Delete any partial tables and re-run the full migration.

### Error: "new row violates row-level security policy"
**Fix**: You're not logged in as an admin user. Check your user role in Supabase:
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```
The role should be `'admin'` (not `'driver'` or `'user'`).

### Error: "Failed to upload receipt"
**Fix**: You didn't create the storage bucket. Go back to Step 2 above.

---

## 📞 Need Help?

1. **Check the detailed guide**: `docs/EXPENSE_TRACKING_SETUP.md`
2. **Check the main setup**: `docs/SETUP_AND_FIXES.md`
3. **Contact**: +254 791 890 8858

---

## ⏱️ Time Required

- **Step 1** (Database Migration): 1 minute
- **Step 2** (Storage Bucket): 1 minute
- **Total**: 2 minutes

---

**After completing these steps, the expense tracking will work perfectly!**

🚀 **Next Feature**: Once you've tested expenses, we'll implement eTIMS (KRA) integration for tax compliance.
