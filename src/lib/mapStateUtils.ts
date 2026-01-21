/**
 * Map State URL Serialization Utilities
 *
 * Provides functions for serializing and parsing map state to/from URL parameters.
 * Enables deep-linking to specific map views (zoom level, center, selected district).
 */

/**
 * Chamber types for navigation maps
 */
export type ChamberType = 'house' | 'senate' | 'congressional';

/**
 * Map state that can be persisted to URL
 */
export interface MapState {
  /** Latitude of map center */
  lat?: number;
  /** Longitude of map center */
  lng?: number;
  /** Zoom level */
  zoom?: number;
  /** Selected chamber */
  chamber?: ChamberType;
  /** Selected district number */
  district?: number;
}

/**
 * Default map state values (SC-centric defaults)
 */
export const DEFAULT_MAP_STATE: Required<Pick<MapState, 'lat' | 'lng' | 'zoom' | 'chamber'>> = {
  lat: 33.8361,
  lng: -80.9450,
  zoom: 7,
  chamber: 'house',
};

/**
 * URL parameter keys for map state
 */
const URL_PARAMS = {
  lat: 'lat',
  lng: 'lng',
  zoom: 'zoom',
  chamber: 'chamber',
  district: 'district',
} as const;

/**
 * Valid chamber values for validation
 */
const VALID_CHAMBERS: ChamberType[] = ['house', 'senate', 'congressional'];

/**
 * Round a number to specified decimal places
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Validate latitude value
 */
function isValidLat(value: number): boolean {
  return !isNaN(value) && value >= -90 && value <= 90;
}

/**
 * Validate longitude value
 */
function isValidLng(value: number): boolean {
  return !isNaN(value) && value >= -180 && value <= 180;
}

/**
 * Validate zoom value
 */
function isValidZoom(value: number): boolean {
  return !isNaN(value) && value >= 1 && value <= 20;
}

/**
 * Validate chamber value
 */
function isValidChamber(value: string): value is ChamberType {
  return VALID_CHAMBERS.includes(value as ChamberType);
}

/**
 * Validate district value
 */
function isValidDistrict(value: number): boolean {
  return !isNaN(value) && Number.isInteger(value) && value > 0 && value <= 999;
}

/**
 * Serialize map state to URL search params
 *
 * Only includes non-null/non-default values to keep URLs clean.
 * Rounds lat/lng to 4 decimal places (~11m precision).
 *
 * @param state - Map state to serialize
 * @returns URLSearchParams with map state
 *
 * @example
 * ```ts
 * const params = serializeMapState({ lat: 33.8361, lng: -81.1637, zoom: 10 });
 * // Returns: URLSearchParams { lat: '33.8361', lng: '-81.1637', zoom: '10' }
 * ```
 */
export function serializeMapState(state: MapState): URLSearchParams {
  const params = new URLSearchParams();

  // Only include lat/lng if both are present and different from defaults
  if (
    state.lat !== undefined &&
    state.lng !== undefined &&
    (roundTo(state.lat, 4) !== DEFAULT_MAP_STATE.lat ||
      roundTo(state.lng, 4) !== DEFAULT_MAP_STATE.lng)
  ) {
    params.set(URL_PARAMS.lat, String(roundTo(state.lat, 4)));
    params.set(URL_PARAMS.lng, String(roundTo(state.lng, 4)));
  }

  // Only include zoom if different from default
  if (state.zoom !== undefined && state.zoom !== DEFAULT_MAP_STATE.zoom) {
    params.set(URL_PARAMS.zoom, String(Math.round(state.zoom)));
  }

  // Only include chamber if different from default
  if (state.chamber !== undefined && state.chamber !== DEFAULT_MAP_STATE.chamber) {
    params.set(URL_PARAMS.chamber, state.chamber);
  }

  // Always include district if present (no default)
  if (state.district !== undefined) {
    params.set(URL_PARAMS.district, String(state.district));
  }

  return params;
}

/**
 * Parse map state from URL search params
 *
 * Validates all parameters and returns defaults for invalid/missing values.
 *
 * @param params - URLSearchParams to parse
 * @returns Parsed map state with defaults for missing values
 *
 * @example
 * ```ts
 * const params = new URLSearchParams('?lat=33.8361&lng=-81.1637&zoom=10');
 * const state = parseMapState(params);
 * // Returns: { lat: 33.8361, lng: -81.1637, zoom: 10, chamber: 'house' }
 * ```
 */
export function parseMapState(params: URLSearchParams): MapState {
  const state: MapState = {};

  // Parse lat
  const latStr = params.get(URL_PARAMS.lat);
  if (latStr) {
    const lat = parseFloat(latStr);
    if (isValidLat(lat)) {
      state.lat = lat;
    }
  }

  // Parse lng
  const lngStr = params.get(URL_PARAMS.lng);
  if (lngStr) {
    const lng = parseFloat(lngStr);
    if (isValidLng(lng)) {
      state.lng = lng;
    }
  }

  // Parse zoom
  const zoomStr = params.get(URL_PARAMS.zoom);
  if (zoomStr) {
    const zoom = parseInt(zoomStr, 10);
    if (isValidZoom(zoom)) {
      state.zoom = zoom;
    }
  }

  // Parse chamber
  const chamberStr = params.get(URL_PARAMS.chamber);
  if (chamberStr && isValidChamber(chamberStr)) {
    state.chamber = chamberStr;
  }

  // Parse district
  const districtStr = params.get(URL_PARAMS.district);
  if (districtStr) {
    const district = parseInt(districtStr, 10);
    if (isValidDistrict(district)) {
      state.district = district;
    }
  }

  return state;
}

/**
 * Merge map state with defaults, returning a complete state object
 *
 * @param state - Partial map state
 * @returns Complete map state with defaults filled in
 */
export function mergeWithDefaults(state: MapState): Required<Omit<MapState, 'district'>> & Pick<MapState, 'district'> {
  return {
    lat: state.lat ?? DEFAULT_MAP_STATE.lat,
    lng: state.lng ?? DEFAULT_MAP_STATE.lng,
    zoom: state.zoom ?? DEFAULT_MAP_STATE.zoom,
    chamber: state.chamber ?? DEFAULT_MAP_STATE.chamber,
    district: state.district,
  };
}

/**
 * Build a URL string from current path and map state
 *
 * Preserves existing non-map URL params.
 *
 * @param pathname - Current pathname
 * @param mapState - Map state to add
 * @param existingParams - Existing URL params to preserve
 * @returns Complete URL string
 */
export function buildMapUrl(
  pathname: string,
  mapState: MapState,
  existingParams?: URLSearchParams
): string {
  const mapParams = serializeMapState(mapState);

  // Merge with existing params (map params take precedence)
  const finalParams = new URLSearchParams(existingParams);

  // Remove any existing map params first
  Object.values(URL_PARAMS).forEach(key => finalParams.delete(key));

  // Add map params
  mapParams.forEach((value, key) => {
    finalParams.set(key, value);
  });

  const queryString = finalParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
