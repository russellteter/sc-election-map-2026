'use client';

import type { Candidate } from '@/types/schema';

interface CandidateCardProps {
  candidate: Candidate;
  index?: number;
}

export default function CandidateCard({ candidate, index = 0 }: CandidateCardProps) {
  const badgeClass = getPartyBadgeClass(candidate.party);
  const partyLabel = candidate.party || 'Unknown';

  // Format date
  const formattedDate = candidate.filedDate
    ? new Date(candidate.filedDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div
      className="glass-surface rounded-lg p-4 interactive-lift animate-entrance"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'backwards',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className="font-semibold font-display text-base"
            style={{ color: 'var(--text-color)' }}
          >
            {candidate.name}
          </h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`badge ${badgeClass}`}>
              {partyLabel}
            </span>
            {candidate.isIncumbent && (
              <span
                className="badge inline-flex items-center gap-1"
                style={{
                  background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                  color: 'var(--class-purple)',
                  border: '1px solid rgba(71, 57, 231, 0.3)',
                }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                </svg>
                Incumbent
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm space-y-1.5" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--class-purple-light)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Filed: {formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            style={{ color: 'var(--class-purple-light)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Status: {candidate.status}</span>
        </div>
      </div>

      {candidate.ethicsUrl && (
        <a
          href={candidate.ethicsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--class-purple)' }}
        >
          View Ethics Filing
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
    </div>
  );
}

function getPartyBadgeClass(party: string | null): string {
  switch (party?.toLowerCase()) {
    case 'democratic':
      return 'badge-democrat';
    case 'republican':
      return 'badge-republican';
    default:
      return 'badge-unknown';
  }
}
