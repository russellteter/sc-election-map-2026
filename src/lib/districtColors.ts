/**
 * District Color Utilities
 *
 * Centralized color scheme for district maps.
 * Used by both SVG DistrictMap and Leaflet GeoJSON layers.
 */

import type { District, DistrictElectionHistory } from '@/types/schema';

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
