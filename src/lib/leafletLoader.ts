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

// SC state bounding box (approx)
export const SC_BOUNDS: LatLngBoundsExpression = [
  [32.0346, -83.3533], // Southwest corner
  [35.2155, -78.5410]  // Northeast corner
];

// SC state center
export const SC_CENTER: LatLngExpression = [33.8361, -81.1637];

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
 * GeoJSON file paths for SC district boundaries (legacy - use getStateGeoJSONPaths)
 */
export const GEOJSON_PATHS = {
  house: '/data/sc-house-districts.geojson',
  senate: '/data/sc-senate-districts.geojson',
  congressional: '/data/sc-congressional-districts.geojson',
} as const;

export type ChamberType = keyof typeof GEOJSON_PATHS;

/**
 * State-specific bounds (approx bounding boxes)
 */
export const STATE_BOUNDS: Record<string, LatLngBoundsExpression> = {
  sc: SC_BOUNDS,
  nc: [[33.7529, -84.3219], [36.5881, -75.4001]],
  ga: [[30.3575, -85.6052], [35.0008, -80.8393]],
  fl: [[24.3963, -87.6349], [31.0010, -79.9743]],
  va: [[36.5408, -83.6753], [39.4660, -75.1663]],
};

/**
 * State-specific centers
 */
export const STATE_CENTERS: Record<string, LatLngExpression> = {
  sc: SC_CENTER,
  nc: [35.5923, -79.2629],
  ga: [32.6781, -83.2218],
  fl: [27.6987, -83.8048],
  va: [37.5034, -79.4210],
};

/**
 * Get GeoJSON file paths for any state's district boundaries
 * @param stateCode Two-letter state code (e.g., "sc", "nc")
 * @returns Object with paths for house, senate, and congressional districts
 */
export function getStateGeoJSONPaths(stateCode: string): Record<ChamberType, string> {
  const code = stateCode.toLowerCase();
  return {
    house: `/data/${code}-house-districts.geojson`,
    senate: `/data/${code}-senate-districts.geojson`,
    congressional: `/data/${code}-congressional-districts.geojson`,
  };
}

/**
 * Get bounds for a specific state
 * @param stateCode Two-letter state code
 * @returns Bounding box or SC bounds as fallback
 */
export function getStateBounds(stateCode: string): LatLngBoundsExpression {
  return STATE_BOUNDS[stateCode.toLowerCase()] ?? SC_BOUNDS;
}

/**
 * Get center coordinates for a specific state
 * @param stateCode Two-letter state code
 * @returns Center coordinates or SC center as fallback
 */
export function getStateCenter(stateCode: string): LatLngExpression {
  return STATE_CENTERS[stateCode.toLowerCase()] ?? SC_CENTER;
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
