'use client';

import { useMemo } from 'react';
import {
  useRecruitmentRadar,
  type UseRecruitmentRadarOptions,
  type RecruitmentTarget,
} from '@/hooks/useRecruitmentRadar';
import type { CandidatesData, ElectionsData, Chamber } from '@/types/schema';

interface RecruitmentRadarProps {
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
  /** Minimum score threshold (default: 50) */
  minScore?: number;
  /** Maximum targets to show (default: 10) */
  maxTargets?: number;
  /** Filing deadline for display */
  filingDeadline?: string;
  /** Callback when target is clicked */
  onTargetClick?: (districtNumber: number) => void;
  /** Additional className */
  className?: string;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/**
 * Urgency badge component
 */
function UrgencyBadge({ urgency }: { urgency: RecruitmentTarget['urgency'] }) {
  const config = {
    critical: { bg: '#FEE2E2', color: '#B91C1C', label: 'CRITICAL' },
    high: { bg: '#FEF3C7', color: '#92400E', label: 'HIGH' },
    medium: { bg: '#DBEAFE', color: '#1E40AF', label: 'MEDIUM' },
    low: { bg: '#F3F4F6', color: '#6B7280', label: 'LOW' },
  }[urgency];

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
 * Target card component
 */
function TargetCard({
  target,
  onClick,
  showDetails = true,
}: {
  target: RecruitmentTarget;
  onClick?: () => void;
  showDetails?: boolean;
}) {
  return (
    <div
      className={`recruitment-target p-3 rounded-lg border transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${target.urgency === 'critical' ? 'recruitment-pulse' : ''}`}
      style={{
        background: target.urgency === 'critical'
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
          : 'var(--card-bg)',
        borderColor: target.urgency === 'critical' ? '#FECACA' : 'var(--class-purple-light)',
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: target.rank <= 3 ? '#1E40AF' : 'var(--class-purple-light)',
                color: target.rank <= 3 ? 'white' : 'var(--text-color)',
              }}
            >
              {target.rank}
            </span>
            <span className="font-display font-bold" style={{ color: 'var(--text-color)' }}>
              District {target.districtNumber}
            </span>
            <UrgencyBadge urgency={target.urgency} />
          </div>

          {showDetails && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>
                Score: <strong style={{ color: 'var(--class-purple)' }}>{target.opportunityScore.toFixed(0)}</strong>
              </span>
              {target.lastMargin !== null && (
                <span>
                  Margin: <strong>{target.lastMargin.toFixed(1)}pts</strong>
                </span>
              )}
              {target.isOpenSeat && (
                <span className="text-green-600 font-medium">Open Seat</span>
              )}
              {target.trendingDem && (
                <span className="text-blue-600 font-medium">Trending Dem</span>
              )}
            </div>
          )}
        </div>

        <div className="text-right">
          <div
            className="text-lg font-bold font-display"
            style={{
              color: target.opportunityScore >= 70 ? '#059669' : target.opportunityScore >= 60 ? '#1E40AF' : '#6B7280',
            }}
          >
            {target.opportunityScore.toFixed(0)}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            score
          </div>
        </div>
      </div>

      {showDetails && target.incumbent && (
        <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          Incumbent: {target.incumbent.name} ({target.incumbent.party})
        </div>
      )}
    </div>
  );
}

/**
 * RecruitmentRadar - Candidate Recruitment Target Finder
 *
 * Identifies and ranks districts needing Democratic candidates
 * based on opportunity scores and election competitiveness.
 *
 * Features:
 * - Ranked list of recruitment targets
 * - Urgency indicators (critical/high/medium/low)
 * - CSS pulse animation on critical targets
 * - Summary statistics
 * - Click-to-navigate integration
 *
 * @example
 * ```tsx
 * <RecruitmentRadar
 *   stateCode="SC"
 *   chamber="house"
 *   candidatesData={candidatesData}
 *   electionsData={electionsData}
 *   chamberLabel="House"
 *   onTargetClick={(district) => setSelectedDistrict(district)}
 * />
 * ```
 */
export default function RecruitmentRadar({
  stateCode,
  chamber,
  candidatesData,
  electionsData,
  chamberLabel,
  minScore = 50,
  maxTargets = 10,
  filingDeadline,
  onTargetClick,
  className = '',
  compact = false,
}: RecruitmentRadarProps) {
  const {
    targets,
    summary,
    criticalTargets,
    highPriorityTargets,
  } = useRecruitmentRadar({
    chamber,
    candidatesData,
    electionsData,
    minScore,
    maxTargets,
    filingDeadline,
  });

  // Display targets (limited in compact mode)
  const displayTargets = compact ? targets.slice(0, 5) : targets;

  return (
    <div className={`recruitment-radar ${className}`}>
      {/* Pulse animation styles */}
      <style jsx global>{`
        @keyframes recruitment-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(185, 28, 28, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(185, 28, 28, 0); }
        }
        .recruitment-pulse {
          animation: recruitment-pulse 2s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .recruitment-pulse {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <div className="glass-surface rounded-t-xl p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
              Recruitment Radar
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {stateCode} {chamberLabel} - Districts needing Democratic candidates
            </p>
          </div>
          {summary.criticalTargets > 0 && (
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-semibold recruitment-pulse"
              style={{ background: '#FEE2E2', color: '#B91C1C' }}
            >
              {summary.criticalTargets} Critical
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="glass-surface p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-4'} gap-4 text-center`}>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Targets
            </div>
            <div className="text-xl font-bold font-display" style={{ color: 'var(--class-purple)' }}>
              {summary.totalTargets}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Open Seats
            </div>
            <div className="text-xl font-bold font-display" style={{ color: '#059669' }}>
              {summary.openSeats}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Trending Dem
            </div>
            <div className="text-xl font-bold font-display" style={{ color: '#1E40AF' }}>
              {summary.trendingDemTargets}
            </div>
          </div>
          {!compact && (
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                Avg Score
              </div>
              <div className="text-xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
                {summary.avgScore.toFixed(0)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filing Deadline Alert */}
      {filingDeadline && (
        <div
          className="glass-surface px-4 py-2 border-b text-center text-sm"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderColor: '#F59E0B',
            color: '#92400E',
          }}
        >
          Filing Deadline: <strong>{filingDeadline}</strong>
        </div>
      )}

      {/* Target List */}
      <div className="glass-surface p-4">
        {targets.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: '#ECFDF5' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="#059669" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: '#059669' }}>
              All high-opportunity districts have candidates!
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              No districts with score &gt;{minScore} need candidates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayTargets.map((target) => (
              <TargetCard
                key={target.districtNumber}
                target={target}
                onClick={onTargetClick ? () => onTargetClick(target.districtNumber) : undefined}
                showDetails={!compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* See All Link (in compact mode) */}
      {compact && targets.length > 5 && (
        <div className="glass-surface rounded-b-xl p-3 text-center border-t" style={{ borderColor: 'var(--class-purple-light)' }}>
          <span className="text-sm" style={{ color: 'var(--class-purple)' }}>
            +{targets.length - 5} more targets
          </span>
        </div>
      )}

      {!compact && targets.length > 0 && (
        <div className="glass-surface rounded-b-xl p-3 text-center border-t" style={{ borderColor: 'var(--class-purple-light)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Targets ranked by opportunity score. Critical = score 70+ and margin &lt;10pts.
          </p>
        </div>
      )}
    </div>
  );
}

export { UrgencyBadge, TargetCard };
