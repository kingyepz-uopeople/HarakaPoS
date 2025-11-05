# 📚 HarakaPOS Documentation# HarakaPoS Documentation



Complete documentation for Haraka Wedges Supplies Point of Sale SystemWelcome to the HarakaPoS documentation. This folder contains all technical documentation, guides, and system overviews.



---## 📁 Documentation Structure



## 🚀 Quick Links```

docs/

### Setup Guides├── README.md (this file)

- **[eTIMS Setup Guide](./setup-guides/ETIMS_SETUP_GUIDE.md)** - Complete guide to Kenya Revenue Authority eTIMS integration└── dispatch-system/

- **[Quick Start eTIMS](./setup-guides/QUICK_START_ETIMS.md)** - Fast setup for eTIMS (15 minutes)    ├── README.md

- **[Barcode Setup Guide](./setup-guides/BARCODE_SETUP_GUIDE.md)** - Barcode delivery tracking system setup    ├── 01-system-overview.md

- **[Database Migrations](../supabase/migrations/README.md)** - SQL migration instructions    ├── 02-testing-guide.md

    └── 03-deployment-guide.md

### Implementation Guides```

- **[eTIMS Implementation Complete](./ETIMS_IMPLEMENTATION_COMPLETE.md)** - Full eTIMS implementation details

- **[Complete Implementation Summary](./COMPLETE_IMPLEMENTATION_SUMMARY.md)** - Overall system implementation## 📚 Available Documentation



---### [Dispatch System](./dispatch-system/)

Complete documentation for the order dispatch and delivery management system.

## 📋 Table of Contents

- **System Overview** - Architecture, database schema, and features

