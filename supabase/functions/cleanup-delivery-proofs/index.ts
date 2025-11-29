// Supabase Edge Function to cleanup old delivery proof photos
// Schedule this function to run daily via Supabase Dashboard > Edge Functions > Cron

// @ts-ignore - Deno imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req: Request) => {
  try {
    // Get Supabase credentials from environment
    // @ts-ignore - Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    // @ts-ignore - Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('Starting cleanup of delivery proof photos older than 24 hours...')

    // Get all files in delivery-proofs bucket
    const { data: files, error: listError } = await supabase.storage
      .from('delivery-proofs')
      .list()

    if (listError) {
      throw listError
    }

    if (!files || files.length === 0) {
      console.log('No files found in delivery-proofs bucket')
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: 'No files to delete' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Filter files older than 24 hours
    const oldFiles = files.filter((file: any) => {
      const fileCreatedAt = new Date(file.created_at)
      return fileCreatedAt < twentyFourHoursAgo
    })

    console.log(`Found ${oldFiles.length} files older than 24 hours`)

    if (oldFiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, deleted: 0, message: 'No old files to delete' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Delete old files
    const filePaths = oldFiles.map((file: any) => file.name)
    const { data: deleteData, error: deleteError } = await supabase.storage
      .from('delivery-proofs')
      .remove(filePaths)

    if (deleteError) {
      throw deleteError
    }

    console.log(`Successfully deleted ${filePaths.length} old delivery proof photos`)

    return new Response(
      JSON.stringify({
        success: true,
        deleted: filePaths.length,
        message: `Deleted ${filePaths.length} delivery proof photos older than 24 hours`,
        files: filePaths,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error cleaning up delivery proofs:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
