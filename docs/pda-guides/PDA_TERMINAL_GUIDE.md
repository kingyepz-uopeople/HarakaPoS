# 📱 PDA POS Terminal Integration Guide

## Overview

This system is designed for **drivers using PDA POS terminals** (handheld devices with built-in M-Pesa and thermal printers). The flow mimics real POS operations - simpler and more efficient than remote M-Pesa STK push.

---

## 🎯 How It Works

### Real-World Flow:

1. **Driver arrives** at customer location with potatoes
2. **Driver opens** delivery details on phone/tablet
3. **Customer chooses payment**: Cash or M-Pesa
4. **If Cash:**
   - Driver enters amount received
   - System calculates change
   - Receipt prints to PDA
5. **If M-Pesa:**
   - Driver processes payment on PDA terminal
   - Gets M-Pesa confirmation code
   - Enters code in app
   - Receipt prints to PDA
6. **Order marked completed** ✅
7. **Driver moves to next delivery**

---

## 💰 Payment Flow Diagram

```
Driver at Customer Location
        ↓
Opens Delivery Details
        ↓
┌─────────────────────────┐
│  Select Payment Method  │
├─────────────────────────┤
│  [💵 Cash]  [📱 M-Pesa] │
└─────────────────────────┘
        ↓
    ┌───┴───┐
    │       │
 [CASH]  [M-PESA]
    │       │
    │       └→ Process on PDA terminal
    │          Get confirmation code
    │          Enter code in app
    │          ↓
    └→ Enter amount received
       Calculate change
       ↓
    ┌─────────────────┐
    │ Print Receipt   │ ← To PDA Thermal Printer
    └─────────────────┘
       ↓
    Order Completed ✅
```

---

## 🔧 Setup Steps

### 1. Run Database Migration

Same as before - you already have `payments` and `receipts` tables.

If not, run: `supabase/migrations/payments-system.sql`

### 2. No M-Pesa API Setup Needed!

Since the PDA handles M-Pesa directly, you **DON'T need**:
- ❌ M-Pesa Daraja API credentials
- ❌ Ngrok callback URL
- ❌ STK Push integration
- ❌ Callback handlers

### 3. Configure PDA Printer (Optional)

For actual thermal printer integration, you'll need:

**Option A: Sunmi POS Devices**
```bash
npm install @ionic-native/sunmi-printer
```

**Option B: Generic Bluetooth Printer**
```bash
npm install react-native-bluetooth-escpos-printer
```

**Option C: USB Printer**
```bash
npm install usb-thermal-printer
```

For now, the system works without actual printing - it logs the receipt data.

---

## 📱 UI Components

### PDAPaymentFlow Component

**Location:** `components/PDAPaymentFlow.tsx`

**Features:**
- ✅ Large touch-friendly buttons
- ✅ Cash calculator with change display
- ✅ M-Pesa confirmation code input
- ✅ Auto-print to PDA
- ✅ Mobile-optimized
- ✅ Works offline (queues)

**Props:**
```typescript
{
  orderId: string;
  amount: number;
  customerName: string;
  onComplete: () => void;
}
```

---

## 🖥️ Driver Experience

### Screen 1: Payment Method Selection

```
┌─────────────────────────────────────┐
│  Collect Payment                    │
│  Customer: Mama Njeri's Hotel       │
│  KES 1,200.00                       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💵 Cash Payment             │   │
│  │ Receive cash from customer  │ →  │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📱 M-Pesa Payment           │   │
│  │ Customer pays on PDA        │ →  │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### Screen 2a: Cash Payment

```
┌─────────────────────────────────────┐
│  💵 Cash Payment                    │
│  Amount due: KES 1,200.00           │
├─────────────────────────────────────┤
│                                     │
│  Cash Received (KES)                │
│  ┌─────────────────────────────┐   │
│  │        1500.00              │   │ ← Driver types
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Change to return:               │
│     KES 300.00                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✓ Confirm Cash Payment      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Screen 2b: M-Pesa Payment

