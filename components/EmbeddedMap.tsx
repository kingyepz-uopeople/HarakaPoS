"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, MapPin, Maximize2, Minimize2, Loader } from "lucide-react";

interface EmbeddedMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  customerName?: string;
  showDirections?: boolean;
}

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao";

export default function EmbeddedMap({
  latitude,
  longitude,
  address,
  customerName = "Customer",
  showDirections = true,
}: EmbeddedMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  // Load Google Maps Script
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Get user's current location
  useEffect(() => {
    if (showDirections && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, [showDirections]);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || typeof window === 'undefined' || !window.google?.maps) return;

    const destinationLat = latitude || -1.286389; // Default to Nairobi
    const destinationLng = longitude || 36.817223;

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: destinationLat, lng: destinationLng },
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
    });

    googleMapRef.current = map;

    // Add destination marker
    new window.google.maps.Marker({
      position: { lat: destinationLat, lng: destinationLng },
      map: map,
      title: customerName,
      label: "📍",
      animation: window.google.maps.Animation.DROP,
    });

    // Show directions if user location is available
    if (showDirections && userLocation && window.google?.maps?.DirectionsService) {
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
      });
      directionsRendererRef.current = directionsRenderer;

      directionsService.route(
        {
          origin: { lat: userLocation.lat, lng: userLocation.lng },
          destination: { lat: destinationLat, lng: destinationLng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
            const route = result.routes[0]?.legs[0];
            if (route) {
              setDistance(route.distance?.text || "");
              setDuration(route.duration?.text || "");
            }
          }
        }
      );
    }
  }, [mapLoaded, latitude, longitude, userLocation, customerName, showDirections]);

  const openInGoogleMaps = () => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      window.open(url, '_blank');
    } else if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Delivery Location</h3>
            <p className="text-sm text-gray-600">{customerName}</p>
          </div>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-gray-600" />
          ) : (
            <Maximize2 className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Map */}
      <div className={`relative ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[300px] md:h-[400px]'}`}>
        {!mapLoaded ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>

      {/* Distance & Duration Info */}
      {(distance || duration) && (
        <div className="px-4 py-3 bg-blue-50 border-y border-blue-100 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm">
            {distance && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">{distance}</span>
              </div>
            )}
            {duration && (
              <div className="flex items-center space-x-1">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">{duration} away</span>
              </div>
            )}
          </div>
          <span className="text-xs text-blue-600 font-medium">Via fastest route</span>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={openInGoogleMaps}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors"
        >
          <Navigation className="w-5 h-5" />
          <span>Open in Google Maps & Navigate</span>
        </button>
        
        {latitude && longitude && (
          <div className="mt-3 text-center text-xs text-gray-500 flex items-center justify-center space-x-2">
            <MapPin className="w-3 h-3" />
            <span>GPS: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
