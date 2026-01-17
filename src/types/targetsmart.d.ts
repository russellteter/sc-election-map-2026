/**
 * TargetSmart API Type Definitions
 *
 * Types for the TargetSmart VoterBase API integration.
 * API Documentation: https://docs.targetsmart.com/developers/tsapis/v2/index.html
 */

// =============================================================================
// Voter Registration Types
// =============================================================================

/**
 * Voter registration status values
 */
export type VoterRegistrationStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'cancelled'
  | 'purged'
  | 'not_found';

/**
 * Voter registration check result
 */
export interface VoterRegistrationResult {
  /** Whether a matching voter record was found */
  found: boolean;
  /** Registration status */
  status: VoterRegistrationStatus;
  /** Registered voter's full name */
  voter_name?: string;
  /** Registered address */
  registered_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  /** Party affiliation (if available) */
  party_affiliation?: string;
  /** Date of registration */
  registration_date?: string;
  /** Last vote date */
  last_vote_date?: string;
  /** TargetSmart voter ID (for data enhancement) */
  voterbase_id?: string;
  /** Confidence score (0-100) */
  confidence_score?: number;
}

/**
 * Voter registration check request
 */
export interface VoterRegistrationRequest {
  first_name: string;
  last_name: string;
  street_address?: string;
  city?: string;
  state: string;
  zip?: string;
  date_of_birth?: string; // YYYY-MM-DD format
}

// =============================================================================
// Voter Search/Suggest Types
// =============================================================================

/**
 * Voter suggest (autocomplete) result
 */
export interface VoterSuggestResult {
  voterbase_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  match_score: number;
}

/**
 * Voter suggest response
 */
export interface VoterSuggestResponse {
  suggestions: VoterSuggestResult[];
  total_matches: number;
}

// =============================================================================
// Data Enhancement Types (Demographics & Modeling)
// =============================================================================

/**
 * Partisan score (1-100 scale)
 * 1 = Strong Republican, 50 = Independent/Swing, 100 = Strong Democrat
 */
export interface PartisanScore {
  /** Overall partisan score (1-100) */
  score: number;
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Model version */
  model_version?: string;
}

/**
 * Turnout propensity score (0-100)
 */
export interface TurnoutScore {
  /** General election turnout propensity */
  general: number;
  /** Primary election turnout propensity */
  primary: number;
  /** Midterm election turnout propensity */
  midterm: number;
  /** Presidential election turnout propensity */
  presidential: number;
  /** Off-year election turnout propensity */
  off_year?: number;
}

/**
 * Issue support scores (0-100)
 */
export interface IssueScores {
  /** Gun control support */
  gun_control?: number;
  /** Abortion rights support */
  abortion_rights?: number;
  /** Environmental protection support */
  environment?: number;
  /** Immigration reform support */
  immigration?: number;
  /** Healthcare expansion support */
  healthcare?: number;
  /** Education funding support */
  education?: number;
  /** Tax policy (higher = pro-progressive taxation) */
  taxation?: number;
  /** Labor/union support */
  labor?: number;
}

/**
 * Demographic data from TargetSmart
 */
export interface DemographicData {
  /** Age range */
  age_range?: string;
  /** Estimated age */
  estimated_age?: number;
  /** Gender */
  gender?: 'M' | 'F' | 'U';
  /** Race/ethnicity (modeled) */
  ethnicity?: string;
  /** Education level (modeled) */
  education?: 'less_than_high_school' | 'high_school' | 'some_college' | 'bachelors' | 'graduate';
  /** Income range (modeled) */
  income_range?: string;
  /** Homeowner status */
  homeowner?: boolean;
  /** Marital status */
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'unknown';
  /** Presence of children */
  has_children?: boolean;
}

/**
 * Vote history record
 */
