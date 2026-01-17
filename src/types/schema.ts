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

// =============================================================================
// Opportunity Scoring Types (from scripts/calculate-opportunity.py)
// =============================================================================

/**
 * Opportunity tier classification
 */
export type OpportunityTier =
  | 'HIGH_OPPORTUNITY'
  | 'EMERGING'
  | 'BUILD'
  | 'DEFENSIVE'
  | 'NON_COMPETITIVE';

/**
 * Factors contributing to opportunity score
 */
export interface OpportunityFactors {
  /** Historical competitiveness factor (0-1) */
  competitiveness: number;
  /** Margin trend factor (0-1, higher = trending toward Dems) */
  marginTrend: number;
  /** Incumbency factor (1.0 for open seat, 0.5 for incumbent running) */
  incumbency: number;
  /** Candidate presence factor (1.0 if Dem filed, 0 if not) */
  candidatePresence: number;
  /** Whether this is an open seat */
  openSeatBonus: boolean;
}

/**
 * Raw metrics used in scoring
 */
export interface OpportunityMetrics {
  /** Average margin over recent elections */
  avgMargin: number;
  /** Margin change (positive = shrinking = good for Dems) */
  trendChange: number;
  /** Original competitiveness score from elections.json */
  competitivenessScore: number;
}

/**
 * Strategic flags for filtering and display
 */
export interface OpportunityFlags {
  /** Needs a Democratic candidate (score >= 50, no Dem filed) */
  needsCandidate: boolean;
  /** This is an open seat */
  openSeat: boolean;
  /** Margins are trending toward Democrats */
  trendingDem: boolean;
  /** This is a defensive seat (Dem incumbent) */
  defensive: boolean;
  /** A Democratic candidate has filed */
  hasDemocrat: boolean;
}

/**
 * Opportunity score for a single district
 */
export interface DistrictOpportunity {
  /** District number */
  districtNumber: number;
  /** Computed opportunity score (0-100) */
  opportunityScore: number;
  /** Tier classification code */
  tier: OpportunityTier;
  /** Human-readable tier label */
  tierLabel: string;
  /** Factor breakdown */
  factors: OpportunityFactors;
  /** Raw metrics */
  metrics: OpportunityMetrics;
  /** Strategic flags */
  flags: OpportunityFlags;
  /** Strategic recommendation text */
  recommendation: string;
}

/**
 * Complete opportunity data from opportunity.json
 */
export interface OpportunityData {
  /** ISO timestamp of when scores were calculated */
  lastUpdated: string;
  /** House district opportunities keyed by district number string */
  house: Record<string, DistrictOpportunity>;
  /** Senate district opportunities keyed by district number string */
  senate: Record<string, DistrictOpportunity>;
}

/**
 * Opportunity statistics for a chamber
 */
export interface OpportunityStats {
  /** High opportunity districts (score 70+) */
  highOpportunity: number;
  /** Emerging opportunity districts (score 50-69) */
  emerging: number;
  /** Build districts (score 30-49) */
  build: number;
  /** Defensive districts (Dem incumbent) */
  defensive: number;
  /** Non-competitive districts (score <30) */
  nonCompetitive: number;
  /** Districts needing a Democratic candidate */
  needsCandidate: number;
  /** Districts with Democratic candidates filed */
  demFiled: number;
}

// =============================================================================
// Statewide Races Types (Governor, AG, etc.)
// =============================================================================

/**
 * A statewide constitutional office race
 */
export interface StatewideRace {
  /** Office name (e.g., "Governor", "Attorney General") */
  office: string;
  /** Short description of the office */
  description?: string;
  /** Current incumbent information */
  incumbent?: {
    name: string;
    party: 'Democratic' | 'Republican';
    canRunAgain?: boolean;
  } | null;
  /** List of candidates who have filed */
  candidates: Candidate[];
  /** Term length in years */
  termYears: number;
}

/**
 * Complete statewide races data
 */
export interface StatewideRacesData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Array of statewide constitutional office races */
  races: StatewideRace[];
}

// =============================================================================
// Congressional Races Types (US House, US Senate)
// =============================================================================

/**
 * US Congressional district race
 */
export interface CongressionalDistrict {
  /** District number (1-7 for SC House) */
  districtNumber: number;
  /** Current incumbent information */
  incumbent?: {
    name: string;
    party: 'Democratic' | 'Republican';
    since?: number;
  } | null;
  /** List of candidates who have filed */
  candidates: Candidate[];
}

/**
 * US Senate race (statewide)
 */
