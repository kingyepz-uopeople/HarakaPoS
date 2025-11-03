# Cost Tracking Enhancement - Implementation Guide

## Overview
This enhancement adds cost tracking for raw harvested potatoes to the stock module, enabling profit analysis and better financial visibility.

## Changes Made

### 1. Database Schema Updates

#### New Fields in `stock` Table:
- `total_cost` (DECIMAL(10,2), NOT NULL, CHECK >= 0) - Total cost of the stock batch
- `cost_per_kg` (DECIMAL(10,2), GENERATED COLUMN) - Automatically calculated as `total_cost / quantity_kg`

#### Files Updated:
- `supabase-schema.sql` - Main schema file (for new databases)
- `migration-add-cost-tracking.sql` - Migration file (for existing databases)

### 2. TypeScript Type Updates

#### File: `lib/types.ts`
Updated `Stock` interface to include:
```typescript
export interface Stock {
  id: string;
  date: string;
  quantity_kg: number;
  source: string;
  total_cost: number;          // New field
  cost_per_kg?: number;         // New field (optional, auto-generated)
  created_at?: string;
}
```

### 3. Stock Management UI Enhancements

#### File: `app/dashboard/stock/page.tsx`

**New Features:**
1. **Total Cost Input Field** - Users enter the total cost when adding stock
2. **Live Cost per Kg Preview** - Automatically displays cost/kg as user types
3. **Enhanced Metrics Cards:**
   - Total Stock Received (kg)
   - Total Cost Spent (KES)
   - Average Cost per Kg (KES)
4. **Updated Stock History Table** - Shows total_cost and cost_per_kg columns

**User Flow:**
1. Admin enters quantity (e.g., 100 kg)
2. Admin enters total cost (e.g., 5000 KES)
3. UI automatically shows "Cost per Kg: KES 50.00"
4. Admin can review before submitting

### 4. Dashboard Metrics Enhancement

#### File: `app/dashboard/page.tsx`

**New Metric Cards:**
1. **Total Stock Cost** - Total money spent on all stock purchases
2. **Average Cost per Kg** - Overall average cost across all stock

**Updated Grid Layout:**
- Changed from 4-column to 3-column grid (6 total cards)
- Added DollarSign and TrendingDown icons

### 5. Profit Analysis Queries

#### File: `profit-analysis-queries.sql`

**6 Comprehensive SQL Queries:**

1. **Daily Profit Summary** - Sales vs costs per day
2. **Monthly Profit Summary** - Aggregated monthly profitability
3. **Overall Profit Summary** - Business-wide profit metrics
4. **Profit by Date Range** - Customizable period analysis
5. **Stock Cost Efficiency Report** - Best-priced stock batches
6. **Best Performing Days** - Highest profit margin days

**Key Metrics Calculated:**
- Total Revenue
- Total Stock Cost
- Gross Profit = Revenue - Cost
- Profit Margin % = (Profit / Cost) × 100
- Estimated Cost (using average cost per kg)

## Implementation Steps

### Step 1: Update Database Schema

**For NEW databases (starting fresh):**
```bash
# Run the complete schema in Supabase SQL Editor
# File: supabase-schema.sql
```

**For EXISTING databases (with data):**
```sql
-- Run this in Supabase SQL Editor
-- File: migration-add-cost-tracking.sql

ALTER TABLE stock
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0);

ALTER TABLE stock
ADD COLUMN IF NOT EXISTS cost_per_kg DECIMAL(10, 2) GENERATED ALWAYS AS (total_cost / NULLIF(quantity_kg, 0)) STORED;

-- Optional: Update existing records with estimated costs
-- UPDATE stock SET total_cost = quantity_kg * 50 WHERE total_cost = 0;
-- (Replace 50 with your average cost per kg)
```

**Verify in Supabase Studio:**
1. Go to Table Editor → stock
2. Check that `total_cost` and `cost_per_kg` columns exist
3. Test inserting a record to verify the generated column works

### Step 2: Deploy Frontend Changes

