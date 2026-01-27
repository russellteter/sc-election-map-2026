'use client';

import type { Candidate, Incumbent, DistrictOpportunity } from '@/types/schema';
import { Badge } from '@/components/ui';

interface RaceHeroProps {
  chamber: 'house' | 'senate';
  districtNumber: number;
  incumbent: Incumbent | null | undefined;
  candidates: Candidate[];
  opportunity: DistrictOpportunity | undefined;
}

// Tier badge variants - must match all possible tier values from opportunity.json
const TIER_BADGE_VARIANTS: Record<string, 'excellent' | 'info' | 'attention' | 'neutral'> = {
  // New tier naming from opportunity.json
  HOT: 'excellent',
  WARM: 'info',
  POSSIBLE: 'attention',
  LONG_SHOT: 'neutral',
  DEFENSIVE: 'info',
  // Legacy tier naming (for backwards compatibility)
  HIGH_OPPORTUNITY: 'excellent',
  EMERGING: 'info',
  BUILD: 'attention',
  NON_COMPETITIVE: 'neutral',
};

/**
 * RaceHero - Head-to-head display of incumbent vs challenger
 * Visual VS layout with key race metrics
 */
export default function RaceHero({
  chamber,
  districtNumber,
  incumbent,
  candidates,
  opportunity,
}: RaceHeroProps) {
  // Find Democratic and Republican candidates
  const democraticCandidates = candidates.filter(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const republicanCandidates = candidates.filter(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  // Determine incumbent card and challenger card
  const incumbentCandidate = candidates.find((c) => c.isIncumbent) || null;
  const incumbentParty = incumbent?.party || incumbentCandidate?.party || null;

  // Find primary challenger (opposite party)
  let challenger: Candidate | null = null;
  if (incumbentParty?.toLowerCase() === 'republican') {
    challenger = democraticCandidates[0] || null;
  } else if (incumbentParty?.toLowerCase() === 'democratic') {
    challenger = republicanCandidates[0] || null;
  }

  // Open seat handling
  const isOpenSeat = opportunity?.flags.openSeat || !incumbent;

  return (
    <div className="space-y-6">
      {/* District header */}
      <div className="text-center">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1"
          style={{ color: 'var(--class-purple)' }}
        >
          {chamber === 'house' ? 'SC House' : 'SC Senate'}
        </p>
        <h1
          className="text-3xl font-bold font-display"
          style={{ color: 'var(--text-color)' }}
        >
          District {districtNumber}
        </h1>
        {isOpenSeat && (
          <Badge variant="excellent" size="md" className="mt-2">
            Open Seat
          </Badge>
        )}
      </div>

      {/* VS Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
        {/* Incumbent / Republican Side */}
        <CandidateHeroCard
          label={incumbent ? 'Incumbent' : 'Republican'}
          candidate={
            incumbent
              ? {
                  name: incumbent.name,
                  party: incumbent.party,
                  isIncumbent: true,
                  filedDate: incumbentCandidate?.filedDate || null,
                  status: incumbentCandidate?.status || 'incumbent',
                }
              : republicanCandidates[0] || null
          }
          side="left"
          isEmpty={!incumbent && republicanCandidates.length === 0}
        />

        {/* VS Divider */}
        <div className="hidden md:flex items-center justify-center">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full font-bold text-xl"
            style={{
              background: 'var(--gradient-primary)',
              color: 'white',
              boxShadow: 'var(--glow-purple)',
            }}
          >
            VS
          </div>
        </div>

        {/* Mobile VS */}
        <div className="flex md:hidden items-center justify-center py-2">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm"
            style={{
              background: 'var(--gradient-primary)',
              color: 'white',
            }}
          >
            VS
          </div>
        </div>

        {/* Challenger / Democratic Side */}
        <CandidateHeroCard
          label={incumbentParty?.toLowerCase() === 'democratic' ? 'Republican' : 'Democrat'}
          candidate={
            incumbentParty?.toLowerCase() === 'democratic'
              ? republicanCandidates[0] || null
              : democraticCandidates[0] || null
          }
          side="right"
          isEmpty={
            incumbentParty?.toLowerCase() === 'democratic'
              ? republicanCandidates.length === 0
              : democraticCandidates.length === 0
          }
          needsCandidate={
            opportunity?.flags.needsCandidate &&
            incumbentParty?.toLowerCase() !== 'democratic'
          }
        />
      </div>

      {/* Key metrics row */}
      {opportunity && (
        <div
          className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          {/* Opportunity Score */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: 'var(--class-purple-bg)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Opportunity
            </span>
            <span
              className="text-lg font-bold font-display"
              style={{ color: 'var(--class-purple)' }}
            >
              {opportunity.opportunityScore}
            </span>
          </div>

          {/* Tier */}
          <Badge
            variant={TIER_BADGE_VARIANTS[opportunity.tier] ?? 'neutral'}
            size="lg"
          >
            {opportunity.tierLabel}
          </Badge>

          {/* Avg Margin */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{ background: 'var(--class-purple-bg)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Avg Margin
            </span>
            <span
              className="text-lg font-bold font-display"
              style={{
                color: (opportunity.metrics?.avgMargin ?? 100) < 10
                  ? 'var(--accent-emerald)'
                  : (opportunity.metrics?.avgMargin ?? 100) < 25
                  ? 'var(--accent-amber)'
                  : 'var(--status-at-risk)',
              }}
            >
              {(opportunity.metrics?.avgMargin ?? 100) < 100
                ? `${(opportunity.metrics?.avgMargin ?? 0).toFixed(1)}%`
                : 'Uncontested'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface CandidateHeroCardProps {
  label: string;
  candidate: {
    name: string;
    party: string | null;
    isIncumbent?: boolean;
    filedDate?: string | null;
    status?: string;
  } | null;
  side: 'left' | 'right';
  isEmpty?: boolean;
  needsCandidate?: boolean;
}

function CandidateHeroCard({
  label,
  candidate,
  side,
  isEmpty,
  needsCandidate,
}: CandidateHeroCardProps) {
  const isDemocrat = candidate?.party?.toLowerCase() === 'democratic';
  const isRepublican = candidate?.party?.toLowerCase() === 'republican';

  const borderColor = isDemocrat
    ? 'var(--class-purple)'
    : isRepublican
    ? 'var(--status-at-risk)'
    : 'var(--class-purple-light)';

  const accentColor = isDemocrat
    ? 'var(--class-purple)'
    : isRepublican
    ? 'var(--status-at-risk)'
    : 'var(--text-muted)';

  return (
    <div
      className="glass-surface rounded-xl p-5 relative overflow-hidden animate-entrance"
      style={{
        borderTop: `4px solid ${borderColor}`,
        animationDelay: side === 'left' ? '0ms' : '150ms',
      }}
    >
      {/* Label */}
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-3"
        style={{ color: accentColor }}
      >
        {label}
      </p>

      {isEmpty || !candidate ? (
        <div className="py-6 text-center">
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{ background: 'var(--class-purple-bg)' }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-muted)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            No candidate filed
          </p>
          {needsCandidate && (
            <Badge variant="attention" size="sm" className="mt-2">
              Needs Candidate
            </Badge>
          )}
        </div>
      ) : (
        <div>
          {/* Candidate name */}
          <h2
            className="text-xl font-bold font-display mb-1"
            style={{ color: 'var(--text-color)' }}
          >
            {formatName(candidate.name)}
          </h2>

          {/* Party badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`badge ${
                isDemocrat
                  ? 'badge-democrat'
                  : isRepublican
                  ? 'badge-republican'
                  : 'badge-unknown'
              }`}
            >
              {candidate.party || 'Unknown'}
            </span>

            {candidate.isIncumbent && (
              <Badge variant="healthy" size="sm">
                Incumbent
              </Badge>
            )}
          </div>

          {/* Filing info */}
          {candidate.filedDate && (
            <p
              className="text-xs mt-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Filed:{' '}
              {new Date(candidate.filedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Format name from "Last, First" to "First Last"
 */
function formatName(name: string): string {
  if (name.includes(',')) {
    return name.split(',').reverse().join(' ').trim();
  }
  return name;
}
