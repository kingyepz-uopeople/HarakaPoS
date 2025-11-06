# 📋 How to Assign Drivers to Orders - Quick Guide

## Overview
This guide shows you how to use the new driver assignment features in the Deliveries dashboard.

---

## 🎯 Finding Unassigned Orders

### Method 1: Unassigned Counter (Fastest)
```
┌─────────────────────────────────────┐
│  Unassigned  ⚠️                     │
│  3 orders                            │
│  ✓ Click to filter                  │
└─────────────────────────────────────┘
```

**Steps:**
1. Go to `/dashboard/deliveries`
2. Look at the **4th stat card** (orange color)
3. **Click the "Unassigned" card**
4. Table now shows only unassigned orders
5. Click again to show all orders

---

### Method 2: Quick Filter Button
```
┌─────────────────────────────────────┐
│  Quick Filters                      │
│  [Show Unassigned Only]  ◄── Click │
└─────────────────────────────────────┘
```

**Steps:**
1. Go to `/dashboard/deliveries`
2. Find the **Filters** section
3. Click **"Show Unassigned Only"** button
4. Button turns **orange** when active
5. Click again to disable filter

---

## ✅ Assigning a Driver

### Visual Indicators

**Unassigned Order:**
```
┌─────────────────────────────────────┐
│  Driver Column                      │
│  ┌───────────────────────────────┐ │
│  │ ⚠️ Assign Driver         ▼    │ │  ◄── Orange background!
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Assigned Order:**
```
┌─────────────────────────────────────┐
│  Driver Column                      │
│  ┌───────────────────────────────┐ │
│  │ John Doe                  ▼    │ │  ◄── White background
│  └───────────────────────────────┘ │
│  Assigned: John Doe                 │
└─────────────────────────────────────┘
```

---

### Step-by-Step Assignment

**Step 1: Find the Order**
- Either:
  - Click "Unassigned" card to filter
  - Or scroll through the deliveries table
  - Look for **orange dropdown** = unassigned

**Step 2: Open Driver Dropdown**
```
┌─────────────────────────────┐
│ ⚠️ Assign Driver       ▼    │  ◄── Click this
├─────────────────────────────┤
│ ○ Unassign                  │
│ ○ John Doe                  │
│ ○ Jane Smith                │  ◄── Select a driver
│ ○ Mike Johnson              │
└─────────────────────────────┘
```

**Step 3: Select Driver**
- Click on driver name
- Dropdown closes automatically
- Order is saved to database immediately
- Success alert appears

**Step 4: Verify Assignment**
```
┌─────────────────────────────────────┐
│  Driver Column                      │
│  ┌───────────────────────────────┐ │
│  │ John Doe                  ▼    │ │  ✅ Now white
│  └───────────────────────────────┘ │
│  Assigned: John Doe                 │  ✅ Shows name
└─────────────────────────────────────┘
```

---

## 🔄 Changing or Removing Driver Assignment

### To Change Driver:
1. Find the assigned order
2. Click the driver dropdown (shows current driver)
3. Select a **different driver**
4. Auto-saves immediately

### To Unassign Driver:
1. Find the assigned order
2. Click the driver dropdown
3. Select **"Unassign"** (first option)
4. Order goes back to unassigned
5. Dropdown turns **orange** again

---

## 📊 Dashboard Stats

### What Each Number Means

```
┌───────────┬───────────┬───────────┬────────────┐
│ Scheduled │  Pending  │  Out for  │ Unassigned │
│     12    │     8     │ Delivery  │   ⚠️ 3    │
│           │           │     5     │            │
└───────────┴───────────┴───────────┴────────────┘
```

**Scheduled (12):**
- Orders confirmed and scheduled
- May or may not have drivers assigned

**Pending (8):**
- Ready for pickup
- Waiting to be picked up by driver

**Out for Delivery (5):**
- Currently being delivered
- Driver is en route

**Unassigned (3):** ⚠️
- **NEEDS ATTENTION!**
- No driver assigned yet
- Click to see these orders

---

## 🎯 Best Practices

### ✅ DO:
- **Assign drivers early** - Don't wait until delivery day
- **Click "Unassigned" card** - Quick way to see what needs attention
- **Check driver availability** - Use the filter dropdown
- **Verify assignment** - Look for driver name below dropdown

### ❌ DON'T:
- **Don't leave orders unassigned** - Drivers won't see them
- **Don't assign unavailable drivers** - Check their schedule first
- **Don't forget to save** - Assignment auto-saves, but verify it worked

---

## 🔍 Filtering Orders

### Multiple Filters Work Together

**Example 1: Find John's Pending Deliveries**
1. Filter by Driver: **John Doe**
2. Filter by Status: **Pending**
3. Table shows: Only John's pending orders

**Example 2: Find All Unassigned Pending Orders**
1. Click **"Show Unassigned Only"** button
2. Filter by Status: **Pending**
3. Table shows: Unassigned pending orders only

**Example 3: See Everything**
1. Filter by Driver: **All Drivers**
2. Filter by Status: **All Statuses**
3. Click **"Show Unassigned Only"** to disable
4. Table shows: All orders

---

## 🚨 Common Scenarios

### Scenario 1: Morning Dispatch
**Goal:** Assign all today's orders to drivers

**Steps:**
1. Go to Deliveries page
2. Click **"Unassigned" card** (shows 5 orders)
3. Look at delivery dates
4. For each order:
   - Check driver dropdown
   - Select available driver
   - Verify assignment
5. When "Unassigned" shows **0** → Done! ✅

---

### Scenario 2: Driver Called In Sick
**Goal:** Reassign all orders to another driver

**Steps:**
1. Go to Deliveries page
2. Filter by Driver: **Select sick driver**
3. Table shows: All their orders
4. For each order:
   - Click driver dropdown
   - Select **replacement driver**
   - Verify assignment
5. Check sick driver has **0 orders** → Done! ✅

---

### Scenario 3: Rush Order Needs Immediate Assignment
**Goal:** Assign urgent order to nearest driver

**Steps:**
1. Go to Deliveries page
2. Look at table (newest orders at top)
3. Find the rush order
4. Check if **orange dropdown** (unassigned)
5. Open dropdown
6. Select **nearest available driver**
7. Driver sees order immediately in their app! ✅

---

## 📱 What Drivers See

### After You Assign:
1. **Driver app updates in real-time**
2. Driver sees order in `/driver/deliveries`
3. Shows customer name, location, and time
4. Driver can click "Navigate" to get GPS directions
5. Driver can start delivery

### If Unassigned:
- Driver **DOES NOT see** the order
- Order stays invisible to drivers
- **Must assign** for driver to access

---

## 🎨 Visual Reference

### Unassigned Order (Needs Action)
```
┌─────────────────────────────────────────────────────────────┐
│ Customer    │ Order Details  │ Delivery Info │ Driver       │
├─────────────┼────────────────┼───────────────┼──────────────┤
│ John Smith  │ 12 kg          │ 6 Nov 2025    │ ┌──────────┐ │
│ 0701590065  │ Ksh 1,200      │ No time       │ │⚠️ Assign │ │ ◄── ORANGE!
│             │ Cash           │ Kangema, C70  │ │ Driver ▼ │ │
│             │                │               │ └──────────┘ │
└─────────────┴────────────────┴───────────────┴──────────────┘
```

### Assigned Order (Good to Go)
```
┌─────────────────────────────────────────────────────────────┐
│ Customer    │ Order Details  │ Delivery Info │ Driver       │
├─────────────┼────────────────┼───────────────┼──────────────┤
│ Jane Doe    │ 10 kg          │ 6 Nov 2025    │ ┌──────────┐ │
│ 0721234567  │ Ksh 1,000      │ 2:00 PM       │ │ John Doe│ │ ◄── WHITE
│             │ M-Pesa         │ Nairobi CBD   │ │        ▼ │ │
│             │                │               │ └──────────┘ │
│             │                │               │ Assigned:    │
│             │                │               │ John Doe     │ ◄── Name shown
└─────────────┴────────────────┴───────────────┴──────────────┘
```

---

## 🎯 Quick Checklist

### Daily Morning Routine:
- [ ] Open `/dashboard/deliveries`
- [ ] Check **"Unassigned" card** number
- [ ] If > 0, click card to filter
- [ ] Assign driver to each order
- [ ] Verify "Unassigned" = **0**
- [ ] Check drivers have balanced workload

### Before Leaving Office:
- [ ] No unassigned orders for next day
- [ ] All drivers have clear routes
- [ ] Emergency orders assigned
- [ ] Check "Out for Delivery" status

---

## 💡 Pro Tips

### Tip 1: Color Coding
- **Orange** = Urgent, needs action (unassigned)
- **White** = Handled, driver assigned
- Use colors to prioritize!

### Tip 2: Keyboard Workflow
1. Tab to driver dropdown
2. Arrow keys to select driver
3. Enter to confirm
4. Tab to next order
5. Repeat!

### Tip 3: Bulk Assignment
- Filter by delivery area
- Assign all to one driver familiar with area
- More efficient routing!

### Tip 4: Driver Workload
- Use "Filter by Driver" to check load
- Balance orders across drivers
- Avoid overloading one driver

---

## ❓ Troubleshooting

### Problem: Driver doesn't see assigned order
**Solution:**
- Check driver is logged in
- Verify assignment saved (see name below dropdown)
- Ask driver to refresh their app
- Check driver's role is "driver" in users table

### Problem: Can't find driver in dropdown
**Solution:**
- Ensure driver exists in users table
- Check driver role is "driver" not "admin"
- Refresh the page
- Check drivers are active (not deleted)

### Problem: Assignment doesn't save
**Solution:**
- Check internet connection
- Look for error alerts
- Check browser console for errors
- Try reassigning
- Contact support if persists

---

## 📞 Support

**Need Help?**
- Check database migration is applied
- Verify Supabase connection
- Test with sample order
- Contact admin support

---

**Last Updated:** November 6, 2025  
**Version:** 1.0.0  
**Feature:** Driver Assignment System