1. [System Overview](#system-overview)- **Testing Guide** - Comprehensive testing scenarios and verification

2. [Features](#features)- **Deployment Guide** - Quick start and deployment checklist

3. [Technology Stack](#technology-stack)

4. [Getting Started](#getting-started)## 🚀 Quick Links

5. [User Roles](#user-roles)

6. [Modules](#modules)### For Developers

7. [Support](#support)- [Dispatch System Overview](./dispatch-system/01-system-overview.md)

- [Database Migrations](../supabase/migrations/)

---- [Type Definitions](../lib/types.ts)



## 🏢 System Overview### For Testing

- [Testing Guide](./dispatch-system/02-testing-guide.md)

**HarakaPOS** is a comprehensive Point of Sale system built specifically for **Haraka Wedges Supplies** - a wholesale potato wedge distributor in Kenya.- [Deployment Checklist](./dispatch-system/03-deployment-guide.md)



### Key Capabilities:### For Deployment

- 💰 **Sales Management** - Complete order processing and invoicing- [Deployment Guide](./dispatch-system/03-deployment-guide.md)

- 📦 **Inventory Control** - Real-time stock tracking- [Migration Files](../supabase/migrations/)

- 🚚 **Delivery Tracking** - GPS-enabled barcode delivery system

- 🧾 **eTIMS Integration** - Automated KRA tax compliance## 📋 Document Naming Convention

- 👥 **Multi-Role Access** - Admin, Cashier, Driver interfaces

- 📊 **Analytics** - Sales reports and profit analysisAll documentation follows this naming pattern for easy ordering:

- 💳 **Payment Processing** - M-Pesa and cash tracking```

XX-descriptive-name.md

---```

Where `XX` is a two-digit number (01, 02, 03, etc.) indicating the reading order.

## ✨ Features

## 🔄 Keeping Documentation Updated

### For Admins

- ✅ Dashboard with real-time analyticsWhen adding new features:

- ✅ Customer management (KRA PIN integration)1. Create a new folder under `docs/` for the feature

- ✅ Product & pricing control2. Add a `README.md` index in that folder

- ✅ Staff & driver management3. Use numbered prefixes for ordered documentation

- ✅ Barcode generation & tracking4. Update this main README with links

- ✅ eTIMS configuration

- ✅ Comprehensive reporting## 📝 Documentation Standards

- ✅ System settings

### Markdown Files Should Include:

### For Cashiers- ✅ Clear headings hierarchy (H1 → H2 → H3)

- ✅ Fast POS interface- ✅ Code examples with syntax highlighting

- ✅ Order creation & invoicing- ✅ Step-by-step instructions where applicable

- ✅ Customer search & registration- ✅ Visual separators (horizontal rules, emojis)

- ✅ Payment processing- ✅ Table of contents for long documents

- ✅ Receipt printing

- ✅ Automatic eTIMS submission### SQL Files Should Include:

- ✅ Header comment with purpose and date

### For Drivers- ✅ Section comments for major blocks

- ✅ Mobile-optimized interface- ✅ `IF NOT EXISTS` for idempotent operations

- ✅ Delivery list with GPS navigation- ✅ `DROP ... IF EXISTS` before recreating objects

- ✅ Barcode scanning (camera-based)- ✅ Inline comments for complex logic

- ✅ Photo proof of delivery

- ✅ One-tap status updates## 🏗️ Project Structure Reference

- ✅ Customer contact integration

- ✅ Offline-capable```

HarakaPoS/

---├── app/                      # Next.js app directory

│   ├── dashboard/           # Admin pages

## 🛠️ Technology Stack│   └── driver/              # Driver pages

├── lib/                     # Shared utilities

### Frontend│   ├── types.ts            # TypeScript types

- **Next.js 16.0.1** - React framework with App Router│   └── supabase/           # Supabase client

- **TypeScript** - Type-safe development├── supabase/

- **Tailwind CSS** - Utility-first styling│   └── migrations/         # Database migrations

- **Lucide Icons** - Modern icon library├── docs/                    # This documentation folder

- **Recharts** - Data visualization│   └── dispatch-system/    # Dispatch system docs

├── utils/                   # Helper functions

### Backend└── README.md               # Project README

- **Supabase** - PostgreSQL database with real-time capabilities```

- **Row Level Security (RLS)** - Database-level authorization

- **Edge Functions** - Serverless API endpoints## 🤝 Contributing to Documentation



### IntegrationsWhen adding documentation:

- **eTIMS (KRA)** - Kenya Revenue Authority tax integration1. Place it in the appropriate feature folder

- **JsBarcode** - Barcode generation (CODE128)2. Use clear, descriptive filenames

- **HTML5-qrcode** - Camera-based barcode scanning3. Include code examples

- **Geolocation API** - GPS tracking for deliveries4. Add cross-references to related docs

5. Update the feature's README.md index

### DevOps

- **Turbopack** - Fast build system---

- **ESLint** - Code quality

- **Git** - Version control**Last Updated:** November 4, 2025  

**Version:** 1.0.0

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase account
- eTIMS credentials (KRA Kenya)
- Git

### Installation Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd HarakaPoS
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - eTIMS credentials (if applicable)

4. **Run Database Migrations**
   - See [Database Migrations Guide](../supabase/migrations/README.md)
   - Run in order specified

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Open http://localhost:3000
   - Default admin: (check Supabase Auth)

### First-Time Setup

1. **Configure eTIMS** (if needed)
   - Go to Settings → eTIMS Configuration
   - Enter your credentials
   - Test connection
   - See [eTIMS Setup Guide](./setup-guides/ETIMS_SETUP_GUIDE.md)

2. **Add Products**
   - Go to Products
   - Add your product catalog
   - Set prices

3. **Add Customers**
   - Go to Customers
   - Import or manually add
   - Include KRA PINs for tax invoices

4. **Create Users**
   - Go to Users (Admin only)
   - Add cashiers and drivers
   - Assign roles

---

## 👥 User Roles

### 1. Administrator
**Access:** Full system access

**Responsibilities:**
- System configuration
- User management
- Report generation
- eTIMS setup
- Barcode system management

**Pages:**
- `/dashboard` - Admin dashboard
- `/dashboard/customers` - Customer management
- `/dashboard/products` - Product catalog
- `/dashboard/users` - User management
- `/dashboard/barcodes` - Barcode generation
- `/dashboard/profit-analysis` - Financial reports
- `/dashboard/settings` - System settings

---

### 2. Cashier
**Access:** Limited to POS and customer management

**Responsibilities:**
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
