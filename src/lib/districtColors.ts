/**
 * District Color Utilities
 *
 * Centralized color scheme for district maps.
 * Used by both SVG DistrictMap and Leaflet GeoJSON layers.
 *
 * Supports the 4-lens visualization system:
 * - incumbents: Traditional R/D incumbent display
 * - dem-filing: Blue coverage vs amber gaps
 * - opportunity: Heat map (HOT/WARM/POSSIBLE/LONG_SHOT/DEFENSIVE)
 * - battleground: Contested vs uncontested races
 */

import type { District, DistrictElectionHistory } from '@/types/schema';
import type { LensId } from '@/types/lens';

/**
 * District colors based on objective facts.
 * Dem-focused color scheme for Democratic campaign tool.
 */
export const DISTRICT_COLORS = {
  DEM_INCUMBENT: '#1E40AF',     // Solid blue - current rep is Democrat
  DEM_CHALLENGER: '#3B82F6',    // Medium blue - Dem filed (not incumbent)
  CLOSE_NO_DEM: 'url(#needs-candidate)', // Blue crosshatch - margin ≤15pts, no Dem
  SAFE_R: '#E5E7EB',            // Light gray - margin >15pts, no Dem
  NO_DATA: '#F3F4F6',           // Very light gray - no candidates/data
} as const;

/**
 * Solid colors for GeoJSON (patterns not supported in Leaflet)
 */
export const DISTRICT_COLORS_SOLID = {
  DEM_INCUMBENT: '#1E40AF',     // Solid blue
  DEM_CHALLENGER: '#3B82F6',    // Medium blue
  CLOSE_NO_DEM: '#93C5FD',      // Light blue (substitute for crosshatch)
  SAFE_R: '#E5E7EB',            // Light gray
  NO_DATA: '#F3F4F6',           // Very light gray
} as const;

/**
 * Congressional district colors based on party control
 */
export const CONGRESSIONAL_COLORS = {
  DEM: '#1E40AF',     // Blue - Democrat held
  REP: '#DC2626',     // Red - Republican held
  VACANT: '#9CA3AF',  // Gray - vacant/unknown
} as const;

/**
 * SC Congressional District Representatives (118th Congress)
 * CD-6 (Clyburn) is the only Democratic-held seat
 */
export const SC_CONGRESSIONAL_REPS: Record<string, { name: string; party: 'D' | 'R' }> = {
  '01': { name: 'Nancy Mace', party: 'R' },
  '02': { name: 'Joe Wilson', party: 'R' },
  '03': { name: 'Jeff Duncan', party: 'R' },
  '04': { name: 'William Timmons', party: 'R' },
  '05': { name: 'Ralph Norman', party: 'R' },
  '06': { name: 'Jim Clyburn', party: 'D' },
  '07': { name: 'Russell Fry', party: 'R' },
};

// Margin threshold for "close race" classification (percentage points)
export const CLOSE_RACE_MARGIN = 15;

// =============================================================================
// Multi-Lens Visualization Colors (Phase 18)
// =============================================================================

/**
 * Opportunity tier data structure (from opportunity.json)
 */
export interface OpportunityData {
  tier: 'HOT' | 'WARM' | 'POSSIBLE' | 'LONG_SHOT' | 'DEFENSIVE';
  opportunityScore: number;
  margin: number | null;
  flags: {
    needsCandidate: boolean;
    hasDemocrat: boolean;
    hasRepublican: boolean;
    isDefensive: boolean;
    isOpenSeat: boolean;
  };
}

/**
 * Color palettes for each lens visualization
 *
 * Design principles:
 * - Purple (#8B5CF6) for neutral/open seats (replaces amber)
 * - Blue (#1E40AF) for Democratic
 * - Red (#DC2626) for Republican
 * - Purple gradient for opportunity tiers (HOT→POSSIBLE)
 * - All colors WCAG AA compliant
 */
