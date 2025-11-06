# 📁 HarakaPOS Project Structure

## 🗂️ Documentation Organization

All documentation is organized in the `docs/` folder:

### 📋 Main Documentation
- **`README.md`** - Project overview and getting started
- **`QUICK_REFERENCE.md`** - Quick command reference
- **`FEATURE_ROADMAP.md`** - Future features and priorities
- **`SYSTEM_HEALTH_CHECK.md`** - System validation checklist

### 🚀 Setup & Testing Guides
- **`END_TO_END_TESTING_GUIDE.md`** - Complete workflow testing (18 pages)
- **`NEXT_STEPS.md`** - What to do after setup
- **`PWA_ICON_GUIDE.md`** - PWA installation guide
- **`PDA_QUICK_START.md`** - Driver PDA setup
- **`PDA_TRACKING_FAQ.md`** - Driver app FAQs

### 🆕 Recent Updates
- **`FEATURES_UPDATE_SUMMARY.md`** - Latest features (Nov 6, 2025)
- **`TODAYS_UPDATE_SUMMARY.md`** - Daily changelog

### 🐛 Troubleshooting
- **`URGENT_FIX_INVENTORY_ERROR.md`** - Fix inventory table error
- **`FIX_INVENTORY_ERROR_VISUAL_GUIDE.md`** - Visual fix guide

### 💾 Database Migrations
Location: `docs/migrations/`

- **`QUICK_MIGRATION.sql`** ⭐ **USE THIS** - Simplified one-file migration
- **`FIX_DELETE_POLICY.sql`** - Fix delete permissions
- **Main migration**: `supabase/migrations/20251106_enhanced_features.sql`

---

## 📂 Project Folder Structure