export interface VoteHistoryRecord {
  election_date: string;
  election_type: 'general' | 'primary' | 'municipal' | 'special';
  voted: boolean;
  vote_method?: 'in_person' | 'absentee' | 'early' | 'mail';
  party_primary?: string;
}

/**
 * Enhanced voter data response
 */
export interface EnhancedVoterData {
  voterbase_id: string;

  // Basic info
  first_name: string;
  last_name: string;
  full_name: string;

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county?: string;
  };

  // Registration
  registration_status: VoterRegistrationStatus;
  registration_date?: string;
  party_affiliation?: string;

  // Districts
  districts: {
    state_house?: number;
    state_senate?: number;
    congressional?: number;
    county?: string;
    precinct?: string;
    school_district?: string;
  };

  // Scores & modeling
  partisan_score?: PartisanScore;
  turnout_scores?: TurnoutScore;
  issue_scores?: IssueScores;

  // Demographics
  demographics?: DemographicData;

  // Vote history
  vote_history?: VoteHistoryRecord[];

  // Donor info (from ContributorBase)
  donor_info?: {
    has_given: boolean;
    total_amount?: number;
    last_gift_date?: string;
    average_gift?: number;
    recipient_types?: string[];
  };
}

// =============================================================================
// District Service Types
// =============================================================================

/**
 * District lookup result
 */
export interface DistrictLookupResult {
  state: string;

  // Legislative districts
  state_house?: {
    district: number;
    name?: string;
  };
  state_senate?: {
    district: number;
    name?: string;
  };
  congressional?: {
    district: number;
    name?: string;
  };

  // Local districts
  county?: {
    fips: string;
    name: string;
  };
  city?: {
    name: string;
  };
  precinct?: {
    id: string;
    name?: string;
  };
  school_district?: {
    id: string;
    name: string;
  };
}

// =============================================================================
// Aggregated District Profile Types (for SC Election Map)
// =============================================================================

/**
 * Partisan composition of a district
 */
export interface DistrictPartisanComposition {
  /** Total registered voters in district */
  totalRegistered: number;

  /** Party registration breakdown */
  partyRegistration: {
    democratic: number;
    republican: number;
    independent: number;
    other: number;
    noParty: number;
  };

  /** Partisan score distribution (aggregated) */
  partisanDistribution: {
    /** Strong Dem (score 80-100) */
    strongDem: number;
    /** Lean Dem (score 60-79) */
    leanDem: number;
    /** Swing (score 40-59) */
    swing: number;
    /** Lean Rep (score 21-39) */
    leanRep: number;
    /** Strong Rep (score 1-20) */
    strongRep: number;
  };

  /** Average partisan score for district */
  averagePartisanScore: number;
}

/**
 * Turnout profile of a district
 */
export interface DistrictTurnoutProfile {
  /** Voter counts by turnout propensity */
  turnoutDistribution: {
    /** High turnout (score 80-100) */
    high: number;
    /** Medium turnout (score 50-79) */
    medium: number;
    /** Low turnout (score 20-49) */
    low: number;
    /** Very low turnout (score 0-19) */
    veryLow: number;
  };

  /** Average turnout scores */
  averageTurnout: {
    general: number;
    primary: number;
    midterm: number;
    presidential: number;
  };

  /** Historical turnout rates */
  historicalTurnout: {
    year: number;
    type: 'general' | 'primary';
    turnoutRate: number;
  }[];
}

/**
 * Demographic profile of a district
 */
export interface DistrictDemographicProfile {
  /** Age distribution */
  ageDistribution: {
    age18_29: number;
    age30_44: number;
    age45_64: number;
    age65Plus: number;
  };

  /** Gender distribution */
  genderDistribution: {
    male: number;
    female: number;
    unknown: number;
  };

  /** Modeled ethnicity distribution */
  ethnicityDistribution: {
    white: number;
    black: number;
    hispanic: number;
    asian: number;
    other: number;
  };

