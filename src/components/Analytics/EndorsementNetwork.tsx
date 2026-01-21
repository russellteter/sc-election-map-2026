'use client';

import { useMemo } from 'react';
import {
  useEndorsementData,
  ENDORSEMENT_TYPES,
  getEndorsementTypeConfig,
  type EndorsementType,
  type Endorsement,
} from '@/hooks/useEndorsementData';
import DemoBadge from '@/components/ui/DemoBadge';
import type { Chamber } from '@/types/schema';

interface EndorsementNetworkProps {
  /** State code */
  stateCode: string;
  /** Chamber being viewed */
  chamber: Chamber;
  /** Active endorsement type filters */
  activeTypes?: string[];
  /** Callback when type filters change */
  onTypesChange?: (types: string[]) => void;
  /** Callback when district is clicked */
  onDistrictClick?: (districtNumber: number) => void;
  /** Additional className */
  className?: string;
}

/**
 * Type filter badge component
 */
function TypeBadge({
  type,
  count,
  isActive,
  onToggle,
}: {
  type: { id: EndorsementType; label: string; icon: string; color: string };
  count: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200
        ${isActive ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}
      `}
      style={{
        background: isActive
          ? `${type.color}20`
          : 'var(--card-bg)',
        color: isActive ? type.color : 'var(--text-muted)',
        border: `1px solid ${isActive ? type.color : 'var(--border-subtle)'}`,
      }}
    >
      <span role="img" aria-hidden="true">{type.icon}</span>
      <span>{type.label}</span>
      <span
        className="text-xs px-1.5 py-0.5 rounded-full"
        style={{
          background: isActive ? type.color : 'var(--class-purple-light)',
          color: isActive ? 'white' : 'var(--text-muted)',
        }}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * Endorsement card component
 */
function EndorsementCard({
  endorsement,
  onClick,
}: {
  endorsement: Endorsement;
  onClick?: () => void;
}) {
  const typeConfig = getEndorsementTypeConfig(endorsement.endorserType);

  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-0.5 text-left"
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
              style={{ background: `${typeConfig.color}20`, color: typeConfig.color }}
            >
              {typeConfig.icon}
            </span>
            <span className="font-medium" style={{ color: 'var(--text-color)' }}>
              {endorsement.endorserName}
            </span>
          </div>
          <div className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            District {endorsement.districtNumber} - {endorsement.candidateName}
          </div>
          {endorsement.date && (
            <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(endorsement.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
        <span
          className="text-xs px-2 py-1 rounded"
          style={{ background: `${typeConfig.color}20`, color: typeConfig.color }}
        >
          {typeConfig.label}
        </span>
      </div>
    </button>
  );
}

/**
 * EndorsementNetwork - Endorsement Visualization Panel
 *
 * Displays endorsements as a filterable list with district links.
 *
 * Features:
 * - Type-based filtering
 * - District click navigation
 * - Summary statistics
 * - Recent endorsements feed
 *
 * @example
 * ```tsx
 * <EndorsementNetwork
 *   stateCode="SC"
 *   chamber="house"
 *   activeTypes={['labor', 'environment']}
 *   onTypesChange={(types) => setTypes(types)}
 *   onDistrictClick={(d) => setSelectedDistrict(d)}
 * />
 * ```
 */
export default function EndorsementNetwork({
  stateCode,
  chamber,
  activeTypes = [],
  onTypesChange,
  onDistrictClick,
  className = '',
}: EndorsementNetworkProps) {
  const parsedActiveTypes = activeTypes.filter(Boolean) as EndorsementType[];

  const {
    isLoading,
    error,
    filteredEndorsements,
    districtsWithEndorsements,
    summary,
    // getDistrictEndorsements exposed by hook for map integration
  } = useEndorsementData({
    stateCode,
    chamber,
    activeTypes: parsedActiveTypes,
  });

  // Group endorsements by district for summary
  const endorsementsByDistrict = useMemo(() => {
    const map = new Map<number, Endorsement[]>();
    filteredEndorsements.forEach((e) => {
      const existing = map.get(e.districtNumber) || [];
      existing.push(e);
      map.set(e.districtNumber, existing);
    });
    return map;
  }, [filteredEndorsements]);

  // Sort districts by endorsement count
  const topDistricts = useMemo(() => {
    return Array.from(endorsementsByDistrict.entries())
      .map(([district, endorsements]) => ({ district, count: endorsements.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [endorsementsByDistrict]);

  // Toggle type filter
  const toggleType = (type: EndorsementType) => {
    const newTypes = parsedActiveTypes.includes(type)
      ? parsedActiveTypes.filter((t) => t !== type)
      : [...parsedActiveTypes, type];

    onTypesChange?.(newTypes);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`endorsement-network ${className}`}>
        <div className="glass-surface rounded-xl p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-24 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`endorsement-network ${className}`}>
        <div className="glass-surface rounded-xl p-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Failed to load endorsement data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`endorsement-network ${className}`}>
      {/* Header */}
      <div
        className="glass-surface rounded-t-xl p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
              Endorsement Network
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {stateCode} {chamber === 'house' ? 'House' : 'Senate'} endorsements
            </p>
          </div>
          <DemoBadge />
        </div>
      </div>

      {/* Type filters */}
      <div
        className="glass-surface p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="flex flex-wrap gap-2">
          {ENDORSEMENT_TYPES.map((type) => (
            <TypeBadge
              key={type.id}
              type={type}
              count={summary?.byType[type.id] || 0}
              isActive={parsedActiveTypes.length === 0 || parsedActiveTypes.includes(type.id)}
              onToggle={() => toggleType(type.id)}
            />
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {summary && (
        <div
          className="glass-surface p-4 border-b"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Total
              </div>
              <div className="text-xl font-bold font-display" style={{ color: 'var(--class-purple)' }}>
                {filteredEndorsements.length}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                endorsements
              </div>
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Districts
              </div>
              <div className="text-xl font-bold font-display" style={{ color: '#3B82F6' }}>
                {districtsWithEndorsements.size}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                with endorsements
              </div>
            </div>
            <div>
              <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Top Endorser
              </div>
              <div className="text-xl font-bold font-display" style={{ color: '#F59E0B' }}>
                {Object.entries(summary.byType).sort((a, b) => b[1] - a[1])[0]?.[0] === 'labor' ? 'Labor' : 'Other'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                type
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top districts by endorsements */}
      <div
        className="glass-surface p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
          Most Endorsed Districts
        </h3>
        <div className="flex flex-wrap gap-2">
          {topDistricts.map(({ district, count }) => (
            <button
              key={district}
              onClick={() => onDistrictClick?.(district)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-sm"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-color)',
              }}
            >
              D{district} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Recent endorsements */}
      <div className="glass-surface p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
          {parsedActiveTypes.length > 0 ? 'Filtered' : 'Recent'} Endorsements
        </h3>
        {filteredEndorsements.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: '#F3F4F6' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="#6B7280" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No endorsements match filters
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredEndorsements.slice(0, 15).map((endorsement) => (
              <EndorsementCard
                key={endorsement.id}
                endorsement={endorsement}
                onClick={() => onDistrictClick?.(endorsement.districtNumber)}
              />
            ))}
            {filteredEndorsements.length > 15 && (
              <div className="text-center pt-2">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  +{filteredEndorsements.length - 15} more endorsements
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="glass-surface rounded-b-xl p-3 text-center border-t"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Click endorsement type badges to filter. Demo data shown.
        </p>
      </div>
    </div>
  );
}
