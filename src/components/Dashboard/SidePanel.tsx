'use client';

import CandidateCard from './CandidateCard';
import type { District, DistrictElectionHistory } from '@/types/schema';

interface SidePanelProps {
  chamber: 'house' | 'senate';
  district: District | null;
  electionHistory?: DistrictElectionHistory | null;
  onClose: () => void;
}

export default function SidePanel({ chamber, district, electionHistory, onClose }: SidePanelProps) {
  if (!district) {
    return (
      <div
        className="h-full flex items-center justify-center p-6"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="text-center animate-entrance">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--class-purple-bg)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--class-purple-light)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold font-display" style={{ color: 'var(--text-color)' }}>
            Select a District
          </p>
          <p className="text-sm mt-1">
            Click on a district to see candidates
          </p>
        </div>
      </div>
    );
  }

  const chamberLabel = chamber === 'house' ? 'House' : 'Senate';
  const hasDem = district.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
  const hasRep = district.candidates.some((c) => c.party?.toLowerCase() === 'republican');
  const isContested = hasDem && hasRep;

  return (
    <div className="h-full flex flex-col">
      {/* Header - Glassmorphic gradient */}
      <div
        className="p-4 border-b"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, var(--class-purple-bg) 100%)',
          borderColor: 'var(--class-purple-light)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-display" style={{ color: 'var(--text-color)' }}>
              {chamberLabel} District {district.districtNumber}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {district.candidates.length} candidate
              {district.candidates.length !== 1 ? 's' : ''} filed
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all focus-ring"
            style={{
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--highlight-purple)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {isContested && (
            <span className="badge badge-both">
              <span className="pulse-indicator" style={{ background: 'var(--color-excellent)', width: '6px', height: '6px' }} />
              Contested Race
            </span>
          )}
          {hasDem && !isContested && (
            <span className="badge badge-democrat">
              Democrat Running
            </span>
          )}
          {hasRep && !isContested && (
            <span className="badge badge-republican">
              Republican Running
            </span>
          )}
          {!hasDem && !hasRep && district.candidates.length > 0 && (
            <span className="badge badge-unknown">
              Party Unknown
            </span>
          )}
          {electionHistory?.competitiveness && electionHistory.competitiveness.score >= 60 && (
            <span className="badge badge-excellent">
              <span className="pulse-indicator" style={{ background: 'var(--color-excellent)', width: '6px', height: '6px' }} />
              Competitive
            </span>
          )}
        </div>
      </div>

      {/* Election History Section */}
      {electionHistory && Object.keys(electionHistory.elections).length > 0 && (
        <div
          className="px-4 py-3 border-b"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(246,246,254,0.9) 100%)',
            borderColor: 'var(--class-purple-light)',
          }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--class-purple)' }}>
            Election History
          </h3>

          {/* Recent elections */}
          <div className="space-y-2">
            {['2024', '2022', '2020'].map((year) => {
              const election = electionHistory.elections[year];
              if (!election) return null;

              const winnerParty = election.winner.party.toLowerCase();
              const partyColor = winnerParty.includes('democrat')
                ? 'var(--class-purple)'
                : winnerParty.includes('republican')
                ? 'var(--color-at-risk)'
                : 'var(--text-muted)';

              return (
                <div
                  key={year}
                  className="flex items-center justify-between text-sm rounded-md px-2 py-1.5"
                  style={{ background: 'rgba(71, 57, 231, 0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--text-color)' }}>{year}</span>
                    <span style={{ color: partyColor }}>
                      {election.winner.party.slice(0, 1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {election.uncontested ? (
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--class-purple-bg)', color: 'var(--text-muted)' }}>
                        Uncontested
                      </span>
                    ) : (
                      <span
                        className="text-xs font-medium"
                        style={{
                          color: election.margin <= 10
                            ? 'var(--color-excellent)'
                            : election.margin <= 20
                            ? 'var(--color-attention)'
                            : 'var(--text-muted)'
                        }}
                      >
                        {election.margin > 0 ? '+' : ''}{election.margin.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Competitiveness score */}
          {electionHistory.competitiveness && (
            <div className="mt-3 pt-2 border-t" style={{ borderColor: 'rgba(71, 57, 231, 0.1)' }}>
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>Competitiveness Score</span>
                <span
                  className="font-semibold"
                  style={{
                    color: electionHistory.competitiveness.score >= 60
                      ? 'var(--color-excellent)'
                      : electionHistory.competitiveness.score >= 30
                      ? 'var(--color-attention)'
                      : 'var(--text-muted)'
                  }}
                >
                  {electionHistory.competitiveness.score}/100
                </span>
              </div>
              <div className="mt-1.5 w-full rounded-full h-1.5" style={{ background: 'var(--class-purple-light)' }}>
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${electionHistory.competitiveness.score}%`,
                    background: electionHistory.competitiveness.score >= 60
                      ? 'var(--color-excellent)'
                      : electionHistory.competitiveness.score >= 30
                      ? 'var(--color-attention)'
                      : 'var(--text-muted)'
                  }}
                />
              </div>
              {electionHistory.competitiveness.hasSwung && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-excellent)' }}>
                  Has changed party control recently
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Candidates list */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ background: 'var(--glass-background)' }}
      >
        {district.candidates.length === 0 ? (
          <div className="text-center py-8 animate-entrance" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: 'var(--class-purple-light)' }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: 'var(--class-purple)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: 'var(--text-color)' }}>
              No candidates have filed yet
            </p>
            <p className="text-sm mt-1">
              Check back later for updates
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {district.candidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.reportId}
                candidate={candidate}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
