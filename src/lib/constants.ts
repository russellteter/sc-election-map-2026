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
 * **IMPORTANT:** Only use BASE_PATH for data fetching with fetch().
 * Next.js Link and router.push AUTOMATICALLY add basePath from next.config.ts.
 *
 * @example
 * ```tsx
 * // CORRECT: Data fetching (fetch doesn't auto-add basePath)
 * fetch(`${BASE_PATH}/data/candidates.json`)
 *
 * // CORRECT: Navigation (Next.js adds basePath automatically)
 * <Link href="/voter-guide">
 * router.push('/sc')
 *
 * // WRONG: Double basePath!
 * <Link href={`${BASE_PATH}/voter-guide`}>  // Results in /sc-election-map-2026/sc-election-map-2026/voter-guide
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
 *
 * **NOTE:** These do NOT include BASE_PATH because Next.js Link and router.push
 * automatically add basePath. Use these directly with Next.js navigation.
 *
 * @example
 * ```tsx
 * <Link href={ROUTES.VOTER_GUIDE}>Voter Guide</Link>
 * router.push(ROUTES.HOME)
 * ```
 */
export const ROUTES = {
  HOME: '/',
  VOTER_GUIDE: '/voter-guide',
  TABLE_VIEW: '/table',
  OPPORTUNITIES: '/opportunities',
  RACE_DETAIL: (id: string | number) => `/race/${id}`,
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
  NAME: 'Blue Intelligence',
  DESCRIPTION: 'National Election Intelligence Platform - 50-state election intelligence demo for Democratic campaigns',
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
