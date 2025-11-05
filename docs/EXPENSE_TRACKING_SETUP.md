# 💼 Business Expense Tracking - Setup Guide

**Complete setup instructions for the expense tracking module**

---

## 📋 Overview

The Business Expense Tracking module helps you:
- Record all business expenses with categorization
- Upload receipts/invoices for documentation
- Track suppliers and payment methods
- Analyze profit margins (Revenue - Expenses)
- Export data for accounting purposes

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Run Database Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file `supabase/migrations/business-expenses.sql`
4. Copy the entire contents
5. Paste into SQL Editor and click **Run**

✅ This creates:
- `expense_categories` table (8 pre-configured categories)
- `expenses` table (full expense tracking)
- `get_profit_analysis()` function (calculates revenue vs expenses)
- RLS policies (admin-only access)

### Step 2: Create Storage Bucket for Receipts

1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name it: `receipts`
4. Set to **Public** bucket
5. Click **Create Bucket**

### Step 3: Add Storage Policies

In SQL Editor, run:

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

### Step 4: Access Expense Pages

Navigate to:
- **Add/View Expenses**: `/dashboard/expenses`
- **Profit Analysis**: `/dashboard/profit-analysis`

Both links are in the admin sidebar.

---

## 📊 Pre-Configured Expense Categories

The system comes with 8 categories optimized for potato business:

1. **Fuel & Transport** - Delivery vehicle fuel, maintenance
2. **Raw Materials** - Potatoes, cooking oil, packaging
3. **Utilities** - Electricity, water, internet
4. **Salaries & Wages** - Staff payments
5. **Maintenance & Repairs** - Equipment, vehicle repairs
6. **Office Supplies** - Stationery, cleaning supplies
7. **Marketing** - Advertising, promotions
8. **Other** - Miscellaneous expenses

---

## 💡 How to Use

### Adding an Expense

1. Go to **Dashboard** → **Expenses**
2. Click **Add Expense** button
3. Fill in details:
   - **Date**: When expense occurred
   - **Amount**: Cost in KSh
   - **Category**: Select from dropdown
   - **Payment Method**: Cash, M-Pesa, Bank Transfer, Cheque, Other
   - **Supplier**: Vendor name (optional)
   - **Receipt**: Upload image/PDF (optional)
   - **Notes**: Additional context (optional)
4. Click **Add Expense**

### Viewing Expense Reports

1. Go to **Dashboard** → **Profit Analysis**
2. Select date range
3. View:
   - Total Revenue (from sales)
   - Total Expenses
   - Net Profit
   - Profit Margin %
   - Revenue breakdown by product type
   - Expense breakdown by category
   - Performance insights
4. Click **Export CSV** to download data

### Filtering Expenses

On the **Expenses** page:
- Filter by category
- Filter by date range
- View category breakdown
- See expense trends

---

## 🔒 Security & Access

- **Admin Only**: Only admin users can view/add expenses
- **RLS Policies**: Database-level security
- **Receipt Storage**: Public read, authenticated upload
- **Audit Trail**: All expenses track who recorded them

---

## 📈 Profit Calculation

The system automatically calculates:

```
Total Revenue = Sum of all completed sales
Total Expenses = Sum of all expenses
Net Profit = Total Revenue - Total Expenses
Profit Margin = (Net Profit / Total Revenue) × 100%
```

### Performance Benchmarks

- **Excellent**: 20%+ profit margin
- **Good**: 10-20% profit margin
- **Fair**: 0-10% profit margin
- **Critical**: Negative profit margin (loss)

---

## 📤 Export & Reporting

### CSV Export Includes:
- Summary (revenue, expenses, profit, margin)
- Revenue breakdown by product type
- Expense breakdown by category
- Date range information

### Use Cases:
- Monthly accounting reconciliation
- Tax preparation
- Business performance review
- Investor/bank reporting

---

## ⚙️ Customization

### Adding New Categories

```sql
INSERT INTO expense_categories (name, description, is_active)
VALUES ('New Category', 'Description here', true);
```

### Modifying Categories

```sql
UPDATE expense_categories
SET name = 'Updated Name', description = 'New description'
WHERE id = 'category-id-here';
```

### Deactivating Categories

```sql
UPDATE expense_categories
SET is_active = false
WHERE id = 'category-id-here';
```

---

## 🐛 Troubleshooting

### Can't Upload Receipts?

1. Check storage bucket exists: `receipts`
2. Verify bucket is public
3. Check storage policies are created
4. Ensure user is authenticated

### Can't See Expenses?

1. Check user role is `admin`
2. Verify RLS policies are active
3. Check migration ran successfully

### Profit Analysis Shows Zero?

1. Ensure sales have `payment_status = 'completed'`
2. Check date range includes actual data
3. Verify both sales and expenses exist

### Missing Categories?

Re-run the migration - it includes INSERT statements for all 8 categories.

---

## 📞 Support

For issues:
1. Check this guide first
2. Review database logs in Supabase
3. Contact: +254 791 890 8858

---

## ✅ Verification Checklist

Before going live:

- [ ] Database migration completed successfully
- [ ] Storage bucket `receipts` created
- [ ] Storage policies applied
- [ ] Admin user can access `/dashboard/expenses`
- [ ] Admin user can access `/dashboard/profit-analysis`
- [ ] Test adding an expense
- [ ] Test uploading a receipt
- [ ] Verify profit calculation is accurate
- [ ] Test CSV export
- [ ] All 8 categories visible in dropdown

---

## 🎯 Next Steps

After expense tracking is working:

1. **eTIMS Integration** (KRA Tax Compliance)
   - Generate tax invoices
   - Submit to KRA
   - QR code receipts
   - Tax reporting

2. **Advanced Analytics**
   - Month-over-month trends
   - Category budget limits
   - Expense forecasting
   - Supplier analysis

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**License**: Proprietary - Haraka Wedges Supplies
