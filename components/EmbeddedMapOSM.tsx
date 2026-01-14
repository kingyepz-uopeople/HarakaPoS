'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Navigation, MapPin } from 'lucide-react';

// Lazy load Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;
let cssLoaded = false;

const loadLeaflet = async () => {
  if (typeof window === 'undefined') return null;
  if (L) return L;
  
  // Load CSS via link elements
  if (!cssLoaded) {
    const leafletCss = document.createElement('link');
    leafletCss.rel = 'stylesheet';
    leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(leafletCss);
    
    const routingCss = document.createElement('link');
    routingCss.rel = 'stylesheet';
    routingCss.href = 'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css';
    document.head.appendChild(routingCss);
    
    cssLoaded = true;
  }
  
  const leaflet = await import('leaflet');
  await import('leaflet-routing-machine');
  
  // Fix Leaflet default marker icon issue
  delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
  leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
  
  L = leaflet;
  return leaflet;
};

interface EmbeddedMapOSMProps {
  origin: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
  className?: string;
}

export default function EmbeddedMapOSM({ origin, destination, className = '' }: EmbeddedMapOSMProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routingControl = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [routeLoaded, setRouteLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Get driver's current location
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setUseCurrentLocation(true);
        },
        (error) => {
          console.log('Could not get current location, using default:', error);
          setUseCurrentLocation(false);
        }
      );
    }
  }, []);

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    const initMap = async () => {
      const leaflet = await loadLeaflet();
      if (!leaflet || cancelled || !mapRef.current) return;

      setLeafletLoaded(true);

      // Choose a safe initial center: destination if valid, else origin, else Nairobi default
      const destValid = destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && !Number.isNaN(destination.lat) && !Number.isNaN(destination.lng);
      const initialCenter: [number, number] = destValid
        ? [destination.lat, destination.lng]
        : [origin.lat, origin.lng];

      const map = leaflet.map(mapRef.current).setView(initialCenter, 13);

      // Add OpenStreetMap tiles
      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstance.current = map;
    };

    initMap();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [origin.lat, origin.lng, destination?.lat, destination?.lng]);

  // Create or update routing when we have a valid start and destination
  useEffect(() => {
    if (!leafletLoaded || !L) return;
    const map = mapInstance.current;
    if (!map) return;

    const start = (useCurrentLocation && currentLocation) ? currentLocation : origin;
    const startValid = start && typeof start.lat === 'number' && typeof start.lng === 'number' && !Number.isNaN(start.lat) && !Number.isNaN(start.lng);
    const destValid = destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && !Number.isNaN(destination.lat) && !Number.isNaN(destination.lng);

    // Wait until we have both points
    if (!startValid || !destValid) {
      return;
    }

    // If a routing control exists, remove it before creating a new one
    if (routingControl.current) {
      try {
        map.removeControl(routingControl.current);
      } catch (e) {
        // ignore
      }
      routingControl.current = null;
    }

    setRouteLoaded(false);

    const routing = (L as any).Routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 5, opacity: 0.8 }]
      },
      createMarker: function(i: number, waypoint: any) {
        const icon = L!.icon({
          iconUrl: i === 0 
            ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
            : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });

        const marker = L!.marker(waypoint.latLng, { icon });
        
        if (i === 0) {
          const startText = useCurrentLocation 
            ? '<strong>Your Current Location</strong><br>(Driver GPS)' 
            : `<strong>Start:</strong><br>${origin.address || 'Default Location'}`;
          marker.bindPopup(startText);
        } else if (i === 1 && destination.address) {
          marker.bindPopup(`<strong>Destination:</strong><br>${destination.address}`);
        }
        
        return marker;
      }
    }).addTo(map);

    routing.on('routesfound', function(e: any) {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const route = routes[0];
        
        const distanceKm = (route.summary.totalDistance / 1000).toFixed(2);
        setDistance(`${distanceKm} km`);
        
        const durationMin = Math.round(route.summary.totalTime / 60);
        const hours = Math.floor(durationMin / 60);
        const mins = durationMin % 60;
        
        if (hours > 0) {
          setDuration(`${hours}h ${mins}m`);
        } else {
          setDuration(`${mins} min`);
        }
        
        setRouteLoaded(true);
      }
    });

    routing.on('routingerror', function(e: any) {
      console.error('Routing error:', e);
      setRouteLoaded(false);
    });

    routingControl.current = routing;

    return () => {
      if (routingControl.current) {
        try {
          map.removeControl(routingControl.current);
        } catch (e) {
          // ignore
        }
        routingControl.current = null;
      }
    };
  }, [leafletLoaded, useCurrentLocation, currentLocation?.lat, currentLocation?.lng, origin.lat, origin.lng, destination.lat, destination.lng]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Determine if we have enough info to attempt routing (for loading UI)
  const hasStartForUi = useCurrentLocation
    ? (currentLocation?.lat !== undefined && currentLocation?.lng !== undefined)
    : (typeof origin.lat === 'number' && typeof origin.lng === 'number');
  const hasDestForUi = (typeof destination.lat === 'number' && typeof destination.lng === 'number');

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef} 
        className={`bg-gray-100 dark:bg-gray-800 rounded-lg ${
          isFullscreen ? 'h-screen' : 'h-96'
        }`}
      />

      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Route Info Card */}
      {routeLoaded && (distance || duration) && (
        <div className="absolute top-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Route Information</h3>
          </div>
          
          <div className="space-y-2 text-sm">
            {useCurrentLocation && (
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  Using Your GPS Location
                </span>
              </div>
            )}
            
            {distance && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">Distance:</span>
                <span className="font-medium text-gray-900 dark:text-white">{distance}</span>
              </div>
            )}
            
            {duration && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                <span className="font-medium text-gray-900 dark:text-white">{duration}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by OpenStreetMap & OSRM
            </p>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!routeLoaded && hasStartForUi && hasDestForUi && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000]">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-700 dark:text-gray-300">Calculating route...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
