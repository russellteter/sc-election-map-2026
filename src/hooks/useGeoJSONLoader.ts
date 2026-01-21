'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FeatureCollection } from 'geojson';
import { getGeoJsonFromCache, setGeoJsonInCache } from '@/lib/cacheUtils';
import { GEOJSON_PATHS, getBasePath, type ChamberType } from '@/lib/leafletLoader';

export interface UseGeoJSONLoaderOptions {
  /** Chamber type to load */
  chamber: ChamberType;
  /** Whether to load immediately (default: true) */
  loadImmediately?: boolean;
}

export interface UseGeoJSONLoaderReturn {
  /** The loaded GeoJSON data */
  data: FeatureCollection | null;
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether data is loaded from cache */
  fromCache: boolean;
  /** Manually trigger load */
  load: () => Promise<void>;
  /** Clear cached data */
  clearCache: () => Promise<void>;
}

/**
 * Hook for loading and caching GeoJSON district boundaries
 *
 * Uses IndexedDB for persistent caching across sessions.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useGeoJSONLoader({ chamber: 'house' });
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorMessage error={error} />;
 * if (data) return <GeoJSONLayer data={data} />;
 * ```
 */
export function useGeoJSONLoader(options: UseGeoJSONLoaderOptions): UseGeoJSONLoaderReturn {
  const { chamber, loadImmediately = true } = options;

  const [data, setData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const cacheKey = `sc-${chamber}-districts`;

  const load = useCallback(async () => {
    if (isLoading || data) return;

    setIsLoading(true);
    setError(null);
    setFromCache(false);

    try {
      // Try IndexedDB cache first
      const cached = await getGeoJsonFromCache(cacheKey);
      if (cached) {
        setData(cached);
        setFromCache(true);
        setIsLoading(false);
        return;
      }

      // Fetch from network
      const basePath = getBasePath();
      const path = GEOJSON_PATHS[chamber];
      const response = await fetch(`${basePath}${path}`);

      if (!response.ok) {
        throw new Error(`Failed to load ${chamber} districts: ${response.status}`);
      }

      const geojson = await response.json();
      setData(geojson);
      setFromCache(false);

      // Cache for future use (async, don't await)
      setGeoJsonInCache(cacheKey, geojson).catch(console.error);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load district data';
      setError(message);
      console.error(`[useGeoJSONLoader] ${message}`, err);
    } finally {
      setIsLoading(false);
    }
  }, [chamber, cacheKey, isLoading, data]);

  const clearCache = useCallback(async () => {
    // Clear from IndexedDB
    // Note: Would need to add a delete function to cacheUtils
    // For now, just clear local state
    setData(null);
    setFromCache(false);
  }, []);

  // Load on mount if loadImmediately is true
  useEffect(() => {
    if (loadImmediately && !data && !isLoading) {
      load();
    }
  }, [loadImmediately, data, isLoading, load]);

  // Reset when chamber changes
  useEffect(() => {
    setData(null);
    setError(null);
    setFromCache(false);
  }, [chamber]);

  return {
    data,
    isLoading,
    error,
    fromCache,
    load,
    clearCache,
  };
}

export default useGeoJSONLoader;
