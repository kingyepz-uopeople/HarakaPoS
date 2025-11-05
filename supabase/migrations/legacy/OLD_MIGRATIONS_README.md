# 🗄️ Database Migrations Guide# Database Migrations



SQL migration files for HarakaPOS - **Run in order!**This folder contains all database migration files for HarakaPoS.



---## 📁 File Organization



## ⚡ Quick Start (5 Minutes)```

migrations/

### Step 1: Access Supabase SQL Editor├── README.md (this file)

1. Go to **Supabase Dashboard**├── dispatch-system.sql          # Main dispatch system schema

2. Select your project└── update-old-status.sql        # Helper to migrate old statuses

3. Click **SQL Editor** in sidebar```

4. Click **New Query**

## 🔄 Migration Naming Convention

### Step 2: Run Migrations in Order

Copy and paste each file's contents, then click **Run**:All migration files follow this naming pattern:

```

1. ✅ `etims-config.sql` - eTIMS configuration tabledescriptive-name.sql

2. ✅ `etims-invoices.sql` - eTIMS invoice tracking```

3. ✅ `barcode-delivery-tracking.sql` - Barcode system

For timestamped migrations (if using a migration tool):

**That's it!** Your database is ready! 🎉```

YYYYMMDDHHMMSS_descriptive-name.sql

---```



## 📋 Migration FilesExample: `20251104120000_dispatch-system.sql`



### 1. etims-config.sql## 📋 Available Migrations

**Purpose:** eTIMS (KRA Tax) configuration storage

### 1. `dispatch-system.sql`

**Creates:****Purpose:** Complete dispatch system infrastructure  

- `etims_config` table**Created:** November 2025  

- Configuration fields (credentials, VAT rate, etc.)**Status:** Ready to apply  

- RLS policies

**What it does:**

**When to run:** Before using eTIMS features- ✅ Creates `order_status_logs` table for audit trail

- ✅ Creates `delivery_proof` table for delivery confirmation

**Dependencies:** None (run first)- ✅ Creates `driver_status` table for availability tracking

- ✅ Adds triggers for auto-logging status changes

**Verification:**- ✅ Adds triggers for auto-updating driver availability

```sql- ✅ Creates `order_timeline` view for order history

SELECT * FROM etims_config;- ✅ Sets up Row Level Security (RLS) policies

```- ✅ Creates indexes for performance



**What to expect:** Empty table, ready for configuration**Dependencies:** Requires existing `orders`, `sales`, `customers`, `users` tables



---**How to apply:**

```sql

### 2. etims-invoices.sql-- In Supabase Dashboard → SQL Editor

**Purpose:** Track eTIMS invoice submissions to KRA-- Copy and paste the entire contents of dispatch-system.sql

-- Execute

**Creates:**```

- `etims_invoices` table

- Invoice tracking fields**Rollback:**

- Control code storage```sql

- RLS policiesDROP VIEW IF EXISTS order_timeline;

DROP TABLE IF EXISTS delivery_proof CASCADE;

**When to run:** After etims-config.sqlDROP TABLE IF EXISTS order_status_logs CASCADE;

DROP TABLE IF EXISTS driver_status CASCADE;

**Dependencies:** DROP TRIGGER IF EXISTS trigger_log_order_status ON orders;

- `etims_config` table must existDROP TRIGGER IF EXISTS trigger_update_driver_status ON orders;

- `orders` table must existDROP FUNCTION IF EXISTS log_order_status_change();

DROP FUNCTION IF EXISTS update_driver_status();

**Verification:**

```sql-- Remove new columns from orders table

SELECT * FROM etims_invoices LIMIT 5;ALTER TABLE orders DROP COLUMN IF EXISTS sale_id;

```ALTER TABLE orders DROP COLUMN IF EXISTS delivery_proof_id;

```

**What to expect:** Empty table, will populate when invoices are submitted

### 2. `update-old-status.sql`

---**Purpose:** Migrate old "On the Way" status to new "Out for Delivery" status  

**Created:** November 2025  

### 3. barcode-delivery-tracking.sql**Status:** Ready to apply  

**Purpose:** Complete barcode delivery tracking system

**What it does:**

**Creates:**- ✅ Updates all existing orders with "On the Way" to "Out for Delivery"

- `delivery_barcodes` table - Barcode generation and storage- ✅ Verifies the update was successful

- `barcode_scan_log` table - Every scan logged with GPS

- `delivery_route_tracking` table - Continuous GPS route logging**Dependencies:** Should be run AFTER `dispatch-system.sql`

- Functions:

  - `generate_delivery_barcode()` - Auto-generate unique barcodes**How to apply:**

  - `log_barcode_scan()` - Log scans with GPS```sql

  - `get_barcode_details()` - Retrieve barcode info-- In Supabase Dashboard → SQL Editor

