'use client';

import Link from 'next/link';
import type { DistrictOpportunity } from '@/types/schema';
import { Badge } from '@/components/ui';

// Tier colors matching the map
const TIER_COLORS = {
  HIGH_OPPORTUNITY: '#059669',
  EMERGING: '#0891B2',
  BUILD: '#D97706',
  DEFENSIVE: '#3676eb',
  NON_COMPETITIVE: '#9CA3AF',
} as const;

// Badge variant mapping
const TIER_BADGE_VARIANTS = {
  HIGH_OPPORTUNITY: 'excellent',
  EMERGING: 'info',
  BUILD: 'attention',
  DEFENSIVE: 'info',
  NON_COMPETITIVE: 'neutral',
} as const;

interface OpportunityCardProps {
  district: DistrictOpportunity;
  chamber: 'house' | 'senate';
  candidate?: {
    name: string;
    party?: string | null;
  } | null;
  animationDelay?: number;
}

/**
 * Mobile-optimized card for displaying district opportunity data.
 * Replaces the table view on mobile screens.
 */
export default function OpportunityCard({
  district,
  chamber,
  candidate,
  animationDelay = 0,
}: OpportunityCardProps) {
  const tierColor = TIER_COLORS[district.tier];
  const trendChange = district.metrics?.trendChange ?? 0;
  const trendDirection =
    trendChange > 0
      ? 'up'
      : trendChange < 0
      ? 'down'
      : 'stable';

  return (
    <div
      className="opportunity-card glass-surface rounded-xl p-4 animate-entrance"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header row: District name + Score */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3
            className="font-semibold font-display text-base"
            style={{ color: 'var(--text-color)' }}
          >
            {chamber === 'house' ? 'House' : 'Senate'} {district.districtNumber}
          </h3>
          <Badge
            variant={TIER_BADGE_VARIANTS[district.tier] as 'excellent' | 'info' | 'attention' | 'neutral'}
            size="sm"
            className="mt-1"
          >
            {district.tierLabel}
          </Badge>
        </div>
        <div className="text-right">
          <span
            className="font-bold font-display text-2xl"
            style={{ color: tierColor }}
          >
            {district.opportunityScore}
          </span>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Score
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 gap-3 py-3 border-t border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        {/* Trend */}
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Trend
          </p>
          <p
            className="font-medium text-sm flex items-center gap-1"
            style={{
              color:
                trendDirection === 'up'
                  ? '#059669'
                  : trendDirection === 'down'
                  ? '#DC2626'
                  : 'var(--text-muted)',
            }}
          >
            <span className="text-lg">
              {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'}
            </span>
            {Math.abs(trendChange).toFixed(1)}%
          </p>
        </div>

        {/* Competitiveness */}
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Competitiveness
          </p>
          <p
            className="font-medium text-sm"
            style={{ color: 'var(--text-color)' }}
          >
            {district.metrics?.competitivenessScore ?? 0}%
          </p>
        </div>
      </div>

      {/* Flags row */}
      {(district.flags.openSeat ||
        district.flags.needsCandidate ||
        district.flags.defensive ||
        district.flags.trendingDem) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {district.flags.openSeat && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
              Open Seat
            </span>
          )}
          {district.flags.needsCandidate && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700">
              Needs Candidate
            </span>
          )}
          {district.flags.defensive && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">
              Defensive
            </span>
          )}
          {district.flags.trendingDem && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-teal-100 text-teal-700">
              Trending Dem
            </span>
          )}
        </div>
      )}

      {/* Candidate + Action */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
            Democratic Candidate
          </p>
          {candidate ? (
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--class-purple)' }}
            >
              {candidate.name.split(',').reverse().join(' ').trim()}
            </p>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
              None filed
            </p>
          )}
        </div>
        <Link
          href={`/?chamber=${chamber}&district=${district.districtNumber}`}
          className="flex-shrink-0 ml-3 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-95"
          style={{
            background: 'var(--class-purple)',
            color: 'white',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          View Map
        </Link>
      </div>
    </div>
  );
}
