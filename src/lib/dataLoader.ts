/**
 * Progressive Data Loader
 *
 * Three-tier loading strategy to optimize mobile performance:
 * - Tier 1 (Critical): Load immediately on page load (~6.5KB)
 * - Tier 2 (On-Demand): Load after district lookup (~95KB)
 * - Tier 3 (Deferred): Lazy load on scroll with Intersection Observer (~30KB)
 *
 * This reduces initial payload from 517KB to 6.5KB (98.7% reduction)
 *
 * Caching Strategy:
 * - Tier 1 (Critical): In-memory only (changes frequently, small size)
 * - Tier 2/3 (On-Demand/Deferred): localStorage persistence (larger, static data)
 * - Cache invalidation: Controlled by CACHE_VERSION in cacheUtils.ts
 */

import {
  getJsonFromCache,
  setJsonInCache,
  removeJsonFromCache,
} from './cacheUtils';

export interface DistrictResult {
  houseDistrict?: number;
  senateDistrict?: number;
  congressionalDistrict?: number;
  countyName?: string;
}

interface DataLoaderOptions {
  tier: 'critical' | 'onDemand' | 'deferred';
  cacheKey: string;
  persistable?: boolean; // Whether to cache in localStorage (default: false for critical, true for others)
}

class DataLoader {
  private cache = new Map<string, unknown>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private basePath = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/sc-election-map-2026'
    : '';

  /**
   * Tier 1: Critical data loaded immediately
   * - election-dates.json: Timeline and key dates
   * - statewide-races.json: Governor, Lt Gov, etc.
   *
   * Note: Tier 1 is NOT persisted to localStorage (small size, may change frequently)
   */
  async loadTier1() {
    return Promise.all([
      this.fetch('/data/election-dates.json', { tier: 'critical', cacheKey: 'election-dates', persistable: false }),
      this.fetch('/data/statewide-races.json', { tier: 'critical', cacheKey: 'statewide-races', persistable: false })
    ]);
  }

  /**
   * Tier 2: On-demand data loaded after district lookup
   * - candidates.json: State legislative races
   * - congress-candidates.json: Congressional races
   * - county-races.json: County offices
   *
   * Note: Tier 2 IS persisted to localStorage for instant repeat visits
   */
  async loadTier2(districts: DistrictResult) {
    const loads: Promise<unknown>[] = [];

    if (districts.houseDistrict || districts.senateDistrict) {
      loads.push(this.fetch('/data/candidates.json', { tier: 'onDemand', cacheKey: 'candidates', persistable: true }));
    }

    if (districts.congressionalDistrict) {
      loads.push(this.fetch('/data/congress-candidates.json', { tier: 'onDemand', cacheKey: 'congress-candidates', persistable: true }));
    }

    if (districts.countyName) {
      loads.push(this.fetch('/data/county-races.json', { tier: 'onDemand', cacheKey: 'county-races', persistable: true }));
    }

    return Promise.all(loads);
  }

  /**
   * Tier 3: Deferred data loaded on scroll via Intersection Observer
   * - judicial-races.json: Judicial elections
   * - school-board.json: School board races
   * - special-districts.json: Special district elections
   * - ballot-measures.json: Ballot propositions
   *
   * Note: Tier 3 IS persisted to localStorage for instant repeat visits
   */
  async loadOnScroll(componentName: 'judicial' | 'school' | 'districts' | 'measures') {
    const dataMap: Record<string, string> = {
      'judicial': '/data/judicial-races.json',
      'school': '/data/school-board.json',
      'districts': '/data/special-districts.json',
      'measures': '/data/ballot-measures.json'
    };

    return this.fetch(dataMap[componentName], { tier: 'deferred', cacheKey: componentName, persistable: true });
  }

  /**
   * Generic fetch with caching and deduplication
   *
   * Cache hierarchy (checked in order):
   * 1. In-memory cache (same session)
   * 2. localStorage cache (cross-session, if persistable)
   * 3. Network fetch (first visit or cache miss)
   */
  private async fetch(url: string, options: DataLoaderOptions): Promise<unknown> {
    const { cacheKey, persistable = false } = options;

    // Return in-memory cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check localStorage cache if persistable
    if (persistable) {
      try {
        const cached = getJsonFromCache<unknown>(cacheKey);
        if (cached !== null) {
          this.cache.set(cacheKey, cached);
          return cached;
        }
      } catch {
        // localStorage might throw in private browsing, continue to network
      }
    }

    // Return pending request if already in flight
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const fullUrl = `${this.basePath}${url}`;
    const request = fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        this.cache.set(cacheKey, data);
        this.pendingRequests.delete(cacheKey);

        // Persist to localStorage if enabled (async, don't wait)
        if (persistable) {
          try {
            setJsonInCache(cacheKey, data);
          } catch {
            // Ignore storage errors (quota, private browsing, etc.)
          }
        }

        return data;
      })
      .catch(error => {
        this.pendingRequests.delete(cacheKey);
        console.error(`Data loading error for ${url}:`, error);
        throw error;
      });

    this.pendingRequests.set(cacheKey, request);
    return request;
  }

  /**
   * Cache keys that are persisted to localStorage (Tier 2 + Tier 3)
   */
  private static PERSISTABLE_KEYS = [
    'candidates',
    'congress-candidates',
    'county-races',
    'judicial',
    'school',
    'districts',
    'measures'
  ];

  /**
   * Clear cache (useful for testing or forced refresh)
   * Clears both in-memory cache and localStorage persistence
   */
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();

    // Clear localStorage caches for persistable keys
    DataLoader.PERSISTABLE_KEYS.forEach(key => {
      try {
        removeJsonFromCache(key);
      } catch {
        // Ignore errors
      }
    });
  }

  /**
   * Check if data is cached
   */
  isCached(cacheKey: string): boolean {
    return this.cache.has(cacheKey);
  }
}

// Export singleton instance
export const dataLoader = new DataLoader();
