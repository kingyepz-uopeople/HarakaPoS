-- =====================================================
-- BUSINESS EXPENSES TRACKING MODULE
-- For HarakaPOS - Haraka Wedges Supplies (Sole Proprietorship)
-- =====================================================

-- 1. Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- Lucide icon name
  color TEXT, -- Hex color for UI
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  
  -- Basic info
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  
  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer', 'cheque', 'credit_card')),
  payment_reference TEXT, -- M-Pesa code, cheque number, etc.
  
  -- Vendor/Supplier
  vendor_name TEXT,
  vendor_contact TEXT,
  
  -- Supporting documents
  receipt_number TEXT,
  receipt_image_url TEXT, -- Supabase Storage URL
  
  -- Additional info
  notes TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly') OR recurring_frequency IS NULL),
  
  -- Tracking
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Insert default expense categories for potato business
INSERT INTO expense_categories (name, description, icon, color) VALUES
  ('Raw Materials', 'Potato purchases and ingredients', 'ShoppingCart', '#f59e0b'),
  ('Transport & Fuel', 'Delivery vehicle fuel and maintenance', 'Truck', '#3b82f6'),
  ('Utilities', 'Electricity, water, gas', 'Zap', '#8b5cf6'),
  ('Salaries & Wages', 'Employee and driver payments', 'Users', '#10b981'),
  ('Rent', 'Processing facility rent', 'Home', '#ef4444'),
  ('Equipment', 'Processing equipment and tools', 'Wrench', '#6366f1'),
  ('Packaging', 'Bags, labels, packaging materials', 'Package', '#ec4899'),
  ('Marketing', 'Advertising and promotion', 'Megaphone', '#14b8a6'),
  ('Office Supplies', 'Stationery and admin supplies', 'FileText', '#84cc16'),
  ('Repairs & Maintenance', 'Equipment and facility repairs', 'Settings', '#f97316'),
  ('Licenses & Permits', 'Business licenses and permits', 'Award', '#06b6d4'),
  ('Bank Charges', 'Bank fees and charges', 'CreditCard', '#a855f7'),
  ('Other', 'Miscellaneous expenses', 'MoreHorizontal', '#64748b')
ON CONFLICT (name) DO NOTHING;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded_by ON expenses(recorded_by);

-- 5. Function to update expense timestamp
CREATE OR REPLACE FUNCTION update_expense_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_expense_timestamp ON expenses;
CREATE TRIGGER trigger_update_expense_timestamp
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_timestamp();

-- 6. Function to update category timestamp
CREATE OR REPLACE FUNCTION update_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_timestamp ON expense_categories;
CREATE TRIGGER trigger_update_category_timestamp
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_category_timestamp();

-- 7. Enable Row Level Security
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for expense_categories
DROP POLICY IF EXISTS "Authenticated users can view categories" ON expense_categories;
CREATE POLICY "Authenticated users can view categories"
  ON expense_categories FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create categories" ON expense_categories;
CREATE POLICY "Authenticated users can create categories"
  ON expense_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON expense_categories;
CREATE POLICY "Authenticated users can update categories"
  ON expense_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 9. RLS Policies for expenses
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON expenses;
CREATE POLICY "Authenticated users can view expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create expenses" ON expenses;
CREATE POLICY "Authenticated users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update their expenses" ON expenses;
CREATE POLICY "Authenticated users can update their expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete their expenses" ON expenses;
CREATE POLICY "Authenticated users can delete their expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (true);

-- 10. Service role full access
DROP POLICY IF EXISTS "Service role has full access to categories" ON expense_categories;
CREATE POLICY "Service role has full access to categories"
  ON expense_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role has full access to expenses" ON expenses;
CREATE POLICY "Service role has full access to expenses"
  ON expenses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- ANALYTICS VIEWS
-- =====================================================

-- View: Daily expense summary
CREATE OR REPLACE VIEW daily_expense_summary AS
SELECT 
  expense_date,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount,
  jsonb_object_agg(
    COALESCE(ec.name, 'Uncategorized'),
    COALESCE(category_totals.total, 0)
  ) as category_breakdown
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN LATERAL (
  SELECT SUM(amount) as total
  FROM expenses
  WHERE expense_date = e.expense_date
    AND category_id = e.category_id
) category_totals ON true
GROUP BY expense_date
ORDER BY expense_date DESC;

-- View: Monthly expense summary
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT 
  DATE_TRUNC('month', expense_date) as month,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  jsonb_object_agg(
    COALESCE(ec.name, 'Uncategorized'),
    COALESCE(category_totals.total, 0)
  ) as category_breakdown
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
LEFT JOIN LATERAL (
  SELECT SUM(amount) as total
  FROM expenses
  WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', e.expense_date)
    AND category_id = e.category_id
) category_totals ON true
GROUP BY DATE_TRUNC('month', expense_date)
ORDER BY month DESC;

-- View: Category-wise expense totals
CREATE OR REPLACE VIEW category_expense_totals AS
SELECT 
  ec.id as category_id,
  ec.name as category_name,
  ec.icon,
  ec.color,
  COUNT(e.id) as expense_count,
  COALESCE(SUM(e.amount), 0) as total_amount,
  COALESCE(AVG(e.amount), 0) as average_amount
FROM expense_categories ec
LEFT JOIN expenses e ON ec.id = e.category_id
WHERE ec.is_active = true
GROUP BY ec.id, ec.name, ec.icon, ec.color
ORDER BY total_amount DESC;

-- =====================================================
-- PROFIT CALCULATION VIEW
-- =====================================================

-- View: Daily profit/loss (Revenue - Expenses)
CREATE OR REPLACE VIEW daily_profit_summary AS
SELECT 
  COALESCE(sales_summary.date, expense_summary.date) as date,
  COALESCE(sales_summary.revenue, 0) as revenue,
  COALESCE(expense_summary.expenses, 0) as expenses,
  COALESCE(sales_summary.revenue, 0) - COALESCE(expense_summary.expenses, 0) as profit,
  CASE 
    WHEN COALESCE(sales_summary.revenue, 0) > 0 
    THEN ROUND(((COALESCE(sales_summary.revenue, 0) - COALESCE(expense_summary.expenses, 0)) / sales_summary.revenue * 100)::numeric, 2)
    ELSE 0
  END as profit_margin_percentage
FROM (
  SELECT 
    DATE(created_at) as date,
    SUM(total_amount) as revenue
  FROM sales
  GROUP BY DATE(created_at)
) sales_summary
FULL OUTER JOIN (
  SELECT 
    expense_date as date,
    SUM(amount) as expenses
  FROM expenses
  GROUP BY expense_date
) expense_summary ON sales_summary.date = expense_summary.date
ORDER BY date DESC;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('expense_categories', 'expenses')
ORDER BY table_name;

-- Check default categories
SELECT name, icon, color FROM expense_categories ORDER BY name;

-- You should see 13 pre-configured expense categories
