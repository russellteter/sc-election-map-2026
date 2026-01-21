'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { importLeaflet, getBasePath } from '@/lib/leafletLoader';
import { getGeoJsonFromCache, setGeoJsonInCache } from '@/lib/cacheUtils';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import type { PathOptions, Layer, LeafletMouseEvent, Map as LeafletMap } from 'leaflet';

type CountyFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

export interface CountyGeoJSONLayerProps {
  /** State code (default: 'sc') */
  stateCode?: string;
  /** Minimum zoom to show counties (default: 7) */
  minZoom?: number;
  /** Maximum zoom to show counties (default: 11) */
  maxZoom?: number;
  /** Callback when county is hovered */
  onCountyHover?: (countyName: string | null, fips: string | null) => void;
  /** Callback when county is clicked */
  onCountyClick?: (countyName: string, fips: string) => void;
}

/**
 * County GeoJSON path by state code
 */
const COUNTY_GEOJSON_PATHS: Record<string, string> = {
  sc: '/data/sc-counties.geojson',
  // Add more states as needed
};

/**
 * Inner component that renders within MapContainer context
 * This allows us to use useMap hook
 */
interface CountyLayerInnerProps {
  geoJsonData: FeatureCollection;
  stateCode: string;
  minZoom: number;
  maxZoom: number;
  onCountyHover?: (countyName: string | null, fips: string | null) => void;
  onCountyClick?: (countyName: string, fips: string) => void;
  // Leaflet components passed down
  GeoJSON: React.ComponentType<{
    key: string;
    data: FeatureCollection;
    style: () => PathOptions;
    onEachFeature: (feature: Feature, layer: Layer) => void;
  }>;
  useMap: () => LeafletMap;
  useMapEvents: (handlers: Record<string, () => void>) => LeafletMap;
}

function CountyLayerInner({
  geoJsonData,
  stateCode,
  minZoom,
  maxZoom,
  onCountyHover,
  onCountyClick,
  GeoJSON,
  useMap,
  useMapEvents,
}: CountyLayerInnerProps) {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState<number>(map.getZoom());

  // Track zoom level changes
  useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
    },
  });

  // Determine if counties should be visible
  const isVisible = zoomLevel >= minZoom && zoomLevel <= maxZoom;

  // Get county name from feature
  const getCountyName = useCallback((feature: CountyFeature): string | null => {
    return feature.properties?.NAME || null;
  }, []);

  // Get county FIPS code from feature
  const getCountyFips = useCallback((feature: CountyFeature): string | null => {
    const state = feature.properties?.STATE || '';
    const county = feature.properties?.COUNTY || '';
    return state && county ? `${state}${county}` : null;
  }, []);

  // Style function for county features
  const getStyle = useCallback((): PathOptions => {
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: '#6B7280', // Gray-500
      weight: 1.5,
      opacity: 0.6,
      dashArray: '4, 4', // Dashed line to differentiate from districts
    };
  }, []);

  // Highlight style on hover
  const highlightStyle: PathOptions = {
    weight: 2.5,
    opacity: 0.9,
    color: '#4739E7', // Purple highlight
    dashArray: '', // Solid line on hover
  };

  // Event handlers
  const onEachFeature = useCallback((feature: CountyFeature, layer: Layer) => {
    const countyName = getCountyName(feature);
    const fips = getCountyFips(feature);

    if (!countyName) return;

    // Add tooltip with county name
    layer.bindTooltip(countyName, {
      permanent: false,
      direction: 'center',
      className: 'county-tooltip',
    });

    // Click handler
    if (onCountyClick) {
      layer.on('click', () => {
        onCountyClick(countyName, fips || '');
      });
    }

    // Hover handlers
    layer.on('mouseover', (e: LeafletMouseEvent) => {
      const targetLayer = e.target;
      targetLayer.setStyle(highlightStyle);
      targetLayer.bringToFront();
      if (onCountyHover) {
        onCountyHover(countyName, fips);
      }
    });

    layer.on('mouseout', (e: LeafletMouseEvent) => {
      const targetLayer = e.target;
      targetLayer.setStyle(getStyle());
      if (onCountyHover) {
        onCountyHover(null, null);
      }
    });
  }, [getCountyName, getCountyFips, getStyle, onCountyClick, onCountyHover, highlightStyle]);

  // Generate unique key for GeoJSON layer
  const layerKey = useMemo(() => {
    return `counties-${stateCode}-${zoomLevel}`;
  }, [stateCode, zoomLevel]);

  // Don't render if not visible at current zoom
  if (!isVisible) {
    return null;
  }

  return (
    <GeoJSON
      key={layerKey}
      data={geoJsonData}
      style={getStyle}
      onEachFeature={(feature, layer) => onEachFeature(feature as CountyFeature, layer)}
    />
  );
}

/**
 * CountyGeoJSONLayer - Display county boundaries at intermediate zoom levels
 *
 * Features:
 * - Shows county boundaries at region zoom (7-11)
 * - Hover shows county name
 * - Progressive enhancement: gracefully handles missing county data
 * - Semi-transparent to not obscure district data
 * - Automatically tracks zoom level via useMapEvents
 */
export default function CountyGeoJSONLayer({
  stateCode = 'sc',
  minZoom = 7,
  maxZoom = 11,
  onCountyHover,
  onCountyClick,
}: CountyGeoJSONLayerProps) {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [leafletComponents, setLeafletComponents] = useState<Awaited<ReturnType<typeof importLeaflet>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Leaflet components
  useEffect(() => {
    importLeaflet().then(setLeafletComponents);
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    let mounted = true;
    const cacheKey = `${stateCode}-counties`;

    async function loadGeoJSON() {
      setIsLoading(true);
      setError(null);

      const path = COUNTY_GEOJSON_PATHS[stateCode.toLowerCase()];
      if (!path) {
        // No county data for this state - graceful degradation
        setIsLoading(false);
        return;
      }

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
        const response = await fetch(`${basePath}${path}`);

        if (!response.ok) {
          // Progressive enhancement: skip if no county data
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
        if (mounted) {
          // Graceful degradation: log error but don't show error UI
          console.warn('County data not available:', err);
          setError(err instanceof Error ? err.message : 'Failed to load counties');
          setIsLoading(false);
        }
      }
    }

    loadGeoJSON();

    return () => {
      mounted = false;
    };
  }, [stateCode]);

  // Don't render if loading, error, or no data
  if (isLoading || error || !geoJsonData || !leafletComponents) {
    return null;
  }

  const { GeoJSON, useMap, useMapEvents } = leafletComponents;

  return (
    <CountyLayerInner
      geoJsonData={geoJsonData}
      stateCode={stateCode}
      minZoom={minZoom}
      maxZoom={maxZoom}
      onCountyHover={onCountyHover}
      onCountyClick={onCountyClick}
      GeoJSON={GeoJSON as CountyLayerInnerProps['GeoJSON']}
      useMap={useMap as CountyLayerInnerProps['useMap']}
      useMapEvents={useMapEvents as CountyLayerInnerProps['useMapEvents']}
    />
  );
}

export { CountyGeoJSONLayer };