- RLS policies for all tables-- Copy and paste the entire contents of update-old-status.sql

-- Execute

**When to run:** After core schema exists```



**Dependencies:****Rollback:**

- `orders` table must exist```sql

- `customers` table must exist-- If you need to revert (unlikely)

- `auth.users` table (Supabase built-in)UPDATE orders 

SET delivery_status = 'On the Way' 

**Verification:**WHERE delivery_status = 'Out for Delivery';

```sql```

-- Check tables exist

SELECT tablename FROM pg_tables WHERE schemaname = 'public' ## 🚀 Migration Application Order

  AND tablename LIKE '%barcode%' OR tablename LIKE '%route_tracking%';

Apply migrations in this order:

-- Check functions exist

SELECT routine_name FROM information_schema.routines 1. **First:** `dispatch-system.sql` - Creates all tables, triggers, and views

  WHERE routine_schema = 'public' AND routine_name LIKE '%barcode%';2. **Second:** `update-old-status.sql` - Migrates existing data



-- Test barcode generation## ✅ Verification After Migration

SELECT generate_delivery_barcode();

```After applying migrations, run these checks:



**What to expect:**### Check Tables Created

- 3 tables created```sql

- 3 functions availableSELECT table_name 

- Sample barcode: `HWS-20251105-0001`FROM information_schema.tables 

WHERE table_schema = 'public' 

---  AND table_name IN ('order_status_logs', 'delivery_proof', 'driver_status')

ORDER BY table_name;

## 🎯 Complete Migration Order

-- Expected: 3 rows

### Recommended Execution Order:```



```### Check Triggers Installed

1. etims-config.sql          → eTIMS configuration```sql

2. etims-invoices.sql        → eTIMS invoice tracking  SELECT tgname, tgrelid::regclass 

3. barcode-delivery-tracking.sql → Barcode systemFROM pg_trigger 

```WHERE tgname IN ('trigger_log_order_status', 'trigger_update_driver_status');



**Total time:** ~5 minutes-- Expected: 2 rows

```

---

### Check Functions Created

## ✅ Verification Checklist```sql

SELECT proname 

After running all migrations, verify with:FROM pg_proc 

WHERE proname IN ('log_order_status_change', 'update_driver_status');

```sql

-- 1. Check all tables exist-- Expected: 2 rows

SELECT tablename FROM pg_tables ```

WHERE schemaname = 'public' 

ORDER BY tablename;### Check View Created

```sql

-- Expected new tables:SELECT * FROM order_timeline LIMIT 1;

-- - delivery_barcodes

-- - barcode_scan_log-- Should not error

-- - delivery_route_tracking```

-- - etims_config

-- - etims_invoices### Check Indexes Created

```sql

-- 2. Check functions existSELECT indexname 

SELECT routine_name FROM information_schema.routines FROM pg_indexes 

WHERE routine_schema = 'public' WHERE tablename IN ('order_status_logs', 'delivery_proof', 'driver_status', 'orders')

  AND routine_type = 'FUNCTION'  AND indexname LIKE 'idx_%'

ORDER BY routine_name;ORDER BY indexname;



-- Expected functions:-- Should show multiple indexes

-- - generate_delivery_barcode```

-- - get_barcode_details

-- - log_barcode_scan### Check RLS Policies

```sql

-- 3. Test barcode generationSELECT tablename, policyname, cmd 

SELECT generate_delivery_barcode();FROM pg_policies 

-- Should return: HWS-YYYYMMDD-0001WHERE tablename IN ('order_status_logs', 'delivery_proof', 'driver_status')

ORDER BY tablename, policyname;

-- 4. Check RLS is enabled

SELECT tablename, rowsecurity -- Should show multiple policies per table

FROM pg_tables ```

WHERE schemaname = 'public' 

  AND tablename IN ('delivery_barcodes', 'barcode_scan_log', 'delivery_route_tracking', 'etims_config', 'etims_invoices');### Check Status Migration

