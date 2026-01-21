'use client';

import { useMemo, useCallback } from 'react';
import type { CandidatesData, ElectionsData, Chamber, District, DistrictElectionHistory } from '@/types/schema';

/**
 * Recruitment target with calculated priority
 */
export interface RecruitmentTarget {
  districtNumber: number;
  chamber: Chamber;
  /** Calculated opportunity score (0-100) */
  opportunityScore: number;
  /** Priority ranking (1 = highest) */
  rank: number;
  /** Most recent election margin (R margin, positive = R won) */
  lastMargin: number | null;
  /** Last election year */
  lastElectionYear: string | null;
  /** Whether this is an open seat */
  isOpenSeat: boolean;
  /** Trending toward Democrats */
  trendingDem: boolean;
  /** Margin change from previous election */
  marginChange: number | null;
  /** District incumbent info */
  incumbent: District['incumbent'];
  /** Current candidate count */
  candidateCount: number;
  /** Recruitment urgency level */
  urgency: 'critical' | 'high' | 'medium' | 'low';
  /** Filing deadline (from state config) */
  filingDeadline?: string;
}

/**
 * Summary statistics for recruitment radar
 */
export interface RecruitmentSummary {
  /** Total districts needing candidates */
  totalTargets: number;
  /** Critical urgency targets (score 70+, margin <10) */
  criticalTargets: number;
  /** High urgency targets (score 60+) */
  highPriorityTargets: number;
  /** Open seats available */
  openSeats: number;
  /** Trending Dem districts without candidates */
  trendingDemTargets: number;
  /** Average opportunity score of targets */
  avgScore: number;
}

/**
 * Options for useRecruitmentRadar hook
 */
export interface UseRecruitmentRadarOptions {
  chamber: Chamber;
  candidatesData: CandidatesData;
  electionsData: ElectionsData | null;
  /** Minimum opportunity score to qualify as target (default: 50) */
  minScore?: number;
  /** Maximum targets to return (default: unlimited) */
  maxTargets?: number;
  /** Filing deadline for display */
  filingDeadline?: string;
}

/**
 * Return type for useRecruitmentRadar hook
 */
export interface UseRecruitmentRadarReturn {
  /** List of recruitment targets, sorted by priority */
  targets: RecruitmentTarget[];
  /** Summary statistics */
  summary: RecruitmentSummary;
  /** Set of district numbers that are targets (for map highlighting) */
  targetDistricts: Set<number>;
  /** Get target info for a specific district */
  getTarget: (districtNumber: number) => RecruitmentTarget | null;
  /** Critical targets (top priority) */
  criticalTargets: RecruitmentTarget[];
  /** High priority targets */
  highPriorityTargets: RecruitmentTarget[];
}

/**
 * Calculate opportunity score for a district
 */
