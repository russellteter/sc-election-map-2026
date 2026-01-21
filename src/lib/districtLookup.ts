/**
 * District Lookup Module for SC Election Map Voter Guide (v2)
 *
 * Uses Turf.js point-in-polygon with bundled GeoJSON boundaries
 * Works offline after initial load, fully debuggable
 *
 * Caching Strategy:
 * - GeoJSON boundaries (~2MB) are cached in IndexedDB for cross-session persistence
 * - First visit: Network fetch, then cache to IndexedDB
 * - Subsequent visits: Load from IndexedDB (instant)
 * - Cache invalidation: Controlled by CACHE_VERSION in cacheUtils.ts
 */

import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson';
import {
  getGeoJsonFromCache,
  setGeoJsonInCache,
  checkCacheVersion,
} from './cacheUtils';

// Debug mode
const DEBUG = typeof window !== 'undefined' && localStorage?.getItem('voter-guide-debug') === 'true';

function log(message: string, data?: unknown) {
  if (DEBUG) console.log(`[DistrictLookup] ${message}`, data || '');
}

// Initialize cache version check on module load (browser only)
if (typeof window !== 'undefined') {
  checkCacheVersion().catch((err) => log('Cache version check failed', err));
}

export interface DistrictResult {
  success: boolean;
  houseDistrict: number | null;
  senateDistrict: number | null;
  error?: string;
}

export interface AllDistrictsResult extends DistrictResult {
  congressionalDistrict: number | null;
}

// Cached GeoJSON data
let houseDistricts: FeatureCollection | null = null;
let senateDistricts: FeatureCollection | null = null;
let congressionalDistricts: FeatureCollection | null = null;
let loadingPromise: Promise<void> | null = null;
let congressionalLoadingPromise: Promise<void> | null = null;

/**
 * Load GeoJSON boundary files (lazy load, cached)
 *
 * Loading order:
 * 1. Check in-memory cache (same session)
 * 2. Check IndexedDB cache (cross-session)
 * 3. Network fetch (first visit or cache miss)
 */
