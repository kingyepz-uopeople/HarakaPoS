# ⚡ Quick Start: eTIMS Setup (15 minutes)

## Step 1: Run Migration (2 minutes)
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open file: `supabase/migrations/etims-integration.sql`
4. Copy **ALL** content (356 lines)
5. Paste and click **Run**
6. ✅ Should say "Success"

## Step 2: Get KRA Sandbox Credentials (5 minutes)
1. Visit: https://etims-sbx.kra.go.ke (sandbox)
2. Register or login with your KRA PIN
3. Go to **Control Units** section
4. Click **Register New Device**
5. Fill in:
   - Device Name: HarakaPOS-Test
   - Device Type: Virtual
6. Get your **Control Unit Serial Number**
7. Save it! You'll need it next.

## Step 3: Configure HarakaPOS (3 minutes)
1. Open HarakaPOS
2. Go to **eTIMS (Tax) → Configuration**
3. Fill in:
   ```
   Business Name: Haraka Wedges Supplies
   KRA PIN: [Your KRA PIN]
   TIN: [Your TIN if different]
   Business Type: Sole Proprietorship
   
   Control Unit Serial: [From Step 2]
   Branch ID: 00
   
   Environment: ✅ Sandbox (for testing!)
   Invoice Prefix: INV
   Default VAT Rate: 16
   
   ✅ Enable eTIMS Integration
   ✅ Auto-submit invoices to KRA
   ✅ Print QR codes on receipts
   ⚠️ Require internet (uncheck for now)
   ```
4. Click **Save Configuration**

## Step 4: Initialize Device (1 minute)
1. On the same Configuration page
2. Click **Initialize Device** button
3. Wait for KRA response (5-10 seconds)
4. ✅ Status should change to "Active"
5. If failed: Check credentials and try again

## Step 5: Test Sale (4 minutes)
1. Go to **Sales** page
2. Create a test sale:
   ```
   Customer: Walk-in Customer (or select existing)
   Quantity: 1 kg
   Price: 120
   Payment: Cash
   ```
3. Click **Record Sale**
4. Sale should complete successfully

## Step 6: Verify Invoice Created
1. Go to **eTIMS (Tax) → Invoices**
2. You should see your test invoice
3. Check status:
   - ✅ "Approved" = Success! KRA accepted it
   - ⏳ "Pending" = Waiting to submit
   - ❌ "Failed" = Click to see error
4. If approved, you'll see:
   - Invoice number (e.g., INV0001)
   - KRA receipt number
   - QR code data

## Step 7: View Receipt
1. On Invoices page
2. Click the 👁️ (eye icon) for your test invoice
3. Receipt should show:
   - Business name and KRA PIN
   - Invoice details
   - Items with VAT breakdown
   - QR code (if approved)
4. Click **Print Receipt** to test

---

## ✅ Success Checklist

After completing above steps, verify:

- [ ] Migration ran without errors
- [ ] Configuration saved successfully
- [ ] Device status shows "Active"
- [ ] Test sale created successfully
- [ ] Invoice appears in eTIMS → Invoices
- [ ] Invoice status is "Approved"
- [ ] Receipt displays correctly
- [ ] QR code appears on receipt

---

## 🐛 Common Issues

### "Device initialization failed"
**Fix:** 
- Check KRA PIN is correct
- Verify Control Unit serial number
- Ensure you're using sandbox credentials
- Check internet connection

### Invoice status "Pending"
**Fix:**
- Click "Retry Failed" button
- Check internet connection
- Verify device is initialized
- Look for error message

### No invoice created after sale
**Fix:**
- Check eTIMS is enabled in Configuration
- Look at browser console for errors
- Verify migration ran successfully
- Check sale actually completed

### "Failed to generate invoice number"
**Fix:**
- Migration may not have run
- Run migration again
- Check function exists: `generate_etims_invoice_number`

---

## 🎯 Next Steps

Once everything works in **Sandbox**:

1. ⏸️ **Don't rush to production!**
2. Test more scenarios:
   - Different payment methods
   - Multiple items
   - Offline mode
   - Retry failed invoices
3. Train your staff
4. Document any issues
5. When ready, switch to production:
   - Get production Control Unit
   - Update credentials
   - Change environment to "Production"
   - Re-initialize device
   - Test again!

---

## 📞 Need Help?

**KRA Sandbox Issues:**
- Email: etims@kra.go.ke
- Phone: KRA helpline

**HarakaPOS Issues:**
- Check: eTIMS → Dashboard for statistics
- Check: Browser console (F12) for errors
- Check: Database logs in Supabase

---

**You're ready! Start with Step 1! 🚀**
