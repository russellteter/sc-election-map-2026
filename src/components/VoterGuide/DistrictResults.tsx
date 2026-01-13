'use client';

import Link from 'next/link';
import type { District, CandidatesData } from '@/types/schema';
import type { GeocodingResult } from '@/lib/geocoding';
import CandidateCard from '@/components/Dashboard/CandidateCard';

interface DistrictResultsProps {
  lookupResult: GeocodingResult;
  candidatesData: CandidatesData;
}

export default function DistrictResults({ lookupResult, candidatesData }: DistrictResultsProps) {
  const { houseDistrict, senateDistrict, normalizedAddress, county } = lookupResult;

  // Get district data from candidates
  const houseData: District | null =
    houseDistrict && candidatesData.house[String(houseDistrict)]
      ? candidatesData.house[String(houseDistrict)]
      : null;

  const senateData: District | null =
    senateDistrict && candidatesData.senate[String(senateDistrict)]
      ? candidatesData.senate[String(senateDistrict)]
      : null;

  return (
    <div className="space-y-6 animate-entrance" style={{ animationDelay: '100ms' }}>
      {/* Address Confirmation */}
      <div
        className="glass-surface rounded-lg p-4 flex items-start gap-3"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'var(--color-safe-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
          }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: 'var(--color-safe)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="font-medium" style={{ color: 'var(--text-color)' }}>
            Address Found
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {normalizedAddress}
          </p>
          {county && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {county}
            </p>
          )}
        </div>
      </div>

      {/* Districts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* House District */}
        {houseDistrict && (
          <div className="glass-surface rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold font-display text-lg"
                  style={{
                    background: 'var(--class-purple-bg)',
                    color: 'var(--class-purple)',
                    border: '1px solid var(--class-purple-light)',
                  }}
                >
                  {houseDistrict}
                </div>
                <div>
                  <h3
                    className="font-display font-semibold text-lg"
                    style={{ color: 'var(--text-color)' }}
                  >
                    SC House District {houseDistrict}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    State Representative
                  </p>
                </div>
              </div>
              <span
                className="badge text-xs"
                style={{
                  background: 'var(--class-purple-bg)',
                  color: 'var(--class-purple)',
                  border: '1px solid var(--class-purple-light)',
                }}
              >
                HOUSE
              </span>
            </div>

            {houseData && houseData.candidates.length > 0 ? (
              <div className="space-y-3">
                {houseData.candidates.map((candidate, idx) => (
                  <CandidateCard
                    key={candidate.reportId || candidate.name}
                    candidate={candidate}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              <div
                className="text-center py-8 rounded-lg"
                style={{
                  background: 'var(--class-purple-bg)',
                  border: '1px dashed var(--class-purple-light)',
                }}
              >
                <svg
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: 'var(--text-muted)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                  No Candidates Yet
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  No candidates have filed for this district
                </p>
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Link
                href={`/?chamber=house&district=${houseDistrict}`}
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--class-purple)' }}
              >
                View on map
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Senate District */}
        {senateDistrict && (
          <div className="glass-surface rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold font-display text-lg"
                  style={{
                    background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                    color: '#7C3AED',
                    border: '1px solid #C4B5FD',
                  }}
                >
                  {senateDistrict}
                </div>
                <div>
                  <h3
                    className="font-display font-semibold text-lg"
                    style={{ color: 'var(--text-color)' }}
                  >
                    SC Senate District {senateDistrict}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    State Senator
                  </p>
                </div>
              </div>
              <span
                className="badge text-xs"
                style={{
                  background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                  color: '#7C3AED',
                  border: '1px solid #C4B5FD',
                }}
              >
                SENATE
              </span>
            </div>

            {senateData && senateData.candidates.length > 0 ? (
              <div className="space-y-3">
                {senateData.candidates.map((candidate, idx) => (
                  <CandidateCard
                    key={candidate.reportId || candidate.name}
                    candidate={candidate}
                    index={idx}
                  />
                ))}
              </div>
            ) : (
              <div
                className="text-center py-8 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                  border: '1px dashed #C4B5FD',
                }}
              >
                <svg
                  className="w-10 h-10 mx-auto mb-2"
                  style={{ color: 'var(--text-muted)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                  No Candidates Yet
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  No candidates have filed for this district
                </p>
              </div>
            )}

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <Link
                href={`/?chamber=senate&district=${senateDistrict}`}
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: '#7C3AED' }}
              >
                View on map
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* No districts found */}
      {!houseDistrict && !senateDistrict && (
        <div
          className="glass-surface rounded-lg p-8 text-center"
        >
          <svg
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: 'var(--text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
          </svg>
          <p className="font-medium" style={{ color: 'var(--text-color)' }}>
            District Information Unavailable
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            We couldn&apos;t find district information for this address.
            <br />
            Try the{' '}
            <a
              href="https://www.scstatehouse.gov/legislatorssearch.php"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              SC Legislature website
            </a>{' '}
            for official lookup.
          </p>
        </div>
      )}
    </div>
  );
}
