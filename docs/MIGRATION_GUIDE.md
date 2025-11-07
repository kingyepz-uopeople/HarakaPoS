# Apply Driver Location Tracking Migration

## Quick Start (Recommended)

If you have Supabase CLI installed:

```bash
supabase db push
```

## Manual Application

If you don't have Supabase CLI, copy and run the SQL from:
`supabase/migrations/20241107_driver_location_tracking.sql`

### Via Supabase Dashboard:

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Paste the contents of `20241107_driver_location_tracking.sql`
6. Click **Run**

### Via psql (Command Line):

```bash
psql -h db.YOUR_PROJECT_REF.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20241107_driver_location_tracking.sql
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

## Enable Realtime (Required!)

After running the migration:

1. Go to **Database** → **Replication** in Supabase Dashboard
2. Find `driver_locations` table
3. Click the toggle to **Enable Replication**
4. Ensure it's published to `supabase_realtime`

## Verify Installation

Run this query in SQL Editor to verify:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'driver_locations'
);
-- Should return: true

-- Check if realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'driver_locations';
-- Should return 1 row

-- Test distance calculation function
SELECT calculate_distance_meters(
  -1.286389, 36.817223,  -- Nairobi CBD
  -1.292066, 36.821945   -- Westlands
) as distance_meters;
-- Should return: ~700-800 meters
```

## Next Steps

1. ✅ Migration applied
2. ✅ Realtime enabled
3. 🚀 Start using the features!

### For Drivers:
- Open any delivery with status "Out for Delivery"
- GPS tracking activates automatically
- Green badge shows "GPS Tracking Active"

### For Admin:
- Go to Orders Management
- Click "Track Drivers" button
- Select an active delivery to see live map

## Rollback (If Needed)

```sql
-- Disable realtime
ALTER PUBLICATION supabase_realtime DROP TABLE driver_locations;

-- Drop table and all functions
DROP TABLE IF EXISTS driver_locations CASCADE;
DROP FUNCTION IF EXISTS update_driver_location_timestamp CASCADE;
DROP FUNCTION IF EXISTS calculate_distance_meters CASCADE;
DROP FUNCTION IF EXISTS is_driver_near_destination CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_driver_locations CASCADE;
DROP VIEW IF EXISTS latest_driver_positions CASCADE;

-- Remove new columns from orders
ALTER TABLE orders DROP COLUMN IF EXISTS tracking_url;
ALTER TABLE orders DROP COLUMN IF EXISTS estimated_arrival_time;
ALTER TABLE orders DROP COLUMN IF EXISTS route_distance_km;
ALTER TABLE orders DROP COLUMN IF EXISTS route_duration_minutes;
```

## Troubleshooting

### Error: "relation driver_locations already exists"
**Solution:** Table already created. Skip migration or run rollback first.

### Error: "permission denied"
**Solution:** Make sure you're connected as `postgres` user (superuser).

### Realtime not working
**Solutions:**
1. Check Database → Replication in dashboard
2. Ensure `driver_locations` is enabled
3. Restart your Next.js dev server
4. Clear browser cache

### Functions not found
**Solution:** Re-run the migration - functions may not have been created.

## Performance Notes

- **Storage:** ~100 bytes per location update
- **Frequency:** 5 seconds (12 updates/minute)
- **Retention:** 7 days automatic cleanup
- **Estimated storage:** ~10KB per hour per active driver

For 10 drivers on 8-hour shifts:
- Daily: ~800KB
- Weekly: ~5.6MB (then cleaned up)

Very minimal storage impact! 🎉
