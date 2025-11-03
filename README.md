# 🥔 HarakaPOS - Point of Sale & Delivery Management System

A modern, production-ready POS and delivery management system built for **Haraka Wedges Supplies**, a potato distribution business in Kenya.

## 🚀 Features

### For Admin Users
- 📊 **Dashboard** - Real-time metrics and overview
- 💰 **Sales Management** - Record sales with Cash/M-Pesa payment methods
- 📦 **Stock Tracking** - Manage incoming potato inventory
- 🚚 **Delivery Management** - Assign and track deliveries
- 📈 **Reports** - Daily, weekly, and monthly sales analytics

### For Driver Users
- 📱 **Mobile-First Interface** - Easy-to-use delivery dashboard
- 📍 **Delivery List** - View assigned deliveries with customer details
- ✅ **Status Updates** - Update delivery status (Pending → On the Way → Delivered)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security)
- **Language**: TypeScript
- **Deployment**: Vercel (Frontend) + Supabase Cloud (Backend)

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([Sign up free](https://supabase.com))
- A Vercel account for deployment ([Sign up free](https://vercel.com))

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd HarakaPoS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### a. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details and wait for setup to complete

#### b. Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `supabase-schema.sql` file from this project
3. Copy and paste the entire SQL content
4. Click **Run** to create all tables, policies, and indexes

#### c. Create Admin and Driver Users
1. In Supabase dashboard, go to **Authentication** > **Users**
2. Click **Add User** and create:
   - **Admin User**: `admin@harakapos.co.ke` (set a password)
   - **Driver User**: `driver@harakapos.co.ke` (set a password)
3. Copy the User IDs for each user

#### d. Link Auth Users to Custom Users Table
1. Go back to **SQL Editor**
2. Run this query (replace the UUIDs with actual user IDs from step c):

```sql
INSERT INTO users (id, name, email, role) VALUES
('paste-admin-user-id-here', 'Admin User', 'admin@harakapos.co.ke', 'admin'),
('paste-driver-user-id-here', 'John Driver', 'driver@harakapos.co.ke', 'driver');
```

### 4. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Get your Supabase credentials:
   - Go to **Project Settings** > **API**
   - Copy the **Project URL** and **anon/public** key

3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Login and Test

**Admin Login:**
- Email: `admin@harakapos.co.ke`
- Password: (the password you set)
- Should redirect to → `/dashboard`

**Driver Login:**
- Email: `driver@harakapos.co.ke`
- Password: (the password you set)
- Should redirect to → `/driver`

## 📱 Usage Guide

### Admin Workflow

1. **Add Stock**
   - Navigate to **Stock** page
   - Enter quantity (kg) and supplier source
   - Click "Add Stock"

2. **Record Sale**
   - Navigate to **Sales** page
   - Enter amount, quantity sold, and payment method
   - Optionally assign to a driver
   - Click "Record Sale"

3. **Assign Delivery**
   - Navigate to **Deliveries** page
   - Fill in customer details and location
   - Select driver
   - Optionally link to a sale
   - Click "Assign Delivery"

4. **View Reports**
   - Navigate to **Reports** page
   - See today's sales, weekly, and monthly summaries
   - View payment method breakdown

### Driver Workflow

1. **View Deliveries**
   - Login to see assigned deliveries
   - See customer name, phone, location, and delivery amount

2. **Update Status**
   - Click "Start Delivery" when leaving for delivery
   - Click "Mark as Delivered" when completed

## 🗄️ Database Schema

```
users (id, name, email, role, created_at)
├── stock (id, date, quantity_kg, source, created_at)
├── sales (id, date, amount, payment_method, quantity_sold, driver_id, created_at)
├── deliveries (id, sale_id, driver_id, customer_name, customer_phone, location, status, created_at, updated_at)
└── settings (id, company_name, phone, address, created_at, updated_at)
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

Your app will be live at `https://your-app.vercel.app`

### Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** > **Domains**
2. Add your custom domain (e.g., `harakapos.co.ke`)
3. Follow DNS configuration instructions

## 🔐 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Admins can only access admin routes
- ✅ Drivers can only see their own deliveries
- ✅ Supabase Auth handles authentication securely
- ✅ Environment variables for sensitive data

## 🧪 Testing

### Test Admin Features
1. Login as admin
2. Add stock entries
3. Record sales transactions
4. Assign deliveries to drivers
5. View reports and metrics

### Test Driver Features
1. Login as driver
2. View assigned deliveries
3. Update delivery status
4. Verify status changes persist

## 📂 Project Structure

```
HarakaPoS/
├── app/
│   ├── actions/          # Server actions (auth, etc.)
│   ├── dashboard/        # Admin pages
│   │   ├── sales/
│   │   ├── stock/
│   │   ├── deliveries/
│   │   └── reports/
│   ├── driver/           # Driver pages
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home (redirects to login)
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components (Sidebar)
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
├── utils/
│   ├── formatDate.ts     # Date formatting
│   └── formatCurrency.ts # Currency formatting
├── middleware.ts         # Auth middleware
├── supabase-schema.sql   # Database schema
└── README.md             # This file
```

## 🔄 Roadmap (Future Enhancements)

### Phase 2
- [ ] M-Pesa API integration (STK Push)
- [ ] PDF receipt generation
- [ ] SMS delivery notifications (Africa's Talking/Twilio)
- [ ] WhatsApp integration

### Phase 3
- [ ] Real-time updates with Supabase Realtime
- [ ] Analytics dashboard with charts
- [ ] Offline PWA support for drivers
- [ ] Multi-currency support
- [ ] Expense tracking

## 🤝 Contributing

This is a proprietary project for Haraka Wedges Supplies. For bug reports or feature requests, please contact the development team.

## 📄 License

Proprietary - © 2025 Haraka Wedges Supplies

## 📞 Support

For technical support or questions:
- Email: support@harakapos.co.ke
- Phone: +254 712 345 678

---

**Built with ❤️ for Haraka Wedges Supplies**
