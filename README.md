#  HarakaPOS - Potato Delivery Management System#  HarakaPOS - Point of Sale & Delivery Management System



> **Professional Point-of-Sale & Delivery Management System for Haraka Wedges Supplies**  A modern, production-ready POS and delivery management system built for **Haraka Wedges Supplies**, a potato distribution business in Kenya.

> Streamline your potato processing, delivery operations, and payment collection with real-time tracking and M-Pesa integration.

## 🚀 Features

[![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black)](https://nextjs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)### For Admin Users

[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)- 📊 **Dashboard** - Real-time metrics and overview

[![M-Pesa](https://img.shields.io/badge/M--Pesa-Integrated-success)](https://developer.safaricom.co.ke/)- 💰 **Sales Management** - Record sales with Cash/M-Pesa payment methods

- 📦 **Stock Tracking** - Manage incoming potato inventory

---- 🚚 **Delivery Management** - Assign and track deliveries

- 📈 **Reports** - Daily, weekly, and monthly sales analytics

## 📖 Table of Contents

### For Driver Users

- [Overview](#overview)- 📱 **Mobile-First Interface** - Easy-to-use delivery dashboard

- [Key Features](#key-features)- 📍 **Delivery List** - View assigned deliveries with customer details

- [Technology Stack](#technology-stack)- ✅ **Status Updates** - Update delivery status (Pending → On the Way → Delivered)

- [System Architecture](#system-architecture)

- [Quick Start](#quick-start)## 🛠️ Tech Stack

- [Deployment](#deployment)

- [Payment Integration](#payment-integration)- **Framework**: Next.js 15 (App Router)

- [PDA Terminal Support](#pda-terminal-support)- **Styling**: Tailwind CSS + Shadcn/UI components

- [Documentation](#documentation)- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)

- [License](#license)- **Language**: TypeScript

- [Contact](#contact)- **Deployment**: Vercel (Frontend) + Supabase Cloud (Backend)



---## 📋 Prerequisites



## 🎯 Overview- Node.js 18+ and npm

- A Supabase account ([Sign up free](https://supabase.com))

**HarakaPOS** is a comprehensive business management system specifically designed for **Haraka Wedges Supplies**, a potato processing and delivery business serving hotels and vibandas (food vendors) across Kenya.- A Vercel account for deployment ([Sign up free](https://vercel.com))



### What It Does:## 🔧 Setup Instructions



- **Order Management**: Create, track, and manage delivery orders from processing to completion### 1. Clone the Repository

- **Real-Time Dispatch**: Assign orders to drivers with live status tracking

- **Payment Collection**: Dual M-Pesa integration (Till & Paybill) with STK Push and PDA support```bash

- **Driver App**: Mobile-optimized PWA for drivers with offline capabilitiesgit clone <your-repo-url>

- **Admin Dashboard**: Real-time overview of operations, revenue, and delivery statuscd HarakaPoS

- **Receipt Generation**: Automatic thermal printer-ready receipts with QR codes```

- **Customer Management**: Track customers, payment history, and delivery preferences

### 2. Install Dependencies

### Built For:

```bash

- 📍 **Walk-in Sales** at processing locationnpm install

- 🚚 **Delivery Operations** to hotels and restaurants```

- 💰 **Payment Collection** via M-Pesa (remote & on-site)

- 📱 **PDA Terminal** integration for drivers### 3. Set Up Supabase

- 📊 **Business Analytics** and reporting

#### a. Create a Supabase Project

---1. Go to [supabase.com](https://supabase.com)

2. Click "New Project"

## ✨ Key Features3. Fill in project details and wait for setup to complete



### 🏪 Admin Dashboard#### b. Run Database Schema

- Real-time order tracking and status updates1. In your Supabase dashboard, go to **SQL Editor**

- Revenue analytics with profit/cost breakdown2. Open the `supabase-schema.sql` file from this project

- Driver performance monitoring3. Copy and paste the entire SQL content

- Customer management and history4. Click **Run** to create all tables, policies, and indexes

- Inventory tracking (potatoes in stock)

- Payment reconciliation tools#### c. Create Admin and Driver Users

1. In Supabase dashboard, go to **Authentication** > **Users**

### 🚗 Driver Application2. Click **Add User** and create:

- Mobile-optimized Progressive Web App (PWA)   - **Admin User**: `admin@harakapos.co.ke` (set a password)

- Offline-first design with automatic sync   - **Driver User**: `driver@harakapos.co.ke` (set a password)

- GPS navigation integration3. Copy the User IDs for each user

- **Dual Payment Methods:**

  - **M-Pesa STK Push**: Send payment request to customer's phone#### d. Link Auth Users to Custom Users Table

  - **PDA Terminal Flow**: Collect payment on driver's PDA device1. Go back to **SQL Editor**

- Receipt printing (thermal printer support)2. Run this query (replace the UUIDs with actual user IDs from step c):

- Delivery photo capture and notes

- Real-time order updates```sql

INSERT INTO users (id, name, email, role) VALUES

### 💳 Payment System('paste-admin-user-id-here', 'Admin User', 'admin@harakapos.co.ke', 'admin'),

- **M-Pesa Daraja API Integration**('paste-driver-user-id-here', 'John Driver', 'driver@harakapos.co.ke', 'driver');

  - STK Push for remote payments```

  - Till Number support (walk-in sales)

  - Paybill Number support (deliveries with order tracking)### 4. Configure Environment Variables

  - Automatic payment callbacks

  - Transaction reconciliation1. Copy the example environment file:

- **PDA Terminal Support**

  - Manual M-Pesa code entry```bash

  - Cash payment with change calculationcp .env.local.example .env.local

  - 58mm thermal receipt printing```

  - Offline payment recording with sync

2. Get your Supabase credentials:

### 📱 Progressive Web App   - Go to **Project Settings** > **API**

- Install on Android PDA devices   - Copy the **Project URL** and **anon/public** key

- Works offline with background sync

- Push notifications for new orders3. Update `.env.local`:

- Native app-like experience

```env

### 🧾 Receipt SystemNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

- Auto-generated unique receipt numbers (RCP-YYYYMMDD-XXXXX)NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

- Thermal printer-ready formatting (58mm/80mm)```

- QR code for verification

- Professional branding### 5. Run Development Server

- Multiple print options (browser, PDF, thermal)

```bash

---npm run dev

```

## 🛠️ Technology Stack

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Frontend

- **Framework**: Next.js 16.0.1 with Turbopack### 6. Login and Test

- **Language**: TypeScript 5.x

- **Styling**: Tailwind CSS**Admin Login:**

- **UI Components**: Shadcn/UI- Email: `admin@harakapos.co.ke`

- **Icons**: Lucide React- Password: (the password you set)

- **State Management**: React Hooks + Supabase Realtime- Should redirect to → `/dashboard`



### Backend**Driver Login:**

- **Database**: Supabase (PostgreSQL)- Email: `driver@harakapos.co.ke`

- **Authentication**: Supabase Auth (Row Level Security)- Password: (the password you set)

- **Real-time**: Supabase Realtime subscriptions- Should redirect to → `/driver`

- **API**: Next.js API Routes (App Router)

- **File Storage**: Supabase Storage (delivery photos)## 📱 Usage Guide



### Payments### Admin Workflow

- **M-Pesa**: Safaricom Daraja API

  - Lipa Na M-Pesa Online (STK Push)1. **Add Stock**

  - Till Number integration   - Navigate to **Stock** page

  - Paybill Number integration   - Enter quantity (kg) and supplier source

  - Callback handling   - Click "Add Stock"

- **Receipt Printing**: ESC/POS thermal printer support

2. **Record Sale**

### Infrastructure   - Navigate to **Sales** page

- **Hosting**: Vercel (Frontend + API)   - Enter amount, quantity sold, and payment method

- **Database**: Supabase Cloud (PostgreSQL + Realtime)   - Optionally assign to a driver

- **CDN**: Vercel Edge Network   - Click "Record Sale"

- **SSL**: Automatic HTTPS

3. **Assign Delivery**

---   - Navigate to **Deliveries** page

   - Fill in customer details and location

## 🏗️ System Architecture   - Select driver

   - Optionally link to a sale

```   - Click "Assign Delivery"

┌─────────────────────────────────────────────────────────────┐

│                     HARAKAPOS SYSTEM                        │4. **View Reports**

├─────────────────────────────────────────────────────────────┤   - Navigate to **Reports** page

│                                                             │   - See today's sales, weekly, and monthly summaries

│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │   - View payment method breakdown

│  │   Admin      │    │   Driver     │    │  Customer    │ │

│  │  Dashboard   │    │   PWA App    │    │   M-Pesa     │ │### Driver Workflow

│  │  (Desktop)   │    │  (Mobile)    │    │   Payment    │ │

│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘ │1. **View Deliveries**

│         │                   │                    │         │   - Login to see assigned deliveries

│         └───────────────────┼────────────────────┘         │   - See customer name, phone, location, and delivery amount

│                             │                              │

│                    ┌────────▼────────┐                     │2. **Update Status**

│                    │   Next.js API   │                     │   - Click "Start Delivery" when leaving for delivery

│                    │  (App Router)   │                     │   - Click "Mark as Delivered" when completed

│                    └────────┬────────┘                     │

│                             │                              │## 🗄️ Database Schema

│         ┌───────────────────┼───────────────────┐         │

│         │                   │                   │         │```

│    ┌────▼─────┐      ┌──────▼──────┐     ┌─────▼─────┐  │users (id, name, email, role, created_at)

│    │ Supabase │      │   M-Pesa    │     │  Storage  │  │├── stock (id, date, quantity_kg, source, created_at)

│    │PostgreSQL│      │ Daraja API  │     │  (Photos) │  │├── sales (id, date, amount, payment_method, quantity_sold, driver_id, created_at)

│    │ + RLS    │      │(Till/Paybill│     │           │  │├── deliveries (id, sale_id, driver_id, customer_name, customer_phone, location, status, created_at, updated_at)

│    └──────────┘      └─────────────┘     └───────────┘  │└── settings (id, company_name, phone, address, created_at, updated_at)

│                                                           │```

└─────────────────────────────────────────────────────────────┘

```## 🚀 Deployment



### Data Flow:### Deploy to Vercel



1. **Order Creation** (Admin) → Supabase → Real-time → Driver App1. Push your code to GitHub

2. **Payment Request** (Driver) → M-Pesa API → Customer Phone → Callback → Database2. Go to [vercel.com](https://vercel.com)

3. **PDA Payment** (Driver) → Local Entry → Sync → Database → Receipt3. Click "Import Project"

4. **Status Updates** (Driver) → Database → Real-time → Admin Dashboard4. Select your GitHub repository

5. Add environment variables:

---   - `NEXT_PUBLIC_SUPABASE_URL`

   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🚀 Quick Start6. Click "Deploy"



### PrerequisitesYour app will be live at `https://your-app.vercel.app`



- Node.js 18+ and npm### Custom Domain (Optional)

- Supabase account (free tier works)

- M-Pesa Daraja API credentials (optional for testing)1. In Vercel dashboard, go to **Settings** > **Domains**

- PDA Terminal (optional - Android 11+ device)2. Add your custom domain (e.g., `harakapos.co.ke`)

3. Follow DNS configuration instructions

### 1. Clone Repository

## 🔐 Security

```bash

git clone https://github.com/kingyepz-uopeople/HarakaPoS.git- ✅ Row Level Security (RLS) enabled on all tables

cd HarakaPoS- ✅ Admins can only access admin routes

```- ✅ Drivers can only see their own deliveries

- ✅ Supabase Auth handles authentication securely

### 2. Install Dependencies- ✅ Environment variables for sensitive data



```bash## 🧪 Testing

npm install

```### Test Admin Features

1. Login as admin

### 3. Environment Setup2. Add stock entries

3. Record sales transactions

Copy the environment template:4. Assign deliveries to drivers

5. View reports and metrics

```bash

cp .env.example .env.local### Test Driver Features

```1. Login as driver

2. View assigned deliveries

Edit `.env.local` and add your credentials:3. Update delivery status

4. Verify status changes persist

```env

# Supabase## 📂 Project Structure

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url

NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key```

HarakaPoS/

# M-Pesa (Sandbox for testing)├── app/

MPESA_ENVIRONMENT=sandbox│   ├── actions/          # Server actions (auth, etc.)

MPESA_CONSUMER_KEY=your_consumer_key│   ├── dashboard/        # Admin pages

MPESA_CONSUMER_SECRET=your_consumer_secret│   │   ├── sales/

MPESA_SHORTCODE=174379│   │   ├── stock/

MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919│   │   ├── deliveries/

MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback│   │   └── reports/

```│   ├── driver/           # Driver pages

│   ├── login/            # Login page

### 4. Database Setup│   ├── layout.tsx        # Root layout

│   ├── page.tsx          # Home (redirects to login)

Run the migrations in your Supabase SQL Editor:│   └── globals.css       # Global styles

├── components/

```bash│   ├── ui/               # Reusable UI components

# In order:│   └── layout/           # Layout components (Sidebar)

1. supabase/migrations/payments-system.sql├── lib/

2. supabase/migrations/dispatch-system.sql│   ├── supabase/         # Supabase clients

```│   ├── types.ts          # TypeScript types

│   └── utils.ts          # Utility functions

### 5. Run Development Server├── utils/

│   ├── formatDate.ts     # Date formatting

```bash│   └── formatCurrency.ts # Currency formatting

npm run dev├── middleware.ts         # Auth middleware

```├── supabase-schema.sql   # Database schema

└── README.md             # This file

Open [http://localhost:3000](http://localhost:3000) in your browser.```



### 6. Create Admin User## 🔄 Roadmap (Future Enhancements)



1. Sign up at `/auth/signup`### Phase 2

2. Verify email (check Supabase Auth dashboard)- [ ] M-Pesa API integration (STK Push)

3. Access admin dashboard at `/admin`- [ ] PDF receipt generation

- [ ] SMS delivery notifications (Africa's Talking/Twilio)

---- [ ] WhatsApp integration



## 🌐 Deployment### Phase 3

- [ ] Real-time updates with Supabase Realtime

### Deploy to Vercel (Recommended)- [ ] Analytics dashboard with charts

- [ ] Offline PWA support for drivers

1. **Push to GitHub:**- [ ] Multi-currency support

   ```bash- [ ] Expense tracking

   git add .

   git commit -m "Initial deployment"## 🤝 Contributing

   git push origin main

   ```This is a proprietary project for Haraka Wedges Supplies. For bug reports or feature requests, please contact the development team.



2. **Deploy on Vercel:**## 📄 License

   - Visit [vercel.com](https://vercel.com)

   - Import your GitHub repositoryProprietary - © 2025 Haraka Wedges Supplies

   - Configure environment variables (copy from `.env.local`)

   - Click "Deploy"## 📞 Support



3. **Configure M-Pesa Callback:**For technical support or questions:

   - After deployment, update `MPESA_CALLBACK_URL` to:- Email: support@harakapos.co.ke

   ```- Phone: +254 712 345 678

   https://your-domain.vercel.app/api/mpesa/callback

   ```---

   - Add this URL to your Daraja API app settings

**Built with ❤️ for Haraka Wedges Supplies**

### Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured in Vercel
- [ ] M-Pesa production credentials added
- [ ] Callback URL updated in Daraja portal
- [ ] SSL certificate verified (automatic with Vercel)
- [ ] Test payment flow end-to-end
- [ ] Row Level Security policies reviewed
- [ ] Backup strategy configured

---

## 💰 Payment Integration

### M-Pesa Setup Options

HarakaPOS supports **dual M-Pesa configuration**:

#### **Option 1: Single Setup** (Simpler)
Use one Till OR Paybill for all transactions.

#### **Option 2: Dual Setup** (Recommended)
- **Till Number**: Walk-in sales at processing location
- **Paybill Number**: Delivery orders with account tracking

### Getting Your Numbers

#### **Till Number** (KES 500-1,000)
1. Visit any Safaricom shop
2. Documents: Business cert, KRA PIN, ID
3. Timeline: 2-5 days
4. Use for: PDA terminal payments, walk-in sales

#### **Paybill Number** (KES 2,000-5,000)
1. Apply through **Equity Bank** or **KCB Bank** (recommended)
2. Documents: Business cert, KRA PIN, ID, bank account, statements
3. Timeline: 1-2 weeks
4. Use for: Delivery orders with order ID tracking

### Configuration

For **dual setup**, edit `.env.local`:

```env
# Production mode
MPESA_ENVIRONMENT=production

# Till Number (Walk-in)
MPESA_TILL_NUMBER=512345
MPESA_TILL_PASSKEY=your_till_passkey

# Paybill Number (Deliveries)
MPESA_PAYBILL_NUMBER=400200
MPESA_PAYBILL_PASSKEY=your_paybill_passkey

# Use Paybill for deliveries
MPESA_USE_PAYBILL_FOR=delivery
```

**System automatically routes:**
- Delivery payments → Paybill (with order ID as account)
- Walk-in payments → Till

### Payment Flows

**1. STK Push (Remote)**
```
Driver → Send Request → Customer Phone → Enter PIN → Auto Receipt
```

**2. PDA Terminal (On-site)**
```
Driver → Customer Pays PDA → Enter Code → Print Receipt
```

**3. Cash Payment**
```
Driver → Enter Amount → Calculate Change → Print Receipt
```

---

## 📱 PDA Terminal Support

### Supported Devices
- 58mm Handheld PDA Android 11+ terminals
- Built-in M-Pesa app
- Integrated thermal printer
- GPS and camera

### PWA Installation

1. **On PDA device**, open Chrome and navigate to your domain
2. Tap menu (⋮) → "Add to Home Screen"
3. Name it "HarakaPOS Driver"
4. Launch from home screen

### Features
- ✅ Works offline (orders cached locally)
- ✅ Background sync when online
- ✅ Push notifications for new orders
- ✅ GPS navigation integration
- ✅ Thermal receipt printing
- ✅ Camera for delivery photos

### Printer Integration

HarakaPOS generates ESC/POS compatible receipts for:
- 58mm thermal printers (PDA built-in)
- 80mm thermal printers (external)
- Sunmi, Telpo, generic Bluetooth printers

---

## 📚 Documentation

### Complete Guides

| Document | Description |
|----------|-------------|
| **[M-Pesa Setup Guide](docs/mpesa-setup/DUAL_TILL_PAYBILL_SETUP.md)** | Complete Till & Paybill setup |
| **[Action Plan](docs/mpesa-setup/ACTION_PLAN_DUAL_SETUP.md)** | Step-by-step checklist |
| **[PDA Terminal Guide](docs/pda-guides/PDA_COMPLETE_SETUP.md)** | PDA installation & usage |
| **[Payment System](docs/mpesa-setup/PAYMENT_SYSTEM_GUIDE.md)** | Payment flows explained |
| **[Business Name Setup](docs/mpesa-setup/MPESA_BUSINESS_NAME_SETUP.md)** | How to show your business name |

### Quick References

- **M-Pesa Quick Start**: [docs/mpesa-setup/MPESA_QUICK_START.md](docs/mpesa-setup/MPESA_QUICK_START.md)
- **Payment Comparison**: [docs/mpesa-setup/PAYMENT_COMPARISON.md](docs/mpesa-setup/PAYMENT_COMPARISON.md)
- **PDA Quick Start**: [docs/pda-guides/PDA_QUICK_START.md](docs/pda-guides/PDA_QUICK_START.md)

### API Documentation

**Payment Endpoints:**
- `POST /api/payments/initiate` - M-Pesa STK Push
- `POST /api/mpesa/callback` - M-Pesa callback handler
- `POST /api/payments/complete` - Complete PDA payment
- `POST /api/print/receipt` - Generate receipt

**Database Schema:**
- `orders` - Delivery orders
- `payments` - Payment transactions
- `receipts` - Generated receipts
- `customers` - Customer records

---

## 🔒 Security

- ✅ Row Level Security (RLS) on all tables
- ✅ Authentication required for all operations
- ✅ M-Pesa callbacks verified
- ✅ HTTPS enforced (Vercel automatic)
- ✅ API routes protected with auth checks
- ✅ Environment variables secured
- ✅ SQL injection prevention (parameterized queries)

---

## 🐛 Troubleshooting

### Build Errors

**TypeScript errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Duplicate imports:**
- Check for corrupted files in `app/driver/old/`
- Rename folder to `_old_backup` to exclude from build

### M-Pesa Issues

**STK Push not received:**
1. Verify phone number format (254XXXXXXXXX)
2. Check callback URL is publicly accessible
3. Confirm credentials are for correct environment (sandbox/production)
4. Test with Safaricom test numbers (sandbox)

**Payment not recording:**
1. Check callback endpoint logs
2. Verify database permissions (RLS policies)
3. Ensure payment record was created before STK push

### PDA Issues

**PWA won't install:**
- Ensure HTTPS is enabled (required for PWA)
- Check `manifest.json` is accessible
- Verify service worker registration

**Offline mode not working:**
- Check browser support for Service Workers
- Ensure IndexedDB is enabled
- Test network conditions

---

## 📞 Support & Contact

### For Licensing & Commercial Use

**Contact Owner:**
- 📞 **Phone**: +254 791 890 8858
- 📧 **Email**: contact@harakawedsupplies.com

### Technical Support

- 🐛 **Bug Reports**: Open an issue (if authorized)
- 💬 **Questions**: Contact developer
- 📖 **Documentation**: See [docs/](docs/) folder

### M-Pesa Support

- **Till Number**: Call 100 (Safaricom)
- **Paybill**: Your bank or 0711049000
- **API Issues**: apisupport@safaricom.co.ke
- **Daraja Portal**: https://developer.safaricom.co.ke

---

## 📄 License

**PROPRIETARY LICENSE - All Rights Reserved**

Copyright © 2025 Haraka Wedges Supplies

This software is proprietary and confidential. Unauthorized use, reproduction, or distribution is strictly prohibited.

**For licensing inquiries:**
- 📞 Call: +254 791 890 8858
- 📧 Email: contact@harakawedsupplies.com

See [LICENSE](LICENSE) file for complete terms.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Safaricom Daraja](https://developer.safaricom.co.ke/) - M-Pesa API
- [Vercel](https://vercel.com/) - Deployment platform
- [Shadcn/UI](https://ui.shadcn.com/) - Component library

---

## 📊 Project Stats

- **Version**: 2.0.0
- **Last Updated**: November 2025
- **Build Status**: ✅ Production Ready
- **License**: Proprietary
- **Support**: Active

---

<div align="center">

**Built for Haraka Wedges Supplies 🥔**

*Professional potato processing & delivery management*

---

For licensing and permissions, contact: **+254 791 890 8858**

</div>
