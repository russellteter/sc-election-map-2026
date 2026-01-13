'use client';

import CandidateCard from './CandidateCard';
import Sparkline from '@/components/Charts/Sparkline';
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
    <div className="h-full flex flex-col side-panel">
      {/* Header - Glassmorphic gradient */}
      <div
        className="border-b side-panel-header"
        style={{
          padding: 'var(--space-4)', /* Compact: 12px (was p-4 = 16px) */
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

      {/* Compact Election History Section */}
      {electionHistory && Object.keys(electionHistory.elections).length > 0 && (
        <div
          className="px-3 py-2 border-b flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(246,246,254,0.9) 100%)',
            borderColor: 'var(--class-purple-light)',
          }}
        >
          {/* Section Label */}
          <span
            className="text-[10px] font-semibold uppercase tracking-wide shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            History
          </span>

          {/* Election Pills Container */}
          <div className="flex items-center gap-1.5 flex-1">
            {['2024', '2022', '2020'].map((year) => {
              const election = electionHistory.elections[year];
              if (!election) return null;

              const winnerParty = election.winner.party.toLowerCase();
              const isDem = winnerParty.includes('democrat');
              const isRep = winnerParty.includes('republican');

              const partyLetter = isDem ? 'D' : isRep ? 'R' : '?';
              const pillBg = isDem
                ? 'rgba(71, 57, 231, 0.12)'
                : isRep
                ? 'rgba(220, 38, 38, 0.12)'
                : 'rgba(107, 114, 128, 0.12)';
              const pillBorder = isDem
                ? 'rgba(71, 57, 231, 0.3)'
                : isRep
                ? 'rgba(220, 38, 38, 0.3)'
                : 'rgba(107, 114, 128, 0.3)';
              const textColor = isDem
                ? 'var(--class-purple)'
                : isRep
                ? 'var(--color-at-risk)'
                : 'var(--text-muted)';

              return (
                <div
                  key={year}
                  className="flex flex-col items-center election-history-pill"
                  title={`${year}: ${election.winner.name} (${election.winner.party})${election.uncontested ? ' - Uncontested' : ` - ${election.margin.toFixed(1)}% margin`}`}
                >
                  {/* Election Pill */}
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none"
                    style={{
                      background: pillBg,
                      border: `1px solid ${pillBorder}`,
                      color: textColor,
                    }}
                  >
                    {partyLetter}
                    {election.uncontested ? (
                      <span className="ml-0.5 opacity-60">UC</span>
                    ) : (
                      <span className="ml-0.5">
                        {election.margin > 0 ? '+' : ''}{Math.round(election.margin)}
                      </span>
                    )}
                  </span>
                  {/* Year Label */}
                  <span
                    className="text-[9px] mt-0.5 leading-none"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    &apos;{year.slice(2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Competitiveness Badge */}
          {electionHistory.competitiveness && (() => {
            // Extract margin values for sparkline (2020, 2022, 2024)
            const years = ['2020', '2022', '2024'];
            const marginValues = years
              .map(year => electionHistory.elections[year]?.margin)
              .filter((m): m is number => m !== undefined);

            // Calculate trend percentage (first to last)
            const trendPercent = marginValues.length >= 2
              ? ((marginValues[marginValues.length - 1] - marginValues[0]) / Math.abs(marginValues[0] || 1)) * 100
              : 0;

            return (
              <div
                className="flex items-center gap-1.5 shrink-0"
                title={`Competitiveness: ${electionHistory.competitiveness.score}/100${electionHistory.competitiveness.hasSwung ? ' - Swing District' : ''}`}
              >
                {electionHistory.competitiveness.hasSwung && (
                  <span
                    className="text-[9px] font-medium px-1 py-0.5 rounded leading-none"
                    style={{
                      background: 'rgba(5, 150, 105, 0.12)',
                      color: 'var(--color-excellent)',
                      border: '1px solid rgba(5, 150, 105, 0.3)',
                    }}
                  >
                    SWING
                  </span>
                )}
                {marginValues.length >= 2 && (
                  <Sparkline
                    values={marginValues}
                    trendPercent={trendPercent}
                    width={36}
                    height={14}
                  />
                )}
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{
                    color: electionHistory.competitiveness.score >= 60
                      ? 'var(--color-excellent)'
                      : electionHistory.competitiveness.score >= 30
                      ? 'var(--color-attention)'
                      : 'var(--text-muted)',
                  }}
                >
                  {electionHistory.competitiveness.score}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Candidates list */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: 'var(--space-4)', /* Compact: 12px (was p-4 = 16px) */
          background: 'var(--glass-background)'
        }}
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