```
┌─────────────────────────────────────┐
│  📱 M-Pesa Payment                  │
├─────────────────────────────────────┤
│  On the PDA terminal:               │
│  1. Open M-Pesa app/menu            │
│  2. Select "Lipa na M-Pesa"         │
│  3. Enter amount: KES 1,200.00      │
│  4. Customer enters PIN             │
│  5. Get confirmation code           │
├─────────────────────────────────────┤
│                                     │
│  M-Pesa Confirmation Code           │
│  ┌─────────────────────────────┐   │
│  │    SH12ABC3DEF              │   │ ← Driver types
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✓ Confirm M-Pesa Payment    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Screen 3: Processing

```
┌─────────────────────────────────────┐
│                                     │
│        🖨️                           │
│   (printer animation)               │
│                                     │
│  Processing Payment...              │
│  Printing receipt to PDA terminal...│
│                                     │
└─────────────────────────────────────┘
```

---

## 🧾 Receipt Format (Thermal Printer)

```
================================
       HARAKA POS
   Processed Potatoes
================================

Receipt: RCP-20251104-00001
Date: 04/11/2025
Time: 14:30:15

Customer: Mama Njeri's Hotel
Phone: 0712345678
Location: Westlands, Nairobi

--------------------------------
ITEMS
--------------------------------
Processed Potatoes (10kg)
  10 x KES 120.00
  Total: KES 1,200.00

--------------------------------
Subtotal:     KES 1,200.00
================================
TOTAL:        KES 1,200.00
================================

Payment: MPESA

--------------------------------
   Thank you for your business!

   For queries contact us at:
   info@harakapos.co.ke
   Tel: +254 XXX XXX XXX
--------------------------------



```

---

## 🔌 PDA Printer Integration

### For Sunmi Devices

```typescript
// Install: npm install @sunmi/sunmi-cloud-printer

import SunmiPrinter from '@sunmi/sunmi-cloud-printer';

const printReceipt = async (receiptText: string) => {
  try {
    await SunmiPrinter.init();
    await SunmiPrinter.setAlignment(1); // Center
    await SunmiPrinter.printText('HARAKA POS\n');
    await SunmiPrinter.setAlignment(0); // Left
    await SunmiPrinter.printText(receiptText);
    await SunmiPrinter.lineWrap(3); // Feed paper
    await SunmiPrinter.cutPaper();
  } catch (error) {
    console.error('Print error:', error);
  }
};
```

### For Bluetooth Thermal Printers

```typescript
// Install: npm install react-native-bluetooth-escpos-printer

import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

const printReceipt = async (receiptText: string) => {
  try {
    await BluetoothEscposPrinter.printText(receiptText, {});
    await BluetoothEscposPrinter.printText("\n\n\n", {});
  } catch (error) {
    console.error('Print error:', error);
  }
};
```

### For USB Printers

```typescript
// Install: npm install usb-thermal-printer

import ThermalPrinter from 'usb-thermal-printer';

