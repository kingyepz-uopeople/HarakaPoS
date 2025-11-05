# ✅ Payment System Implementation Checklist

## 📋 Database Setup

- [ ] Run `supabase/ADD_UPDATED_BY_COLUMN.sql` in Supabase SQL Editor
- [ ] Run `supabase/migrations/payments-system.sql` in Supabase SQL Editor
- [ ] Verify tables created: `payments`, `receipts`
- [ ] Test receipt number generation works

## 🔑 M-Pesa Setup (Sandbox)

- [ ] Create account on https://developer.safaricom.co.ke
- [ ] Create new app
- [ ] Select "Lipa Na M-Pesa Online" API
- [ ] Copy Consumer Key
- [ ] Copy Consumer Secret
- [ ] Note sandbox credentials (Shortcode: 174379)

## ⚙️ Environment Configuration

- [ ] Copy `.env.example` to `.env.local`
- [ ] Add `MPESA_CONSUMER_KEY`
- [ ] Add `MPESA_CONSUMER_SECRET`
- [ ] Add `MPESA_SHORTCODE` (174379 for sandbox)
- [ ] Add `MPESA_PASSKEY` (from .env.example)
- [ ] Set `MPESA_ENVIRONMENT=sandbox`

## 🌐 Ngrok Setup (Local Testing)

- [ ] Install ngrok: `npm install -g ngrok`
- [ ] Run ngrok: `ngrok http 3000`
- [ ] Copy https URL
- [ ] Add to `.env.local` as `MPESA_CALLBACK_URL=https://xxx.ngrok.io/api/mpesa/callback`
- [ ] Keep ngrok terminal open while testing

## 🚀 Application Restart

- [ ] Stop dev server (Ctrl+C)
- [ ] Start dev server: `npm run dev`
- [ ] Verify no errors in terminal
- [ ] Check http://localhost:3000 loads

## 🧪 Testing

- [ ] Login as admin
- [ ] Create a test order
- [ ] Assign to driver
- [ ] Login as driver (or open driver app)
- [ ] Navigate to delivery details
- [ ] See "Request M-Pesa Payment" button
- [ ] Click button
- [ ] Enter test phone: `254708374149`
- [ ] Click "Send Payment Request"
- [ ] Check M-Pesa sandbox logs
- [ ] Simulate payment success
- [ ] Verify order status changes to "Completed"
- [ ] Check receipt is generated
- [ ] Test receipt print/download

## 📱 Driver App Verification

- [ ] Payment button appears when status = "Out for Delivery"
- [ ] Phone number auto-fills from customer data
- [ ] Button shows loading state while processing
- [ ] Success message appears after sending
- [ ] Can still use "Mark as Delivered" for cash

## 🔍 Database Verification

Run these queries in Supabase to verify:

```sql
-- Check payment was created
SELECT * FROM payments WHERE order_id = 'your_order_id';

-- Check receipt was created
SELECT * FROM receipts WHERE order_id = 'your_order_id';

-- Check order status updated
SELECT delivery_status FROM orders WHERE id = 'your_order_id';
```

## 🐛 Troubleshooting Checklist

If payment doesn't work:

- [ ] Check all env vars are in `.env.local`
- [ ] Restart dev server after adding env vars
- [ ] Verify ngrok is running and URL is correct
- [ ] Check browser console for errors
- [ ] Check terminal for API errors
- [ ] Check ngrok web interface: http://127.0.0.1:4040
- [ ] Verify M-Pesa credentials are correct
- [ ] Check phone number format (254XXXXXXXXX)
- [ ] Verify database migrations ran successfully

## 📄 API Testing (Optional)

Test with curl/Postman:

```bash
# Test payment initiation
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your-order-id",
    "phoneNumber": "254708374149",
    "initiatedFrom": "driver"
  }'
```

## 🎯 Production Checklist (When Ready)

- [ ] Apply for M-Pesa production account
- [ ] Get production Paybill/Till number
- [ ] Get production Consumer Key
- [ ] Get production Consumer Secret
- [ ] Get production Passkey
- [ ] Update `.env.local` with production credentials
- [ ] Set `MPESA_ENVIRONMENT=production`
- [ ] Update callback URL to production domain
- [ ] Test with small real payment first
- [ ] Monitor production transactions
- [ ] Setup error alerting
- [ ] Train drivers on payment process

## 📊 Success Criteria

You'll know it's working when:

- ✅ Driver sees payment button on delivery screen
- ✅ Customer receives M-Pesa prompt on phone
- ✅ Payment processes successfully
- ✅ Receipt auto-generates with unique number
- ✅ Order status changes to "Completed"
- ✅ Payment history is tracked in database
- ✅ Receipts can be printed/downloaded
- ✅ No errors in browser console
- ✅ No errors in server terminal
- ✅ Ngrok shows successful callback

## 🎉 Final Steps

- [ ] Test multiple payments
- [ ] Test payment failures (wrong PIN, insufficient funds)
- [ ] Test cash payments (old flow still works)
- [ ] Train admin on payment tracking
- [ ] Train drivers on requesting payments
- [ ] Document any custom changes
- [ ] Backup database before production
- [ ] Monitor first few real transactions

---

## 📚 Reference Files

- **Setup Guide:** `docs/PAYMENT_SYSTEM_GUIDE.md`
- **Quick Start:** `PAYMENT_QUICK_START.md`
- **Environment Template:** `.env.example`
- **Database Migrations:** `supabase/migrations/payments-system.sql`
- **M-Pesa Integration:** `lib/mpesa.ts`
- **Payment Button:** `components/RequestPaymentButton.tsx`
- **Receipt Viewer:** `components/ReceiptViewer.tsx`

---

## 🆘 Need Help?

1. Check `docs/PAYMENT_SYSTEM_GUIDE.md` - Troubleshooting section
2. Review M-Pesa sandbox logs on Daraja portal
3. Check ngrok web interface: http://127.0.0.1:4040
4. Review browser console for errors
5. Check server terminal for API errors
6. Verify all environment variables are set
7. Test with provided test phone numbers

---

**Ready to accept M-Pesa payments!** 💰✨