function calculateOpportunityScore(
  district: District,
  electionHistory: DistrictElectionHistory | undefined
): number {
  let score = 0;

  // Base: Competitiveness from election history
  if (electionHistory?.competitiveness) {
    score += electionHistory.competitiveness.score * 0.4;
  }

  // Margin bonus: Closer races = higher score
  const lastElection = electionHistory?.elections?.['2024']
    || electionHistory?.elections?.['2022']
    || electionHistory?.elections?.['2020'];

  if (lastElection) {
    const margin = lastElection.margin;
    if (margin <= 5) score += 30;
    else if (margin <= 10) score += 25;
    else if (margin <= 15) score += 15;
    else if (margin <= 20) score += 5;
  }

  // Open seat bonus
  const isOpenSeat = !district.incumbent;
  if (isOpenSeat) {
    score += 15;
  }

  // Trending bonus: Check if margins are improving for Dems
  const elections = electionHistory?.elections;
  if (elections) {
    const margin2024 = elections['2024']?.margin;
    const margin2022 = elections['2022']?.margin;
    const margin2020 = elections['2020']?.margin;

    if (margin2024 !== undefined && margin2022 !== undefined) {
      const change = margin2022 - margin2024; // Positive = improving for Dems
      if (change > 5) score += 10;
      else if (change > 0) score += 5;
    } else if (margin2022 !== undefined && margin2020 !== undefined) {
      const change = margin2020 - margin2022;
      if (change > 5) score += 8;
      else if (change > 0) score += 4;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculate margin change between elections
 */
function calculateMarginChange(
  electionHistory: DistrictElectionHistory | undefined
): number | null {
  const elections = electionHistory?.elections;
  if (!elections) return null;

  const margin2024 = elections['2024']?.margin;
  const margin2022 = elections['2022']?.margin;
  const margin2020 = elections['2020']?.margin;

  if (margin2024 !== undefined && margin2022 !== undefined) {
    return margin2022 - margin2024; // Positive = Dem improving
  }
  if (margin2022 !== undefined && margin2020 !== undefined) {
    return margin2020 - margin2022;
  }
  return null;
}

/**
 * Determine urgency level based on score and margin
 */
function getUrgency(score: number, margin: number | null): RecruitmentTarget['urgency'] {
  if (score >= 70 && margin !== null && margin < 10) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * useRecruitmentRadar - Identify districts needing Democratic candidates
 *
 * Analyzes election data to find high-opportunity districts without
 * Democratic candidates, ranked by recruitment priority.
 *
 * @example
 * ```tsx
 * const { targets, summary, targetDistricts } = useRecruitmentRadar({
 *   chamber: 'house',
 *   candidatesData,
 *   electionsData,
 *   minScore: 50,
 * });
 *
 * // Highlight targets on map
 * const isTarget = targetDistricts.has(districtNumber);
 * ```
 */
export function useRecruitmentRadar(
  options: UseRecruitmentRadarOptions
): UseRecruitmentRadarReturn {
  const {
    chamber,
    candidatesData,
    electionsData,
    minScore = 50,
    maxTargets,
    filingDeadline,
  } = options;

  // Calculate targets
  const targets = useMemo(() => {
    const results: RecruitmentTarget[] = [];
    const districts = candidatesData[chamber];
    const elections = electionsData?.[chamber] || {};

    for (const [districtNum, district] of Object.entries(districts)) {
      const num = parseInt(districtNum, 10);
      const electionHistory = elections[districtNum];

      // Check if district needs a candidate
      const hasDem = district.candidates.some(
        c => c.party?.toLowerCase() === 'democratic'
      );
      const isDemIncumbent = district.incumbent?.party === 'Democratic';

      // Skip if already has Dem candidate or incumbent
      if (hasDem || isDemIncumbent) continue;

      // Calculate opportunity score
      const opportunityScore = calculateOpportunityScore(district, electionHistory);

      // Skip if below threshold
      if (opportunityScore < minScore) continue;

      // Get last election data
      const lastElection = electionHistory?.elections?.['2024']
        || electionHistory?.elections?.['2022']
        || electionHistory?.elections?.['2020'];

      const lastMargin = lastElection?.margin ?? null;
      const lastElectionYear = lastElection
        ? Object.keys(electionHistory?.elections || {})
            .filter(y => electionHistory?.elections?.[y] === lastElection)[0]
        : null;

      // Calculate trend
      const marginChange = calculateMarginChange(electionHistory);
      const trendingDem = marginChange !== null && marginChange > 0;

      const target: RecruitmentTarget = {
        districtNumber: num,
        chamber,
        opportunityScore,
        rank: 0, // Will be set after sorting
        lastMargin,
        lastElectionYear,
        isOpenSeat: !district.incumbent,
        trendingDem,
        marginChange,
        incumbent: district.incumbent,
        candidateCount: district.candidates.length,
        urgency: getUrgency(opportunityScore, lastMargin),
        filingDeadline,
      };

      results.push(target);
    }

    // Sort by opportunity score (descending)
    results.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // Assign ranks
    results.forEach((target, index) => {
      target.rank = index + 1;
    });

    // Limit if specified
    if (maxTargets) {
      return results.slice(0, maxTargets);
    }

    return results;
  }, [candidatesData, electionsData, chamber, minScore, maxTargets, filingDeadline]);

  // Calculate summary
  const summary = useMemo((): RecruitmentSummary => {
    const criticalTargets = targets.filter(t => t.urgency === 'critical').length;
    const highPriorityTargets = targets.filter(t => t.urgency === 'high' || t.urgency === 'critical').length;
    const openSeats = targets.filter(t => t.isOpenSeat).length;
    const trendingDemTargets = targets.filter(t => t.trendingDem).length;
    const avgScore = targets.length > 0
      ? targets.reduce((sum, t) => sum + t.opportunityScore, 0) / targets.length
      : 0;

    return {
      totalTargets: targets.length,
      criticalTargets,
      highPriorityTargets,
      openSeats,
      trendingDemTargets,
      avgScore,
    };
  }, [targets]);

  // Set of target district numbers for map highlighting
  const targetDistricts = useMemo(() => {
    return new Set(targets.map(t => t.districtNumber));
  }, [targets]);

  // Get target for specific district
  const getTarget = useCallback(
    (districtNumber: number): RecruitmentTarget | null => {
      return targets.find(t => t.districtNumber === districtNumber) ?? null;
    },
    [targets]
  );

  // Critical and high priority targets
  const criticalTargets = useMemo(
    () => targets.filter(t => t.urgency === 'critical'),
    [targets]
  );
  const highPriorityTargets = useMemo(
    () => targets.filter(t => t.urgency === 'high'),
    [targets]
  );

  return {
    targets,
    summary,
    targetDistricts,
    getTarget,
    criticalTargets,
    highPriorityTargets,
  };
}

export default useRecruitmentRadar;
