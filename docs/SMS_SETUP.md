# SMS Integration Setup Guide

HarakaPOS uses **TalkSasa** for SMS notifications across Kenya and Tanzania.

## Overview

- **Provider**: [TalkSasa](https://talksasa.com) - East Africa's leading bulk SMS platform
- **API**: TalkSasa v3 Bulk SMS API (`https://bulksms.talksasa.com/api/v3`)
- **Coverage**: Kenya, Tanzania, and 11 other African countries
- **Setup Time**: 2 minutes (no registration needed!)

## Setup Steps

### 1. Create TalkSasa Account

1. Go to [https://bulksms.talksasa.com/register](https://bulksms.talksasa.com/register)
2. Complete registration with your business details
3. Add funds to your account (M-Pesa, bank transfer, or card)
4. Get your **API Token** from the dashboard

### 2. Add TalkSasa API Key to Environment

Add to your `.env.local`:

```env
# TalkSasa SMS Configuration
TALKSASA_API_KEY=1832|Lf2oLwOJzvKVTqsR2HWTjIh7bYXUQj5r7YVg2j3P8e0c77af
TALKSASA_SENDER_ID=HarakaPOS
```

**That's it!** No proxy registration needed.

### 3. Verify Configuration

Check that SMS is configured:
```bash
curl http://localhost:3000/api/sms/register
```

Should return:
```json
{
  "status": "configured",
  "message": "SMS is ready to use",
  "senderId": "HarakaPOS"
}
```

## Usage

### Check Configuration Status

```bash
curl http://localhost:3000/api/sms/send
```

### Send Direct SMS

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0712345678",
    "message": "Hello from HarakaPOS!"
  }'
```

### Send Order Notification

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "uuid-here",
    "eventType": "out_for_delivery"
  }'
```

### Available Event Types

| Event Type | When to Send |
|------------|--------------|
| `order_confirmed` | Order created successfully |
| `order_scheduled` | Driver assigned to order |
| `out_for_delivery` | Driver starts delivery |
| `driver_arriving` | Driver within 50m geofence |
| `order_delivered` | Delivery completed |
| `order_cancelled` | Order cancelled |
| `payment_received` | Payment confirmed |
| `payment_reminder` | COD payment reminder |
| `mpesa_request` | M-Pesa STK push sent |
| `welcome` | New customer registration |

## Code Examples

### Send SMS from Server Action

```typescript
import { sendSMS } from '@/lib/sms';
import { outForDeliverySMS } from '@/lib/sms-templates';

// Direct send
const result = await sendSMS('0712345678', 'Your order is ready!');

// Using templates
const message = outForDeliverySMS({
  orderId: order.id,
  customerName: 'John',
  quantity: 50,
  totalAmount: 5000,
  driverName: 'Peter'
});
await sendSMS(customer.phone, message);
```

### Trigger SMS on Order Status Change

```typescript
// In your order update action
if (newStatus === 'Out for Delivery') {
  await fetch('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order.id,
      eventType: 'out_for_delivery'
    })
  });
}
```

## Pricing

Check current rates at [https://talksasa.com/pricing](https://talksasa.com/pricing)

Typical rates (as of 2025):
- Kenya (Safaricom, Airtel): ~KES 0.50-0.80 per SMS
- Tanzania: ~KES 0.80-1.00 per SMS

## Troubleshooting

### "SMS service not configured"

Missing environment variables. Check:
- `TALKSASA_API_KEY` is set correctly
- `TALKSASA_SENDER_ID` is set

### SMS not delivered

1. Check phone number format (should be 2547XXXXXXXX)
2. Verify sender ID is approved
3. Check TalkSasa dashboard for delivery reports
4. Verify account has sufficient balance

### Phone number validation

Phone numbers are automatically formatted from:
- Local format: `0712345678` → `254712345678`
- International format: `+254712345678` → `254712345678`
- Short format: `712345678` → `254712345678`

## Files Reference

| File | Purpose |
|------|---------|
| `lib/sms.ts` | Core TalkSasa v3 API integration |
| `lib/sms-templates.ts` | Message templates for notifications |
| `lib/types/sms.ts` | TypeScript type definitions |
| `app/api/sms/send/route.ts` | Send SMS API endpoint |
| `app/api/sms/register/route.ts` | Configuration status endpoint |
| `app/api/sms/webhook/route.ts` | Delivery status webhook handler |

## Support

- TalkSasa Support: [info@talksasa.com](mailto:info@talksasa.com)
- Phone: +254 712 295 880
- Dashboard: [https://bulksms.talksasa.com](https://bulksms.talksasa.com)

## Usage

### Check Configuration Status

```bash
curl http://localhost:3000/api/sms/send
```

### Send Direct SMS

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0712345678",
    "message": "Hello from HarakaPOS!"
  }'
```

### Send Order Notification

```bash
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "uuid-here",
    "eventType": "out_for_delivery"
  }'
```

### Available Event Types

| Event Type | When to Send |
|------------|--------------|
| `order_confirmed` | Order created successfully |
| `order_scheduled` | Driver assigned to order |
| `out_for_delivery` | Driver starts delivery |
| `driver_arriving` | Driver within 50m geofence |
| `order_delivered` | Delivery completed |
| `order_cancelled` | Order cancelled |
| `payment_received` | Payment confirmed |
| `payment_reminder` | COD payment reminder |
| `mpesa_request` | M-Pesa STK push sent |
| `welcome` | New customer registration |

## Code Examples

### Send SMS from Server Action

```typescript
import { sendSMS } from '@/lib/sms';
import { outForDeliverySMS } from '@/lib/sms-templates';

// Direct send
const result = await sendSMS('0712345678', 'Your order is ready!');

// Using templates
const message = outForDeliverySMS({
  orderId: order.id,
  customerName: 'John',
  quantity: 50,
  totalAmount: 5000,
  driverName: 'Peter'
});
await sendSMS(customer.phone, message);
```

### Trigger SMS on Order Status Change

```typescript
// In your order update action
if (newStatus === 'Out for Delivery') {
  await fetch('/api/sms/send', {
    method: 'POST',
    body: JSON.stringify({
      orderId: order.id,
      eventType: 'out_for_delivery'
    })
  });
}
```

## Pricing

Check current rates at [https://talksasa.com/pricing](https://talksasa.com/pricing)

Typical rates (as of 2025):
- Kenya (Safaricom, Airtel): ~KES 0.50-0.80 per SMS
- Tanzania: ~KES 0.80-1.00 per SMS

## Troubleshooting

### "SMS service not configured"

Missing environment variables. Check:
- `TALKSASA_PROXY_KEY` is set
- `TALKSASA_SENDER_ID` is set

### "Registration failed"

- Verify your `TALKSASA_API_KEY` is correct
- Make sure you have funds in your TalkSasa account

### SMS not delivered

1. Check phone number format (should be 2547XXXXXXXX)
2. Verify sender ID is approved
3. Check TalkSasa dashboard for delivery reports
4. Review webhook logs at `/api/sms/webhook`

## Files Reference

| File | Purpose |
|------|---------|
| `lib/sms.ts` | Core TalkSasa API integration |
| `lib/sms-templates.ts` | Message templates for notifications |
| `lib/types/sms.ts` | TypeScript type definitions |
| `app/api/sms/send/route.ts` | Send SMS API endpoint |
| `app/api/sms/register/route.ts` | One-time registration endpoint |
| `app/api/sms/webhook/route.ts` | Delivery status webhook handler |

## Support

- TalkSasa Support: [info@talksasa.com](mailto:info@talksasa.com)
- Phone: +254 712 295 880
- Dashboard: [https://bulksms.talksasa.com](https://bulksms.talksasa.com)