All TypeScript and UI files are already updated in your project:
- ✅ `lib/types.ts` - Type definitions
- ✅ `app/dashboard/stock/page.tsx` - Stock management UI
- ✅ `app/dashboard/page.tsx` - Dashboard metrics

**No additional deployment steps needed** - Just commit and push to your repository.

### Step 3: Test the Features

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Test Stock Addition:**
   - Go to http://localhost:3000/dashboard/stock
   - Click "Add New Stock"
   - Enter: Quantity = 100 kg, Source = Test Farmer, Total Cost = 5000
   - Verify: Live preview shows "Cost per Kg: KES 50.00"
   - Submit and check the stock history table

3. **Test Dashboard Metrics:**
   - Go to http://localhost:3000/dashboard
   - Verify new metric cards show:
     - Total Stock Cost
     - Avg Cost per Kg

4. **Test Database:**
   - In Supabase SQL Editor, run:
   ```sql
   SELECT * FROM stock ORDER BY created_at DESC LIMIT 5;
   ```
   - Verify `cost_per_kg` is automatically calculated

### Step 4: Run Profit Analysis (Optional)

1. Go to Supabase SQL Editor
2. Copy a query from `profit-analysis-queries.sql`
3. Run it to see profitability metrics
4. Example: Daily Profit Summary

## Future Enhancements

### Phase 2: Profit Dashboard Page
Create `app/dashboard/profit/page.tsx` with:
- Interactive date range selector
- Profit charts (Chart.js or Recharts)
- Real-time profit metrics
- Export to CSV functionality

### Phase 3: Stock Batch Tracking
Add `stock_batch_id` to sales table to track:
- Exact cost per sale (FIFO/LIFO)
- Stock batch depletion rates
- More accurate profit calculations

### Phase 4: Alerts & Notifications
- Low profit margin warnings
- High cost alerts
- Stock efficiency recommendations

## Business Impact

### Visibility Improvements:
- ✅ Clear cost tracking per stock batch
- ✅ Automatic cost per kg calculation
- ✅ Real-time profitability insights
- ✅ Historical cost trend analysis

### Decision Making:
- Compare supplier costs over time
- Identify best-priced stock sources
- Calculate break-even sales points
- Monitor profit margins daily/monthly

### Financial Control:
- Track total capital invested in stock
- Calculate ROI on stock purchases
- Optimize pricing strategies
- Improve cash flow management

## Troubleshooting

### Issue: "Column does not exist" error
**Solution:** Run the migration SQL in Supabase SQL Editor

### Issue: cost_per_kg shows as NULL
**Solution:** Ensure total_cost is not 0 and quantity_kg is not 0

### Issue: Form shows NaN for cost preview
**Solution:** Enter both quantity_kg and total_cost values

### Issue: Dashboard metrics show 0
**Solution:** Add some stock records first, then refresh the dashboard

## Support Queries

### Get Average Cost Across All Stock:
```sql
SELECT 
  SUM(total_cost) / NULLIF(SUM(quantity_kg), 0) as overall_avg_cost_per_kg
FROM stock;
```

### Get Today's Stock Additions:
```sql
SELECT * FROM stock 
WHERE date = CURRENT_DATE
ORDER BY created_at DESC;
```

### Calculate Unrealized Profit (Stock Value):
```sql
SELECT 
  (SUM(st.quantity_kg) - COALESCE(SUM(s.quantity_sold), 0)) as remaining_kg,
  (SUM(st.total_cost) / NULLIF(SUM(st.quantity_kg), 0)) as avg_cost_per_kg,
  ((SUM(st.quantity_kg) - COALESCE(SUM(s.quantity_sold), 0)) * 
   (SUM(st.total_cost) / NULLIF(SUM(st.quantity_kg), 0))) as remaining_stock_value
FROM stock st
LEFT JOIN sales s ON true;
```

## Conclusion

This enhancement provides comprehensive cost tracking and profit analysis capabilities to HarakaPOS. The admin can now make data-driven decisions about stock purchases, pricing, and business profitability.

For questions or issues, refer to the SQL files or check the Supabase logs for detailed error messages.
