# Cleanup Delivery Proofs Edge Function

Automatically deletes delivery proof photos older than 24 hours to save storage space and maintain privacy.

## 🚀 Deployment

### 1. Deploy the Edge Function

```bash
# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy cleanup-delivery-proofs
```

### 2. Set Environment Variables

The function automatically uses:
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase

No additional environment variables needed!

### 3. Schedule the Function (Optional)

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions**
3. Find `cleanup-delivery-proofs`
4. Click **Add a new trigger**
5. Set schedule: `0 */6 * * *` (every 6 hours)
6. Save

#### Option B: Manual Trigger via curl
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-delivery-proofs \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

#### Option C: Call from another Edge Function
```typescript
await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-delivery-proofs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
  }
})
```

## 🧪 Testing

Test the function locally:

```bash
# Start Supabase locally
supabase start

# Serve the function locally
supabase functions serve cleanup-delivery-proofs

# Test it
curl -X POST http://localhost:54321/functions/v1/cleanup-delivery-proofs
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "deleted": 5,
  "message": "Deleted 5 delivery proof photos older than 24 hours",
  "files": [
    "proofs/1234567890_abc123.jpg",
    "proofs/1234567891_def456.jpg"
  ]
}
```

### No Files Response
```json
{
  "success": true,
  "deleted": 0,
  "message": "No old files to delete"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

## ⏱️ Recommended Schedule

- **Every 6 hours**: `0 */6 * * *` (Recommended)
- **Daily at 2 AM**: `0 2 * * *`
- **Every hour**: `0 * * * *`

## 💡 How It Works

1. Function runs on schedule
2. Lists all files in `delivery-proofs` bucket
3. Filters files created more than 24 hours ago
4. Deletes old files in batch
5. Returns count of deleted files

## 🔒 Security

- Uses **Service Role Key** to bypass RLS
- Only accessible via Supabase Functions (not public HTTP)
- Logs all operations for audit trail

## 📝 Notes

- Photos are kept for 24 hours (enough time for disputes/verification)
- Deletion is permanent and cannot be undone
- Function runs with admin privileges (service role)
- Check logs in Supabase Dashboard > Edge Functions > Logs
