'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ScenarioStatus, SeatCount } from '@/lib/districtColors';

/**
 * Scenario state for a district
 */
export interface DistrictScenario {
  districtNumber: number;
  baselineParty: 'D' | 'R' | null;
  scenarioStatus: ScenarioStatus;
}

/**
 * Options for useScenario hook
 */
export interface UseScenarioOptions {
  /** Chamber being simulated */
  chamber: 'house' | 'senate';
  /** Baseline seat counts (from actual data) */
  baselineCounts: SeatCount;
  /** Map of district numbers to their baseline party control */
  districtParties: Map<number, 'D' | 'R' | null>;
  /** Whether to sync scenario to URL (default: true) */
  syncUrl?: boolean;
  /** Debounce delay for URL updates (default: 500ms) */
  debounceMs?: number;
}

/**
 * Return type for useScenario hook
 */
export interface UseScenarioReturn {
  /** Map of district numbers to their scenario status */
  scenarioMap: Map<number, ScenarioStatus>;
  /** Toggle a district's status (cycles: baseline -> flipped-dem -> flipped-rep -> tossup -> baseline) */
  toggleDistrict: (districtNumber: number) => void;
  /** Set a specific status for a district */
  setDistrictStatus: (districtNumber: number, status: ScenarioStatus) => void;
  /** Reset all districts to baseline */
  resetScenario: () => void;
  /** Current scenario seat counts */
  scenarioCounts: SeatCount;
  /** Baseline seat counts (unchanged) */
  baselineCounts: SeatCount;
  /** Whether scenario has any changes from baseline */
  hasChanges: boolean;
  /** Number of flipped districts */
  flippedCount: number;
  /** Serialize scenario to URL-safe string */
  serializeScenario: () => string;
}

/**
 * Cycle through scenario statuses based on baseline party
 */
function getNextStatus(
  current: ScenarioStatus,
  baselineParty: 'D' | 'R' | null
): ScenarioStatus {
  // Cycle order depends on baseline party
  if (baselineParty === 'D') {
    // D baseline: baseline (D) -> flipped-rep -> tossup -> baseline
    switch (current) {
      case 'baseline': return 'flipped-rep';
      case 'flipped-rep': return 'tossup';
      case 'tossup': return 'baseline';
      default: return 'baseline';
    }
  } else if (baselineParty === 'R') {
    // R baseline: baseline (R) -> flipped-dem -> tossup -> baseline
    switch (current) {
      case 'baseline': return 'flipped-dem';
      case 'flipped-dem': return 'tossup';
      case 'tossup': return 'baseline';
      default: return 'baseline';
    }
  } else {
    // No baseline: tossup -> flipped-dem -> flipped-rep -> tossup
    switch (current) {
      case 'baseline': return 'tossup';
      case 'tossup': return 'flipped-dem';
      case 'flipped-dem': return 'flipped-rep';
      case 'flipped-rep': return 'baseline';
      default: return 'baseline';
    }
  }
}

/**
 * Serialize scenario map to URL-safe string
 * Format: "d23,r45,t67" (d=flipped-dem, r=flipped-rep, t=tossup)
 */
function serializeScenarioMap(scenarioMap: Map<number, ScenarioStatus>): string {
  const parts: string[] = [];

  scenarioMap.forEach((status, district) => {
    if (status === 'baseline') return;
    const prefix = status === 'flipped-dem' ? 'd' : status === 'flipped-rep' ? 'r' : 't';
    parts.push(`${prefix}${district}`);
  });

  return parts.join(',');
}

/**
 * Parse URL scenario string to map
 */
function parseScenarioString(
  str: string,
  districtParties: Map<number, 'D' | 'R' | null>
): Map<number, ScenarioStatus> {
  const map = new Map<number, ScenarioStatus>();

  if (!str) return map;

  const parts = str.split(',');
  for (const part of parts) {
    if (!part) continue;

    const prefix = part[0];
    const districtNum = parseInt(part.slice(1), 10);

    if (isNaN(districtNum)) continue;

    // Validate the flip makes sense
    const baseline = districtParties.get(districtNum);

    let status: ScenarioStatus;
    switch (prefix) {
      case 'd':
        status = 'flipped-dem';
        break;
      case 'r':
        status = 'flipped-rep';
        break;
      case 't':
        status = 'tossup';
        break;
      default:
        continue;
    }

    // Validate: can't flip to same party as baseline
    if (status === 'flipped-dem' && baseline === 'D') continue;
    if (status === 'flipped-rep' && baseline === 'R') continue;

    map.set(districtNum, status);
  }

  return map;
}

