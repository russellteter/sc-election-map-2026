/**
 * BallotReady API Client
 *
 * Client for the CivicEngine/BallotReady API.
 * Provides access to elections, positions, candidates, polling places, and endorsements.
 *
 * API Documentation: https://developers.civicengine.com/
 */

import type {
  BallotReadyElection,
  BallotReadyPosition,
  BallotReadyCandidate,
  BallotReadyPollingPlace,
  BallotReadyOfficeholder,
  BallotReadyQueryParams,
  CandidateQueryParams,
  ElectionsResponse,
  PositionsResponse,
  CandidatesResponse,
  PollingPlacesResponse,
  OfficeholdersResponse,
  BallotReadyError,
  LiveElectionTimeline,
  EnrichedCandidate,
  RecruitmentOpportunity,
} from '@/types/ballotready';

// =============================================================================
// Configuration
// =============================================================================

const BALLOTREADY_BASE_URL = 'https://api.civicengine.com';
const API_KEY = process.env.NEXT_PUBLIC_BALLOTREADY_KEY || '';

// Cache configuration
const CACHE_TTL = {
  elections: 24 * 60 * 60 * 1000, // 24 hours
  positions: 6 * 60 * 60 * 1000, // 6 hours
  candidates: 6 * 60 * 60 * 1000, // 6 hours
  pollingPlaces: 60 * 60 * 1000, // 1 hour
  officeholders: 24 * 60 * 60 * 1000, // 24 hours
};

// Rate limiting
const RATE_LIMIT_MS = 100; // 100ms between requests
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

