# 🛠️ HarakaPOS Complete Setup & Fix Guide

**One comprehensive guide for all setup and troubleshooting**

Last Updated: November 5, 2025

---

## 📋 Table of Contents

1. [Quick Setup](#quick-setup)
2. [Database Migrations](#database-migrations)
3. [M-Pesa Configuration](#m-pesa-configuration)
4. [Common Build Errors](#common-build-errors)
5. [Deployment Issues](#deployment-issues)
6. [File Organization](#file-organization)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Setup

### 1. Prerequisites
- Node.js 18+
- Supabase account
- Git

### 2. Install & Configure

```bash
# Clone and install
git clone https://github.com/kingyepz-uopeople/HarakaPoS.git
cd HarakaPoS
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 3. Database Setup

Run migrations in Supabase SQL Editor **in this order**:

1. `supabase/migrations/payments-system.sql`
2. `supabase/migrations/dispatch-system.sql`

### 4. Run Dev Server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🗄️ Database Migrations

### Active Migrations (Use These!)

Located in: `supabase/migrations/`

| File | Purpose | Run Order |
|------|---------|-----------|
| `payments-system.sql` | Payment system, M-Pesa, receipts | 1st |
| `dispatch-system.sql` | Delivery & dispatch system | 2nd |
| `fix-status-constraint.sql` | Fix status enum if needed | Optional |
| `update-old-status.sql` | Update old order statuses | Optional |

### How to Run

1. Open Supabase Dashboard → SQL Editor
2. Copy content from migration file
3. Paste and click "Run"
4. Verify in Table Editor

### Legacy Migrations

Old migrations moved to `supabase/migrations/legacy/` - **Don't use these**

---

## 💳 M-Pesa Configuration

### Sandbox (Testing)

Add to `.env.local`:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_key_from_daraja
MPESA_CONSUMER_SECRET=your_secret_from_daraja
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### Production (Live)

#### Option 1: Single Till/Paybill

```env
MPESA_ENVIRONMENT=production
MPESA_SHORTCODE=your_till_or_paybill_number
MPESA_PASSKEY=your_production_passkey
```

#### Option 2: Dual Setup (Recommended)

```env
MPESA_ENVIRONMENT=production

# Till (walk-in)
MPESA_TILL_NUMBER=512345
MPESA_TILL_PASSKEY=your_till_passkey

# Paybill (deliveries)
MPESA_PAYBILL_NUMBER=400200
MPESA_PAYBILL_PASSKEY=your_paybill_passkey
MPESA_USE_PAYBILL_FOR=delivery
```

### Getting Till/Paybill

- **Till**: Visit Safaricom shop (KES 500-1K, 2-5 days)
- **Paybill**: Apply via Equity/KCB Bank (KES 2-5K, 1-2 weeks)

See: `docs/mpesa-setup/DUAL_TILL_PAYBILL_SETUP.md`

---

## 🐛 Common Build Errors

### ✅ BUILD SUCCESS STATUS

**Latest Build**: November 5, 2025
- ✅ TypeScript compilation: Success
- ✅ Page collection: Success  
- ✅ Static generation: Success
- ⚠️ Middleware warning: Deprecation notice (non-critical)

**All systems operational** - Ready for deployment!

---

### Error: "Duplicate identifier 'useEffect'"

**Cause**: Corrupted files in old/backup folders

**Fix**:
```bash
# Delete old backup folders
rm -rf app/driver/old
rm -rf app/driver/_old_backup
rm -rf app/admin/old

# Or rename them
mv app/driver/old app/driver/_archived
```

### Error: "Module not found: Can't resolve '@/components/...'"

**Cause**: Missing component imports

**Fix**:
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Cause**: Missing environment variables

**Fix**:
1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials
3. Restart dev server

### Error: TypeScript compilation errors

**Fix**:
```bash
# Type check
npx tsc --noEmit

# If errors persist, check:
# 1. All imports are correct
# 2. No duplicate imports
# 3. Types match interfaces in lib/types.ts
```

---

## 🚀 Deployment Issues

### Vercel Build Fails

**Check:**
1. Environment variables set in Vercel dashboard
2. No corrupted files in `app/` directories
3. All imports resolve correctly
4. Database migrations run

**Fix Build:**
```bash
# Local test
npm run build

# If successful, deploy
git add .
git commit -m "Fix build errors"
git push origin main
```

### M-Pesa Callback Not Working

**Checklist:**
- [ ] Callback URL is HTTPS
- [ ] URL added to Daraja portal
- [ ] Endpoint is publicly accessible
- [ ] Database payment record created before STK push
- [ ] Check Vercel function logs

**Test Callback:**
```bash
# Use ngrok for local testing
ngrok http 3000
# Update MPESA_CALLBACK_URL to ngrok URL
```

### Database Connection Errors

**Fix:**
1. Verify Supabase project is active
2. Check anon key and URL are correct
3. Ensure RLS policies allow access
4. Test connection in Supabase dashboard

---

## 📁 File Organization

### Clean Structure

```
HarakaPoS/
├── app/                    # Next.js app router
│   ├── admin/             # Admin dashboard
│   ├── driver/            # Driver PWA
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities
│   ├── supabase/         # DB clients
│   ├── mpesa.ts          # M-Pesa integration
│   └── types.ts          # TypeScript types
├── docs/                  # Documentation
│   ├── mpesa-setup/      # M-Pesa guides
│   ├── pda-guides/       # PDA terminal guides
│   └── legacy/           # Old docs (archived)
├── supabase/
│   └── migrations/       # SQL migrations
│       ├── payments-system.sql    # ✅ Use
│       ├── dispatch-system.sql    # ✅ Use
│       └── legacy/       # Old migrations (archived)
├── public/               # Static assets
├── .env.local           # Environment variables (gitignored)
├── LICENSE              # Proprietary license
└── README.md            # Main documentation
```

### Files to Ignore

- `docs/legacy/` - Old documentation
- `supabase/migrations/legacy/` - Old SQL files
- `app/*/old/` - Backup folders (delete these!)

---

## 🔧 Troubleshooting

### Build Keeps Failing

```bash
# Nuclear option - start fresh
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### Database Tables Missing

1. Check migrations ran successfully
2. View tables in Supabase Table Editor
3. Re-run migrations if needed
4. Check RLS policies are enabled

### Payments Not Recording

**Check:**
1. `payments` table exists
2. RLS policies allow inserts
3. User is authenticated
4. Payment initiation succeeds
5. Check Supabase logs

**Debug:**
```typescript
// In browser console
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .limit(5);
console.log(data, error);
```

### PDA App Not Installing

**Requirements:**
- HTTPS required (use production domain)
- `manifest.json` exists in `/public`
- Service worker registered
- Valid icons (192x192, 512x512)

**Fix:**
1. Check `manifest.json` is accessible
2. Verify HTTPS certificate
3. Clear browser cache
4. Use Chrome/Edge (better PWA support)

---

## 📞 Get Help

### Documentation

- **M-Pesa Setup**: [docs/mpesa-setup/](docs/mpesa-setup/)
- **PDA Guides**: [docs/pda-guides/](docs/pda-guides/)
- **Payment System**: [docs/mpesa-setup/PAYMENT_SYSTEM_GUIDE.md](docs/mpesa-setup/PAYMENT_SYSTEM_GUIDE.md)

### Support

- **Technical Issues**: Check this guide first
- **M-Pesa Support**: apisupport@safaricom.co.ke
- **Licensing**: +254 791 890 8858

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] All migrations run successfully
- [ ] Environment variables set in Vercel
- [ ] M-Pesa production credentials configured
- [ ] Callback URL updated to production domain
- [ ] Test payment flow end-to-end
- [ ] PDA app installs correctly
- [ ] Receipt generation works
- [ ] RLS policies reviewed
- [ ] All TypeScript errors resolved
- [ ] Build succeeds locally (`npm run build`)
- [ ] Database backup strategy in place

---

## 🎯 Quick Fixes Reference

| Problem | Solution |
|---------|----------|
| Build fails with duplicate imports | Delete `app/*/old` folders |
| M-Pesa callback not working | Check HTTPS, update Daraja URL |
| Database connection fails | Verify Supabase URL and anon key |
| Payments not recording | Check RLS policies, run migrations |
| TypeScript errors | `rm -rf .next && npm run build` |
| PWA won't install | Ensure HTTPS, check manifest.json |
| Missing tables | Run migrations in correct order |
| Wrong business name on M-Pesa | Get Till/Paybill from Safaricom |

---

**This is the ONLY fix guide you need. All other guides are in `docs/legacy/` for reference.**

For detailed M-Pesa or PDA setup, see specific guides in `docs/mpesa-setup/` and `docs/pda-guides/`.
