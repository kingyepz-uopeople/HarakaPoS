/**
 * Route optimization utilities for multi-delivery planning
 * Uses nearest-neighbor algorithm for simplicity (can upgrade to OSRM later)
 */

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  priority?: number; // Optional priority (1-5, higher = more urgent)
}

interface OptimizedRoute {
  locations: Location[];
  totalDistance: number; // in km
  estimatedDuration: number; // in minutes
  order: number[]; // Indices of locations in optimized order
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
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
}

/**
 * Nearest-neighbor TSP heuristic
 * Starts from startLocation and visits each delivery in order of proximity
 */
export function optimizeDeliveryRoute(
  startLocation: { latitude: number; longitude: number },
  deliveries: Location[],
  options: {
    avgSpeedKmh?: number; // Average driving speed (default 30)
    respectPriority?: boolean; // If true, high-priority deliveries come first
  } = {}
): OptimizedRoute {
  const { avgSpeedKmh = 30, respectPriority = false } = options;

  if (deliveries.length === 0) {
    return {
      locations: [],
      totalDistance: 0,
      estimatedDuration: 0,
      order: [],
    };
  }

  // Sort by priority if requested
  let sorted = [...deliveries];
  if (respectPriority) {
    sorted.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  const unvisited = sorted.map((loc, idx) => idx);
  const route: number[] = [];
  let currentLat = startLocation.latitude;
  let currentLng = startLocation.longitude;
  let totalDistance = 0;

  // Greedy nearest-neighbor
  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const locIdx = unvisited[i];
      const dist = calculateDistance(
        currentLat,
        currentLng,
        sorted[locIdx].latitude,
        sorted[locIdx].longitude
      );

      // Priority boost: reduce effective distance for high-priority items
      const effectiveDist =
        respectPriority && sorted[locIdx].priority
          ? dist / sorted[locIdx].priority!
          : dist;

      if (effectiveDist < nearestDist) {
        nearestDist = dist; // Use actual distance for total
        nearestIdx = i;
      }
    }

    const selectedIdx = unvisited[nearestIdx];
    route.push(selectedIdx);
    totalDistance += nearestDist;
    currentLat = sorted[selectedIdx].latitude;
    currentLng = sorted[selectedIdx].longitude;
    unvisited.splice(nearestIdx, 1);
  }

  const estimatedDuration = (totalDistance / avgSpeedKmh) * 60; // Convert to minutes

  return {
    locations: route.map((idx) => sorted[idx]),
    totalDistance,
    estimatedDuration,
    order: route,
  };
}

/**
 * Optimize using OSRM Trip API (requires network call)
 * Returns optimized waypoints in best order
 */
export async function optimizeRouteWithOSRM(
  startLocation: { latitude: number; longitude: number },
  deliveries: Location[]
): Promise<OptimizedRoute | null> {
  try {
    // Build coordinates string: start,delivery1,delivery2,...
    const coords = [
      `${startLocation.longitude},${startLocation.latitude}`,
      ...deliveries.map((d) => `${d.longitude},${d.latitude}`),
    ].join(';');

    const url = `https://router.project-osrm.org/trip/v1/driving/${coords}?source=first&roundtrip=false&steps=false`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
      console.error('OSRM optimization failed:', data);
      return null;
    }

    const trip = data.trips[0];
    const waypoints = data.waypoints;

    // Extract optimized order (OSRM returns waypoint_index for each stop)
    const order = waypoints
      .slice(1) // Skip start location
      .map((wp: any) => wp.waypoint_index - 1) // Adjust for start being index 0
      .filter((idx: number) => idx >= 0);

    const optimizedLocations = order.map((idx: number) => deliveries[idx]);
    const totalDistance = trip.distance / 1000; // meters to km
    const estimatedDuration = trip.duration / 60; // seconds to minutes

    return {
      locations: optimizedLocations,
      totalDistance,
      estimatedDuration,
      order,
    };
  } catch (error) {
    console.error('OSRM optimization error:', error);
    return null;
  }
}

/**
 * Get optimized route with fallback
 * Tries OSRM first, falls back to nearest-neighbor if network fails
 */
export async function getOptimizedRoute(
  startLocation: { latitude: number; longitude: number },
  deliveries: Location[],
  options: {
    useOSRM?: boolean;
    avgSpeedKmh?: number;
    respectPriority?: boolean;
  } = {}
): Promise<OptimizedRoute> {
  const { useOSRM = true, ...optimizeOptions } = options;

  // Try OSRM if enabled and we have deliveries
  if (useOSRM && deliveries.length > 0) {
    const osrmResult = await optimizeRouteWithOSRM(startLocation, deliveries);
    if (osrmResult) {
      return osrmResult;
    }
  }

  // Fallback to local nearest-neighbor
  return optimizeDeliveryRoute(startLocation, deliveries, optimizeOptions);
}
