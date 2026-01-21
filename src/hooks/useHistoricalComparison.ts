'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ElectionsData, Chamber } from '@/types/schema';

/**
 * Available election years for comparison
 */
export const COMPARISON_YEARS = ['2024', '2022', '2020'] as const;
export type ComparisonYear = typeof COMPARISON_YEARS[number];

/**
 * Comparison period (e.g., "2024 vs 2022")
 */
export interface ComparisonPeriod {
  current: ComparisonYear;
  previous: ComparisonYear;
  label: string;
}

/**
 * Available comparison periods
 */
export const COMPARISON_PERIODS: ComparisonPeriod[] = [
  { current: '2024', previous: '2022', label: '2024 vs 2022' },
  { current: '2022', previous: '2020', label: '2022 vs 2020' },
  { current: '2024', previous: '2020', label: '2024 vs 2020 (4-year)' },
];

/**
 * Historical delta for a single district
 */
export interface DistrictDelta {
  districtNumber: number;
  currentYear: ComparisonYear;
  previousYear: ComparisonYear;
  currentMargin: number | null;
  previousMargin: number | null;
  delta: number | null;
  /** True if margin improved for Democrats (negative delta = Dem gained ground) */
  demImproved: boolean;
  /** Absolute change in margin */
  absoluteChange: number;
  /** Whether this is a significant shift (>5pts) */
  significantShift: boolean;
}

/**
 * Summary statistics for historical comparison
 */
export interface ComparisonSummary {
  /** Number of districts that improved for Democrats */
  demImproved: number;
  /** Number of districts that improved for Republicans */
  repImproved: number;
  /** Number of stable districts (-2 to +2) */
  stable: number;
  /** Average margin shift (negative = Dem improved) */
  avgShift: number;
  /** Number of significant shifts (>5pts) */
  significantShifts: number;
  /** Largest Dem improvement */
  maxDemSwing: number;
  /** Largest Rep improvement */
  maxRepSwing: number;
}

/**
 * Filter options for historical comparison
 */
export interface HistoricalFilterOptions {
  /** Only show shifts greater than this threshold */
  minShift?: number;
  /** Only show Dem-improving districts */
  demImprovingOnly?: boolean;
  /** Only show Rep-improving districts */
  repImprovingOnly?: boolean;
}

/**
 * Options for useHistoricalComparison hook
 */
export interface UseHistoricalComparisonOptions {
  chamber: Chamber;
  electionsData: ElectionsData | null;
  initialPeriod?: ComparisonPeriod;
  filters?: HistoricalFilterOptions;
  syncUrl?: boolean;
}

/**
 * Return type for useHistoricalComparison hook
 */
export interface UseHistoricalComparisonReturn {
  /** Current comparison period */
  period: ComparisonPeriod;
  /** Set comparison period */
  setPeriod: (period: ComparisonPeriod) => void;
  /** Map of district numbers to their delta info */
  deltaMap: Map<number, DistrictDelta>;
  /** Summary statistics */
  summary: ComparisonSummary;
  /** Get delta for a specific district */
  getDistrictDelta: (districtNumber: number) => DistrictDelta | null;
  /** Filter options */
  filters: HistoricalFilterOptions;
  /** Set filter options */
  setFilters: (filters: HistoricalFilterOptions) => void;
  /** List of districts matching current filters, sorted by delta */
  filteredDistricts: DistrictDelta[];
  /** Whether data is available for comparison */
  hasData: boolean;
}

/**
 * Calculate margin delta between two elections
 *
 * @param current - Current election margin (positive = R won by that margin)
 * @param previous - Previous election margin
 * @returns Delta (negative = Dem improved, positive = Rep improved)
 */
function calculateDelta(
  current: number | undefined,
  previous: number | undefined
): number | null {
  if (current === undefined || previous === undefined) {
    return null;
  }
  // Delta: positive = margin increased (worse for Dems)
  // negative = margin decreased (better for Dems)
  return current - previous;
}

/**
 * useHistoricalComparison - Compare election margins between cycles
 *
 * Provides margin change data for choropleth visualization.
 * Blue = Dem improvement, Red = Rep improvement.
 *
 * @example
 * ```tsx
 * const { deltaMap, summary, period, setPeriod } = useHistoricalComparison({
 *   chamber: 'house',
 *   electionsData,
 * });
 *
 * // Get color for district
 * const delta = deltaMap.get(42)?.delta ?? 0;
 * const color = getHistoricalDeltaColor(delta);
 * ```
 */
