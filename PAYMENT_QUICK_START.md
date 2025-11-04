# 💰 Payment System - Quick Start

## What We Built

A **complete payment system** for your potato delivery business that allows:

1. **Drivers** to request M-Pesa payment from customers on delivery
2. **Admin** to request M-Pesa payment from dashboard
3. **Automatic receipt generation** after payment
4. **Payment tracking** (pending → processing → completed)
5. **Auto-complete orders** when payment is confirmed

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migrations

Open **Supabase Dashboard** → **SQL Editor** → Run these files:

1. **`supabase/ADD_UPDATED_BY_COLUMN.sql`** (fixes the error you had earlier)
2. **`supabase/migrations/payments-system.sql`** (creates payments & receipts tables)

### Step 2: Setup M-Pesa Sandbox (Testing)

1. Go to https://developer.safaricom.co.ke
2. Create account → Login
3. Create App → Select "Lipa Na M-Pesa Online"
4. Copy your **Consumer Key** and **Consumer Secret**
5. Create `.env.local` file (copy from `.env.example`)
6. Add your credentials:

```env
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

### Step 3: Setup Ngrok (for local testing)

```bash
# Install ngrok
npm install -g ngrok

# Run ngrok (in a separate terminal)
ngrok http 3000

# Copy the https URL and add to .env.local:
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
```

**Then restart your dev server:**
```bash
npm run dev
```

---

## 📱 How Drivers Use It

### On Delivery:

1. Driver delivers potatoes to customer
2. Opens delivery details
3. Sees **"Request M-Pesa Payment"** button
4. Clicks it
5. Confirms customer phone number
6. Clicks **"Send Payment Request"**
7. Customer receives M-Pesa prompt on phone
8. Customer enters PIN
9. ✅ Payment confirmed!
10. Receipt auto-generated
11. Order marked as "Completed"

### Screenshots (What Driver Sees):

```
┌─────────────────────────────────┐
│  Delivery Details               │
├─────────────────────────────────┤
│  Customer: Mama Njeri's Hotel   │
│  Phone: 0712345678              │
│  Amount: KES 1,200              │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ 📱 Request M-Pesa Payment │  │  ← Driver clicks this
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  Or mark as delivered (Cash)    │
│  ┌───────────────────────────┐  │
│  │ ✓ Mark as Delivered       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 🎯 Payment Flow

```
Driver clicks "Request Payment"
    ↓
Customer phone receives M-Pesa prompt
    ↓
Customer enters M-Pesa PIN
    ↓
M-Pesa processes payment
    ↓
Payment confirmed ✅
    ↓
Receipt auto-generated 📄
    ↓
Order status → "Completed" ✓
```

---

## 📂 Files Created

### Database
- ✅ `supabase/migrations/payments-system.sql` - Creates payments & receipts tables
- ✅ `supabase/ADD_UPDATED_BY_COLUMN.sql` - Fixes missing column

### Backend (API)
- ✅ `lib/mpesa.ts` - M-Pesa integration functions
- ✅ `app/api/payments/initiate/route.ts` - Initiate payment endpoint
- ✅ `app/api/mpesa/callback/route.ts` - M-Pesa callback handler

### Frontend (UI)
- ✅ `components/RequestPaymentButton.tsx` - Payment request button
- ✅ `components/ReceiptViewer.tsx` - Receipt display & print

### Types
- ✅ `lib/types.ts` - Payment & receipt types added

### Config
- ✅ `.env.example` - Environment variables template

### Documentation
- ✅ `docs/PAYMENT_SYSTEM_GUIDE.md` - Complete guide
- ✅ `PAYMENT_QUICK_START.md` - This file

---

## 🧪 Test It

### Test Phone Numbers (Sandbox Only):
- `254708374149`
- `254708374150`

### Test Steps:

1. Create an order for a customer
2. Assign to driver
3. Driver starts delivery (status → "Out for Delivery")
4. Driver clicks "Request M-Pesa Payment"
5. Enter test phone: `254708374149`
6. Click "Send Payment Request"
7. Check M-Pesa sandbox for STK push
8. Simulate payment (in sandbox dashboard)
9. Check order status changes to "Completed"
10. Check receipt is generated

---

## 💡 Key Features

### For Drivers:
✅ Request payment on delivery  
✅ See payment status in real-time  
✅ Auto-generated receipts  
✅ Can still mark as "Cash" delivery  

### For Admin:
✅ Request payment from dashboard  
✅ Track all payments  
✅ View/print receipts  
✅ Payment history & audit trail  

### For Customers:
✅ Pay with M-Pesa (no cash needed)  
✅ Instant receipt  
✅ Secure payment  
✅ SMS confirmation  

### Technical:
✅ M-Pesa STK Push integration  
✅ Auto receipt numbering (RCP-20251104-00001)  
✅ Payment status tracking  
✅ Auto-complete orders on payment  
✅ Callback handling  
✅ Error handling  
✅ RLS security  

---

## 🔧 Environment Variables Needed

```env
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# M-Pesa (new - add these)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback
```

---

## 📊 What Gets Created in Database

### When Payment Requested:
```sql
INSERT INTO payments (
  order_id,
  amount,
  payment_method = 'mpesa',
  payment_status = 'processing',
  phone_number,
  initiated_by,
  initiated_from = 'driver'
);
```

### When Payment Successful:
```sql
UPDATE payments SET
  payment_status = 'completed',
  mpesa_receipt_number = 'ABC123XYZ',
  transaction_id = 'ABC123XYZ';

INSERT INTO receipts (
  receipt_number = 'RCP-20251104-00001', -- Auto-generated
  order_id,
  payment_id,
  issued_to = 'Customer Name',
  total,
  items = [...]
);

UPDATE orders SET
  delivery_status = 'Completed';
```

---

## 🎨 Where It Appears

### Driver App
**File:** `app/driver/deliveries/[id]/page.tsx`

Shows when order status is **"Out for Delivery"**

### Admin Dashboard (You can add it)
```tsx
import RequestPaymentButton from "@/components/RequestPaymentButton";

// In your orders list/detail page:
<RequestPaymentButton
  orderId={order.id}
  amount={order.total_price}
  customerPhone={order.customer.phone}
  customerName={order.customer.name}
  initiatedFrom="admin"
/>
```

---

## 🆘 Common Issues

### "M-Pesa configuration incomplete"
→ Add M-Pesa env vars to `.env.local` and restart server

### "Callback not received"
→ Make sure ngrok is running and callback URL is correct

### "record new has no field updated_by"
→ Run `ADD_UPDATED_BY_COLUMN.sql` migration

### Phone number format error
→ Use format: `254712345678` (no spaces or dashes)

---

## 🎉 Ready to Go!

1. ✅ Run SQL migrations
2. ✅ Add M-Pesa credentials
3. ✅ Setup ngrok
4. ✅ Restart server
5. ✅ Test payment flow

**Then drivers can start requesting payments on delivery!** 💰🚀

---

## 📖 Full Documentation

See `docs/PAYMENT_SYSTEM_GUIDE.md` for:
- Detailed setup instructions
- API documentation
- Payment flow diagrams
- Security considerations
- Production deployment guide
- Troubleshooting

---

**Questions?** Check the full guide or test it in sandbox mode first! 🎯
