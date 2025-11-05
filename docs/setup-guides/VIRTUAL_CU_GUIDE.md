# 🖥️ Virtual Control Unit (CU) Guide

Complete guide to using Virtual CU for eTIMS without physical hardware

---

## ⚡ Quick Start (5 Minutes)

### What is a Virtual CU?

A **Virtual Control Unit** is a software-based alternative to physical KRA hardware that allows you to:
- ✅ Test eTIMS integration without buying hardware
- ✅ Use eTIMS in sandbox environment
- ✅ Generate tax invoices immediately
- ✅ Develop and test your system
- ✅ Save costs during development/testing phase

---

## 🎯 Virtual CU vs Physical CU

### Virtual Control Unit (Virtual CU)
**Best for:**
- 🧪 Testing and development
- 📚 Learning eTIMS
- 💰 Cost savings during setup
- ⚡ Instant deployment
- 🔄 Sandbox environment

**Characteristics:**
- No physical device needed
- Software-generated serial number (e.g., `VIRTUAL-CU-1730808000000`)
- Full eTIMS API access
- Perfect for pre-production testing
- Free (no hardware costs)

**Limitations:**
- KRA may require physical CU for production
- Check KRA requirements for your business type
- May need to migrate to physical CU later

---

### Physical Control Unit (Hardware CU)
**Best for:**
- 🏢 Production environment (KRA requirement)
- ✅ Official tax compliance
- 📋 KRA audits
- 🎫 Physical receipt printing

**Characteristics:**
- Physical hardware device from KRA
- Official serial number (e.g., `CU-1234-5678-9012`)
- Hardware costs (varies by provider)
- Installation required
- KRA-approved device

**Requirements:**
- Purchase from KRA-approved vendors
- Physical installation
- Device registration with KRA
- Ongoing maintenance

---

## 🚀 Setting Up Virtual CU

### Step 1: Enable Virtual CU (1 minute)

1. Go to **Dashboard → eTIMS → Configure**
2. Scroll to "Control Unit (CU) Information"
3. ✅ Check **"Use Virtual Control Unit"**

You'll see:
```
┌────────────────────────────────────────────┐
│ ✅ Use Virtual Control Unit                │
│                                            │
│ Benefits:                                  │
│ • No physical KRA device required          │
│ • Perfect for sandbox/testing              │
│ • Instant setup                            │
│ • Full eTIMS functionality                 │
│ • Easy migration to physical CU later      │
│                                            │
│ Auto-generated Virtual CU:                 │
│ VIRTUAL-CU-1730808000000                   │
└────────────────────────────────────────────┘
```

### Step 2: Complete eTIMS Configuration

Fill in the rest of the form:

```
Business Information:
├─ Business Name: Haraka Wedges Supplies
├─ KRA PIN: P051234567A
└─ Business Type: Sole Proprietorship

Environment:
├─ Environment: Sandbox (for testing)
└─ Branch ID: 00

Invoice Settings:
├─ Invoice Prefix: INV
├─ Auto Submit: ✅ Enabled
└─ Print QR Code: ✅ Enabled
```

### Step 3: Save Configuration

Click **"Save Configuration"**

You'll see:
```
✅ eTIMS configuration saved successfully!
```

### Step 4: Test Connection (Optional)

Some systems allow testing the connection:
- Check eTIMS Dashboard
- Verify status shows "Active"
- Generate a test invoice

---

## 📋 Virtual CU Serial Number Format

### Auto-Generated Format:
```
VIRTUAL-CU-[TIMESTAMP]

Example: VIRTUAL-CU-1730808000000
```

**Where:**
- `VIRTUAL-CU` = Prefix indicating virtual control unit
- `1730808000000` = Unix timestamp (milliseconds) when generated
- Ensures uniqueness across all virtual CUs

### Why This Format?
- ✅ **Unique**: Timestamp ensures no duplicates
- ✅ **Identifiable**: "VIRTUAL" prefix shows it's not physical
- ✅ **Trackable**: Can trace when it was created
- ✅ **Compatible**: Works with eTIMS API structure

---

## 🔄 Migrating from Virtual to Physical CU

### When to Migrate:

**You should migrate when:**
- 🏢 Moving to production environment
- ✅ KRA requires physical CU for your business
- 📋 Preparing for KRA audit
- 🎫 Need physical receipt printing
- 💼 Official business operations begin

### Migration Steps:

#### Step 1: Get Physical CU
1. Purchase KRA-approved control unit
2. Register with KRA
3. Receive official serial number (e.g., `CU-1234-5678-9012`)

#### Step 2: Update Configuration
1. Go to **Dashboard → eTIMS → Configure**
2. ❌ Uncheck **"Use Virtual Control Unit"**
3. Enter **Physical CU Serial Number**
4. Enter **CU Model** (from device)
5. Save configuration

#### Step 3: Verify Migration
1. Check eTIMS Dashboard
2. Verify new CU serial number appears
3. Test invoice generation
4. Confirm QR codes work
5. Print test receipt

#### Step 4: Data Continuity
**Good news:** All your existing invoices remain valid!
- Invoice history preserved
- Control codes remain valid
- QR codes still work
- No data loss

---

## 💡 Use Cases

### 1. Development & Testing
```
Developer → Virtual CU
         ↓
   Test invoices
         ↓
   Verify QR codes
         ↓
   Check API responses
         ↓
   Perfect functionality
         ↓
   Ready for production!
```

### 2. Sandbox Environment
```
Haraka POS (Sandbox)
         ↓
   Virtual CU
         ↓
   eTIMS Sandbox API
         ↓
   Test transactions
         ↓
   No real tax submission
         ↓
   Safe testing environment
```

