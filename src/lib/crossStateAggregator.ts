/**
 * Cross-State Aggregator
 *
 * Utilities for comparing electoral data across multiple states.
 */

import type { CandidatesData, Chamber } from '@/types/schema';

/**
 * State summary statistics
 */
export interface StateSummary {
  stateCode: string;
  stateName: string;
  chamber: Chamber;
  totalDistricts: number;
  demIncumbents: number;
  repIncumbents: number;
  demChallengers: number;
  contested: number;
  uncontested: number;
  openSeats: number;
  demCoverage: number; // Percentage of districts with Dem candidate
  competitiveDistricts: number; // Close margins
}

/**
 * Cross-state comparison data
 */
export interface CrossStateComparison {
  states: StateSummary[];
  totals: {
    totalDistricts: number;
    totalDemIncumbents: number;
    totalRepIncumbents: number;
    totalContested: number;
    avgDemCoverage: number;
  };
  rankings: {
    byCoverage: StateSummary[];
    byCompetitive: StateSummary[];
    byOpenSeats: StateSummary[];
  };
}

/**
 * State configuration type (minimal version for aggregator)
 */
export interface StateConfigMinimal {
  code: string;
  name: string;
  chambers: {
    house: { count: number; name: string };
    senate: { count: number; name: string };
  };
}

/**
 * Calculate summary statistics for a single state/chamber
 */
export function calculateStateSummary(
  stateCode: string,
  stateName: string,
  chamber: Chamber,
  candidatesData: CandidatesData | null
): StateSummary {
  const summary: StateSummary = {
    stateCode,
    stateName,
    chamber,
    totalDistricts: 0,
    demIncumbents: 0,
    repIncumbents: 0,
    demChallengers: 0,
    contested: 0,
    uncontested: 0,
    openSeats: 0,
    demCoverage: 0,
    competitiveDistricts: 0,
  };

  if (!candidatesData) return summary;

  const districts = candidatesData[chamber];
  summary.totalDistricts = Object.keys(districts).length;

  let demPresent = 0;

  for (const [, district] of Object.entries(districts)) {
    const hasDem = district.candidates.some(
      (c) => c.party?.toLowerCase() === 'democratic'
    );
    const hasRep = district.candidates.some(
      (c) => c.party?.toLowerCase() === 'republican'
    );
    const isDemIncumbent = district.incumbent?.party === 'Democratic';
    const isRepIncumbent = district.incumbent?.party === 'Republican';

    // Count incumbents
    if (isDemIncumbent) summary.demIncumbents++;
    if (isRepIncumbent) summary.repIncumbents++;

    // Count Dem presence
    if (hasDem || isDemIncumbent) {
      demPresent++;
      if (!isDemIncumbent && hasDem) {
        summary.demChallengers++;
      }
    }

    // Count contested vs uncontested
    if (hasDem && hasRep) {
      summary.contested++;
    } else if (district.candidates.length > 0) {
      summary.uncontested++;
    }

    // Count open seats (no incumbent)
    if (!district.incumbent) {
      summary.openSeats++;
    }
  }

  summary.demCoverage = summary.totalDistricts > 0
    ? (demPresent / summary.totalDistricts) * 100
    : 0;

  return summary;
}

/**
 * Aggregate comparison data across multiple states
 */
export function aggregateCrossStateComparison(
  states: { code: string; name: string; data: CandidatesData | null }[],
  chamber: Chamber
): CrossStateComparison {
  const summaries = states.map((s) =>
    calculateStateSummary(s.code, s.name, chamber, s.data)
  );

  // Calculate totals
  const totals = {
    totalDistricts: summaries.reduce((a, s) => a + s.totalDistricts, 0),
    totalDemIncumbents: summaries.reduce((a, s) => a + s.demIncumbents, 0),
    totalRepIncumbents: summaries.reduce((a, s) => a + s.repIncumbents, 0),
    totalContested: summaries.reduce((a, s) => a + s.contested, 0),
    avgDemCoverage: summaries.length > 0
      ? summaries.reduce((a, s) => a + s.demCoverage, 0) / summaries.length
      : 0,
  };

  // Create rankings
  const rankings = {
    byCoverage: [...summaries].sort((a, b) => b.demCoverage - a.demCoverage),
    byCompetitive: [...summaries].sort((a, b) => b.contested - a.contested),
    byOpenSeats: [...summaries].sort((a, b) => b.openSeats - a.openSeats),
  };

  return {
    states: summaries,
    totals,
    rankings,
  };
}

/**
 * Get comparison metric value
 */
export type ComparisonMetric =
  | 'demCoverage'
  | 'contested'
  | 'openSeats'
  | 'demIncumbents'
  | 'totalDistricts';

export function getMetricValue(
  summary: StateSummary,
  metric: ComparisonMetric
): number {
  return summary[metric];
}

/**
 * Get metric display configuration
 */
export function getMetricConfig(metric: ComparisonMetric): {
  label: string;
  format: (value: number) => string;
  color: string;
} {
  switch (metric) {
    case 'demCoverage':
      return {
        label: 'Dem Coverage',
        format: (v) => `${v.toFixed(0)}%`,
        color: '#3B82F6',
      };
    case 'contested':
      return {
        label: 'Contested Races',
        format: (v) => String(v),
        color: '#059669',
      };
    case 'openSeats':
      return {
        label: 'Open Seats',
        format: (v) => String(v),
        color: '#F59E0B',
      };
    case 'demIncumbents':
      return {
        label: 'Dem Incumbents',
        format: (v) => String(v),
        color: '#1E40AF',
      };
    case 'totalDistricts':
      return {
        label: 'Total Districts',
        format: (v) => String(v),
        color: '#6B7280',
      };
  }
}