-- All should show: true```sql

SELECT delivery_status, COUNT(*) as count 

-- 5. Test policies existFROM orders 

SELECT tablename, policyname GROUP BY delivery_status 

FROM pg_policies ORDER BY delivery_status;

WHERE schemaname = 'public'

ORDER BY tablename, policyname;-- Should NOT show "On the Way"

-- Should see policies for all new tables-- Should show "Out for Delivery" instead

``````



---## 🔧 Migration Best Practices



## 🔧 Troubleshooting### Before Running Migrations



### Error: "relation does not exist"1. **Backup Your Database**

   ```bash

**Cause:** Dependency table not created yet   # In Supabase Dashboard

   # Settings → Database → Create backup

**Solution:**   ```

1. Check if `orders` table exists:

   ```sql2. **Test in Development First**

   SELECT * FROM orders LIMIT 1;   - Apply to development/staging database

   ```   - Run all verification queries

2. Check if `customers` table exists:   - Test the application thoroughly

   ```sql   - Only then apply to production

   SELECT * FROM customers LIMIT 1;

   ```3. **Review the Migration**

3. If missing, create core schema first   - Read through the entire SQL file

   - Understand what each section does

---   - Check for any project-specific adjustments needed



### Error: "function already exists"### During Migration



**Cause:** Migration run twice1. **Run in a Transaction** (if possible)

   ```sql

**Solution:**   BEGIN;

1. Check if function exists:   -- Run migration commands

   ```sql   -- Check results

   SELECT routine_name FROM information_schema.routines    COMMIT; -- or ROLLBACK if issues

   WHERE routine_name = 'generate_delivery_barcode';   ```

   ```

2. If exists, skip this migration or drop first:2. **Monitor for Errors**

   ```sql   - Watch for error messages

   DROP FUNCTION IF EXISTS generate_delivery_barcode();   - Note which section failed if any

   ```   - Don't continue if errors occur

3. Then re-run migration

3. **Verify Each Major Step**

---   - Check tables created

   - Verify data migrated

### Error: "permission denied"   - Test triggers working



**Cause:** Insufficient database permissions### After Migration



**Solution:**1. **Run All Verification Queries**

1. Ensure you're using Supabase SQL Editor (has admin access)   - Check all objects created

2. Don't use service role key in client code   - Verify data integrity

3. Check Supabase project permissions   - Test application functions



---2. **Monitor Application**

   - Check logs for errors

### Error: "RLS policy prevents access"   - Test critical workflows

   - Monitor performance

**Cause:** Row Level Security blocking access

3. **Document Any Issues**

**Solution:**   - Note any errors encountered

1. Verify you're authenticated:   - Record resolution steps

   ```sql   - Update migration file if needed

   SELECT auth.uid();

   ```## 🛠️ Troubleshooting

2. Check RLS policies allow your user role

3. For testing, temporarily disable RLS:### Error: "relation already exists"

   ```sql**Solution:** The migration uses `IF NOT EXISTS` clauses now. If you see this error in old versions, add `IF NOT EXISTS` to the failing CREATE statement.

   ALTER TABLE delivery_barcodes DISABLE ROW LEVEL SECURITY;

   ```### Error: "policy already exists"

   (Re-enable after testing!)**Solution:** The migration uses `DROP POLICY IF EXISTS` before creating policies. Run those DROP statements first.



---### Error: "column already exists"

**Solution:** The migration checks for existing columns. If you see this, the column is already added and you can skip that step.

## 🔄 Rolling Back Migrations

### Error: "permission denied"

### To remove barcode system:**Solution:** Ensure you're logged in as a database admin or have sufficient privileges.



```sql### Trigger Not Firing

-- Drop tables (cascade removes dependencies)**Solution:** 

