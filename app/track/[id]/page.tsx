'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/utils/formatCurrency';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, MapPin, Clock, User, Calendar, Navigation2, Radio } from 'lucide-react';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Order {
  id: string;
  delivery_status: string;
  delivery_date: string;
  delivery_time?: string;
  quantity_kg: number;
  total_price: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  route_distance_km?: number;
  route_duration_minutes?: number;
  estimated_arrival_time?: string;
  customers: {
    name: string;
    phone: string;
  };
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
}

export default function TrackDeliveryPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const driverMarker = useRef<L.Marker | null>(null);
  const destinationMarker = useRef<L.Marker | null>(null);
  const polyline = useRef<L.Polyline | null>(null);
  
  const supabase = createClient();

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate ETA based on distance and average speed
  const calculateETA = (distanceKm: number, speedMps?: number) => {
    const avgSpeedKmh = speedMps ? (speedMps * 3.6) : 30; // Default 30 km/h if no speed data
    const hours = distanceKm / avgSpeedKmh;
    const minutes = Math.round(hours * 60);
    
    if (minutes < 1) return 'Arriving now';
    if (minutes < 60) return `${minutes} min`;
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Load order details
  useEffect(() => {
    if (!orderId) return;

    const loadOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customers (
              name,
              phone
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) throw error;

        const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
        setOrder({
          ...data,
          customers: customer,
        });
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Subscribe to real-time driver location updates
  useEffect(() => {
    if (!orderId) return;

    // Load latest driver location
    const loadLatestLocation = async () => {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setDriverLocation(data);
      }
    };

    loadLatestLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`driver-location-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setDriverLocation(payload.new as DriverLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !order) return;

    const map = L.map(mapRef.current).setView(
      [order.delivery_latitude, order.delivery_longitude],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add destination marker
    const destIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const destMarker = L.marker([order.delivery_latitude, order.delivery_longitude], {
      icon: destIcon,
    })
      .addTo(map)
      .bindPopup(`<strong>🎯 Your Delivery Address</strong><br>${order.delivery_address}`);

    destinationMarker.current = destMarker;
    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [order]);

  // Update driver marker and route
  useEffect(() => {
    if (!mapInstance.current || !order || !driverLocation) return;

    const map = mapInstance.current;

    // Create/update driver marker
    if (!driverMarker.current) {
      const driverIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      driverMarker.current = L.marker([driverLocation.latitude, driverLocation.longitude], {
        icon: driverIcon,
      })
        .addTo(map)
        .bindPopup('<strong>📦 Your Driver</strong><br>En route to you!');
    } else {
      // Smooth animation to new position
      driverMarker.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    }

    // Update polyline
    if (polyline.current) {
      map.removeLayer(polyline.current);
    }

    polyline.current = L.polyline(
      [
        [driverLocation.latitude, driverLocation.longitude],
        [order.delivery_latitude, order.delivery_longitude],
      ],
      {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
      }
    ).addTo(map);

    // Calculate distance and ETA
    const dist = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      order.delivery_latitude,
      order.delivery_longitude
    );
    setDistance(dist.toFixed(2));
    setEta(calculateETA(dist, driverLocation.speed));

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([
      [driverLocation.latitude, driverLocation.longitude],
      [order.delivery_latitude, order.delivery_longitude],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [driverLocation, order]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',
      Arrived: 'bg-purple-100 text-purple-800 border-purple-200',
      Delivered: 'bg-green-100 text-green-800 border-green-200',
      Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery not found</h3>
          <p className="text-gray-600">This tracking link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Your Delivery</h1>
              <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span
                className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(
                  order.delivery_status
                )}`}
              >
                {order.delivery_status}
              </span>
            </div>

            {driverLocation && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <Radio className="w-4 h-4 text-green-600 animate-pulse" />
                <span className="text-sm font-medium text-green-700">Driver tracking active</span>
              </div>
            )}
          </div>

          {/* ETA Banner */}
          {order.delivery_status === 'Out for Delivery' && driverLocation && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-3 rounded-full">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Estimated Arrival</p>
                    <p className="text-3xl font-bold text-gray-900">{eta}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Distance</p>
                  <p className="text-xl font-semibold text-gray-900">{distance} km</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Map */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <div
            ref={mapRef}
            className="w-full h-96 bg-gray-100"
          />
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium text-gray-900">{order.delivery_address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Delivery Date</p>
                <p className="font-medium text-gray-900">
                  {order.delivery_date}
                  {order.delivery_time && ` at ${order.delivery_time}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-medium text-gray-900">{order.quantity_kg} kg</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{order.customers.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">
            Powered by <span className="font-semibold text-emerald-600">HarakaPoS</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Real-time delivery tracking</p>
        </div>
      </div>
    </div>
  );
}
