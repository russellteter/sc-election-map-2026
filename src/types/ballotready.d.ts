/**
 * BallotReady API Type Definitions
 *
 * Types for the CivicEngine/BallotReady API integration.
 * API Documentation: https://developers.civicengine.com/
 */

// =============================================================================
// Election Types
// =============================================================================

/**
 * Election metadata from BallotReady
 */
export interface BallotReadyElection {
  id: string;
  name: string;
  election_day: string; // ISO date
  state: string;
  ocd_id?: string;
  is_primary: boolean;
  is_runoff: boolean;
  election_type: 'general' | 'primary' | 'special' | 'runoff';
  candidate_count?: number;
  position_count?: number;
}

/**
 * Elections API response
 */
export interface ElectionsResponse {
  elections: BallotReadyElection[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

// =============================================================================
// Position Types (Elected Offices)
// =============================================================================

/**
 * Level of government for a position
 */
export type PositionLevel = 'federal' | 'state' | 'county' | 'local' | 'special';

/**
 * An elected position/office from BallotReady
 */
export interface BallotReadyPosition {
  id: string;
  name: string;
  normalized_name?: string;
  level: PositionLevel;
  tier?: number; // 1 = highest priority (President), 5 = lowest
  sub_area_name?: string;
  sub_area_value?: string;
  state: string;
  election_id?: string;
  is_judicial: boolean;
  is_retention: boolean;
  number_of_seats: number;
  partisan_type: 'partisan' | 'nonpartisan' | 'unknown';
  filing_deadline?: string;
  filing_requirements?: {
    signatures?: number;
    fee?: number;
    notes?: string;
  };
  term_length_years?: number;
}

/**
 * Positions API response
 */
export interface PositionsResponse {
  positions: BallotReadyPosition[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

// =============================================================================
// Candidate Types
// =============================================================================

/**
 * Party affiliation from BallotReady
 */
export interface BallotReadyParty {
  id: string;
  name: string;
  abbreviation?: string;
}

/**
 * Candidate endorsement
 */
export interface BallotReadyEndorsement {
  id: string;
  endorser_name: string;
  endorser_type?: 'organization' | 'individual' | 'elected_official' | 'publication';
  endorsement_date?: string;
  endorser_website?: string;
}

/**
 * Candidate issue stance/position
 */
export interface BallotReadyIssueStance {
  issue: string;
  stance: string;
  source?: string;
  source_url?: string;
}

/**
 * A candidate from BallotReady
 */
export interface BallotReadyCandidate {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  suffix?: string;
  party?: BallotReadyParty;
  position_id: string;
  position_name?: string;
  election_id: string;
  is_incumbent: boolean;
  is_winner?: boolean;
  is_write_in?: boolean;
  photo_url?: string;
  thumb_url?: string;
  campaign_website?: string;
  campaign_email?: string;
  campaign_phone?: string;
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  youtube_url?: string;
  biography?: string;
  experience?: string;
  education?: string;
  endorsements?: BallotReadyEndorsement[];
  issue_stances?: BallotReadyIssueStance[];
  vote_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  filed_date?: string;
}

/**
 * Candidates API response
 */
export interface CandidatesResponse {
  candidates: BallotReadyCandidate[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

// =============================================================================
// Polling Place Types
// =============================================================================

/**
 * A polling place location
 */
export interface BallotReadyPollingPlace {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    formatted?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  location_type: 'polling_place' | 'early_vote' | 'drop_box' | 'election_office';
  hours?: {
    date: string;
    start_time: string;
    end_time: string;
  }[];
  notes?: string;
  accessibility?: {
    wheelchair_accessible: boolean;
    notes?: string;
  };
}

/**
 * Polling Places API response
 */
export interface PollingPlacesResponse {
  polling_places: BallotReadyPollingPlace[];
  early_voting_locations?: BallotReadyPollingPlace[];
  drop_boxes?: BallotReadyPollingPlace[];
}

// =============================================================================
// Officeholder Types
// =============================================================================

/**
 * A current officeholder from BallotReady
 */
export interface BallotReadyOfficeholder {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  party?: BallotReadyParty;
  position: BallotReadyPosition;
  photo_url?: string;
  office_email?: string;
  office_phone?: string;
  office_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  website?: string;
  social_media?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  term_start?: string;
  term_end?: string;
}

/**
 * Officeholders API response
 */
export interface OfficeholdersResponse {
  officeholders: BallotReadyOfficeholder[];
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

// =============================================================================
// API Query Parameters
// =============================================================================

/**
 * Common query parameters for BallotReady API
 */
export interface BallotReadyQueryParams {
  /** Street address for lookup */
  address?: string;
  /** Latitude for coordinate lookup */
  latitude?: number;
  /** Longitude for coordinate lookup */
  longitude?: number;
  /** State abbreviation (e.g., "SC") */
  state?: string;
  /** Filter by election ID */
  election_id?: string;
  /** Filter by position level */
  level?: PositionLevel | PositionLevel[];
  /** Include/exclude judicial races */
  include_judicial?: boolean;
  /** Search radius in miles (max 30) */
  radius_miles?: number;
  /** Pagination: page number */
  page?: number;
  /** Pagination: results per page */
  per_page?: number;
}

/**
 * Candidate query parameters
 */
export interface CandidateQueryParams extends BallotReadyQueryParams {
  /** Filter by position ID */
  position_id?: string;
  /** Filter by party name */
  party?: string;
  /** Only return incumbents */
  incumbent_only?: boolean;
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * BallotReady API error response
 */
export interface BallotReadyError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}

// =============================================================================
// Aggregated/Computed Types (for SC Election Map)
// =============================================================================

/**
 * Enriched candidate combining BallotReady data with local data
 */
export interface EnrichedCandidate {
  // Core fields from local data
  name: string;
  party: string | null;
  status: string;
  filedDate: string | null;
  ethicsUrl: string | null;
  reportId: string;
  source: string;
  isIncumbent?: boolean;

  // BallotReady enrichment
  ballotReadyId?: string;
  photoUrl?: string;
  biography?: string;
  campaignWebsite?: string;
  campaignEmail?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  endorsements?: BallotReadyEndorsement[];
  issueStances?: BallotReadyIssueStance[];
  education?: string;
  experience?: string;
  enrichedAt?: string; // ISO timestamp
}

/**
 * Recruitment opportunity combining BallotReady position data with opportunity scoring
 */
export interface RecruitmentOpportunity {
  positionId: string;
  positionName: string;
  level: PositionLevel;
  district?: number;
  chamber?: 'house' | 'senate';

  // Current status
  hasDemocraticCandidate: boolean;
  hasRepublicanCandidate: boolean;
  incumbentParty?: 'Democratic' | 'Republican' | null;

  // Filing info
  filingDeadline?: string;
  filingRequirements?: {
    signatures?: number;
    fee?: number;
    notes?: string;
  };

  // Opportunity metrics
  opportunityScore: number;
  tier: string;

  // Potential recruits (Democratic officeholders who could run)
  potentialRecruits?: BallotReadyOfficeholder[];
}

/**
 * Live election timeline from BallotReady
 */
export interface LiveElectionTimeline {
  electionId: string;
  electionName: string;
  electionDay: string;
  daysUntilElection: number;

  // Key dates
  primaryDate?: string;
  filingDeadlines: {
    positionName: string;
    deadline: string;
    daysRemaining: number;
  }[];
  earlyVotingStart?: string;
  earlyVotingEnd?: string;
  voterRegistrationDeadline?: string;

  // Computed
  phase: 'filing' | 'primary' | 'general' | 'complete';
  nextMilestone: {
    name: string;
    date: string;
    daysRemaining: number;
  } | null;

  updatedAt: string;
}
