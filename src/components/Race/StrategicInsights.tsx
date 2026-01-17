'use client';

import type { DistrictOpportunity, DistrictElectionHistory, Chamber } from '@/types/schema';
import { Badge } from '@/components/ui';
import Sparkline from '@/components/Charts/Sparkline';
import { MobilizationCard } from '@/components/Intelligence';

interface StrategicInsightsProps {
  opportunity: DistrictOpportunity | undefined;
  history: DistrictElectionHistory | undefined;
  chamber?: Chamber;
  districtNumber?: number;
}

// Tier colors for visual consistency
const TIER_COLORS = {
  HIGH_OPPORTUNITY: '#059669',
  EMERGING: '#0891B2',
  BUILD: '#D97706',
  DEFENSIVE: '#3676eb',
  NON_COMPETITIVE: '#9CA3AF',
} as const;

/**
 * StrategicInsights - Tier, flippability score, and key strategic facts
 */
export default function StrategicInsights({
  opportunity,
  history,
  chamber,
  districtNumber,
}: StrategicInsightsProps) {
  if (!opportunity) {
    return (
      <div
        className="text-center py-8"
        style={{ color: 'var(--text-muted)' }}
      >
        No strategic data available
      </div>
    );
  }

  // Calculate sparkline values from election margins
  const sparklineValues: number[] = [];
  if (history) {
    const years = ['2020', '2022', '2024'];
    years.forEach((year) => {
      const election = history.elections[year];
      if (election && !election.uncontested) {
        // Convert margin to Democratic perspective (positive = good for Dems)
        const demMargin =
          election.winner.party?.toLowerCase() === 'democratic'
            ? election.margin
            : -election.margin;
        sparklineValues.push(demMargin);
      }
    });
  }

  const tierColor = TIER_COLORS[opportunity.tier];

  return (
    <div className="glass-surface rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-base font-semibold font-display"
          style={{ color: 'var(--text-color)' }}
        >
          Strategic Analysis
        </h3>
        <Badge
          variant={
            opportunity.tier === 'HIGH_OPPORTUNITY'
              ? 'excellent'
              : opportunity.tier === 'DEFENSIVE'
              ? 'info'
              : opportunity.tier === 'EMERGING'
              ? 'info'
              : opportunity.tier === 'BUILD'
              ? 'attention'
              : 'neutral'
          }
          size="md"
        >
          {opportunity.tierLabel}
        </Badge>
      </div>

      {/* Opportunity Score Visual */}
      <div className="relative">
        <div className="flex items-end justify-between mb-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Opportunity Score
          </span>
          <span
            className="text-3xl font-bold font-display"
            style={{ color: tierColor }}
          >
            {opportunity.opportunityScore}
          </span>
        </div>

        {/* Score bar */}
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--class-purple-bg)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${opportunity.opportunityScore}%`,
              background: `linear-gradient(90deg, ${tierColor}80, ${tierColor})`,
            }}
          />
        </div>

        {/* Score labels */}
        <div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Contributing Factors
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {/* Competitiveness Factor */}
          <FactorCard
            label="Competitiveness"
            value={Math.round(opportunity.factors.competitiveness * 100)}
            maxValue={100}
            description="Historical race closeness"
          />

          {/* Margin Trend Factor */}
          <FactorCard
            label="Margin Trend"
            value={Math.round(opportunity.factors.marginTrend * 100)}
            maxValue={100}
            description="Dem margin improvement"
          />

          {/* Incumbency Factor */}
          <FactorCard
            label="Incumbency"
            value={Math.round(opportunity.factors.incumbency * 100)}
            maxValue={100}
            description={opportunity.factors.openSeatBonus ? 'Open seat bonus' : 'Incumbent factor'}
          />

          {/* Candidate Presence */}
          <FactorCard
            label="Dem Candidate"
            value={opportunity.factors.candidatePresence > 0 ? 100 : 0}
            maxValue={100}
            description={opportunity.flags.hasDemocrat ? 'Candidate filed' : 'No candidate yet'}
            isBinary
          />
        </div>
      </div>

      {/* Trend Sparkline */}
      {sparklineValues.length >= 2 && (
        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Democratic Margin Trend
              </p>
              <p
                className="text-sm font-medium mt-0.5"
                style={{
                  color: opportunity.metrics.trendChange > 0 ? '#059669' : '#DC2626',
                }}
              >
                {opportunity.metrics.trendChange > 0 ? '+' : ''}
                {opportunity.metrics.trendChange.toFixed(1)}% since 2020
              </p>
            </div>
            <Sparkline
              values={sparklineValues}
              trendPercent={opportunity.metrics.trendChange}
              width={80}
              height={32}
            />
          </div>
        </div>
      )}

      {/* Strategic Flags */}
      <div
        className="pt-4 border-t"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Key Indicators
        </h4>
        <div className="flex flex-wrap gap-2">
          {opportunity.flags.openSeat && (
            <FlagBadge label="Open Seat" variant="success" icon="star" />
          )}
          {opportunity.flags.needsCandidate && (
            <FlagBadge label="Needs Candidate" variant="warning" icon="alert" />
          )}
          {opportunity.flags.trendingDem && (
            <FlagBadge label="Trending Democratic" variant="success" icon="trending" />
          )}
          {opportunity.flags.defensive && (
            <FlagBadge label="Defensive Seat" variant="info" icon="shield" />
          )}
          {opportunity.flags.hasDemocrat && (
            <FlagBadge label="Democrat Filed" variant="success" icon="check" />
          )}
          {!opportunity.flags.openSeat &&
            !opportunity.flags.needsCandidate &&
            !opportunity.flags.trendingDem &&
            !opportunity.flags.defensive &&
            !opportunity.flags.hasDemocrat && (
              <span
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                No special indicators
              </span>
            )}
        </div>
      </div>

      {/* Voter Intelligence - Mobilization Card (Phase 2) */}
      {chamber && districtNumber && (
        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <MobilizationCard
            chamber={chamber}
            districtNumber={districtNumber}
            compact
          />
        </div>
      )}
    </div>
  );
}

interface FactorCardProps {
  label: string;
  value: number;
  maxValue: number;
  description: string;
  isBinary?: boolean;
}

function FactorCard({ label, value, maxValue, description, isBinary }: FactorCardProps) {
  const percentage = (value / maxValue) * 100;

  return (
    <div
      className="p-3 rounded-lg"
      style={{ background: 'var(--class-purple-bg)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
          {label}
        </span>
        <span
          className="text-sm font-bold"
          style={{
            color: isBinary
              ? value > 0
                ? '#059669'
                : '#DC2626'
              : percentage >= 70
              ? '#059669'
              : percentage >= 40
              ? '#D97706'
              : 'var(--text-muted)',
          }}
        >
          {isBinary ? (value > 0 ? 'Yes' : 'No') : `${value}%`}
        </span>
      </div>

      {!isBinary && (
        <div
          className="h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--class-purple-light)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${percentage}%`,
              background: percentage >= 70 ? '#059669' : percentage >= 40 ? '#D97706' : '#9CA3AF',
            }}
          />
        </div>
      )}

      <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    </div>
  );
}

interface FlagBadgeProps {
  label: string;
  variant: 'success' | 'warning' | 'info';
  icon: 'star' | 'alert' | 'trending' | 'shield' | 'check';
}

function FlagBadge({ label, variant, icon }: FlagBadgeProps) {
  const colors = {
    success: { bg: 'bg-green-100', text: 'text-green-700' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700' },
  };

  const icons = {
    star: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    alert: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    trending: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
    ),
    shield: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
      </svg>
    ),
    check: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${colors[variant].bg} ${colors[variant].text}`}
    >
      {icons[icon]}
      {label}
    </span>
  );
}
