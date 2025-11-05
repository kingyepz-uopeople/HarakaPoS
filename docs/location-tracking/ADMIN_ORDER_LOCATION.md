# Admin Order Entry with Google Maps Location

## Overview
This guide explains how to add customer delivery locations when creating orders via the admin panel. The system supports both manual address entry and Google Maps integration for precise location selection.

## Features

### 1. **Manual Address Entry**
- Admin can type the delivery address directly
- Works without Google Maps API key
- Basic location tracking

### 2. **Google Maps Autocomplete** (With API Key)
- Real-time address suggestions as you type
- Reduces typos and incorrect addresses
- Auto-fills latitude/longitude coordinates
- Validates addresses against Google's database

### 3. **Interactive Map** (With API Key)
- Visual map view of delivery location
- Drag-and-drop marker to adjust exact location
- Reverse geocoding to get address from map pin
- Zoom and pan controls

### 4. **Current Location**
- "Use Current Location" button
- Gets admin's GPS coordinates automatically
- Useful for nearby deliveries or known locations
- Works with or without API key

## Setup Instructions

### Step 1: Get Google Maps API Key (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Add your domain (e.g., `https://yourdomain.com/*`)
   - **API restrictions**: Select only the APIs you enabled

### Step 2: Add API Key to Settings

1. Log in to the admin dashboard
2. Go to **Settings** page
3. Add a new setting:
   - **Key**: `google_maps_api_key`
   - **Value**: Your Google Maps API key
   - **Type**: `string`
   - **Description**: Google Maps JavaScript API key for location features

Or manually insert into your database:

```sql
INSERT INTO settings (key, value, type, description)
VALUES (
  'google_maps_api_key',
  'YOUR_API_KEY_HERE',
  'string',
  'Google Maps JavaScript API key for location features'
);
```

### Step 3: Start Using Location Features

1. Go to **Dashboard > Orders**
2. Click **Add Order** button
3. Fill in customer and order details
4. In the **Delivery Location** section:
   - Type an address (autocomplete will suggest addresses if API key is set)
   - OR click **Use Current Location**
   - OR click **Show Map** and drag the marker to the exact location
5. The address and coordinates are saved with the order

## Usage Workflow

### Phone Order Scenario

1. **Customer calls to place an order**
2. **Admin opens Add Order form**
3. **Collects delivery information:**
   - Ask: "What's the delivery address?"
   - Customer provides: "123 Main Street, Nairobi"
4. **Admin enters address:**
   - Start typing "123 Main Street..."
   - Select from autocomplete suggestions
   - OR if address is tricky, click "Show Map" and search/drag marker
5. **Verify location:**
   - Check the displayed coordinates
   - Confirm with customer if needed
6. **Complete order creation**
7. **Driver receives order with exact location**

### Known Location Scenario

If you already know the customer's location (repeat customer, nearby business):

1. Use autocomplete to quickly find the saved address
2. OR use "Current Location" if delivering to your current building/area
3. Coordinates are automatically captured for driver navigation

## Delivery Radius Management

### Setting Delivery Boundaries

The system supports flexible delivery radius:

- **1km - 10km**: Standard local delivery zone (FREE)
- **10km - 800km**: Extended delivery area (may have additional fees)

### Distance Calculation

When a location is added:
1. System calculates distance from your base location
2. Warns if order is outside usual delivery area
3. Admin can override and accept the order if viable

### Future Enhancements

- Automatic delivery fee calculation based on distance
- Visual delivery zone overlay on map
- Delivery route optimization for multiple orders

## Data Storage

### Order Table Fields

```typescript
interface Order {
  // ... existing fields
  delivery_address?: string;          // Full address text
  delivery_latitude?: number;         // GPS latitude
  delivery_longitude?: number;        // GPS longitude
  // ... other fields
}
```

### Example Data

```json
{
  "customer_id": "uuid-123",
  "delivery_address": "123 Main Street, Nairobi, Kenya",
  "delivery_latitude": -1.286389,
  "delivery_longitude": 36.817223,
  "delivery_date": "2025-11-06",
  "delivery_status": "Pending"
}
```

