/**
 * Application-wide constants
 *
 * Centralizes configuration values used across the application
 * to avoid duplication and ensure consistency.
 */

/**
 * Base path for GitHub Pages deployment
 *
 * In production (GitHub Pages), the app is served from `/sc-election-map-2026/`.
 * In development, the app is served from the root `/`.
 *
 * This constant is used for:
 * - Asset paths (images, data files)
 * - Navigation links
 * - API endpoints
 *
 * **Important:** This only works in client-side code (browser).
 * For server-side code, use `process.env.NEXT_PUBLIC_BASE_PATH` or next.config.ts.
 *
 * @example
 * ```tsx
 * // Correct usage
 * fetch(`${BASE_PATH}/data/candidates.json`)
 * <Link href={`${BASE_PATH}/voter-guide`}>
 *
 * // Incorrect usage
 * <a href="/voter-guide"> // Will break in production
 * ```
 */
export const BASE_PATH =
  typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/sc-election-map-2026'
    : '';

/**
 * Data base URL for API/data fetches
 *
 * Alias for BASE_PATH to make data fetching code more readable.
 * Use this for all data file fetches.
 *
 * @example
 * ```tsx
 * const response = await fetch(`${DATA_BASE_URL}/data/candidates.json`);
 * ```
 */
export const DATA_BASE_URL = BASE_PATH;

/**
 * Application routes
 *
 * Centralized route constants to avoid hardcoded strings throughout the app.
 * Automatically includes BASE_PATH for production compatibility.
 */
export const ROUTES = {
  HOME: `${BASE_PATH}/`,
  VOTER_GUIDE: `${BASE_PATH}/voter-guide`,
  TABLE_VIEW: `${BASE_PATH}/table`,
  OPPORTUNITIES: `${BASE_PATH}/opportunities`,
  RACE_DETAIL: (id: string | number) => `${BASE_PATH}/race/${id}`,
} as const;

/**
 * Data file paths
 *
 * Centralized data file URLs to avoid duplication and typos.
 * All paths automatically include BASE_PATH and cache-busting.
 */
export const DATA_FILES = {
  // Election Map data
  CANDIDATES: `${DATA_BASE_URL}/data/candidates.json`,
  ELECTIONS: `${DATA_BASE_URL}/data/elections.json`,

  // Voter Guide data - Tier 1 (Critical)
  ELECTION_DATES: `${DATA_BASE_URL}/data/election-dates.json`,
  STATEWIDE_RACES: `${DATA_BASE_URL}/data/statewide-races.json`,

  // Voter Guide data - Tier 2 (On-Demand)
  CONGRESS_CANDIDATES: `${DATA_BASE_URL}/data/congress-candidates.json`,
  COUNTY_RACES: `${DATA_BASE_URL}/data/county-races.json`,

  // Voter Guide data - Tier 3 (Deferred)
  JUDICIAL_RACES: `${DATA_BASE_URL}/data/judicial-races.json`,
  SCHOOL_BOARD: `${DATA_BASE_URL}/data/school-board.json`,
  SPECIAL_DISTRICTS: `${DATA_BASE_URL}/data/special-districts.json`,
  BALLOT_MEASURES: `${DATA_BASE_URL}/data/ballot-measures.json`,

  // GeoJSON boundaries
  HOUSE_DISTRICTS_GEOJSON: `${DATA_BASE_URL}/maps/house-districts.geojson`,
  SENATE_DISTRICTS_GEOJSON: `${DATA_BASE_URL}/maps/senate-districts.geojson`,
  CONGRESSIONAL_DISTRICTS_GEOJSON: `${DATA_BASE_URL}/maps/congressional-districts.geojson`,

  // Voter Intelligence data (pre-computed from TargetSmart)
  HOUSE_ELECTORATE_PROFILES: `${DATA_BASE_URL}/data/voter-intelligence/house-profiles.json`,
  SENATE_ELECTORATE_PROFILES: `${DATA_BASE_URL}/data/voter-intelligence/senate-profiles.json`,
  MOBILIZATION_SCORES: `${DATA_BASE_URL}/data/voter-intelligence/mobilization-scores.json`,
  EARLY_VOTE_TRACKING: `${DATA_BASE_URL}/data/voter-intelligence/early-vote-tracking.json`,
  DONOR_SUMMARIES: `${DATA_BASE_URL}/data/voter-intelligence/donor-summaries.json`,
} as const;

/**
 * External API endpoints
 */
export const API_ENDPOINTS = {
  GEOAPIFY_GEOCODE: 'https://api.geoapify.com/v1/geocode/autocomplete',
  BALLOTREADY_BASE: 'https://api.civicengine.com',
  TARGETSMART_BASE: 'https://api.targetsmart.com',
} as const;

/**
 * Application metadata
 */
export const APP_METADATA = {
  NAME: 'SC Election Map 2026',
  DESCRIPTION: 'Interactive SC election map and comprehensive voter guide',
  VERSION: '1.0.0',
  GITHUB_URL: 'https://github.com/russellteter/sc-election-map-2026',
  LIVE_URL: 'https://russellteter.github.io/sc-election-map-2026/',
} as const;

/**
 * Performance configuration
 */
export const PERFORMANCE = {
  /** Debounce delay for address autocomplete (ms) */
  ADDRESS_DEBOUNCE_MS: 300,

  /** Intersection Observer root margin for lazy loading */
  LAZY_LOAD_ROOT_MARGIN: '500px',

  /** Cache-busting strategy */
  USE_CACHE_BUSTING: true,
} as const;

/**
 * Mobile optimization breakpoints (matches Tailwind defaults)
 */
export const BREAKPOINTS = {
  XS: 375,   // iPhone SE
  SM: 640,   // Small tablets
  MD: 768,   // Tablets
  LG: 1024,  // Laptops
  XL: 1280,  // Desktops
  '2XL': 1536, // Large desktops
} as const;

/**
 * WCAG accessibility targets
 */
export const ACCESSIBILITY = {
  /** Minimum touch target size (WCAG AA) */
  MIN_TOUCH_TARGET_PX: 44,

  /** Color contrast ratios */
  CONTRAST_RATIOS: {
    TEXT: 4.5,      // WCAG AA for normal text
    LARGE_TEXT: 3,  // WCAG AA for large text (18pt+)
    UI: 3,          // WCAG AA for UI components
  },
} as const;
