# 📚 Documentation & Migrations Structure# 📚 HarakaPOS Documentation# HarakaPoS Documentation



This document explains the organization of documentation and database migrations in the HarakaPOS project.



## 📂 Project StructureComplete documentation for Haraka Wedges Supplies Point of Sale SystemWelcome to the HarakaPoS documentation. This folder contains all technical documentation, guides, and system overviews.



```

HarakaPOS/

├── docs/                           # All documentation---## 📁 Documentation Structure

│   ├── location-tracking/          # Location & Maps features

│   ├── theme-responsive/           # UI/UX improvements

│   ├── expenses/                   # Expense tracking

│   ├── etims/                      # eTIMS integration (Kenya Tax)## 🚀 Quick Links```

│   ├── dispatch-system/            # Delivery dispatch

│   ├── mpesa-setup/                # M-Pesa payment setupdocs/

│   ├── pda-guides/                 # PDA device guides

│   ├── setup-guides/               # General setup### Setup Guides├── README.md (this file)

│   ├── legacy/                     # Old/archived docs

│   └── README.md                   # This file- **[eTIMS Setup Guide](./setup-guides/ETIMS_SETUP_GUIDE.md)** - Complete guide to Kenya Revenue Authority eTIMS integration└── dispatch-system/

│

├── supabase/- **[Quick Start eTIMS](./setup-guides/QUICK_START_ETIMS.md)** - Fast setup for eTIMS (15 minutes)    ├── README.md

│   └── migrations/                 # Database migrations

│       ├── features/               # Feature additions- **[Barcode Setup Guide](./setup-guides/BARCODE_SETUP_GUIDE.md)** - Barcode delivery tracking system setup    ├── 01-system-overview.md

│       ├── fixes/                  # Bug fixes & updates

│       ├── legacy/                 # Old migrations- **[Database Migrations](../supabase/migrations/README.md)** - SQL migration instructions    ├── 02-testing-guide.md

│       └── README.md               # Migration guide

│    └── 03-deployment-guide.md

└── README.md                       # Project overview

```### Implementation Guides```



---- **[eTIMS Implementation Complete](./ETIMS_IMPLEMENTATION_COMPLETE.md)** - Full eTIMS implementation details



## 📁 Documentation Folders- **[Complete Implementation Summary](./COMPLETE_IMPLEMENTATION_SUMMARY.md)** - Overall system implementation## 📚 Available Documentation



### 📍 `docs/location-tracking/`

**Customer delivery location capture & mapping**

---### [Dispatch System](./dispatch-system/)

| File | Description |

|------|-------------|Complete documentation for the order dispatch and delivery management system.

| `OPENSTREETMAP_IMPLEMENTATION.md` | ⭐ **START HERE** - Main implementation guide |

| `ADMIN_ORDER_LOCATION.md` | Admin user guide for adding locations |## 📋 Table of Contents

| `VISUAL_GUIDE_ADMIN_LOCATION.md` | Visual walkthrough with examples |

| `STEP_1_COMPLETE.md` | Quick start & success summary |- **System Overview** - Architecture, database schema, and features

| `STEP_1_IMPLEMENTATION.md` | Technical implementation details |

