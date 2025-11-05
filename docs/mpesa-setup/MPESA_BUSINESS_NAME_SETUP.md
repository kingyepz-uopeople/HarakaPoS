# M-Pesa Business Name Setup
## How to Show "Haraka Wedges Supplies" on Customer's Phone

---

## The Problem
When customers receive your M-Pesa STK push payment request, the **business name they see is tied to your Till/Paybill number** - you cannot customize it via the API alone.

In sandbox mode, they see: **"Test Business"** or **"Safaricom"**

In production, they see: **Whatever name is registered to your Till/Paybill**

---

## ✅ Solution Options

### **Option 1: M-Pesa Till Number** (Recommended) ⭐

**Best for:** Small to medium businesses accepting payments

**How it works:**
- You get a unique Till Number (e.g., 5123456)
- Customers pay using: **Lipa na M-Pesa → Buy Goods → Enter Till Number**
- Your business name appears on their confirmation SMS and STK push

**How to apply:**
1. Visit: https://www.safaricom.co.ke/personal/m-pesa/lipa-na-mpesa
2. Click "Apply for Lipa Na M-Pesa"
3. Fill in business details

**Requirements:**
- ✅ Business registration certificate OR business permit
- ✅ KRA PIN certificate
- ✅ ID copy
- ✅ Safaricom line (can be personal)

**Cost:**
- One-time setup: KES 500 - 1,000
- No monthly fees
- No transaction fees (you receive full amount)

**Timeline:** 2-5 business days

**What you get:**
- Till Number (your MPESA_SHORTCODE)
- Business name shows as: **"Haraka Wedges Supplies"**
- Customers see your name on STK push
- Receive M-Pesa messages for each payment

---

### **Option 2: M-Pesa Paybill**

**Best for:** Larger businesses with multiple accounts/departments

**How it works:**
- Similar to Till Number but with more features
- Supports account numbers (customer tracking)
- More complex reporting

**Requirements:**
- Business bank account
- Higher documentation requirements
- Apply through your bank or Safaricom Business

**Cost:** Higher setup fees

**Note:** Unless you need the advanced features, **Till Number is simpler and cheaper**.

---

### **Option 3: Payment Aggregator** (Easiest!) ⭐

**Best for:** Quick setup, minimal paperwork

