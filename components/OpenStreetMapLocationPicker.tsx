"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Link as LinkIcon, Map } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

// Google Maps API Key from environment variable
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

// Mapbox API Key - Add your Mapbox token here
const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoia2luZ3llcHoiLCJhIjoiY21obmhrbG9lMDBpdzJrcXlvYnFmcXFwbyJ9.UBXI87gE5_0d3TOfrQoBYw"; // Replace with your actual Mapbox token

// Extract coordinates from Google Maps share link
const extractCoordsFromGoogleMapsLink = async (url: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    let urlToProcess = url.trim();
    
    console.log('🔍 Processing Google Maps URL:', urlToProcess);
    
    // For shortened goo.gl links, inform user to use full URL
    if (urlToProcess.includes('maps.app.goo.gl') || urlToProcess.includes('goo.gl/maps')) {
      console.log('⚠️ Shortened Google Maps link detected');
      console.log('💡 For best results, open the link in your browser and copy the full URL from the address bar');
      
      // Still try to extract if there's a fallback pattern
      // Some shortened URLs might have coordinates in a different format
      // But we won't make external fetch calls that can fail
      alert('📍 Shortened Google Maps Link Detected\n\nFor accurate location:\n1. Open this link in your browser\n2. Copy the full URL from the address bar (it will be much longer)\n3. Paste the full URL here\n\nThe full URL contains the exact coordinates.');
      return null;
    }
    
    // Try to extract coordinates from the URL
    // Format 1: @-1.286389,36.817223 (most common)
    const atMatch = urlToProcess.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (atMatch) {
      console.log('✅ Extracted coordinates using @ pattern');
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Format 2: q=-1.286389,36.817223
    const qMatch = urlToProcess.match(/[?&]q=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (qMatch) {
      console.log('✅ Extracted coordinates using q= pattern');
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    // Format 3: ll=-1.286389,36.817223
    const llMatch = urlToProcess.match(/[?&]ll=(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (llMatch) {
      console.log('✅ Extracted coordinates using ll= pattern');
      return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
    }

    // Format 4: place/Location+Name/@-1.286389,36.817223
    const placeMatch = urlToProcess.match(/place\/[^/]+\/@(-?\d+\.?\d+),(-?\d+\.?\d+)/);
    if (placeMatch) {
      console.log('✅ Extracted coordinates using place pattern');
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    // Format 5: Just coordinates separated by comma (direct input)
    const coordMatch = urlToProcess.match(/^(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)$/);
    if (coordMatch) {
      console.log('✅ Extracted coordinates from direct input');
      return { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }

    // If all extraction attempts fail
    console.warn('⚠️ Could not extract coordinates from URL:', urlToProcess);
    return null;
  } catch (error) {
    console.error('❌ Error extracting coordinates:', error);
    return null;
  }
};

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
  const [mapType, setMapType] = useState<'osm' | 'mapbox' | 'google'>('osm'); // Map provider - 3 options!
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isProcessingLink, setIsProcessingLink] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    value ? [value.latitude, value.longitude] : [-1.286389, 36.817223] // Nairobi default
  );
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [googleMarker, setGoogleMarker] = useState<any>(null);
  const [mapboxMap, setMapboxMap] = useState<any>(null);
  const [mapboxMarker, setMapboxMarker] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<HTMLDivElement>(null);
  const mapboxMapRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize Google Maps when shown
  useEffect(() => {
    if (!showMap || mapType !== 'google' || !googleMapRef.current || googleMap) return;

    const initGoogleMap = async () => {
      try {
        console.log('🗺️ Initializing Google Maps with API key:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 20)}...` : 'NOT FOUND');
        
        // Load Google Maps if not already loaded
        if (!window.google?.maps) {
          // Check if script is already being loaded
          const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
          if (!existingScript) {
            console.log('📥 Loading Google Maps script...');
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            await new Promise((resolve, reject) => {
              script.onload = () => {
                console.log('✅ Google Maps script loaded successfully');
                resolve(true);
              };
              script.onerror = (error) => {
                console.error('❌ Failed to load Google Maps script:', error);
                reject(error);
              };
              document.head.appendChild(script);
            });
          } else {
            console.log('⏳ Waiting for existing Google Maps script to load...');
            // Wait for existing script to load
            await new Promise((resolve) => {
              const checkGoogle = setInterval(() => {
                if (window.google?.maps) {
                  clearInterval(checkGoogle);
                  console.log('✅ Google Maps API ready');
                  resolve(true);
                }
              }, 100);
            });
          }
        }

        console.log('🗺️ Creating Google Map instance...');
        const map = new window.google.maps.Map(googleMapRef.current!, {
          center: { lat: mapCenter[0], lng: mapCenter[1] },
          zoom: 15,
        });

        const marker = new window.google.maps.Marker({
          position: { lat: mapCenter[0], lng: mapCenter[1] },
          map: map,
          draggable: true,
        });
        
        console.log('✅ Google Map initialized successfully');

        // Handle marker drag
        marker.addListener('dragend', async () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            const address = await reverseGeocode(lat, lng);

            onChange({
              address,
              latitude: lat,
              longitude: lng,
            });

            setSearchQuery(address);
            setMapCenter([lat, lng]);
          }
        });

        // Handle map click
        map.addListener('click', async (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });

          const address = await reverseGeocode(lat, lng);

          onChange({
            address,
            latitude: lat,
            longitude: lng,
          });

          setSearchQuery(address);
          setMapCenter([lat, lng]);
        });

      setGoogleMap(map);
      setGoogleMarker(marker);
      } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        // Show error in the map area
        if (googleMapRef.current) {
          googleMapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #fef3c7; padding: 20px; text-align: center;">
              <div>
                <p style="color: #92400e; font-weight: 600; margin-bottom: 8px;">⚠️ Google Maps failed to load</p>
                <p style="color: #78350f; font-size: 14px;">Check console for details. Try using OpenStreetMap or Mapbox instead.</p>
              </div>
            </div>
          `;
        }
      }
    };

    initGoogleMap();
  }, [showMap, mapType]);

  // Initialize Mapbox map
  // Initialize Mapbox map
  useEffect(() => {
    if (!showMap || mapType !== 'mapbox' || !mapboxMapRef.current || mapboxMap) return;

    const initMapboxMap = () => {
      // Set Mapbox access token
      mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

      // Create map
      const map = new mapboxgl.Map({
        container: mapboxMapRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [mapCenter[1], mapCenter[0]], // Mapbox uses [lng, lat]
        zoom: 15,
      });

      // Create draggable marker
      const marker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([mapCenter[1], mapCenter[0]])
        .addTo(map);

      // Handle marker drag
      marker.on('dragend', async () => {
        const lngLat = marker.getLngLat();
        const lat = lngLat.lat;
        const lng = lngLat.lng;

        const address = await reverseGeocode(lat, lng);
        onChange({
          address,
          latitude: lat,
          longitude: lng,
        });

        setSearchQuery(address);
        setMapCenter([lat, lng]);
      });

      // Handle map click
      map.on('click', async (e: any) => {
        const lat = e.lngLat.lat;
        const lng = e.lngLat.lng;

        marker.setLngLat([lng, lat]);

        const address = await reverseGeocode(lat, lng);
        onChange({
          address,
          latitude: lat,
          longitude: lng,
        });

        setSearchQuery(address);
        setMapCenter([lat, lng]);
      });

      setMapboxMap(map);
      setMapboxMarker(marker);
    };

    initMapboxMap();
  }, [showMap, mapType]);

  // Initialize OpenStreetMap when shown
  useEffect(() => {
    if (!showMap || mapType !== 'osm' || !mapContainerRef.current || mapInstance) return;

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
    if (value) {
      // Update mapCenter state
      setMapCenter([value.latitude, value.longitude]);
      
      // Update OpenStreetMap
      if (mapInstance && markerInstance && mapType === 'osm') {
        mapInstance.setView([value.latitude, value.longitude], 15);
        markerInstance.setLatLng([value.latitude, value.longitude]);
      }
      
      // Update Mapbox
      if (mapboxMap && mapboxMarker && mapType === 'mapbox') {
        mapboxMap.setCenter([value.longitude, value.latitude]); // Mapbox uses [lng, lat]
        mapboxMarker.setLngLat([value.longitude, value.latitude]);
      }
      
      // Update Google Maps
      if (googleMap && googleMarker && mapType === 'google') {
        const newCenter = { lat: value.latitude, lng: value.longitude };
        googleMap.setCenter(newCenter);
        googleMarker.setPosition(newCenter);
      }
    }
  }, [value, mapInstance, markerInstance, mapboxMap, mapboxMarker, googleMap, googleMarker, mapType]);

  // Handle search input
  const handleSearchInput = async (query: string) => {
    setSearchQuery(query);

    // Check if it's a Google Maps link
    if (query.includes('maps.app.goo.gl') || query.includes('google.com/maps') || query.includes('goo.gl/maps')) {
      setIsProcessingLink(true);
      const coords = await extractCoordsFromGoogleMapsLink(query);
      
      if (coords) {
        const address = await reverseGeocode(coords.lat, coords.lng);
        const locationData: LocationData = {
          address,
          latitude: coords.lat,
          longitude: coords.lng,
        };

        setSearchQuery(address);
        setMapCenter([coords.lat, coords.lng]);
        onChange(locationData);
        setShowMap(true); // Auto-show map when link is pasted
      } else {
          // More helpful error message with manual workaround
          const isShortened = query.includes('goo.gl');
          const message = isShortened 
            ? 'Could not extract coordinates from this shortened link.\n\n✅ Easy Fix:\n1. Open the link in a new tab\n2. Copy the full URL from your browser (it will be longer)\n3. Paste that URL here instead\n\nOr use the Search/Current Location buttons below.'
            : 'Could not extract coordinates from this link. Please try:\n- Searching for the address instead\n- Using "Current Location" button\n- Clicking on the map after showing it';
          alert(message);
      }
      setIsProcessingLink(false);
      return;
    }
    
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
          placeholder="Paste Google Maps link or search address..."
          value={searchQuery}
          onChange={(e) => handleSearchInput(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
        />
        {(isSearching || isProcessingLink) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Search className="h-5 w-5 text-gray-400 animate-pulse" />
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
        <LinkIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <span>
          💡 <strong>Tip:</strong> Paste a <strong>full</strong> Google Maps URL or search for an address. For shortened links (goo.gl), open them in your browser first and copy the full URL from the address bar.
        </span>
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
      <div className="flex gap-2 flex-wrap">
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

        {showMap && (
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setMapType('osm')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-l-md ${
                mapType === 'osm'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Map className="h-4 w-4 mr-2" />
              OpenStreetMap
            </button>
            <button
              type="button"
              onClick={() => setMapType('mapbox')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b border-gray-300 dark:border-gray-600 ${
                mapType === 'mapbox'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Map className="h-4 w-4 mr-2" />
              Mapbox
            </button>
            <button
              type="button"
              onClick={() => setMapType('google')}
              className={`inline-flex items-center px-3 py-2 text-sm font-medium border-t border-r border-b border-gray-300 dark:border-gray-600 rounded-r-md ${
                mapType === 'google'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <Map className="h-4 w-4 mr-2" />
              Google Maps
            </button>
          </div>
        )}
      </div>

      {/* Map View */}
      {showMap && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
          {/* OpenStreetMap */}
          {mapType === 'osm' && (
            <>
              <div ref={mapContainerRef} className="h-64 w-full" />
              <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                💡 Click on the map or drag the marker to set the delivery location (FREE!)
              </div>
            </>
          )}

          {/* Mapbox */}
          {mapType === 'mapbox' && (
            <>
              <div ref={mapboxMapRef} className="h-64 w-full" />
              <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                💡 Click on the map or drag the marker to set the delivery location (Mapbox)
              </div>
            </>
          )}

          {/* Google Maps */}
          {mapType === 'google' && (
            <>
              <div ref={googleMapRef} className="h-64 w-full" />
              <div className="bg-gray-50 dark:bg-gray-700 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                💡 Click on the map or drag the marker to set the delivery location (Google Maps)
              </div>
            </>
          )}
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
