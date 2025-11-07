'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/utils/formatCurrency';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, MapPin, Clock, User, Calendar, Navigation2, Radio, Truck, Phone, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  driver?: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
    };
  };
}

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export default function AdminTrackDriverPage() {
  const router = useRouter();
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
    const avgSpeedKmh = speedMps ? (speedMps * 3.6) : 30; // Default 30 km/h
    const hours = distanceKm / avgSpeedKmh;
    const minutes = Math.round(hours * 60);
    
    if (minutes < 1) return 'Arriving now';
    if (minutes < 60) return `${minutes} min`;
    
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Load all active deliveries
  useEffect(() => {
    const loadActiveDeliveries = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customers (
              name,
              phone
            ),
            driver:users!orders_assigned_driver_fkey (
              id,
              email,
              user_metadata
            )
          `)
          .in('delivery_status', ['Out for Delivery', 'Arrived'])
          .order('delivery_date', { ascending: true });

        if (error) throw error;

        const formatted = (data || []).map((order: any) => ({
          ...order,
          customers: Array.isArray(order.customers) ? order.customers[0] : order.customers,
          driver: Array.isArray(order.driver) ? order.driver[0] : order.driver,
        }));

        setActiveDeliveries(formatted);
        
        // Auto-select first delivery if none selected
        if (!selectedOrder && formatted.length > 0) {
          setSelectedOrder(formatted[0]);
        }
      } catch (error) {
        console.error('Error loading active deliveries:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActiveDeliveries();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadActiveDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to driver location updates for selected order
  useEffect(() => {
    if (!selectedOrder) return;

    // Load latest driver location
    const loadLatestLocation = async () => {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('order_id', selectedOrder.id)
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
      .channel(`admin-track-${selectedOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `order_id=eq.${selectedOrder.id}`,
        },
        (payload) => {
          setDriverLocation(payload.new as DriverLocation);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrder?.id]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current || !selectedOrder) return;

    const map = L.map(mapRef.current).setView(
      [selectedOrder.delivery_latitude, selectedOrder.delivery_longitude],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [selectedOrder]);

  // Update destination marker when order changes
  useEffect(() => {
    if (!mapInstance.current || !selectedOrder) return;

    const map = mapInstance.current;

    // Remove old destination marker
    if (destinationMarker.current) {
      map.removeLayer(destinationMarker.current);
    }

    // Add new destination marker
    const destIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    destinationMarker.current = L.marker(
      [selectedOrder.delivery_latitude, selectedOrder.delivery_longitude],
      { icon: destIcon }
    )
      .addTo(map)
      .bindPopup(`<strong>🎯 Delivery Destination</strong><br>${selectedOrder.delivery_address}`);

    map.setView([selectedOrder.delivery_latitude, selectedOrder.delivery_longitude], 13);
  }, [selectedOrder]);

  // Update driver marker and route
  useEffect(() => {
    if (!mapInstance.current || !selectedOrder || !driverLocation) return;

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
        .bindPopup('<strong>🚚 Driver Location</strong><br>Real-time GPS');
    } else {
      driverMarker.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
    }

    // Update polyline
    if (polyline.current) {
      map.removeLayer(polyline.current);
    }

    polyline.current = L.polyline(
      [
        [driverLocation.latitude, driverLocation.longitude],
        [selectedOrder.delivery_latitude, selectedOrder.delivery_longitude],
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
      selectedOrder.delivery_latitude,
      selectedOrder.delivery_longitude
    );
    setDistance(dist.toFixed(2));
    setEta(calculateETA(dist, driverLocation.speed));

    // Fit bounds to show both markers
    const bounds = L.latLngBounds([
      [driverLocation.latitude, driverLocation.longitude],
      [selectedOrder.delivery_latitude, selectedOrder.delivery_longitude],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [driverLocation, selectedOrder]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',
      'Arrived': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading active deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/dashboard/orders')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <Truck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Live Driver Tracking</h1>
                  <p className="text-sm text-gray-600">
                    {activeDeliveries.length} active {activeDeliveries.length === 1 ? 'delivery' : 'deliveries'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Deliveries List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <h2 className="font-semibold text-gray-900 mb-3">Active Deliveries</h2>
              
              {activeDeliveries.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No active deliveries</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeDeliveries.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedOrder?.id === order.id
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{order.customers.name}</p>
                          <p className="text-xs text-gray-500">#{order.id.slice(0, 8)}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(
                            order.delivery_status
                          )}`}
                        >
                          {order.delivery_status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{order.delivery_address}</span>
                        </div>
                        {order.driver && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{order.driver.user_metadata?.full_name || order.driver.email}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Map & Details */}
          <div className="lg:col-span-2 space-y-4">
            {selectedOrder ? (
              <>
                {/* ETA Card */}
                {driverLocation && (
                  <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6">
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
                        <p className="text-sm text-gray-600">Distance Remaining</p>
                        <p className="text-xl font-semibold text-gray-900">{distance} km</p>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                        <Radio className="w-4 h-4 text-green-600 animate-pulse" />
                        <span className="text-sm font-medium text-green-700">Live Tracking</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Map */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  <div ref={mapRef} className="w-full h-[500px] bg-gray-100" />
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Delivery Details</h2>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <User className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Customer</p>
                          <p className="font-medium text-gray-900">{selectedOrder.customers.name}</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <a
                            href={`tel:${selectedOrder.customers.phone}`}
                            className="font-medium text-emerald-600 hover:text-emerald-700"
                          >
                            {selectedOrder.customers.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{selectedOrder.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Quantity</p>
                          <p className="font-medium text-gray-900">{selectedOrder.quantity_kg} kg</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Delivery Date</p>
                          <p className="font-medium text-gray-900">
                            {selectedOrder.delivery_date}
                            {selectedOrder.delivery_time && ` at ${selectedOrder.delivery_time}`}
                          </p>
                        </div>
                      </div>

                      {selectedOrder.driver && (
                        <div className="flex items-center space-x-3">
                          <Truck className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">Driver</p>
                            <p className="font-medium text-gray-900">
                              {selectedOrder.driver.user_metadata?.full_name || selectedOrder.driver.email}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <Navigation2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a delivery to track</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
