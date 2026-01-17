/**
 * State Configuration Types
 * Defines the structure for multi-state election intelligence platform
 */

export interface ChamberConfig {
  /** Display name (e.g., "House of Representatives", "State Assembly") */
  name: string;
  /** Short name for URLs and compact displays (e.g., "house", "assembly") */
  shortName: string;
  /** Number of districts in this chamber */
  count: number;
  /** Term length in years */
  termYears: number;
}

export interface StateConfig {
  /** Two-letter state code (e.g., "SC", "NC") */
  code: string;
  /** Full state name (e.g., "South Carolina") */
  name: string;
  /** Abbreviated name with periods (e.g., "S.C.") */
  abbrev: string;
  /** FIPS state code (e.g., "45" for SC) */
  fipsCode: string;

  /** Legislative chamber configurations */
  chambers: {
    house: ChamberConfig;
    senate: ChamberConfig;
  };

  /** Geographic bounding box for map displays */
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };

  /** Data source configuration for this state */
  dataSources: {
    /** Candidate data: "live" uses real API, "demo" uses generated data */
    candidates: "live" | "demo";
    /** Voter intelligence: "live" uses TargetSmart, "demo" uses generated data */
    voterIntelligence: "live" | "demo";
  };

  /** Relevant URLs for this state */
  urls: {
    /** State ethics/disclosure commission URL */
    ethicsCommission?: string;
    /** State election commission URL */
    electionCommission?: string;
    /** State Democratic party URL */
    stateParty?: string;
    /** Legislature official website */
    legislature?: string;
  };

  /** 2024 election baseline data for opportunity calculations */
  baseline2024?: {
    /** Presidential margin (positive = D, negative = R) */
    presidentialMargin: number;
    /** Total registered voters */
    registeredVoters: number;
    /** Voter registration breakdown */
    registration: {
      democratic: number;
      republican: number;
      independent: number;
      other: number;
    };
  };

  /** Important election dates for this state */
  electionDates?: {
    /** Primary election date */
    primaryDate?: string;
    /** General election date */
    generalDate?: string;
    /** Voter registration deadline */
    registrationDeadline?: string;
    /** Early voting start date */
    earlyVotingStart?: string;
    /** Early voting end date */
    earlyVotingEnd?: string;
  };

  /** Whether this state is fully activated (has data) */
  isActive: boolean;

  /** Display order for sorting states */
  displayOrder?: number;
}

/**
 * Minimal state info for inactive/placeholder states
 */
export interface InactiveStateConfig {
  code: string;
  name: string;
  isActive: false;
  displayOrder?: number;
}

/**
 * Union type for all state configurations
 */
export type AnyStateConfig = StateConfig | InactiveStateConfig;

/**
 * Map of all state configurations keyed by state code
 */
export type StateConfigMap = Record<string, AnyStateConfig>;

/**
 * Helper type guard to check if a state config is active
 */
export function isActiveState(config: AnyStateConfig): config is StateConfig {
  return config.isActive === true;
}