/**
 * useScenario - Manage district flip scenarios with URL sync
 *
 * Enables "what-if" scenario simulation by toggling district outcomes.
 * Tracks seat count changes and syncs state to URL for sharing.
 *
 * @example
 * ```tsx
 * const { scenarioMap, toggleDistrict, scenarioCounts, resetScenario } = useScenario({
 *   chamber: 'house',
 *   baselineCounts: { dem: 24, rep: 100, tossup: 0 },
 *   districtParties: districtPartiesMap,
 * });
 *
 * // Toggle a district
 * <button onClick={() => toggleDistrict(42)}>Flip District 42</button>
 *
 * // Show seat counts
 * <span>D: {scenarioCounts.dem} / R: {scenarioCounts.rep}</span>
 * ```
 */
export function useScenario(options: UseScenarioOptions): UseScenarioReturn {
  const {
    chamber,
    baselineCounts,
    districtParties,
    syncUrl = true,
    debounceMs = 500,
  } = options;

  // Scenario map: district number -> scenario status
  const [scenarioMap, setScenarioMap] = useState<Map<number, ScenarioStatus>>(
    () => new Map()
  );

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're in the browser
  const isBrowser = typeof window !== 'undefined';

  // Parse scenario from URL on mount
  useEffect(() => {
    if (!isBrowser || !syncUrl) return;

    const params = new URLSearchParams(window.location.search);
    const scenarioParam = params.get('scenario');

    if (scenarioParam) {
      const parsed = parseScenarioString(scenarioParam, districtParties);
      setScenarioMap(parsed);
    }
  }, [isBrowser, syncUrl]); // Only run on mount, districtParties ref stable

  // Sync scenario to URL (debounced)
  const syncToUrl = useCallback(
    (map: Map<number, ScenarioStatus>) => {
      if (!isBrowser || !syncUrl) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const serialized = serializeScenarioMap(map);
        const params = new URLSearchParams(window.location.search);

        if (serialized) {
          params.set('scenario', serialized);
        } else {
          params.delete('scenario');
        }

        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;

        window.history.replaceState({}, '', newUrl);
      }, debounceMs);
    },
    [isBrowser, syncUrl, debounceMs]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Toggle a district's scenario status
  const toggleDistrict = useCallback(
    (districtNumber: number) => {
      setScenarioMap((prev) => {
        const newMap = new Map(prev);
        const currentStatus = prev.get(districtNumber) || 'baseline';
        const baseline = districtParties.get(districtNumber) ?? null;
        const nextStatus = getNextStatus(currentStatus, baseline);

        if (nextStatus === 'baseline') {
          newMap.delete(districtNumber);
        } else {
          newMap.set(districtNumber, nextStatus);
        }

        syncToUrl(newMap);
        return newMap;
      });
    },
    [districtParties, syncToUrl]
  );

  // Set specific status for a district
  const setDistrictStatus = useCallback(
    (districtNumber: number, status: ScenarioStatus) => {
      setScenarioMap((prev) => {
        const newMap = new Map(prev);

        if (status === 'baseline') {
          newMap.delete(districtNumber);
        } else {
          newMap.set(districtNumber, status);
        }

        syncToUrl(newMap);
        return newMap;
      });
    },
    [syncToUrl]
  );

  // Reset scenario
  const resetScenario = useCallback(() => {
    setScenarioMap(new Map());
    syncToUrl(new Map());
  }, [syncToUrl]);

  // Calculate scenario seat counts
  const scenarioCounts = useMemo(() => {
    const counts: SeatCount = { ...baselineCounts };

    scenarioMap.forEach((status, districtNumber) => {
      const baseline = districtParties.get(districtNumber);

      // Adjust counts based on flip
      if (status === 'flipped-dem') {
        if (baseline === 'R') {
          counts.rep--;
          counts.dem++;
        } else if (baseline === null) {
          counts.dem++;
        }
      } else if (status === 'flipped-rep') {
        if (baseline === 'D') {
          counts.dem--;
          counts.rep++;
        } else if (baseline === null) {
          counts.rep++;
        }
      } else if (status === 'tossup') {
        if (baseline === 'D') {
          counts.dem--;
          counts.tossup++;
        } else if (baseline === 'R') {
          counts.rep--;
          counts.tossup++;
        } else {
          counts.tossup++;
        }
      }
    });

    return counts;
  }, [baselineCounts, scenarioMap, districtParties]);

  // Check if scenario has changes
  const hasChanges = scenarioMap.size > 0;
  const flippedCount = scenarioMap.size;

  // Serialize scenario
  const serializeScenario = useCallback(() => {
    return serializeScenarioMap(scenarioMap);
  }, [scenarioMap]);

  return {
    scenarioMap,
    toggleDistrict,
    setDistrictStatus,
    resetScenario,
    scenarioCounts,
    baselineCounts,
    hasChanges,
    flippedCount,
    serializeScenario,
  };
}

export default useScenario;
