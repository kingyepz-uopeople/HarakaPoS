# Database Migrations

This folder contains all database migration files for HarakaPoS.

## 📁 File Organization

```
migrations/
├── README.md (this file)
├── dispatch-system.sql          # Main dispatch system schema
└── update-old-status.sql        # Helper to migrate old statuses
```

## 🔄 Migration Naming Convention

All migration files follow this naming pattern:
```
descriptive-name.sql
```

For timestamped migrations (if using a migration tool):
```
YYYYMMDDHHMMSS_descriptive-name.sql
```

Example: `20251104120000_dispatch-system.sql`

## 📋 Available Migrations

### 1. `dispatch-system.sql`
**Purpose:** Complete dispatch system infrastructure  
**Created:** November 2025  
**Status:** Ready to apply  

**What it does:**
- ✅ Creates `order_status_logs` table for audit trail
- ✅ Creates `delivery_proof` table for delivery confirmation
- ✅ Creates `driver_status` table for availability tracking
- ✅ Adds triggers for auto-logging status changes
- ✅ Adds triggers for auto-updating driver availability
- ✅ Creates `order_timeline` view for order history
- ✅ Sets up Row Level Security (RLS) policies
- ✅ Creates indexes for performance

**Dependencies:** Requires existing `orders`, `sales`, `customers`, `users` tables

**How to apply:**
```sql
-- In Supabase Dashboard → SQL Editor
-- Copy and paste the entire contents of dispatch-system.sql
-- Execute
```

**Rollback:**
```sql
DROP VIEW IF EXISTS order_timeline;
DROP TABLE IF EXISTS delivery_proof CASCADE;
DROP TABLE IF EXISTS order_status_logs CASCADE;
DROP TABLE IF EXISTS driver_status CASCADE;
DROP TRIGGER IF EXISTS trigger_log_order_status ON orders;
DROP TRIGGER IF EXISTS trigger_update_driver_status ON orders;
DROP FUNCTION IF EXISTS log_order_status_change();
DROP FUNCTION IF EXISTS update_driver_status();

-- Remove new columns from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS sale_id;
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_proof_id;
```

### 2. `update-old-status.sql`
**Purpose:** Migrate old "On the Way" status to new "Out for Delivery" status  
**Created:** November 2025  
**Status:** Ready to apply  

**What it does:**
- ✅ Updates all existing orders with "On the Way" to "Out for Delivery"
- ✅ Verifies the update was successful

**Dependencies:** Should be run AFTER `dispatch-system.sql`

**How to apply:**
```sql
-- In Supabase Dashboard → SQL Editor
-- Copy and paste the entire contents of update-old-status.sql
-- Execute
```

**Rollback:**
```sql
-- If you need to revert (unlikely)
UPDATE orders 
SET delivery_status = 'On the Way' 
WHERE delivery_status = 'Out for Delivery';
```

## 🚀 Migration Application Order

Apply migrations in this order:

1. **First:** `dispatch-system.sql` - Creates all tables, triggers, and views
2. **Second:** `update-old-status.sql` - Migrates existing data

## ✅ Verification After Migration

After applying migrations, run these checks:

### Check Tables Created
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('order_status_logs', 'delivery_proof', 'driver_status')
ORDER BY table_name;

-- Expected: 3 rows
```

### Check Triggers Installed
```sql
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname IN ('trigger_log_order_status', 'trigger_update_driver_status');

-- Expected: 2 rows
```

### Check Functions Created
```sql
SELECT proname 
FROM pg_proc 
WHERE proname IN ('log_order_status_change', 'update_driver_status');

-- Expected: 2 rows
```

### Check View Created
```sql
SELECT * FROM order_timeline LIMIT 1;

-- Should not error
```

### Check Indexes Created
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('order_status_logs', 'delivery_proof', 'driver_status', 'orders')
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- Should show multiple indexes
```

### Check RLS Policies
```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('order_status_logs', 'delivery_proof', 'driver_status')
ORDER BY tablename, policyname;

-- Should show multiple policies per table
```

### Check Status Migration
```sql
SELECT delivery_status, COUNT(*) as count 
FROM orders 
GROUP BY delivery_status 
ORDER BY delivery_status;

-- Should NOT show "On the Way"
-- Should show "Out for Delivery" instead
```

