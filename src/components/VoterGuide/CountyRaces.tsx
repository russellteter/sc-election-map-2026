'use client';

import type { CountyRacesData, CountyRace, CountyData } from '@/types/schema';
import CandidateCard from '@/components/Dashboard/CandidateCard';

interface CountyRacesProps {
  data: CountyRacesData;
  countyName: string | null;
}

// County election office URLs for SC counties
const COUNTY_ELECTION_URLS: Record<string, string> = {
  'Greenville': 'https://www.greenvillecounty.org/voterregistration/',
  'Richland': 'https://richlandcountysc.gov/government/election-commission',
  'Charleston': 'https://www.charlestoncounty.org/departments/bevr/',
  'Horry': 'https://www.horrycounty.org/Departments/Voter-Registration',
  'Spartanburg': 'https://www.spartanburgcounty.org/189/Voter-Registration',
  'Lexington': 'https://lex-co.sc.gov/departments/election-commission',
  'York': 'https://www.yorkcountygov.com/137/Board-of-Voter-Registration-Elections',
  'Berkeley': 'https://www.berkeleycountysc.gov/election/',
  'Anderson': 'https://www.andersoncountysc.org/voter-registration/',
  'Beaufort': 'https://www.beaufortcountysc.gov/elections/',
};

// Default fallback URL for counties not in the list
const DEFAULT_COUNTY_URL = 'https://scvotes.gov/voters/locate-your-county-voter-registration-and-elections-office/';

export default function CountyRaces({ data, countyName }: CountyRacesProps) {
  // Get county data if available
  const countyData: CountyData | null = countyName ? data.counties[countyName] || null : null;

  // Get election office URL for the county
  const countyElectionUrl = countyName
    ? COUNTY_ELECTION_URLS[countyName] || DEFAULT_COUNTY_URL
    : DEFAULT_COUNTY_URL;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            border: '1px solid #6EE7B7',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#047857' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
            {countyName ? `${countyName} County Offices` : 'County Offices'}
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {countyName
              ? 'Local constitutional officers for your county'
              : 'County-level elected positions'
            }
          </p>
        </div>
      </div>

      {/* County races or fallback message */}
      {countyData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {countyData.races.map((race) => (
            <CountyRaceCard key={race.office} race={race} countyName={countyName!} />
          ))}
        </div>
      ) : (
        <div className="glass-surface rounded-lg p-6 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              border: '1px solid #6EE7B7',
            }}
          >
            <svg className="w-6 h-6" style={{ color: '#047857' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="font-display font-semibold mb-2" style={{ color: 'var(--text-color)' }}>
            County races coming soon
          </h4>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {countyName
              ? `Detailed race information for ${countyName} County will be available once the filing period opens (March 16-30, 2026).`
              : 'Enter your address above to see county-level races for your area.'
            }
          </p>
          <a
            href={countyElectionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              color: '#047857',
              border: '1px solid #6EE7B7',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {countyName ? `Visit ${countyName} County Elections` : 'Find Your County Office'}
          </a>
        </div>
      )}
    </div>
  );
}

interface CountyRaceCardProps {
  race: CountyRace;
  countyName: string;
}

function CountyRaceCard({ race, countyName }: CountyRaceCardProps) {
  const { office, incumbent, candidates, termYears } = race;

  // Get office description
  const officeDescription = getOfficeDescription(office);

  return (
    <div className="glass-surface rounded-lg p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
            {office}
          </h4>
          {officeDescription && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
              {officeDescription}
            </p>
          )}
        </div>
        <span
          className="badge text-xs flex-shrink-0 ml-2"
          style={{
            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            color: '#047857',
            border: '1px solid #6EE7B7',
          }}
        >
          COUNTY
        </span>
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
                className="badge text-xs"
                style={{
                  background: incumbent.party === 'Democratic' ? 'var(--party-dem-bg)' : 'var(--party-rep-bg)',
                  color: incumbent.party === 'Democratic' ? 'var(--party-dem)' : 'var(--party-rep)',
                }}
              >
                {incumbent.party === 'Democratic' ? 'D' : 'R'}
              </span>
            </div>
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
              background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
              border: '1px dashed #6EE7B7',
            }}
          >
            <p className="text-xs font-medium" style={{ color: '#047857' }}>
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
          href={`https://ballotpedia.org/${countyName}_County,_South_Carolina`}
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

/**
 * Get a brief description for each county office
 */
function getOfficeDescription(office: string): string {
  switch (office) {
    case 'Sheriff':
      return 'Chief law enforcement officer for the county';
    case 'Auditor':
      return 'Manages county finances and property tax assessments';
    case 'Treasurer':
      return 'Handles county funds, investments, and tax collection';
    case 'Coroner':
      return 'Investigates deaths and determines cause of death';
    case 'Clerk of Court':
      return 'Maintains court records and assists in court proceedings';
    case 'Register of Deeds':
      return 'Records and maintains property deeds and documents';
    case 'Probate Judge':
      return 'Handles wills, estates, and guardianship matters';
    default:
      return '';
  }
}
