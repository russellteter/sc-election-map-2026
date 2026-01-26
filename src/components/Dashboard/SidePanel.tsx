'use client';

import Link from 'next/link';
import CandidateCard from './CandidateCard';
import Sparkline from '@/components/Charts/Sparkline';
import type { District, DistrictElectionHistory } from '@/types/schema';
import type { FilterState } from '@/components/Search/FilterPanel';
import { encodeFilterState } from '@/lib/navigationContext';
import {
  getFilteredCandidates,
  groupCandidatesByParty,
  shouldShowHeadToHead,
  type FilterOptions,
} from '@/lib/dataFilter';

interface SidePanelProps {
  chamber: 'house' | 'senate';
  district: District | null;
  electionHistory?: DistrictElectionHistory | null;
  onClose: () => void;
  showRepublicanData?: boolean;
  republicanDataMode?: 'none' | 'incumbents' | 'challengers' | 'all';
  filters?: FilterState;
}

export default function SidePanel({
  chamber,
  district,
  electionHistory,
  onClose,
  showRepublicanData = false,
  republicanDataMode = 'none',
  filters,
}: SidePanelProps) {
  // Filter options for candidate display
  const filterOptions: FilterOptions = {
    showRepublicanData,
    republicanDataMode,
  };

  // Build race profile URL with return context for "Back to Map" navigation
  const raceProfileUrl = district && filters
    ? `/race/${chamber}/${district.districtNumber}?returnFilters=${encodeFilterState(filters)}`
    : district
    ? `/race/${chamber}/${district.districtNumber}`
    : '#';

  if (!district) {
    return (
      <div
        className="h-full flex items-center justify-center p-6"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="text-center animate-entrance">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--background-alt)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--brand-primary-light)' }}
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

  // Get filtered candidates based on Republican toggle
  const filteredCandidates = getFilteredCandidates(district, filterOptions);
  const showHeadToHead = shouldShowHeadToHead(district, filterOptions);
  const candidateGroups = showHeadToHead ? groupCandidatesByParty(filteredCandidates) : null;

  return (
    <div className="h-full flex flex-col side-panel">
      {/* Header - Glassmorphic gradient */}
      <div
        className="border-b side-panel-header"
        style={{
          padding: 'var(--space-4)', /* Compact: 12px (was p-4 = 16px) */
          background: 'var(--glass-gradient)',
          borderColor: 'var(--border-subtle-solid)',
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

        {/* View Full Race Profile Button */}
        <Link
          href={raceProfileUrl}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all hover:opacity-90 focus-ring"
          style={{
            background: 'var(--brand-primary)',
            color: 'white',
            textDecoration: 'none',
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          View Full Race Profile
        </Link>
      </div>

      {/* Compact Election History Section */}
      {electionHistory && Object.keys(electionHistory.elections).length > 0 && (
        <div
          className="px-3 py-2 border-b flex items-center gap-3"
          style={{
            background: 'var(--glass-gradient)',
            borderColor: 'var(--border-subtle-solid)',
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
                ? 'var(--party-dem-bg)'
                : isRep
                ? 'var(--party-rep-bg)'
                : 'rgba(107, 114, 128, 0.12)';
              const pillBorder = isDem
                ? 'var(--party-dem-border)'
                : isRep
                ? 'var(--party-rep-border)'
                : 'rgba(107, 114, 128, 0.3)';
              const textColor = isDem
                ? 'var(--party-dem)'
                : isRep
                ? 'var(--party-rep)'
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
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-8 animate-entrance" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ background: 'var(--brand-primary-light)' }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: 'var(--brand-primary)' }}
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
        ) : showHeadToHead && candidateGroups ? (
          /* Head-to-head view when both parties visible */
          <div className="space-y-4">
            {/* Democrats section */}
            {candidateGroups.democrats.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2 pb-2 border-b"
                  style={{ borderColor: 'var(--party-dem-border)' }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: 'var(--party-dem)' }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--party-dem)' }}
                  >
                    Democrats ({candidateGroups.democrats.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {candidateGroups.democrats.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.reportId}
                      candidate={candidate}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Republicans section */}
            {candidateGroups.republicans.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2 pb-2 border-b"
                  style={{ borderColor: 'var(--party-rep-border)' }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: 'var(--party-rep)' }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--party-rep)' }}
                  >
                    Republicans ({candidateGroups.republicans.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {candidateGroups.republicans.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.reportId}
                      candidate={candidate}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Others section */}
            {candidateGroups.others.length > 0 && (
              <div>
                <div
                  className="flex items-center gap-2 mb-2 pb-2 border-b"
                  style={{ borderColor: 'var(--border-subtle-solid)' }}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: 'var(--status-attention)' }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--status-attention)' }}
                  >
                    Other ({candidateGroups.others.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {candidateGroups.others.map((candidate, index) => (
                    <CandidateCard
                      key={candidate.reportId}
                      candidate={candidate}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Standard list view */
          <div className="space-y-3">
            {filteredCandidates.map((candidate, index) => (
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
