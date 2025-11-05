# Dual Till & Paybill Setup Guide
## Haraka Wedges Supplies - Professional Payment Configuration

---

## 🎯 Your Payment Strategy

You've chosen the **dual setup** - this is the professional approach for businesses with multiple sales channels!

### **Till Number** → Walk-in Sales
- Customer physically at your location
- Quick PDA terminal payments
- Face-to-face transactions
- Cash alternative

### **Paybill** → Delivery Orders
- Remote customer payments
- Order tracking via account numbers
- Driver-initiated payments
- Customer pays from their phone

---

## ✅ Benefits of Dual Setup

1. **Better Organization**
   - Separate walk-in revenue from delivery revenue
   - Easy reconciliation at end of day
   - Clear reporting

2. **Professional Image**
   - Customers see different business names for different contexts
   - Can brand Till for "Haraka Wedges Shop" and Paybill for "Haraka Deliveries"

3. **Account Number Tracking**
   - Paybill supports account numbers (order IDs)
   - Automatic payment matching
   - Better customer tracking

4. **Scalability**
   - Ready for multiple locations
   - Can add more Tills for different branches
   - Paybill handles all delivery orders

---

## 📋 What You Need to Apply

### For **TILL NUMBER** (Walk-in Sales)

**Visit: Safaricom Shop**

**Documents Required:**
- ✅ Business Registration Certificate (CR12) OR Business Permit
- ✅ KRA PIN Certificate
- ✅ National ID (director/owner)
- ✅ Passport photo
- ✅ Safaricom line (can be personal)

**Application Process:**
1. Visit any Safaricom shop
2. Ask for: **"Lipa Na M-Pesa Till Number application"**
3. Fill out form (takes 10 minutes)
4. Pay setup fee: KES 500-1,000
5. Receive Till Number: 2-5 business days
6. Get Daraja API credentials: Visit developer.safaricom.co.ke

**What You Get:**
- Till Number (e.g., **512345**)
- Business name on STK push: **"Haraka Wedges Supplies"**
- Till Passkey for API integration
- M-Pesa notifications for every payment

---

### For **PAYBILL NUMBER** (Deliveries)

**Visit: Your Bank OR Safaricom Business**

**Documents Required:**
- ✅ Business Registration Certificate (CR12)
- ✅ KRA PIN Certificate
- ✅ National ID (director/owner)
- ✅ Business bank account
- ✅ Bank statement (3 months)
- ✅ Letter from bank
- ✅ Passport photos

**Application Process:**
1. **Option A - Through Your Bank:**
   - Visit your business bank
   - Request M-Pesa Paybill integration
   - They'll coordinate with Safaricom
   - Timeline: 1-2 weeks

2. **Option B - Direct with Safaricom:**
   - Visit Safaricom Business Center (not regular shop)
   - Apply for Paybill
   - More complex approval process
   - Timeline: 2-3 weeks

**Setup Fee:**
- Application: KES 2,000-5,000
- Monthly fee: KES 500-1,000 (some waive this)

**What You Get:**
- Paybill Number (e.g., **400200**)
- Business name on STK push: **"Haraka Wedges Supplies"**
- Paybill Passkey for API integration
- Account number support (order tracking)
- Advanced reporting portal

---

## 🔧 Technical Configuration

### Step 1: Get Your Numbers

After approval, you'll have:
- **Till Number:** 512345 (example)
- **Paybill Number:** 400200 (example)

### Step 2: Get API Credentials

Visit: https://developer.safaricom.co.ke

1. Create app for **Till Number**:
   - Name: "Haraka Till API"
   - Select: "Lipa Na M-Pesa Online"
   - Get: Consumer Key, Consumer Secret, Passkey

2. Create app for **Paybill Number**:
   - Name: "Haraka Paybill API"
   - Select: "Lipa Na M-Pesa Online"
   - Get: Consumer Key, Consumer Secret, Passkey

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# ==============================================
# DUAL TILL & PAYBILL CONFIGURATION
# ==============================================

# Supabase (same as before)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# M-Pesa Environment
MPESA_ENVIRONMENT=production  # Change from sandbox to production!

# TILL NUMBER - For Walk-in Sales
MPESA_TILL_NUMBER=512345  # Your actual Till Number
MPESA_TILL_PASSKEY=your_till_passkey_from_daraja

# PAYBILL NUMBER - For Deliveries
MPESA_PAYBILL_NUMBER=400200  # Your actual Paybill Number
MPESA_PAYBILL_PASSKEY=your_paybill_passkey_from_daraja

# Specify when to use Paybill (options: 'delivery', 'all', or leave empty for Till only)
MPESA_USE_PAYBILL_FOR=delivery