export const LENS_COLORS = {
  /**
   * Incumbents Lens (default)
   * Shows current party control of each district
   * WCAG AA compliant: Open Seat updated from #8B5CF6 (3.1:1) to #7C3AED (4.6:1)
   */
  incumbents: {
    DEM_INCUMBENT: '#1E40AF',     // Dark blue - Dem holds seat
    REP_INCUMBENT: '#DC2626',     // Red - Rep holds seat
    OPEN_SEAT: '#7C3AED',         // Vivid violet - Open seat (WCAG AA: 4.6:1)
    UNKNOWN: '#D1D5DB',           // Light gray - No data
  },

  /**
   * Dem Filing Lens
   * Shows Democratic candidate coverage vs gaps
   */
  'dem-filing': {
    DEM_FILED: '#1E40AF',         // Dark blue - Dem candidate filed
    DEM_INCUMBENT: '#3B82F6',     // Medium blue - Dem incumbent (may not have filed)
    PRIORITY_GAP: '#9333EA',      // Vivid purple - No Dem, margin ≤15pts (urgent)
    OPPORTUNITY: '#A78BFA',       // Light purple - No Dem, margin ≤10pts
    SAFE_R: '#E5E7EB',            // Light gray - No Dem, margin >15pts
  },

  /**
   * Opportunity Lens
   * Heat map showing strategic opportunity tiers
   * Uses purple gradient with improved WCAG contrast differentiation
   * HOT→WARM→POSSIBLE clearly distinguishable
   */
  opportunity: {
    HOT: '#6D28D9',               // Deep violet - Top priority (≤5pt margin) - WCAG AA
    WARM: '#8B5CF6',              // Medium purple - Strong opportunity (6-10pt)
    POSSIBLE: '#C4B5FD',          // Light lavender - Worth watching (11-15pt)
    LONG_SHOT: '#9CA3AF',         // Gray - Unlikely flip (>15pt)
    DEFENSIVE: '#1E40AF',         // Blue - Dem-held seat to protect
  },

  /**
   * Battleground Lens
   * Shows contested vs uncontested races
   * WCAG AA compliant colors
   */
  battleground: {
    CONTESTED: '#7C3AED',         // Vivid violet - Both D and R filed (WCAG AA)
    DEM_ONLY: '#3B82F6',          // Blue - Only Dem filed
    REP_ONLY: '#EF4444',          // Red - Only Rep filed
    NONE_FILED: '#E5E7EB',        // Gray - No candidates filed
  },
} as const;

/**
 * Category types for each lens
 */
export type IncumbentCategory = 'DEM_INCUMBENT' | 'REP_INCUMBENT' | 'OPEN_SEAT' | 'UNKNOWN';
export type DemFilingCategory = 'DEM_FILED' | 'DEM_INCUMBENT' | 'PRIORITY_GAP' | 'OPPORTUNITY' | 'SAFE_R';
export type OpportunityCategory = 'HOT' | 'WARM' | 'POSSIBLE' | 'LONG_SHOT' | 'DEFENSIVE';
export type BattlegroundCategory = 'CONTESTED' | 'DEM_ONLY' | 'REP_ONLY' | 'NONE_FILED';

/**
 * Union type for all category types
 */
export type DistrictCategory = IncumbentCategory | DemFilingCategory | OpportunityCategory | BattlegroundCategory;

/**
 * Get district category based on the active lens
 *
 * @param district - District data from candidates.json
 * @param electionHistory - Election history from elections.json
 * @param opportunityData - Opportunity data from opportunity.json (optional)
 * @param lensId - Active lens ID
 */
