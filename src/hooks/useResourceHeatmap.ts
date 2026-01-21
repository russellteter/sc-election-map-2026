'use client';

import { useMemo, useState, useCallback } from 'react';
import type { CandidatesData, ElectionsData, Chamber, District, DistrictElectionHistory } from '@/types/schema';
import { getResourceIntensity, type ResourceIntensity } from '@/lib/districtColors';

/**
 * Resource allocation data for a single district
 */
export interface ResourceAllocation {
  districtNumber: number;
  chamber: Chamber;
  /** Composite resource allocation score (0-100) */
  compositeScore: number;
  /** Resource intensity level */
  intensity: ResourceIntensity;
  /** Individual factor scores */
  factors: {
    /** Opportunity score (based on competitiveness) */
    opportunity: number;
    /** Mobilization potential (based on turnout patterns) */
    mobilization: number;
    /** Donor capacity estimate (based on district characteristics) */
    donorCapacity: number;
    /** Trending indicator (margin improvement) */
    trending: number;
  };
  /** Is this an open seat? */
  isOpenSeat: boolean;
  /** Has Democratic candidate filed? */
  hasDemCandidate: boolean;
  /** Last election margin */
  lastMargin: number | null;
  /** Incumbent info */
  incumbent: District['incumbent'];
}

/**
 * Summary statistics for resource heatmap
 */
export interface ResourceHeatmapSummary {
  /** Total districts analyzed */
  totalDistricts: number;
  /** Hot intensity districts */
  hotDistricts: number;
  /** Warm intensity districts */
  warmDistricts: number;
  /** Cool intensity districts */
  coolDistricts: number;
  /** Average composite score */
  avgScore: number;
  /** Districts with Dem candidates in hot zones */
  demCandidatesInHotZones: number;
  /** Open seats in hot zones */
  openSeatsInHotZones: number;
}

/**
 * Filter options for resource heatmap
 */
export interface ResourceHeatmapFilters {
  /** Minimum composite score */
  minScore?: number;
  /** Maximum composite score */
  maxScore?: number;
  /** Filter by intensity level */
  intensities?: ResourceIntensity[];
  /** Only show districts with Dem candidates */
  demCandidatesOnly?: boolean;
  /** Only show open seats */
  openSeatsOnly?: boolean;
}

/**
 * Options for useResourceHeatmap hook
 */
export interface UseResourceHeatmapOptions {
  chamber: Chamber;
  candidatesData: CandidatesData;
  electionsData: ElectionsData | null;
  /** Initial filter settings */
  initialFilters?: ResourceHeatmapFilters;
}

/**
 * Return type for useResourceHeatmap hook
 */
export interface UseResourceHeatmapReturn {
  /** All allocations, sorted by composite score */
  allocations: ResourceAllocation[];
  /** Filtered allocations based on current filters */
  filteredAllocations: ResourceAllocation[];
  /** Summary statistics */
  summary: ResourceHeatmapSummary;
  /** Current filters */
  filters: ResourceHeatmapFilters;
  /** Update filters */
  setFilters: (filters: ResourceHeatmapFilters) => void;
  /** Set of district numbers by intensity (for map overlay) */
  districtsByIntensity: {
    hot: Set<number>;
    warm: Set<number>;
    cool: Set<number>;
  };
  /** Get allocation for a specific district */
  getAllocation: (districtNumber: number) => ResourceAllocation | null;
  /** Export allocations as CSV data */
  exportCSV: () => string;
  /** Whether there's data to display */
  hasData: boolean;
}

/**
 * Factor weights for composite score calculation
 * Total: 100%
 */
const FACTOR_WEIGHTS = {
  opportunity: 0.40,    // 40% - Competitiveness/opportunity
  mobilization: 0.30,   // 30% - Mobilization potential
  donorCapacity: 0.15,  // 15% - Donor capacity
  trending: 0.15,       // 15% - Trending direction
} as const;

/**
 * Calculate opportunity score (0-100)
 * Based on competitiveness and open seat status
 */
