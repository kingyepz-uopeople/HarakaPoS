# Mapbox Setup Instructions

## How to Add Your Mapbox API Key

### Step 1: Get Your Mapbox Access Token

1. Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Sign in or create a free account
3. Navigate to "Access tokens" section
4. Copy your **Default public token** (starts with `pk.`)
   - Or create a new token with these scopes:
     - ✅ `styles:read`
     - ✅ `fonts:read`
     - ✅ `sprites:read`

### Step 2: Add Token to Your Code

Open `components/OpenStreetMapLocationPicker.tsx` and find this line (around line 19):

```typescript
const MAPBOX_ACCESS_TOKEN = "pk.YOUR_MAPBOX_TOKEN_HERE";
```

Replace `"pk.YOUR_MAPBOX_TOKEN_HERE"` with your actual token:

```typescript
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsYWJjZGVmIn0...";
```

### Step 3: Save and Test

1. Save the file
2. Refresh your browser
3. Go to create/edit an order
4. In the delivery location field, click the **Mapbox** button
5. The map should load with Mapbox's street style

## Benefits of Mapbox

- ✅ **Free Tier**: 50,000 map loads/month (generous for most businesses)
- ✅ **Beautiful Maps**: Modern, customizable map styles
- ✅ **Fast Performance**: Optimized vector tiles
- ✅ **No Billing Required**: Unlike Google Maps, works with free tier
- ✅ **Great for Kenya**: Good coverage and detail

## Pricing (as of 2024)

- **Free**: Up to 50,000 map loads/month
- **Pay as you grow**: $5 per 1,000 additional loads
- **Much cheaper than Google Maps**

## Comparison of All Three Providers

| Feature | OpenStreetMap | Mapbox | Google Maps |
|---------|---------------|--------|-------------|
| **Cost** | 100% Free | Free tier + paid | Requires billing |
| **API Key** | Not needed | Required | Required |
| **Monthly Free Tier** | Unlimited | 50,000 loads | Requires credit card |
| **Map Quality** | Good | Excellent | Excellent |
| **Kenya Coverage** | Good | Very Good | Excellent |
| **Best For** | Budget-conscious | Professional look | Enterprise needs |

## Recommended Setup

1. **Default**: Use **OpenStreetMap** (100% free, no setup needed)
2. **Optional**: Add **Mapbox** token for better-looking maps
3. **Only if needed**: Enable **Google Maps** with billing setup

## Current Features

All three map providers support:
- ✅ Click to set location
- ✅ Drag marker to adjust
- ✅ Reverse geocoding (coordinates → address)
- ✅ Google Maps share link parsing (works with all providers!)
- ✅ Current location detection
- ✅ Address search

## Troubleshooting

**Map not showing?**
- Check that your token is correctly pasted
- Make sure it starts with `pk.` (not `sk.`)
- Verify the token is active in your Mapbox account

**"Unauthorized" error?**
- Your token might be restricted to specific domains
- In Mapbox dashboard, add `localhost` and your domain to allowed URLs

## Support

For Mapbox support: [https://docs.mapbox.com/help/](https://docs.mapbox.com/help/)
