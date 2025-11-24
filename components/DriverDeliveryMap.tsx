'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2, Navigation, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1Ijoia2luZ3llcHoiLCJhIjoiY202YmliMHF1MGM4NTJqcjBpZ2RsZWE1eiJ9.nvuCl-_Dw6Jnj1Ls_KcOAA';
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

interface DriverDeliveryMapProps {
  origin: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
  className?: string;
}

type MapType = 'osm' | 'mapbox' | 'google';

export default function DriverDeliveryMap({ origin, destination, className = '' }: DriverDeliveryMapProps) {
  const [mapType, setMapType] = useState<MapType>('osm');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const [routeLoaded, setRouteLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  // OSM/Leaflet refs
  const osmMapRef = useRef<HTMLDivElement>(null);
  const osmMapInstance = useRef<L.Map | null>(null);
  const routingControl = useRef<any>(null);

  // Mapbox refs
  const mapboxMapRef = useRef<HTMLDivElement>(null);
  const mapboxMapInstance = useRef<mapboxgl.Map | null>(null);

  // Google Maps refs
  const googleMapRef = useRef<HTMLDivElement>(null);
  const googleMapInstance = useRef<google.maps.Map | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

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

  // Initialize OSM Map
  useEffect(() => {
    if (mapType !== 'osm' || !osmMapRef.current || osmMapInstance.current) return;

    const destValid = destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && !Number.isNaN(destination.lat) && !Number.isNaN(destination.lng);
    const initialCenter: [number, number] = destValid ? [destination.lat, destination.lng] : [origin.lat, origin.lng];

    const map = L.map(osmMapRef.current).setView(initialCenter, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    osmMapInstance.current = map;

    return () => {
      if (osmMapInstance.current) {
        osmMapInstance.current.remove();
        osmMapInstance.current = null;
      }
    };
  }, [mapType]);

  // Create OSM routing
  useEffect(() => {
    if (mapType !== 'osm') return;
    const map = osmMapInstance.current;
    if (!map) return;

    const start = (useCurrentLocation && currentLocation) ? currentLocation : origin;
    const startValid = start && typeof start.lat === 'number' && typeof start.lng === 'number' && !Number.isNaN(start.lat) && !Number.isNaN(start.lng);
    const destValid = destination && typeof destination.lat === 'number' && typeof destination.lng === 'number' && !Number.isNaN(destination.lat) && !Number.isNaN(destination.lng);

    if (!startValid || !destValid) return;

    if (routingControl.current) {
      try {
        map.removeControl(routingControl.current);
      } catch (e) {
        console.error('Error removing routing control:', e);
      }
    }

    const L_routing = (L as any).Routing;
    const control = L_routing.control({
      waypoints: [
        L.latLng(start.lat, start.lng),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      lineOptions: {
        styles: [{ color: '#10b981', weight: 6, opacity: 0.8 }]
      },
      createMarker: function(i: number, waypoint: any) {
        const marker = L.marker(waypoint.latLng, {
          draggable: false,
          icon: L.icon({
            iconUrl: i === 0 
              ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
              : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        });
        return marker;
      }
    }).addTo(map);

    control.on('routesfound', function(e: any) {
      const routes = e.routes;
      const summary = routes[0].summary;
      setDistance(`${(summary.totalDistance / 1000).toFixed(1)} km`);
      const hours = Math.floor(summary.totalTime / 3600);
      const minutes = Math.round((summary.totalTime % 3600) / 60);
      setDuration(hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`);
      setRouteLoaded(true);
    });

    routingControl.current = control;

    return () => {
      if (routingControl.current && map) {
        try {
          map.removeControl(routingControl.current);
        } catch (e) {}
        routingControl.current = null;
      }
    };
  }, [mapType, useCurrentLocation, currentLocation, origin, destination]);

  // Initialize Mapbox Map
  useEffect(() => {
    if (mapType !== 'mapbox' || !mapboxMapRef.current || mapboxMapInstance.current) return;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    const start = (useCurrentLocation && currentLocation) ? currentLocation : origin;
    const map = new mapboxgl.Map({
      container: mapboxMapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [destination.lng, destination.lat],
      zoom: 12,
    });

    // Add markers
    new mapboxgl.Marker({ color: '#10b981' })
      .setLngLat([start.lng, start.lat])
      .addTo(map);

    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([destination.lng, destination.lat])
      .addTo(map);

    // Get directions
    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_ACCESS_TOKEN}`)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          setDistance(`${(route.distance / 1000).toFixed(1)} km`);
          const minutes = Math.round(route.duration / 60);
          setDuration(minutes > 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes} min`);
          setRouteLoaded(true);

          map.on('load', () => {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry
              }
            });

            map.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#10b981',
                'line-width': 6,
                'line-opacity': 0.8
              }
            });
          });
        }
      });

    mapboxMapInstance.current = map;

    return () => {
      if (mapboxMapInstance.current) {
        mapboxMapInstance.current.remove();
        mapboxMapInstance.current = null;
      }
    };
  }, [mapType, useCurrentLocation, currentLocation, origin, destination]);

  // Initialize Google Maps
  useEffect(() => {
    if (mapType !== 'google' || !googleMapRef.current || !GOOGLE_MAPS_KEY) return;

    const initGoogleMap = async () => {
      try {
        const start = (useCurrentLocation && currentLocation) ? currentLocation : origin;
        
        const map = new google.maps.Map(googleMapRef.current!, {
          center: { lat: destination.lat, lng: destination.lng },
          zoom: 12,
        });

        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#10b981',
            strokeWeight: 6,
            strokeOpacity: 0.8
          }
        });

        const request = {
          origin: { lat: start.lat, lng: start.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.current.route(request, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.current?.setDirections(result);
            const route = result.routes[0].legs[0];
            setDistance(route.distance?.text || '');
            setDuration(route.duration?.text || '');
            setRouteLoaded(true);
          }
        });

        googleMapInstance.current = map;
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initGoogleMap();

    return () => {
      googleMapInstance.current = null;
      directionsService.current = null;
      directionsRenderer.current = null;
    };
  }, [mapType, useCurrentLocation, currentLocation, origin, destination]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const hasStartForUi = (useCurrentLocation && currentLocation) || origin;
  const hasDestForUi = destination;

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Map Type Selector - Mobile Optimized */}
      <div className="absolute top-2 left-2 z-[1001] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="flex">
          <button
            onClick={() => { setMapType('osm'); setRouteLoaded(false); }}
            className={`px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
              mapType === 'osm'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            OSM
          </button>
          <button
            onClick={() => { setMapType('mapbox'); setRouteLoaded(false); }}
            className={`px-3 py-2 text-xs sm:text-sm font-medium transition-colors border-x border-gray-200 dark:border-gray-700 ${
              mapType === 'mapbox'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Mapbox
          </button>
          <button
            onClick={() => { setMapType('google'); setRouteLoaded(false); }}
            className={`px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
              mapType === 'google'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Google
          </button>
        </div>
      </div>

      {/* Map Containers */}
      <div 
        ref={osmMapRef} 
        className={`bg-gray-100 dark:bg-gray-800 ${
          isFullscreen ? 'h-screen' : 'h-64 sm:h-80'
        } ${mapType === 'osm' ? 'block' : 'hidden'}`}
      />
      <div 
        ref={mapboxMapRef} 
        className={`bg-gray-100 dark:bg-gray-800 ${
          isFullscreen ? 'h-screen' : 'h-64 sm:h-80'
        } ${mapType === 'mapbox' ? 'block' : 'hidden'}`}
      />
      <div 
        ref={googleMapRef} 
        className={`bg-gray-100 dark:bg-gray-800 ${
          isFullscreen ? 'h-screen' : 'h-64 sm:h-80'
        } ${mapType === 'google' ? 'block' : 'hidden'}`}
      />

      {/* Fullscreen Toggle */}
      <div className="absolute top-2 right-2 z-[1001]">
        <button
          onClick={toggleFullscreen}
          className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* Route Info Card - Mobile Optimized */}
      {routeLoaded && (distance || duration) && !isFullscreen && (
        <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
          <div className="flex items-center justify-between gap-2">
            {useCurrentLocation && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full whitespace-nowrap">
                📍 GPS
              </span>
            )}
            
            {distance && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-500" />
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{distance}</span>
              </div>
            )}
            
            {duration && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{duration}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {!routeLoaded && hasStartForUi && hasDestForUi && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000]">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-emerald-600"></div>
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Calculating route...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