function calculateOpportunityScore(
  district: District,
  electionHistory: DistrictElectionHistory | undefined
): number {
  let score = 0;

  // Base competitiveness score
  if (electionHistory?.competitiveness) {
    score += electionHistory.competitiveness.score * 0.6;
  }

  // Margin bonus
  const lastElection = electionHistory?.elections?.['2024']
    || electionHistory?.elections?.['2022']
    || electionHistory?.elections?.['2020'];

  if (lastElection) {
    const margin = lastElection.margin;
    if (margin <= 5) score += 30;
    else if (margin <= 10) score += 20;
    else if (margin <= 15) score += 10;
  }

  // Open seat bonus
  if (!district.incumbent) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate mobilization potential score (0-100)
 * Based on turnout patterns and voter engagement potential
 */
function calculateMobilizationScore(
  electionHistory: DistrictElectionHistory | undefined
): number {
  let score = 50; // Baseline

  const elections = electionHistory?.elections;
  if (!elections) return score;

  // Check turnout patterns (simulated from election data)
  const years = ['2024', '2022', '2020'];
  let totalMargin = 0;
  let electionCount = 0;

  for (const year of years) {
    const election = elections[year];
    if (election) {
      totalMargin += election.margin;
      electionCount++;
    }
  }

  if (electionCount > 0) {
    const avgMargin = totalMargin / electionCount;
    // Lower margins often correlate with higher mobilization potential
    // (More persuadable voters)
    if (avgMargin <= 10) score += 30;
    else if (avgMargin <= 20) score += 15;
    else score -= 10;
  }

  // Consistent voting patterns suggest good ground game potential
  if (electionCount >= 2) score += 10;

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate donor capacity estimate (0-100)
 * Simulated based on district characteristics
 */
function calculateDonorCapacity(
  district: District,
  electionHistory: DistrictElectionHistory | undefined
): number {
  let score = 40; // Baseline

  // Districts with competitive races tend to attract more donations
  if (electionHistory?.competitiveness) {
    score += electionHistory.competitiveness.score * 0.3;
  }

  // Multiple candidates suggest fundraising activity
  if (district.candidates.length >= 2) score += 15;
  else if (district.candidates.length === 1) score += 5;

  // Open seats tend to attract more donor interest
  if (!district.incumbent) score += 10;

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate trending score (0-100)
 * Based on margin improvement toward Democrats
 */
function calculateTrendingScore(
  electionHistory: DistrictElectionHistory | undefined
): number {
  const elections = electionHistory?.elections;
  if (!elections) return 50; // Neutral baseline

  const margin2024 = elections['2024']?.margin;
  const margin2022 = elections['2022']?.margin;
  const margin2020 = elections['2020']?.margin;

  let score = 50;

  // Calculate trend (positive = improving for Dems)
  if (margin2024 !== undefined && margin2022 !== undefined) {
    const change = margin2022 - margin2024;
    if (change > 10) score += 40;
    else if (change > 5) score += 25;
    else if (change > 0) score += 10;
    else if (change < -10) score -= 30;
    else if (change < -5) score -= 15;
    else if (change < 0) score -= 5;
  } else if (margin2022 !== undefined && margin2020 !== undefined) {
    const change = margin2020 - margin2022;
    if (change > 10) score += 35;
    else if (change > 5) score += 20;
    else if (change > 0) score += 8;
    else if (change < -10) score -= 25;
    else if (change < -5) score -= 12;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * useResourceHeatmap - Campaign Resource Allocation Analysis
 *
 * Calculates composite scores for districts based on:
 * - Opportunity (40%): Competitiveness, margins, open seats
 * - Mobilization (30%): Turnout patterns, voter engagement potential
 * - Donor Capacity (15%): Fundraising potential
 * - Trending (15%): Margin improvement toward Democrats
 *
 * @example
 * ```tsx
 * const {
 *   filteredAllocations,
 *   summary,
 *   districtsByIntensity,
 *   exportCSV,
 * } = useResourceHeatmap({
 *   chamber: 'house',
 *   candidatesData,
 *   electionsData,
 * });
 *
 * // Use districtsByIntensity for map overlay
 * const isHot = districtsByIntensity.hot.has(districtNumber);
 * ```
 */
export function useResourceHeatmap(
  options: UseResourceHeatmapOptions
): UseResourceHeatmapReturn {
  const {
    chamber,
    candidatesData,
    electionsData,
    initialFilters = {},
  } = options;

  const [filters, setFilters] = useState<ResourceHeatmapFilters>(initialFilters);

  // Calculate all allocations
  const allocations = useMemo((): ResourceAllocation[] => {
    const results: ResourceAllocation[] = [];
    const districts = candidatesData[chamber];
    const elections = electionsData?.[chamber] || {};

    for (const [districtNum, district] of Object.entries(districts)) {
      const num = parseInt(districtNum, 10);
      const electionHistory = elections[districtNum];

      // Calculate individual factor scores
      const opportunity = calculateOpportunityScore(district, electionHistory);
      const mobilization = calculateMobilizationScore(electionHistory);
      const donorCapacity = calculateDonorCapacity(district, electionHistory);
      const trending = calculateTrendingScore(electionHistory);

      // Calculate weighted composite score
      const compositeScore =
        opportunity * FACTOR_WEIGHTS.opportunity +
        mobilization * FACTOR_WEIGHTS.mobilization +
        donorCapacity * FACTOR_WEIGHTS.donorCapacity +
        trending * FACTOR_WEIGHTS.trending;

      // Get last election data
      const lastElection = electionHistory?.elections?.['2024']
        || electionHistory?.elections?.['2022']
        || electionHistory?.elections?.['2020'];

      const allocation: ResourceAllocation = {
        districtNumber: num,
        chamber,
        compositeScore,
        intensity: getResourceIntensity(compositeScore),
        factors: {
          opportunity,
          mobilization,
          donorCapacity,
          trending,
        },
        isOpenSeat: !district.incumbent,
        hasDemCandidate: district.candidates.some(
          c => c.party?.toLowerCase() === 'democratic'
        ),
        lastMargin: lastElection?.margin ?? null,
        incumbent: district.incumbent,
      };

      results.push(allocation);
    }

    // Sort by composite score (descending)
    results.sort((a, b) => b.compositeScore - a.compositeScore);

    return results;
  }, [candidatesData, electionsData, chamber]);

  // Apply filters
  const filteredAllocations = useMemo(() => {
    let filtered = allocations;

    if (filters.minScore !== undefined) {
      filtered = filtered.filter(a => a.compositeScore >= filters.minScore!);
    }

    if (filters.maxScore !== undefined) {
      filtered = filtered.filter(a => a.compositeScore <= filters.maxScore!);
    }

    if (filters.intensities && filters.intensities.length > 0) {
      filtered = filtered.filter(a => filters.intensities!.includes(a.intensity));
    }

    if (filters.demCandidatesOnly) {
      filtered = filtered.filter(a => a.hasDemCandidate);
    }

    if (filters.openSeatsOnly) {
      filtered = filtered.filter(a => a.isOpenSeat);
    }

    return filtered;
  }, [allocations, filters]);

  // Calculate summary
  const summary = useMemo((): ResourceHeatmapSummary => {
    const hotDistricts = allocations.filter(a => a.intensity === 'hot');
    const warmDistricts = allocations.filter(a => a.intensity === 'warm');
    const coolDistricts = allocations.filter(a => a.intensity === 'cool');

    const avgScore = allocations.length > 0
      ? allocations.reduce((sum, a) => sum + a.compositeScore, 0) / allocations.length
      : 0;

    return {
      totalDistricts: allocations.length,
      hotDistricts: hotDistricts.length,
      warmDistricts: warmDistricts.length,
      coolDistricts: coolDistricts.length,
      avgScore,
      demCandidatesInHotZones: hotDistricts.filter(a => a.hasDemCandidate).length,
      openSeatsInHotZones: hotDistricts.filter(a => a.isOpenSeat).length,
    };
  }, [allocations]);

  // Districts by intensity for map overlay
  const districtsByIntensity = useMemo(() => ({
    hot: new Set(allocations.filter(a => a.intensity === 'hot').map(a => a.districtNumber)),
    warm: new Set(allocations.filter(a => a.intensity === 'warm').map(a => a.districtNumber)),
    cool: new Set(allocations.filter(a => a.intensity === 'cool').map(a => a.districtNumber)),
  }), [allocations]);

  // Get allocation for specific district
  const getAllocation = useCallback(
    (districtNumber: number): ResourceAllocation | null => {
      return allocations.find(a => a.districtNumber === districtNumber) ?? null;
    },
    [allocations]
  );

  // Export to CSV
  const exportCSV = useCallback((): string => {
    const headers = [
      'District',
      'Chamber',
      'Composite Score',
      'Intensity',
      'Opportunity',
      'Mobilization',
      'Donor Capacity',
      'Trending',
      'Open Seat',
      'Has Dem Candidate',
      'Last Margin',
      'Incumbent',
      'Incumbent Party',
    ];

    const rows = filteredAllocations.map(a => [
      a.districtNumber,
      a.chamber,
      a.compositeScore.toFixed(1),
      a.intensity,
      a.factors.opportunity.toFixed(1),
      a.factors.mobilization.toFixed(1),
      a.factors.donorCapacity.toFixed(1),
      a.factors.trending.toFixed(1),
      a.isOpenSeat ? 'Yes' : 'No',
      a.hasDemCandidate ? 'Yes' : 'No',
      a.lastMargin !== null ? a.lastMargin.toFixed(1) : 'N/A',
      a.incumbent?.name || 'None',
      a.incumbent?.party || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csv;
  }, [filteredAllocations]);

  const hasData = allocations.length > 0;

  return {
    allocations,
    filteredAllocations,
    summary,
    filters,
    setFilters,
    districtsByIntensity,
    getAllocation,
    exportCSV,
    hasData,
  };
}

export default useResourceHeatmap;
