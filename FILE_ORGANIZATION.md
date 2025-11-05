# 📁 HarakaPoS - Project Organization Guide

This document explains the file and folder structure of the HarakaPoS project.

## 🗂️ Directory Structure

```
HarakaPoS/
├── 📱 app/                          # Next.js 15 App Router pages
│   ├── dashboard/                  # Admin dashboard pages
│   │   ├── orders/                # Orders management
│   │   ├── deliveries/            # Delivery tracking
│   │   ├── sales/                 # Sales recording
│   │   ├── customers/             # Customer management
│   │   ├── stock/                 # Inventory management
│   │   └── settings/              # System settings
│   ├── driver/                    # Driver mobile app
│   └── login/                     # Authentication
│
├── 🧩 components/                   # Reusable React components
│   └── ui/                        # UI components
│
├── 📚 docs/                         # All documentation
│   ├── README.md                  # Documentation index
│   ├── dispatch-system/           # Dispatch system docs
│   │   ├── README.md             # Dispatch docs index
│   │   ├── 01-system-overview.md # Architecture details
│   │   ├── 02-testing-guide.md   # Testing procedures
│   │   └── 03-deployment-guide.md # Deployment steps
│   └── legacy/                    # Old documentation (archived)
│
├── 🔧 lib/                          # Shared libraries
│   ├── types.ts                   # TypeScript type definitions
│   └── supabase/                  # Supabase client setup
│
├── 🗄️ supabase/                     # Database files
│   └── migrations/                # Database migrations
│       ├── README.md             # Migration guide
│       ├── dispatch-system.sql   # Dispatch system schema
│       ├── update-old-status.sql # Status migration
│       └── legacy/               # Old migrations (archived)
│
├── 🛠️ utils/                        # Utility functions
│   ├── formatCurrency.ts         # Currency formatting
│   ├── formatDate.ts             # Date formatting
│   └── settings.ts               # Settings management
│
├── ⚙️ Configuration Files
│   ├── .env.local                # Environment variables (not in git)
│   ├── .env.local.example        # Environment template
│   ├── next.config.ts            # Next.js configuration
│   ├── tailwind.config.ts        # Tailwind CSS config
│   ├── tsconfig.json             # TypeScript config
│   └── package.json              # Dependencies
│
└── 📄 README.md                     # Project README (this file)
```

## 📋 File Organization Principles

### 1. Documentation Files (`.md`)

**Location:** `docs/` folder

**Naming Convention:**
- Feature docs: `docs/feature-name/`
- Ordered docs: `XX-descriptive-name.md` (01, 02, 03...)
- Index files: `README.md`

**Current Structure:**
```
docs/
├── README.md                          # Main docs index
├── dispatch-system/
│   ├── README.md                     # Dispatch docs index
│   ├── 01-system-overview.md         # Read first
│   ├── 02-testing-guide.md           # Testing
│   └── 03-deployment-guide.md        # Deployment
└── legacy/                           # Archived old docs
```

### 2. Database Migration Files (`.sql`)

**Location:** `supabase/migrations/` folder

**Naming Convention:**
- Descriptive: `feature-name.sql`
- With timestamp: `YYYYMMDDHHMMSS_feature-name.sql`

**Current Structure:**
```
supabase/migrations/
├── README.md                         # Migration guide
├── dispatch-system.sql               # Main dispatch migration
├── update-old-status.sql             # Helper migration
└── legacy/                           # Archived old migrations
```

### 3. Code Files (`.ts`, `.tsx`)

**Location:** Organized by purpose

**Frontend Pages:**
```
app/
├── dashboard/              # Admin pages (authenticated)
│   ├── page.tsx           # Dashboard home
│   ├── orders/page.tsx    # Orders list & management
│   ├── sales/page.tsx     # Sales recording
│   └── ...
└── driver/                # Driver app (role: driver)
    └── page.tsx           # Driver delivery dashboard
```

**Shared Code:**
```
lib/
├── types.ts               # All TypeScript interfaces
└── supabase/
    └── client.ts          # Supabase client

utils/
├── formatCurrency.ts      # Formatting utilities
└── settings.ts            # Settings helpers

components/
└── ui/                    # Reusable components
```

## 🚀 Quick Navigation

### I want to...

**Deploy the dispatch system**
→ Start here: [`docs/dispatch-system/03-deployment-guide.md`](docs/dispatch-system/03-deployment-guide.md)

**Understand the architecture**
→ Read: [`docs/dispatch-system/01-system-overview.md`](docs/dispatch-system/01-system-overview.md)

**Test the system**
→ Follow: [`docs/dispatch-system/02-testing-guide.md`](docs/dispatch-system/02-testing-guide.md)

**Apply database migrations**
→ Check: [`supabase/migrations/README.md`](supabase/migrations/README.md)

**Understand TypeScript types**
→ See: [`lib/types.ts`](lib/types.ts)

**Modify driver app**
→ Edit: [`app/driver/page.tsx`](app/driver/page.tsx)

**Modify admin orders page**
→ Edit: [`app/dashboard/orders/page.tsx`](app/dashboard/orders/page.tsx)

**Add new migration**
→ Create: `supabase/migrations/your-feature.sql`
→ Follow: [`supabase/migrations/README.md`](supabase/migrations/README.md)

