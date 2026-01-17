'use client';

import type { CongressionalData, CongressionalDistrict, USSenateRace, Candidate } from '@/types/schema';
import CandidateCard from '@/components/Dashboard/CandidateCard';
import { CD_INFO } from '@/lib/congressionalLookup';
import { DemoBadge } from '@/components/ui';

interface CongressionalRacesProps {
  data: CongressionalData;
  congressionalDistrict: number | null;
  countyName: string | null;
}

export default function CongressionalRaces({ data, congressionalDistrict, countyName }: CongressionalRacesProps) {
  // Get the user's congressional district data
  const houseDistrict = congressionalDistrict
    ? data.house[String(congressionalDistrict)]
    : null;

  // Get senate races that are up for election
  const senateRaceUp = data.senate.class3.upForElection ? data.senate.class3 : null;
  const senateRaceNotUp = data.senate.class2;

  return (
    <div className="space-y-6 animate-in animate-in-delay-2">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            border: '1px solid #93C5FD',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#1D4ED8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
              U.S. Congress
            </h3>
            <DemoBadge />
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Federal representatives for your area
          </p>
        </div>
      </div>

      {/* Races Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* US House District */}
        {houseDistrict && (
          <USHouseCard
            district={houseDistrict}
            countyName={countyName}
          />
        )}

        {/* US Senate (if up for election) */}
        {senateRaceUp && (
          <USSenateCard race={senateRaceUp} isUpForElection={true} />
        )}
      </div>

      {/* Senate seat not up this cycle */}
      {senateRaceNotUp && !senateRaceNotUp.upForElection && (
        <div
          className="rounded-lg p-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                U.S. Senate (Class II Seat)
              </p>
              <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                {senateRaceNotUp.incumbent?.name}
                <span
                  className="badge text-xs ml-2"
                  style={{
                    background: senateRaceNotUp.incumbent?.party === 'Democratic' ? 'var(--party-dem-bg)' : 'var(--party-rep-bg)',
                    color: senateRaceNotUp.incumbent?.party === 'Democratic' ? 'var(--party-dem)' : 'var(--party-rep)',
                  }}
                >
                  {senateRaceNotUp.incumbent?.party === 'Democratic' ? 'D' : 'R'}
                </span>
              </p>
            </div>
            <span
              className="badge text-xs"
              style={{
                background: 'var(--card-bg)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              Not up until {senateRaceNotUp.incumbent?.termEnds}
            </span>
          </div>
        </div>
      )}

      {/* No congressional district found */}
      {!congressionalDistrict && (
        <div className="glass-surface rounded-lg p-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Unable to determine your congressional district.
            <br />
            <a
              href="https://www.house.gov/representatives/find-your-representative"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              Find your representative on house.gov
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

interface USHouseCardProps {
  district: CongressionalDistrict;
  countyName: string | null;
}

function USHouseCard({ district, countyName }: USHouseCardProps) {
  const { districtNumber, incumbent, candidates } = district;
  const cdInfo = CD_INFO[districtNumber];

  return (
    <div className="voter-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-bold font-display text-lg"
            style={{
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              color: '#1D4ED8',
              border: '1px solid #93C5FD',
            }}
          >
            {districtNumber}
          </div>
          <div>
            <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              U.S. House District {districtNumber}
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {cdInfo?.description || `Congressional District ${districtNumber}`}
            </p>
          </div>
        </div>
        <span
          className="badge text-xs"
          style={{
            background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            color: '#1D4ED8',
            border: '1px solid #93C5FD',
          }}
        >
          FEDERAL
        </span>
      </div>

      {/* County context */}
      {countyName && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Based on your location in {countyName} County
        </p>
      )}

      {/* Incumbent */}
      {incumbent && (
        <div
          className="rounded-lg p-3 mb-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            Current Representative
          </p>
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--text-color)' }}>
              {incumbent.name}
            </span>
            <span className={incumbent.party === 'Democratic' ? 'party-badge-dem' : 'party-badge-rep'}>
              {incumbent.party === 'Democratic' ? 'D' : 'R'}
            </span>
          </div>
          {incumbent.since && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              In office since {incumbent.since}
            </p>
          )}
        </div>
      )}

      {/* Candidates */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Filed Candidates ({candidates.length})
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
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              border: '1px dashed #93C5FD',
            }}
          >
            <p className="text-xs font-medium" style={{ color: '#1D4ED8' }}>
              No candidates filed yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Filing: March 16-30, 2026
            </p>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <a
          href={`https://ballotpedia.org/South_Carolina%27s_${districtNumber}${getOrdinalSuffix(districtNumber)}_Congressional_District`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: 'var(--class-purple)' }}
        >
          Learn more about this district
        </a>
      </div>
    </div>
  );
}

interface USSenateCardProps {
  race: USSenateRace;
  isUpForElection: boolean;
}

function USSenateCard({ race, isUpForElection }: USSenateCardProps) {
  const { incumbent, candidates, seatClass } = race;

  return (
    <div className="voter-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              border: '1px solid #93C5FD',
            }}
          >
            <svg className="w-6 h-6" style={{ color: '#1D4ED8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div>
            <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              U.S. Senate
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Class {seatClass === 2 ? 'II' : 'III'} Seat • Statewide
            </p>
          </div>
        </div>
        {isUpForElection ? (
          <span
            className="badge text-xs"
            style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              color: '#B45309',
              border: '1px solid #FCD34D',
            }}
          >
            ON BALLOT 2026
          </span>
        ) : (
          <span
            className="badge text-xs"
            style={{
              background: 'var(--card-bg)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            NOT UP 2026
          </span>
        )}
      </div>

      {/* Incumbent */}
      {incumbent && (
        <div
          className="rounded-lg p-3 mb-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            Current Senator
          </p>
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--text-color)' }}>
              {incumbent.name}
            </span>
            <span className={incumbent.party === 'Democratic' ? 'party-badge-dem' : 'party-badge-rep'}>
              {incumbent.party === 'Democratic' ? 'D' : 'R'}
            </span>
          </div>
          {incumbent.since && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              In office since {incumbent.since} - Term ends {incumbent.termEnds}
            </p>
          )}
        </div>
      )}

      {/* Candidates (only if up for election) */}
      {isUpForElection && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
            Filed Candidates ({candidates.length})
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
                background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
                border: '1px dashed #93C5FD',
              }}
            >
              <p className="text-xs font-medium" style={{ color: '#1D4ED8' }}>
                No candidates filed yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Filing: March 16-30, 2026
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer link */}
      <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <a
          href="https://ballotpedia.org/United_States_Senate_elections_in_South_Carolina,_2026"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline"
          style={{ color: 'var(--class-purple)' }}
        >
          Learn more about this race
        </a>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
