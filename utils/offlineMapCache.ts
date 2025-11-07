/**
 * Offline Map Tile Cache Manager
 * Pre-caches OpenStreetMap tiles for common delivery areas
 */

const CACHE_NAME = 'haraka-map-tiles-v1';
const TILE_CACHE_SIZE = 500; // Max tiles to cache
const NAIROBI_BOUNDS = {
  minLat: -1.45,
  maxLat: -1.15,
  minLng: 36.65,
  maxLng: 36.95,
};

interface TileCoordinate {
  z: number; // Zoom level
  x: number;
  y: number;
}

/**
 * Convert lat/lng to tile coordinates
 */
function latLngToTile(lat: number, lng: number, zoom: number): TileCoordinate {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { z: zoom, x, y };
}

/**
 * Get tile URL from coordinates
 */
function getTileUrl(tile: TileCoordinate): string {
  const subdomains = ['a', 'b', 'c'];
  const subdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
  return `https://${subdomain}.tile.openstreetmap.org/${tile.z}/${tile.x}/${tile.y}.png`;
}

/**
 * Pre-cache tiles for a bounding box at specified zoom level
 */
async function cacheTilesForArea(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  zoomLevel: number
): Promise<number> {
  const topLeft = latLngToTile(bounds.maxLat, bounds.minLng, zoomLevel);
  const bottomRight = latLngToTile(bounds.minLat, bounds.maxLng, zoomLevel);

  const tiles: TileCoordinate[] = [];
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ z: zoomLevel, x, y });
    }
  }

  // Limit tiles to prevent excessive caching
  const tilesToCache = tiles.slice(0, TILE_CACHE_SIZE);

  try {
    const cache = await caches.open(CACHE_NAME);
    const urls = tilesToCache.map(getTileUrl);

    // Fetch and cache tiles with delay to avoid rate limiting
    let cached = 0;
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          cached++;
        }
        // Small delay to be nice to OSM servers
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        console.warn(`Failed to cache tile: ${url}`, err);
      }
    }

    return cached;
  } catch (error) {
    console.error('Error caching tiles:', error);
    return 0;
  }
}

/**
 * Pre-cache common Nairobi delivery areas
 */
export async function cacheNairobiDeliveryAreas(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    console.warn('Cache API not available');
    return;
  }

  try {
    console.log('Caching Nairobi delivery area tiles...');

    // Cache zoom levels 12-14 (good for navigation)
    const zoomLevels = [12, 13, 14];

    for (const zoom of zoomLevels) {
      const cached = await cacheTilesForArea(NAIROBI_BOUNDS, zoom);
      console.log(`Cached ${cached} tiles at zoom ${zoom}`);
    }

    console.log('Nairobi area tiles cached successfully');
  } catch (error) {
    console.error('Failed to cache Nairobi tiles:', error);
  }
}

/**
 * Cache tiles for specific delivery locations
 */
export async function cacheDeliveryLocations(
  locations: Array<{ latitude: number; longitude: number }>,
  zoomLevel: number = 15
): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAME);

    for (const loc of locations) {
      // Cache a small area around each delivery (3x3 tiles)
      const centerTile = latLngToTile(loc.latitude, loc.longitude, zoomLevel);

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tile = {
            z: zoomLevel,
            x: centerTile.x + dx,
            y: centerTile.y + dy,
          };
          const url = getTileUrl(tile);

          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            // Continue on error
          }

          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }
    }

    console.log(`Cached tiles for ${locations.length} delivery locations`);
  } catch (error) {
    console.error('Error caching delivery location tiles:', error);
  }
}

/**
 * Clear old map tile cache
 */
export async function clearMapCache(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    await caches.delete(CACHE_NAME);
    console.log('Map tile cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{ count: number; size: number }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { count: 0, size: 0 };
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let totalSize = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }

    return {
      count: keys.length,
      size: totalSize,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return { count: 0, size: 0 };
  }
}
