'use client';

import { useEffect, useRef, useState } from 'react';

type LatLng = { lat: number; lng: number };

export interface GoogleLiveMapProps {
  destination: LatLng & { address?: string };
  driver?: LatLng | null;
  zoom?: number;
  className?: string;
  onRouteSummary?: (summary: { distanceKm?: number; durationText?: string }) => void;
}

declare global {
  interface Window {
    googleMapsInit?: () => void;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
  if (existing && (window as any).google && (window as any).google.maps) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

export default function GoogleLiveMap({ destination, driver, zoom = 13, className, onRouteSummary }: GoogleLiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map>();
  const driverMarkerRef = useRef<google.maps.Marker>();
  const destMarkerRef = useRef<google.maps.Marker>();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer>();
  const directionsServiceRef = useRef<google.maps.DirectionsService>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      return;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        setError(null);

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center: destination,
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }

        const map = mapRef.current!;

        // Destination marker
        if (!destMarkerRef.current) {
          destMarkerRef.current = new google.maps.Marker({
            position: destination,
            map,
            label: '🎯',
            title: destination.address || 'Delivery Destination',
          });
        } else {
          destMarkerRef.current.setPosition(destination);
        }

        // Driver marker
        if (driver) {
          if (!driverMarkerRef.current) {
            driverMarkerRef.current = new google.maps.Marker({
              position: driver,
              map,
              label: '🚚',
              title: 'Driver Location',
            });
          } else {
            driverMarkerRef.current.setPosition(driver);
          }
        }

        // Directions
        if (!directionsServiceRef.current) {
          directionsServiceRef.current = new google.maps.DirectionsService();
        }
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 5 },
          });
          directionsRendererRef.current.setMap(map);
        }

        if (driver) {
          directionsServiceRef.current.route(
            {
              origin: driver,
              destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                directionsRendererRef.current?.setDirections(result);

                const leg = result.routes?.[0]?.legs?.[0];
                if (leg) {
                  const distanceKm = leg.distance ? leg.distance.value / 1000 : undefined;
                  const durationText = leg.duration?.text;
                  onRouteSummary?.({ distanceKm, durationText });

                  const bounds = new google.maps.LatLngBounds();
                  bounds.extend(leg.start_location);
                  bounds.extend(leg.end_location);
                  map.fitBounds(bounds, 50);
                }
              }
            }
          );
        } else {
          // No driver yet; center on destination
          map.setCenter(destination);
          map.setZoom(zoom);
        }
      })
      .catch((e) => {
        console.error('Google Maps init failed:', e);
        setError('Failed to load Google Maps. Please check your API key configuration.');
      });

    return () => {
      cancelled = true;
    };
  }, [destination.lat, destination.lng, driver?.lat, driver?.lng, zoom]);

  if (error) {
    return (
      <div className={className || 'w-full h-[500px] bg-gray-100'}>
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Google Maps Configuration Required</h3>
            <p className="text-sm text-yellow-700 mb-4">{error}</p>
            <div className="text-xs text-yellow-600 text-left space-y-2">
              <p className="font-semibold">To fix this error:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Go to Google Cloud Console</li>
                <li>Enable Maps JavaScript API & Directions API</li>
                <li>Configure API key restrictions for localhost</li>
                <li>Update NEXT_PUBLIC_GOOGLE_MAPS_KEY in .env.local</li>
                <li>Restart the dev server</li>
              </ol>
              <p className="mt-3 pt-3 border-t border-yellow-300">
                See <code className="bg-yellow-100 px-1 rounded">docs/GOOGLE_MAPS_SETUP.md</code> for details.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className || 'w-full h-[500px] bg-gray-100'} />;
}
