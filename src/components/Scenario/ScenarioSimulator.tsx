'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import { useScenario, type UseScenarioOptions } from '@/hooks/useScenario';
import { getScenarioFillColor, getScenarioStatusLabel, type ScenarioStatus, type SeatCount } from '@/lib/districtColors';
import type { CandidatesData, ElectionsData, Chamber } from '@/types/schema';

interface ScenarioSimulatorProps {
  /** State code for display */
  stateCode: string;
  /** Chamber to simulate */
  chamber: Chamber;
  /** Candidates data for baseline party detection */
  candidatesData: CandidatesData;
  /** Elections data for margin-based defaults */
  electionsData?: ElectionsData | null;
  /** Chamber label for display (e.g., "House", "Senate") */
  chamberLabel: string;
  /** Total seats in chamber */
  totalSeats: number;
  /** Seats needed for majority */
  majorityThreshold?: number;
  /** Callback when scenario changes */
  onScenarioChange?: (scenarioCounts: SeatCount) => void;
  /** Additional className */
  className?: string;
}

/**
 * Get baseline seat counts from candidates data
 */
function getBaselineCounts(
  candidatesData: CandidatesData,
  chamber: Chamber
): { counts: SeatCount; partyMap: Map<number, 'D' | 'R' | null> } {
  const districts = candidatesData[chamber];
  const counts: SeatCount = { dem: 0, rep: 0, tossup: 0 };
  const partyMap = new Map<number, 'D' | 'R' | null>();

  for (const [districtNum, district] of Object.entries(districts)) {
    const num = parseInt(districtNum, 10);
    const isDemIncumbent = district.incumbent?.party === 'Democratic';
    const isRepIncumbent = district.incumbent?.party === 'Republican';

    // Determine baseline party control
    if (isDemIncumbent) {
      counts.dem++;
      partyMap.set(num, 'D');
    } else if (isRepIncumbent) {
      counts.rep++;
      partyMap.set(num, 'R');
    } else {
      // No incumbent data - use candidate presence as indicator
      const hasDem = district.candidates.some(c => c.party?.toLowerCase() === 'democratic');
      const hasRep = district.candidates.some(c => c.party?.toLowerCase() === 'republican');

      if (hasDem && !hasRep) {
        counts.dem++;
        partyMap.set(num, 'D');
      } else if (hasRep && !hasDem) {
        counts.rep++;
        partyMap.set(num, 'R');
      } else {
        // Toss-up or unknown
        partyMap.set(num, null);
      }
    }
  }

  return { counts, partyMap };
}

/**
 * Seat Counter Display Component
 */
function SeatCounter({
  label,
  baseline,
  scenario,
  color,
  majorityThreshold,
}: {
  label: string;
  baseline: number;
  scenario: number;
  color: string;
  majorityThreshold?: number;
}) {
  const delta = scenario - baseline;
  const isMajority = majorityThreshold && scenario >= majorityThreshold;

  return (
    <div className="text-center">
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className={`text-2xl font-bold font-display ${isMajority ? 'ring-2 ring-offset-2 rounded-lg px-2' : ''}`}
        style={{
          color,
          // Use CSS custom property for ring color since ringColor isn't a valid CSS property
          '--tw-ring-color': color,
        } as React.CSSProperties}
      >
        {scenario}
      </div>
      {delta !== 0 && (
        <div
          className="text-xs font-medium mt-1"
          style={{ color: delta > 0 ? '#059669' : '#DC2626' }}
        >
          {delta > 0 ? '+' : ''}{delta}
        </div>
      )}
      {isMajority && (
        <div className="text-xs font-medium mt-1" style={{ color }}>
          MAJORITY
        </div>
      )}
    </div>
  );
}

/**
 * ScenarioSimulator - "What-If" District Flipper
 *
 * Interactive tool for simulating election outcomes by toggling
 * district party control. Shows real-time seat count updates and
 * path to majority visualization.
 *
 * Features:
 * - Click districts to cycle through D/R/Toss-up
 * - Real-time seat count updates
 * - URL sync for sharing scenarios
 * - Majority threshold indicator
 * - Reset to baseline
 *
 * @example
 * ```tsx
 * <ScenarioSimulator
 *   stateCode="SC"
 *   chamber="house"
 *   candidatesData={candidatesData}
 *   chamberLabel="House"
 *   totalSeats={124}
 *   majorityThreshold={63}
 * />
 * ```
 */