# Shared Configuration
MPESA_CONSUMER_KEY=your_consumer_key  # You might need separate keys for each
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_CALLBACK_URL=https://harakapos.yourdomain.com/api/mpesa/callback
MPESA_BUSINESS_NAME="Haraka Wedges Supplies"

# Note: You may need TWO sets of Consumer Keys if Till and Paybill 
# are registered as separate apps on Daraja portal
```

---

## 🔄 How It Works

### **Scenario 1: Customer Walks In (Till Number)**

```
1. Customer visits your processing location
2. Driver/Staff uses PDA terminal
3. Selects "Collect Payment on PDA"
4. Customer pays via M-Pesa to Till Number 512345
5. Payment confirmed
6. Receipt printed
```

**M-Pesa Flow:**
- Customer: Lipa na M-Pesa → Buy Goods → 512345
- OR: STK Push sent using Till credentials
- Business name shows: **"Haraka Wedges Supplies"**

---

### **Scenario 2: Delivery Order (Paybill Number)**

```
1. Driver delivers to customer
2. Driver opens delivery details
3. Clicks "Send M-Pesa Request"
4. System uses Paybill Number 400200
5. Customer receives STK push on their phone
6. Customer enters PIN
7. Payment confirmed with account number (order ID)
8. Receipt generated
```

**M-Pesa Flow:**
- System sends STK Push using Paybill credentials
- Account Reference: Order ID
- Business name shows: **"Haraka Wedges Supplies"**
- Customer sees their order number

**Alternative (Manual):**
- Customer: Lipa na M-Pesa → Pay Bill → 400200
- Account Number: Order ID
- Driver enters confirmation code in app

---

## 💻 Code Integration (Already Done!)

Your system is already configured to support this! Here's how it works:

### Environment Detection:
```typescript
// lib/mpesa.ts automatically detects your setup
if (MPESA_TILL_NUMBER && MPESA_PAYBILL_NUMBER) {
  // Dual setup detected
  if (context === 'delivery') {
    use PAYBILL  // For deliveries
  } else {
    use TILL     // For walk-in
  }
} else {
  // Single shortcode (Till OR Paybill)
  use MPESA_SHORTCODE
}
```

### Delivery Payments:
```typescript
// Automatically uses Paybill if configured
initiateMpesaSTKPush({
  phoneNumber: customer.phone,
  amount: orderTotal,
  context: 'delivery',  // ← This triggers Paybill usage
});
```

### Walk-in Payments:
```typescript
// Automatically uses Till if configured
initiateMpesaSTKPush({
  phoneNumber: customer.phone,
  amount: saleTotal,
  context: 'walkin',  // ← This triggers Till usage
});
```

---

## 📊 Payment Reconciliation

### Daily Reconciliation:

**End of Day Report:**
```
Till Number (512345) - Walk-in Sales:
- Transaction 1: KES 2,000
- Transaction 2: KES 3,500
- Transaction 3: KES 1,200
TOTAL: KES 6,700

Paybill (400200) - Deliveries:
- Order #ABC123: KES 4,000
- Order #ABC124: KES 2,500
- Order #ABC125: KES 5,000
TOTAL: KES 11,500

GRAND TOTAL: KES 18,200
```

### M-Pesa Statements:
- Till: Separate statement (walk-in transactions)
- Paybill: Separate statement (delivery transactions with account numbers)

---

## 🎨 Customer Experience

### Walk-in Customer Sees:
```
┌────────────────────────┐
│  Safaricom             │
│  Haraka Wedges         │
│  Supplies              │
│                        │
│  Pay KES 2,000.00     │
│  for 50kg Potatoes     │
│                        │
│  Enter M-Pesa PIN      │
│  [____]                │
│                        │
│  [Cancel]  [OK]        │
└────────────────────────┘
```

### Delivery Customer Sees:
```
┌────────────────────────┐
│  Safaricom             │
│  Haraka Wedges         │
│  Supplies              │
│                        │
│  Account: HWS123abc    │
│  Pay KES 4,000.00     │
│  for 100kg Potatoes    │
│                        │
│  Enter M-Pesa PIN      │
│  [____]                │
│                        │
│  [Cancel]  [OK]        │
└────────────────────────┘
```

**Notice:** Delivery shows account number for tracking!

---

## 🚀 Migration Plan

### Phase 1: Apply for Both Numbers (Week 1-2)
- [ ] Gather all required documents
- [ ] Visit Safaricom shop for Till Number application
- [ ] Visit bank/Safaricom Business for Paybill application
- [ ] Pay setup fees

### Phase 2: Receive Approval (Week 2-3)
- [ ] Receive Till Number (2-5 days)
- [ ] Receive Paybill Number (1-3 weeks)
- [ ] Test both numbers with personal phone

### Phase 3: API Integration (Week 3)
- [ ] Create apps on developer.safaricom.co.ke
- [ ] Get Consumer Keys and Passkeys for BOTH
- [ ] Update `.env.local` with both configurations
- [ ] Set `MPESA_ENVIRONMENT=production`

### Phase 4: Testing (Week 3-4)
- [ ] Test walk-in payment flow with Till
- [ ] Test delivery payment flow with Paybill
- [ ] Verify receipts generate correctly
- [ ] Check M-Pesa statements for both numbers

### Phase 5: Go Live! (Week 4)
- [ ] Train drivers on both payment methods
- [ ] Monitor first week of transactions
- [ ] Verify daily reconciliation
- [ ] Celebrate! 🎉

---

## 💡 Pro Tips

### 1. **Different Business Names** (Advanced)
You can register Till and Paybill with slightly different names:
- Till: "Haraka Wedges Shop"
- Paybill: "Haraka Wedges Delivery"

This helps customers know which channel they're using!

### 2. **Backup Strategy**
- If Paybill API fails, driver can still use PDA flow
- If Till is down, can use Paybill for walk-in too
- Always have both numbers visible at location

### 3. **Customer Communication**
Print on delivery notes:
```
PAY VIA M-PESA:
Paybill: 400200
Account: [Order Number]

