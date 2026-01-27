'use client';

import { useEffect, useState } from 'react';
import Badge from '@/components/ui/Badge';
import type { DistrictElectionHistory } from '@/types/schema';
import type { OpportunityData } from '@/lib/districtColors';

interface SidePanelStrategicInsightsProps {
  opportunity: OpportunityData;
  history?: DistrictElectionHistory | null;
}

function getTierBadgeVariant(tier: string): 'excellent' | 'info' | 'attention' | 'neutral' {
  switch (tier) {
    case 'HOT':
    case 'HIGH_OPPORTUNITY':
      return 'excellent';
    case 'DEFENSIVE':
    case 'EMERGING':
      return 'info';
    case 'WARM':
    case 'BUILD':
      return 'attention';
    default:
      return 'neutral';
  }
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'HOT':
    case 'HIGH_OPPORTUNITY':
      return 'var(--color-excellent)';
    case 'DEFENSIVE':
    case 'EMERGING':
      return 'var(--color-info, #3B82F6)';
    case 'WARM':
    case 'BUILD':
      return 'var(--color-attention)';
    default:
      return 'var(--text-muted)';
  }
}

function getFactorColor(value: number): string {
  if (value >= 70) return 'var(--color-excellent)';
  if (value >= 40) return 'var(--color-attention)';
  return 'var(--text-muted)';
}

export default function SidePanelStrategicInsights({
  opportunity,
  history,
}: SidePanelStrategicInsightsProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [showTier, setShowTier] = useState(false);

  const score = opportunity.opportunityScore;
  const tier = opportunity.tier;
  const tierColor = getTierColor(tier);

  // Animate score on mount
  useEffect(() => {
    setAnimatedScore(0);
    setBarWidth(0);
    setShowTier(false);

    const duration = 600;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);

      setAnimatedScore(Math.round(eased * score));
      setBarWidth(eased * score);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);

    const tierTimer = setTimeout(() => setShowTier(true), 400);
    return () => clearTimeout(tierTimer);
  }, [score]);

  // Build factors array from flags
  const factors: Array<{ label: string; value: number | boolean; isBool?: boolean }> = [];

  if (history?.competitiveness) {
    factors.push({ label: 'Competitiveness', value: history.competitiveness.score });
  }

  if (opportunity.margin !== null) {
    // Convert margin to a 0-100 factor (closer to 0 = more competitive = higher score)
    const marginFactor = Math.max(0, 100 - Math.abs(opportunity.margin) * 3);
    factors.push({ label: 'Margin Trend', value: Math.round(marginFactor) });
  }

  if (opportunity.flags.isOpenSeat !== undefined) {
    factors.push({ label: 'Open Seat', value: opportunity.flags.isOpenSeat, isBool: true });
  }

  if (opportunity.flags.hasDemocrat !== undefined) {
    factors.push({ label: 'Dem Candidate', value: opportunity.flags.hasDemocrat, isBool: true });
  }

  // Build flags
  const flagItems: Array<{ label: string; color: string; pulse?: boolean }> = [];

  if (opportunity.flags.isOpenSeat) {
    flagItems.push({ label: 'Open Seat', color: 'var(--color-excellent, #059669)' });
  }
  if (opportunity.flags.needsCandidate) {
    flagItems.push({ label: 'Needs Candidate', color: 'var(--color-attention, #D97706)', pulse: true });
  }
  if (opportunity.flags.hasDemocrat) {
    flagItems.push({ label: 'Democrat Filed', color: 'var(--color-excellent, #059669)' });
  }
  if (opportunity.flags.isDefensive) {
    flagItems.push({ label: 'Defensive Seat', color: 'var(--dem-lean, #3B82F6)' });
  }

  return (
    <div className="space-y-4">
      {/* Opportunity Score */}
      <div className="flex items-center gap-3">
        <span
          className="text-2xl font-bold font-display shrink-0"
          style={{ color: tierColor }}
        >
          {animatedScore}
        </span>
        <div className="flex-1">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--class-purple-bg)' }}
          >
            <div
              className="h-full rounded-full transition-none"
              style={{
                width: `${barWidth}%`,
                background: `linear-gradient(90deg, ${tierColor}80, ${tierColor})`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>0</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>50</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>100</span>
          </div>
        </div>
        <div
          className="shrink-0"
          style={{ opacity: showTier ? 1 : 0, transition: 'opacity 200ms ease' }}
        >
          <Badge variant={getTierBadgeVariant(tier)} size="sm">
            {tier}
          </Badge>
        </div>
      </div>

      {/* Contributing Factors */}
      {factors.length > 0 && (
        <div className="factor-grid grid grid-cols-2 gap-2">
          {factors.map((factor) => (
            <div
              key={factor.label}
              className="factor-card p-2 rounded-lg"
              style={{ background: 'var(--class-purple-bg)' }}
            >
              <div
                className="text-[10px] font-medium"
                style={{ color: 'var(--text-color)' }}
              >
                {factor.label}
              </div>
              {factor.isBool ? (
                <div className="flex items-center gap-1 mt-1">
                  {factor.value ? (
                    <>
                      <svg className="w-3 h-3" style={{ color: 'var(--color-excellent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-bold" style={{ color: 'var(--color-excellent)' }}>Yes</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>No</span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-xs font-bold mt-0.5" style={{ color: getFactorColor(factor.value as number) }}>
                    {factor.value as number}
                  </div>
                  <div
                    className="h-1 rounded-full mt-1 overflow-hidden"
                    style={{ background: 'var(--class-purple-light)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${factor.value as number}%`,
                        background: getFactorColor(factor.value as number),
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Strategic Flags */}
      {flagItems.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {flagItems.map((flag) => (
            <span
              key={flag.label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{
                background: `color-mix(in srgb, ${flag.color} 12%, transparent)`,
                color: flag.color,
              }}
            >
              <span
                className={`w-1 h-1 rounded-full shrink-0 ${flag.pulse ? 'pulse-dot' : ''}`}
                style={{ background: flag.color }}
              />
              <span className="flag-label">{flag.label}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          No special indicators
        </p>
      )}
    </div>
  );
}