export function useHistoricalComparison(
  options: UseHistoricalComparisonOptions
): UseHistoricalComparisonReturn {
  const {
    chamber,
    electionsData,
    initialPeriod = COMPARISON_PERIODS[0],
    syncUrl = true,
  } = options;

  const [period, setPeriodState] = useState<ComparisonPeriod>(initialPeriod);
  const [filters, setFilters] = useState<HistoricalFilterOptions>({});

  // Parse period from URL on mount
  useEffect(() => {
    if (!syncUrl || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const compareParam = params.get('compare');

    if (compareParam) {
      const found = COMPARISON_PERIODS.find(p => p.label === compareParam);
      if (found) {
        setPeriodState(found);
      }
    }
  }, [syncUrl]);

  // Sync period to URL
  const setPeriod = useCallback((newPeriod: ComparisonPeriod) => {
    setPeriodState(newPeriod);

    if (syncUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('compare', newPeriod.label);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [syncUrl]);

  // Calculate delta map
  const deltaMap = useMemo(() => {
    const map = new Map<number, DistrictDelta>();

    if (!electionsData) return map;

    const chamberData = electionsData[chamber];

    for (const [districtNum, history] of Object.entries(chamberData)) {
      const num = parseInt(districtNum, 10);
      const elections = history.elections;

      const currentElection = elections[period.current];
      const previousElection = elections[period.previous];

      const currentMargin = currentElection?.margin ?? null;
      const previousMargin = previousElection?.margin ?? null;

      const delta = calculateDelta(
        currentMargin ?? undefined,
        previousMargin ?? undefined
      );

      const demImproved = delta !== null && delta < 0;
      const absoluteChange = Math.abs(delta ?? 0);
      const significantShift = absoluteChange >= 5;

      map.set(num, {
        districtNumber: num,
        currentYear: period.current,
        previousYear: period.previous,
        currentMargin,
        previousMargin,
        delta,
        demImproved,
        absoluteChange,
        significantShift,
      });
    }

    return map;
  }, [electionsData, chamber, period]);

  // Calculate summary statistics
  const summary = useMemo((): ComparisonSummary => {
    let demImproved = 0;
    let repImproved = 0;
    let stable = 0;
    let totalShift = 0;
    let count = 0;
    let significantShifts = 0;
    let maxDemSwing = 0;
    let maxRepSwing = 0;

    deltaMap.forEach((d) => {
      if (d.delta === null) return;

      count++;
      totalShift += d.delta;

      if (d.delta < -2) {
        demImproved++;
        maxDemSwing = Math.max(maxDemSwing, Math.abs(d.delta));
      } else if (d.delta > 2) {
        repImproved++;
        maxRepSwing = Math.max(maxRepSwing, d.delta);
      } else {
        stable++;
      }

      if (d.significantShift) {
        significantShifts++;
      }
    });

    return {
      demImproved,
      repImproved,
      stable,
      avgShift: count > 0 ? totalShift / count : 0,
      significantShifts,
      maxDemSwing,
      maxRepSwing,
    };
  }, [deltaMap]);

  // Get delta for specific district
  const getDistrictDelta = useCallback(
    (districtNumber: number): DistrictDelta | null => {
      return deltaMap.get(districtNumber) ?? null;
    },
    [deltaMap]
  );

  // Filter districts based on current filters
  const filteredDistricts = useMemo(() => {
    const results: DistrictDelta[] = [];

    deltaMap.forEach((d) => {
      if (d.delta === null) return;

      // Apply filters
      if (filters.minShift && d.absoluteChange < filters.minShift) return;
      if (filters.demImprovingOnly && !d.demImproved) return;
      if (filters.repImprovingOnly && d.demImproved) return;

      results.push(d);
    });

    // Sort by absolute delta (largest shifts first)
    results.sort((a, b) => (b.absoluteChange) - (a.absoluteChange));

    return results;
  }, [deltaMap, filters]);

  const hasData = electionsData !== null && deltaMap.size > 0;

  return {
    period,
    setPeriod,
    deltaMap,
    summary,
    getDistrictDelta,
    filters,
    setFilters,
    filteredDistricts,
    hasData,
  };
}

export default useHistoricalComparison;
