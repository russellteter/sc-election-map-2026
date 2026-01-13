'use client';

import { useState } from 'react';
import type { SchoolBoardData, SchoolDistrict, SchoolBoardSeat, SchoolBoardCandidate } from '@/types/schema';

interface SchoolBoardRacesProps {
  data: SchoolBoardData;
  countyName: string | null;
}

export default function SchoolBoardRaces({ data, countyName }: SchoolBoardRacesProps) {
  // Filter districts to only show those in the user's county
  const relevantDistricts = countyName
    ? data.districts.filter(d => d.county === countyName)
    : [];

  // Track which districts are expanded
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(
    new Set(relevantDistricts.slice(0, 1).map(d => d.name))
  );

  const toggleDistrict = (districtName: string) => {
    setExpandedDistricts(prev => {
      const next = new Set(prev);
      if (next.has(districtName)) {
        next.delete(districtName);
      } else {
        next.add(districtName);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in animate-in-delay-3">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
            border: '1px solid #C4B5FD',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
            School Board Races
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {countyName
              ? `Local school board elections in ${countyName} County`
              : 'School district board elections'
            }
          </p>
        </div>
      </div>

      {/* Districts */}
      {relevantDistricts.length > 0 ? (
        <div className="space-y-4">
          {relevantDistricts.map((district) => (
            <SchoolDistrictCard
              key={district.name}
              district={district}
              isExpanded={expandedDistricts.has(district.name)}
              onToggle={() => toggleDistrict(district.name)}
            />
          ))}
        </div>
      ) : (
        <div className="glass-surface rounded-lg p-6 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
              border: '1px solid #C4B5FD',
            }}
          >
            <svg className="w-6 h-6" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-display font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
            {countyName ? 'No school board races found' : 'Enter your address to see school board races'}
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {countyName
              ? `We don't have school board race data for ${countyName} County yet. Check with your local school district for information.`
              : 'Enter your address above to see school board races in your area.'
            }
          </p>
          <a
            href="https://ed.sc.gov/districts-schools/school-directory/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
              color: '#7C3AED',
              border: '1px solid #C4B5FD',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            SC School District Directory
          </a>
        </div>
      )}
    </div>
  );
}

interface SchoolDistrictCardProps {
  district: SchoolDistrict;
  isExpanded: boolean;
  onToggle: () => void;
}

function SchoolDistrictCard({ district, isExpanded, onToggle }: SchoolDistrictCardProps) {
  const { name, county, seats } = district;
  const totalCandidates = seats.reduce((sum, seat) => sum + seat.candidates.length, 0);

  return (
    <div className="voter-card overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
        style={{ background: 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
              border: '1px solid #C4B5FD',
            }}
          >
            <svg className="w-5 h-5" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-left">
            <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              {name}
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {seats.length} seats up for election
              {totalCandidates > 0 && ` - ${totalCandidates} candidate${totalCandidates !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="badge text-xs"
            style={{
              background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
              color: '#7C3AED',
              border: '1px solid #C4B5FD',
            }}
          >
            NONPARTISAN
          </span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            style={{ color: 'var(--text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="pt-4 space-y-3">
            {seats.map((seat) => (
              <SchoolBoardSeatCard key={seat.seat} seat={seat} />
            ))}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>4-year terms, nonpartisan elections</span>
            <a
              href={`https://ballotpedia.org/${name.replace(/ /g, '_')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              Learn more
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

interface SchoolBoardSeatCardProps {
  seat: SchoolBoardSeat;
}

function SchoolBoardSeatCard({ seat }: SchoolBoardSeatCardProps) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Seat Header */}
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
          {seat.seat}
        </h5>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {seat.candidates.length} candidate{seat.candidates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Candidates */}
      {seat.candidates.length > 0 ? (
        <div className="space-y-2">
          {seat.candidates.map((candidate, idx) => (
            <SchoolBoardCandidateCard key={candidate.name} candidate={candidate} index={idx} />
          ))}
        </div>
      ) : (
        <div
          className="text-center py-3 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
            border: '1px dashed #C4B5FD',
          }}
        >
          <p className="text-xs font-medium" style={{ color: '#7C3AED' }}>
            No candidates filed yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Filing: March 16-30, 2026
          </p>
        </div>
      )}
    </div>
  );
}

interface SchoolBoardCandidateCardProps {
  candidate: SchoolBoardCandidate;
  index: number;
}

function SchoolBoardCandidateCard({ candidate }: SchoolBoardCandidateCardProps) {
  return (
    <div
      className="flex items-center justify-between p-2 rounded-lg"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
            color: '#7C3AED',
            border: '1px solid #C4B5FD',
          }}
        >
          {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        <div>
          <p className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
            {candidate.name}
          </p>
          {candidate.incumbent && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Incumbent
            </span>
          )}
        </div>
      </div>
      {candidate.party !== 'N' && (
        <span
          className="badge text-xs"
          style={{
            background: candidate.party === 'D' ? 'var(--party-dem-bg)' : 'var(--party-rep-bg)',
            color: candidate.party === 'D' ? 'var(--party-dem)' : 'var(--party-rep)',
          }}
        >
          {candidate.party}
        </span>
      )}
    </div>
  );
}