  /** Education level distribution */
  educationDistribution: {
    highSchoolOrLess: number;
    someCollege: number;
    bachelors: number;
    graduate: number;
  };
}

/**
 * Mobilization universe for a district
 */
export interface MobilizationUniverse {
  /** Low-turnout Democratic-leaning voters */
  lowTurnoutDems: {
    count: number;
    percentage: number;
    potential: 'high' | 'medium' | 'low';
  };

  /** Swing voters */
  swingVoters: {
    count: number;
    percentage: number;
  };

  /** Persuadable voters (lean but not strong) */
  persuadable: {
    leanDem: number;
    leanRep: number;
    total: number;
  };

  /** Priority score for mobilization (0-100) */
  mobilizationPriority: number;

  /** Estimated vote pickup from full mobilization */
  estimatedVotePickup: number;
}

/**
 * Complete electorate profile for a district
 */
export interface DistrictElectorateProfile {
  chamber: 'house' | 'senate';
  districtNumber: number;

  // Core profiles
  partisanComposition: DistrictPartisanComposition;
  turnoutProfile: DistrictTurnoutProfile;
  demographics: DistrictDemographicProfile;

  // Strategic data
  mobilizationUniverse: MobilizationUniverse;

  // Metadata
  dataAsOf: string;
  sampleSize?: number;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

// =============================================================================
// Early Vote Tracking Types
// =============================================================================

/**
 * Early vote/absentee tracking for a district
 */
export interface EarlyVoteTracking {
  districtNumber: number;
  chamber: 'house' | 'senate';

  /** Ballots requested */
  ballotsRequested: {
    total: number;
    democratic: number;
    republican: number;
    other: number;
    byDate: { date: string; count: number }[];
  };

  /** Ballots returned */
  ballotsReturned: {
    total: number;
    democratic: number;
    republican: number;
    other: number;
    byDate: { date: string; count: number }[];
  };

  /** In-person early voting */
  earlyInPerson: {
    total: number;
    byDate: { date: string; count: number }[];
  };

  /** Compared to same point in previous elections */
  comparedToPrevious?: {
    year: number;
    percentChange: number;
  };

  /** Last updated */
  asOf: string;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * TargetSmart API error response
 */
export interface TargetSmartError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  status: number;
}

/**
 * Common query parameters
 */
export interface TargetSmartQueryParams {
  state?: string;
  county?: string;
  congressional_district?: number;
  state_house_district?: number;
  state_senate_district?: number;
}

/**
 * Data enhancement request
 */
export interface DataEnhanceRequest {
  /** TargetSmart voter ID */
  voterbase_id?: string;
  /** Phone number */
  phone?: string;
  /** Email address */
  email?: string;
  /** First name + last name + address lookup */
  person?: {
    first_name: string;
    last_name: string;
    street_address?: string;
    city?: string;
    state: string;
    zip?: string;
  };
}

// =============================================================================
// Contribution/Donor Types
// =============================================================================

/**
 * Contribution record from ContributorBase
 */
export interface ContributionRecord {
  donor_name: string;
  amount: number;
  date: string;
  recipient_name: string;
  recipient_type: 'candidate' | 'pac' | 'party' | 'other';
  recipient_party?: string;
  election_year: number;
}

/**
 * District donor summary
 */
export interface DistrictDonorSummary {
  districtNumber: number;
  chamber: 'house' | 'senate';

  /** Total unique donors in district */
  totalDonors: number;

  /** Total contributions from district */
  totalContributions: number;

  /** Average contribution amount */
  averageContribution: number;

  /** Party breakdown of giving */
  partyGiving: {
    democratic: number;
    republican: number;
    nonPartisan: number;
  };

  /** Top donor capacity tiers */
  donorCapacity: {
    major: number; // $1000+
    mid: number; // $250-999
    grassroots: number; // $50-249
    small: number; // <$50
  };

  /** Year-over-year trend */
  trend: 'increasing' | 'stable' | 'decreasing';
}
