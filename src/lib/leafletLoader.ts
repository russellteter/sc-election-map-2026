/**
 * Leaflet Dynamic Import Loader
 *
 * Provides SSR-safe dynamic imports for Leaflet and react-leaflet.
 * Zero initial bundle impact - Leaflet is only loaded when needed.
 *
 * Usage:
 *   const { MapContainer, TileLayer } = await importLeaflet();
 */

import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';

/**
 * State map configuration for multi-state support
 */
export interface StateMapConfig {
  bounds: LatLngBoundsExpression;
  center: LatLngExpression;
  defaultZoom: number;
  minZoom: number;
  maxZoom: number;
}

/**
 * State-specific map configurations
 */
export const STATE_MAP_CONFIGS: Record<string, StateMapConfig> = {
  sc: {
    bounds: [[32.0346, -83.3533], [35.2155, -78.5410]],
    center: [33.8361, -81.1637],
    defaultZoom: 7,
    minZoom: 6,
    maxZoom: 12,
  },
  nc: {
    bounds: [[33.8422, -84.3219], [36.5882, -75.4601]],
    center: [35.7596, -79.0193],
    defaultZoom: 7,
    minZoom: 6,
    maxZoom: 12,
  },
  ga: {
    bounds: [[30.3575, -85.6052], [35.0015, -80.8396]],
    center: [32.1656, -82.9001],
    defaultZoom: 7,
    minZoom: 6,
    maxZoom: 12,
  },
  fl: {
    bounds: [[24.3963, -87.6349], [31.0009, -79.9743]],
    center: [27.6648, -81.5158],
    defaultZoom: 6,
    minZoom: 5,
    maxZoom: 12,
  },
  va: {
    bounds: [[36.5407, -83.6753], [39.4660, -75.2422]],
    center: [37.4316, -78.6569],
    defaultZoom: 7,
    minZoom: 6,
    maxZoom: 12,
  },
};

/**
 * Get state map configuration
 */
export function getStateMapConfig(stateCode: string): StateMapConfig {
  const config = STATE_MAP_CONFIGS[stateCode.toLowerCase()];
  return config || STATE_MAP_CONFIGS.sc; // Default to SC
}

// Legacy exports for backwards compatibility
export const SC_BOUNDS: LatLngBoundsExpression = STATE_MAP_CONFIGS.sc.bounds;
export const SC_CENTER: LatLngExpression = STATE_MAP_CONFIGS.sc.center;

// Type-safe raw bounds as tuple for calculations (e.g., maxBounds padding)
export const SC_BOUNDS_RAW: [[number, number], [number, number]] = [[32.0346, -83.3533], [35.2155, -78.5410]];

// Default zoom levels
export const DEFAULT_ZOOM = 7;
export const MIN_ZOOM = 6;
export const MAX_ZOOM = 12;

// Tile layer configurations
export const TILE_LAYERS = {
  // CartoDB Positron - minimal, clean style that fits glassmorphic design
  positron: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  // CartoDB Positron (no labels) - even cleaner for district overlay
  positronNoLabels: {
    url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  // OSM standard (fallback)
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
} as const;

export type TileLayerKey = keyof typeof TILE_LAYERS;

/**
 * Dynamic import for Leaflet components (SSR-safe)
 *
 * Returns null on server-side render - only loads in browser.
 */
export async function importLeaflet() {
  if (typeof window === 'undefined') {
    return null;
  }

  const [leaflet, reactLeaflet] = await Promise.all([
    import('leaflet'),
    import('react-leaflet'),
  ]);

  // Fix Leaflet default icon paths (common issue with bundlers)
  // @ts-expect-error - accessing internal property
  delete leaflet.default.Icon.Default.prototype._getIconUrl;
  leaflet.default.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  return {
    L: leaflet.default,
    MapContainer: reactLeaflet.MapContainer,
    TileLayer: reactLeaflet.TileLayer,
    GeoJSON: reactLeaflet.GeoJSON,
    useMap: reactLeaflet.useMap,
    useMapEvents: reactLeaflet.useMapEvents,
    Marker: reactLeaflet.Marker,
    Popup: reactLeaflet.Popup,
    ZoomControl: reactLeaflet.ZoomControl,
    AttributionControl: reactLeaflet.AttributionControl,
  };
}

/**
 * Type definitions for Leaflet imports
 */
export type LeafletImports = Awaited<ReturnType<typeof importLeaflet>>;

/**
 * Create a dynamic Next.js component wrapper for Leaflet components
 *
 * Usage:
 *   const DynamicMap = createLeafletComponent(() => import('./LeafletMap'));
 */
export function createLeafletComponent<P extends object>(
  loader: () => Promise<{ default: React.ComponentType<P> }>
) {
  // This will be used with next/dynamic in components
  return loader;
}

/**
 * GeoJSON file paths for SC district boundaries (legacy)
 */
export const GEOJSON_PATHS = {
  house: '/data/sc-house-districts.geojson',
  senate: '/data/sc-senate-districts.geojson',
  congressional: '/data/sc-congressional-districts.geojson',
} as const;

export type ChamberType = keyof typeof GEOJSON_PATHS;

/**
 * States with available GeoJSON data
 * SC has full coverage, others only have congressional
 */
export const STATE_GEOJSON_AVAILABILITY: Record<string, { house: boolean; senate: boolean; congressional: boolean }> = {
  sc: { house: true, senate: true, congressional: true },
  nc: { house: false, senate: false, congressional: true },
  ga: { house: false, senate: false, congressional: true },
  fl: { house: false, senate: false, congressional: true },
  va: { house: false, senate: false, congressional: true },
};

/**
 * Get GeoJSON path for a specific state and chamber
 *
 * @param stateCode - State abbreviation (e.g., 'sc', 'nc')
 * @param chamber - Chamber type (house, senate, congressional)
 * @returns Path to GeoJSON file or null if not available
 */
export function getGeoJsonPath(stateCode: string, chamber: ChamberType): string | null {
  const state = stateCode.toLowerCase();
  const availability = STATE_GEOJSON_AVAILABILITY[state];

  if (!availability) {
    return null;
  }

  if (!availability[chamber]) {
    return null;
  }

  return `/data/${state}-${chamber}-districts.geojson`;
}

/**
 * Check if GeoJSON is available for a state/chamber combination
 */
export function hasGeoJsonAvailable(stateCode: string, chamber: ChamberType): boolean {
  const state = stateCode.toLowerCase();
  const availability = STATE_GEOJSON_AVAILABILITY[state];
  return availability?.[chamber] ?? false;
}

/**
 * Get the property key for district number based on chamber type
 *
 * - House: SLDLST (State Legislative District Lower)
 * - Senate: SLDUST (State Legislative District Upper)
 * - Congressional: CD118FP (Congressional District 118th Congress)
 */
export function getDistrictPropertyKey(chamber: ChamberType): string {
  switch (chamber) {
    case 'house':
      return 'SLDLST';
    case 'senate':
      return 'SLDUST';
    case 'congressional':
      return 'CD118FP';
  }
}

/**
 * Get the base path for static assets (handles GitHub Pages subdirectory)
 */
export function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname.includes('/sc-election-map-2026')
    ? '/sc-election-map-2026'
    : '';
}