async function loadBoundaries(): Promise<void> {
  // Already loaded in memory
  if (houseDistricts && senateDistricts) {
    log('Using in-memory cached boundaries');
    return;
  }

  // Already loading - wait for it
  if (loadingPromise) {
    log('Waiting for boundaries to load...');
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    log('Loading district boundaries...');

    // Try IndexedDB cache first
    try {
      const cachedHouse = await getGeoJsonFromCache('sc-house-districts');
      const cachedSenate = await getGeoJsonFromCache('sc-senate-districts');

      if (cachedHouse && cachedSenate) {
        houseDistricts = cachedHouse;
        senateDistricts = cachedSenate;
        log('Loaded boundaries from IndexedDB cache', {
          houseFeatures: houseDistricts?.features?.length,
          senateFeatures: senateDistricts?.features?.length
        });
        return;
      }
    } catch (error) {
      log('IndexedDB cache check failed, falling back to network', error);
    }

    // Network fetch
    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    try {
      log('Fetching boundaries from network...');
      const [houseResponse, senateResponse] = await Promise.all([
        fetch(`${basePath}/data/sc-house-districts.geojson`),
        fetch(`${basePath}/data/sc-senate-districts.geojson`)
      ]);

      if (!houseResponse.ok || !senateResponse.ok) {
        throw new Error('Failed to load district boundaries');
      }

      houseDistricts = await houseResponse.json();
      senateDistricts = await senateResponse.json();

      log('Boundaries loaded from network', {
        houseFeatures: houseDistricts?.features?.length,
        senateFeatures: senateDistricts?.features?.length
      });

      // Cache to IndexedDB for future sessions (async, don't await)
      Promise.all([
        setGeoJsonInCache('sc-house-districts', houseDistricts!),
        setGeoJsonInCache('sc-senate-districts', senateDistricts!)
      ])
        .then(() => log('Cached boundaries to IndexedDB'))
        .catch((err) => log('Failed to cache boundaries to IndexedDB', err));

    } catch (error) {
      log('Error loading boundaries:', error);
      loadingPromise = null; // Allow retry
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Find SC House and Senate districts for a coordinate
 */
export async function findDistricts(lat: number, lon: number): Promise<DistrictResult> {
  log('Finding districts for:', { lat, lon });

  try {
    await loadBoundaries();
  } catch {
    return {
      success: false,
      houseDistrict: null,
      senateDistrict: null,
      error: 'Unable to load district boundaries. Please refresh the page and try again.'
    };
  }

  if (!houseDistricts || !senateDistricts) {
    return {
      success: false,
      houseDistrict: null,
      senateDistrict: null,
      error: 'District boundary data not available.'
    };
  }

  const pt = point([lon, lat]);

  // Find House district
  let houseDistrict: number | null = null;
  for (const feature of houseDistricts.features) {
    if (isPolygonFeature(feature) && booleanPointInPolygon(pt, feature)) {
      // SLDLST is the state legislative district lower (House) - e.g., "070"
      const districtStr = feature.properties?.SLDLST;
      if (districtStr) {
        houseDistrict = parseInt(districtStr, 10);
        log('Found House district:', { district: houseDistrict, raw: districtStr });
      }
      break;
    }
  }

  // Find Senate district
  let senateDistrict: number | null = null;
  for (const feature of senateDistricts.features) {
    if (isPolygonFeature(feature) && booleanPointInPolygon(pt, feature)) {
      // SLDUST is the state legislative district upper (Senate) - e.g., "030"
      const districtStr = feature.properties?.SLDUST;
      if (districtStr) {
        senateDistrict = parseInt(districtStr, 10);
        log('Found Senate district:', { district: senateDistrict, raw: districtStr });
      }
      break;
    }
  }

  if (houseDistrict === null && senateDistrict === null) {
    log('No districts found for coordinates');
    return {
      success: false,
      houseDistrict: null,
      senateDistrict: null,
      error: 'Could not determine your districts. The coordinates may be outside South Carolina legislative boundaries.'
    };
  }

  log('Districts found:', { houseDistrict, senateDistrict });

  return {
    success: true,
    houseDistrict,
    senateDistrict
  };
}

/**
 * Type guard to check if a feature is a Polygon or MultiPolygon
 */
function isPolygonFeature(feature: Feature): feature is Feature<Polygon | MultiPolygon> {
  return feature.geometry?.type === 'Polygon' || feature.geometry?.type === 'MultiPolygon';
}

/**
 * Load Congressional district boundaries (lazy load, cached)
 */
async function loadCongressionalBoundaries(): Promise<void> {
  // Already loaded in memory
  if (congressionalDistricts) {
    log('Using in-memory cached Congressional boundaries');
    return;
  }

  // Already loading - wait for it
  if (congressionalLoadingPromise) {
    log('Waiting for Congressional boundaries to load...');
    return congressionalLoadingPromise;
  }

  // Start loading
  congressionalLoadingPromise = (async () => {
    log('Loading Congressional district boundaries...');

    // Try IndexedDB cache first
    try {
      const cached = await getGeoJsonFromCache('sc-congressional-districts');
      if (cached) {
        congressionalDistricts = cached;
        log('Loaded Congressional boundaries from IndexedDB cache', {
          features: congressionalDistricts?.features?.length
        });
        return;
      }
    } catch (error) {
      log('IndexedDB cache check failed for Congressional, falling back to network', error);
    }

    // Network fetch
    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    try {
      log('Fetching Congressional boundaries from network...');
      const response = await fetch(`${basePath}/data/sc-congressional-districts.geojson`);

      if (!response.ok) {
        throw new Error('Failed to load Congressional district boundaries');
      }

      congressionalDistricts = await response.json();

      log('Congressional boundaries loaded from network', {
        features: congressionalDistricts?.features?.length
      });

      // Cache to IndexedDB (async, don't await)
      setGeoJsonInCache('sc-congressional-districts', congressionalDistricts!)
        .then(() => log('Cached Congressional boundaries to IndexedDB'))
        .catch((err) => log('Failed to cache Congressional boundaries', err));

    } catch (error) {
      log('Error loading Congressional boundaries:', error);
      congressionalLoadingPromise = null;
      throw error;
    }
  })();

  return congressionalLoadingPromise;
}

/**
 * Find all districts (House, Senate, and Congressional) for a coordinate
 */
export async function findAllDistricts(lat: number, lon: number): Promise<AllDistrictsResult> {
  log('Finding all districts for:', { lat, lon });

  // Load all boundaries in parallel
  try {
    await Promise.all([
      loadBoundaries(),
      loadCongressionalBoundaries()
    ]);
  } catch {
    return {
      success: false,
      houseDistrict: null,
      senateDistrict: null,
      congressionalDistrict: null,
      error: 'Unable to load district boundaries. Please refresh the page and try again.'
    };
  }

  if (!houseDistricts || !senateDistricts) {
    return {
      success: false,
      houseDistrict: null,
      senateDistrict: null,
      congressionalDistrict: null,
      error: 'District boundary data not available.'
    };
  }

  const pt = point([lon, lat]);

  // Find House district
  let houseDistrict: number | null = null;
  for (const feature of houseDistricts.features) {
    if (isPolygonFeature(feature) && booleanPointInPolygon(pt, feature)) {
      const districtStr = feature.properties?.SLDLST;
      if (districtStr) {
        houseDistrict = parseInt(districtStr, 10);
        log('Found House district:', { district: houseDistrict, raw: districtStr });
      }
      break;
    }
  }

  // Find Senate district
  let senateDistrict: number | null = null;
  for (const feature of senateDistricts.features) {
    if (isPolygonFeature(feature) && booleanPointInPolygon(pt, feature)) {
      const districtStr = feature.properties?.SLDUST;
      if (districtStr) {
        senateDistrict = parseInt(districtStr, 10);
        log('Found Senate district:', { district: senateDistrict, raw: districtStr });
      }
      break;
    }
  }

  // Find Congressional district
  let congressionalDistrict: number | null = null;
  if (congressionalDistricts) {
    for (const feature of congressionalDistricts.features) {
      if (isPolygonFeature(feature) && booleanPointInPolygon(pt, feature)) {
        // CD118FP is zero-padded (e.g., "01", "06")
        const districtStr = feature.properties?.CD118FP;
        if (districtStr) {
          congressionalDistrict = parseInt(districtStr, 10);
          log('Found Congressional district:', { district: congressionalDistrict, raw: districtStr });
        }
        break;
      }
    }
  }

  if (houseDistrict === null && senateDistrict === null && congressionalDistrict === null) {
    log('No districts found for coordinates');
    return {
      success: false,
      houseDistrict: null,
      senateDistrict: null,
      congressionalDistrict: null,
      error: 'Could not determine your districts. The coordinates may be outside South Carolina legislative boundaries.'
    };
  }

  log('All districts found:', { houseDistrict, senateDistrict, congressionalDistrict });

  return {
    success: true,
    houseDistrict,
    senateDistrict,
    congressionalDistrict
  };
}

/**
 * Preload district boundaries (call on page load for faster lookups)
 */
export async function preloadBoundaries(): Promise<boolean> {
  try {
    await loadBoundaries();
    return true;
  } catch {
    return false;
  }
}

/**
 * Preload all boundaries including Congressional
 */
export async function preloadAllBoundaries(): Promise<boolean> {
  try {
    await Promise.all([
      loadBoundaries(),
      loadCongressionalBoundaries()
    ]);
    return true;
  } catch {
    return false;
  }
}
