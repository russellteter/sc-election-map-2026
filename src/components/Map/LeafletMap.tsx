'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  importLeaflet,
  TILE_LAYERS,
  SC_BOUNDS,
  SC_BOUNDS_RAW,
  SC_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  type TileLayerKey,
} from '@/lib/leafletLoader';
import type { Map as LeafletMapType, LatLngBoundsExpression, LatLngExpression } from 'leaflet';

// Import Leaflet CSS client-side only
// (added to globals.css for this project)

export interface LeafletMapProps {
  /** Tile layer style (default: positron) */
  tileLayer?: TileLayerKey;
  /** Initial bounds (default: SC_BOUNDS) */
  bounds?: LatLngBoundsExpression;
  /** Initial center (default: SC_CENTER) */
  center?: LatLngExpression;
  /** Initial zoom (default: DEFAULT_ZOOM) */
  zoom?: number;
  /** Minimum zoom level */
  minZoom?: number;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Callback when map is ready */
  onMapReady?: (map: LeafletMapType) => void;
  /** Map children (GeoJSON layers, markers, etc.) */
  children?: ReactNode;
  /** Loading fallback content */
  loadingFallback?: ReactNode;
  /** Additional className for container */
  className?: string;
  /** Show zoom controls */
  showZoomControl?: boolean;
  /** Show attribution */
  showAttribution?: boolean;
}

/**
 * Loading placeholder for Leaflet map
 */
function MapLoadingPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`leaflet-loading-placeholder ${className || ''}`}>
      <div className="leaflet-loading-content">
        <div className="leaflet-loading-spinner" />
        <span>Loading interactive map...</span>
      </div>
    </div>
  );
}

/**
 * Client-side Leaflet map implementation
 */
function LeafletMapClient({
  tileLayer = 'positron',
  bounds = SC_BOUNDS,
  center = SC_CENTER,
  zoom = DEFAULT_ZOOM,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM,
  onMapReady,
  children,
  className,
  showZoomControl = true,
  showAttribution = true,
}: LeafletMapProps) {
  const [leafletComponents, setLeafletComponents] = useState<Awaited<ReturnType<typeof importLeaflet>>>(null);
  const [isReady, setIsReady] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    let mounted = true;

    importLeaflet().then((components) => {
      if (mounted && components) {
        setLeafletComponents(components);
        setIsReady(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Handle map creation
  const handleMapCreated = useCallback((map: LeafletMapType) => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [onMapReady]);

  if (!isReady || !leafletComponents) {
    return <MapLoadingPlaceholder className={className} />;
  }

  const { MapContainer, TileLayer, ZoomControl, AttributionControl } = leafletComponents;
  const tileConfig = TILE_LAYERS[tileLayer];

  // Calculate expanded maxBounds with padding for smooth UX
  // SC_BOUNDS_RAW is [[32.0346, -83.3533], [35.2155, -78.5410]]
  // Add ~0.5 degree padding to allow some panning beyond state edges
  const maxBounds: LatLngBoundsExpression = [
    [SC_BOUNDS_RAW[0][0] - 0.5, SC_BOUNDS_RAW[0][1] - 0.5], // SW corner with padding
    [SC_BOUNDS_RAW[1][0] + 0.5, SC_BOUNDS_RAW[1][1] + 0.5], // NE corner with padding
  ];

  return (
    <MapContainer
      bounds={bounds}
      center={center}
      zoom={zoom}
      minZoom={minZoom}
      maxZoom={maxZoom}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      className={`leaflet-map-container ${className || ''}`}
      zoomControl={false}
      attributionControl={false}
      ref={(map: LeafletMapType | null) => {
        if (map) {
          handleMapCreated(map);
        }
      }}
    >
      <TileLayer
        url={tileConfig.url}
        attribution={tileConfig.attribution}
        maxZoom={tileConfig.maxZoom}
        subdomains={tileConfig.subdomains}
      />
      {showZoomControl && <ZoomControl position="topright" />}
      {showAttribution && <AttributionControl position="bottomright" />}
      {children}
    </MapContainer>
  );
}

/**
 * LeafletMap Component
 *
 * SSR-safe Leaflet map with CartoDB Positron tiles.
 * Dynamically loads Leaflet only on client-side.
 *
 * Usage:
 * ```tsx
 * <LeafletMap onMapReady={(map) => console.log('Map ready', map)}>
 *   <DistrictGeoJSONLayer chamber="house" />
 * </LeafletMap>
 * ```
 */
export default function LeafletMap(props: LeafletMapProps) {
  const { loadingFallback, ...mapProps } = props;

  // SSR safety - render placeholder on server
  if (typeof window === 'undefined') {
    return loadingFallback || <MapLoadingPlaceholder className={props.className} />;
  }

  return <LeafletMapClient {...mapProps} />;
}

// Also export as named export
export { LeafletMap };
