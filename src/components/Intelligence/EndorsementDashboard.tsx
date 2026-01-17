'use client';

import { useState, useEffect } from 'react';
import { getCandidates, isConfigured, type BallotReadyCandidate } from '@/lib/ballotready';
import type { CandidatesData } from '@/types/schema';

interface EndorsementDashboardProps {
  candidatesData: CandidatesData;
  chamber: 'house' | 'senate';
}

interface EndorsementSummary {
  candidateName: string;
  party: string;
  district: number;
  endorsementCount: number;
  endorsers: string[];
  endorserTypes: string[];
}

export default function EndorsementDashboard({
  candidatesData,
  chamber,
}: EndorsementDashboardProps) {
  const [endorsements, setEndorsements] = useState<EndorsementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterParty, setFilterParty] = useState<'all' | 'democratic' | 'republican'>('all');

  useEffect(() => {
    async function fetchEndorsements() {
      if (!isConfigured()) {
        // Generate mock endorsement data from local candidates
        const mockEndorsements = generateMockEndorsements(candidatesData, chamber);
        setEndorsements(mockEndorsements);
        setIsLoading(false);
        return;
      }

      try {
        const apiCandidates = await getCandidates({ state: 'SC' });
        const summaries = processEndorsements(apiCandidates, candidatesData, chamber);
        setEndorsements(summaries);
      } catch (error) {
        console.error('Failed to fetch endorsements:', error);
        const mockEndorsements = generateMockEndorsements(candidatesData, chamber);
        setEndorsements(mockEndorsements);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEndorsements();
  }, [candidatesData, chamber]);

  const filteredEndorsements = endorsements.filter((e) => {
    if (filterParty === 'all') return true;
    return e.party.toLowerCase().includes(filterParty);
  });

  // Count stats
  const demWithEndorsements = endorsements.filter(
    (e) => e.party.toLowerCase().includes('democrat') && e.endorsementCount > 0
  ).length;
  const repWithEndorsements = endorsements.filter(
    (e) => e.party.toLowerCase().includes('republican') && e.endorsementCount > 0
  ).length;
  const totalEndorsements = endorsements.reduce((sum, e) => sum + e.endorsementCount, 0);

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
              background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
              border: '1px solid #6EE7B7',
            }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: '#059669' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
              Endorsement Intelligence
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {totalEndorsements} endorsements tracked across {endorsements.length} candidates
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}
            >
              D: {demWithEndorsements}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#FEF2F2', color: '#DC2626' }}
            >
              R: {repWithEndorsements}
            </span>
          </div>
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
          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Filter:
            </span>
            {(['all', 'democratic', 'republican'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterParty(filter)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  filterParty === filter ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background:
                    filterParty === filter
                      ? filter === 'democratic'
                        ? '#1D4ED8'
                        : filter === 'republican'
                          ? '#DC2626'
                          : 'var(--class-purple)'
                      : 'var(--card-bg-elevated)',
                  color: filterParty === filter ? 'white' : 'var(--text-muted)',
                }}
              >
                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Endorsement List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEndorsements
              .filter((e) => e.endorsementCount > 0)
              .sort((a, b) => b.endorsementCount - a.endorsementCount)
              .slice(0, 15)
              .map((endorsement, idx) => (
                <EndorsementRow key={idx} endorsement={endorsement} chamber={chamber} />
              ))}
          </div>

          {/* Candidates Without Endorsements */}
          <div
            className="rounded-lg p-3"
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D' }}
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color: '#B45309' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium" style={{ color: '#B45309' }}>
                  Endorsement Gaps
                </p>
                <p className="text-xs" style={{ color: '#92400E' }}>
                  {endorsements.filter(
                    (e) =>
                      e.party.toLowerCase().includes('democrat') && e.endorsementCount === 0
                  ).length}{' '}
                  Democratic candidates have no endorsements yet. Consider reaching out to key
                  endorsing organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EndorsementRow({
  endorsement,
  chamber,
}: {
  endorsement: EndorsementSummary;
  chamber: string;
}) {
  const isDem = endorsement.party.toLowerCase().includes('democrat');

  return (
    <div
      className="rounded-lg p-3 flex items-start justify-between gap-4"
      style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
            {endorsement.candidateName}
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: isDem ? '#DBEAFE' : '#FEF2F2',
              color: isDem ? '#1D4ED8' : '#DC2626',
            }}
          >
            {chamber === 'house' ? 'HD' : 'SD'}-{endorsement.district}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {endorsement.endorsers.slice(0, 3).map((endorser, idx) => (
            <span
              key={idx}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: '#ECFDF5', color: '#059669' }}
            >
              {endorser}
            </span>
          ))}
          {endorsement.endorsers.length > 3 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +{endorsement.endorsers.length - 3}
            </span>
          )}
        </div>
      </div>
      <span
        className="text-lg font-display font-bold flex-shrink-0"
        style={{ color: '#059669' }}
      >
        {endorsement.endorsementCount}
      </span>
    </div>
  );
}

function processEndorsements(
  apiCandidates: BallotReadyCandidate[],
  localCandidates: CandidatesData,
  chamber: 'house' | 'senate'
): EndorsementSummary[] {
  const summaries: EndorsementSummary[] = [];

  for (const [districtNum, district] of Object.entries(localCandidates[chamber])) {
    for (const candidate of district.candidates) {
      // Find matching API candidate
      const apiMatch = apiCandidates.find(
        (ac) => ac.name.toLowerCase().includes(candidate.name.toLowerCase().split(',')[0])
      );

      summaries.push({
        candidateName: formatName(candidate.name),
        party: candidate.party || 'Unknown',
        district: parseInt(districtNum),
        endorsementCount: apiMatch?.endorsements?.length || 0,
        endorsers: apiMatch?.endorsements?.map((e) => e.endorser_name) || [],
        endorserTypes: apiMatch?.endorsements?.map((e) => e.endorser_type || 'unknown') || [],
      });
    }
  }

  return summaries;
}

function generateMockEndorsements(
  candidatesData: CandidatesData,
  chamber: 'house' | 'senate'
): EndorsementSummary[] {
  const endorserPool = [
    'SC Democratic Party',
    'AFL-CIO',
    'Sierra Club',
    'Planned Parenthood Action',
    'Human Rights Campaign',
    'EMILY\'s List',
    'NEA',
    'SC Education Association',
    'IBEW Local 776',
    'SC AFL-CIO',
    'Everytown for Gun Safety',
    'League of Conservation Voters',
  ];

  const summaries: EndorsementSummary[] = [];

  for (const [districtNum, district] of Object.entries(candidatesData[chamber])) {
    for (const candidate of district.candidates) {
      const isDem = candidate.party?.toLowerCase() === 'democratic';
      // Generate mock endorsements (more for Democrats)
      const endorsementCount = isDem ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 2);
      const endorsers = endorserPool.slice(0, endorsementCount);

      summaries.push({
        candidateName: formatName(candidate.name),
        party: candidate.party || 'Unknown',
        district: parseInt(districtNum),
        endorsementCount,
        endorsers,
        endorserTypes: endorsers.map(() => 'organization'),
      });
    }
  }

  return summaries;
}

function formatName(name: string): string {
  if (name.includes(',')) {
    const [last, first] = name.split(',').map((s) => s.trim());
    return `${first} ${last}`;
  }
  return name;
}
