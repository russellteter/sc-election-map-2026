'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { importLeaflet, getBasePath } from '@/lib/leafletLoader';
import { getGeoJsonFromCache, setGeoJsonInCache } from '@/lib/cacheUtils';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import type { PathOptions, Layer, LeafletMouseEvent, Map as LeafletMap } from 'leaflet';

type CountyFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

export interface CountyBoundaryLayerProps {
  /** Leaflet map instance for zoom-based visibility */
  map?: LeafletMap | null;
  /** Minimum zoom level to show counties (default: 8) */
  minZoom?: number;
  /** Maximum zoom level to show counties (default: 10) */
  maxZoom?: number;
  /** Callback when county is hovered */
  onCountyHover?: (countyName: string | null) => void;
  /** State code for county data (default: 'sc') */
  stateCode?: string;
}

/**
 * County boundary overlay layer for Leaflet map
 *
 * Shows county boundaries at intermediate zoom levels (8-10 by default).
 * Provides visual context for regional navigation.
 *
 * Features:
 * - Progressive enhancement: gracefully handles missing data
 * - Zoom-level aware: only renders when zoom is in range
 * - Hover shows county name
 * - Dashed stroke style to distinguish from districts
 */
export default function CountyBoundaryLayer({
  map,
  minZoom = 8,
  maxZoom = 10,
  onCountyHover,
  stateCode = 'sc',
}: CountyBoundaryLayerProps) {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [leafletComponents, setLeafletComponents] = useState<Awaited<ReturnType<typeof importLeaflet>>>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load Leaflet components
  useEffect(() => {
    importLeaflet().then(setLeafletComponents);
  }, []);

  // Load county GeoJSON data
  useEffect(() => {
    let mounted = true;
    const cacheKey = `${stateCode}-counties`;

    async function loadCountyGeoJSON() {
      setIsLoading(true);

      try {
        // Try cache first
        const cached = await getGeoJsonFromCache(cacheKey);
        if (cached && mounted) {
          setGeoJsonData(cached);
          setIsLoading(false);
          return;
        }

        // Fetch from network
        const basePath = getBasePath();
        const path = `/data/${stateCode}-counties.geojson`;
        const response = await fetch(`${basePath}${path}`);

        if (!response.ok) {
          // Progressive enhancement: silently fail if no county data
          console.debug(`County data not available for ${stateCode}`);
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (mounted) {
          setGeoJsonData(data);
          setIsLoading(false);

          // Cache for future use
          setGeoJsonInCache(cacheKey, data).catch(console.error);
        }
      } catch (err) {
        // Progressive enhancement: silently fail
        console.debug('Could not load county boundaries:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadCountyGeoJSON();

    return () => {
      mounted = false;
    };
  }, [stateCode]);

  // Handle zoom-level visibility
  useEffect(() => {
    if (!map) return;

    function updateVisibility() {
      const zoom = map!.getZoom();
      setIsVisible(zoom >= minZoom && zoom <= maxZoom);
    }

    // Initial check
    updateVisibility();

    // Listen for zoom changes
    map.on('zoomend', updateVisibility);

    return () => {
      map.off('zoomend', updateVisibility);
    };
  }, [map, minZoom, maxZoom]);

  // Style function for county boundaries
  const getStyle = useCallback((): PathOptions => {
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: '#6B7280', // Gray-500
      weight: 1.5,
      opacity: 0.6,
      dashArray: '5, 5', // Dashed line to distinguish from district boundaries
    };
  }, []);

  // Highlight style on hover
  const highlightStyle: PathOptions = {
    weight: 2.5,
    opacity: 1,
    color: '#4B5563', // Gray-600
  };

  // Event handlers for each county feature
  const onEachFeature = useCallback((feature: CountyFeature, layer: Layer) => {
    const countyName = feature.properties?.NAME;

    // Hover handlers
    layer.on('mouseover', (e: LeafletMouseEvent) => {
      const targetLayer = e.target;
      targetLayer.setStyle(highlightStyle);
      targetLayer.bringToFront();
      if (onCountyHover && countyName) {
        onCountyHover(countyName);
      }
    });

    layer.on('mouseout', (e: LeafletMouseEvent) => {
      const targetLayer = e.target;
      targetLayer.setStyle(getStyle());
      if (onCountyHover) {
        onCountyHover(null);
      }
    });

    // Tooltip showing county name
    if (countyName) {
      layer.bindTooltip(countyName, {
        permanent: false,
        direction: 'center',
        className: 'county-tooltip',
      });
    }
  }, [getStyle, onCountyHover]);

  // Layer key for re-rendering
  const layerKey = useMemo(() => {
    return `counties-${stateCode}-${isVisible}`;
  }, [stateCode, isVisible]);

  // Don't render if loading, no data, not visible, or no Leaflet
  if (isLoading || !geoJsonData || !isVisible || !leafletComponents) {
    return null;
  }

  const { GeoJSON } = leafletComponents;

  return (
    <GeoJSON
      key={layerKey}
      data={geoJsonData}
      style={getStyle}
      onEachFeature={(feature, layer) => onEachFeature(feature as CountyFeature, layer)}
    />
  );
}

export { CountyBoundaryLayer };
