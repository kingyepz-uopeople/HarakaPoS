# Google Maps Setup

This project uses Google Maps for admin live tracking and routing.

## Keys

- Client-side: `NEXT_PUBLIC_GOOGLE_MAPS_KEY`
  - Restrict by HTTP referrer (production domain, localhost for dev)
  - Used by the browser to load Maps JavaScript API
- Server-side: `Maps_SERVER_KEY`
  - Restrict by server IP address
  - Used for backend Geocoding/Distance Matrix (future step)

## Required APIs
Enable in Google Cloud Console for your project:
- Maps JavaScript API (client)
- Directions API (client)
- Geocoding API (server recommended)
- Distance Matrix API (server recommended)
- Places API (optional: address autocomplete)

## .env configuration
Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_browser_key
Maps_SERVER_KEY=your_server_key
```

Do NOT commit real keys.

## Admin Tracking Map
- Page: `app/dashboard/track-drivers/page.tsx`
- Component: `components/GoogleLiveMap.tsx`
- Behavior:
  - Shows destination and driver markers
  - Draws driving route (Directions API)
  - Updates ETA/distance from Google when available; falls back to Haversine until then

## Security tips
- Rotate keys periodically
- Limit referrers (client) and IPs (server)
- Only enable the APIs you actually use