**Services:**
- [Pesapal](https://www.pesapal.com/) - Popular in Kenya
- [Flutterwave](https://flutterwave.com/) - Pan-African
- [Intasend](https://intasend.com/) - Kenya-focused
- [DPO Pay](https://www.dpopay.com/) - East Africa

**How it works:**
1. Sign up with the aggregator
2. Provide business details
3. Get API credentials
4. Your business name shows correctly
5. They handle all M-Pesa integration

**Pros:**
- ✅ No Till/Paybill needed
- ✅ Faster setup (1-2 days)
- ✅ Your business name shows correctly
- ✅ Multiple payment methods (cards, bank, etc.)
- ✅ Better reporting dashboards
- ✅ Less paperwork

**Cons:**
- ❌ Transaction fee: 2-3% per payment
- ❌ Slight delay in receiving funds (1-3 days)

**Cost:**
- Free to setup
- 2-3% per transaction (e.g., KES 60 on KES 2,000)

---

### **Option 4: M-Pesa Sandbox** (Current Setup)

**Best for:** Testing and development only

**What happens:**
- Business name shows as: **"Test Business"** or **"Safaricom"**
- No real money transfers
- Perfect for building your app

**Limitations:**
- ❌ Cannot customize business name
- ❌ Test mode only
- ❌ Can't accept real payments

**When to use:** Development phase (now!)

---

## 📊 Comparison Table

| Feature | Till Number | Paybill | Aggregator | Sandbox |
|---------|-------------|---------|------------|---------|
| **Setup Time** | 2-5 days | 1-2 weeks | 1-2 days | Instant |
| **Setup Cost** | KES 500-1K | Higher | Free | Free |
| **Transaction Fee** | 0% | 0% | 2-3% | N/A |
| **Business Name** | ✅ Custom | ✅ Custom | ✅ Custom | ❌ Generic |
| **Paperwork** | Medium | High | Low | None |
| **Real Payments** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Best For** | Most businesses | Large corps | Quick start | Testing |

---

## 🚀 Recommended Path for Haraka Wedges Supplies

### **Phase 1: NOW (Development)**
✅ Use M-Pesa Sandbox
- Build and test your app
- No costs, no paperwork
- Business name shows as "Test Business" (that's OK for testing)

### **Phase 2: Before Launch (Production)**
Choose ONE:

**Option A: Till Number** (if you want to own everything)
- Apply for M-Pesa Till Number
- Cost: KES 500-1,000 one-time
- Timeline: 5 days
- Your business name shows perfectly
- No transaction fees

**Option B: Payment Aggregator** (if you want speed and simplicity)
- Sign up with Pesapal or Intasend
- Timeline: 1-2 days
- Your business name shows perfectly
- Small transaction fee (2-3%)

---

## 🔧 Technical Integration

### Current Setup (Sandbox):
```env
MPESA_ENVIRONMENT=sandbox
MPESA_SHORTCODE=174379  # Sandbox test shortcode
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

Customer sees: **"Test Business"**

---

### Production Setup (Till Number):
```env
MPESA_ENVIRONMENT=production
MPESA_SHORTCODE=5123456  # Your actual Till Number
MPESA_PASSKEY=your_production_passkey_from_daraja
MPESA_CALLBACK_URL=https://harakapos.com/api/mpesa/callback
```

Customer sees: **"Haraka Wedges Supplies"** ✅

---

### Production Setup (Aggregator - Example: Intasend):
Replace M-Pesa direct integration with aggregator's SDK:

```typescript
// Instead of lib/mpesa.ts, use their SDK
import { IntaSend } from 'intasend-node';

const intasend = new IntaSend({
  publishableKey: process.env.INTASEND_PUBLIC_KEY,
  secretKey: process.env.INTASEND_SECRET_KEY,
});

// Send STK Push
const response = await intasend.send({
  amount: 2000,
  phone_number: "254712345678",
  api_ref: "ORDER123",
});
```

Customer sees: **"Haraka Wedges Supplies"** ✅

---

## 📱 What Customer Sees

### Sandbox (Current):
```
┌────────────────────────┐
│  Safaricom             │
│  Test Business         │
│                        │
│  Pay KES 2,000.00     │
│  for Order #123        │
│                        │
│  Enter M-Pesa PIN      │
│  [____]                │
│                        │
│  [Cancel]  [OK]        │
└────────────────────────┘
```

### Production with Till Number:
```
┌────────────────────────┐
│  Safaricom             │
│  Haraka Wedges         │
│  Supplies              │
│                        │
│  Pay KES 2,000.00     │
│  for Order #123        │
│                        │
│  Enter M-Pesa PIN      │
│  [____]                │
│                        │
│  [Cancel]  [OK]        │
└────────────────────────┘
```

---

## 💡 My Recommendation for You

**Start:** Use sandbox now (free, instant)
**Launch:** Apply for **M-Pesa Till Number** (best value, full control)
**Alternative:** Use **Intasend** or **Pesapal** if you need to launch within 2 days

The Till Number gives you:
- ✅ Professional appearance ("Haraka Wedges Supplies")
- ✅ No ongoing fees
- ✅ Full control
- ✅ Direct integration
- ✅ One-time setup cost (KES 500-1K)

---

## 📞 Getting Help

**M-Pesa Till Number Support:**
- Call: 100 (Safaricom)
- Email: business@safaricom.co.ke
- Visit: Any Safaricom shop

**M-Pesa Daraja API Support:**
- Portal: https://developer.safaricom.co.ke
- Email: apisupport@safaricom.co.ke

**Payment Aggregators:**
- Pesapal: support@pesapal.com
- Intasend: support@intasend.com
- Flutterwave: support@flutterwave.com

---

## ✅ Action Items

- [ ] Continue building with sandbox (you're doing this now)
- [ ] Decide: Till Number OR Aggregator
- [ ] If Till Number: Gather documents (business cert, KRA PIN, ID)
- [ ] If Till Number: Visit Safaricom shop or apply online
- [ ] If Aggregator: Sign up with Pesapal/Intasend
- [ ] Get production credentials
- [ ] Update .env.local with production values
- [ ] Test with small amount first
- [ ] Launch! 🚀

---

**Questions?** The sandbox works perfectly for now. When you're ready to go live, we'll switch to production credentials and your business name will appear correctly! 💚
