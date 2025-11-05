# 🚀 Action Plan: Dual Till & Paybill Setup
## Haraka Wedges Supplies - Get Started Today!

---

## 📋 Step 1: Gather Documents (Do This Today!)

### Documents You Need:
- [ ] **Business Registration Certificate (CR12)** OR **Business Permit**
  - Find it: Your business registration documents
  - Make copies: 2-3 certified copies
  
- [ ] **KRA PIN Certificate**
  - Get from: KRA iTax portal or KRA office
  - If you don't have: Apply at https://itax.kra.go.ke
  
- [ ] **National ID (Owner/Director)**
  - Make copies: 2-3 copies
  
- [ ] **Passport Photos**
  - Get: 4 passport-size photos
  - Where: Any photo studio
  
- [ ] **Business Bank Account** (for Paybill only)
  - If you don't have: Open one this week
  - Recommended: KCB, Equity, Co-op Bank (have M-Pesa integration)
  
- [ ] **Bank Statements (3 months)** (for Paybill only)
  - Request from your bank
  - Show business activity

---

## 📍 Step 2: Apply for Till Number (This Week!)

### Where to Go:
**Any Safaricom Shop** - Find nearest: https://www.safaricom.co.ke/contact-us/shops

### What to Say:
"I want to apply for **Lipa Na M-Pesa Till Number** for my business"

### What to Bring:
- [ ] Business Registration Certificate (OR Business Permit)
- [ ] KRA PIN Certificate  
- [ ] National ID (original + copy)
- [ ] Passport photo (1)
- [ ] Your Safaricom line (or any line you want to use)
- [ ] Cash: KES 500-1,000 for setup fee

### At the Shop:
1. Fill out application form (10 minutes)
2. Submit documents
3. Pay setup fee
4. Get receipt and reference number

### Timeline:
- **Application processed:** 2-5 business days
- **You'll receive:** SMS with your Till Number
- **Example:** Till Number 512345

### What Happens Next:
- Safaricom activates your Till Number
- You receive M-Pesa notifications for every payment
- Your business name appears on customer payments

---

## 🏦 Step 3: Apply for Paybill Number (This Week or Next!)

### Option A: Through Your Bank (Easier)

**Which Banks Support M-Pesa:**
- KCB Bank
- Equity Bank
- Co-operative Bank
- Barclays/Absa
- Standard Chartered
- Most major banks

**Steps:**
1. [ ] Visit your business bank branch
2. [ ] Ask for: **"M-Pesa Paybill integration for my business"**
3. [ ] Submit documents:
   - Business Registration Certificate
   - KRA PIN Certificate
   - National ID
   - Bank statement (3 months)
   - Passport photos (2)
4. [ ] Fill out application form
5. [ ] Pay setup fee: KES 2,000-5,000
6. [ ] Bank coordinates with Safaricom

**Timeline:** 1-2 weeks

---

### Option B: Direct with Safaricom (More Control)

**Where to Go:**
**Safaricom Business Center** (NOT regular shop)
- Nairobi: Safaricom House, Waiyaki Way
- Other cities: Major Safaricom Business Centers
- Call first: 0711049000

**What to Bring:**
- [ ] Business Registration Certificate
- [ ] KRA PIN Certificate
- [ ] National ID (original + copy)
- [ ] Business bank account details
- [ ] Bank statement (3 months)
- [ ] Letter from bank (request from bank)
- [ ] Passport photos (2-3)
- [ ] Cash/Card: KES 2,000-5,000

**Timeline:** 2-3 weeks

---

## 🔑 Step 4: Get API Credentials (After Approval)

### When You Receive Your Numbers:
You'll get SMS with:
- Till Number: e.g., **512345**
- Paybill Number: e.g., **400200**

### Register on Daraja Portal:

**Visit:** https://developer.safaricom.co.ke

1. [ ] **Create Account**
   - Click "Sign Up"
   - Use business email
   - Verify email