const printReceipt = async (receiptText: string) => {
  const printer = new ThermalPrinter({
    type: 'epson',
    interface: 'usb://0x04b8:0x0e15',
  });

  printer.alignCenter();
  printer.bold(true);
  printer.println('HARAKA POS');
  printer.bold(false);
  printer.alignLeft();
  printer.println(receiptText);
  printer.cut();
  await printer.execute();
};
```

---

## 📊 Database Changes

### Payment Record (Cash)

```sql
INSERT INTO payments (
  order_id,
  amount,
  payment_method = 'cash',
  payment_status = 'completed', -- Immediate
  notes = 'Cash payment. Received: KES 1500',
  initiated_by,
  initiated_from = 'driver'
);
```

### Payment Record (M-Pesa)

```sql
INSERT INTO payments (
  order_id,
  amount,
  payment_method = 'mpesa',
  payment_status = 'completed', -- Immediate
  mpesa_receipt_number = 'SH12ABC3DEF', -- From PDA
  transaction_id = 'SH12ABC3DEF',
  notes = 'M-Pesa payment confirmed on PDA. Code: SH12ABC3DEF',
  initiated_by,
  initiated_from = 'driver'
);
```

---

## ✨ Key Differences from STK Push

| Feature | STK Push (Old) | PDA Terminal (New) |
|---------|----------------|-------------------|
| **M-Pesa Processing** | Remote API call | On PDA device |
| **Customer Action** | Enter PIN on their phone | Enter PIN on PDA |
| **Confirmation** | Callback after 30s | Immediate code |
| **Receipt** | Browser print | Thermal printer |
| **Offline Support** | ❌ Needs internet | ✅ Queue & sync |
| **Complexity** | High (API, callbacks) | Low (just record) |
| **Setup** | API credentials needed | No API needed |
| **Driver Control** | Wait for customer | Full control |
| **Cash Support** | Separate flow | Same flow |
| **Real POS Feel** | ❌ | ✅ |

---

## 🎯 Advantages

### For Drivers:
✅ **Faster** - No waiting for callbacks  
✅ **Simpler** - Just enter confirmation code  
✅ **More control** - Handle both cash & M-Pesa same way  
✅ **Works offline** - Queue payments, sync later  
✅ **Professional** - Thermal receipt on-site  
✅ **Less errors** - Driver confirms everything  

### For Business:
✅ **No API costs** - No M-Pesa API needed  
✅ **Simpler setup** - No callbacks, ngrok, etc.  
✅ **Better reliability** - Not dependent on internet  
✅ **Faster reconciliation** - All payments confirmed  
✅ **Lower complexity** - Fewer moving parts  

### For Customers:
✅ **Immediate receipt** - Printed on-site  
✅ **Familiar flow** - Like paying at a shop  
✅ **Can choose** - Cash or M-Pesa  
✅ **No phone needed** - Use PDA for M-Pesa  

---

## 🧪 Testing Checklist

- [ ] Driver can select cash payment
- [ ] Cash amount validation works (must be >= total)
- [ ] Change calculation is correct
- [ ] Driver can select M-Pesa payment
- [ ] M-Pesa code input works
- [ ] Code validation (min 8 characters)
- [ ] Payment records correctly in database
- [ ] Receipt generates with unique number
- [ ] Receipt format looks good
- [ ] Order status updates to "Completed"
- [ ] Driver redirects after completion
- [ ] Can print/reprint receipt later
- [ ] Works in offline mode (queues payment)
- [ ] Syncs when back online

---

## 📱 Recommended PDA Devices

### Budget Options (KES 15,000 - 30,000):
- **Telpo TPS450** - Android, thermal printer, 4G
- **Sunmi P2 Lite** - Android, thermal printer, WiFi/4G
- **PAX A920** - Android, thermal printer, card reader

### Premium Options (KES 30,000 - 60,000):
- **Sunmi P2 Pro** - Full POS features, dual screens
- **Ingenico Move 5000** - Banking-grade, very reliable
- **Verifone V240m** - Multi-payment, rugged

### Requirements:
✅ Android OS (for web app)  
✅ Built-in thermal printer (58mm or 80mm)  
✅ M-Pesa app support  
✅ 4G/WiFi connectivity  
✅ Decent battery life (8+ hours)  

---

## 🚀 Deployment

### Option 1: Progressive Web App (PWA)
```json
// Add to next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // your config
});
```

Benefits:
- ✅ Works offline
- ✅ Install like native app
- ✅ No app store needed
- ✅ Easy updates

### Option 2: Native App (React Native)
Convert to React Native for:
- Native printer SDK access
- Better offline support
- App store distribution

---

## 🆘 Troubleshooting

### Receipt Not Printing
1. Check PDA printer connection
2. Verify printer paper loaded
3. Check printer status (not jammed)
4. Review printer SDK logs
5. Test printer with demo app

### Payment Not Recording
1. Check internet connection
2. Verify database connection
3. Check browser console for errors
4. Ensure user is authenticated
5. Verify order exists

### Change Calculation Wrong
1. Check amount input (decimals)
2. Verify currency formatting
3. Review calculation logic

---

## 💡 Future Enhancements

### Phase 1 (Current):
✅ Cash & M-Pesa support  
✅ Thermal receipt printing  
✅ Basic offline support  

### Phase 2 (Next):
- [ ] Card payment support
- [ ] Split payments (part cash, part M-Pesa)
- [ ] Loyalty points
- [ ] Digital receipts (email/SMS)

### Phase 3 (Future):
- [ ] Advanced offline mode with sync
- [ ] Multiple payment methods per order
- [ ] Refund support
- [ ] Daily cash-up reports

---

## 📖 API Documentation

### Complete Payment
**Endpoint:** `POST /api/payments/complete`

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 1200.00,
  "paymentMethod": "cash" | "mpesa",
  "reference": "1500" | "SH12ABC3DEF",
  "initiatedFrom": "driver"
}
```

**Response:**
```json
{
  "success": true,
  "paymentId": "uuid",
  "receiptId": "uuid",
  "receiptNumber": "RCP-20251104-00001"
}
```

### Print Receipt
**Endpoint:** `POST /api/print/receipt`

**Request:**
```json
{
  "receiptId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receipt sent to PDA printer",
  "receiptData": "formatted text..."
}
```

---

**Perfect for your potato delivery business!** 🥔🚚💰

Simple, fast, and works just like real POS terminals! ✨
