# Google Maps API Error - Quick Fix Guide

## Error
```
Google Maps JavaScript API error: InvalidKeyMapError
```

## Cause
Your Google Maps API key is not properly configured or doesn't have the required APIs enabled.

## Solution: Fix Your API Key

### Step 1: Go to Google Cloud Console
1. Visit [https://console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. Select your project (or create a new one)

### Step 2: Enable Required APIs
1. Click **APIs & Services** → **Library** (left sidebar)
2. Search for and enable each of these APIs:
   - ✅ **Maps JavaScript API** (REQUIRED)
   - ✅ **Directions API** (REQUIRED)
   - ✅ **Geocoding API** (Recommended)
   - ✅ **Distance Matrix API** (Recommended)
   - ✅ **Places API** (Optional - for autocomplete)

### Step 3: Create/Configure API Key
1. Go to **APIs & Services** → **Credentials**
2. If you don't have an API key, click **+ CREATE CREDENTIALS** → **API key**
3. Click on your API key to configure it

### Step 4: Set API Key Restrictions
1. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Click **+ ADD AN ITEM** and add:
     ```
     http://localhost:3000/*
     http://localhost:*
     ```
   - If you have a production domain, add it too:
     ```
     https://yourdomain.com/*
     ```

2. Under **API restrictions**:
   - Select **Restrict key**
   - Check the APIs you enabled in Step 2

3. Click **SAVE**

### Step 5: Update Your .env.local
Copy your API key and update the file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your-actual-api-key-here
```

### Step 6: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Alternative: Use OpenStreetMap (Free)

If you want to avoid Google Maps costs or complexity, the project already has OpenStreetMap support:

1. The app has `EmbeddedMapOSM.tsx` component that works without any API keys
2. No configuration needed - it's completely free
3. Consider switching if you don't need Google-specific features

---

## Current API Key Status
Your key: `AIzaSyCzXG6cCAAonubk5DTTd64ui5QKWUokly8`

**Check:**
- ✅ Key exists in .env.local
- ❌ APIs not enabled or restrictions too strict
- ❌ Causing InvalidKeyMapError

---

## Troubleshooting

### Error persists after following steps?
1. Wait 2-5 minutes for Google Cloud changes to propagate
2. Clear browser cache and hard refresh (Ctrl+Shift+R)
3. Restart dev server completely
4. Check browser console for specific error details

### Don't want to use Google Maps?
The component now shows a helpful error message with instructions instead of crashing.

### Need help?
See full documentation: `docs/GOOGLE_MAPS_SETUP.md`
