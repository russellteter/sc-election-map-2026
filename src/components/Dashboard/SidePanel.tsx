'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import CandidateCard from './CandidateCard';
import CollapsibleSection from './CollapsibleSection';
import SidePanelElectionHistory from './SidePanelElectionHistory';
import SidePanelStrategicInsights from './SidePanelStrategicInsights';
import type { District, DistrictElectionHistory } from '@/types/schema';
import type { FilterState } from '@/components/Search/FilterPanel';
import type { OpportunityData } from '@/lib/districtColors';
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
  opportunityData?: OpportunityData;
}

export default function SidePanel({
  chamber,
  district,
  electionHistory,
  onClose,
  showRepublicanData = false,
  republicanDataMode = 'none',
  filters,
  opportunityData,
}: SidePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ top: false, bottom: false });

  const filterOptions: FilterOptions = {
    showRepublicanData,
    republicanDataMode,
  };

  const raceProfileUrl = district && filters
    ? `/race/${chamber}/${district.districtNumber}?returnFilters=${encodeFilterState(filters)}`
    : district
    ? `/race/${chamber}/${district.districtNumber}`
    : '#';

  // Scroll indicator handler
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setScrollState({
      top: el.scrollTop > 8,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 8,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, district]);

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

  const filteredCandidates = getFilteredCandidates(district, filterOptions);
  const showHeadToHead = shouldShowHeadToHead(district, filterOptions);
  const candidateGroups = showHeadToHead ? groupCandidatesByParty(filteredCandidates) : null;

  const hasElectionHistory = electionHistory && Object.keys(electionHistory.elections).length > 0;

  // Determine incumbent info
  const incumbent = district.incumbent;
  const incumbentCandidate = district.candidates.find((c) => c.isIncumbent);

  return (
    <div className="h-full flex flex-col side-panel">
      {/* Header - Sticky */}
      <div
        className="border-b z-10 shrink-0 side-panel-header"
        style={{
          padding: '12px 16px',
          background: 'var(--glass-gradient)',
          borderColor: 'var(--class-purple-light)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold font-display" style={{ color: 'var(--text-color)' }}>
              {chamberLabel} District {district.districtNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all focus-ring"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--highlight-purple)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="badge badge-neutral">
            {chamberLabel}
          </span>
          {isContested && (
            <span className="badge badge-both">
              <span className="pulse-indicator" style={{ background: 'var(--color-excellent)', width: '6px', height: '6px' }} />
              Contested Race
            </span>
          )}
          {hasDem && !isContested && (
            <span className="badge badge-democrat">Democrat Running</span>
          )}
          {hasRep && !isContested && (
            <span className="badge badge-republican">Republican Running</span>
          )}
          {!hasDem && !hasRep && district.candidates.length > 0 && (
            <span className="badge badge-unknown">Party Unknown</span>
          )}
          {electionHistory?.competitiveness && electionHistory.competitiveness.score >= 60 && (
            <span className="badge badge-excellent">
              <span className="pulse-indicator" style={{ background: 'var(--color-excellent)', width: '6px', height: '6px' }} />
              Competitive
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Body */}
      <div
        className="side-panel-scroll-wrapper flex-1 min-h-0 overflow-hidden"
        data-scroll-top={scrollState.top}
        data-scroll-bottom={scrollState.bottom}
      >
        <div
          ref={scrollRef}
          className="side-panel-scroll side-panel-body h-full overflow-y-auto"
          style={{ background: 'var(--glass-background)' }}
        >
          <div
            key={`${chamber}-${district.districtNumber}`}
            className="panel-entrance"
          >
            {/* Incumbent Box */}
            {(incumbent || incumbentCandidate) && (
              <div
                className="border-b"
                style={{ borderColor: 'var(--class-purple-light)' }}
              >
                <div className="px-4 py-3">
                  <div
                    className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Current Incumbent
                  </div>
                  <div
                    className="rounded-lg p-3 flex items-center gap-3"
                    style={{
                      background: 'var(--surface-secondary)',
                      border: '1px solid var(--class-purple-light)',
                    }}
                  >
                    {/* Avatar circle */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold font-display"
                      style={{
                        background: (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'democratic'
                          ? 'var(--party-dem-bg)'
                          : (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'republican'
                          ? 'var(--party-rep-bg)'
                          : 'var(--class-purple-bg)',
                        color: (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'democratic'
                          ? 'var(--party-dem)'
                          : (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'republican'
                          ? 'var(--party-rep)'
                          : 'var(--text-muted)',
                        border: `2px solid ${
                          (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'democratic'
                            ? 'var(--party-dem-border)'
                            : (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'republican'
                            ? 'var(--party-rep-border)'
                            : 'var(--class-purple-light)'
                        }`,
                      }}
                    >
                      {(incumbent?.name || incumbentCandidate?.name || '?')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold font-display text-sm truncate" style={{ color: 'var(--text-color)' }}>
                        {incumbent?.name || incumbentCandidate?.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{
                            background: (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'democratic'
                              ? 'var(--party-dem-bg)'
                              : (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'republican'
                              ? 'var(--party-rep-bg)'
                              : 'var(--class-purple-bg)',
                            color: (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'democratic'
                              ? 'var(--party-dem)'
                              : (incumbent?.party || incumbentCandidate?.party)?.toLowerCase() === 'republican'
                              ? 'var(--party-rep)'
                              : 'var(--text-muted)',
                          }}
                        >
                          {incumbent?.party || incumbentCandidate?.party || 'Unknown'}
                        </span>
                        {incumbentCandidate && (
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: 'var(--color-excellent)' }}
                          >
                            Filed for re-election
                          </span>
                        )}
                        {incumbent && !incumbentCandidate && (
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: 'var(--color-attention)' }}
                          >
                            Not yet filed
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Incumbent shield icon */}
                    <div className="shrink-0" style={{ color: 'var(--text-dim)' }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Candidates Section */}
            <CollapsibleSection
              title="Candidates"
              defaultOpen
              badge={
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: 'var(--class-purple-bg)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {filteredCandidates.length}
                </span>
              }
            >
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
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
                  <p className="text-sm mt-1">Check back later for updates</p>
                </div>
              ) : showHeadToHead && candidateGroups ? (
                <div className="space-y-4">
                  {candidateGroups.democrats.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 mb-2 pb-2 border-b"
                        style={{ borderColor: 'var(--party-dem-border)' }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ background: 'var(--party-dem)' }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--party-dem)' }}>
                          Democrats ({candidateGroups.democrats.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {candidateGroups.democrats.map((candidate, index) => (
                          <CandidateCard key={candidate.reportId} candidate={candidate} index={index} />
                        ))}
                      </div>
                    </div>
                  )}
                  {candidateGroups.republicans.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 mb-2 pb-2 border-b"
                        style={{ borderColor: 'var(--party-rep-border)' }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ background: 'var(--party-rep)' }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--party-rep)' }}>
                          Republicans ({candidateGroups.republicans.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {candidateGroups.republicans.map((candidate, index) => (
                          <CandidateCard key={candidate.reportId} candidate={candidate} index={index} />
                        ))}
                      </div>
                    </div>
                  )}
                  {candidateGroups.others.length > 0 && (
                    <div>
                      <div
                        className="flex items-center gap-2 mb-2 pb-2 border-b"
                        style={{ borderColor: 'var(--border-subtle-solid)' }}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ background: 'var(--status-attention)' }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--status-attention)' }}>
                          Other ({candidateGroups.others.length})
                        </span>
                      </div>
                      <div className="space-y-3">
                        {candidateGroups.others.map((candidate, index) => (
                          <CandidateCard key={candidate.reportId} candidate={candidate} index={index} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCandidates.map((candidate, index) => (
                    <CandidateCard key={candidate.reportId} candidate={candidate} index={index} />
                  ))}
                </div>
              )}
            </CollapsibleSection>

            {/* Strategic Analysis Section */}
            {opportunityData && (
              <CollapsibleSection
                title="Strategic Analysis"
                defaultOpen
                badge={
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
                      color: 'var(--brand-primary)',
                    }}
                  >
                    {opportunityData.tier}
                  </span>
                }
              >
                <SidePanelStrategicInsights
                  opportunity={opportunityData}
                  history={electionHistory}
                />
              </CollapsibleSection>
            )}

            {/* Election History Section */}
            {hasElectionHistory && (
              <CollapsibleSection
                title="Election History"
                defaultOpen
                badge={
                  electionHistory?.competitiveness ? (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: electionHistory.competitiveness.score >= 60
                          ? 'rgba(5, 150, 105, 0.12)'
                          : 'rgba(107, 114, 128, 0.12)',
                        color: electionHistory.competitiveness.score >= 60
                          ? 'var(--color-excellent)'
                          : 'var(--text-muted)',
                      }}
                    >
                      {electionHistory.competitiveness.score >= 60 ? 'Competitive' : 'Safe'}
                    </span>
                  ) : undefined
                }
              >
                <SidePanelElectionHistory history={electionHistory!} />
              </CollapsibleSection>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Ghost link */}
      <div
        className="shrink-0 z-10"
        style={{
          borderTop: '1px solid var(--class-purple-light)',
          background: 'var(--glass-gradient)',
        }}
      >
        <Link href={raceProfileUrl} className="side-panel-footer-link">
          View Full Race Profile
          <span className="arrow">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
