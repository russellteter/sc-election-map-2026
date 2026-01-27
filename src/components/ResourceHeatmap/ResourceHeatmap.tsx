'use client';

import { useMemo, useCallback } from 'react';
import {
  useResourceHeatmap,
  type UseResourceHeatmapOptions,
  type ResourceAllocation,
} from '@/hooks/useResourceHeatmap';
import {
  RESOURCE_HEATMAP_COLORS,
  getResourceIntensityLabel,
  type ResourceIntensity,
} from '@/lib/districtColors';
import type { CandidatesData, ElectionsData, Chamber } from '@/types/schema';

interface ResourceHeatmapProps {
  /** State code for display */
  stateCode: string;
  /** Chamber to analyze */
  chamber: Chamber;
  /** Candidates data */
  candidatesData: CandidatesData;
  /** Elections data */
  electionsData: ElectionsData | null;
  /** Chamber label for display */
  chamberLabel: string;
  /** Callback when district is clicked */
  onDistrictClick?: (districtNumber: number) => void;
  /** Additional className */
  className?: string;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/**
 * Intensity badge component
 */
function IntensityBadge({ intensity }: { intensity: ResourceIntensity }) {
  const config = {
    hot: { bg: 'var(--rep-tint)', color: 'var(--error-700)', label: 'HOT' },
    warm: { bg: 'var(--warning-100)', color: 'var(--warning-700)', label: 'WARM' },
    cool: { bg: 'var(--dem-tint)', color: 'var(--party-dem)', label: 'COOL' },
    none: { bg: 'var(--slate-100)', color: 'var(--slate-500)', label: 'N/A' },
  }[intensity];

  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

/**
 * Legend showing the three intensity levels
 */
function IntensityLegend() {
  const items = [
    { label: 'Hot', sublabel: 'Invest Heavily', color: RESOURCE_HEATMAP_COLORS.HOT_BORDER },
    { label: 'Warm', sublabel: 'Maintain', color: RESOURCE_HEATMAP_COLORS.WARM_BORDER },
    { label: 'Cool', sublabel: 'Deprioritize', color: RESOURCE_HEATMAP_COLORS.COOL_BORDER },
  ];

  return (
    <div className="flex items-center justify-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-sm border-2"
            style={{
              backgroundColor: `${item.color}33`,
              borderColor: item.color,
            }}
          />
          <div className="text-xs">
            <span className="font-medium" style={{ color: item.color }}>
              {item.label}
            </span>
            <span style={{ color: 'var(--text-muted)' }}> - {item.sublabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Factor breakdown display
 */
function FactorBreakdown({ allocation }: { allocation: ResourceAllocation }) {
  const factors = [
    { label: 'Opportunity', value: allocation.factors.opportunity, weight: '40%' },
    { label: 'Mobilization', value: allocation.factors.mobilization, weight: '30%' },
    { label: 'Donor Capacity', value: allocation.factors.donorCapacity, weight: '15%' },
    { label: 'Trending', value: allocation.factors.trending, weight: '15%' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mt-2">
      {factors.map(({ label, value, weight }) => (
        <div key={label} className="text-center">
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {label} ({weight})
          </div>
          <div
            className="text-sm font-medium"
            style={{
              color: value >= 70 ? 'var(--accent-emerald)' : value >= 45 ? 'var(--status-attention)' : 'var(--text-muted)',
            }}
          >
            {value.toFixed(0)}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Allocation card component
 */
function AllocationCard({
  allocation,
  onClick,
  showDetails = true,
}: {
  allocation: ResourceAllocation;
  onClick?: () => void;
  showDetails?: boolean;
}) {
  const intensityColors = {
    hot: { bg: 'linear-gradient(135deg, var(--error-50) 0%, var(--rep-tint) 100%)', border: 'var(--rep-light)' },
    warm: { bg: 'linear-gradient(135deg, var(--warning-50) 0%, var(--warning-100) 100%)', border: 'var(--warning-100)' },
    cool: { bg: 'var(--card-bg)', border: 'var(--class-purple-light)' },
    none: { bg: 'var(--card-bg)', border: 'var(--border-subtle)' },
  }[allocation.intensity];

  return (
    <div
      className={`resource-allocation p-3 rounded-lg border transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      }`}
      style={{
        background: intensityColors.bg,
        borderColor: intensityColors.border,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold" style={{ color: 'var(--text-color)' }}>
              District {allocation.districtNumber}
            </span>
            <IntensityBadge intensity={allocation.intensity} />
          </div>

          {showDetails && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {allocation.lastMargin !== null && (
                <span>
                  Margin: <strong>{allocation.lastMargin.toFixed(1)}pts</strong>
                </span>
              )}
              {allocation.isOpenSeat && (
                <span className="text-green-600 font-medium">Open Seat</span>
              )}
              {allocation.hasDemCandidate && (
                <span className="text-blue-600 font-medium">Dem Candidate</span>
              )}
            </div>
          )}
        </div>

        <div className="text-right">
          <div
            className="text-lg font-bold font-display"
            style={{
              color: allocation.intensity === 'hot'
                ? 'var(--status-at-risk)'
                : allocation.intensity === 'warm'
                ? 'var(--status-attention)'
                : 'var(--slate-500)',
            }}
          >
            {allocation.compositeScore.toFixed(0)}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            score
          </div>
        </div>
      </div>

      {showDetails && <FactorBreakdown allocation={allocation} />}

      {showDetails && allocation.incumbent && (
        <div
          className="mt-2 pt-2 border-t text-xs"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          Incumbent: {allocation.incumbent.name} ({allocation.incumbent.party})
        </div>
      )}
    </div>
  );
}

/**
 * ResourceHeatmap - Campaign Resource Allocation Analysis
 *
 * Shows where campaign investment yields maximum ROI based on:
 * - Opportunity (40%): Competitiveness, margins, open seats
 * - Mobilization (30%): Turnout patterns, engagement potential
 * - Donor Capacity (15%): Fundraising potential
 * - Trending (15%): Margin improvement toward Democrats
 *
 * @example
 * ```tsx
 * <ResourceHeatmap
 *   stateCode="SC"
 *   chamber="house"
 *   candidatesData={candidatesData}
 *   electionsData={electionsData}
 *   chamberLabel="House"
 *   onDistrictClick={(district) => setSelectedDistrict(district)}
 * />
 * ```
 */
export default function ResourceHeatmap({
  stateCode,
  chamber,
  candidatesData,
  electionsData,
  chamberLabel,
  onDistrictClick,
  className = '',
  compact = false,
}: ResourceHeatmapProps) {
  const {
    filteredAllocations,
    summary,
    filters,
    setFilters,
    exportCSV,
    hasData,
  } = useResourceHeatmap({
    chamber,
    candidatesData,
    electionsData,
  });

  // Handle intensity filter toggle
  const toggleIntensityFilter = useCallback(
    (intensity: ResourceIntensity) => {
      const current = filters.intensities || [];
      const updated = current.includes(intensity)
        ? current.filter(i => i !== intensity)
        : [...current, intensity];
      setFilters({ ...filters, intensities: updated.length > 0 ? updated : undefined });
    },
    [filters, setFilters]
  );

  // Handle CSV export
  const handleExport = useCallback(() => {
    const csv = exportCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${stateCode.toLowerCase()}-${chamber}-resource-allocation.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportCSV, stateCode, chamber]);

  // Display allocations (limited in compact mode)
  const displayAllocations = compact
    ? filteredAllocations.filter(a => a.intensity === 'hot').slice(0, 5)
    : filteredAllocations.slice(0, 15);

  if (!hasData) {
    return (
      <div className={`resource-heatmap ${className}`}>
        <div className="glass-surface rounded-xl p-4 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            Resource allocation data not available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`resource-heatmap ${className}`}>
      {/* Header */}
      <div
        className="glass-surface rounded-t-xl p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
              Resource Allocation
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {stateCode} {chamberLabel} - Investment prioritization
            </p>
          </div>
          {!compact && (
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-opacity-10 transition-colors"
              style={{
                borderColor: 'var(--class-purple)',
                color: 'var(--class-purple)',
              }}
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div
        className="glass-surface p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-5'} gap-4 text-center`}>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Hot
            </div>
            <div className="text-xl font-bold font-display" style={{ color: 'var(--status-at-risk)' }}>
              {summary.hotDistricts}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Warm
            </div>
            <div className="text-xl font-bold font-display" style={{ color: 'var(--status-attention)' }}>
              {summary.warmDistricts}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Cool
            </div>
            <div className="text-xl font-bold font-display" style={{ color: 'var(--dem-lean)' }}>
              {summary.coolDistricts}
            </div>
          </div>
          {!compact && (
            <>
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Dem in Hot
                </div>
                <div className="text-xl font-bold font-display" style={{ color: 'var(--accent-emerald)' }}>
                  {summary.demCandidatesInHotZones}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                  Open in Hot
                </div>
                <div className="text-xl font-bold font-display" style={{ color: 'var(--competitive)' }}>
                  {summary.openSeatsInHotZones}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className="glass-surface p-3 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <IntensityLegend />
      </div>

      {/* Filter toggles */}
      {!compact && (
        <div
          className="glass-surface p-3 border-b"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Filter:
            </span>
            {(['hot', 'warm', 'cool'] as ResourceIntensity[]).map((intensity) => {
              const isActive = !filters.intensities || filters.intensities.includes(intensity);
              return (
                <label key={intensity} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleIntensityFilter(intensity)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm" style={{ color: 'var(--text-color)' }}>
                    {getResourceIntensityLabel(intensity)}
                  </span>
                </label>
              );
            })}
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--class-purple-bg)', color: 'var(--class-purple)' }}>
              {filteredAllocations.length} districts
            </span>
          </div>
        </div>
      )}

      {/* Allocation List */}
      <div className="glass-surface p-4">
        {displayAllocations.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: 'var(--slate-100)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="var(--slate-500)" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="font-medium" style={{ color: 'var(--text-muted)' }}>
              No districts match current filters
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Adjust filters to see more results
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayAllocations.map((allocation) => (
              <AllocationCard
                key={allocation.districtNumber}
                allocation={allocation}
                onClick={
                  onDistrictClick
                    ? () => onDistrictClick(allocation.districtNumber)
                    : undefined
                }
                showDetails={!compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {compact && filteredAllocations.filter(a => a.intensity === 'hot').length > 5 && (
        <div
          className="glass-surface rounded-b-xl p-3 text-center border-t"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <span className="text-sm" style={{ color: 'var(--class-purple)' }}>
            +{filteredAllocations.filter(a => a.intensity === 'hot').length - 5} more hot districts
          </span>
        </div>
      )}

      {!compact && displayAllocations.length > 0 && (
        <div
          className="glass-surface rounded-b-xl p-3 text-center border-t"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Composite score: Opportunity (40%) + Mobilization (30%) + Donor Capacity (15%) + Trending (15%)
          </p>
        </div>
      )}
    </div>
  );
}

export { IntensityBadge, AllocationCard, IntensityLegend };
