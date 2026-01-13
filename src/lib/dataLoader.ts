/**
 * Progressive Data Loader
 *
 * Three-tier loading strategy to optimize mobile performance:
 * - Tier 1 (Critical): Load immediately on page load (~6.5KB)
 * - Tier 2 (On-Demand): Load after district lookup (~95KB)
 * - Tier 3 (Deferred): Lazy load on scroll with Intersection Observer (~30KB)
 *
 * This reduces initial payload from 517KB to 6.5KB (98.7% reduction)
 */

export interface DistrictResult {
  houseDistrict?: number;
  senateDistrict?: number;
  congressionalDistrict?: number;
  countyName?: string;
}

interface DataLoaderOptions {
  tier: 'critical' | 'onDemand' | 'deferred';
  cacheKey: string;
}

class DataLoader {
  private cache = new Map<string, any>();
  private pendingRequests = new Map<string, Promise<any>>();
  private basePath = typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
    ? '/sc-election-map-2026'
    : '';

  /**
   * Tier 1: Critical data loaded immediately
   * - election-dates.json: Timeline and key dates
   * - statewide-races.json: Governor, Lt Gov, etc.
   */
  async loadTier1() {
    return Promise.all([
      this.fetch('/data/election-dates.json', { tier: 'critical', cacheKey: 'election-dates' }),
      this.fetch('/data/statewide-races.json', { tier: 'critical', cacheKey: 'statewide-races' })
    ]);
  }

  /**
   * Tier 2: On-demand data loaded after district lookup
   * - candidates.json: State legislative races
   * - congress-candidates.json: Congressional races
   * - county-races.json: County offices
   */
  async loadTier2(districts: DistrictResult) {
    const loads: Promise<any>[] = [];

    if (districts.houseDistrict || districts.senateDistrict) {
      loads.push(this.fetch('/data/candidates.json', { tier: 'onDemand', cacheKey: 'candidates' }));
    }

    if (districts.congressionalDistrict) {
      loads.push(this.fetch('/data/congress-candidates.json', { tier: 'onDemand', cacheKey: 'congress-candidates' }));
    }

    if (districts.countyName) {
      loads.push(this.fetch('/data/county-races.json', { tier: 'onDemand', cacheKey: 'county-races' }));
    }

    return Promise.all(loads);
  }

  /**
   * Tier 3: Deferred data loaded on scroll via Intersection Observer
   * - judicial-races.json: Judicial elections
   * - school-board.json: School board races
   * - special-districts.json: Special district elections
   * - ballot-measures.json: Ballot propositions
   */
  async loadOnScroll(componentName: 'judicial' | 'school' | 'districts' | 'measures') {
    const dataMap: Record<string, string> = {
      'judicial': '/data/judicial-races.json',
      'school': '/data/school-board.json',
      'districts': '/data/special-districts.json',
      'measures': '/data/ballot-measures.json'
    };

    return this.fetch(dataMap[componentName], { tier: 'deferred', cacheKey: componentName });
  }

  /**
   * Generic fetch with caching and deduplication
   */
  private async fetch(url: string, options: DataLoaderOptions): Promise<any> {
    const { cacheKey } = options;

    // Return cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
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
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache() {
    this.cache.clear();
    this.pendingRequests.clear();
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
