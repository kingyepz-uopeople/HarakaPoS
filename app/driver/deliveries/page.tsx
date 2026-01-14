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
          <div className="w-12 h-12 rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-emerald-500 animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "active", label: "Active" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as FilterType)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Route Optimization Banner */}
      {filteredDeliveries.length >= 2 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Route className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{filteredDeliveries.length} Deliveries</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {optimizedRoute 
                  ? `${optimizedRoute.totalDistance.toFixed(1)} km, ${Math.round(optimizedRoute.estimatedDuration)} min`
                  : 'Optimize your route'}
              </p>
            </div>
          </div>
          <button
            onClick={handleOptimizeRoute}
            disabled={optimizing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {optimizing ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{optimizedRoute ? 'Re-optimize' : 'Optimize'}</span>
          </button>
        </div>
      )}

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="font-medium text-slate-900 dark:text-white mb-1">No deliveries found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {delivery.customer_name}
                    </h3>
                    <div className="flex gap-2 mt-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        delivery.status === 'Delivered' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : delivery.status === 'Out for Delivery' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {delivery.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(delivery.total_amount)}
                  </p>
                </div>

                {/* Barcode Info */}
                {delivery.barcode && (
                  <div className="mb-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{delivery.barcode}</span>
                    </div>
                    {(delivery.scan_count || 0) > 0 && (
                      <span className="text-xs text-slate-500">{delivery.scan_count} scan{delivery.scan_count !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{delivery.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <a href={`tel:${delivery.customer_phone}`} className="text-emerald-600 dark:text-emerald-400">
                      {delivery.customer_phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{delivery.delivery_date} {delivery.delivery_time && `at ${delivery.delivery_time}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{delivery.quantity_kg} kg</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {delivery.barcode && (
                    <Link
                      href={`/driver/scan?barcode=${delivery.barcode}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Scan</span>
                    </Link>
                  )}
                  <Link
                    href={`/driver/deliveries/${delivery.id}?startNav=true`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Navigate</span>
                  </Link>
                  <Link
                    href={`/driver/deliveries/${delivery.id}`}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium ${!delivery.barcode ? 'col-span-2 sm:col-span-1' : ''}`}
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