export function getDistrictCategory(
  district: District | undefined,
  electionHistory: DistrictElectionHistory | undefined,
  opportunityData: OpportunityData | undefined,
  lensId: LensId
): DistrictCategory {
  // No district data
  if (!district) {
    switch (lensId) {
      case 'incumbents':
        return 'UNKNOWN';
      case 'dem-filing':
        return 'SAFE_R';
      case 'opportunity':
        return 'LONG_SHOT';
      case 'battleground':
        return 'NONE_FILED';
    }
  }

  const incumbentParty = district.incumbent?.party;
  const isDemIncumbent = incumbentParty === 'Democratic';
  const isRepIncumbent = incumbentParty === 'Republican';
  const hasIncumbent = !!district.incumbent?.name;

  const hasDemCandidate = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const hasRepCandidate = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  // Get margin from election history
  const lastElection = electionHistory?.elections?.['2024']
    || electionHistory?.elections?.['2022']
    || electionHistory?.elections?.['2020'];
  const margin = lastElection?.margin ?? 100;

  switch (lensId) {
    case 'incumbents':
      if (isDemIncumbent) return 'DEM_INCUMBENT';
      if (isRepIncumbent) return 'REP_INCUMBENT';
      if (!hasIncumbent) return 'OPEN_SEAT';
      return 'UNKNOWN';

    case 'dem-filing':
      if (hasDemCandidate) return 'DEM_FILED';
      if (isDemIncumbent) return 'DEM_INCUMBENT';
      if (margin <= 10) return 'OPPORTUNITY';
      if (margin <= 15) return 'PRIORITY_GAP';
      return 'SAFE_R';

    case 'opportunity':
      // Use opportunity.json data if available
      if (opportunityData) {
        return opportunityData.tier;
      }
      // Fallback calculation
      if (isDemIncumbent) return 'DEFENSIVE';
      if (margin <= 5) return 'HOT';
      if (margin <= 10) return 'WARM';
      if (margin <= 15) return 'POSSIBLE';
      return 'LONG_SHOT';

    case 'battleground':
      if (hasDemCandidate && hasRepCandidate) return 'CONTESTED';
      if (hasDemCandidate) return 'DEM_ONLY';
      if (hasRepCandidate) return 'REP_ONLY';
      return 'NONE_FILED';
  }
}

/**
 * Get fill color for a district based on the active lens
 *
 * This is the primary function for lens-aware coloring.
 *
 * @param district - District data from candidates.json
 * @param electionHistory - Election history from elections.json
 * @param opportunityData - Opportunity data from opportunity.json (optional)
 * @param lensId - Active lens ID (defaults to 'incumbents')
 * @param useSolidColors - Use solid colors for Leaflet (no patterns)
 */
export function getDistrictFillColorWithLens(
  district: District | undefined,
  electionHistory: DistrictElectionHistory | undefined,
  opportunityData: OpportunityData | undefined,
  lensId: LensId = 'incumbents',
  useSolidColors = false
): string {
  const category = getDistrictCategory(district, electionHistory, opportunityData, lensId);

  // Get color from the appropriate lens palette
  switch (lensId) {
    case 'incumbents':
      return LENS_COLORS.incumbents[category as IncumbentCategory] ?? LENS_COLORS.incumbents.UNKNOWN;

    case 'dem-filing':
      // Use pattern for OPPORTUNITY unless solid colors requested
      if (category === 'OPPORTUNITY' && !useSolidColors) {
        return 'url(#opportunity-pattern)';
      }
      return LENS_COLORS['dem-filing'][category as DemFilingCategory] ?? LENS_COLORS['dem-filing'].SAFE_R;

    case 'opportunity':
      return LENS_COLORS.opportunity[category as OpportunityCategory] ?? LENS_COLORS.opportunity.LONG_SHOT;

    case 'battleground':
      return LENS_COLORS.battleground[category as BattlegroundCategory] ?? LENS_COLORS.battleground.NONE_FILED;
  }
}

/**
 * Get category label for accessibility/tooltips
 */
export function getCategoryLabel(category: DistrictCategory, lensId: LensId): string {
  const labels: Record<LensId, Record<string, string>> = {
    incumbents: {
      DEM_INCUMBENT: 'Democratic incumbent',
      REP_INCUMBENT: 'Republican incumbent',
      OPEN_SEAT: 'Open seat',
      UNKNOWN: 'Unknown',
    },
    'dem-filing': {
      DEM_FILED: 'Democratic candidate filed',
      DEM_INCUMBENT: 'Democratic incumbent',
      PRIORITY_GAP: 'Priority gap (no Dem, ≤15pt margin)',
      OPPORTUNITY: 'Opportunity (no Dem, ≤10pt margin)',
      SAFE_R: 'Safe Republican',
    },
    opportunity: {
      HOT: 'Hot zone (≤5pt margin)',
      WARM: 'Warm zone (6-10pt margin)',
      POSSIBLE: 'Possible (11-15pt margin)',
      LONG_SHOT: 'Long shot (>15pt margin)',
      DEFENSIVE: 'Defensive (Dem-held)',
    },
    battleground: {
      CONTESTED: 'Contested (D & R filed)',
      DEM_ONLY: 'Democrat only',
      REP_ONLY: 'Republican only',
      NONE_FILED: 'No candidates filed',
    },
  };

  return labels[lensId][category] ?? category;
}

