# eTIMS Integration Setup Guide
**KRA Tax Compliance System for HarakaPOS**

## ✅ What's Been Implemented

### 1. Database Schema ✅
- **etims_config**: Stores KRA credentials and settings
- **etims_invoices**: Tax invoice records
- **etims_invoice_items**: Invoice line items
- **etims_sync_log**: API communication logs

### 2. API Integration ✅
- **KRA eTIMS API Client**: Handles all KRA communication
- **Device Initialization**: Register your Control Unit with KRA
- **Invoice Submission**: Automatic tax invoice generation
- **QR Code Generation**: Verification codes for receipts

### 3. User Interface ✅
- **eTIMS Dashboard**: Overview of invoices and compliance
- **Configuration Page**: Set up KRA credentials and preferences
- **Invoices Page**: View, submit, and retry invoices
- **Receipt Template**: Tax-compliant receipts with QR codes

### 4. Automation ✅
- **Auto-create invoices** when sales are completed
- **Auto-submit to KRA** (if enabled)
- **Retry failed invoices** automatically
- **Offline support** (queues invoices when offline)

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Open **Supabase Dashboard** → SQL Editor
2. Copy the entire contents of `supabase/migrations/etims-integration.sql`
3. Paste and run in SQL Editor
4. Verify tables created:
   - etims_config
   - etims_invoices
   - etims_invoice_items
   - etims_sync_log

### Step 2: Get KRA Credentials

You need these from KRA:

1. **KRA PIN**: Your business tax PIN
2. **TIN (optional)**: Tax Identification Number
3. **Control Unit Serial Number**: From your KRA-registered device
4. **Branch ID**: Usually "00" for main branch

**How to get Control Unit:**
- Visit KRA eTIMS portal: https://etims.kra.go.ke
- Login with your KRA PIN
- Register a new Control Unit (virtual device)
- Get the serial number

### Step 3: Configure eTIMS in HarakaPOS

1. Go to **eTIMS (Tax) → Configuration** in the sidebar
2. Fill in your business details:
   - Business Name: Haraka Wedges Supplies
   - KRA PIN: [Your KRA PIN]
   - Control Unit Serial: [From KRA portal]
   - Branch ID: 00
3. Set invoice preferences:
   - Invoice Prefix: INV (or your choice)
   - Default VAT Rate: 16 (Kenya standard rate)
4. Enable options:
   - ✅ Enable eTIMS Integration
   - ✅ Auto-submit invoices to KRA
   - ✅ Print QR codes on receipts
   - ⚠️ Require internet connection (for safety)
5. **Important**: Start with **Sandbox Environment** for testing
6. Click **Save Configuration**

### Step 4: Initialize Device with KRA

1. After saving configuration, click **Initialize Device**
2. This registers your Control Unit with KRA
3. Status should change to "Active"
4. You're now ready to submit invoices!

### Step 5: Test with Sample Sale

1. Go to **Sales** page
2. Create a test sale (small amount)
3. Complete the sale
4. Go to **eTIMS → Invoices** to see the invoice
5. If auto-submit is enabled, invoice submits automatically
6. Check status: Should be "Approved" if successful

---

## 📋 How It Works

### When You Make a Sale:

```
1. Sale completed in POS
   ↓
2. eTIMS invoice created automatically
   ↓
3. Invoice submitted to KRA (if online & auto-submit enabled)
   ↓
4. KRA approves and returns verification number
   ↓
5. QR code generated for receipt
   ↓
6. Receipt printed with tax details and QR code
```

### Invoice Status Flow:

- **Pending**: Created but not submitted yet
- **Approved**: Submitted and approved by KRA ✅
- **Failed**: Submission attempt failed (will retry)
- **Rejected**: KRA rejected the invoice ❌

---

## 🔧 Configuration Options

### Environment Modes:
- **Sandbox**: For testing (use KRA sandbox API)
- **Production**: For real transactions (live KRA API)