**Add new documentation**
→ Create: `docs/feature-name/`
→ Follow: [`docs/README.md`](docs/README.md)

## 📝 File Naming Standards

### Documentation Files

✅ **Good:**
- `01-system-overview.md` - Numbered for order
- `README.md` - Standard index name
- `dispatch-system/` - Descriptive folder

❌ **Bad:**
- `doc1.md` - Not descriptive
- `SYSTEM_OVERVIEW.md` - Inconsistent casing
- `overview-of-the-dispatch-system-and-how-it-works.md` - Too long

### Migration Files

✅ **Good:**
- `dispatch-system.sql` - Clear purpose
- `20251104120000_dispatch-system.sql` - With timestamp
- `update-old-status.sql` - Specific action

❌ **Bad:**
- `migration.sql` - Not descriptive
- `update.sql` - Too vague
- `dispatch.sql` - Missing context

### Code Files

✅ **Good:**
- `page.tsx` - Next.js convention
- `formatCurrency.ts` - Descriptive function
- `types.ts` - Clear purpose

❌ **Bad:**
- `component.tsx` - Not specific
- `util.ts` - Too vague
- `helper1.ts` - Not descriptive

## 🔄 Keeping Files Organized

### When Adding New Features

1. **Code Files** → Place in appropriate `app/` folder
2. **Documentation** → Create folder in `docs/feature-name/`
3. **Migrations** → Add to `supabase/migrations/`
4. **Types** → Add to `lib/types.ts`
5. **Utils** → Add to `utils/`

### When Deprecating Features

1. **Documentation** → Move to `docs/legacy/`
2. **Migrations** → Move to `supabase/migrations/legacy/`
3. **Code** → Delete or move to `archive/` branch

### Regular Maintenance

- ✅ Keep root folder clean (only config files)
- ✅ Document all new features in `docs/`
- ✅ Archive old migrations in `legacy/`
- ✅ Update README files when structure changes

## 📊 Project Statistics

### Current Structure
- **Total Pages:** 10+ (dashboard + driver)
- **Database Tables:** 10+ (orders, sales, customers, etc.)
- **Documentation Sections:** 1 (dispatch-system)
- **Active Migrations:** 2 (dispatch-system, update-old-status)
- **Legacy Files:** Archived in `legacy/` folders

### Code Organization
- **TypeScript:** All code files
- **Components:** Organized by feature
- **Types:** Centralized in `lib/types.ts`
- **Utils:** Shared helpers in `utils/`

## 🎯 Best Practices

### For Developers

1. **Before Coding:**
   - Read relevant documentation in `docs/`
   - Check `lib/types.ts` for existing types
   - Review similar pages in `app/`

2. **While Coding:**
   - Add new types to `lib/types.ts`
   - Use existing utilities in `utils/`
   - Follow Next.js 15 App Router conventions

3. **After Coding:**
   - Update documentation if feature changed
   - Create migration if schema changed
   - Test using `docs/dispatch-system/02-testing-guide.md`

### For Database Changes

1. **Create Migration:**
   - Use descriptive filename
   - Include header comment
   - Make it idempotent (IF NOT EXISTS)

2. **Document It:**
   - Update `supabase/migrations/README.md`
   - Add verification queries
   - Include rollback steps

3. **Test It:**
   - Test in development first
   - Run verification queries
   - Update testing guide if needed

### For Documentation

1. **Create Clear Structure:**
   - Use numbered files for reading order
   - Include README.md index
   - Add cross-references

2. **Make It Searchable:**
   - Use descriptive headings
   - Include keywords
   - Add table of contents

3. **Keep It Updated:**
   - Update when features change
   - Archive old docs to legacy/
   - Review quarterly

## 🔍 Finding Things

### Search Strategies

**Find a specific file:**
```bash
# PowerShell
Get-ChildItem -Recurse -Filter "*dispatch*"

# Or use VS Code search (Ctrl+P)
```

**Find in code:**
```bash
# VS Code (Ctrl+Shift+F)
# Search across all files
```

**Find documentation:**
```
docs/               # Start here
├── README.md      # Index of all docs
└── feature-name/  # Feature-specific docs
```

## 🆘 Common Tasks

### Adding a New Page

1. Create file: `app/dashboard/new-page/page.tsx`
2. Add types: `lib/types.ts`
3. Document: `docs/new-feature/README.md`
4. Test: Follow testing guide

### Adding a New Database Table

1. Create migration: `supabase/migrations/new-table.sql`
2. Add types: `lib/types.ts`
3. Update README: `supabase/migrations/README.md`
4. Document: `docs/feature/01-overview.md`

### Updating Documentation

1. Edit file: `docs/feature/XX-doc-name.md`
2. Update index: `docs/feature/README.md`
3. Update main index if needed: `docs/README.md`

---

**Last Updated:** November 4, 2025  
**Version:** 1.0.0  
**Maintained By:** Development Team

**Related Files:**
- [Main README](./README.md) - Project overview
- [Documentation Index](./docs/README.md) - All documentation
- [Migration Guide](./supabase/migrations/README.md) - Database changes


## Docs organization (updated 2025-11-05)
- docs/mpesa-setup/ : All M-Pesa & payment docs
- docs/pda-guides/  : PDA terminal & setup guides
- supabase/migrations/: Database migrations including payments-system.sql

