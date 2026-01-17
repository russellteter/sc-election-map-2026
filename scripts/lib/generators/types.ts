/**
 * Types for Demo Data Generation
 */

export interface Candidate {
  name: string;
  party: 'Democratic' | 'Republican' | null;
  status: 'filed' | 'announced' | 'rumored';
  filedDate?: string;
  isIncumbent: boolean;
  source: 'demo';
}

export interface Incumbent {
  name: string;
  party: 'Democratic' | 'Republican';
  yearsInOffice?: number;
}

export interface District {
  districtNumber: number;
  candidates: Candidate[];
  incumbent: Incumbent | null;
}

export interface ElectionResult {
  year: number;
  totalVotes: number;
  winner: {
    name: string;
    party: 'Democratic' | 'Republican';
    votes: number;
    percentage: number;
  };
  margin: number;
  marginVotes: number;
  uncontested: boolean;
  dem_pct: number;
  rep_pct: number;
}

export interface DistrictElectionHistory {
  districtNumber: number;
  elections: Record<string, ElectionResult>;
  competitiveness: {
    score: number;
    avgMargin: number;
    hasSwung: boolean;
    contestedRaces: number;
    dominantParty: 'Democratic' | 'Republican';
  };
}

export interface VoterIntelligenceProfile {
  districtNumber: number;
  registeredVoters: number;
  turnout2024: number;
  turnout2022: number;
  turnout2020: number;
  registration: {
    democratic: number;
    republican: number;
    independent: number;
    other: number;
  };
  demographics: {
    medianAge: number;
    collegeEducated: number;
    urbanization: 'urban' | 'suburban' | 'rural';
    diversityIndex: number;
  };
  trends: {
    registrationTrend: number; // Positive = growing D registration
    turnoutTrend: number;
    demographicShift: number;
  };
}

export interface OpportunityScore {
  districtNumber: number;
  overallScore: number; // 0-100
  factors: {
    marginFactor: number;
    registrationFactor: number;
    turnoutGapFactor: number;
    demographicFactor: number;
    incumbentFactor: number;
  };
  category: 'HIGH_OPPORTUNITY' | 'EMERGING' | 'DEFENSIVE' | 'LONG_SHOT' | 'SAFE_R';
  recommendation: string;
}

export interface MobilizationData {
  districtNumber: number;
  universe: {
    totalTargets: number;
    lowPropensityDems: number;
    persuadables: number;
    registrationTargets: number;
  };
  projectedTurnout: {
    baseline: number;
    withMobilization: number;
    lift: number;
  };
  contactStrategy: string;
}

export interface StateConfig {
  code: string;
  name: string;
  chambers: {
    house: { count: number };
    senate: { count: number };
  };
  // Baseline politics
  presidentialMargin2024: number; // Positive = D, Negative = R
  baselinePartisanship: number; // -1 to 1 scale
}

export interface Endorsement {
  name: string;
  type: 'organization' | 'elected_official' | 'labor' | 'advocacy' | 'newspaper';
  party: 'Democratic' | 'Republican' | 'nonpartisan';
  endorsee: string; // Candidate name
  endorseeParty: 'Democratic' | 'Republican';
  date: string;
  weight: number; // 1-5 scale for importance
}

export interface EndorsementData {
  districtNumber: number;
  chamber: 'house' | 'senate';
  endorsements: Endorsement[];
  totals: {
    democratic: number;
    republican: number;
    highProfile: number; // Weight >= 4
  };
}

export interface DailyVoteCount {
  date: string;
  count: number;
}

export interface PartyBallots {
  total: number;
  democratic: number;
  republican: number;
  other: number;
  byDate: DailyVoteCount[];
}

export interface EarlyVoteData {
  districtNumber: number;
  chamber: 'house' | 'senate';
  ballotsRequested: PartyBallots;
  ballotsReturned: PartyBallots;
  earlyInPerson: {
    total: number;
    byDate: DailyVoteCount[];
  } | null;
  lastUpdated: string;
}