class BallotReadyCache {
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

const cache = new BallotReadyCache();

// =============================================================================
// API Client Core
// =============================================================================

/**
 * Make a rate-limited request to the BallotReady API with timeout and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
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

  // Build URL with query params
  const url = new URL(`${BALLOTREADY_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // Make request with timeout
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Partial<BallotReadyError>;
      throw new Error(
        errorData.error?.message || `BallotReady API error: ${response.status}`
      );
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[BallotReady] Request timeout for ${endpoint}`);
        throw new Error('BallotReady API request timed out');
      }
      if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        console.error(`[BallotReady] Network error for ${endpoint}:`, error.message);
        throw new Error('BallotReady API unreachable - network error');
      }
    }

    // Re-throw other errors
    throw error;
  }
}

// =============================================================================
// Elections API
// =============================================================================

/**
 * Get elections for a state
 */
export async function getElections(
  state: string = 'SC',
  options?: { upcoming_only?: boolean }
): Promise<BallotReadyElection[]> {
  const cacheKey = `elections:${state}:${JSON.stringify(options)}`;
  const cached = cache.get<BallotReadyElection[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<ElectionsResponse>('/elections', {
    state,
    upcoming: options?.upcoming_only,
  });

  cache.set(cacheKey, response.elections, CACHE_TTL.elections);
  return response.elections;
}

/**
 * Get the next upcoming election
 */
export async function getNextElection(
  state: string = 'SC'
): Promise<BallotReadyElection | null> {
  const elections = await getElections(state, { upcoming_only: true });
  if (elections.length === 0) return null;

  // Sort by date and return the next one
  return elections.sort(
    (a, b) =>
      new Date(a.election_day).getTime() - new Date(b.election_day).getTime()
  )[0];
}

// =============================================================================
// Positions API
// =============================================================================

/**
 * Get positions (elected offices) for an address or location
 */
export async function getPositions(
  params: BallotReadyQueryParams
): Promise<BallotReadyPosition[]> {
  const cacheKey = `positions:${JSON.stringify(params)}`;
  const cached = cache.get<BallotReadyPosition[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<PositionsResponse>('/positions', {
    address: params.address,
    latitude: params.latitude,
    longitude: params.longitude,
    state: params.state,
    election_id: params.election_id,
    level: Array.isArray(params.level) ? params.level.join(',') : params.level,
    include_judicial: params.include_judicial,
    page: params.page,
    per_page: params.per_page,
  });

  cache.set(cacheKey, response.positions, CACHE_TTL.positions);
  return response.positions;
}

/**
 * Get positions without candidates (recruitment opportunities)
 */
export async function getUncontestedPositions(
  state: string = 'SC',
  level?: BallotReadyQueryParams['level']
): Promise<BallotReadyPosition[]> {
  const positions = await getPositions({ state, level });

  // Filter to positions that may need candidates
  // (This is a simplified filter - actual implementation would check candidates)
  return positions.filter(
    (p) => p.filing_deadline && new Date(p.filing_deadline) > new Date()
  );
}

// =============================================================================
// Candidates API
// =============================================================================

/**
 * Get candidates for positions
 */
export async function getCandidates(
  params: CandidateQueryParams
): Promise<BallotReadyCandidate[]> {
  const cacheKey = `candidates:${JSON.stringify(params)}`;
  const cached = cache.get<BallotReadyCandidate[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<CandidatesResponse>('/candidates', {
    address: params.address,
    latitude: params.latitude,
    longitude: params.longitude,
    state: params.state,
    election_id: params.election_id,
    position_id: params.position_id,
    party: params.party,
    incumbent_only: params.incumbent_only,
    page: params.page,
    per_page: params.per_page,
  });

  cache.set(cacheKey, response.candidates, CACHE_TTL.candidates);
  return response.candidates;
}

/**
 * Get candidates for a specific position
 */
export async function getCandidatesForPosition(
  positionId: string
): Promise<BallotReadyCandidate[]> {
  return getCandidates({ position_id: positionId });
}

/**
 * Search for candidates by name
 */
export async function searchCandidates(
  name: string,
  state: string = 'SC'
): Promise<BallotReadyCandidate[]> {
  // BallotReady may not have a direct name search - this is a workaround
  const allCandidates = await getCandidates({ state });
  const searchLower = name.toLowerCase();

  return allCandidates.filter((c) =>
    c.name.toLowerCase().includes(searchLower)
  );
}

// =============================================================================
// Polling Places API
// =============================================================================

/**
 * Get polling places for an address or location
 */
export async function getPollingPlaces(
  params: { address?: string; latitude?: number; longitude?: number }
): Promise<PollingPlacesResponse> {
  const cacheKey = `polling:${JSON.stringify(params)}`;
  const cached = cache.get<PollingPlacesResponse>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<PollingPlacesResponse>('/polling-places', {
    address: params.address,
    latitude: params.latitude,
    longitude: params.longitude,
  });

  cache.set(cacheKey, response, CACHE_TTL.pollingPlaces);
  return response;
}

/**
 * Get early voting locations for an address
 */
export async function getEarlyVotingLocations(
  params: { address?: string; latitude?: number; longitude?: number }
): Promise<BallotReadyPollingPlace[]> {
  const response = await getPollingPlaces(params);
  return response.early_voting_locations || [];
}

/**
 * Get ballot drop box locations
 */
export async function getDropBoxes(
  params: { address?: string; latitude?: number; longitude?: number }
): Promise<BallotReadyPollingPlace[]> {
  const response = await getPollingPlaces(params);
  return response.drop_boxes || [];
}

// =============================================================================
// Officeholders API
// =============================================================================

/**
 * Get current officeholders for a location
 */
export async function getOfficeholders(
  params: BallotReadyQueryParams
): Promise<BallotReadyOfficeholder[]> {
  const cacheKey = `officeholders:${JSON.stringify(params)}`;
  const cached = cache.get<BallotReadyOfficeholder[]>(cacheKey);
  if (cached) return cached;

  const response = await apiRequest<OfficeholdersResponse>('/officeholders', {
    address: params.address,
    latitude: params.latitude,
    longitude: params.longitude,
    state: params.state,
    level: Array.isArray(params.level) ? params.level.join(',') : params.level,
    page: params.page,
    per_page: params.per_page,
  });

  cache.set(cacheKey, response.officeholders, CACHE_TTL.officeholders);
  return response.officeholders;
}

/**
 * Get Democratic officeholders who could potentially run for higher office
 */
export async function getDemocraticOfficeholders(
  state: string = 'SC'
): Promise<BallotReadyOfficeholder[]> {
  const officeholders = await getOfficeholders({ state });
  return officeholders.filter(
    (o) =>
      o.party?.name?.toLowerCase().includes('democrat') ||
      o.party?.abbreviation === 'D'
  );
}

// =============================================================================
// Aggregated Functions for SC Election Map
// =============================================================================

/**
 * Get live election timeline with all key dates
 */
export async function getLiveElectionTimeline(
  state: string = 'SC'
): Promise<LiveElectionTimeline | null> {
  const election = await getNextElection(state);
  if (!election) return null;

  const positions = await getPositions({
    state,
    election_id: election.id,
  });

  const now = new Date();
  const electionDay = new Date(election.election_day);
  const daysUntilElection = Math.ceil(
    (electionDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Extract filing deadlines from positions
  const filingDeadlines = positions
    .filter((p) => p.filing_deadline)
    .map((p) => ({
      positionName: p.name,
      deadline: p.filing_deadline!,
      daysRemaining: Math.ceil(
        (new Date(p.filing_deadline!).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }))
    .filter((d) => d.daysRemaining > 0)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Determine phase
  let phase: LiveElectionTimeline['phase'] = 'general';
  if (filingDeadlines.length > 0 && filingDeadlines[0].daysRemaining > 0) {
    phase = 'filing';
  } else if (election.is_primary) {
    phase = 'primary';
  } else if (daysUntilElection < 0) {
    phase = 'complete';
  }

  // Next milestone
  let nextMilestone: LiveElectionTimeline['nextMilestone'] = null;
  if (filingDeadlines.length > 0) {
    nextMilestone = {
      name: `Filing deadline: ${filingDeadlines[0].positionName}`,
      date: filingDeadlines[0].deadline,
      daysRemaining: filingDeadlines[0].daysRemaining,
    };
  } else if (daysUntilElection > 0) {
    nextMilestone = {
      name: 'Election Day',
      date: election.election_day,
      daysRemaining: daysUntilElection,
    };
  }

  return {
    electionId: election.id,
    electionName: election.name,
    electionDay: election.election_day,
    daysUntilElection,
    filingDeadlines,
    phase,
    nextMilestone,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Enrich a local candidate with BallotReady data
 */
export async function enrichCandidate(
  localCandidate: {
    name: string;
    party: string | null;
    status: string;
    filedDate: string | null;
    ethicsUrl: string | null;
    reportId: string;
    source: string;
    isIncumbent?: boolean;
  },
  positionId?: string
): Promise<EnrichedCandidate> {
  try {
    // Try to find matching candidate in BallotReady
    const candidates = positionId
      ? await getCandidatesForPosition(positionId)
      : await searchCandidates(localCandidate.name, 'SC');

    // Find best match by name
    const match = candidates.find((c) => {
      const localName = localCandidate.name.toLowerCase();
      const brName = c.name.toLowerCase();
      return (
        brName === localName ||
        brName.includes(localName) ||
        localName.includes(brName)
      );
    });

    if (!match) {
      return { ...localCandidate };
    }

    // Merge data
    return {
      ...localCandidate,
      ballotReadyId: match.id,
      photoUrl: match.photo_url || match.thumb_url,
      biography: match.biography,
      campaignWebsite: match.campaign_website,
      campaignEmail: match.campaign_email,
      socialMedia: {
        facebook: match.facebook_url,
        twitter: match.twitter_url,
        instagram: match.instagram_url,
      },
      endorsements: match.endorsements,
      issueStances: match.issue_stances,
      education: match.education,
      experience: match.experience,
      enrichedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to enrich candidate:', error);
    return { ...localCandidate };
  }
}

/**
 * Find recruitment opportunities (positions without Democratic candidates)
 */
export async function findRecruitmentOpportunities(
  opportunityData: Record<
    string,
    { opportunityScore: number; tier: string; flags: { hasDemocrat: boolean } }
  >,
  chamber: 'house' | 'senate'
): Promise<RecruitmentOpportunity[]> {
  const opportunities: RecruitmentOpportunity[] = [];

  for (const [districtNum, data] of Object.entries(opportunityData)) {
    if (data.flags.hasDemocrat) continue;
    if (data.opportunityScore < 30) continue; // Skip low-opportunity districts

    try {
      // Get positions for this district
      const positions = await getPositions({
        state: 'SC',
        level: 'state',
      });

      // Find matching position
      const matchingPosition = positions.find((p) => {
        const name = p.name.toLowerCase();
        const districtPattern = new RegExp(`district\\s*${districtNum}\\b`, 'i');
        return (
          (chamber === 'house' && name.includes('house') && districtPattern.test(name)) ||
          (chamber === 'senate' && name.includes('senate') && districtPattern.test(name))
        );
      });

      if (matchingPosition) {
        // Get Democratic officeholders who could run
        const demOfficeholders = await getDemocraticOfficeholders('SC');
        const potentialRecruits = demOfficeholders.filter(
          (o) =>
            o.position.level === 'local' || o.position.level === 'county'
        );

        opportunities.push({
          positionId: matchingPosition.id,
          positionName: matchingPosition.name,
          level: matchingPosition.level,
          district: parseInt(districtNum),
          chamber,
          hasDemocraticCandidate: false,
          hasRepublicanCandidate: true, // Assumed for now
          incumbentParty: null,
          filingDeadline: matchingPosition.filing_deadline,
          filingRequirements: matchingPosition.filing_requirements,
          opportunityScore: data.opportunityScore,
          tier: data.tier,
          potentialRecruits: potentialRecruits.slice(0, 5), // Limit to 5
        });
      }
    } catch (error) {
      console.error(`Error finding opportunity for ${chamber} ${districtNum}:`, error);
    }
  }

  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
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
    await apiRequest<ElectionsResponse>('/elections', {
      state: 'SC',
      upcoming: true,
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

/**
 * Get cache status
 */
export function getCacheStatus(): { entries: number } {
  return { entries: 0 }; // Simplified - actual implementation would track this
}

// =============================================================================
// Export Types
// =============================================================================

export type {
  BallotReadyElection,
  BallotReadyPosition,
  BallotReadyCandidate,
  BallotReadyPollingPlace,
  BallotReadyOfficeholder,
  BallotReadyQueryParams,
  CandidateQueryParams,
  LiveElectionTimeline,
  EnrichedCandidate,
  RecruitmentOpportunity,
};