/**
 * Get fill color for a state legislative district (House/Senate)
 */
export function getDistrictFillColor(
  district: District | undefined,
  electionHistory: DistrictElectionHistory | undefined,
  useSolidColors = false
): string {
  const colors = useSolidColors ? DISTRICT_COLORS_SOLID : DISTRICT_COLORS;

  // No district data
  if (!district) {
    return colors.NO_DATA;
  }

  const isDemIncumbent = district.incumbent?.party === 'Democratic';
  const hasDemCandidate = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );

  // 1. Dem Incumbent - Solid blue (highest priority)
  if (isDemIncumbent) {
    return colors.DEM_INCUMBENT;
  }

  // 2. Dem Challenger Filed (not incumbent)
  if (hasDemCandidate) {
    return colors.DEM_CHALLENGER;
  }

  // 3. No Dem - check last election margin
  const lastElection = electionHistory?.elections?.['2024']
    || electionHistory?.elections?.['2022']
    || electionHistory?.elections?.['2020'];

  const margin = lastElection?.margin ?? 100;

  if (margin <= CLOSE_RACE_MARGIN) {
    return colors.CLOSE_NO_DEM;
  }

  // 4. Safe R seat
  return colors.SAFE_R;
}

/**
 * Get fill color for a Congressional district
 */
export function getCongressionalFillColor(districtId: string): string {
  const rep = SC_CONGRESSIONAL_REPS[districtId];
  if (!rep) {
    return CONGRESSIONAL_COLORS.VACANT;
  }
  return rep.party === 'D' ? CONGRESSIONAL_COLORS.DEM : CONGRESSIONAL_COLORS.REP;
}

/**
 * Get status label for a district (accessibility)
 */
export function getDistrictStatusLabel(
  district: District | undefined,
  electionHistory: DistrictElectionHistory | undefined
): string {
  if (!district) {
    return 'No data available';
  }

  const isDemIncumbent = district.incumbent?.party === 'Democratic';
  const hasDemCandidate = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const candidateCount = district.candidates.length;

  if (isDemIncumbent) {
    if (candidateCount === 0) {
      return 'Dem incumbent, no candidates filed yet';
    }
    return `Dem incumbent, ${candidateCount} candidate${candidateCount === 1 ? '' : 's'} filed`;
  }

  if (hasDemCandidate) {
    return `${candidateCount} candidate${candidateCount === 1 ? '' : 's'}, Dem challenger filed`;
  }

  const lastElection = electionHistory?.elections?.['2024']
    || electionHistory?.elections?.['2022']
    || electionHistory?.elections?.['2020'];

  if (candidateCount === 0) {
    if (lastElection && lastElection.margin <= CLOSE_RACE_MARGIN) {
      return `No candidates filed, close race (${lastElection.margin.toFixed(0)}pt margin)`;
    }
    return 'No candidates filed';
  }

  if (lastElection && lastElection.margin <= CLOSE_RACE_MARGIN) {
    return `${candidateCount} candidate${candidateCount === 1 ? '' : 's'}, no Dem yet (${lastElection.margin.toFixed(0)}pt margin)`;
  }

  return `${candidateCount} candidate${candidateCount === 1 ? '' : 's'}, no Dem filed`;
}

/**
 * Get stroke color for districts (selection state)
 */
export function getDistrictStrokeColor(isSelected: boolean): string {
  return isSelected ? 'var(--class-purple, #4739E7)' : 'var(--map-stroke, #374151)';
}

/**
 * Get stroke width for districts (selection state)
 */
export function getDistrictStrokeWidth(isSelected: boolean): number {
  return isSelected ? 2.5 : 0.5;
}

// =============================================================================
// Scenario Simulator Colors (Phase 15-01)
// =============================================================================

/**
 * Scenario status for a district flip
 */
export type ScenarioStatus = 'baseline' | 'flipped-dem' | 'flipped-rep' | 'tossup';

/**
 * Colors for scenario simulator mode
 * These overlay/replace base colors when scenario mode is active
 */
