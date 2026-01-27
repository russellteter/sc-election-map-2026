'use client';

import type { DistrictOpportunity, DistrictElectionHistory, Candidate } from '@/types/schema';
import { Badge, Button } from '@/components/ui';
import Link from 'next/link';

interface StrategicRecommendationsProps {
  opportunity: DistrictOpportunity | undefined;
  history: DistrictElectionHistory | undefined;
  candidates: Candidate[];
  chamber: 'house' | 'senate';
  districtNumber: number;
}

/**
 * StrategicRecommendations - Actionable strategic insights and next steps
 */
export default function StrategicRecommendations({
  opportunity,
  history,
  candidates,
  chamber,
  districtNumber,
}: StrategicRecommendationsProps) {
  if (!opportunity) {
    return null;
  }

  // Generate contextual recommendations based on data
  const recommendations = generateRecommendations(opportunity, history, candidates);

  return (
    <div className="glass-surface rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className="text-base font-semibold font-display"
          style={{ color: 'var(--text-color)' }}
        >
          Strategic Recommendations
        </h3>
        <Badge
          variant={
            opportunity.tier === 'HIGH_OPPORTUNITY' || opportunity.tier === 'DEFENSIVE'
              ? 'excellent'
              : opportunity.tier === 'EMERGING'
              ? 'info'
              : 'neutral'
          }
          size="sm"
        >
          {getPriorityLabel(opportunity.tier)}
        </Badge>
      </div>

      {/* Primary recommendation */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: getRecommendationBackground(opportunity.tier),
          border: `1px solid ${getRecommendationBorder(opportunity.tier)}`,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: getRecommendationIconBg(opportunity.tier) }}
          >
            {getRecommendationIcon(opportunity.tier)}
          </div>
          <div>
            <p
              className="font-semibold text-sm"
              style={{ color: getRecommendationTextColor(opportunity.tier) }}
            >
              {opportunity.recommendation}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Based on opportunity score of {opportunity.opportunityScore} and {opportunity.tierLabel.toLowerCase()} classification
            </p>
          </div>
        </div>
      </div>

      {/* Action items */}
      <div className="space-y-3">
        <h4
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Recommended Actions
        </h4>

        <div className="space-y-2">
          {recommendations.map((rec, index) => (
            <RecommendationItem
              key={index}
              recommendation={rec}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Context-specific insights */}
      {(opportunity.flags.openSeat || opportunity.flags.trendingDem || (opportunity.metrics?.avgMargin ?? 100) < 15) && (
        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Key Opportunities
          </h4>

          <div className="space-y-2">
            {opportunity.flags.openSeat && (
              <InsightCard
                icon="star"
                title="Open Seat Advantage"
                description="No incumbent advantage to overcome - historically improves Democratic performance by 5-10 points."
                variant="success"
              />
            )}

            {opportunity.flags.trendingDem && (
              <InsightCard
                icon="trending"
                title="Positive Momentum"
                description={`Democratic margins have improved by ${Math.abs(opportunity.metrics?.trendChange ?? 0).toFixed(1)}% over recent cycles.`}
                variant="success"
              />
            )}

            {(opportunity.metrics?.avgMargin ?? 100) < 15 && !opportunity.flags.defensive && (
              <InsightCard
                icon="target"
                title="Competitive District"
                description={`Average margin of only ${(opportunity.metrics?.avgMargin ?? 0).toFixed(1)}% makes this district winnable with proper investment.`}
                variant="info"
              />
            )}

            {opportunity.flags.defensive && (
              <InsightCard
                icon="shield"
                title="Defensive Priority"
                description="Democratic incumbent needs strong support to protect this seat in 2026."
                variant="warning"
              />
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link href={`/sc?chamber=${chamber}&district=${districtNumber}`} className="flex-1">
          <Button variant="primary" fullWidth>
            View on Map
          </Button>
        </Link>
        <Link href="/opportunities" className="flex-1">
          <Button variant="secondary" fullWidth>
            Compare Districts
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
}

function generateRecommendations(
  opportunity: DistrictOpportunity,
  history: DistrictElectionHistory | undefined,
  candidates: Candidate[]
): Recommendation[] {
  const recs: Recommendation[] = [];
  const hasDemocrat = candidates.some((c) => c.party?.toLowerCase() === 'democratic');

  // High priority: Candidate recruitment
  if (opportunity.flags.needsCandidate) {
    recs.push({
      priority: 'high',
      action: 'Recruit qualified Democratic candidate',
      rationale: `High opportunity score (${opportunity.opportunityScore}) but no Democratic candidate filed`,
    });
  }

  // Defensive: Incumbent support
  if (opportunity.flags.defensive) {
    recs.push({
      priority: 'high',
      action: 'Maximize incumbent support and resources',
      rationale: 'Democratic incumbent in competitive district needs strong backing',
    });
  }

  // Open seat strategy
  if (opportunity.flags.openSeat && !opportunity.flags.needsCandidate && hasDemocrat) {
    recs.push({
      priority: 'high',
      action: 'Prioritize early voter contact and name recognition',
      rationale: 'Open seat races reward early campaign activity',
    });
  }

  // Trending districts
  if (opportunity.flags.trendingDem && opportunity.opportunityScore >= 50) {
    recs.push({
      priority: 'medium',
      action: 'Invest in voter registration and turnout operations',
      rationale: `${Math.abs(opportunity.metrics?.trendChange ?? 0).toFixed(1)}% improvement trend suggests growing Democratic base`,
    });
  }

  // Competitive districts
  if ((opportunity.metrics?.avgMargin ?? 100) < 20 && hasDemocrat) {
    recs.push({
      priority: 'medium',
      action: 'Focus on persuasion messaging for swing voters',
      rationale: `Narrow ${(opportunity.metrics?.avgMargin ?? 0).toFixed(1)}% average margin indicates persuadable voters`,
    });
  }

  // Build tier
  if (opportunity.tier === 'BUILD') {
    recs.push({
      priority: 'low',
      action: 'Develop local party infrastructure',
      rationale: 'Long-term investment in party building for future cycles',
    });
  }

  // Non-competitive
  if (opportunity.tier === 'NON_COMPETITIVE') {
    recs.push({
      priority: 'low',
      action: 'Minimal resource allocation',
      rationale: 'Focus resources on more competitive districts',
    });
  }

  // Ensure at least one recommendation
  if (recs.length === 0) {
    recs.push({
      priority: 'medium',
      action: 'Monitor race developments',
      rationale: 'Continue tracking candidate filings and district dynamics',
    });
  }

  return recs;
}

interface RecommendationItemProps {
  recommendation: Recommendation;
  index: number;
}

function RecommendationItem({ recommendation, index }: RecommendationItemProps) {
  const priorityColors = {
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'at-risk' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'attention' },
    low: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'neutral' },
  };

  const colors = priorityColors[recommendation.priority];

  return (
    <div
      className={`p-3 rounded-lg border animate-entrance ${colors.bg} ${colors.border}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start gap-2">
        <Badge
          variant={colors.badge as 'at-risk' | 'attention' | 'neutral'}
          size="sm"
        >
          {recommendation.priority.toUpperCase()}
        </Badge>
        <div className="flex-1">
          <p className={`text-sm font-medium ${colors.text}`}>
            {recommendation.action}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {recommendation.rationale}
          </p>
        </div>
      </div>
    </div>
  );
}

interface InsightCardProps {
  icon: 'star' | 'trending' | 'target' | 'shield';
  title: string;
  description: string;
  variant: 'success' | 'info' | 'warning';
}

function InsightCard({ icon, title, description, variant }: InsightCardProps) {
  const colors = {
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-700' },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', text: 'text-amber-700' },
  };

  const icons = {
    star: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ),
    trending: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
      </svg>
    ),
    target: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    shield: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
      </svg>
    ),
  };

  const style = colors[variant];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}>
      <span className={style.icon}>{icons[icon]}</span>
      <div>
        <p className={`text-sm font-medium ${style.text}`}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// Helper functions for styling
function getPriorityLabel(tier: string): string {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return 'High Priority';
    case 'DEFENSIVE':
      return 'Protect';
    case 'EMERGING':
      return 'Watch List';
    case 'BUILD':
      return 'Long Term';
    default:
      return 'Low Priority';
  }
}

function getRecommendationBackground(tier: string): string {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)';
    case 'DEFENSIVE':
      return 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)';
    case 'EMERGING':
      return 'linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%)';
    default:
      return 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)';
  }
}

function getRecommendationBorder(tier: string): string {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return 'rgba(5, 150, 105, 0.3)';
    case 'DEFENSIVE':
      return 'rgba(37, 99, 235, 0.3)';
    case 'EMERGING':
      return 'rgba(8, 145, 178, 0.3)';
    default:
      return 'rgba(107, 114, 128, 0.3)';
  }
}

function getRecommendationIconBg(tier: string): string {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return '#059669';
    case 'DEFENSIVE':
      return '#2563EB';
    case 'EMERGING':
      return '#0891B2';
    default:
      return '#6B7280';
  }
}

function getRecommendationTextColor(tier: string): string {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return '#065F46';
    case 'DEFENSIVE':
      return '#1E40AF';
    case 'EMERGING':
      return '#155E75';
    default:
      return '#374151';
  }
}

function getRecommendationIcon(tier: string) {
  const iconClass = 'w-4 h-4 text-white';

  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    case 'DEFENSIVE':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
        </svg>
      );
    case 'EMERGING':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
  }
}