### 3. Demo/Training
```
Training Session
         ↓
   Virtual CU
         ↓
   Show invoice generation
         ↓
   Demonstrate QR codes
         ↓
   Practice workflows
         ↓
   No hardware needed!
```

---

## 🔐 Security Considerations

### Virtual CU Security:

**Protected by:**
- 🔒 Database-level encryption
- 🔑 User authentication required
- 🛡️ Row Level Security (RLS)
- 📊 Audit logging

**Best Practices:**
- Use strong passwords
- Limit admin access
- Monitor configuration changes
- Regular backups
- Don't share serial numbers publicly

---

## 🧪 Testing with Virtual CU

### Test Scenarios:

#### 1. Invoice Generation
```javascript
// Test creating invoice
POST /api/etims/invoice
{
  "customer": "Test Customer",
  "items": [...],
  "amount": 6000
}

Response:
{
  "success": true,
  "control_code": "20251105123456",
  "cu_serial": "VIRTUAL-CU-1730808000000"
}
```

#### 2. QR Code Validation
- Generate invoice
- Check QR code appears
- Scan with phone
- Verify data accuracy

#### 3. Receipt Printing
- Create sale
- Print receipt
- Verify all fields present
- Check control code prints

---

## ❓ Frequently Asked Questions

### Q: Is Virtual CU legal for production use?
**A:** Check with KRA! Requirements vary by:
- Business type
- Transaction volume
- Industry regulations
- KRA regional policies

**Recommendation:** Use Virtual CU for testing, migrate to physical CU for production.

---

### Q: Will my invoices be valid with Virtual CU?
**A:** In sandbox: Yes!
In production: Depends on KRA requirements for your business.

**Control codes from sandbox may not be valid for official tax filing.**

---

### Q: Can I switch between Virtual and Physical CU?
**A:** Yes! Easy to switch:
1. Update configuration
2. Change CU serial number
3. Save settings
4. System adapts automatically

**Data remains intact during switch.**

---

### Q: What if KRA requires physical CU?
**A:** No problem!
1. Purchase physical CU
2. Follow migration steps (above)
3. Update configuration
4. Continue operations

**Zero downtime during migration.**

---

### Q: Does Virtual CU support all eTIMS features?
**A:** Yes! Virtual CU supports:
- ✅ Invoice generation
- ✅ Control code assignment
- ✅ QR code generation
- ✅ Tax calculations
- ✅ Credit notes
- ✅ Receipt printing
- ✅ API integration
- ✅ Audit logging

**Only difference is no physical hardware.**

---

### Q: How do I know if I'm using Virtual CU?
**A:** Check your configuration:
- Serial starts with `VIRTUAL-CU-`
- eTIMS Dashboard shows Virtual CU
- Config page checkbox is checked

---

### Q: Can I have multiple Virtual CUs?
**A:** Technically yes, but:
- One per business branch
- Each needs unique serial
- Must register separately with KRA
- Better to use branch IDs instead

**Recommendation:** One Virtual CU per system instance.

---

## 🎯 Best Practices

### For Development:
1. ✅ Always use Virtual CU in development
2. ✅ Use sandbox environment
3. ✅ Test all invoice scenarios
4. ✅ Verify QR codes work
5. ✅ Document any issues

### For Testing:
1. ✅ Create test customer data
2. ✅ Generate sample invoices
3. ✅ Test error scenarios
4. ✅ Verify calculations
5. ✅ Print test receipts

### For Production:
1. ✅ Migrate to physical CU (if required)
2. ✅ Switch to production environment
3. ✅ Verify KRA connectivity
4. ✅ Test with real transactions
5. ✅ Monitor for issues

---

## 🔧 Troubleshooting

### Issue: Virtual CU not generating
**Solution:**
- Ensure checkbox is checked
- Refresh page
- Clear browser cache
- Serial auto-generates on checkbox change

---

### Issue: Cannot save configuration
**Solution:**
- Check all required fields filled
- Verify KRA PIN format
- Ensure valid Branch ID
- Check browser console for errors

---

### Issue: Invoices not submitting
**Solution:**
- Verify eTIMS enabled
- Check environment (sandbox vs production)
- Test API connectivity
- Review error logs

---

### Issue: QR codes not appearing
**Solution:**
- Ensure "Print QR Code" enabled
- Check control code exists
- Verify invoice saved
- Test receipt template

---

## 📞 Support

### KRA eTIMS Support:
- **Phone:** 0709912900 / 0709912999
- **Email:** etims@kra.go.ke
- **Portal:** https://etims.kra.go.ke

### HarakaPOS Support:
- Check documentation
- Review error logs
- Test in sandbox first
- Verify configuration

---

## ✅ Checklist

### Virtual CU Setup:
- [ ] ✅ Checkbox enabled
- [ ] Virtual serial generated
- [ ] KRA PIN entered
- [ ] Business details complete
- [ ] Environment set (sandbox/production)
- [ ] Branch ID configured
- [ ] Configuration saved
- [ ] Status shows "Active"

### Testing:
- [ ] Test invoice created
- [ ] Control code received
- [ ] QR code generated
- [ ] Receipt prints correctly
- [ ] Data accurate

### Ready for Production:
- [ ] All tests passing
- [ ] KRA requirements understood
- [ ] Physical CU ordered (if needed)
- [ ] Migration plan ready
- [ ] Team trained

---

**Virtual CU is perfect for getting started quickly!** 🚀

**Test everything, then migrate to physical CU when ready for production.** ✨

*Last updated: November 5, 2025*