OR

Wait for payment request on your phone
```

### 4. **Reconciliation Automation**
Your HarakaPOS system automatically tracks which number was used:
- Database stores payment method
- Reports show Till vs Paybill breakdown
- Admin dashboard shows both in real-time

---

## 📞 Support Contacts

**Till Number Issues:**
- Safaricom: 100
- Email: business@safaricom.co.ke

**Paybill Issues:**
- Your bank's M-Pesa support
- Safaricom Business: 0711049000

**API/Technical Issues:**
- Daraja Support: apisupport@safaricom.co.ke
- Portal: https://developer.safaricom.co.ke

---

## ✅ Checklist Summary

### Before You Start:
- [ ] Gather business documents (CR12, KRA PIN, ID)
- [ ] Open business bank account (if you don't have one)
- [ ] Get 3 months bank statements
- [ ] Have Safaricom line ready

### Till Number Application:
- [ ] Visit Safaricom shop
- [ ] Submit application with documents
- [ ] Pay KES 500-1,000 setup fee
- [ ] Wait 2-5 days for approval
- [ ] Receive Till Number

### Paybill Number Application:
- [ ] Visit bank or Safaricom Business
- [ ] Submit application with documents
- [ ] Pay KES 2,000-5,000 setup fee
- [ ] Wait 1-3 weeks for approval
- [ ] Receive Paybill Number

### API Configuration:
- [ ] Create Till app on developer.safaricom.co.ke
- [ ] Create Paybill app on developer.safaricom.co.ke
- [ ] Get credentials for both
- [ ] Update `.env.local` with all values
- [ ] Set production mode

### Testing:
- [ ] Test Till payment with your phone
- [ ] Test Paybill payment with your phone
- [ ] Verify both show correct business name
- [ ] Check receipts generate properly
- [ ] Test PDA manual flow
- [ ] Test STK Push flow

### Go Live:
- [ ] Train all drivers
- [ ] Print payment instructions for customers
- [ ] Monitor first transactions closely
- [ ] Set up daily reconciliation process

---

## 🎯 Expected Timeline

| Week | Activity | Deliverable |
|------|----------|-------------|
| Week 1 | Document gathering, applications | Applications submitted |
| Week 2 | Till approval, Paybill pending | Till Number received |
| Week 3 | Paybill approval, API setup | Both numbers active |
| Week 4 | Testing, training | Ready for production |
| Week 5 | Go live! | Accepting payments |

---

## 💰 Total Investment

| Item | Cost | Frequency |
|------|------|-----------|
| Till Setup | KES 500-1,000 | One-time |
| Paybill Setup | KES 2,000-5,000 | One-time |
| Paybill Monthly | KES 500-1,000 | Monthly (some waive) |
| Transaction Fees | 0% | Forever |
| **TOTAL SETUP** | **KES 2,500-6,000** | **One-time** |

**Return on Investment:** Professional payment system, better tracking, scalable for growth!

---

## 🎉 You're Ready!

With this dual setup, Haraka Wedges Supplies will have:
- ✅ Professional payment processing
- ✅ Separate tracking for walk-in vs delivery
- ✅ Better reconciliation
- ✅ Scalable for multiple locations
- ✅ Customer confidence

**Next Step:** Start gathering your documents and schedule a visit to Safaricom! 🚀

Questions? Your HarakaPOS system is already configured to support this - just add the credentials when you receive them!
