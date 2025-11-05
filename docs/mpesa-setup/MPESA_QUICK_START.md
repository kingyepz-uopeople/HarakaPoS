# Quick Start: M-Pesa Setup for Haraka Wedges Supplies

## 🎯 What You're Doing Now (Sandbox)

✅ **Status:** Building and testing
✅ **Business name shows:** "Test Business" (normal for sandbox)
✅ **Cost:** FREE
✅ **Real money:** NO (test mode only)

### Current Configuration:
```env
MPESA_ENVIRONMENT=sandbox
MPESA_SHORTCODE=174379
```

**This is PERFECT for development!** Build your entire app, test everything, no costs.

---

## 🚀 When You're Ready to Launch (2 Simple Options)

### **Option 1: M-Pesa Till Number** ⭐ Recommended

**What you get:**
- Business name shows: **"Haraka Wedges Supplies"** ✅
- No transaction fees (0%)
- Full control
- One-time cost: KES 500-1,000

**How to apply:**
1. Go to any **Safaricom shop** with:
   - Business registration certificate (OR business permit)
   - KRA PIN certificate
   - Your ID copy
   
2. Ask for: **"Lipa Na M-Pesa Till Number"**

3. They'll give you:
   - Till Number (e.g., 5123456)
   - Production credentials for Daraja API

4. Update your `.env.local`:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_SHORTCODE=5123456  # Your new Till Number
   MPESA_PASSKEY=your_new_passkey
   ```

**Timeline:** 2-5 business days

---

### **Option 2: Payment Aggregator** ⭐ Fastest

**Best services for Kenya:**
- **Intasend** - https://intasend.com (easiest setup)
- **Pesapal** - https://pesapal.com (most popular)

**What you get:**
- Business name shows: **"Haraka Wedges Supplies"** ✅
- Setup time: 1-2 days
- Transaction fee: 2-3%
- Less paperwork

**How to setup:**
1. Sign up on their website
2. Provide business details
3. Get API keys
4. Replace our M-Pesa code with their SDK
5. Done!

**When to choose this:**
- Need to launch within 2 days
- Don't want to manage API complexity
- OK with small transaction fee

---

## 📱 What Customer Will See

### NOW (Sandbox):
```
Pay KES 2,000
to Test Business
for 50kg Potatoes
```

### AFTER SETUP (Production):
```
Pay KES 2,000
to Haraka Wedges Supplies  ← Your business name!
for 50kg Potatoes
```

---

## ✅ My Recommendation

**Do this NOW:**
1. ✅ Keep building with sandbox (you're on the right track!)
2. ✅ Test all features with test phone numbers
3. ✅ Perfect your app

**Before launch (when ready):**
1. Decide: Till Number (cheaper, more control) OR Aggregator (faster, easier)
2. If Till Number: Visit Safaricom shop with documents
3. If Aggregator: Sign up online
4. Get production credentials
5. Update `.env.local`
6. Test with small amount
7. Launch! 🎉

---

## 🆘 Quick Contacts

**For Till Number:**
- Call: **100** (Safaricom)
- Visit: **Any Safaricom shop**
- Say: "I need Lipa Na M-Pesa Till Number for my business"

**For Aggregators:**
- Intasend: support@intasend.com
- Pesapal: support@pesapal.com

**For API Help:**
- Daraja Portal: https://developer.safaricom.co.ke
- Email: apisupport@safaricom.co.ke

---

## 💰 Cost Comparison

| What | Till Number | Aggregator |
|------|-------------|------------|
| Setup Cost | KES 500-1K | Free |
| Per Transaction | 0% | 2-3% |
| On KES 2,000 sale | KES 0 | KES 40-60 |
| On KES 100,000/month | KES 0 | KES 2-3K |

---

## 🎓 Bottom Line

**The business name issue** = You need a Till Number (or use an aggregator)

**For now:** Keep using sandbox - it works perfectly for development

**Before customers use it:** Get Till Number (costs KES 500, takes 5 days)

**Result:** "Haraka Wedges Supplies" shows on every payment! 🎯

---

Don't stress about this now - finish building your app first, then get the Till Number when you're ready to launch! 💚
