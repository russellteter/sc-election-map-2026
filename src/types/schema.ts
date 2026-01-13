/**
 * Centralized TypeScript type definitions for SC Election Map 2026
 *
 * These types are the source of truth for the data schema used throughout
 * the application. They match the output structure of scripts/process-data.py.
 */

/**
 * Incumbent information for a district
 */
export interface Incumbent {
  name: string;
  party: 'Democratic' | 'Republican';
}

/**
 * Individual candidate who has filed with the SC Ethics Commission
 */
export interface Candidate {
  /** Candidate's full name */
  name: string;
  /** Party affiliation (null if unknown) */
  party: string | null;
  /** Filing status (e.g., "filed") */
  status: string;
  /** Date the candidate filed their initial report (ISO format) */
  filedDate: string | null;
  /** URL to the candidate's Ethics Commission filing */
  ethicsUrl: string | null;
  /** Unique report ID from the Ethics Commission */
  reportId: string;
  /** Data source (e.g., "ethics") */
  source: string;
  /** Whether this candidate is the current incumbent for the district */
  isIncumbent?: boolean;
}

/**
 * A legislative district with candidate information
 */
export interface District {
  /** District number (1-124 for House, 1-46 for Senate) */
  districtNumber: number;
  /** List of candidates who have filed in this district */
  candidates: Candidate[];
  /** Current incumbent information for this district */
  incumbent?: Incumbent | null;
}

/**
 * Complete candidates data structure loaded from candidates.json
 */
export interface CandidatesData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** House districts (124 total) keyed by district number string */
  house: Record<string, District>;
  /** Senate districts (46 total) keyed by district number string */
  senate: Record<string, District>;
}

/**
 * Chamber type for House or Senate
 */
export type Chamber = 'house' | 'senate';

/**
 * Party type for filtering and display
 */
export type Party = 'Democratic' | 'Republican' | 'unknown';

/**
 * Search result from the SearchBar component
 */
export interface SearchResult {
  type: 'candidate' | 'district';
  chamber: Chamber;
  districtNumber: number;
  label: string;
  sublabel?: string;
}

// =============================================================================
// Election History Types (from scripts/fetch-election-results.py)
// =============================================================================

/**
 * Election result for a single candidate
 */
export interface ElectionCandidate {
  name: string;
  party: string;
  votes: number;
  percentage: number;
}

/**
 * Single election result for a district
 */
export interface ElectionResult {
  year: number;
  totalVotes: number;
  winner: ElectionCandidate;
  runnerUp?: ElectionCandidate;
  margin: number;
  marginVotes: number;
  uncontested?: boolean;
}

/**
 * Competitiveness metrics for a district
 */
export interface Competitiveness {
  /** Competitiveness score (0-100, higher = more competitive) */
  score: number;
  /** Average margin percentage over recent elections */
  avgMargin: number;
  /** Whether the district has changed party control */
  hasSwung: boolean;
  /** Number of contested races in recent elections */
  contestedRaces: number;
  /** Dominant party if one-sided, null if swing district */
  dominantParty: string | null;
}

/**
 * Historical election data for a single district
 */
export interface DistrictElectionHistory {
  districtNumber: number;
  /** Election results keyed by year string (e.g., "2024") */
  elections: Record<string, ElectionResult>;
  /** Competitiveness metrics */
  competitiveness: Competitiveness;
}

/**
 * Complete election history data from elections.json
 */
export interface ElectionsData {
  lastUpdated: string;
  house: Record<string, DistrictElectionHistory>;
  senate: Record<string, DistrictElectionHistory>;
}

// =============================================================================
// Chamber Statistics
// =============================================================================

/**
 * Statistics calculated for a chamber
 */
export interface ChamberStats {
  /** Number of districts with a Democratic candidate */
  democrats: number;
  /** Number of districts with a Republican candidate */
  republicans: number;
  /** Number of districts with candidates but unknown party */
  unknown: number;
  /** Number of districts with no candidates */
  empty: number;
  /** Total number of individual candidates */
  totalCandidates: number;
  /** Number of candidates with known party affiliation */
  enrichedCandidates: number;
  /** Percentage of candidates with known party (0-100) */
  enrichmentPercent: number;
  /** Number of candidates who are incumbents */
  incumbents?: number;
}