export interface USSenateRace {
  /** Seat class (1, 2, or 3) */
  seatClass: number;
  /** Whether this seat is up for election in 2026 */
  upForElection: boolean;
  /** Current incumbent information */
  incumbent?: {
    name: string;
    party: 'Democratic' | 'Republican';
    since?: number;
    termEnds?: number;
  } | null;
  /** List of candidates who have filed (empty if not up for election) */
  candidates: Candidate[];
}

/**
 * Complete congressional races data
 */
export interface CongressionalData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** US House districts (7 total for SC) */
  house: Record<string, CongressionalDistrict>;
  /** US Senate races (2 seats) */
  senate: {
    /** Senior senator (Class 2 - Tim Scott) */
    class2: USSenateRace;
    /** Junior senator (Class 3 - Lindsey Graham) */
    class3: USSenateRace;
  };
}

// =============================================================================
// Election Dates & Voter Resources Types
// =============================================================================

/**
 * Election date/deadline type
 */
export type ElectionDateType = 'deadline' | 'period-start' | 'election';
export type ElectionDateCategory = 'registration' | 'filing' | 'voting' | 'election';

/**
 * Single election date entry
 */
export interface ElectionDate {
  id: string;
  date: string; // ISO date format YYYY-MM-DD
  title: string;
  description: string;
  type: ElectionDateType;
  category: ElectionDateCategory;
  important: boolean;
}

/**
 * Voter resources links
 */
export interface VoterResources {
  voterRegistration: {
    checkStatus: string;
    register: string;
    requirements: string;
  };
  pollingPlace: {
    lookup: string;
    sampleBallot: string;
  };
  absenteeVoting: {
    info: string;
    requestForm: string;
  };
  countyOffices: string;
}

/**
 * Complete election dates data
 */
export interface ElectionDatesData {
  lastUpdated: string;
  year: number;
  state: string;
  dates: ElectionDate[];
  resources: VoterResources;
}

// =============================================================================
// County Races Types (Sheriff, Auditor, Treasurer, etc.)
// =============================================================================

/**
 * A county constitutional office race
 */
export interface CountyRace {
  /** Office name (e.g., "Sheriff", "Auditor", "Treasurer") */
  office: string;
  /** Current incumbent information */
  incumbent?: {
    name: string;
    party: 'Democratic' | 'Republican';
  } | null;
  /** List of candidates who have filed */
  candidates: Candidate[];
  /** Term length in years */
  termYears: number;
}

/**
 * County-level election data
 */
export interface CountyData {
  /** County name (e.g., "Greenville") */
  countyName: string;
  /** County FIPS code (e.g., "045") */
  fipsCode: string;
  /** Array of county races */
  races: CountyRace[];
}

/**
 * Complete county races data
 */
export interface CountyRacesData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Counties keyed by county name */
  counties: Record<string, CountyData>;
}

// =============================================================================
// School Board Races Types
// =============================================================================

/**
 * Complete school board data structure
 */
export interface SchoolBoardData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Array of school districts with their races */
  districts: SchoolDistrict[];
}

/**
 * A school district with board seats
 */
export interface SchoolDistrict {
  /** Full name of the school district */
  name: string;
  /** County where the district is located */
  county: string;
  /** Array of board seats up for election */
  seats: SchoolBoardSeat[];
}

/**
 * A school board seat with candidates
 */
export interface SchoolBoardSeat {
  /** Seat identifier (e.g., "Seat 1", "District 3") */
  seat: string;
  /** List of candidates for this seat */
  candidates: SchoolBoardCandidate[];
}

/**
 * A school board candidate
 */
export interface SchoolBoardCandidate {
  /** Candidate's full name */
  name: string;
  /** Party affiliation (N for nonpartisan, D, R) */
  party: string;
  /** Whether this candidate is the current incumbent */
  incumbent: boolean;
}

// =============================================================================
// Ballot Measures Types (State and Local)
// =============================================================================

/**
 * State ballot measure (constitutional amendment, statutory, or advisory)
 */
export interface StateMeasure {
  /** Measure number (e.g., "1", "2") */
  number: string;
  /** Measure title */
  title: string;
  /** Description of what the measure does */
  description: string;
  /** Type of measure */
  type: 'constitutional' | 'statutory' | 'advisory';
  /** URL to full text of the measure */
  fullText?: string;
  /** Arguments in favor of the measure */
  proArguments?: string[];
  /** Arguments against the measure */
  conArguments?: string[];
}

/**
 * Local ballot measure (bond, tax, zoning, etc.)
 */
export interface LocalMeasure {
  /** Measure number/letter (e.g., "A", "1") */
  number: string;
  /** Measure title */
  title: string;
  /** Description of what the measure does */
  description: string;
  /** Type of local measure */
  type: 'bond' | 'tax' | 'zoning' | 'other';
  /** Dollar amount or rate (for bonds/taxes) */
  amount?: string;
}

/**
 * Group of local measures for a specific county
 */
