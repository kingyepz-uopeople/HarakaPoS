"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { getOptimizedRoute } from "@/utils/routeOptimization";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Clock,
  Package,
  Navigation,
  ChevronRight,
  Filter,
  QrCode,
  Camera,
  Route,
  Zap
} from "lucide-react";

type FilterType = "all" | "pending" | "active";

interface Delivery {
  id: string;
  customer_name: string;
  customer_phone: string;
  location: string;
  status: string;
  delivery_date: string;
  delivery_time: string;
  quantity_kg: number;
  total_amount: number;
  barcode?: string;
  barcode_status?: string;
  scan_count?: number;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivery_address?: string;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDeliveries();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [filter, deliveries]);

  async function loadDeliveries() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            name,
            phone,
            location
          )
        `)
        .eq("assigned_driver", user.id)
        .in("delivery_status", ["Pending", "Out for Delivery", "Delivered"])
        .order("delivery_date", { ascending: true })
        .order("delivery_time", { ascending: true });

      if (error) {
        console.error("Error fetching deliveries:", error);
        return;
      }

      if (orders) {
        // Get barcodes for these orders
        const orderIds = orders.map(o => o.id);
        const { data: barcodes } = await supabase
          .from("delivery_barcodes")
          .select("*")
          .in("order_id", orderIds);

        // Get scan counts
        const { data: scanCounts } = await supabase
          .from("barcode_scan_log")
          .select("barcode_id");

        const scanCountMap = new Map<string, number>();
        scanCounts?.forEach(scan => {
          const count = scanCountMap.get(scan.barcode_id) || 0;
          scanCountMap.set(scan.barcode_id, count + 1);
        });

        const barcodeMap = new Map(barcodes?.map(b => [b.order_id, b]) || []);

        const transformedData = orders.map((order: any) => {
          const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
          const barcodeData = barcodeMap.get(order.id);
          
          return {
            id: order.id,
            customer_name: customer?.name || "Unknown",
            customer_phone: customer?.phone || "N/A",
            location: customer?.location || "N/A",
            status: order.delivery_status,
            delivery_date: order.delivery_date,
            delivery_time: order.delivery_time || "Not set",
            quantity_kg: order.quantity_kg,
            total_amount: order.total_price || 0,
            barcode: barcodeData?.barcode_number,
            barcode_status: barcodeData?.status,
            scan_count: barcodeData ? (scanCountMap.get(barcodeData.id) || 0) : 0,
            // Include GPS coordinates for better navigation
            delivery_latitude: order.delivery_latitude,
            delivery_longitude: order.delivery_longitude,
            delivery_address: order.delivery_address,
          };
        });
        setDeliveries(transformedData);
      }
    } catch (error) {
      console.error("Error loading deliveries:", error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilter() {
    const today = new Date().toISOString().split('T')[0];
    
    let filtered = [...deliveries];
    
    if (filter === "pending") {
      filtered = filtered.filter(d => d.status === "Pending");
    } else if (filter === "active") {
      filtered = filtered.filter(d => 
        d.status === "Out for Delivery" || 
        (d.status === "Pending" && d.delivery_date === today)
      );
    }
    
    setFilteredDeliveries(filtered);
  }

  function getStatusBadge(status: string) {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  function getBarcodeStatusBadge(status?: string) {
    if (!status) return null;
    
    const styles = {
      'pending': 'bg-gray-100 text-gray-700 border-gray-200',
      'printed': 'bg-purple-100 text-purple-700 border-purple-200',
      'loading': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'in_transit': 'bg-blue-100 text-blue-700 border-blue-200',
      'delivered': 'bg-green-100 text-green-700 border-green-200',
      'failed': 'bg-red-100 text-red-700 border-red-200',
    };
    
    const displayNames = {
      'pending': 'Pending',
      'printed': 'Printed',
      'loading': 'Loading',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'failed': 'Failed',
    };
    
    const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
    const name = displayNames[status as keyof typeof displayNames] || status;
    
    return { style, name };
  }

  function openNavigation(location: string, delivery?: any) {
    // Prefer GPS coordinates if available for more accurate navigation
    if (delivery?.delivery_latitude && delivery?.delivery_longitude) {
      // Use exact GPS coordinates for navigation
      const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.delivery_latitude},${delivery.delivery_longitude}`;
      window.open(url, '_blank');
    } else if (delivery?.delivery_address) {
      // Fall back to delivery address
      const encodedAddress = encodeURIComponent(delivery.delivery_address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    } else {
      // Final fallback to location parameter
      const encodedLocation = encodeURIComponent(location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    }
  }

  async function handleOptimizeRoute() {
    if (filteredDeliveries.length < 2) {
      alert('Need at least 2 deliveries to optimize route');
      return;
    }

    setOptimizing(true);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const startLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      // Convert deliveries to locations
      const locations = filteredDeliveries
        .filter(d => d.delivery_latitude && d.delivery_longitude)
        .map(d => ({
          id: d.id,
          latitude: d.delivery_latitude!,
          longitude: d.delivery_longitude!,
          address: d.delivery_address || d.location,
          priority: d.status === 'Out for Delivery' ? 5 : 1, // Prioritize in-progress
        }));

      if (locations.length < 2) {
        alert('Not enough deliveries with GPS coordinates');
        return;
      }

      // Optimize route
      const result = await getOptimizedRoute(startLocation, locations, {
        useOSRM: true,
        avgSpeedKmh: 25, // Nairobi traffic is slow
        respectPriority: true,
      });

      setOptimizedRoute(result);

      // Reorder filteredDeliveries to match optimized route
      const optimizedDeliveries = result.locations.map(loc =>
        filteredDeliveries.find(d => d.id === loc.id)!
      );

      // Add any deliveries without coordinates at the end
      const withoutCoords = filteredDeliveries.filter(
        d => !d.delivery_latitude || !d.delivery_longitude
      );

      setFilteredDeliveries([...optimizedDeliveries, ...withoutCoords]);

      alert(
        `Route optimized! Distance: ${result.totalDistance.toFixed(1)} km, ` +
        `Est. time: ${Math.round(result.estimatedDuration)} min`
      );
    } catch (error) {
      console.error('Route optimization error:', error);
      alert('Failed to optimize route. Using current order.');
    } finally {
      setOptimizing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-2 flex space-x-2">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-emerald-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            filter === "pending"
              ? "bg-emerald-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            filter === "active"
              ? "bg-emerald-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Active
        </button>
      </div>

      {/* Route Optimization Banner */}
      {filteredDeliveries.length >= 2 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full">
                <Route className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {filteredDeliveries.length} Deliveries
                </h3>
                <p className="text-sm text-gray-600">
                  {optimizedRoute 
                    ? `Optimized: ${optimizedRoute.totalDistance.toFixed(1)} km, ${Math.round(optimizedRoute.estimatedDuration)} min`
                    : 'Get the fastest route for all stops'}
                </p>
              </div>
            </div>
            <button
              onClick={handleOptimizeRoute}
              disabled={optimizing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm font-medium">Optimizing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {optimizedRoute ? 'Re-optimize' : 'Optimize Route'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
          <p className="text-gray-500">
            {filter === "all" 
              ? "You don't have any deliveries yet"
              : `No ${filter} deliveries at the moment`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {delivery.customer_name}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(delivery.status)}`}>
                        {delivery.status}
                      </span>
                      {delivery.barcode_status && (() => {
                        const badge = getBarcodeStatusBadge(delivery.barcode_status);
                        return badge ? (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${badge.style}`}>
                            📦 {badge.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <p className="text-xl font-bold text-gray-900 ml-2">
                    {formatCurrency(delivery.total_amount)}
                  </p>
                </div>

                {/* Barcode Info */}
                {delivery.barcode && (
                  <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <QrCode className="w-4 h-4 text-emerald-700" />
                        <span className="text-sm font-medium text-emerald-900">{delivery.barcode}</span>
                      </div>
                      {(delivery.scan_count || 0) > 0 && (
                        <span className="text-xs text-emerald-700">
                          {delivery.scan_count} scan{delivery.scan_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="flex-1">{delivery.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <a href={`tel:${delivery.customer_phone}`} className="text-emerald-600 hover:text-emerald-700">
                      {delivery.customer_phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{delivery.delivery_date} {delivery.delivery_time && `at ${delivery.delivery_time}`}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Package className="w-4 h-4 flex-shrink-0" />
                    <span>{delivery.quantity_kg} kg</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {delivery.barcode && (
                    <Link
                      href={`/driver/scan?barcode=${delivery.barcode}`}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan</span>
                    </Link>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openNavigation(delivery.location, delivery);
                    }}
                    className={`bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${delivery.barcode ? '' : 'col-span-1'}`}
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigate</span>
                  </button>
                  <Link
                    href={`/driver/deliveries/${delivery.id}`}
                    className={`bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${delivery.barcode ? '' : 'col-span-1'}`}
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
