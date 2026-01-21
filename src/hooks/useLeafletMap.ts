'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Map as LeafletMap, LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import { SC_BOUNDS, SC_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from '@/lib/leafletLoader';

export interface UseLeafletMapOptions {
  /** Initial bounds (default: SC_BOUNDS) */
  initialBounds?: LatLngBoundsExpression;
  /** Initial center (default: SC_CENTER) */
  initialCenter?: LatLngExpression;
  /** Initial zoom level (default: DEFAULT_ZOOM) */
  initialZoom?: number;
  /** Minimum zoom level (default: MIN_ZOOM) */
  minZoom?: number;
  /** Maximum zoom level (default: MAX_ZOOM) */
  maxZoom?: number;
  /** Callback when map is ready */
  onMapReady?: (map: LeafletMap) => void;
}

export interface UseLeafletMapReturn {
  /** Current map instance */
  map: LeafletMap | null;
  /** Set the map instance (called by MapContainer) */
  setMap: (map: LeafletMap | null) => void;
  /** Current zoom level */
  zoom: number;
  /** Current center position */
  center: LatLngExpression;
  /** Whether map is currently animating */
  isAnimating: boolean;
  /** Fly to a specific location with animation */
  flyTo: (latlng: LatLngExpression, zoom?: number) => void;
  /** Fit bounds to a specific area */
  fitBounds: (bounds: LatLngBoundsExpression, options?: { padding?: [number, number] }) => void;
  /** Zoom to state view */
  zoomToState: () => void;
  /** Zoom to a specific district by bounding box */
  zoomToDistrict: (bounds: LatLngBoundsExpression) => void;
  /** Reset to initial view */
  resetView: () => void;
}

/**
 * Hook for managing Leaflet map state and interactions
 */
export function useLeafletMap(options: UseLeafletMapOptions = {}): UseLeafletMapReturn {
  const {
    initialBounds = SC_BOUNDS,
    initialCenter = SC_CENTER,
    initialZoom = DEFAULT_ZOOM,
    minZoom = MIN_ZOOM,
    maxZoom = MAX_ZOOM,
    onMapReady,
  } = options;

  const [map, setMapState] = useState<LeafletMap | null>(null);
  const [zoom, setZoom] = useState(initialZoom);
  const [center, setCenter] = useState<LatLngExpression>(initialCenter);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set map with callback
  const setMap = useCallback((newMap: LeafletMap | null) => {
    setMapState(newMap);
    if (newMap && onMapReady) {
      onMapReady(newMap);
    }
  }, [onMapReady]);

  // Track zoom/center changes
  useEffect(() => {
    if (!map) return;

    const handleZoomEnd = () => {
      setZoom(map.getZoom());
      setIsAnimating(false);
    };

    const handleMoveEnd = () => {
      setCenter(map.getCenter());
      setIsAnimating(false);
    };

    const handleZoomStart = () => setIsAnimating(true);
    const handleMoveStart = () => setIsAnimating(true);

    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    map.on('zoomstart', handleZoomStart);
    map.on('movestart', handleMoveStart);

    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
      map.off('zoomstart', handleZoomStart);
      map.off('movestart', handleMoveStart);
    };
  }, [map]);

  // Clear animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const flyTo = useCallback((latlng: LatLngExpression, targetZoom?: number) => {
    if (!map) return;

    setIsAnimating(true);
    map.flyTo(latlng, targetZoom ?? zoom, {
      duration: 0.8,
      easeLinearity: 0.25,
    });

    // Fallback animation end detection
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  }, [map, zoom]);

  const fitBounds = useCallback((bounds: LatLngBoundsExpression, options?: { padding?: [number, number] }) => {
    if (!map) return;

    setIsAnimating(true);
    map.fitBounds(bounds, {
      padding: options?.padding ?? [20, 20],
      animate: true,
      duration: 0.8,
    });

    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  }, [map]);

  const zoomToState = useCallback(() => {
    fitBounds(initialBounds);
  }, [fitBounds, initialBounds]);

  const zoomToDistrict = useCallback((bounds: LatLngBoundsExpression) => {
    fitBounds(bounds, { padding: [30, 30] });
  }, [fitBounds]);

  const resetView = useCallback(() => {
    if (!map) return;
    map.setView(initialCenter, initialZoom);
  }, [map, initialCenter, initialZoom]);

  return {
    map,
    setMap,
    zoom,
    center,
    isAnimating,
    flyTo,
    fitBounds,
    zoomToState,
    zoomToDistrict,
    resetView,
  };
}

export default useLeafletMap;
