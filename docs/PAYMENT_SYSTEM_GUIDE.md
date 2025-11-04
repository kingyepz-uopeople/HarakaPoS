# 💰 Payment System Implementation Guide

## Overview

This payment system allows **drivers** and **admin** to request M-Pesa payments directly from customers when delivering processed potatoes. Perfect for your potato peeling business!

## 🎯 How It Works

### For Drivers (On Delivery)

1. Driver arrives at customer location with potatoes
2. Driver opens delivery details in their app
3. Driver clicks **"Request M-Pesa Payment"** button
4. Enters customer phone number (auto-filled if available)
5. Customer receives M-Pesa STK push on their phone
6. Customer enters their M-Pesa PIN
7. Payment processed instantly
8. Receipt auto-generated
9. Order marked as completed
10. Driver sees confirmation

### For Admin (From Dashboard)

1. Admin sees unpaid orders
2. Admin clicks "Request Payment" on any order
3. Same M-Pesa flow as above
4. Admin can track payment status
5. Can regenerate receipts anytime

### For Customers (Self-Payment)

- Can pay before or after delivery
- Receives SMS with payment link
- Can access payment portal
- Receives instant receipt via SMS/Email

---

## 📋 Setup Steps

### 1. Run Database Migration

Open **Supabase Dashboard** → **SQL Editor** and run:

```sql
-- Copy contents from: supabase/migrations/payments-system.sql
```

This creates:
- ✅ `payments` table
- ✅ `receipts` table  
- ✅ Auto receipt number generation (RCP-20251104-00001)
- ✅ Auto-complete orders when paid
- ✅ Triggers and functions

### 2. Add the missing `updated_by` column

```sql
-- Copy from: supabase/ADD_UPDATED_BY_COLUMN.sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your M-Pesa credentials:

```env
# M-Pesa Sandbox (for testing)
MPESA_ENVIRONMENT=sandbox
MPESA_CONSUMER_KEY=your_key_from_daraja
MPESA_CONSUMER_SECRET=your_secret_from_daraja
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback
```

### 4. Get M-Pesa Credentials

**Sandbox (Testing):**

1. Go to https://developer.safaricom.co.ke
2. Create account and login
3. Create new app
4. Select "Lipa Na M-Pesa Online"
5. Copy Consumer Key and Secret
6. Use test shortcode: `174379`
7. Use test passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

**Production (Live):**

1. Contact Safaricom business support
2. Apply for M-Pesa Paybill or Till Number
3. Complete KYC and onboarding
4. Get production credentials
5. Update `.env.local` with production values

### 5. Setup Ngrok (for local testing)

M-Pesa needs a public URL to send callbacks. Use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# In a new terminal, run:
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update .env.local:
MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/mpesa/callback
```

### 6. Restart Your Development Server

```bash
npm run dev
```

---

## 🚀 Usage

### In Driver App

**File:** `app/driver/deliveries/[id]/page.tsx`

When delivery status is "Out for Delivery", driver sees:

```tsx
<RequestPaymentButton
  orderId={delivery.id}
  amount={delivery.total_price}
  customerPhone={delivery.customer_phone}
  customerName={delivery.customer_name}
  initiatedFrom="driver"
/>
```

**Flow:**
1. Driver clicks "Request M-Pesa Payment"
2. Confirms/edits customer phone number
3. Clicks "Send Payment Request"
4. Customer gets STK push
5. Customer enters PIN
6. Payment confirmed
7. Receipt auto-generated

### In Admin Dashboard

You can add this to your orders page:

```tsx
import RequestPaymentButton from "@/components/RequestPaymentButton";

<RequestPaymentButton
  orderId={order.id}
  amount={order.total_price}
  customerPhone={order.customer.phone}
  customerName={order.customer.name}
  initiatedFrom="admin"
/>
```

### View Receipts

```tsx
import ReceiptViewer from "@/components/ReceiptViewer";

<ReceiptViewer orderId={order.id} />
```

---

## 📊 Database Schema

### Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  amount DECIMAL(10, 2),
  payment_method TEXT, -- 'mpesa', 'cash', 'bank_transfer', 'credit'
  payment_status TEXT, -- 'pending', 'processing', 'completed', 'failed'
  
  -- M-Pesa fields
  phone_number TEXT,
  mpesa_request_id TEXT,
  mpesa_receipt_number TEXT,
  
  -- Tracking
  initiated_by UUID,
  initiated_from TEXT, -- 'admin', 'driver', 'customer'
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Receipts Table

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  payment_id UUID REFERENCES payments(id),
  receipt_number TEXT UNIQUE, -- Auto: RCP-20251104-00001
  
  issued_to TEXT,
  issued_by UUID,
  items JSONB,
  
  subtotal DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2),
  payment_method TEXT,
  
  created_at TIMESTAMPTZ
);
```

---

## 🔄 Payment Flow Diagram

```
Driver/Admin                  API                    M-Pesa                 Customer
    |                          |                        |                        |
    |-- Click "Request" ------>|                        |                        |
    |                          |-- Create Payment ----->|                        |
    |                          |      (processing)      |                        |
    |                          |                        |                        |
    |                          |-- Initiate STK ------->|                        |
    |                          |      Push              |                        |
    |                          |                        |-- Send Prompt -------->|
    |                          |                        |                        |
    |<-- "Sent to phone" ------|                        |                        |
    |                          |                        |<-- Enter PIN ----------|
    |                          |                        |                        |
    |                          |                        |-- Process Payment ---->|
    |                          |                        |                        |
    |                          |<-- Callback ---------->|                        |
    |                          |   (payment result)     |                        |
    |                          |                        |                        |
    |                          |-- Update Payment ----->|                        |
    |                          |    (completed)         |                        |
    |                          |                        |                        |
    |                          |-- Create Receipt ----->|                        |
    |                          |                        |                        |
    |                          |-- Update Order ------->|                        |
    |                          |    (Completed)         |                        |
    |                          |                        |                        |
    |<-- Success Notification--|                        |                        |
```

---

## 🧪 Testing

### Test Phone Numbers (Sandbox)

Use these test numbers in sandbox:
- `254708374149`
- `254708374150`

### Test Flow

1. Create an order
2. Assign to driver
3. Driver starts delivery
4. Driver clicks "Request M-Pesa Payment"
5. Enter test phone number
6. Check M-Pesa sandbox logs for STK push
7. Simulate payment success/failure
8. Check order status changes to "Completed"
9. Check receipt is generated

### API Endpoints

**Initiate Payment:**
```
POST /api/payments/initiate
Body: { orderId, phoneNumber, initiatedFrom }
```

**M-Pesa Callback:**
```
POST /api/mpesa/callback
Body: { Body: { stkCallback: {...} } }
```

---

## 🎨 UI Components

### RequestPaymentButton

**Location:** `components/RequestPaymentButton.tsx`

**Props:**
```typescript
{
  orderId: string;
  amount: number;
  customerPhone: string;
  customerName: string;
  initiatedFrom: "admin" | "driver";
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
```

### ReceiptViewer

**Location:** `components/ReceiptViewer.tsx`

**Props:**
```typescript
{
  orderId: string;
  paymentId?: string;
}
```

**Features:**
- Print receipt
- Download PDF
- Email to customer
- Professional layout

---

## 📱 Mobile Optimization

Both driver app and payment UI are fully mobile-optimized:
- ✅ Touch-friendly buttons
- ✅ Large tap targets
- ✅ Mobile-first design
- ✅ Works offline (queues requests)
- ✅ Real-time status updates

---

## 🔐 Security

- ✅ Row Level Security (RLS) enabled
- ✅ Authenticated users only
- ✅ Payment validation
- ✅ Callback verification (M-Pesa signature)
- ✅ Encrypted communication
- ✅ Audit trail (who initiated payment)

---

## 📈 Next Steps

1. **Run migrations** (payments-system.sql, ADD_UPDATED_BY_COLUMN.sql)
2. **Setup M-Pesa sandbox** credentials
3. **Configure ngrok** for local testing
4. **Test with driver app**
5. **Add to admin dashboard** (optional)
6. **Move to production** when ready

---

## 🆘 Troubleshooting

### "M-Pesa configuration incomplete"
- Check `.env.local` has all M-Pesa variables
- Restart dev server after adding env vars

### "Callback not received"
- Check ngrok is running
- Verify callback URL is correct
- Check M-Pesa sandbox logs

### "Payment stuck in 'processing'"
- M-Pesa callback might have failed
- Check server logs for callback errors
- Manually update payment status if needed

### "Phone number format error"
- Use format: `254712345678` or `0712345678`
- No spaces, dashes, or special characters

---

## 💡 Tips

1. **Always test in sandbox first**
2. **Keep ngrok terminal open** during testing
3. **Check M-Pesa logs** on Daraja portal
4. **Monitor callback endpoint** for errors
5. **Test payment failures** too (insufficient balance, etc.)
6. **Train drivers** on how to use payment feature

---

## 🎉 Benefits

✅ **Instant payments** - No waiting for cash collection  
✅ **Digital receipts** - Automatic generation  
✅ **Better tracking** - Know payment status in real-time  
✅ **Less cash handling** - Safer for drivers  
✅ **Customer convenience** - Pay with M-Pesa PIN  
✅ **Audit trail** - Full payment history  
✅ **Professional** - Modern payment experience  

---

Ready to accept payments! 💰🚀