export const SCENARIO_COLORS = {
  // Flipped to Democrat (was R, now D in scenario)
  FLIPPED_DEM: '#2563EB',           // Bright blue
  FLIPPED_DEM_PATTERN: 'url(#flipped-dem-pattern)',

  // Flipped to Republican (was D, now R in scenario)
  FLIPPED_REP: '#DC2626',           // Bright red
  FLIPPED_REP_PATTERN: 'url(#flipped-rep-pattern)',

  // Toss-up (competitive, uncertain)
  TOSSUP: '#8B5CF6',                // Purple
  TOSSUP_PATTERN: 'url(#tossup-pattern)',

  // Current control colors for scenario baseline
  DEM_HELD: '#1E40AF',              // Solid blue (current D)
  REP_HELD: '#B91C1C',              // Solid red (current R)
} as const;

/**
 * Get fill color for a district in scenario mode
 *
 * @param baselineParty - Current actual party control ('D' or 'R')
 * @param scenarioStatus - Scenario flip status
 * @param useSolidColors - Whether to use solid colors (for Leaflet) vs patterns
 */
export function getScenarioFillColor(
  baselineParty: 'D' | 'R' | null,
  scenarioStatus: ScenarioStatus,
  useSolidColors = false
): string {
  // No change from baseline
  if (scenarioStatus === 'baseline') {
    if (baselineParty === 'D') return SCENARIO_COLORS.DEM_HELD;
    if (baselineParty === 'R') return SCENARIO_COLORS.REP_HELD;
    return DISTRICT_COLORS.NO_DATA;
  }

  // Flipped states
  if (scenarioStatus === 'flipped-dem') {
    return useSolidColors ? SCENARIO_COLORS.FLIPPED_DEM : SCENARIO_COLORS.FLIPPED_DEM_PATTERN;
  }

  if (scenarioStatus === 'flipped-rep') {
    return useSolidColors ? SCENARIO_COLORS.FLIPPED_REP : SCENARIO_COLORS.FLIPPED_REP_PATTERN;
  }

  if (scenarioStatus === 'tossup') {
    return useSolidColors ? SCENARIO_COLORS.TOSSUP : SCENARIO_COLORS.TOSSUP_PATTERN;
  }

  // Fallback
  return DISTRICT_COLORS.NO_DATA;
}

/**
 * Calculate seat counts for baseline and scenario
 */
export interface SeatCount {
  dem: number;
  rep: number;
  tossup: number;
}

/**
 * Get human-readable label for scenario status
 */
export function getScenarioStatusLabel(
  baselineParty: 'D' | 'R' | null,
  scenarioStatus: ScenarioStatus
): string {
  if (scenarioStatus === 'baseline') {
    if (baselineParty === 'D') return 'Dem-held (baseline)';
    if (baselineParty === 'R') return 'Rep-held (baseline)';
    return 'No data';
  }

  if (scenarioStatus === 'flipped-dem') {
    return 'Flipped to Democrat';
  }

  if (scenarioStatus === 'flipped-rep') {
    return 'Flipped to Republican';
  }

  if (scenarioStatus === 'tossup') {
    return 'Toss-up';
  }

  return 'Unknown';
}

// =============================================================================
// Historical Comparison Colors (Phase 15-02)
// =============================================================================

/**
 * Colors for historical margin comparison (diverging scale)
 * Blue = improving for Democrats, Red = worsening for Democrats
 */
export const HISTORICAL_DELTA_COLORS = {
  // Strong Dem improvement (+10pts or more)
  DEM_STRONG: '#1E40AF',
  // Moderate Dem improvement (+5 to +10pts)
  DEM_MODERATE: '#3B82F6',
  // Slight Dem improvement (+2 to +5pts)
  DEM_SLIGHT: '#93C5FD',
  // Stable (-2 to +2pts)
  STABLE: '#9CA3AF',
  // Slight Rep improvement (-2 to -5pts)
  REP_SLIGHT: '#FCA5A5',
  // Moderate Rep improvement (-5 to -10pts)
  REP_MODERATE: '#EF4444',
  // Strong Rep improvement (-10pts or more)
  REP_STRONG: '#B91C1C',
} as const;

/**
 * Get fill color for historical margin delta
 *
 * @param delta - Margin change (positive = Dem improved, negative = Rep improved)
 */