### Invoice Settings:
- **Auto-submit**: Automatically send to KRA when sale completes
- **Require internet**: Block sales if offline (ensures compliance)
- **Print QR codes**: Add verification QR to receipts
- **VAT Rate**: Default 16% (Kenya standard)

### Retry Logic:
- Failed invoices retry automatically (max 3 attempts)
- Manual retry available on Invoices page
- Background process retries pending invoices

---

## 📱 Receipt Features

Your eTIMS receipts include:

- ✅ Business details and KRA PIN
- ✅ Invoice number (auto-generated)
- ✅ KRA receipt number (from KRA)
- ✅ Itemized list with quantities and prices
- ✅ VAT breakdown (subtotal, VAT, total)
- ✅ QR code for KRA verification
- ✅ Digital signature from KRA
- ✅ Payment method
- ✅ Date and time

**58mm thermal printer support** - optimized for your PDA terminals!

---

## ⚠️ Important Notes

### Before Going Live:

1. ✅ **Test in sandbox first!**
2. ✅ Get real Control Unit from KRA
3. ✅ Verify your KRA PIN is active
4. ✅ Ensure stable internet connection
5. ✅ Train staff on the system

### Compliance Requirements:

- All sales **MUST** have eTIMS invoices (Kenya law)
- Keep internet connection stable for KRA submissions
- Backup invoices regularly
- Print QR codes on all receipts
- Keep Control Unit status "Active"

### What If Offline?

- Invoices are **queued automatically**
- Submit when back online (manual or auto-retry)
- Sales can continue (if "Require internet" is disabled)
- Warning: May be out of compliance until submitted

---

## 🐛 Troubleshooting

### "Device not initialized"
→ Go to Configuration page, click "Initialize Device"

### "Submission failed"
→ Check internet connection
→ Verify KRA credentials are correct
→ Check KRA portal status
→ Try manual submit from Invoices page

### "Invoice rejected by KRA"
→ Check error message in invoice details
→ Common issues: Invalid TIN, wrong date format, incorrect amounts
→ Fix the issue and retry

### Invoices stuck in "Pending"
→ Go to **eTIMS → Invoices**
→ Click "Retry Failed" button
→ Or submit individually

---

## 📊 Monitoring Compliance

### Dashboard Metrics:
- Total invoices created
- Approved vs pending
- Compliance rate (should be 100%)
- Failed submissions needing attention

### Best Practices:
1. Check dashboard daily
2. Ensure all invoices are approved
3. Retry failed submissions immediately
4. Keep Control Unit active
5. Update KRA credentials if they change

---

## 🔄 Migration Path

### Current State:
- Old sales: No eTIMS invoices
- New sales: Auto-create invoices

### Options:
1. **Going forward only**: Only new sales get invoices (recommended)
2. **Backfill**: Create invoices for old sales (complex, consult KRA)

**Recommendation**: Start fresh from go-live date. Mark date in system.

---

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Get KRA credentials
3. ✅ Configure in sandbox mode
4. ✅ Initialize device
5. ✅ Test with sample sales
6. ✅ Verify receipts print correctly
7. ✅ Switch to production when ready
8. ✅ Train your team

---

## 📞 Support

### KRA eTIMS Support:
- Portal: https://etims.kra.go.ke
- Email: etims@kra.go.ke
- Phone: KRA helpline

### HarakaPOS Support:
- Check logs in: **eTIMS → Sync Logs**
- Error details in: **eTIMS → Invoices**
- Configuration help: **eTIMS → Configuration**

---

## 🔐 Security Notes

- KRA PIN is encrypted in database
- API calls use HTTPS only
- Receipts use digital signatures
- QR codes prevent tampering
- Audit trail in sync_log table

---

## ✨ Features Coming Soon

- 📱 Barcode delivery tracking
- 📊 Enhanced tax reports
- 📧 Email receipts with QR codes
- 📱 Mobile app integration
- 🔔 Compliance alerts

---

**You're ready! Start testing in sandbox mode! 🚀**
