# Orders Module - Quick Start (5 Minutes)

## 1. Run Database Migration (2 minutes)

Open your Supabase project → SQL Editor:

```sql
-- Copy and paste the contents of migration-create-orders-module.sql
-- Then click RUN
```

This creates:
- `customers` table
- `orders` table  
- Indexes for performance
- RLS policies
- Auto-update triggers

## 2. Add Sample Customers (1 minute)

In Supabase SQL Editor:

```sql
INSERT INTO customers (name, phone, location) VALUES
  ('John Kamau', '0712345678', 'Nairobi CBD'),
  ('Mary Wanjiku', '0723456789', 'Westlands'),
  ('Peter Otieno', '0734567890', 'Karen');
```

## 3. Navigate to Orders Page (30 seconds)

In your HarakaPOS app:
1. Look at the sidebar
2. Click **"Orders"** (new link)
3. You should see the Orders Management page

## 4. Create Your First Order (1.5 minutes)

1. Click **"Add Order"** button
2. Fill in the form:
   - **Customer:** Select "John Kamau"
   - **Quantity:** 50
   - **Price per kg:** 120 (auto-filled from settings)
   - **Payment Mode:** M-Pesa
   - **Status:** Pending
   - **Delivery Date:** Today's date
   - **Delivery Time:** 14:00
   - **Driver:** Select a driver (if you have one)
   - **Notes:** "First floor, ask for reception"
3. Click **"Add Order"**

## 5. Test Features (Remaining time)

### Status Tabs
- Click **"Pending"** tab - see your order
- Click **"Scheduled"** tab - empty
- Click **"All"** tab - see all orders

### Filters
- Set **Filter by Date** to today
- Order appears
- Change date to tomorrow
- Order disappears (correctly filtered)

### Status Changes
- In the table, change dropdown from **"Pending"** to **"On the Way"**
- Order moves to "On the Way" tab
- Change to **"Delivered"**
- Revenue stat updates at the top

### Add More Customers
1. Click **"Customers"** in sidebar
2. Click **"Add Customer"**
3. Enter:
   - Name: "Sarah Njeri"
   - Phone: "0745678901"
   - Location: "Kilimani"
4. Click **"Add Customer"**
5. Go back to Orders and create an order for Sarah

## Order Status Flow

```
Scheduled → (6 AM on delivery day) → Pending → (Driver starts) → On the Way → (Completes) → Delivered
                                         ↓
                                    Cancelled
```

## Key Features You Just Enabled

✅ **Pre-order scheduling** - Set future delivery dates
✅ **Customer management** - Reusable customer profiles  
✅ **Status tracking** - 5-stage delivery workflow
✅ **Driver assignment** - Assign orders to specific drivers
✅ **Smart filtering** - Filter by date, driver, or status
✅ **Auto-calculation** - Total price = quantity × price per kg
✅ **Revenue tracking** - See total revenue from delivered orders

## Next Steps

1. **Test with real data:**
   - Add your actual customers
   - Create real pre-orders for next week
   - Assign to your drivers

2. **Set up automation (optional):**
   - See "Automated Status Updates" in ORDERS-MODULE-GUIDE.md
   - Schedule "Scheduled → Pending" transition at 6 AM

3. **Integrate with stock:**
   - When order is "Delivered", reduce stock
   - See integration code in main guide

## Pro Tips

💡 **Use "Scheduled" for pre-orders** - Orders with future delivery dates
💡 **Use "Pending" for today's orders** - Ready for immediate delivery  
💡 **Price auto-fills** - From your Settings → Pricing
💡 **Can't delete customers** - If they have existing orders (by design)
💡 **Status dropdown** - Quick updates right in the table
💡 **Tabs show counts** - E.g., "Pending (5)" shows 5 pending orders

## Troubleshooting

**Orders page not loading?**
→ Make sure migration ran successfully in Supabase

**No customers in dropdown?**
→ Add customers first at `/dashboard/customers`

**Can't see orders?**
→ Check you're logged in with an admin account

**Total price not showing?**
→ It's auto-calculated, don't worry!

## You're Done! 🎉

Your HarakaPOS now has a complete order management system.

**What you built:**
- Customer database
- Order scheduling system  
- Delivery tracking workflow
- Admin dashboard with filters
- Foundation for automated updates

Go create some orders and see it in action! 🚀
