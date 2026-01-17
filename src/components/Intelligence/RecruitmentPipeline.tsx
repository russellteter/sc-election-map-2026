'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { findRecruitmentOpportunities, isConfigured, type RecruitmentOpportunity } from '@/lib/ballotready';
import type { OpportunityData } from '@/types/schema';

interface RecruitmentPipelineProps {
  opportunityData: OpportunityData;
  chamber: 'house' | 'senate';
}

export default function RecruitmentPipeline({
  opportunityData,
  chamber,
}: RecruitmentPipelineProps) {
  const [opportunities, setOpportunities] = useState<RecruitmentOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchOpportunities() {
      if (!isConfigured()) {
        // Fall back to local data
        const localOpps = getLocalRecruitmentOpportunities(opportunityData, chamber);
        setOpportunities(localOpps);
        setIsLoading(false);
        return;
      }

      try {
        const data = Object.entries(opportunityData[chamber]).map(([k, v]) => ({
          districtNumber: parseInt(k),
          opportunityScore: v.opportunityScore,
          tier: v.tier,
          flags: { hasDemocrat: v.flags.hasDemocrat },
        }));

        const result = await findRecruitmentOpportunities(
          Object.fromEntries(
            data.map((d) => [
              String(d.districtNumber),
              { opportunityScore: d.opportunityScore, tier: d.tier, flags: d.flags },
            ])
          ),
          chamber
        );

        setOpportunities(result.length > 0 ? result : getLocalRecruitmentOpportunities(opportunityData, chamber));
      } catch (error) {
        console.error('Failed to fetch recruitment opportunities:', error);
        setOpportunities(getLocalRecruitmentOpportunities(opportunityData, chamber));
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();
  }, [opportunityData, chamber]);

  // Count urgent opportunities
  const urgentCount = opportunities.filter(
    (o) =>
      o.filingDeadline &&
      Math.ceil(
        (new Date(o.filingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ) <= 30
  ).length;

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left transition-colors hover:bg-black/5"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1px solid #FCD34D',
            }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: '#B45309' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
              Candidate Recruitment Pipeline
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {opportunities.length} competitive districts without Democratic candidates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {urgentCount > 0 && (
            <span
              className="text-xs font-bold px-2 py-1 rounded-full animate-pulse"
              style={{ background: '#FEF2F2', color: '#DC2626' }}
            >
              {urgentCount} filing soon
            </span>
          )}
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Priority Districts */}
          <div className="grid gap-3">
            {opportunities.slice(0, 10).map((opp) => (
              <RecruitmentCard key={`${opp.chamber}-${opp.district}`} opportunity={opp} />
            ))}
          </div>

          {opportunities.length > 10 && (
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              +{opportunities.length - 10} more opportunities
            </p>
          )}

          {/* Export Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => exportRecruitmentData(opportunities)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
              style={{
                background: 'var(--class-purple-bg)',
                color: 'var(--class-purple)',
                border: '1px solid var(--class-purple-light)',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export Recruitment List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecruitmentCard({ opportunity }: { opportunity: RecruitmentOpportunity }) {
  const daysUntilDeadline = opportunity.filingDeadline
    ? Math.ceil(
        (new Date(opportunity.filingDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 30;
  const isPastDeadline = daysUntilDeadline !== null && daysUntilDeadline < 0;

  return (
    <div
      className={`rounded-lg p-4 ${isUrgent ? 'ring-2 ring-amber-400' : ''}`}
      style={{
        background: isUrgent
          ? 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%)'
          : 'var(--card-bg-elevated)',
        border: `1px solid ${isUrgent ? '#FCD34D' : 'var(--border-subtle)'}`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Side */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              {opportunity.chamber === 'house' ? 'House' : 'Senate'} {opportunity.district}
            </span>
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{
                background: getTierColor(opportunity.tier) + '20',
                color: getTierColor(opportunity.tier),
              }}
            >
              {opportunity.opportunityScore}
            </span>
          </div>

          {/* Filing Info */}
          {opportunity.filingDeadline && !isPastDeadline && (
            <div className="flex items-center gap-2 text-sm">
              <svg
                className="w-4 h-4"
                style={{ color: isUrgent ? '#B45309' : 'var(--text-muted)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span style={{ color: isUrgent ? '#B45309' : 'var(--text-muted)' }}>
                Filing deadline:{' '}
                {new Date(opportunity.filingDeadline).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                {daysUntilDeadline !== null && (
                  <span className="font-medium ml-1">
                    ({daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''})
                  </span>
                )}
              </span>
            </div>
          )}

          {/* Filing Requirements */}
          {opportunity.filingRequirements && (
            <div className="flex flex-wrap gap-2 mt-2">
              {opportunity.filingRequirements.fee && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--card-bg)', color: 'var(--text-muted)' }}
                >
                  ${opportunity.filingRequirements.fee} fee
                </span>
              )}
              {opportunity.filingRequirements.signatures && (
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ background: 'var(--card-bg)', color: 'var(--text-muted)' }}
                >
                  {opportunity.filingRequirements.signatures} signatures
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Action */}
        <Link
          href={`/?chamber=${opportunity.chamber}&district=${opportunity.district}`}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{
            background: 'var(--class-purple)',
            color: 'white',
          }}
        >
          View District
        </Link>
      </div>

      {/* Potential Recruits */}
      {opportunity.potentialRecruits && opportunity.potentialRecruits.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Potential Recruits (current Democratic officeholders):
          </p>
          <div className="flex flex-wrap gap-2">
            {opportunity.potentialRecruits.slice(0, 3).map((recruit, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-full"
                style={{ background: '#DBEAFE', color: '#1D4ED8' }}
              >
                {recruit.name} ({recruit.position.name})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return '#059669';
    case 'EMERGING':
      return '#0891B2';
    case 'BUILD':
      return '#D97706';
    case 'DEFENSIVE':
      return '#3676eb';
    default:
      return '#9CA3AF';
  }
}

function getLocalRecruitmentOpportunities(
  opportunityData: OpportunityData,
  chamber: 'house' | 'senate'
): RecruitmentOpportunity[] {
  const opportunities: RecruitmentOpportunity[] = [];

  for (const [districtNum, data] of Object.entries(opportunityData[chamber])) {
    if (data.flags.hasDemocrat) continue;
    if (data.opportunityScore < 30) continue;

    opportunities.push({
      positionId: `${chamber}-${districtNum}`,
      positionName: `SC ${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}`,
      level: 'state',
      district: parseInt(districtNum),
      chamber,
      hasDemocraticCandidate: false,
      hasRepublicanCandidate: true,
      incumbentParty: data.flags.defensive ? 'Democratic' : null,
      opportunityScore: data.opportunityScore,
      tier: data.tier,
    });
  }

  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function exportRecruitmentData(opportunities: RecruitmentOpportunity[]) {
  const csv = [
    ['Chamber', 'District', 'Score', 'Tier', 'Filing Deadline', 'Fee', 'Signatures'].join(','),
    ...opportunities.map((o) =>
      [
        o.chamber,
        o.district,
        o.opportunityScore,
        o.tier,
        o.filingDeadline || 'TBD',
        o.filingRequirements?.fee || '',
        o.filingRequirements?.signatures || '',
      ].join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `recruitment-pipeline-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