DROP TABLE IF EXISTS delivery_route_tracking CASCADE;```sql

DROP TABLE IF EXISTS barcode_scan_log CASCADE;-- Check trigger is enabled

DROP TABLE IF EXISTS delivery_barcodes CASCADE;SELECT tgname, tgenabled 

FROM pg_trigger 

-- Drop functionsWHERE tgname = 'trigger_log_order_status';

DROP FUNCTION IF EXISTS generate_delivery_barcode();

DROP FUNCTION IF EXISTS log_barcode_scan(UUID, UUID, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT);-- If disabled, enable it

DROP FUNCTION IF EXISTS get_barcode_details(TEXT);ALTER TABLE orders ENABLE TRIGGER trigger_log_order_status;

``````



### To remove eTIMS:### RLS Blocking Operations

**Solution:** Check your RLS policies allow the operation for your role:

```sql```sql

DROP TABLE IF EXISTS etims_invoices CASCADE;-- Temporarily disable RLS for testing (development only!)

DROP TABLE IF EXISTS etims_config CASCADE;ALTER TABLE order_status_logs DISABLE ROW LEVEL SECURITY;

```

-- Re-enable when done

---ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

```

## 📊 Schema Diagrams

## 📝 Creating New Migrations

### Barcode System ERD:

When creating new migrations:

```

┌─────────────────────┐### 1. Use Descriptive Names

│   delivery_barcodes │```

├─────────────────────┤feature-name.sql          # Good

│ id (PK)             │update-2.sql             # Bad

│ order_id (FK)       │◄─────┐```

│ barcode_number      │      │

│ customer_id (FK)    │      │### 2. Include a Header Comment

│ status              │      │```sql

│ generated_at        │      │-- =====================================================

└─────────────────────┘      │-- MIGRATION: Feature Name

         │                    │-- Created: YYYY-MM-DD

         │ 1:N                │-- Purpose: Brief description

         ▼                    │-- Dependencies: List any required tables/objects

┌─────────────────────┐      │-- =====================================================

│  barcode_scan_log   │      │```

├─────────────────────┤      │

│ id (PK)             │      │### 3. Make Migrations Idempotent

│ barcode_id (FK)     │──────┘Use `IF NOT EXISTS` and `IF EXISTS` to allow re-running:

│ scanned_by (FK)     │```sql

│ scan_type           │CREATE TABLE IF NOT EXISTS my_table (...);

│ latitude            │DROP POLICY IF EXISTS my_policy ON my_table;

│ longitude           │ALTER TABLE my_table ADD COLUMN IF NOT EXISTS my_column TEXT;

│ scan_location       │```

│ scanned_at          │

└─────────────────────┘### 4. Include Rollback Instructions

Add a comment block with rollback commands:

┌──────────────────────────┐```sql

│ delivery_route_tracking  │-- ROLLBACK:

├──────────────────────────┤-- DROP TABLE IF EXISTS my_table CASCADE;

│ id (PK)                  │-- ALTER TABLE other_table DROP COLUMN IF EXISTS my_column;

│ barcode_id (FK)          │──────┐```

│ driver_id (FK)           │      │

│ latitude                 │      │### 5. Add Verification Queries

│ longitude                │      │Include queries to verify the migration succeeded:

│ accuracy                 │      │```sql

│ speed                    │      │-- VERIFY:

│ heading                  │      │-- SELECT COUNT(*) FROM my_table; -- Should return 0 or expected count

│ is_online                │      │-- SELECT column_name FROM information_schema.columns WHERE table_name = 'my_table';

│ battery_level            │      │```

│ recorded_at              │      │

└──────────────────────────┘      │## 🔐 Security Considerations

                                   │

                                   ▼### Row Level Security (RLS)

                        ┌─────────────────────┐All new tables should have RLS enabled:

                        │   delivery_barcodes │```sql

                        └─────────────────────┘ALTER TABLE my_new_table ENABLE ROW LEVEL SECURITY;

```

CREATE POLICY "policy_name"

### eTIMS System ERD:  ON my_new_table

  FOR SELECT

```  TO authenticated

┌─────────────────────┐  USING (true);

│    etims_config     │```

├─────────────────────┤

│ id (PK)             │### Sensitive Data

│ company_name        │For columns with sensitive data:

│ kra_pin             │```sql

│ bhf_id              │-- Use encryption functions

│ api_url             │CREATE EXTENSION IF NOT EXISTS pgcrypto;

│ enabled             │

│ default_vat_rate    │-- Example: Encrypt before storing

└─────────────────────┘INSERT INTO table (encrypted_column) 

VALUES (pgp_sym_encrypt('sensitive_data', 'encryption_key'));

┌─────────────────────┐```

│   etims_invoices    │

├─────────────────────┤## 📊 Migration History

│ id (PK)             │

│ order_id (FK)       │◄───── orders table| Date | File | Description | Status |

