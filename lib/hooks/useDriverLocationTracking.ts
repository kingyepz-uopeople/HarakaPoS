/**
 * Custom hook for real-time driver location tracking
 * Broadcasts driver position to Supabase Realtime
 */

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

interface UseDriverLocationTrackingOptions {
  orderId: string;
  enabled?: boolean;
  updateInterval?: number; // milliseconds
  geofenceRadius?: number; // meters
  onArrival?: () => void;
}

export function useDriverLocationTracking({
  orderId,
  enabled = false,
  updateInterval = 5000, // Update every 5 seconds
  geofenceRadius = 50, // 50 meters
  onArrival,
}: UseDriverLocationTrackingOptions) {
  const [currentPosition, setCurrentPosition] = useState<LocationPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Check if driver is within geofence
  const checkGeofence = async (position: LocationPosition) => {
    if (hasArrived) return; // Already arrived, don't check again

    try {
      // Get destination coordinates from order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('delivery_latitude, delivery_longitude')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order destination:', orderError);
        return;
      }

      if (!order.delivery_latitude || !order.delivery_longitude) {
        return; // No destination coordinates
      }

      const distance = calculateDistance(
        position.latitude,
        position.longitude,
        order.delivery_latitude,
        order.delivery_longitude
      );

      if (distance <= geofenceRadius) {
        setHasArrived(true);
        onArrival?.();
      }
    } catch (err) {
      console.error('Error checking geofence:', err);
    }
  };

  // Broadcast position to Supabase
  const broadcastPosition = async (position: LocationPosition) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      const { error: insertError } = await supabase
        .from('driver_locations')
        .insert({
          driver_id: user.id,
          order_id: orderId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          heading: position.heading,
          speed: position.speed,
          timestamp: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error broadcasting position:', insertError);
        setError(insertError.message);
      } else {
        setError(null);
      }

      // Check geofence after broadcasting
      await checkGeofence(position);
    } catch (err: any) {
      console.error('Error in broadcastPosition:', err);
      setError(err.message);
    }
  };

  // Use ref to avoid stale closure in interval
  const currentPositionRef = useRef<LocationPosition | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    currentPositionRef.current = currentPosition;
  }, [currentPosition]);

  // Start tracking
  useEffect(() => {
    if (!enabled || !orderId) {
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const position: LocationPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
        };
        setCurrentPosition(position);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    // Broadcast at regular intervals using ref to avoid stale closure
    intervalRef.current = setInterval(() => {
      const pos = currentPositionRef.current;
      if (pos) {
        broadcastPosition(pos);
      }
    }, updateInterval);

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTracking(false);
    };
  }, [enabled, orderId, updateInterval]);

  // Broadcast immediately when position changes (first update)
  const hasInitialBroadcast = useRef(false);
  useEffect(() => {
    if (enabled && currentPosition && !hasInitialBroadcast.current) {
      hasInitialBroadcast.current = true;
      broadcastPosition(currentPosition);
    }
  }, [currentPosition, enabled]);

  return {
    currentPosition,
    isTracking,
    error,
    hasArrived,
  };
}
