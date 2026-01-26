/**
 * Lens-aware KPI calculations
 *
 * Returns different KPI arrays based on the active lens to show
 * relevant metrics for each visualization mode.
 */

import type { LensId } from '@/types/lens';
import type { District } from '@/types/schema';
import type { OpportunityData } from '@/lib/districtColors';

export interface KpiItem {
  label: string;
  value: number | string;
  description?: string;
  color?: string;
}

/**
 * Calculate KPIs for the incumbents lens
 */
function getIncumbentKpis(districts: District[]): KpiItem[] {
  let demSeats = 0;
  let repSeats = 0;
  let openSeats = 0;

  for (const district of districts) {
    const party = district.incumbent?.party;
    if (party === 'Democratic') {
      demSeats++;
    } else if (party === 'Republican') {
      repSeats++;
    } else if (!district.incumbent?.name) {
      openSeats++;
    }
  }

  return [
    { label: 'Dem Seats', value: demSeats, color: 'var(--party-dem)' },
    { label: 'Rep Seats', value: repSeats, color: 'var(--party-rep)' },
    { label: 'Open Seats', value: openSeats, color: 'var(--status-attention)' },
    { label: 'Total', value: districts.length },
  ];
}

/**
 * Calculate KPIs for the dem-filing lens
 */
function getDemFilingKpis(districts: District[]): KpiItem[] {
  let demFiled = 0;
  let needsCandidate = 0;

  for (const district of districts) {
    const hasDem = district.candidates.some(c => c.party?.toLowerCase() === 'democratic');
    const isDemIncumbent = district.incumbent?.party === 'Democratic';

    if (hasDem || isDemIncumbent) {
      demFiled++;
    } else {
      needsCandidate++;
    }
  }

  const coverage = districts.length > 0
    ? Math.round((demFiled / districts.length) * 100)
    : 0;

  return [
    { label: 'Dem Filed', value: demFiled, color: 'var(--party-dem)' },
    { label: 'Needs Candidate', value: needsCandidate, color: 'var(--status-attention)' },
    { label: 'Coverage', value: `${coverage}%` },
    { label: 'Total', value: districts.length },
  ];
}

/**
 * Calculate KPIs for the opportunity lens
 */
function getOpportunityKpis(
  districts: District[],
  opportunityData: Record<string, OpportunityData>
): KpiItem[] {
  let hot = 0;
  let warm = 0;
  let possible = 0;
  let defensive = 0;

  for (const district of districts) {
    const districtNum = district.districtNumber?.toString() ?? '';
    const opp = opportunityData[districtNum];

    if (opp) {
      switch (opp.tier) {
        case 'HOT': hot++; break;
        case 'WARM': warm++; break;
        case 'POSSIBLE': possible++; break;
        case 'DEFENSIVE': defensive++; break;
      }
    }
  }

  return [
    { label: 'Hot Zones', value: hot, color: 'var(--status-at-risk)', description: '≤5pt margin' },
    { label: 'Warm Zones', value: warm, color: 'var(--status-attention)', description: '6-10pt' },
    { label: 'Possible', value: possible, color: 'var(--status-attention-light)', description: '11-15pt' },
    { label: 'Defensive', value: defensive, color: 'var(--party-dem)', description: 'Dem-held' },
  ];
}

/**
 * Calculate KPIs for the battleground lens
 */
function getBattlegroundKpis(districts: District[]): KpiItem[] {
  let contested = 0;
  let demOnly = 0;
  let repOnly = 0;
  let noneFiled = 0;

  for (const district of districts) {
    const hasDem = district.candidates.some(c => c.party?.toLowerCase() === 'democratic');
    const hasRep = district.candidates.some(c => c.party?.toLowerCase() === 'republican');

    if (hasDem && hasRep) {
      contested++;
    } else if (hasDem) {
      demOnly++;
    } else if (hasRep) {
      repOnly++;
    } else {
      noneFiled++;
    }
  }

  return [
    { label: 'Contested', value: contested, color: 'var(--party-open)' },
    { label: 'Dem Only', value: demOnly, color: 'var(--party-dem)' },
    { label: 'Rep Only', value: repOnly, color: 'var(--party-rep)' },
    { label: 'None Filed', value: noneFiled, color: 'var(--text-disabled)' },
  ];
}

/**
 * Get KPIs for the active lens
 *
 * @param activeLens - The active lens ID
 * @param districts - Array of district data
 * @param opportunityData - Optional opportunity data (required for opportunity lens)
 */
export function getLensKpis(
  activeLens: LensId,
  districts: District[],
  opportunityData: Record<string, OpportunityData> = {}
): KpiItem[] {
  switch (activeLens) {
    case 'incumbents':
      return getIncumbentKpis(districts);
    case 'dem-filing':
      return getDemFilingKpis(districts);
    case 'opportunity':
      return getOpportunityKpis(districts, opportunityData);
    case 'battleground':
      return getBattlegroundKpis(districts);
  }
}

