/**
 * TargetSmart API Client
 *
 * Client for the TargetSmart VoterBase API.
 * Provides access to voter registration, demographics, and political modeling data.
 *
 * API Documentation: https://docs.targetsmart.com/developers/tsapis/v2/index.html
 */

import type {
  VoterRegistrationResult,
  VoterRegistrationRequest,
  VoterSuggestResult,
  VoterSuggestResponse,
  EnhancedVoterData,
  DataEnhanceRequest,
  DistrictLookupResult,
  DistrictElectorateProfile,
  DistrictPartisanComposition,
  DistrictTurnoutProfile,
  DistrictDemographicProfile,
  MobilizationUniverse,
  EarlyVoteTracking,
  DistrictDonorSummary,
  TargetSmartError,
} from '@/types/targetsmart';

// =============================================================================
// Configuration
// =============================================================================

const TARGETSMART_BASE_URL = 'https://api.targetsmart.com';
const API_KEY = process.env.NEXT_PUBLIC_TARGETSMART_KEY || '';

// Cache configuration
const CACHE_TTL = {
  voterRegistration: 60 * 60 * 1000, // 1 hour
  voterData: 24 * 60 * 60 * 1000, // 24 hours
  districtProfile: 7 * 24 * 60 * 60 * 1000, // 7 days (aggregated data)
  earlyVote: 60 * 60 * 1000, // 1 hour (during election season)
};

// Rate limiting
const RATE_LIMIT_MS = 100;
let lastRequestTime = 0;

// Request timeout
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// =============================================================================
// Cache Implementation
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class TargetSmartCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

const cache = new TargetSmartCache();

// =============================================================================
// API Client Core
// =============================================================================

/**
 * Make a rate-limited request to the TargetSmart API with timeout and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options?: {
    method?: 'GET' | 'POST';
    params?: Record<string, string | number | boolean | undefined>;
    body?: Record<string, unknown>;
  }
): Promise<T> {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();

  // Build URL
  const url = new URL(`${TARGETSMART_BASE_URL}${endpoint}`);
  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Build request
    const requestOptions: RequestInit = {
      method: options?.method || 'GET',
      headers: {
        'x-api-key': API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    };

    if (options?.body) {
      requestOptions.body = JSON.stringify(options.body);
    }

    // Make request
    const response = await fetch(url.toString(), requestOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Partial<TargetSmartError>;
      throw new Error(
        errorData.error?.message || `TargetSmart API error: ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[TargetSmart] Request timeout for ${endpoint}`);
        throw new Error('TargetSmart API request timed out');
      }
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        console.error(`[TargetSmart] Network error for ${endpoint}:`, error.message);
        throw new Error('TargetSmart API unreachable - network error');
      }
    }

    // Re-throw other errors
    throw error;
  }
}

// =============================================================================
// Voter Registration API
// =============================================================================

/**
 * Check voter registration status
 */
export async function checkVoterRegistration(
  request: VoterRegistrationRequest
): Promise<VoterRegistrationResult> {
  const cacheKey = `registration:${JSON.stringify(request)}`;
  const cached = cache.get<VoterRegistrationResult>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<VoterRegistrationResult>(
    '/voter/voter-registration-check',
    {
      method: 'POST',
      body: {
        first_name: request.first_name,
        last_name: request.last_name,
        street_address: request.street_address,
        city: request.city,
        state: request.state,
        zip: request.zip,
        date_of_birth: request.date_of_birth,
      },
    }
  );

  cache.set(cacheKey, response, CACHE_TTL.voterRegistration);
  return response;
}

/**
 * Quick voter lookup suggestion (autocomplete-style)
 */
