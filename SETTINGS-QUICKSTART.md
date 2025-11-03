# ⚡ Quick Start: Admin Settings

## 🚀 1-Minute Setup

### Run This SQL in Supabase
```sql
-- Copy and paste into Supabase SQL Editor
-- File: migration-update-settings-table.sql

DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (key, value, type, description) VALUES
('price_per_kg', '120', 'number', 'Default price per kg'),
('delivery_fee_flat', '100', 'number', 'Flat delivery fee'),
('payment_modes', '["Cash", "M-Pesa", "Bank Transfer"]', 'json', 'Payment methods'),
('business_name', 'Haraka Wedges Supplies', 'string', 'Business name'),
('business_phone', '+254 712 345 678', 'string', 'Phone number'),
('business_address', 'Nairobi, Kenya', 'string', 'Address'),
('currency', 'KES', 'string', 'Currency code'),
('tax_rate', '0', 'number', 'Tax rate %')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can update settings" ON settings FOR UPDATE USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ language 'plpgsql';

CREATE TRIGGER update_settings_timestamp BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();
```

---

## ✅ What You Get

### 1. Settings Page (`/dashboard/settings`)
- Navigate: Dashboard → Settings (in sidebar)
- Features:
  - 💰 **Pricing:** Price/kg, Delivery Fee, Tax Rate
  - 💳 **Payments:** Toggle Cash, M-Pesa, Bank Transfer, Credit Card
  - 🏢 **Business:** Name, Phone, Address, Currency

### 2. Smart Sales Form
- **Auto-calculate:** Enter 10kg → See 1200 KES (if price = 120/kg)
- **Override:** Manual pricing still allowed
- **Visual:** Shows default vs custom pricing

---

## 🎯 Quick Test

1. **Run SQL** → Supabase SQL Editor
2. **Login** → http://localhost:3000
3. **Go to Settings** → Update price to 150 KES/kg
4. **Save**
5. **Go to Sales** → Enter 10kg → See 1500 KES auto-calculated
6. **Done!** ✨

---

## 📋 Files Reference

| File | Purpose |
|------|---------|
| `migration-update-settings-table.sql` | Database migration |
| `app/dashboard/settings/page.tsx` | Settings UI |
| `utils/settings.ts` | Helper functions |
| `lib/types.ts` | TypeScript types |
| `ADMIN-SETTINGS-GUIDE.md` | Full documentation |

---

## 💡 Pro Tips

- **Change pricing anytime** - No code restart needed
- **Enable/disable payments** - Just check/uncheck
- **Override pricing** - Manual entry still works for special cases
- **Admin only** - Settings protected by dashboard auth

---

## 🆘 Need Help?

See `ADMIN-SETTINGS-GUIDE.md` for:
- Complete API documentation
- Advanced usage examples
- Troubleshooting guide
- Future enhancement ideas