## 🔧 Migration Best Practices

### Before Running Migrations

1. **Backup Your Database**
   ```bash
   # In Supabase Dashboard
   # Settings → Database → Create backup
   ```

2. **Test in Development First**
   - Apply to development/staging database
   - Run all verification queries
   - Test the application thoroughly
   - Only then apply to production

3. **Review the Migration**
   - Read through the entire SQL file
   - Understand what each section does
   - Check for any project-specific adjustments needed

### During Migration

1. **Run in a Transaction** (if possible)
   ```sql
   BEGIN;
   -- Run migration commands
   -- Check results
   COMMIT; -- or ROLLBACK if issues
   ```

2. **Monitor for Errors**
   - Watch for error messages
   - Note which section failed if any
   - Don't continue if errors occur

3. **Verify Each Major Step**
   - Check tables created
   - Verify data migrated
   - Test triggers working

### After Migration

1. **Run All Verification Queries**
   - Check all objects created
   - Verify data integrity
   - Test application functions

2. **Monitor Application**
   - Check logs for errors
   - Test critical workflows
   - Monitor performance

3. **Document Any Issues**
   - Note any errors encountered
   - Record resolution steps
   - Update migration file if needed

## 🛠️ Troubleshooting

### Error: "relation already exists"
**Solution:** The migration uses `IF NOT EXISTS` clauses now. If you see this error in old versions, add `IF NOT EXISTS` to the failing CREATE statement.

### Error: "policy already exists"
**Solution:** The migration uses `DROP POLICY IF EXISTS` before creating policies. Run those DROP statements first.

### Error: "column already exists"
**Solution:** The migration checks for existing columns. If you see this, the column is already added and you can skip that step.

### Error: "permission denied"
**Solution:** Ensure you're logged in as a database admin or have sufficient privileges.

### Trigger Not Firing
**Solution:** 
```sql
-- Check trigger is enabled
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_log_order_status';

-- If disabled, enable it
ALTER TABLE orders ENABLE TRIGGER trigger_log_order_status;
```

### RLS Blocking Operations
**Solution:** Check your RLS policies allow the operation for your role:
```sql
-- Temporarily disable RLS for testing (development only!)
ALTER TABLE order_status_logs DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;
```

## 📝 Creating New Migrations

When creating new migrations:

### 1. Use Descriptive Names
```
feature-name.sql          # Good
update-2.sql             # Bad
```

### 2. Include a Header Comment
```sql
-- =====================================================
-- MIGRATION: Feature Name
-- Created: YYYY-MM-DD
-- Purpose: Brief description
-- Dependencies: List any required tables/objects
-- =====================================================
```

### 3. Make Migrations Idempotent
Use `IF NOT EXISTS` and `IF EXISTS` to allow re-running:
```sql
CREATE TABLE IF NOT EXISTS my_table (...);
DROP POLICY IF EXISTS my_policy ON my_table;
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS my_column TEXT;
```

### 4. Include Rollback Instructions
Add a comment block with rollback commands:
```sql
-- ROLLBACK:
-- DROP TABLE IF EXISTS my_table CASCADE;
-- ALTER TABLE other_table DROP COLUMN IF EXISTS my_column;
```

### 5. Add Verification Queries
Include queries to verify the migration succeeded:
```sql
-- VERIFY:
-- SELECT COUNT(*) FROM my_table; -- Should return 0 or expected count
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'my_table';
```

## 🔐 Security Considerations

### Row Level Security (RLS)
All new tables should have RLS enabled:
```sql
ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_name"
  ON my_new_table
  FOR SELECT
  TO authenticated
  USING (true);
```

### Sensitive Data
For columns with sensitive data:
```sql
-- Use encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Example: Encrypt before storing
INSERT INTO table (encrypted_column) 
VALUES (pgp_sym_encrypt('sensitive_data', 'encryption_key'));
```

## 📊 Migration History

| Date | File | Description | Status |
|------|------|-------------|---------|
| 2025-11-04 | dispatch-system.sql | Dispatch system infrastructure | ✅ Ready |
| 2025-11-04 | update-old-status.sql | Status migration helper | ✅ Ready |

---

**Last Updated:** November 4, 2025  
**Maintained By:** Development Team  
**Related Docs:** [../docs/dispatch-system/](../docs/dispatch-system/)
