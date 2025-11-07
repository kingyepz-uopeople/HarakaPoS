'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { optimizeDeliveryRoute } from '@/utils/routeOptimization';
import { Navigation2, MapPin, Clock, Zap, Check, X } from 'lucide-react';

interface Delivery {
  id: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  customers: {
    name: string;
  };
  delivery_date: string;
  delivery_time?: string;
}

interface RouteOptimizerProps {
  onClose: () => void;
  onApply: (optimizedOrder: string[]) => void;
}

export default function RouteOptimizer({ onClose, onApply }: RouteOptimizerProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadPendingDeliveries();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Nairobi
          setCurrentLocation({ lat: -1.286389, lng: 36.817223 });
        }
      );
    } else {
      setCurrentLocation({ lat: -1.286389, lng: 36.817223 });
    }
  };

  const loadPendingDeliveries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (name)
        `)
        .eq('assigned_driver', user.id)
        .in('delivery_status', ['Pending', 'Scheduled'])
        .gte('delivery_date', new Date().toISOString().split('T')[0])
        .order('delivery_date', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map((order: any) => ({
        ...order,
        customers: Array.isArray(order.customers) ? order.customers[0] : order.customers,
      }));

      setDeliveries(formatted);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = () => {
    if (!currentLocation || deliveries.length < 2) return;

    setOptimizing(true);

    try {
      const locations = deliveries.map(d => ({
        id: d.id,
        latitude: d.delivery_latitude,
        longitude: d.delivery_longitude,
        address: d.delivery_address,
      }));

      const result = optimizeDeliveryRoute(
        { latitude: currentLocation.lat, longitude: currentLocation.lng },
        locations
      );

      setOptimizedRoute(result);
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyRoute = async () => {
    if (!optimizedRoute) return;

    // Extract optimized order IDs
    const optimizedIds = optimizedRoute.locations.map((loc: any) => loc.id);
    onApply(optimizedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-3 rounded-xl">
                <Navigation2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Optimize Route</h2>
                <p className="text-sm text-gray-600">
                  {deliveries.length} deliveries to optimize
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading deliveries...</p>
            </div>
          ) : deliveries.length < 2 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Need at least 2 deliveries to optimize</p>
            </div>
          ) : (
            <>
              {/* Current Route */}
              {!optimizedRoute && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Current Route Order</h3>
                  <div className="space-y-2">
                    {deliveries.map((delivery, index) => (
                      <div
                        key={delivery.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {delivery.customers.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {delivery.delivery_address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Route */}
              {optimizedRoute && (
                <div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6 mb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="text-sm text-gray-600">Distance Saved</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {optimizedRoute.totalDistance.toFixed(1)} km less
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Saved</p>
                        <p className="text-xl font-semibold text-gray-900">
                          ~{Math.round(optimizedRoute.totalDistance / 30 * 60)} min
                        </p>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Check className="w-5 h-5 text-emerald-600 mr-2" />
                    Optimized Route Order
                  </h3>
                  <div className="space-y-2">
                    {optimizedRoute.locations.map((location: any, index: number) => {
                      const delivery = deliveries.find(d => d.id === location.id);
                      if (!delivery) return null;

                      return (
                        <div
                          key={location.id}
                          className="flex items-center space-x-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-sm font-medium text-white">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {delivery.customers.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {delivery.delivery_address}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {!optimizedRoute ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleOptimize}
                      disabled={optimizing || !currentLocation}
                      className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {optimizing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          <span>Optimize Route</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setOptimizedRoute(null)}
                      className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleApplyRoute}
                      className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>Apply Optimized Route</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