export function getHistoricalDeltaColor(delta: number): string {
  if (delta >= 10) return HISTORICAL_DELTA_COLORS.DEM_STRONG;
  if (delta >= 5) return HISTORICAL_DELTA_COLORS.DEM_MODERATE;
  if (delta >= 2) return HISTORICAL_DELTA_COLORS.DEM_SLIGHT;
  if (delta >= -2) return HISTORICAL_DELTA_COLORS.STABLE;
  if (delta >= -5) return HISTORICAL_DELTA_COLORS.REP_SLIGHT;
  if (delta >= -10) return HISTORICAL_DELTA_COLORS.REP_MODERATE;
  return HISTORICAL_DELTA_COLORS.REP_STRONG;
}

/**
 * Get label for historical margin delta
 */
export function getHistoricalDeltaLabel(delta: number): string {
  const absValue = Math.abs(delta).toFixed(1);
  if (delta >= 2) return `+${absValue}pt Dem`;
  if (delta <= -2) return `+${absValue}pt Rep`;
  return 'Stable';
}

// =============================================================================
// Resource Allocation Heatmap Colors (Phase 15-04)
// =============================================================================

/**
 * Resource allocation intensity level
 */
export type ResourceIntensity = 'hot' | 'warm' | 'cool' | 'none';

/**
 * Colors for resource allocation heatmap overlay
 * Three-tier intensity system for investment prioritization
 * Purple-based palette for consistency
 */
export const RESOURCE_HEATMAP_COLORS = {
  // Hot - Invest heavily (high ROI opportunities)
  HOT: 'rgba(124, 58, 237, 0.65)',       // Semi-transparent vivid violet
  HOT_BORDER: '#7C3AED',

  // Warm - Maintain current investment
  WARM: 'rgba(147, 51, 234, 0.55)',      // Semi-transparent purple
  WARM_BORDER: '#9333EA',

  // Cool - Deprioritize (low ROI)
  COOL: 'rgba(59, 130, 246, 0.35)',      // Semi-transparent blue
  COOL_BORDER: '#3B82F6',

  // No overlay (district excluded from analysis)
  NONE: 'transparent',
} as const;

/**
 * Score thresholds for resource intensity classification
 */
export const RESOURCE_THRESHOLDS = {
  HOT_MIN: 70,    // Scores 70+ = Hot (high priority investment)
  WARM_MIN: 45,   // Scores 45-69 = Warm (maintain)
  // Below 45 = Cool (deprioritize)
} as const;

/**
 * Get fill color for resource allocation heatmap overlay
 *
 * @param intensity - Resource allocation intensity level
 */
export function getResourceHeatmapColor(intensity: ResourceIntensity): string {
  switch (intensity) {
    case 'hot':
      return RESOURCE_HEATMAP_COLORS.HOT;
    case 'warm':
      return RESOURCE_HEATMAP_COLORS.WARM;
    case 'cool':
      return RESOURCE_HEATMAP_COLORS.COOL;
    default:
      return RESOURCE_HEATMAP_COLORS.NONE;
  }
}

/**
 * Get border color for resource allocation heatmap
 */
export function getResourceHeatmapBorderColor(intensity: ResourceIntensity): string {
  switch (intensity) {
    case 'hot':
      return RESOURCE_HEATMAP_COLORS.HOT_BORDER;
    case 'warm':
      return RESOURCE_HEATMAP_COLORS.WARM_BORDER;
    case 'cool':
      return RESOURCE_HEATMAP_COLORS.COOL_BORDER;
    default:
      return 'transparent';
  }
}

/**
 * Get intensity level from composite score
 *
 * @param score - Composite resource allocation score (0-100)
 */
export function getResourceIntensity(score: number): ResourceIntensity {
  if (score >= RESOURCE_THRESHOLDS.HOT_MIN) return 'hot';
  if (score >= RESOURCE_THRESHOLDS.WARM_MIN) return 'warm';
  if (score > 0) return 'cool';
  return 'none';
}

/**
 * Get human-readable label for resource intensity
 */
export function getResourceIntensityLabel(intensity: ResourceIntensity): string {
  switch (intensity) {
    case 'hot':
      return 'High Priority';
    case 'warm':
      return 'Maintain';
    case 'cool':
      return 'Deprioritize';
    default:
      return 'N/A';
  }
}
