-- HarakaPOS Profit Analysis Queries
-- Use these queries in Supabase SQL Editor or in the Reports page for profitability analysis

-- ============================================
-- 1. DAILY PROFIT SUMMARY
-- ============================================
-- Shows daily sales revenue vs stock costs to calculate profit
-- Assumptions: Stock cost is averaged across all sales for the day

WITH daily_sales AS (
  SELECT 
    date,
    SUM(amount) as total_sales,
    SUM(quantity_sold) as total_sold_kg
  FROM sales
  GROUP BY date
),
daily_stock AS (
  SELECT 
    date,
    SUM(total_cost) as total_cost,
    SUM(quantity_kg) as total_kg
  FROM stock
  GROUP BY date
),
avg_stock_cost AS (
  SELECT 
    SUM(total_cost) / NULLIF(SUM(quantity_kg), 0) as avg_cost_per_kg
  FROM stock
)
SELECT 
  ds.date,
  ds.total_sales,
  ds.total_sold_kg,
  (ds.total_sold_kg * ac.avg_cost_per_kg) as estimated_cost,
  (ds.total_sales - (ds.total_sold_kg * ac.avg_cost_per_kg)) as estimated_profit
FROM daily_sales ds
CROSS JOIN avg_stock_cost ac
ORDER BY ds.date DESC;

-- ============================================
-- 2. MONTHLY PROFIT SUMMARY
-- ============================================
-- Aggregates profit by month

WITH monthly_sales AS (
  SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(amount) as total_sales,
    SUM(quantity_sold) as total_sold_kg
  FROM sales
  GROUP BY DATE_TRUNC('month', date)
),
monthly_stock AS (
  SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(total_cost) as total_cost,
    SUM(quantity_kg) as total_kg
  FROM stock
  GROUP BY DATE_TRUNC('month', date)
)
SELECT 
  COALESCE(ms.month, mst.month) as month,
  COALESCE(ms.total_sales, 0) as total_sales,
  COALESCE(ms.total_sold_kg, 0) as total_sold_kg,
  COALESCE(mst.total_cost, 0) as total_stock_cost,
  COALESCE(mst.total_kg, 0) as total_stock_kg,
  (COALESCE(ms.total_sales, 0) - COALESCE(mst.total_cost, 0)) as net_profit,
  CASE 
    WHEN COALESCE(mst.total_cost, 0) > 0 
    THEN ((COALESCE(ms.total_sales, 0) - COALESCE(mst.total_cost, 0)) / COALESCE(mst.total_cost, 0) * 100)
    ELSE 0 
  END as profit_margin_percent
FROM monthly_sales ms
FULL OUTER JOIN monthly_stock mst ON ms.month = mst.month
ORDER BY month DESC;

-- ============================================
-- 3. OVERALL PROFIT SUMMARY
-- ============================================
-- Total business profitability since inception

SELECT 
  SUM(s.amount) as total_revenue,
  SUM(s.quantity_sold) as total_sold_kg,
  SUM(st.total_cost) as total_stock_cost,
  SUM(st.quantity_kg) as total_stock_purchased_kg,
  (SUM(st.quantity_kg) - SUM(s.quantity_sold)) as remaining_stock_kg,
  (SUM(s.amount) - SUM(st.total_cost)) as gross_profit,
  CASE 
    WHEN SUM(st.total_cost) > 0 
    THEN ((SUM(s.amount) - SUM(st.total_cost)) / SUM(st.total_cost) * 100)
    ELSE 0 
  END as profit_margin_percent
FROM sales s
CROSS JOIN stock st;

-- ============================================
-- 4. PROFIT BY DATE RANGE (Parameterized)
-- ============================================
-- Replace 'YYYY-MM-DD' with actual dates

SELECT 
  SUM(s.amount) as total_sales,
  SUM(s.quantity_sold) as total_sold_kg,
  (
    SELECT SUM(total_cost) / NULLIF(SUM(quantity_kg), 0)
    FROM stock
  ) as avg_cost_per_kg,
  (SUM(s.quantity_sold) * (
    SELECT SUM(total_cost) / NULLIF(SUM(quantity_kg), 0)
    FROM stock
  )) as estimated_cost,
  (SUM(s.amount) - (SUM(s.quantity_sold) * (
    SELECT SUM(total_cost) / NULLIF(SUM(quantity_kg), 0)
    FROM stock
  ))) as estimated_profit
FROM sales s
WHERE s.date BETWEEN '2025-01-01' AND '2025-12-31';
-- Change the dates above for your desired range

-- ============================================
-- 5. STOCK COST EFFICIENCY REPORT
-- ============================================
-- Shows which stock batches were most cost-effective

SELECT 
  date,
  quantity_kg,
  total_cost,
  cost_per_kg,
  source,
  RANK() OVER (ORDER BY cost_per_kg ASC) as cost_rank
FROM stock
ORDER BY cost_per_kg ASC
LIMIT 20;

-- ============================================
-- 6. BEST PERFORMING DAYS
-- ============================================
-- Days with highest profit margins

WITH daily_stats AS (
  SELECT 
    s.date,
    SUM(s.amount) as total_sales,
    SUM(s.quantity_sold) as total_sold_kg,
    (
      SELECT SUM(total_cost) / NULLIF(SUM(quantity_kg), 0)
      FROM stock
    ) as avg_cost_per_kg
  FROM sales s
  GROUP BY s.date
)
SELECT 
  date,
  total_sales,
  total_sold_kg,
  (total_sold_kg * avg_cost_per_kg) as estimated_cost,
  (total_sales - (total_sold_kg * avg_cost_per_kg)) as profit,
  CASE 
    WHEN (total_sold_kg * avg_cost_per_kg) > 0
    THEN ((total_sales - (total_sold_kg * avg_cost_per_kg)) / (total_sold_kg * avg_cost_per_kg) * 100)
    ELSE 0
  END as profit_margin_percent
FROM daily_stats
ORDER BY profit DESC
LIMIT 10;

-- ============================================
-- USAGE NOTES:
-- ============================================
-- 1. These queries use avg_cost_per_kg for sales cost estimation
--    since we don't track which specific stock batch was sold.
--
-- 2. For more accurate profit tracking, consider adding a 
--    stock_batch_id to the sales table in future versions.
--
-- 3. Run these queries in Supabase SQL Editor or create a 
--    dedicated Postgres function for the Reports page.
--
-- 4. Consider creating materialized views for better performance
--    on large datasets.
