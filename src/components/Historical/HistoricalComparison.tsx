'use client';

import { useMemo } from 'react';
import {
  useHistoricalComparison,
  COMPARISON_PERIODS,
  type UseHistoricalComparisonOptions,
  type ComparisonPeriod,
  type HistoricalFilterOptions,
} from '@/hooks/useHistoricalComparison';
import {
  getHistoricalDeltaColor,
  getHistoricalDeltaLabel,
  HISTORICAL_DELTA_COLORS,
} from '@/lib/districtColors';
import type { ElectionsData, Chamber } from '@/types/schema';

interface HistoricalComparisonProps {
  /** State code for display */
  stateCode: string;
  /** Chamber to compare */
  chamber: Chamber;
  /** Elections data with historical results */
  electionsData: ElectionsData | null;
  /** Chamber label for display (e.g., "House", "Senate") */
  chamberLabel: string;
  /** Callback when period changes */
  onPeriodChange?: (period: ComparisonPeriod) => void;
  /** Callback to get district color (for map integration) */
  onDistrictColorRequest?: (districtNumber: number) => string;
  /** Additional className */
  className?: string;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

/**
 * Color scale legend component
 */
function ColorScaleLegend() {
  const scaleSteps = [
    { label: '+10+ Dem', color: HISTORICAL_DELTA_COLORS.DEM_STRONG },
    { label: '+5 Dem', color: HISTORICAL_DELTA_COLORS.DEM_MODERATE },
    { label: '+2 Dem', color: HISTORICAL_DELTA_COLORS.DEM_SLIGHT },
    { label: 'Stable', color: HISTORICAL_DELTA_COLORS.STABLE },
    { label: '+2 Rep', color: HISTORICAL_DELTA_COLORS.REP_SLIGHT },
    { label: '+5 Rep', color: HISTORICAL_DELTA_COLORS.REP_MODERATE },
    { label: '+10+ Rep', color: HISTORICAL_DELTA_COLORS.REP_STRONG },
  ];

  return (
    <div className="flex items-center justify-center gap-1">
      {scaleSteps.map((step, i) => (
        <div
          key={i}
          className="flex flex-col items-center"
          title={step.label}
        >
          <div
            className="w-6 h-3 rounded-sm"
            style={{ background: step.color }}
          />
          {(i === 0 || i === 3 || i === scaleSteps.length - 1) && (
            <span className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {step.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Stat card for summary metrics
 */
function StatCard({
  label,
  value,
  color,
  subtext,
}: {
  label: string;
  value: number | string;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-xl font-bold font-display" style={{ color }}>
        {value}
      </div>
      {subtext && (
        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}

/**
 * HistoricalComparison - Margin Change Visualization
 *
 * Shows how election margins have shifted between cycles.
 * Blue shades = Democratic improvement, Red = Republican improvement.
 *
 * Features:
 * - Period selector dropdown
 * - Summary statistics
 * - Color scale legend
 * - Top movers list
 * - Filter for significant shifts
 *
 * @example
 * ```tsx
 * <HistoricalComparison
 *   stateCode="SC"
 *   chamber="house"
 *   electionsData={electionsData}
 *   chamberLabel="House"
 * />
 * ```
 */
export default function HistoricalComparison({
  stateCode,
  chamber,
  electionsData,
  chamberLabel,
  onPeriodChange,
  className = '',
  compact = false,
}: HistoricalComparisonProps) {
  const {
    period,
    setPeriod,
    summary,
    filteredDistricts,
    hasData,
    filters,
    setFilters,
  } = useHistoricalComparison({
    chamber,
    electionsData,
  });

  // Handle period change
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = COMPARISON_PERIODS.find(p => p.label === e.target.value);
    if (selected) {
      setPeriod(selected);
      onPeriodChange?.(selected);
    }
  };

  // Top movers (top 5 Dem-improving and top 5 Rep-improving)
  const topMovers = useMemo(() => {
    const demMovers = filteredDistricts
      .filter(d => d.demImproved)
      .slice(0, 5);
    const repMovers = filteredDistricts
      .filter(d => !d.demImproved)
      .slice(0, 5);
    return { dem: demMovers, rep: repMovers };
  }, [filteredDistricts]);

  // Toggle significant shift filter
  const toggleSignificantOnly = () => {
    setFilters({
      ...filters,
      minShift: filters.minShift ? undefined : 5,
    });
  };

  if (!hasData) {
    return (
      <div className={`historical-comparison ${className}`}>
        <div className="glass-surface rounded-xl p-4 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            Historical election data not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`historical-comparison ${className}`}>
      {/* Header */}
      <div className="glass-surface rounded-t-xl p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
              Historical Comparison
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {stateCode} {chamberLabel} - Margin shifts between elections
            </p>
          </div>

          {/* Period Selector */}
          <select
            value={period.label}
            onChange={handlePeriodChange}
            className="px-3 py-1.5 text-sm rounded-lg border focus-ring"
            style={{
              background: 'var(--card-bg)',
              borderColor: 'var(--class-purple-light)',
              color: 'var(--text-color)',
            }}
          >
            {COMPARISON_PERIODS.map(p => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="glass-surface p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}>
          <StatCard
            label="Dem Improved"
            value={summary.demImproved}
            color="var(--party-dem)"
            subtext={`up to ${summary.maxDemSwing.toFixed(0)}pts`}
          />
          <StatCard
            label="Rep Improved"
            value={summary.repImproved}
            color="var(--party-rep)"
            subtext={`up to ${summary.maxRepSwing.toFixed(0)}pts`}
          />
          <StatCard
            label="Stable"
            value={summary.stable}
            color="var(--text-muted)"
            subtext="within 2pts"
          />
          {!compact && (
            <StatCard
              label="Avg Shift"
              value={`${summary.avgShift > 0 ? '+' : ''}${summary.avgShift.toFixed(1)}`}
              color={summary.avgShift < 0 ? 'var(--party-dem)' : summary.avgShift > 0 ? 'var(--party-rep)' : 'var(--text-muted)'}
              subtext={summary.avgShift < 0 ? 'toward Dem' : summary.avgShift > 0 ? 'toward Rep' : 'neutral'}
            />
          )}
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className="glass-surface p-3 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <ColorScaleLegend />
      </div>

      {/* Filter Toggle */}
      <div className="glass-surface p-3 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.minShift === 5}
            onChange={toggleSignificantOnly}
            className="rounded border-gray-300"
          />
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Show only significant shifts (&gt;5pts)
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--class-purple-bg)', color: 'var(--class-purple)' }}>
            {summary.significantShifts} districts
          </span>
        </label>
      </div>

      {/* Top Movers */}
      {!compact && (
        <div className="glass-surface rounded-b-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Dem Movers */}
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--party-dem)' }}>
                Biggest Dem Gains
              </h3>
              {topMovers.dem.length > 0 ? (
                <ul className="space-y-1">
                  {topMovers.dem.map(d => (
                    <li
                      key={d.districtNumber}
                      className="flex items-center justify-between text-sm p-1.5 rounded"
                      style={{ background: 'var(--party-dem-bg)' }}
                    >
                      <span style={{ color: 'var(--text-color)' }}>
                        District {d.districtNumber}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--party-dem)' }}>
                        {getHistoricalDeltaLabel(d.delta ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No significant Dem gains
                </p>
              )}
            </div>

            {/* Rep Movers */}
            <div>
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--party-rep)' }}>
                Biggest Rep Gains
              </h3>
              {topMovers.rep.length > 0 ? (
                <ul className="space-y-1">
                  {topMovers.rep.map(d => (
                    <li
                      key={d.districtNumber}
                      className="flex items-center justify-between text-sm p-1.5 rounded"
                      style={{ background: 'var(--party-rep-bg)' }}
                    >
                      <span style={{ color: 'var(--text-color)' }}>
                        District {d.districtNumber}
                      </span>
                      <span className="font-medium" style={{ color: 'var(--party-rep)' }}>
                        {getHistoricalDeltaLabel(d.delta ?? 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  No significant Rep gains
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {compact && (
        <div className="glass-surface rounded-b-xl p-3 text-center">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {summary.significantShifts} significant shifts (&gt;5pts)
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Export color utilities for external use
 */
export { getHistoricalDeltaColor, getHistoricalDeltaLabel, HISTORICAL_DELTA_COLORS };
