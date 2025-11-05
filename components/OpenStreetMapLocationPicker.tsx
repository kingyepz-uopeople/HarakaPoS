"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search } from 'lucide-react';

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface OpenStreetMapLocationPickerProps {
  value?: LocationData;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
}

// Nominatim API for geocoding (free OSM service)
const searchAddress = async (query: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `limit=5&` +
      `countrycodes=ke&` + // Limit to Kenya
      `addressdetails=1`
    );
    return await response.json();
  } catch (error) {
    console.error('Error searching address:', error);
    return [];
  }
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${lat}&` +
      `lon=${lng}&` +
      `format=json&` +
      `addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
};

export default function OpenStreetMapLocationPicker({
  value,
  onChange,
  placeholder = "Search for delivery address in Kenya..."
}: OpenStreetMapLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value?.address || '');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    value ? [value.latitude, value.longitude] : [-1.286389, 36.817223] // Nairobi default
  );
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize map when shown
  useEffect(() => {
    if (!showMap || !mapContainerRef.current || mapInstance) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      
      // Fix for default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current!).setView(mapCenter, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const marker = L.marker(mapCenter, { draggable: true }).addTo(map);

      // Handle marker drag
      marker.on('dragend', async () => {
        const position = marker.getLatLng();
        const address = await reverseGeocode(position.lat, position.lng);
        
        onChange({
          address,
          latitude: position.lat,
          longitude: position.lng,
        });
        
        setSearchQuery(address);
        setMapCenter([position.lat, position.lng]);
      });

      // Handle map click
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        
        const address = await reverseGeocode(lat, lng);
        
        onChange({
          address,
          latitude: lat,
          longitude: lng,
        });
        
        setSearchQuery(address);
        setMapCenter([lat, lng]);
      });

      setMapInstance(map);
      setMarkerInstance(marker);
    };

    initMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMapInstance(null);
        setMarkerInstance(null);
      }
    };
  }, [showMap]);

  // Update map center when location changes
  useEffect(() => {
    if (mapInstance && markerInstance && value) {
      mapInstance.setView([value.latitude, value.longitude], 15);
      markerInstance.setLatLng([value.latitude, value.longitude]);
    }
  }, [value, mapInstance, markerInstance]);

  // Handle search input
  const handleSearchInput = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAddress(query);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setIsSearching(false);
    }, 500);
  };

  // Handle selecting a search result
  const handleSelectResult = (result: any) => {
    const locationData: LocationData = {
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    setSearchQuery(result.display_name);
    setShowResults(false);
    setMapCenter([locationData.latitude, locationData.longitude]);
    onChange(locationData);
  };

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const address = await reverseGeocode(lat, lng);

        const locationData: LocationData = {
          address,
          latitude: lat,
          longitude: lng,
        };

        setSearchQuery(address);
        setMapCenter([lat, lng]);
        onChange(locationData);
        setIsLoadingLocation(false);
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
      {/* Leaflet CSS */}
      {showMap && (
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
        {isSearching && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectResult(result)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start gap-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {result.display_name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Action Buttons */}
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

        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <MapPin className="h-4 w-4 mr-2" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* Map View */}
      {showMap && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          <div ref={mapContainerRef} className="h-64 w-full" />
          <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
            💡 Click on the map or drag the marker to set the delivery location
          </div>
        </div>
      )}

      {/* Location Info */}
      {value && (
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Address:</span>
            <span className="truncate">{value.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <span><span className="font-medium">Lat:</span> {value.latitude.toFixed(6)}</span>
            <span><span className="font-medium">Lng:</span> {value.longitude.toFixed(6)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