```
HarakaPoS/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Admin dashboard
│   │   ├── analytics/          # ✨ NEW - Sales analytics
│   │   ├── barcodes/           # Barcode management
│   │   ├── customers/          # Customer management
│   │   ├── deliveries/         # Delivery tracking
│   │   ├── etims/              # eTIMS tax integration
│   │   ├── expenses/           # Expense tracking
│   │   ├── inventory/          # ✨ NEW - Inventory management
│   │   ├── notifications/      # ✨ NEW - Alerts & notifications
│   │   ├── orders/             # Order management
│   │   ├── profit-analysis/    # Profit reports
│   │   ├── receipts/           # ✨ UPDATED - Receipt history with eTIMS
│   │   ├── reports/            # Business reports
│   │   ├── sales/              # Sales management
│   │   ├── settings/           # System settings
│   │   └── stock/              # Stock management
│   ├── driver/                  # Driver interface
│   │   ├── deliveries/         # Driver delivery list
│   │   └── scan/               # Barcode scanner
│   └── login/                   # Authentication
│
├── components/                   # Reusable components
│   ├── layout/                  # Layout components
│   │   └── sidebar.tsx         # ✨ UPDATED - Added new menu items
│   └── ui/                      # UI components
│
├── docs/                         # 📚 ALL DOCUMENTATION
│   ├── migrations/              # 💾 SQL migration files
│   │   ├── QUICK_MIGRATION.sql          # ⭐ Main migration
│   │   └── FIX_DELETE_POLICY.sql        # Policy fix
│   ├── END_TO_END_TESTING_GUIDE.md      # Testing guide
│   ├── FEATURES_UPDATE_SUMMARY.md        # Latest features
│   ├── NEXT_STEPS.md                     # Setup instructions
│   └── ... (all other docs)
│
├── lib/                          # Utility libraries
│   ├── supabase/                # Supabase clients
│   └── utils/                   # Helper functions
│
├── supabase/                     # Supabase configuration
│   └── migrations/              # Database migrations
│       └── 20251106_enhanced_features.sql  # Full migration
│
├── utils/                        # Utility functions
│   ├── formatCurrency.ts        # Currency formatting
│   └── formatDate.ts            # Date formatting
│
├── .env.local                    # Environment variables
├── next.config.ts                # Next.js config
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

---

## 🗄️ Database Structure

### Existing Tables
- `auth.users` - User authentication
- `customers` - Customer records
- `orders` - Order management
- `sales` - Sales transactions
- `receipts` - ✨ UPDATED with eTIMS fields
- `payments` - Payment records
- `delivery_barcodes` - Barcode tracking
- `barcode_scan_log` - Scan history
- `expenses` - Expense tracking
- `stock` - Stock management

### ✨ New Tables (Nov 6, 2025)
- **`inventory`** - Product inventory with perishables
- **`stock_movements`** - Inventory audit trail
- **`notifications`** - System notifications

---

## 🔑 Key Features by Location

### Admin Dashboard (`/dashboard`)
1. **Analytics** - `/dashboard/analytics` ✨ NEW
   - Revenue tracking
   - Customer insights
   - Payment breakdowns
   - CSV export

2. **Inventory** - `/dashboard/inventory` ✨ NEW
   - Real-time stock levels
   - Low stock alerts
   - Perishable tracking
   - Wastage management

3. **Receipts** - `/dashboard/receipts` ✨ UPDATED
   - eTIMS tax integration
   - Receipt history
   - Print & download
   - Tax reporting

4. **Notifications** - `/dashboard/notifications` ✨ NEW
   - Real-time alerts
   - Browser notifications
   - Low stock warnings
   - Payment confirmations

### Driver Interface (`/driver`)
1. **Deliveries** - `/driver/deliveries`
   - Assigned orders
   - Delivery list
   - Navigation

2. **Scanner** - `/driver/scan`
   - Barcode scanning
   - Status updates
   - Photo capture
   - GPS tracking

---

## 📝 Quick Start Checklist

### Initial Setup
- [ ] Clone repository
- [ ] Install dependencies: `npm install`
- [ ] Configure `.env.local` with Supabase credentials
- [ ] Run dev server: `npm run dev`

### Database Setup
- [ ] Open Supabase Dashboard
- [ ] Run `docs/migrations/QUICK_MIGRATION.sql` in SQL Editor
- [ ] Verify 3 tables created (inventory, notifications, stock_movements)
- [ ] Check 9 sample products loaded

### Testing
- [ ] Test inventory page: `/dashboard/inventory`
- [ ] Test analytics: `/dashboard/analytics`
- [ ] Test notifications: `/dashboard/notifications`
- [ ] Test receipts with tax: `/dashboard/receipts`
- [ ] Test driver scanner: `/driver/scan`

---

## 🔗 Important Links

### Documentation
- Full Testing Guide: `docs/END_TO_END_TESTING_GUIDE.md`
- Feature Summary: `docs/FEATURES_UPDATE_SUMMARY.md`
- Next Steps: `docs/NEXT_STEPS.md`

### Database
- Quick Migration: `docs/migrations/QUICK_MIGRATION.sql` ⭐
- Full Migration: `supabase/migrations/20251106_enhanced_features.sql`
- Fix Delete: `docs/migrations/FIX_DELETE_POLICY.sql`

### Troubleshooting
- Inventory Error Fix: `docs/URGENT_FIX_INVENTORY_ERROR.md`
- Visual Guide: `docs/FIX_INVENTORY_ERROR_VISUAL_GUIDE.md`

---

## 🎯 Current Status (Nov 6, 2025)

### ✅ Completed
- ✅ Receipt system with eTIMS tax
- ✅ Inventory management system
- ✅ Sales analytics dashboard
- ✅ Notification system
- ✅ Updated navigation
- ✅ Database migrations created

### ⏳ Pending
- [ ] Apply database migration (URGENT!)
- [ ] Test all new features
- [ ] Configure eTIMS API credentials

### 🔮 Future
- Advanced analytics with charts
- Email/SMS notifications
- Direct eTIMS API integration
- Supplier management
- Auto-reorder system

---

## 📞 Support

### Quick Help
1. Check `docs/QUICK_REFERENCE.md`
2. Review error in troubleshooting docs
3. Check Supabase logs
4. Verify database migration applied

### Common Issues
- **Inventory error**: Run `QUICK_MIGRATION.sql`
- **Delete error**: Run `FIX_DELETE_POLICY.sql`
- **Syntax error**: File encoding issue (already fixed)
- **No data**: Check database migration applied

---

**All documentation organized and ready!** 📚✨
