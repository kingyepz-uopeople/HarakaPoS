'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Navigation, MapPin, Maximize2, Minimize2, RefreshCw, Crosshair } from 'lucide-react';

interface LatLng {
  lat: number;
  lng: number;
}

interface DriverLiveMapProps {
  destination: LatLng & { address?: string };
  driverPosition?: LatLng | null;
  className?: string;
  showNavigateButton?: boolean;
  onRouteSummary?: (summary: { distanceKm: number; durationText: string }) => void;
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  
  // Check if google maps is already loaded
  if ((window as any).google?.maps) {
    return Promise.resolve();
  }

  const existing = document.getElementById('google-maps-script');
  if (existing) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error('Google Maps load timeout'));
      }, 10000);
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function DriverLiveMap({
  destination,
  driverPosition,
  className = '',
  showNavigateButton = true,
  onRouteSummary,
}: DriverLiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map>();
  const driverMarkerRef = useRef<google.maps.Marker>();
  const destMarkerRef = useRef<google.maps.Marker>();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer>();
  const directionsServiceRef = useRef<google.maps.DirectionsService>();
  
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const isValidCoord = (lat: unknown, lng: unknown): boolean => {
    return typeof lat === 'number' && typeof lng === 'number' &&
      Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  };

  const destinationValid = destination && isValidCoord(destination.lat, destination.lng);
  const driverValid = driverPosition && isValidCoord(driverPosition.lat, driverPosition.lng);

  // Initialize map
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    if (!destinationValid) {
      setError('Invalid destination coordinates');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        setError(null);

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center: { lat: destination.lat, lng: destination.lng },
            zoom: 14,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          directionsServiceRef.current = new google.maps.DirectionsService();
          directionsRendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#10b981',
              strokeOpacity: 0.9,
              strokeWeight: 5,
            },
          });
          directionsRendererRef.current.setMap(mapRef.current);
        }

        // Destination marker (red pin)
        if (!destMarkerRef.current) {
          destMarkerRef.current = new google.maps.Marker({
            position: { lat: destination.lat, lng: destination.lng },
            map: mapRef.current,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
            title: destination.address || 'Destination',
            zIndex: 100,
          });
          
          // Add info window for destination
          const infoWindow = new google.maps.InfoWindow({
            content: `<div class="p-2"><strong>📍 Destination</strong><br/>${destination.address || 'Customer Location'}</div>`,
          });
          destMarkerRef.current.addListener('click', () => {
            infoWindow.open(mapRef.current, destMarkerRef.current);
          });
        }

        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Google Maps init error:', err);
        setError('Failed to load Google Maps');
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destinationValid, destination?.lat, destination?.lng]);

  // Update driver marker and route when position changes
  useEffect(() => {
    if (!mapRef.current || !driverValid) return;

    const map = mapRef.current;

    // Update or create driver marker (truck icon)
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        position: { lat: driverPosition.lat, lng: driverPosition.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: 0,
        },
        title: 'Your Location',
        zIndex: 200,
      });
    } else {
      // Smooth animation to new position
      driverMarkerRef.current.setPosition({ lat: driverPosition.lat, lng: driverPosition.lng });
    }

    setLastUpdate(new Date());

    // Calculate route if both positions valid
    if (destinationValid && directionsServiceRef.current && directionsRendererRef.current) {
      directionsServiceRef.current.route(
        {
          origin: { lat: driverPosition.lat, lng: driverPosition.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);

            const leg = result.routes?.[0]?.legs?.[0];
            if (leg) {
              const distKm = leg.distance ? leg.distance.value / 1000 : 0;
              const durText = leg.duration?.text || '';
              
              setDistance(`${distKm.toFixed(1)} km`);
              setDuration(durText);
              
              onRouteSummary?.({ distanceKm: distKm, durationText: durText });

              // Fit bounds to show both markers
              const bounds = new google.maps.LatLngBounds();
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
              map.fitBounds(bounds, { top: 50, bottom: 100, left: 50, right: 50 });
            }
          }
        }
      );
    }
  }, [driverPosition?.lat, driverPosition?.lng, driverValid, destinationValid, destination?.lat, destination?.lng]);

  const centerOnDriver = useCallback(() => {
    if (mapRef.current && driverValid) {
      mapRef.current.panTo({ lat: driverPosition!.lat, lng: driverPosition!.lng });
      mapRef.current.setZoom(16);
    }
  }, [driverValid, driverPosition]);

  const openExternalNavigation = useCallback(() => {
    if (!destinationValid) return;
    
    let url = '';
    if (driverValid) {
      url = `https://www.google.com/maps/dir/?api=1&origin=${driverPosition!.lat},${driverPosition!.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
    }
    window.open(url, '_blank');
  }, [driverValid, driverPosition, destinationValid, destination]);

  // Error state
  if (error) {
    return (
      <div className={`bg-gray-100 rounded-xl ${className}`}>
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm">
            <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Map Error</p>
            <p className="text-xs text-yellow-700">{error}</p>
            {showNavigateButton && (
              <button
                onClick={openExternalNavigation}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                <Navigation className="w-4 h-4" />
                Open in Google Maps
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Map Container */}
      <div 
        ref={containerRef} 
        className={`bg-gray-100 w-full ${isFullscreen ? 'h-screen' : 'h-72 sm:h-80 md:h-96'}`}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-3 right-3 flex gap-2 z-10">
        {driverValid && (
          <button
            onClick={centerOnDriver}
            className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
            title="Center on my location"
          >
            <Crosshair className="w-5 h-5 text-blue-600" />
          </button>
        )}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-gray-700" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </div>

      {/* Route Info Panel */}
      {!isLoading && (distance || duration) && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-white rounded-xl shadow-lg p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Live indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                  </span>
                  <span className="text-xs font-medium text-green-700">LIVE</span>
                </div>

                {/* Distance */}
                {distance && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-900">{distance}</span>
                  </div>
                )}

                {/* Duration */}
                {duration && (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">{duration}</span>
                  </div>
                )}
              </div>

              {/* Navigate Button */}
              {showNavigateButton && (
                <button
                  onClick={openExternalNavigation}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span className="hidden sm:inline">Navigate</span>
                </button>
              )}
            </div>

            {/* Last update time */}
            {lastUpdate && (
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-500">
                <RefreshCw className="w-3 h-3" />
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No GPS Message */}
      {!isLoading && !driverValid && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-800">Waiting for GPS signal...</span>
              </div>
              {showNavigateButton && (
                <button
                  onClick={openExternalNavigation}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Navigate</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
