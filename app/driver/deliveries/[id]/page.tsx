"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/utils/formatCurrency";
import { PaymentMethod } from "@/lib/types";
import PDAPaymentFlow from "@/components/PDAPaymentFlow";
import DriverLiveMap from "@/components/DriverLiveMap";
import { useDriverLocationTracking } from "@/lib/hooks/useDriverLocationTracking";
import {
  MapPin,
  Phone,
  Clock,
  Package,
  Navigation,
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Truck,
  Radio
} from "lucide-react";

// Dynamic import to avoid SSR issues with JsBarcode
const BarcodeDisplay = dynamic(
  () => import("@/components/barcode/BarcodeDisplay"),
  { ssr: false, loading: () => <div className="h-16 bg-gray-100 animate-pulse rounded" /> }
);

export default function DeliveryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const startNavMode = searchParams.get('startNav') === 'true';
  
  const [delivery, setDelivery] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [customerNotes, setCustomerNotes] = useState("");
  const [orderBarcode, setOrderBarcode] = useState<string | null>(null);
  const [loadingBarcode, setLoadingBarcode] = useState<boolean>(false);
  const [geocodedCoords, setGeocodedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [navMode, setNavMode] = useState(startNavMode);
  const supabase = createClient();

  // Real-time location tracking - enabled in nav mode or when out for delivery
  const isOutForDelivery = delivery?.delivery_status === "Out for Delivery";
  const shouldTrack = isOutForDelivery || navMode;
  const { currentPosition, isTracking, error: trackingError, hasArrived } = useDriverLocationTracking({
    orderId: params.id as string,
    enabled: shouldTrack,
    updateInterval: 5000, // Update every 5 seconds
    geofenceRadius: 50, // 50 meters
    onArrival: async () => {
      // Auto-update status when driver arrives
      try {
        const { error } = await supabase
          .from('orders')
          .update({ delivery_status: 'Arrived' })
          .eq('id', params.id as string);
        
        if (!error) {
          // Reload delivery to show new status
          loadDelivery(params.id as string);
        }
      } catch (err) {
        console.error('Error updating arrival status:', err);
      }
    },
  });

  // Auto-start delivery when navigating with startNav=true
  useEffect(() => {
    if (startNavMode && delivery && delivery.delivery_status === 'Pending') {
      // Auto-set to Out for Delivery
      supabase
        .from('orders')
        .update({ delivery_status: 'Out for Delivery' })
        .eq('id', params.id as string)
        .then(({ error }) => {
          if (!error) {
            setDelivery({ ...delivery, delivery_status: 'Out for Delivery' });
          }
        });
    }
  }, [startNavMode, delivery?.id, delivery?.delivery_status]);

  useEffect(() => {
    if (params.id) {
      loadDelivery(params.id as string);
    }
  }, [params.id]);

  // Geocode address when delivery loads but has no coordinates
  useEffect(() => {
    async function geocodeAddress() {
      if (!delivery) return;
      // Already has coordinates
      if (delivery.delivery_latitude && delivery.delivery_longitude) return;
      // No address to geocode
      const address = delivery.delivery_address || delivery.location;
      if (!address || address === "N/A") return;
      
      setIsGeocoding(true);
      try {
        // Try multiple geocoding strategies for better results
        let coords = null;
        
        // Strategy 1: Try full address with Kenya
        const fullAddress = address + ", Kenya";
        let response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=ke`,
          { headers: { 'User-Agent': 'HarakaPoS/1.0' } }
        );
        let data = await response.json();
        
        if (data && data.length > 0) {
          coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        
        // Strategy 2: Try just the town/county part
        if (!coords) {
          // Extract town name from address (usually after first comma or the main part)
          const parts = address.split(',').map((p: string) => p.trim());
          for (const part of parts) {
            if (part.toLowerCase().includes('county') || part.toLowerCase().includes('town')) {
              response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(part + ", Kenya")}&limit=1&countrycodes=ke`,
                { headers: { 'User-Agent': 'HarakaPoS/1.0' } }
              );
              data = await response.json();
              if (data && data.length > 0) {
                coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
                break;
              }
            }
          }
        }
        
        // Strategy 3: Try Google Geocoding API as fallback
        if (!coords && process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY) {
          try {
            response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address + ", Kenya")}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`
            );
            data = await response.json();
            if (data.results && data.results.length > 0) {
              const loc = data.results[0].geometry.location;
              coords = { lat: loc.lat, lng: loc.lng };
            }
          } catch (e) {
            console.log('Google geocoding fallback failed:', e);
          }
        }
        
        if (coords) {
          setGeocodedCoords(coords);
          
          // Save the geocoded coordinates to the database for future use
          try {
            await supabase
              .from('orders')
              .update({ 
                delivery_latitude: coords.lat, 
                delivery_longitude: coords.lng 
              })
              .eq('id', delivery.id);
          } catch (e) {
            console.log('Could not save geocoded coordinates:', e);
          }
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      } finally {
        setIsGeocoding(false);
      }
    }
    
    geocodeAddress();
  }, [delivery?.id, delivery?.delivery_latitude, delivery?.delivery_longitude, delivery?.delivery_address, delivery?.location]);

  async function loadDelivery(id: string) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            name,
            phone,
            location
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;
        setDelivery({
          ...data,
          customer_name: customer?.name || "Unknown",
          customer_phone: customer?.phone || "N/A",
          location: customer?.location || "N/A",
          // Include GPS coordinates
          delivery_latitude: data.delivery_latitude,
          delivery_longitude: data.delivery_longitude,
          delivery_address: data.delivery_address || customer?.location || "N/A",
        });

        // Fetch or create barcode for this order
        try {
          setLoadingBarcode(true);
          // Try find barcode linked to this order
          const { data: bc } = await supabase
            .from('delivery_barcodes')
            .select('barcode')
            .eq('order_id', id)
            .limit(1)
            .maybeSingle();

          if (bc?.barcode) {
            setOrderBarcode(bc.barcode);
          } else {
            // Generate one on-demand using RPC util
            const gen = await import('@/lib/barcode-utils');
            const result = await gen.generateDeliveryBarcode({
              orderId: id,
              saleId: data.sale_id || undefined,
              customerName: customer?.name || 'Customer',
              customerPhone: customer?.phone || undefined,
              deliveryLocation: data.delivery_address || customer?.location || undefined,
              quantityKg: data.quantity_kg,
              totalAmount: data.total_price,
            });
            if (result.success && result.barcode) setOrderBarcode(result.barcode);
          }
        } catch (e) {
          console.error('Barcode generation error:', e);
        } finally {
          setLoadingBarcode(false);
        }
      }
    } catch (error) {
      console.error("Error loading delivery:", error);
    } finally {
      setLoading(false);
    }
  }

  async function startDelivery() {
    if (!delivery) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create sale automatically
      const saleData = {
        date: new Date().toISOString(),
        quantity_sold: delivery.quantity_kg,
        price_per_kg: delivery.price_per_kg,
        amount: delivery.total_price,
        total_amount: delivery.total_price,
        payment_method: "Cash" as PaymentMethod,
        customer_id: delivery.customer_id,
        order_id: delivery.id,
      };

      const { error: saleError } = await supabase.from("sales").insert([saleData]);
      if (saleError) {
        console.error("Error creating sale:", saleError);
        throw new Error(`Failed to create sale: ${saleError.message}`);
      }

      // 2. Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ delivery_status: "Out for Delivery" })
        .eq("id", delivery.id);

      if (orderError) throw orderError;

      // Keep user on this page so GPS tracking can begin immediately.
      // Previously we redirected which prevented initial location broadcasts.
      alert("Delivery started successfully! Tracking has begun.");
      // Reload delivery to reflect new status so hook enables.
      await loadDelivery(delivery.id);
    } catch (error: any) {
      console.error("Error starting delivery:", error);
      alert("Error starting delivery: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelivery() {
    if (!delivery) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Update sale with payment method
      const { error: saleError } = await supabase
        .from("sales")
        .update({ payment_method: paymentMethod })
        .eq("order_id", delivery.id);

      if (saleError) throw saleError;

      // 2. Create delivery proof
      const proofData = {
        order_id: delivery.id,
        delivered_by: user.id,
        payment_method: paymentMethod,
        customer_notes: customerNotes,
        payment_confirmed: true,
      };

      const { error: proofError } = await supabase
        .from("delivery_proof")
        .insert([proofData]);

      if (proofError) throw proofError;

      // 3. Update order status to Completed
      const { error: orderError } = await supabase
        .from("orders")
        .update({ delivery_status: "Completed" })
        .eq("id", delivery.id);

      if (orderError) throw orderError;

      // 4. Update barcode status to delivered (if present)
      try {
        if (orderBarcode) {
          const utils = await import('@/lib/barcode-utils');
          await utils.updateBarcodeStatus(orderBarcode, 'delivered', 'delivery', {
            notes: customerNotes || undefined,
          });
        }
      } catch (e) {
        console.warn('Failed to update barcode delivered status:', e);
      }

      alert("Delivery completed successfully!");
      setShowPaymentModal(false);
      router.push("/driver/deliveries");
    } catch (error: any) {
      console.error("Error completing delivery:", error);
      alert("Error completing delivery: " + error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function openNavigation() {
    if (!delivery) return;

    // If delivery hasn't started yet, mark as Out for Delivery so admin can track
    if (delivery.delivery_status !== 'Out for Delivery') {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ delivery_status: 'Out for Delivery' })
          .eq('id', delivery.id);
        if (!error) {
          setDelivery({ ...delivery, delivery_status: 'Out for Delivery' });
        }
      } catch (e) {
        console.error('Failed to set Out for Delivery on navigate:', e);
      }
    }
    
    // Prefer GPS coordinates if available for more accurate navigation
    if (delivery.delivery_latitude && delivery.delivery_longitude) {
      // Use exact GPS coordinates for navigation
      const url = `https://www.google.com/maps/dir/?api=1&destination=${delivery.delivery_latitude},${delivery.delivery_longitude}`;
      window.open(url, '_blank');
    } else if (delivery.delivery_address) {
      // Fall back to address search
      const encodedAddress = encodeURIComponent(delivery.delivery_address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    } else {
      // Final fallback to customer location
      const encodedLocation = encodeURIComponent(delivery.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Out for Delivery': 'bg-blue-100 text-blue-800 border-blue-200',
      'Delivered': 'bg-green-100 text-green-800 border-green-200',
      'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Delivery not found</h3>
          <button
            onClick={() => router.push("/driver/deliveries")}
            className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back to Deliveries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-4 ${navMode ? 'pb-4' : 'pb-32'}`}>
      {/* Navigation Mode Header */}
      {navMode && (
        <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Navigation Mode</h2>
                <p className="text-white/80 text-sm">Driving to {delivery.customer_name}</p>
              </div>
            </div>
            <button
              onClick={() => setNavMode(false)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Header - Hidden in nav mode */}
      {!navMode && (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/driver/deliveries")}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Delivery Details</h1>
        </div>
      )}

      {/* Status Badge */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(delivery.delivery_status)}`}>
            {delivery.delivery_status}
          </span>
          
          {/* GPS Tracking Indicator */}
          {shouldTrack && (
            <div className="flex items-center gap-2">
              {isTracking ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <Radio className="w-4 h-4 text-green-600 animate-pulse" />
                  <span className="text-xs font-medium text-green-700">
                    GPS Tracking Active
                  </span>
                </div>
              ) : trackingError ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                  <Radio className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-medium text-red-700">
                    GPS Error
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
                  <Radio className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">
                    Connecting...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Arrival Notification */}
          {hasArrived && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">
                You've arrived!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Embedded Map with Real-time Driver Position */}
      {(() => {
        // Use delivery coordinates or geocoded coordinates
        const destLat = delivery.delivery_latitude || geocodedCoords?.lat;
        const destLng = delivery.delivery_longitude || geocodedCoords?.lng;
        const hasCoordinates = destLat && destLng;
        
        if (isGeocoding) {
          return (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Finding location on map...</p>
            </div>
          );
        }
        
        if (hasCoordinates) {
          return (
            <div className={navMode ? 'h-[60vh]' : ''}>
              <DriverLiveMap
                destination={{
                  lat: destLat,
                  lng: destLng,
                  address: delivery.delivery_address || delivery.location
                }}
                driverPosition={
                  currentPosition
                    ? { lat: currentPosition.latitude, lng: currentPosition.longitude }
                    : null
                }
                className={`rounded-2xl overflow-hidden border border-gray-100 ${navMode ? 'h-full' : ''}`}
                showNavigateButton={!navMode}
                onRouteSummary={({ distanceKm, durationText }) => {
                  console.log(`Route: ${distanceKm.toFixed(1)} km, ETA: ${durationText}`);
                }}
              />
            </div>
          );
        }
        
        // Fallback when no coordinates available - show map centered on driver location or Kenya
        return (
          <div className={`bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden ${navMode ? 'h-[60vh]' : ''}`}>
            {/* Show map centered on driver's current location if available */}
            {currentPosition ? (
              <div className={navMode ? 'h-full' : 'h-64'}>
                <DriverLiveMap
                  destination={{
                    lat: currentPosition.latitude,
                    lng: currentPosition.longitude,
                    address: delivery.delivery_address || delivery.location
                  }}
                  driverPosition={{ lat: currentPosition.latitude, lng: currentPosition.longitude }}
                  className="h-full"
                  showNavigateButton={false}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm font-medium text-center">
                    📍 Address not found - showing your location
                  </p>
                  <p className="text-white/80 text-xs text-center mt-1">
                    {delivery.delivery_address || delivery.location}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2 font-medium">Location not found on map</p>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">{delivery.delivery_address || delivery.location}</p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={openNavigation}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Open in Google Maps
                </button>
                <button
                  onClick={() => {
                    // Open Google Maps search with the address
                    const address = delivery.delivery_address || delivery.location;
                    window.open(`https://www.google.com/maps/search/${encodeURIComponent(address)}`, '_blank');
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Search Address
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Actions in Nav Mode - Floating Bar */}
      {navMode && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (delivery.customer_phone) {
                  window.open(`tel:${delivery.customer_phone}`, '_self');
                }
              }}
              disabled={!delivery.customer_phone}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Phone className="w-5 h-5" />
              <span>Call</span>
            </button>
            <button
              onClick={() => {
                const destLat = delivery.delivery_latitude || geocodedCoords?.lat;
                const destLng = delivery.delivery_longitude || geocodedCoords?.lng;
                if (destLat && destLng) {
                  const origin = currentPosition 
                    ? `${currentPosition.latitude},${currentPosition.longitude}` 
                    : '';
                  const url = origin 
                    ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destLat},${destLng}&travelmode=driving`
                    : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
                  window.open(url, '_blank');
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Navigation className="w-5 h-5" />
              <span>Google Maps</span>
            </button>
            {hasArrived && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Complete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Navigation Actions - Hidden in nav mode */}
      {!navMode && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setNavMode(true)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-emerald-700 transition-colors col-span-2"
          >
            <Navigation className="w-4 h-4" />
            Start In-App Navigation
          </button>
          <button
            onClick={() => {
              const destLat = delivery.delivery_latitude || geocodedCoords?.lat;
              const destLng = delivery.delivery_longitude || geocodedCoords?.lng;
              if (destLat && destLng) {
                const origin = currentPosition 
                  ? `${currentPosition.latitude},${currentPosition.longitude}` 
                  : '';
                const url = origin 
                  ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destLat},${destLng}&travelmode=driving`
                  : `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
                window.open(url, '_blank');
              } else {
                openNavigation();
              }
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            Google Maps
          </button>
          <button
            onClick={() => {
              const destLat = delivery.delivery_latitude || geocodedCoords?.lat;
              const destLng = delivery.delivery_longitude || geocodedCoords?.lng;
              if (destLat && destLng) {
                window.open(`https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`, '_blank');
              } else {
                // Fallback to address search in Waze
                const address = delivery.delivery_address || delivery.location;
                if (address) {
                  window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank');
                }
              }
            }}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Waze
          </button>
          <button
            onClick={() => {
              if (delivery.customer_phone) {
                window.open(`tel:${delivery.customer_phone}`, '_self');
              }
            }}
            disabled={!delivery.customer_phone}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone className="w-4 h-4" />
            Call Customer
          </button>
          <button
            onClick={() => {
              if (delivery.customer_phone) {
                window.open(`sms:${delivery.customer_phone}`, '_self');
              }
            }}
            disabled={!delivery.customer_phone}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            SMS
          </button>
        </div>
      </div>
      )}

      {/* Customer Info - Hidden in nav mode */}
      {!navMode && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Customer Information</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{delivery.customer_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <a href={`tel:${delivery.customer_phone}`} className="font-medium text-emerald-600 hover:text-emerald-700">
                {delivery.customer_phone}
              </a>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {delivery.delivery_address || delivery.location}
              </p>
              {delivery.delivery_latitude && delivery.delivery_longitude && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                    <MapPin className="w-3 h-3" />
                    GPS: {delivery.delivery_latitude.toFixed(6)}, {delivery.delivery_longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Order Details - Hidden in nav mode */}
      {!navMode && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Order Details</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Quantity</span>
            </div>
            <span className="font-medium text-gray-900">{delivery.quantity_kg} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Total Amount</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">{formatCurrency(delivery.total_price)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Delivery Date</span>
            </div>
            <span className="font-medium text-gray-900">{delivery.delivery_date}</span>
          </div>
          {delivery.delivery_time && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">Delivery Time</span>
              </div>
              <span className="font-medium text-gray-900">{delivery.delivery_time}</span>
            </div>
          )}

          {/* Barcode */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Delivery Barcode</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex flex-col gap-3">
                {loadingBarcode ? (
                  <span className="text-sm text-gray-500">Generating codes...</span>
                ) : orderBarcode ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Barcode */}
                    <div className="flex-1 w-full overflow-x-auto">
                      <div className="bg-white rounded p-2 inline-block min-w-0 max-w-full">
                        <BarcodeDisplay 
                          value={orderBarcode} 
                          height={50} 
                          width={1.5} 
                          fontSize={12} 
                          className="max-w-full"
                        />
                      </div>
                    </div>
                    {/* QR Code */}
                    <div className="shrink-0">
                      <div className="bg-white rounded p-2 border border-gray-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(orderBarcode)}`}
                          alt="QR Code"
                          className="w-24 h-24"
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">QR Code</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">No barcode available</span>
                )}
                <button
                  onClick={() => router.push('/driver/scan')}
                  className="w-full sm:w-auto shrink-0 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Open Scanner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Actions - Hidden in nav mode */}
      {!navMode && (
      <div className="space-y-3">
        {/* Start Delivery Button */}
        {(delivery.delivery_status === "Pending" || delivery.delivery_status === "Scheduled") && (
          <button
            onClick={startDelivery}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 py-4 px-4 rounded-xl text-base font-semibold transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Truck className="w-5 h-5" />
            <span>{submitting ? "Starting..." : "Start Delivery"}</span>
          </button>
        )}

        {/* Payment Collection - Only when Out for Delivery */}
        {delivery.delivery_status === "Out for Delivery" && (
          <>
            {/* PDA Payment Collection */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Collect Payment on PDA</span>
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Use your PDA terminal to process M-Pesa or accept cash
                </p>
              </div>
              <PDAPaymentFlow
                orderId={delivery.id}
                amount={delivery.total_price || (delivery.quantity_kg * delivery.price_per_kg)}
                customerName={delivery.customer_name}
                onComplete={() => {
                  router.push("/driver/deliveries");
                }}
              />
            </div>

            {/* Divider */}
            <div className="flex items-center space-x-3 my-2">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm font-medium text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* M-Pesa STK Push (Coming Soon) */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Send M-Pesa Request
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  M-Pesa STK Push integration coming soon
                </p>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Customer:</strong> {delivery.customer_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Phone:</strong> {delivery.customer_phone || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Confirm Delivery</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Notes (Optional)
                </label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  rows={3}
                  placeholder="Any special notes or feedback from customer..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={submitting}
                  className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelivery}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