export default function ScenarioSimulator({
  stateCode,
  chamber,
  candidatesData,
  electionsData,
  chamberLabel,
  totalSeats,
  majorityThreshold,
  onScenarioChange,
  className = '',
}: ScenarioSimulatorProps) {
  // Calculate baseline from candidates data
  const { counts: baselineCounts, partyMap: districtParties } = useMemo(
    () => getBaselineCounts(candidatesData, chamber),
    [candidatesData, chamber]
  );

  // Use scenario hook for state management
  const {
    scenarioMap,
    toggleDistrict,
    resetScenario,
    scenarioCounts,
    hasChanges,
    flippedCount,
  } = useScenario({
    chamber,
    baselineCounts,
    districtParties,
    syncUrl: true,
  });

  // Notify parent of changes
  useMemo(() => {
    onScenarioChange?.(scenarioCounts);
  }, [scenarioCounts, onScenarioChange]);

  // Calculate progress toward majority
  const demProgress = majorityThreshold
    ? Math.min(100, (scenarioCounts.dem / majorityThreshold) * 100)
    : 0;
  const repProgress = majorityThreshold
    ? Math.min(100, (scenarioCounts.rep / majorityThreshold) * 100)
    : 0;

  // Get scenario status for a district
  const getDistrictScenario = useCallback(
    (districtNumber: number): { baselineParty: 'D' | 'R' | null; status: ScenarioStatus } => {
      const baselineParty = districtParties.get(districtNumber) ?? null;
      const status = scenarioMap.get(districtNumber) ?? 'baseline';
      return { baselineParty, status };
    },
    [districtParties, scenarioMap]
  );

  return (
    <div className={`scenario-simulator ${className}`}>
      {/* Header */}
      <div className="glass-surface rounded-t-xl p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
              Scenario Simulator
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {stateCode} {chamberLabel} - Click districts to flip outcomes
            </p>
          </div>
          {hasChanges && (
            <button
              onClick={resetScenario}
              className="px-3 py-1.5 text-sm font-medium rounded-lg transition-all hover:opacity-80"
              style={{
                background: 'var(--color-at-risk-bg)',
                color: 'var(--color-at-risk)',
                border: '1px solid var(--color-at-risk)',
              }}
            >
              Reset to Baseline
            </button>
          )}
        </div>
      </div>

      {/* Seat Counters */}
      <div className="glass-surface p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="grid grid-cols-3 gap-4">
          <SeatCounter
            label="Democrats"
            baseline={baselineCounts.dem}
            scenario={scenarioCounts.dem}
            color="#1E40AF"
            majorityThreshold={majorityThreshold}
          />
          <SeatCounter
            label="Toss-up"
            baseline={baselineCounts.tossup}
            scenario={scenarioCounts.tossup}
            color="#8B5CF6"
          />
          <SeatCounter
            label="Republicans"
            baseline={baselineCounts.rep}
            scenario={scenarioCounts.rep}
            color="#B91C1C"
            majorityThreshold={majorityThreshold}
          />
        </div>

        {/* Progress bars toward majority */}
        {majorityThreshold && (
          <div className="mt-4">
            <div className="text-xs text-center mb-2" style={{ color: 'var(--text-muted)' }}>
              Path to Majority ({majorityThreshold} seats)
            </div>
            <div className="flex gap-2">
              {/* Dem progress */}
              <div className="flex-1">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E0E7FF' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${demProgress}%`,
                      background: demProgress >= 100 ? '#059669' : '#1E40AF',
                    }}
                  />
                </div>
              </div>
              {/* Rep progress */}
              <div className="flex-1">
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#FEE2E2' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300 ml-auto"
                    style={{
                      width: `${repProgress}%`,
                      background: repProgress >= 100 ? '#059669' : '#B91C1C',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Flipped count */}
        {hasChanges && (
          <div className="mt-3 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {flippedCount} district{flippedCount !== 1 ? 's' : ''} modified from baseline
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="glass-surface rounded-b-xl p-3 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: '#1E40AF' }} />
            Dem held
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: '#B91C1C' }} />
            Rep held
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: '#2563EB', border: '2px dashed white' }} />
            Flipped D
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: '#DC2626', border: '2px dashed white' }} />
            Flipped R
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: '#8B5CF6' }} />
            Toss-up
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Export helper for getting district color in scenario mode
 */
export { getScenarioFillColor, getScenarioStatusLabel };
export type { ScenarioStatus, SeatCount };
