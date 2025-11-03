/**
 * Supabase Edge Function: Update Scheduled Orders
 * 
 * This function automatically changes orders from "Scheduled" to "Pending"
 * when their delivery_date matches today's date.
 * 
 * Deploy this function to Supabase and set up a cron job to run daily at 6:00 AM.
 * 
 * Deployment Instructions:
 * 1. Install Supabase CLI: npm install -g supabase
 * 2. Login: supabase login
 * 3. Link project: supabase link --project-ref YOUR_PROJECT_REF
 * 4. Deploy: supabase functions deploy update-order-statuses
 * 5. Set up cron in Supabase Dashboard → Edge Functions → Cron Jobs
 *    Schedule: 0 6 * * * (Every day at 6:00 AM)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

serve(async (req) => {
  try {
    // Get Supabase URL and Service Role Key from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    console.log(`Running order status update for date: ${today}`)

    // Update all orders that are:
    // 1. Currently "Scheduled"
    // 2. Have delivery_date = today
    const { data, error } = await supabase
      .from('orders')
      .update({ delivery_status: 'Pending' })
      .eq('delivery_status', 'Scheduled')
      .eq('delivery_date', today)
      .select()

    if (error) {
      throw error
    }

    const updatedCount = data?.length || 0

    console.log(`Successfully updated ${updatedCount} orders from Scheduled to Pending`)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        updated: updatedCount,
        orders: data,
        message: `Updated ${updatedCount} order(s) to Pending status`
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Error updating order statuses:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
})

/* 
 * TESTING
 * -------
 * 
 * Test locally with sample data:
 * 
 * 1. Create test orders:
 *    INSERT INTO orders (customer_id, quantity_kg, price_per_kg, payment_mode, 
 *                        delivery_status, delivery_date)
 *    VALUES 
 *      ('customer-uuid', 50, 120, 'Cash', 'Scheduled', CURRENT_DATE),
 *      ('customer-uuid', 30, 120, 'M-Pesa', 'Scheduled', CURRENT_DATE + 1);
 * 
 * 2. Run function locally:
 *    supabase functions serve update-order-statuses
 * 
 * 3. Invoke via curl:
 *    curl -i --location --request POST 'http://localhost:54321/functions/v1/update-order-statuses' \
 *      --header 'Authorization: Bearer YOUR_ANON_KEY' \
 *      --header 'Content-Type: application/json'
 * 
 * 4. Check database:
 *    SELECT * FROM orders WHERE delivery_date = CURRENT_DATE;
 *    -- Should see status changed from 'Scheduled' to 'Pending'
 * 
 * MONITORING
 * ----------
 * 
 * View function logs in Supabase Dashboard:
 * Edge Functions → update-order-statuses → Logs
 * 
 * CRON SETUP
 * ----------
 * 
 * In Supabase Dashboard → Database → Cron Jobs (pg_cron extension):
 * 
 * SELECT cron.schedule(
 *   'update-order-statuses-daily',
 *   '0 6 * * *',  -- Every day at 6:00 AM
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/update-order-statuses',
 *     headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
 *   );
 *   $$
 * );
 * 
 * Or use Supabase's built-in cron in Edge Functions dashboard.
 */