export interface LocalMeasureGroup {
  /** County name */
  county: string;
  /** Array of measures for this county */
  measures: LocalMeasure[];
}

/**
 * Complete ballot measures data
 */
export interface BallotMeasuresData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Statewide ballot measures (all voters see these) */
  stateMeasures: StateMeasure[];
  /** Local ballot measures grouped by county */
  localMeasures: LocalMeasureGroup[];
}

// =============================================================================
// Special Districts Types (Soil & Water, Fire, Recreation, etc.)
// =============================================================================

/**
 * Type of special district
 */
export type SpecialDistrictType =
  | 'soil_water'
  | 'fire'
  | 'water_sewer'
  | 'recreation'
  | 'hospital'
  | 'transit'
  | 'other';

/**
 * Candidate for a special district position
 */
export interface SpecialDistrictCandidate {
  /** Candidate's full name */
  name: string;
  /** Whether this candidate is the current incumbent */
  incumbent: boolean;
}

/**
 * A seat/position within a special district
 */
export interface SpecialDistrictSeat {
  /** Position title (e.g., "Commissioner", "Board Member") */
  position: string;
  /** List of candidates for this position */
  candidates: SpecialDistrictCandidate[];
}

/**
 * A special district (Fire, Water, Recreation, etc.)
 */
export interface SpecialDistrict {
  /** Full name of the district */
  name: string;
  /** Type of special district */
  type: SpecialDistrictType;
  /** Seats/positions up for election */
  seats: SpecialDistrictSeat[];
}

/**
 * Special districts for a specific county
 */
export interface CountySpecialDistricts {
  /** County name (e.g., "Richland") */
  county: string;
  /** Array of special districts in this county */
  specialDistricts: SpecialDistrict[];
}

/**
 * Complete special districts data
 */
export interface SpecialDistrictsData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Array of county special district data */
  districts: CountySpecialDistricts[];
}

// =============================================================================
// Judicial Races Types (Supreme Court, Court of Appeals, Circuit Courts)
// =============================================================================

/**
 * A seat on a statewide judicial court
 */
export interface JudicialSeat {
  /** Seat name (e.g., "Chief Justice", "Justice, Seat 2") */
  seat: string;
  /** Current incumbent's name */
  incumbent: string;
  /** Year the current term ends */
  termEnd: string;
  /** Date the incumbent assumed office (ISO format) */
  assumedOffice?: string;
}

/**
 * A statewide judicial court (Supreme Court or Court of Appeals)
 */
export interface StatewideJudicialCourt {
  /** Court name (e.g., "SC Supreme Court") */
  court: string;
  /** Description of the court's role */
  description?: string;
  /** Term length in years */
  termYears: number;
  /** Seats on the court */
  seats: JudicialSeat[];
}

/**
 * A judge position on a circuit court
 */
export interface CircuitJudge {
  /** Position title (e.g., "Circuit Court Judge") */
  position: string;
  /** Description of the position */
  description?: string;
}

/**
 * A judicial circuit covering multiple counties
 */
export interface CircuitCourt {
  /** Circuit number (e.g., "5th") */
  circuit: string;
  /** Counties in this circuit */
  counties: string[];
  /** Judge positions in this circuit */
  judges: CircuitJudge[];
}

/**
 * Information about SC's judicial selection process
 */
export interface JudicialSelectionInfo {
  /** Selection method (e.g., "Legislative Election") */
  method: string;
  /** Description of the selection process */
  description: string;
  /** Description of voters' role in the process */
  voterRole: string;
  /** Whether SC uses retention votes (false - SC does not) */
  retentionVotes: boolean;
}

/**
 * Complete judicial races data
 */
export interface JudicialRacesData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Statewide judicial courts (Supreme Court, Court of Appeals) */
  statewideJudicial: StatewideJudicialCourt[];
  /** Circuit courts by circuit number */
  circuitCourts: CircuitCourt[];
  /** Information about SC's judicial selection process */
  selectionInfo: JudicialSelectionInfo;
}

// =============================================================================
// County Contacts Types (Election Office URLs, Phone, Address)
// =============================================================================

/**
 * County election office contact information
 */
export interface CountyContact {
  /** URL to county election office website (null = use defaultUrl) */
  electionUrl: string | null;
  /** Phone number for county election office */
  phone: string | null;
  /** Physical address for county election office */
  address: string | null;
}

/**
 * County contacts data file structure
 */
export interface CountyContactsData {
  /** ISO timestamp of when the data was last updated */
  lastUpdated: string;
  /** Data source attribution */
  source: string;
  /** Default fallback URL for counties without specific URLs */
  defaultUrl: string;
  /** Counties keyed by county name */
  counties: Record<string, CountyContact>;
}
