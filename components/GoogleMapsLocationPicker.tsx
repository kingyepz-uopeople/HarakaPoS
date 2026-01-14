"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface GoogleMapsLocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData | null) => void;
  apiKey?: string;
  placeholder?: string;
}

export default function GoogleMapsLocationPicker({
  value,
  onChange,
  apiKey,
  placeholder = "Enter delivery address..."
}: GoogleMapsLocationPickerProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // Load Google Maps script
  useEffect(() => {
    // Check if script is already loaded
    if (window.google && window.google.maps) {
      setIsScriptLoaded(true);
      return;
    }

    // Only load if API key is provided
    if (!apiKey) {
      console.log("Google Maps API key not provided. Location features will be limited.");
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setIsScriptLoaded(false);
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup is handled by the script tag removal (optional)
    };
  }, [apiKey]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          console.log("No geometry for this place");
          return;
        }

        const locationData: LocationData = {
          address: place.formatted_address || place.name || '',
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        };

        onChange(locationData);
        
        // Update map if visible
        if (mapInstanceRef.current && markerRef.current) {
          const position = { lat: locationData.latitude, lng: locationData.longitude };
          mapInstanceRef.current.setCenter(position);
          markerRef.current.setPosition(position);
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error("Error initializing Google Maps Autocomplete:", error);
    }
  }, [isScriptLoaded, onChange]);

  // Initialize map
  useEffect(() => {
    if (!isScriptLoaded || !showMap || !mapRef.current || mapInstanceRef.current) return;

    const initialPosition = value 
      ? { lat: value.latitude, lng: value.longitude }
      : { lat: -1.286389, lng: 36.817223 }; // Nairobi, Kenya default

    const map = new google.maps.Map(mapRef.current, {
      center: initialPosition,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new google.maps.Marker({
      position: initialPosition,
      map: map,
      draggable: true,
      title: "Delivery Location",
    });

    // Handle marker drag
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      if (!position) return;

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: position }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onChange({
            address: results[0].formatted_address,
            latitude: position.lat(),
            longitude: position.lng(),
          });
          
          if (inputRef.current) {
            inputRef.current.value = results[0].formatted_address;
          }
        }
      });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  }, [isScriptLoaded, showMap, value, onChange]);

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          address: "Current Location",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Reverse geocode to get address
        if (isScriptLoaded) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: locationData.latitude, lng: locationData.longitude } },
            (results, status) => {
              if (status === 'OK' && results && results[0]) {
                locationData.address = results[0].formatted_address;
                if (inputRef.current) {
                  inputRef.current.value = locationData.address;
                }
              }
              onChange(locationData);
              setIsLoadingLocation(false);
            }
          );
        } else {
          onChange(locationData);
          setIsLoadingLocation(false);
        }

        // Update map if visible
        if (mapInstanceRef.current && markerRef.current) {
          const position = { lat: locationData.latitude, lng: locationData.longitude };
          mapInstanceRef.current.setCenter(position);
          markerRef.current.setPosition(position);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Failed to get your current location");
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          defaultValue={value?.address || ''}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={isLoadingLocation}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isLoadingLocation ? 'Getting location...' : 'Use Current Location'}
        </button>

        {isScriptLoaded && (
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        )}
      </div>

      {showMap && isScriptLoaded && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <div ref={mapRef} className="h-64 w-full" />
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
            Drag the marker to adjust the delivery location
          </div>
        </div>
      )}

      {value && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Address:</span>
            <span>{value.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <span><span className="font-medium">Lat:</span> {value.latitude.toFixed(6)}</span>
            <span><span className="font-medium">Lng:</span> {value.longitude.toFixed(6)}</span>
          </div>
        </div>
      )}

      {!isScriptLoaded && apiKey && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400">
          Loading Google Maps...
        </div>
      )}

            {!apiKey && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Add Google Maps API key for autocomplete and map features
        </div>
      )}
    </div>
  );
}