2. [ ] **Create App for Till Number**
   - Click "Add New App"
   - Name: "Haraka Till API"
   - Select: "Lipa Na M-Pesa Online"
   - Choose: Production
   - Submit

3. [ ] **Get Till Credentials**
   - Consumer Key: `ABC123...`
   - Consumer Secret: `XYZ789...`
   - **Go to Test Credentials** → Copy **Passkey**
   - Save these!

4. [ ] **Create App for Paybill Number**
   - Click "Add New App"
   - Name: "Haraka Paybill API"  
   - Select: "Lipa Na M-Pesa Online"
   - Choose: Production
   - Submit

5. [ ] **Get Paybill Credentials**
   - Consumer Key: `DEF456...`
   - Consumer Secret: `UVW012...`
   - **Go to Test Credentials** → Copy **Passkey**
   - Save these!

---

## ⚙️ Step 5: Configure Your System

### Update Environment Variables:

1. [ ] **Copy .env.example to .env.local**
   ```bash
   cp .env.example .env.local
   ```

2. [ ] **Edit .env.local** - Add your credentials:

```env
# Change environment to production
MPESA_ENVIRONMENT=production

# Remove or comment out sandbox config
# MPESA_SHORTCODE=174379

# Add Till Number configuration
MPESA_TILL_NUMBER=512345                    # Your actual Till Number
MPESA_TILL_PASSKEY=your_till_passkey        # From Daraja portal

# Add Paybill Number configuration
MPESA_PAYBILL_NUMBER=400200                 # Your actual Paybill Number
MPESA_PAYBILL_PASSKEY=your_paybill_passkey  # From Daraja portal

# Use Paybill for deliveries
MPESA_USE_PAYBILL_FOR=delivery

# API Credentials (you might need separate for each)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret

# Callback URL (your domain)
MPESA_CALLBACK_URL=https://harakapos.yourdomain.com/api/mpesa/callback

# Business Name
MPESA_BUSINESS_NAME="Haraka Wedges Supplies"
```

3. [ ] **Save file**

---

## 🧪 Step 6: Test Everything

### Test Till Number:
1. [ ] Open your app
2. [ ] Create a test walk-in order
3. [ ] Use PDA payment flow
4. [ ] Enter your own phone number
5. [ ] Confirm STK push received
6. [ ] Enter PIN
7. [ ] Verify payment recorded
8. [ ] Check business name shows: "Haraka Wedges Supplies"

### Test Paybill Number:
1. [ ] Open your app
2. [ ] Create a test delivery order
3. [ ] Click "Send M-Pesa Request"
4. [ ] Enter your phone number
5. [ ] Confirm STK push received
6. [ ] Verify account number shows (order ID)
7. [ ] Enter PIN
8. [ ] Verify payment recorded
9. [ ] Check business name shows: "Haraka Wedges Supplies"

### Manual Paybill Test:
1. [ ] Go to M-Pesa menu on your phone
2. [ ] Select: Pay Bill
3. [ ] Enter Paybill: 400200
4. [ ] Enter Account: TEST123
5. [ ] Enter Amount: 50
6. [ ] Confirm
7. [ ] Verify you receive M-Pesa notification

---

## 👨‍🏫 Step 7: Train Your Team

### Driver Training Checklist:
- [ ] Show both payment methods (Till vs Paybill)
- [ ] Explain when to use each:
  - **Till**: Walk-in customers, PDA terminal
  - **Paybill**: Deliveries, remote payments
- [ ] Practice STK Push flow
- [ ] Practice PDA manual entry flow
- [ ] Show how to handle failed payments
- [ ] Explain receipt printing

### Print Instructions for Drivers:
```
PAYMENT METHODS:

OPTION 1: Send M-Pesa Request
- Click "Send M-Pesa Request"
- Customer receives prompt on their phone
- Customer enters PIN
- Done!

OPTION 2: Collect on PDA
- Click "Collect Payment on PDA"
- Customer pays via M-Pesa
- Enter confirmation code
- Print receipt

PAYBILL NUMBER: 400200
(Customer can pay manually using this)
```

