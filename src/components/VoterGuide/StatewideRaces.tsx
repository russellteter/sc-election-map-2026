'use client';

import type { StatewideRacesData, StatewideRace, Candidate } from '@/types/schema';
import CandidateCard from '@/components/Dashboard/CandidateCard';

interface StatewideRacesProps {
  data: StatewideRacesData;
}

export default function StatewideRaces({ data }: StatewideRacesProps) {
  // Filter to only show races (all are relevant for 2026)
  const races = data.races;

  if (races.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in animate-in-delay-1">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            border: '1px solid #FCD34D',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#B45309' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
            Statewide Offices
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            All SC voters vote for these offices
          </p>
        </div>
      </div>

      {/* Races Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {races.map((race) => (
          <StatewideRaceCard key={race.office} race={race} />
        ))}
      </div>
    </div>
  );
}

interface StatewideRaceCardProps {
  race: StatewideRace;
}

function StatewideRaceCard({ race }: StatewideRaceCardProps) {
  const { office, description, incumbent, candidates, termYears } = race;

  // Check if this is an open seat
  const isOpenSeat = incumbent && incumbent.canRunAgain === false;

  return (
    <div className="voter-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
            {office}
          </h4>
          {description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
              {description}
            </p>
          )}
        </div>
        {isOpenSeat && (
          <span
            className="badge text-xs flex-shrink-0 ml-2"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              color: '#B45309',
              border: '1px solid #FCD34D',
            }}
          >
            OPEN SEAT
          </span>
        )}
      </div>

      {/* Incumbent */}
      {incumbent && (
        <div
          className="rounded-lg p-2 mb-3"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
                Incumbent
              </span>
              <span
                className={incumbent.party === 'Democratic' ? 'party-badge-dem' : 'party-badge-rep'}
              >
                {incumbent.party === 'Democratic' ? 'D' : 'R'}
              </span>
            </div>
            {incumbent.canRunAgain === false && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Term-limited
              </span>
            )}
          </div>
          <p className="font-medium text-sm mt-1" style={{ color: 'var(--text-color)' }}>
            {incumbent.name}
          </p>
        </div>
      )}

      {/* Candidates */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Candidates ({candidates.length})
        </p>

        {candidates.length > 0 ? (
          <div className="space-y-2">
            {candidates.map((candidate, idx) => (
              <CandidateCard key={candidate.reportId || candidate.name} candidate={candidate} index={idx} />
            ))}
          </div>
        ) : (
          <div
            className="text-center py-4 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1px dashed #FCD34D',
            }}
          >
            <p className="text-xs font-medium" style={{ color: '#B45309' }}>
              No candidates filed yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Filing: March 16-30, 2026
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>{termYears}-year term</span>
        <a
          href={`https://ballotpedia.org/South_Carolina_${office.replace(/ /g, '_')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: 'var(--class-purple)' }}
        >
          Learn more
        </a>
      </div>
    </div>
  );
}