| `README_STEP_1.md` | Comprehensive setup guide |1. [System Overview](#system-overview)- **Testing Guide** - Comprehensive testing scenarios and verification

| `GOOGLE_MAPS_INTEGRATION.md` | Original Google Maps plan (not used) |

2. [Features](#features)- **Deployment Guide** - Quick start and deployment checklist

**What's Implemented:**

- ✅ OpenStreetMap integration (FREE, works in Kenya)3. [Technology Stack](#technology-stack)

- ✅ Address autocomplete for Kenya

- ✅ Interactive map with drag-and-drop4. [Getting Started](#getting-started)## 🚀 Quick Links

- ✅ Current location button (GPS)

- ✅ Save address + coordinates to database5. [User Roles](#user-roles)

- ✅ Driver navigation via Google Maps URLs

6. [Modules](#modules)### For Developers

**Related Migration:** `supabase/migrations/features/location-tracking.sql`

7. [Support](#support)- [Dispatch System Overview](./dispatch-system/01-system-overview.md)

---

- [Database Migrations](../supabase/migrations/)

### 🎨 `docs/theme-responsive/`

**Dark mode, responsive design, and UI components**---- [Type Definitions](../lib/types.ts)



| File | Description |

|------|-------------|

| `THEME_RESPONSIVE_IMPLEMENTATION.md` | Theme system implementation |## 🏢 System Overview### For Testing

| `RESPONSIVE_QUICK_REF.md` | Quick reference for responsive patterns |

| `COLLAPSIBLE_SIDEBAR.md` | Sidebar implementation guide |- [Testing Guide](./dispatch-system/02-testing-guide.md)



**What's Implemented:****HarakaPOS** is a comprehensive Point of Sale system built specifically for **Haraka Wedges Supplies** - a wholesale potato wedge distributor in Kenya.- [Deployment Checklist](./dispatch-system/03-deployment-guide.md)

- ✅ Dark/Light/System theme modes

- ✅ Responsive design (mobile, tablet, desktop)

- ✅ Collapsible sidebar with animations

- ✅ Touch/click/keyboard event handling### Key Capabilities:### For Deployment



---- 💰 **Sales Management** - Complete order processing and invoicing- [Deployment Guide](./dispatch-system/03-deployment-guide.md)



### 💰 `docs/expenses/`- 📦 **Inventory Control** - Real-time stock tracking- [Migration Files](../supabase/migrations/)

**Business expense tracking**

- 🚚 **Delivery Tracking** - GPS-enabled barcode delivery system

| File | Description |

|------|-------------|- 🧾 **eTIMS Integration** - Automated KRA tax compliance## 📋 Document Naming Convention

| `EXPENSE_IMPLEMENTATION_SUMMARY.md` | Implementation overview |

| `EXPENSE_TRACKING_SETUP.md` | Setup and usage guide |- 👥 **Multi-Role Access** - Admin, Cashier, Driver interfaces



**What's Implemented:**- 📊 **Analytics** - Sales reports and profit analysisAll documentation follows this naming pattern for easy ordering:

- ✅ Expense categories

- ✅ Receipt uploads- 💳 **Payment Processing** - M-Pesa and cash tracking```

- ✅ Expense reports

- ✅ Budget trackingXX-descriptive-name.md



**Related Migration:** `supabase/migrations/features/business-expenses.sql`---```



---Where `XX` is a two-digit number (01, 02, 03, etc.) indicating the reading order.



### 🧾 `docs/etims/`## ✨ Features

**Kenya Revenue Authority eTIMS integration**

## 🔄 Keeping Documentation Updated

| File | Description |

|------|-------------|### For Admins

| `ETIMS_IMPLEMENTATION_COMPLETE.md` | eTIMS setup and usage |

- ✅ Dashboard with real-time analyticsWhen adding new features:

**What's Implemented:**

- ✅ Tax invoice generation- ✅ Customer management (KRA PIN integration)1. Create a new folder under `docs/` for the feature

- ✅ KRA eTIMS API integration

- ✅ Electronic tax reporting- ✅ Product & pricing control2. Add a `README.md` index in that folder



**Related Migration:** `supabase/migrations/features/etims-integration.sql`- ✅ Staff & driver management3. Use numbered prefixes for ordered documentation



---- ✅ Barcode generation & tracking4. Update this main README with links



### 🚚 `docs/dispatch-system/`- ✅ eTIMS configuration

**Driver assignment and delivery management**

- ✅ Comprehensive reporting## 📝 Documentation Standards

Contains guides for the dispatch and delivery tracking system.

- ✅ System settings

**Related Migration:** `supabase/migrations/features/dispatch-system.sql`

### Markdown Files Should Include:

---

### For Cashiers- ✅ Clear headings hierarchy (H1 → H2 → H3)

### 📱 `docs/mpesa-setup/`

**M-Pesa payment integration guides**- ✅ Fast POS interface- ✅ Code examples with syntax highlighting



Contains setup guides for M-Pesa payments (STK Push, callbacks, etc.)- ✅ Order creation & invoicing- ✅ Step-by-step instructions where applicable



**Related Migration:** `supabase/migrations/features/payments-system.sql`- ✅ Customer search & registration- ✅ Visual separators (horizontal rules, emojis)



---- ✅ Payment processing- ✅ Table of contents for long documents



### 📟 `docs/pda-guides/`- ✅ Receipt printing

**PDA/Barcode device setup**

- ✅ Automatic eTIMS submission### SQL Files Should Include:

| File | Description |

|------|-------------|- ✅ Header comment with purpose and date

| `PDA_QUICK_START.md` | Quick setup guide |

| `PDA_TRACKING_FAQ.md` | Troubleshooting & FAQs |### For Drivers- ✅ Section comments for major blocks



**Related Migration:** `supabase/migrations/features/barcode-delivery-tracking.sql`- ✅ Mobile-optimized interface- ✅ `IF NOT EXISTS` for idempotent operations



---- ✅ Delivery list with GPS navigation- ✅ `DROP ... IF EXISTS` before recreating objects



### ⚙️ `docs/setup-guides/`- ✅ Barcode scanning (camera-based)- ✅ Inline comments for complex logic

**General setup and configuration**

- ✅ Photo proof of delivery

Contains general setup guides for the system.

- ✅ One-tap status updates## 🏗️ Project Structure Reference

---

- ✅ Customer contact integration

### 📦 `docs/legacy/`

**Archived and old documentation**- ✅ Offline-capable```



Historical documentation kept for reference.HarakaPoS/



------├── app/                      # Next.js app directory



## 🗄️ Database Migrations│   ├── dashboard/           # Admin pages



### 📂 `supabase/migrations/features/`## 🛠️ Technology Stack│   └── driver/              # Driver pages

**Feature additions and new functionality**

├── lib/                     # Shared utilities

| File | Description | Status |

|------|-------------|--------|### Frontend│   ├── types.ts            # TypeScript types

| `location-tracking.sql` | Order location fields (address, lat, lng) | ✅ Ready |

| `barcode-delivery-tracking.sql` | PDA barcode scanning | ✅ Ready |- **Next.js 16.0.1** - React framework with App Router│   └── supabase/           # Supabase client

| `business-expenses.sql` | Expense tracking tables | ✅ Ready |

| `dispatch-system.sql` | Driver dispatch & order logs | ✅ Ready |- **TypeScript** - Type-safe development├── supabase/

| `etims-integration.sql` | KRA eTIMS tax tables | ✅ Ready |

| `payments-system.sql` | M-Pesa payment tables | ✅ Ready |- **Tailwind CSS** - Utility-first styling│   └── migrations/         # Database migrations



### 📂 `supabase/migrations/fixes/`- **Lucide Icons** - Modern icon library├── docs/                    # This documentation folder

**Bug fixes and schema updates**

- **Recharts** - Data visualization│   └── dispatch-system/    # Dispatch system docs

| File | Description | Status |

|------|-------------|--------|├── utils/                   # Helper functions

| `fix-status-constraint.sql` | Fix order status constraints | ✅ Applied |

| `update-old-status.sql` | Update legacy status values | ✅ Applied |### Backend└── README.md               # Project README



### 📂 `supabase/migrations/legacy/`- **Supabase** - PostgreSQL database with real-time capabilities```

**Old/deprecated migrations**

- **Row Level Security (RLS)** - Database-level authorization

Kept for historical reference.

- **Edge Functions** - Serverless API endpoints## 🤝 Contributing to Documentation

---



## 🚀 Quick Start Guide

### IntegrationsWhen adding documentation:

### For New Features

- **eTIMS (KRA)** - Kenya Revenue Authority tax integration1. Place it in the appropriate feature folder

1. **Check if migration is needed**

   - Look in `supabase/migrations/features/`- **JsBarcode** - Barcode generation (CODE128)2. Use clear, descriptive filenames

   - Read the migration file header for description

- **HTML5-qrcode** - Camera-based barcode scanning3. Include code examples

2. **Read the documentation**

   - Go to the relevant `docs/` folder- **Geolocation API** - GPS tracking for deliveries4. Add cross-references to related docs

   - Start with README or main implementation doc

5. Update the feature's README.md index

3. **Apply migration** (if needed)

   - Copy SQL from `supabase/migrations/features/`### DevOps

   - Run in Supabase SQL Editor

- **Turbopack** - Fast build system---

4. **Follow setup guide**

   - Complete any configuration steps- **ESLint** - Code quality

   - Test the feature

- **Git** - Version control**Last Updated:** November 4, 2025  

### For Developers

**Version:** 1.0.0

**Adding New Documentation:**

1. Determine the category (location, theme, expense, etc.)---

2. Create markdown file in appropriate `docs/` folder

3. Update this README if creating new category## 🚀 Getting Started

4. Link related migration if applicable

### Prerequisites

**Adding New Migration:**- Node.js 18+ installed

1. Create SQL file in `supabase/migrations/features/`- Supabase account

2. Use descriptive name: `feature-name.sql`- eTIMS credentials (KRA Kenya)

3. Add header comment explaining purpose- Git

4. Document in related `docs/` folder

5. Test thoroughly before committing### Installation Steps



---1. **Clone Repository**

   ```bash

## 📋 Current Implementation Status   git clone <repository-url>

   cd HarakaPoS

### ✅ Fully Implemented   ```

- Location tracking with OpenStreetMap

- Dark/Light/System themes2. **Install Dependencies**

- Responsive design   ```bash

- Collapsible sidebar   npm install

- Expense tracking   ```

- eTIMS integration

- Dispatch system3. **Configure Environment**

- M-Pesa payments   ```bash

- PDA barcode scanning   cp .env.example .env.local

   ```

### 🚧 Planned Enhancements   

- Delivery route optimization (Step 3)   Fill in:

- Real-time driver tracking (Step 4)   - `NEXT_PUBLIC_SUPABASE_URL`

- Delivery radius management (Step 5)   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- API usage monitoring (Step 6)   - eTIMS credentials (if applicable)



---4. **Run Database Migrations**

   - See [Database Migrations Guide](../supabase/migrations/README.md)

## 🔍 Finding Documentation   - Run in order specified



### By Feature5. **Start Development Server**

- **Location tracking** → `docs/location-tracking/`   ```bash

- **UI/UX/Themes** → `docs/theme-responsive/`   npm run dev

- **Payments** → `docs/mpesa-setup/`   ```

- **Tax reporting** → `docs/etims/`

- **Expenses** → `docs/expenses/`6. **Access Application**

- **Deliveries** → `docs/dispatch-system/`   - Open http://localhost:3000

- **Barcode/PDA** → `docs/pda-guides/`   - Default admin: (check Supabase Auth)



### By Task### First-Time Setup

- **Setup new feature** → Check `docs/[feature]/` and `supabase/migrations/features/`

- **Fix an issue** → Check `docs/legacy/` and `supabase/migrations/fixes/`1. **Configure eTIMS** (if needed)

- **General help** → Check `docs/setup-guides/`   - Go to Settings → eTIMS Configuration

- **Old reference** → Check `docs/legacy/`   - Enter your credentials

   - Test connection

---   - See [eTIMS Setup Guide](./setup-guides/ETIMS_SETUP_GUIDE.md)



## 📝 Documentation Standards2. **Add Products**

   - Go to Products

### Markdown Files Should Include:   - Add your product catalog

- ✅ Clear title and purpose   - Set prices

- ✅ Table of contents (for long docs)

- ✅ Prerequisites/requirements3. **Add Customers**

- ✅ Step-by-step instructions   - Go to Customers

- ✅ Screenshots or examples   - Import or manually add

- ✅ Troubleshooting section   - Include KRA PINs for tax invoices

- ✅ Related files/migrations

- ✅ Date and status4. **Create Users**

   - Go to Users (Admin only)

### Migration Files Should Include:   - Add cashiers and drivers

- ✅ Header comment with description   - Assign roles

- ✅ Date and author

- ✅ Clear table/column names---

- ✅ Indexes for performance

- ✅ Comments on columns## 👥 User Roles

- ✅ Rollback instructions (if complex)

### 1. Administrator

---**Access:** Full system access



## 🆘 Getting Help**Responsibilities:**

- System configuration

1. **Check the relevant docs folder** for your feature- User management

2. **Look for README.md** in that folder- Report generation

3. **Search for keywords** in file names- eTIMS setup

4. **Check migration comments** for database changes- Barcode system management

5. **Review legacy docs** if feature is old

**Pages:**

---- `/dashboard` - Admin dashboard

- `/dashboard/customers` - Customer management

## 📊 Summary- `/dashboard/products` - Product catalog

- `/dashboard/users` - User management

- **Total documentation files:** 30+- `/dashboard/barcodes` - Barcode generation

- **Organized into:** 8 categories- `/dashboard/profit-analysis` - Financial reports

- **Database migrations:** 10+ feature migrations- `/dashboard/settings` - System settings

- **All features:** Production-ready ✅

---

---

### 2. Cashier

**Last Updated:** November 5, 2025  **Access:** Limited to POS and customer management

**Maintained By:** Development Team  

**Status:** ✅ Active & Up-to-date**Responsibilities:**

- Process sales
- Create orders
- Issue invoices
- Register customers
- Accept payments

**Pages:**
- `/pos` - Point of Sale interface
- `/pos/customers` - Customer lookup
- `/pos/orders` - Order history

---

### 3. Driver
**Access:** Mobile delivery interface only

**Responsibilities:**
- Scan delivery barcodes
- Update delivery status
- Capture GPS locations
- Take delivery photos
- Contact customers

**Pages:**
- `/driver` - Driver dashboard
- `/driver/scan` - Barcode scanner
- `/driver/deliveries` - Delivery list
- `/driver/deliveries/[id]` - Delivery details
- `/driver/profile` - Driver profile

---

## 📦 Modules

### 1. Sales & Orders
- Order creation
- Invoice generation
- Payment processing
- Receipt printing
- eTIMS automatic submission

**Files:**
- `app/pos/` - POS interface
- `app/dashboard/orders/` - Order management

---

### 2. Inventory Management
- Product catalog
- Stock tracking
- Price management
- Low stock alerts

**Files:**
- `app/dashboard/products/` - Product management
- `lib/types.ts` - Product interfaces

---

### 3. Customer Management
- Customer database
- KRA PIN validation
- Purchase history
- Credit tracking

**Files:**
- `app/dashboard/customers/` - Customer management
- `components/customers/` - Customer components

---

### 4. eTIMS Integration
- Automatic invoice submission
- Tax calculation
- Receipt codes
- Credit note handling
- Configuration management

**Files:**
- `app/dashboard/etims/` - eTIMS pages
- `lib/etims/` - eTIMS utilities
- `supabase/migrations/etims-*.sql` - eTIMS schema

**Docs:**
- [eTIMS Setup Guide](./setup-guides/ETIMS_SETUP_GUIDE.md)
- [Quick Start eTIMS](./setup-guides/QUICK_START_ETIMS.md)

---

### 5. Barcode Delivery Tracking
- Barcode generation (CODE128)
- Camera-based scanning
- GPS location tracking
- Photo proof of delivery
- Status management
- Route tracking

**Files:**
- `app/dashboard/barcodes/` - Admin barcode management
- `app/driver/scan/` - Driver scanner
- `components/barcode/` - Barcode components
- `lib/barcode-utils.ts` - Barcode utilities
- `supabase/migrations/barcode-delivery-tracking.sql` - Barcode schema

**Docs:**
- [Barcode Setup Guide](./setup-guides/BARCODE_SETUP_GUIDE.md)

---

### 6. Reporting & Analytics
- Sales reports
- Profit analysis
- Inventory reports
- Delivery statistics
- Tax reports (eTIMS)

**Files:**
- `app/dashboard/reports/` - Report generation
- `app/dashboard/profit-analysis/` - Financial analytics

---

### 7. User Management
- User creation
- Role assignment
- Access control
- Activity logging

**Files:**
- `app/dashboard/users/` - User management
- `lib/types.ts` - User interfaces

---

## 📁 Project Structure

```
HarakaPoS/
├── app/                          # Next.js app directory
│   ├── dashboard/                # Admin interface
│   │   ├── barcodes/            # Barcode management
│   │   ├── customers/           # Customer management
│   │   ├── etims/               # eTIMS configuration
│   │   ├── orders/              # Order management
│   │   ├── products/            # Product catalog
│   │   ├── profit-analysis/     # Financial reports
│   │   ├── settings/            # System settings
│   │   └── users/               # User management
│   ├── driver/                   # Driver mobile interface
│   │   ├── deliveries/          # Delivery list
│   │   ├── scan/                # Barcode scanner
│   │   └── profile/             # Driver profile
│   ├── pos/                      # Point of Sale interface
│   └── auth/                     # Authentication pages
├── components/                   # React components
│   ├── barcode/                 # Barcode components
│   ├── customers/               # Customer components
│   ├── layout/                  # Layout components
│   └── ui/                      # UI components
├── lib/                          # Utility libraries
│   ├── barcode-utils.ts         # Barcode functions
│   ├── etims/                   # eTIMS utilities
│   ├── supabase/                # Supabase client
│   └── types.ts                 # TypeScript types
├── supabase/                     # Supabase configuration
│   └── migrations/              # Database migrations
├── docs/                         # Documentation (you are here!)
│   └── setup-guides/            # Setup guides
├── public/                       # Static assets
└── utils/                        # Helper functions
```

---

## 🔐 Security

### Authentication
- Supabase Auth (email/password)
- Session management
- Role-based access control (RBAC)

### Database Security
- Row Level Security (RLS) on all tables
- User-based data access
- Encrypted connections

### Data Protection
- HTTPS only (production)
- Environment variables for secrets
- Secure API endpoints

---

## 🧪 Testing

### Manual Testing Checklist

**Sales Flow:**
- [ ] Create order
- [ ] Add products
- [ ] Calculate totals
- [ ] Process payment
- [ ] Generate invoice
- [ ] Submit to eTIMS
- [ ] Print receipt

**Delivery Flow:**
- [ ] Generate barcode
- [ ] Print label
- [ ] Scan barcode (loading)
- [ ] Update status (in transit)
- [ ] Capture GPS
- [ ] Take delivery photo
- [ ] Mark delivered
- [ ] Verify in admin

**eTIMS Flow:**
- [ ] Configure credentials
- [ ] Test connection
- [ ] Create tax invoice
- [ ] Submit to eTIMS
- [ ] Receive control code
- [ ] Verify on KRA portal

---

## 🐛 Troubleshooting

### Common Issues

**eTIMS Connection Failed**
- Check credentials in Settings → eTIMS
- Verify internet connection
- Check KRA portal status
- See [eTIMS Setup Guide](./setup-guides/ETIMS_SETUP_GUIDE.md)

**Barcode Scanner Not Working**
- Grant camera permissions
- Use HTTPS (required for camera)
- Try different browser (Chrome recommended)
- See [Barcode Setup Guide](./setup-guides/BARCODE_SETUP_GUIDE.md)

**Database Errors**
- Check Supabase connection
- Verify RLS policies
- Review migration status
- See [Migrations README](../supabase/migrations/README.md)

---

## 📞 Support

### Documentation
- This README
- Setup guides in `docs/setup-guides/`
- Code comments
- Migration notes in `supabase/migrations/`

### Getting Help
1. Check relevant setup guide
2. Review error logs (browser console)
3. Check Supabase logs
4. Review migration notes

---

## 🗺️ Roadmap

### Completed ✅
- ✅ Core POS functionality
- ✅ eTIMS integration
- ✅ Barcode delivery tracking
- ✅ GPS location tracking
- ✅ Mobile driver interface
- ✅ Photo proof of delivery
- ✅ Profit analysis

### In Progress 🔄
- 🔄 Advanced reporting
- 🔄 Driver performance analytics
- 🔄 Customer portal

### Planned ⏳
- ⏳ Route optimization
- ⏳ Push notifications
- ⏳ Digital signatures
- ⏳ Customer ratings
- ⏳ Live map tracking
- ⏳ Email notifications
- ⏳ SMS notifications
- ⏳ Multi-language support

---

## 📜 License

Proprietary - Haraka Wedges Supplies

---

## 📝 Change Log

### v2.0.0 - Barcode System (Nov 2025)
- Added barcode generation and scanning
- GPS tracking for deliveries
- Photo proof of delivery
- Mobile driver interface
- Route tracking

### v1.5.0 - eTIMS Integration (Oct 2025)
- Full eTIMS KRA integration
- Automatic tax invoice submission
- Receipt code generation
- Credit note support

### v1.0.0 - Initial Release (Sep 2025)
- Core POS functionality
- Customer management
- Product catalog
- Order processing
- Basic reporting

---

**Last Updated:** November 5, 2025

**System Version:** 2.0.0

**For latest updates, check this README and setup guides!** 📚✨