---

## 📊 Step 8: Monitor & Reconcile

### Daily Checklist:
- [ ] Check M-Pesa messages for Till Number
- [ ] Check M-Pesa messages for Paybill Number
- [ ] Compare with HarakaPOS records
- [ ] Verify all payments recorded
- [ ] Generate daily report

### Weekly Checklist:
- [ ] Download M-Pesa statements (Till)
- [ ] Download M-Pesa statements (Paybill)
- [ ] Reconcile with bank deposits
- [ ] Review failed transactions
- [ ] Check for discrepancies

---

## 💰 Cost Summary

| Item | Cost | When |
|------|------|------|
| Till Number Setup | KES 500-1,000 | One-time |
| Paybill Setup | KES 2,000-5,000 | One-time |
| Paybill Monthly Fee | KES 500-1,000 | Monthly (varies) |
| Transaction Fees | 0% | Forever |
| **TOTAL SETUP** | **KES 2,500-6,000** | **One-time** |

**Worth it?** YES! Professional payment system, better tracking, scalable growth 🚀

---

## 📅 Timeline

| Week | Action | Status |
|------|--------|--------|
| **Week 1** | Gather documents, apply for Till | ⏳ |
| **Week 2** | Till approved, apply for Paybill | ⏳ |
| **Week 3** | Paybill approved, API setup | ⏳ |
| **Week 4** | Testing, training | ⏳ |
| **Week 5** | GO LIVE! 🎉 | ⏳ |

---

## 📞 Important Contacts

**Till Number Support:**
- Call: **100** (Safaricom)
- SMS: "TILL" to 100
- Email: business@safaricom.co.ke

**Paybill Support:**
- Your bank's M-Pesa department
- OR Safaricom Business: 0711049000
- Email: business@safaricom.co.ke

**API/Technical Support:**
- Email: apisupport@safaricom.co.ke
- Portal: https://developer.safaricom.co.ke
- Phone: 0722000000

**Emergency (Payment Issues):**
- Safaricom: 100 or 0722000000
- Available: 24/7

---

## ✅ Quick Start Today

### What You Can Do RIGHT NOW:

1. **[ ] Gather Documents** (2 hours)
   - Find your business registration
   - Get KRA PIN certificate
   - Make ID copies
   - Take passport photos

2. **[ ] Visit Safaricom Shop** (Tomorrow)
   - Apply for Till Number
   - Pay KES 500-1,000
   - Get reference number

3. **[ ] Contact Your Bank** (This Week)
   - Schedule appointment
   - Ask about Paybill application
   - Request bank statements

4. **[ ] Read Documentation** (This Evening)
   - Read: `docs/DUAL_TILL_PAYBILL_SETUP.md`
   - Understand the flow
   - Prepare questions

---

## 🎯 Success Criteria

You'll know you're successful when:
- ✅ Customers see "Haraka Wedges Supplies" on payments
- ✅ Walk-in payments go to Till Number
- ✅ Delivery payments go to Paybill Number
- ✅ Order IDs automatically tracked in Paybill
- ✅ Daily reconciliation is easy
- ✅ Drivers confidently handle both payment types
- ✅ No payment discrepancies
- ✅ Professional business image

---

## 🚀 You're Ready!

**First Step:** Gather your documents TODAY and visit Safaricom shop TOMORROW!

Your HarakaPOS system is **already configured** to support dual Till/Paybill setup. Just add the credentials when you get them, and you're live! 🎉

**Questions?** Everything is already built and ready. Just follow this checklist! 💪

---

**Document Version:** 1.0  
**Last Updated:** November 4, 2025  
**For:** Haraka Wedges Supplies  
**System:** HarakaPOS v2.0