│ invoice_number      │|------|------|-------------|---------|

│ control_code        │| 2025-11-04 | dispatch-system.sql | Dispatch system infrastructure | ✅ Ready |

│ qr_code_url         │| 2025-11-04 | update-old-status.sql | Status migration helper | ✅ Ready |

│ submitted_at        │

│ response_status     │---

└─────────────────────┘

```**Last Updated:** November 4, 2025  

**Maintained By:** Development Team  

---**Related Docs:** [../docs/dispatch-system/](../docs/dispatch-system/)


## 📁 File Descriptions

### etims-config.sql (50 lines)
- Creates `etims_config` table
- Stores KRA credentials
- VAT rate configuration
- Auto-submit settings
- RLS policies for admin-only access

### etims-invoices.sql (100 lines)
- Creates `etims_invoices` table
- Links to `orders` table
- Stores KRA control codes
- QR code URLs
- Invoice status tracking
- RLS policies for authenticated users

### barcode-delivery-tracking.sql (450 lines)
- **3 tables created:**
  1. `delivery_barcodes` - Main barcode storage
  2. `barcode_scan_log` - Scan history with GPS
  3. `delivery_route_tracking` - Continuous GPS tracking

- **3 functions created:**
  1. `generate_delivery_barcode()` - Auto-generate unique codes
  2. `log_barcode_scan()` - Log scans with GPS data
  3. `get_barcode_details()` - Retrieve full barcode info

- **Features:**
  - Unique barcode generation (HWS-YYYYMMDD-NNNN)
  - GPS coordinate storage
  - Photo URL storage
  - Status tracking (7 states)
  - Scan type tracking (7 types)
  - Route history
  - RLS policies

---

## 🎯 Best Practices

### Before Running Migrations:
1. ✅ Backup your database
2. ✅ Test in development first
3. ✅ Review migration content
4. ✅ Check dependencies exist
5. ✅ Have rollback plan ready

### After Running Migrations:
1. ✅ Verify tables created
2. ✅ Test functions work
3. ✅ Check RLS policies
4. ✅ Test from application
5. ✅ Document any issues

### For Production:
1. ✅ Run during low-traffic period
2. ✅ Monitor for errors
3. ✅ Verify data integrity
4. ✅ Test critical features
5. ✅ Keep migration logs

---

## 🔐 Security Notes

### Row Level Security (RLS):
- ✅ Enabled on all tables
- ✅ Authenticated users only
- ✅ Role-based access control
- ✅ Admin vs Driver policies

### Data Protection:
- ✅ GPS coordinates encrypted in transit (HTTPS)
- ✅ Photos stored with restricted access
- ✅ Barcode numbers indexed but not exposed publicly
- ✅ User IDs from auth system

### Audit Trail:
- ✅ All scans logged (who, when, where)
- ✅ Timestamps on all records
- ✅ Immutable scan history
- ✅ GPS accuracy recorded

---

## 📈 Performance Tips

### Indexing:
All migrations include proper indexes:
- Barcode numbers (unique, indexed)
- Order IDs (foreign keys indexed)
- Timestamps (for date range queries)
- User IDs (for user-specific queries)

### Optimization:
- Use `get_barcode_details()` function (optimized join)
- Don't query `barcode_scan_log` directly for counts
- Use materialized views for heavy reports (if needed)

---

## ✅ Post-Migration Checklist

After running all migrations:

- [ ] All tables visible in Supabase Table Editor
- [ ] RLS enabled on all new tables
- [ ] Functions listed in Database → Functions
- [ ] Test barcode generation works
- [ ] Test barcode scanning from app
- [ ] GPS coordinates saved correctly
- [ ] Photos upload successfully
- [ ] eTIMS configuration accessible
- [ ] No console errors in browser
- [ ] Mobile scanning works
- [ ] Admin can generate barcodes
- [ ] Drivers can scan barcodes

---

## 📞 Support

### If migrations fail:
1. Check error message carefully
2. Review troubleshooting section
3. Verify dependencies exist
4. Check Supabase logs
5. Try rollback and re-run

### Common success indicators:
- ✅ "Success. No rows returned" (for DDL)
- ✅ New tables appear in Table Editor
- ✅ Functions listed in sidebar
- ✅ Test queries return expected results

---

**Migrations Ready!** Run them in order and verify each one! 🚀✨

*Last updated: November 5, 2025*