export async function suggestVoters(
  query: string,
  state: string = 'SC',
  limit: number = 5
): Promise<VoterSuggestResult[]> {
  const cacheKey = `suggest:${query}:${state}:${limit}`;
  const cached = cache.get<VoterSuggestResult[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<VoterSuggestResponse>('/voter/voter-suggest', {
    params: {
      query,
      state,
      limit,
    },
  });

  cache.set(cacheKey, response.suggestions, 5 * 60 * 1000); // 5 min cache
  return response.suggestions;
}

// =============================================================================
// Data Enhancement API
// =============================================================================

/**
 * Enhance voter data with demographics and modeling scores
 */
export async function enhanceVoterData(
  request: DataEnhanceRequest
): Promise<EnhancedVoterData | null> {
  const cacheKey = `enhance:${JSON.stringify(request)}`;
  const cached = cache.get<EnhancedVoterData>(cacheKey);
  if (cached) return cached;

  try {
    const response = await apiRequest<EnhancedVoterData>('/person/data-enhance', {
      method: 'POST',
      body: request as unknown as Record<string, unknown>,
    });

    cache.set(cacheKey, response, CACHE_TTL.voterData);
    return response;
  } catch (error) {
    console.error('Failed to enhance voter data:', error);
    return null;
  }
}

// =============================================================================
// District Service API
// =============================================================================

/**
 * Get district information for an address
 */
export async function getDistrictsByAddress(
  address: string,
  city: string,
  state: string = 'SC',
  zip?: string
): Promise<DistrictLookupResult | null> {
  const cacheKey = `district:${address}:${city}:${state}:${zip}`;
  const cached = cache.get<DistrictLookupResult>(cacheKey);
  if (cached) return cached;

  try {
    const response = await apiRequest<DistrictLookupResult>('/service/district', {
      params: {
        street_address: address,
        city,
        state,
        zip,
      },
    });

    cache.set(cacheKey, response, 24 * 60 * 60 * 1000); // 24 hour cache
    return response;
  } catch (error) {
    console.error('Failed to get districts:', error);
    return null;
  }
}

/**
 * Get district information by coordinates
 */
export async function getDistrictsByCoordinates(
  latitude: number,
  longitude: number
): Promise<DistrictLookupResult | null> {
  const cacheKey = `district:${latitude}:${longitude}`;
  const cached = cache.get<DistrictLookupResult>(cacheKey);
  if (cached) return cached;

  try {
    const response = await apiRequest<DistrictLookupResult>('/service/district', {
      params: {
        latitude,
        longitude,
      },
    });

    cache.set(cacheKey, response, 24 * 60 * 60 * 1000);
    return response;
  } catch (error) {
    console.error('Failed to get districts by coordinates:', error);
    return null;
  }
}

// =============================================================================
// District Profile Functions (Aggregated Data)
// =============================================================================

/**
 * Load pre-computed district electorate profile from static JSON
 *
 * Note: In production, this would load from pre-computed JSON files
 * generated by a backend process that aggregates TargetSmart data.
 * Direct API calls for aggregate data would be too expensive.
 */
export async function getDistrictElectorateProfile(
  chamber: 'house' | 'senate',
  districtNumber: number
): Promise<DistrictElectorateProfile | null> {
  const cacheKey = `profile:${chamber}:${districtNumber}`;
  const cached = cache.get<DistrictElectorateProfile>(cacheKey);
  if (cached) return cached;

  try {
    // Load from pre-computed static files
    const basePath =
      typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/sc-election-map-2026'
        : '';

    const response = await fetch(
      `${basePath}/data/voter-intelligence/${chamber}-profiles.json`
    );

    if (!response.ok) {
      // Return mock data for development if file doesn't exist
      return generateMockProfile(chamber, districtNumber);
    }

    const data = await response.json();
    const profile = data[districtNumber.toString()];

    if (profile) {
      cache.set(cacheKey, profile, CACHE_TTL.districtProfile);
    }

    return profile || null;
  } catch (error) {
    console.error('Failed to load district profile:', error);
    // Return mock data for development
    return generateMockProfile(chamber, districtNumber);
  }
}

/**
 * Generate mock district profile for development/demo purposes
 */
function generateMockProfile(
  chamber: 'house' | 'senate',
  districtNumber: number
): DistrictElectorateProfile {
  // Use district number to seed somewhat consistent random data
  const seed = districtNumber * (chamber === 'house' ? 1 : 1000);
  const rand = (min: number, max: number) =>
    min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);

  const totalVoters = Math.floor(rand(15000, 40000));
  const demPct = rand(0.25, 0.55);
  const repPct = rand(0.35, 0.65);
  const otherPct = 1 - demPct - repPct;

  const partisanComposition: DistrictPartisanComposition = {
    totalRegistered: totalVoters,
    partyRegistration: {
      democratic: Math.floor(totalVoters * demPct * 0.4),
      republican: Math.floor(totalVoters * repPct * 0.5),
      independent: Math.floor(totalVoters * 0.25),
      other: Math.floor(totalVoters * 0.02),
      noParty: Math.floor(totalVoters * otherPct * 0.4),
    },
    partisanDistribution: {
      strongDem: Math.floor(totalVoters * demPct * 0.3),
      leanDem: Math.floor(totalVoters * demPct * 0.25),
      swing: Math.floor(totalVoters * 0.2),
      leanRep: Math.floor(totalVoters * repPct * 0.25),
      strongRep: Math.floor(totalVoters * repPct * 0.35),
    },
    averagePartisanScore: Math.floor(demPct * 100),
  };

  const turnoutProfile: DistrictTurnoutProfile = {
    turnoutDistribution: {
      high: Math.floor(totalVoters * 0.25),
      medium: Math.floor(totalVoters * 0.35),
      low: Math.floor(totalVoters * 0.25),
      veryLow: Math.floor(totalVoters * 0.15),
    },
    averageTurnout: {
      general: rand(55, 75),
      primary: rand(15, 35),
      midterm: rand(40, 60),
      presidential: rand(65, 80),
    },
    historicalTurnout: [
      { year: 2024, type: 'general', turnoutRate: rand(60, 75) },
      { year: 2022, type: 'general', turnoutRate: rand(45, 60) },
      { year: 2020, type: 'general', turnoutRate: rand(65, 80) },
    ],
  };

  const demographics: DistrictDemographicProfile = {
    ageDistribution: {
      age18_29: Math.floor(totalVoters * 0.18),
      age30_44: Math.floor(totalVoters * 0.25),
      age45_64: Math.floor(totalVoters * 0.32),
      age65Plus: Math.floor(totalVoters * 0.25),
    },
    genderDistribution: {
      male: Math.floor(totalVoters * 0.47),
      female: Math.floor(totalVoters * 0.52),
      unknown: Math.floor(totalVoters * 0.01),
    },
    ethnicityDistribution: {
      white: Math.floor(totalVoters * rand(0.55, 0.75)),
      black: Math.floor(totalVoters * rand(0.15, 0.35)),
      hispanic: Math.floor(totalVoters * rand(0.03, 0.08)),
      asian: Math.floor(totalVoters * rand(0.01, 0.04)),
      other: Math.floor(totalVoters * rand(0.02, 0.05)),
    },
    educationDistribution: {
      highSchoolOrLess: Math.floor(totalVoters * 0.35),
      someCollege: Math.floor(totalVoters * 0.30),
      bachelors: Math.floor(totalVoters * 0.22),
      graduate: Math.floor(totalVoters * 0.13),
    },
  };

  // Low-turnout Dems = lean/strong Dem with low/very low turnout
  const lowTurnoutDems = Math.floor(
    (partisanComposition.partisanDistribution.strongDem +
      partisanComposition.partisanDistribution.leanDem) *
      (turnoutProfile.turnoutDistribution.low +
        turnoutProfile.turnoutDistribution.veryLow) /
      totalVoters
  );

  const mobilizationUniverse: MobilizationUniverse = {
    lowTurnoutDems: {
      count: lowTurnoutDems,
      percentage: (lowTurnoutDems / totalVoters) * 100,
      potential: lowTurnoutDems > 2000 ? 'high' : lowTurnoutDems > 1000 ? 'medium' : 'low',
    },
    swingVoters: {
      count: partisanComposition.partisanDistribution.swing,
      percentage:
        (partisanComposition.partisanDistribution.swing / totalVoters) * 100,
    },
    persuadable: {
      leanDem: partisanComposition.partisanDistribution.leanDem,
      leanRep: partisanComposition.partisanDistribution.leanRep,
      total:
        partisanComposition.partisanDistribution.leanDem +
        partisanComposition.partisanDistribution.leanRep,
    },
    mobilizationPriority: Math.min(
      100,
      Math.floor((lowTurnoutDems / totalVoters) * 500)
    ),
    estimatedVotePickup: Math.floor(lowTurnoutDems * 0.3),
  };

  return {
    chamber,
    districtNumber,
    partisanComposition,
    turnoutProfile,
    demographics,
    mobilizationUniverse,
    dataAsOf: new Date().toISOString(),
    sampleSize: Math.floor(totalVoters * 0.8),
    confidenceLevel: 'medium',
  };
}

