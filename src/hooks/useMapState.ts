'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import {
  MapState,
  parseMapState,
  serializeMapState,
  mergeWithDefaults,
  DEFAULT_MAP_STATE,
} from '@/lib/mapStateUtils';

/**
 * Options for useMapState hook
 */
export interface UseMapStateOptions {
  /** Debounce delay for URL updates (default: 300ms) */
  debounceMs?: number;
  /** Whether to sync state from URL on mount (default: true) */
  syncOnMount?: boolean;
}

/**
 * Return type for useMapState hook
 */
export interface UseMapStateReturn {
  /** Current map state (merged with defaults) */
  mapState: ReturnType<typeof mergeWithDefaults>;
  /** Update map state (partial updates supported) */
  setMapState: (state: Partial<MapState>) => void;
  /** Update state from Leaflet map instance */
  updateFromMap: (map: LeafletMap) => void;
  /** Apply current state to Leaflet map (flyTo with animation) */
  applyToMap: (map: LeafletMap, animate?: boolean) => void;
  /** Whether state has been initialized from URL */
  isInitialized: boolean;
}

/**
 * useMapState - Bidirectional URL synchronization for map state
 *
 * Enables deep-linking to specific map views by persisting zoom, center,
 * chamber, and district to URL query parameters.
 *
 * Features:
 * - Parses initial state from URL on mount
 * - Debounces URL updates to prevent thrashing during pan/zoom
 * - Uses replaceState (not pushState) to avoid history spam
 * - SSR-safe: returns defaults during server rendering
 * - Preserves non-map URL parameters
 *
 * @param options - Configuration options
 * @returns Map state and control functions
 *
 * @example
 * ```tsx
 * const { mapState, setMapState, updateFromMap, applyToMap } = useMapState();
 *
 * // Update state when map moves
 * useMapEvents({
 *   moveend: () => updateFromMap(map),
 * });
 *
 * // Apply URL state to map on load
 * useEffect(() => {
 *   if (map && isInitialized) {
 *     applyToMap(map);
 *   }
 * }, [map, isInitialized]);
 * ```
 */
export function useMapState(options: UseMapStateOptions = {}): UseMapStateReturn {
  const { debounceMs = 300, syncOnMount = true } = options;

  // Internal raw state (partial, from URL)
  const [rawState, setRawState] = useState<MapState>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're in the browser
  const isBrowser = typeof window !== 'undefined';

  // Parse URL state on mount (client-side only)
  useEffect(() => {
    if (!isBrowser || !syncOnMount) {
      setIsInitialized(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const parsed = parseMapState(params);
    setRawState(parsed);
    setIsInitialized(true);
  }, [isBrowser, syncOnMount]);

  // Sync state to URL (debounced)
  const syncToUrl = useCallback(
    (state: MapState) => {
      if (!isBrowser) return;

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        // Get existing params (preserve non-map params)
        const currentParams = new URLSearchParams(window.location.search);

        // Get map-specific params
        const mapParams = serializeMapState(state);

        // Remove old map params
        ['lat', 'lng', 'zoom', 'chamber', 'district'].forEach((key) => {
          currentParams.delete(key);
        });

        // Add new map params
        mapParams.forEach((value, key) => {
          currentParams.set(key, value);
        });

        // Build new URL
        const queryString = currentParams.toString();
        const newUrl = queryString
          ? `${window.location.pathname}?${queryString}`
          : window.location.pathname;

        // Update URL without navigation
        window.history.replaceState({}, '', newUrl);
      }, debounceMs);
    },
    [isBrowser, debounceMs]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update state (partial updates supported)
  const setMapState = useCallback(
    (update: Partial<MapState>) => {
      setRawState((prev) => {
        const newState = { ...prev, ...update };
        syncToUrl(newState);
        return newState;
      });
    },
    [syncToUrl]
  );

  // Update state from Leaflet map instance
  const updateFromMap = useCallback(
    (map: LeafletMap) => {
      const center = map.getCenter();
      const zoom = map.getZoom();

      setMapState({
        lat: center.lat,
        lng: center.lng,
        zoom,
      });
    },
    [setMapState]
  );

  // Apply current state to Leaflet map
  const applyToMap = useCallback(
    (map: LeafletMap, animate = true) => {
      const state = mergeWithDefaults(rawState);

      if (animate) {
        map.flyTo([state.lat, state.lng], state.zoom, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
      } else {
        map.setView([state.lat, state.lng], state.zoom);
      }
    },
    [rawState]
  );

  // Merge raw state with defaults for external use
  const mapState = useMemo(() => mergeWithDefaults(rawState), [rawState]);

  return {
    mapState,
    setMapState,
    updateFromMap,
    applyToMap,
    isInitialized,
  };
}

export default useMapState;
