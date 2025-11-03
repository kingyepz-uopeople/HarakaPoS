# HarakaPOS - Quick Start Guide

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set Up Supabase Database
1. Go to your Supabase project → SQL Editor
2. Copy and paste the content from `supabase-schema.sql`
3. Click "Run" to create all tables

### 4. Create Test Users
In Supabase Dashboard → Authentication → Users, create:
- Admin: `admin@harakapos.co.ke`
- Driver: `driver@harakapos.co.ke`

Then link them in SQL Editor:
```sql
INSERT INTO users (id, name, email, role) VALUES
('your-admin-user-id', 'Admin User', 'admin@harakapos.co.ke', 'admin'),
('your-driver-user-id', 'Driver User', 'driver@harakapos.co.ke', 'driver');
```

### 5. Run the App
```bash
npm run dev
```

Open http://localhost:3000 and login!

---

## 🎯 Default Test Credentials

**Admin:**
- Email: `admin@harakapos.co.ke`
- Password: (whatever you set in Supabase)

**Driver:**
- Email: `driver@harakapos.co.ke`
- Password: (whatever you set in Supabase)

---

## 🔧 Troubleshooting

### "Invalid login credentials"
- Make sure you created users in Supabase Auth
- Check that you linked them to the users table with the SQL INSERT command
- Verify your .env.local has correct Supabase URL and key

### "Unable to connect to database"
- Check your Supabase project is active
- Verify environment variables are correct
- Make sure you ran the supabase-schema.sql

### TypeScript/ESLint errors
- These will resolve once you run `npm run dev`
- If persist, run: `npm run build` to check for real errors

---

## 📱 App Structure

**Admin Routes:**
- `/dashboard` - Overview with metrics
- `/dashboard/sales` - Record and view sales
- `/dashboard/stock` - Manage inventory
- `/dashboard/deliveries` - Assign deliveries
- `/dashboard/reports` - View analytics

**Driver Routes:**
- `/driver` - View and update deliveries

**Public Routes:**
- `/login` - Authentication page
- `/` - Redirects to login

---

## 🚀 Deploy to Production

### Vercel Deployment
```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Import to Vercel
# - Go to vercel.com
# - Click "Import Project"
# - Add environment variables
# - Deploy!
```

### Environment Variables for Vercel
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

---

## 📖 Full Documentation

See [README.md](./README.md) for complete documentation.

---

**Need help? Contact: support@harakapos.co.ke**