/**
 * Get mobilization score for a district
 */
export async function getMobilizationScore(
  chamber: 'house' | 'senate',
  districtNumber: number
): Promise<number> {
  const profile = await getDistrictElectorateProfile(chamber, districtNumber);
  return profile?.mobilizationUniverse.mobilizationPriority ?? 0;
}

/**
 * Get all districts with high mobilization potential
 */
export async function getHighMobilizationDistricts(
  chamber: 'house' | 'senate',
  threshold: number = 50
): Promise<{ districtNumber: number; score: number }[]> {
  const results: { districtNumber: number; score: number }[] = [];
  const maxDistricts = chamber === 'house' ? 124 : 46;

  for (let i = 1; i <= maxDistricts; i++) {
    const score = await getMobilizationScore(chamber, i);
    if (score >= threshold) {
      results.push({ districtNumber: i, score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// =============================================================================
// Early Vote Tracking (Election Season Only)
// =============================================================================

/**
 * Get early vote tracking data for a district
 *
 * Note: This data is only available during election season
 * and would be updated daily from TargetSmart's tracking.
 */
export async function getEarlyVoteTracking(
  chamber: 'house' | 'senate',
  districtNumber: number
): Promise<EarlyVoteTracking | null> {
  const cacheKey = `earlyvote:${chamber}:${districtNumber}`;
  const cached = cache.get<EarlyVoteTracking>(cacheKey);
  if (cached) return cached;

  try {
    const basePath =
      typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/sc-election-map-2026'
        : '';

    const response = await fetch(
      `${basePath}/data/voter-intelligence/early-vote-tracking.json`
    );

    if (!response.ok) {
      return null; // Not available outside election season
    }

    const data = await response.json();
    const key = `${chamber}-${districtNumber}`;
    const tracking = data[key];

    if (tracking) {
      cache.set(cacheKey, tracking, CACHE_TTL.earlyVote);
    }

    return tracking || null;
  } catch {
    return null;
  }
}

// =============================================================================
// Donor/Contribution Intelligence
// =============================================================================

/**
 * Get donor summary for a district
 *
 * Note: This would use ContributorBase data from TargetSmart
 */
export async function getDistrictDonorSummary(
  chamber: 'house' | 'senate',
  districtNumber: number
): Promise<DistrictDonorSummary | null> {
  const cacheKey = `donors:${chamber}:${districtNumber}`;
  const cached = cache.get<DistrictDonorSummary>(cacheKey);
  if (cached) return cached;

  try {
    const basePath =
      typeof window !== 'undefined' && process.env.NODE_ENV === 'production'
        ? '/sc-election-map-2026'
        : '';

    const response = await fetch(
      `${basePath}/data/voter-intelligence/donor-summaries.json`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const key = `${chamber}-${districtNumber}`;
    const summary = data[key];

    if (summary) {
      cache.set(cacheKey, summary, 7 * 24 * 60 * 60 * 1000); // 7 day cache
    }

    return summary || null;
  } catch {
    return null;
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if the API is configured
 */
export function isConfigured(): boolean {
  return Boolean(API_KEY);
}

/**
 * Test API connectivity
 * Makes a minimal API call to verify the connection is working
 */
export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  if (!API_KEY) {
    return { ok: false, error: 'API key not configured' };
  }

  try {
    // Make a minimal API call to verify connectivity
    // Use district lookup with a known SC address
    await apiRequest<DistrictLookupResult>('/service/district', {
      params: {
        street_address: '1100 Gervais St',
        city: 'Columbia',
        state: 'SC',
        zip: '29201',
      },
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

// =============================================================================
// Export Types
// =============================================================================

export type {
  VoterRegistrationResult,
  VoterRegistrationRequest,
  VoterSuggestResult,
  EnhancedVoterData,
  DistrictLookupResult,
  DistrictElectorateProfile,
  DistrictPartisanComposition,
  DistrictTurnoutProfile,
  DistrictDemographicProfile,
  MobilizationUniverse,
  EarlyVoteTracking,
  DistrictDonorSummary,
};