## Driver Integration

Once an order with location is created:

1. **Driver views order details**
2. **Sees delivery address and map link**
3. **Clicks "Navigate" button**
4. **Opens Google Maps with exact coordinates**
5. **Follows GPS navigation to customer**

### Navigation Options

- **With coordinates**: Opens Google Maps with precise GPS location
- **Without coordinates**: Opens Google Maps with address search
- **Fallback**: Shows address text for manual navigation

## API Costs & Free Tier

### What's FREE

✅ **Without API Key:**
- Manual address entry
- Current location detection
- Basic address storage
- Driver navigation via Maps URLs (no API calls)

✅ **With API Key (Free Tier):**
- 28,000 map loads per month
- 100,000 autocomplete requests per month
- 40,000 geocoding requests per month

For 100-300 deliveries/month with 3-5 map views each:
- **Total usage**: ~1,500 map loads/month
- **Cost**: $0 (well within free tier)

### When You'll Pay

Only if you exceed:
- 28,000 map loads/month ($7 per 1,000 additional)
- 100,000 autocomplete calls/month ($2.83 per 1,000 additional)

At 10km delivery radius with your volume, **you will NOT exceed the free tier**.

## Troubleshooting

### Google Maps Not Loading

**Problem**: "Loading Google Maps..." message persists

**Solutions**:
1. Check API key is correctly set in settings
2. Verify API key has no typos
3. Confirm Maps JavaScript API is enabled in Google Cloud Console
4. Check browser console for error messages
5. Ensure domain is whitelisted in API key restrictions

### Autocomplete Not Working

**Problem**: No address suggestions appear

**Solutions**:
1. Verify Places API is enabled
2. Check API key restrictions allow your domain
3. Try clearing browser cache
4. Test with API key restrictions temporarily disabled

### Location Not Accurate

**Problem**: Marker is not at the exact location

**Solutions**:
1. Use the map view and drag the marker
2. Enable "Show Map" and manually adjust
3. Use "Current Location" if you're at the delivery site
4. Double-check the address with the customer

### No API Key Available

**Problem**: Don't have Google Maps API key yet

**Workaround**:
1. Type address manually in the input field
2. Use "Current Location" for GPS coordinates
3. Coordinates will be captured even without API key
4. Driver can still navigate using saved coordinates

## Best Practices

### For Admins

1. ✅ **Always verify the address with the customer**
2. ✅ **Use autocomplete when possible to avoid typos**
3. ✅ **Check the map view for first-time addresses**
4. ✅ **Save common locations for quick reuse**
5. ✅ **Note landmarks in delivery notes if address is tricky**

### For System Administrators

1. ✅ **Secure your API key with domain restrictions**
2. ✅ **Monitor API usage in Google Cloud Console**
3. ✅ **Set up billing alerts at 50% of free tier**
4. ✅ **Regularly backup order location data**
5. ✅ **Test location features after any system updates**

## Privacy & Security

### Customer Data

- Delivery addresses are stored securely in the database
- Only authorized admin and assigned drivers can view locations
- Coordinates are used solely for navigation purposes
- No location data is shared with third parties (except Google Maps for display)

### API Key Protection

- Never expose API key in client-side code (we load it from server settings)
- Use HTTP referrer restrictions
- Rotate API key if suspected of being compromised
- Monitor usage for unusual activity

## Related Documentation

- [Google Maps Integration Plan](./GOOGLE_MAPS_INTEGRATION.md)
- [Driver Delivery Workflow](./DRIVER_DELIVERY.md)
- [Dispatch System Overview](./DISPATCH_SYSTEM.md)

## Support

If you encounter issues:
1. Check this documentation first
2. Review browser console errors
3. Verify API key configuration
4. Contact system administrator

---

**Version**: 1.0  
**Last Updated**: November 2025  
**Status**: ✅ Implemented & Production Ready
