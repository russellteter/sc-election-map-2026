'use client';

import { Suspense } from 'react';
import {
  AddressAutocomplete,
  DistrictResults,
  StatewideRaces,
  JudicialRaces,
  CongressionalRaces,
  CountyRaces,
  SchoolBoardRaces,
  SpecialDistricts,
  BallotMeasures,
  VoterResources,
  VoterGuidePageSkeleton,
  ElectionCountdown,
  PollingPlaceFinder,
  VoterGuideHeader,
  VoterGuideFooter
} from '@/components/VoterGuide';
import { useVoterGuideData } from '@/hooks/useVoterGuideData';
import { useAddressLookup } from '@/hooks/useAddressLookup';

function VoterGuideContent() {
  // Load all voter guide data
  const { data: allData, isLoading: isDataLoading } = useVoterGuideData();

  // Address lookup and district finding
  const {
    error,
    isGeolocating,
    geocodeResult,
    districtResult,
    initialAddress,
    shareUrl,
    statusMessage,
    handleAddressSubmit,
    handleGeolocationRequest,
    handleReset,
    handleCopyShareLink,
    isLoading,
    hasResults,
  } = useAddressLookup();

  // Count total races for display
  const raceCount = hasResults && districtResult ? (
    2 + // House + Senate state legislative
    (allData.statewide?.races.length || 0) +
    (districtResult.congressionalDistrict ? 2 : 0) // US House + US Senate
  ) : 0;

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      <VoterGuideHeader />

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Page Intro */}
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--text-color)' }}>
              Find Your Ballot
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
              Enter your address to see all races you&apos;ll vote on in 2026
            </p>
          </div>

          {/* Election Countdown - Always Visible */}
          <ElectionCountdown />

          {/* Loading State with Skeleton */}
          {isDataLoading && (
            <div className="space-y-8">
              <div className="voter-glass-surface rounded-lg p-8 text-center">
                <div
                  className="animate-spin h-8 w-8 mx-auto mb-4 border-2 rounded-full"
                  style={{ borderColor: 'var(--class-purple-light)', borderTopColor: 'var(--class-purple)' }}
                />
                <p style={{ color: 'var(--text-muted)' }}>Loading election data...</p>
              </div>
              <VoterGuidePageSkeleton />
            </div>
          )}

          {/* Main Content */}
          {!isDataLoading && (
            <div className="space-y-8">
              {/* Address Input with Autocomplete */}
              <AddressAutocomplete
                onAddressSelect={handleAddressSubmit}
                onGeolocationRequest={handleGeolocationRequest}
                isLoading={isLoading}
                isGeolocating={isGeolocating}
                error={error}
                statusMessage={statusMessage}
                initialAddress={initialAddress}
              />

              {/* Results Section */}
              {hasResults && districtResult && allData.candidates && (
                <div className="space-y-10">
                  {/* KPI Summary Card - Glassmorphic */}
                  <div className="kpi-summary-card animate-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      {/* Left side - Title and stats */}
                      <div className="flex items-center gap-5">
                        {/* Race count with animated counter */}
                        <div className="text-center">
                          <div
                            className="font-display font-bold text-4xl animate-count-up gradient-text"
                          >
                            {raceCount}
                          </div>
                          <p className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: 'var(--text-muted)' }}>
                            Races
                          </p>
                        </div>

                        {/* Divider */}
                        <div
                          className="hidden sm:block w-px h-12"
                          style={{ background: 'var(--class-purple-light)' }}
                        />

                        {/* Title and county */}
                        <div>
                          <h3 className="font-display font-bold text-xl gradient-text">
                            Your 2026 Ballot
                          </h3>
                          {districtResult.countyName && (
                            <div className="mt-2">
                              <span className="county-badge">
                                {districtResult.countyName} County
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex items-center gap-3 flex-wrap no-print">
                        {shareUrl && (
                          <button
                            onClick={handleCopyShareLink}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
                            style={{
                              background: 'var(--class-purple-bg)',
                              color: 'var(--class-purple)',
                              border: '1px solid var(--class-purple-light)',
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Share
                          </button>
                        )}
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: 'var(--card-bg)',
                            color: 'var(--text-color)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Print
                        </button>
                        <button
                          onClick={handleReset}
                          className="text-sm font-medium transition-colors hover:opacity-80 underline"
                          style={{ color: 'var(--class-purple)' }}
                        >
                          Search another address
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Polling Place Finder - Shows after address lookup */}
                  {geocodeResult && (
                    <PollingPlaceFinder
                      address={geocodeResult.displayName || ''}
                    />
                  )}

                  {/* Statewide Constitutional Offices */}
                  {allData.statewide && (
                    <StatewideRaces data={allData.statewide} />
                  )}

                  {/* Judicial Races */}
                  {allData.judicialRaces && (
                    <JudicialRaces
                      data={allData.judicialRaces}
                      countyName={districtResult.countyName || null}
                    />
                  )}

                  {/* US Congressional Races */}
                  {allData.congressional && (
                    <CongressionalRaces
                      data={allData.congressional}
                      congressionalDistrict={districtResult.congressionalDistrict || null}
                      countyName={districtResult.countyName || null}
                    />
                  )}

                  {/* State Legislative Districts */}
                  <div className="space-y-6 animate-in animate-in-delay-3">
                    <div className="section-header-accent">
                      <div
                        className="section-header-icon"
                        style={{
                          background: 'var(--class-purple-bg)',
                          border: '1px solid var(--class-purple-light)',
                        }}
                      >
                        <svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
                          SC State Legislature
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          Your state representative and senator
                        </p>
                      </div>
                    </div>
                    <DistrictResults
                      houseDistrict={districtResult.houseDistrict}
                      senateDistrict={districtResult.senateDistrict}
                      displayAddress={geocodeResult?.displayName || ''}
                      candidatesData={allData.candidates}
                    />
                  </div>

                  {/* County Constitutional Offices */}
                  {allData.countyRaces && (
                    <CountyRaces
                      data={allData.countyRaces}
                      countyName={districtResult.countyName || null}
                    />
                  )}

                  {/* School Board Races */}
                  {allData.schoolBoard && (
                    <SchoolBoardRaces
                      data={allData.schoolBoard}
                      countyName={districtResult.countyName || null}
                    />
                  )}

                  {/* Special Districts */}
                  {allData.specialDistricts && (
                    <SpecialDistricts
                      data={allData.specialDistricts}
                      countyName={districtResult.countyName || null}
                    />
                  )}

                  {/* Ballot Measures */}
                  {allData.ballotMeasures && (
                    <BallotMeasures
                      data={allData.ballotMeasures}
                      countyName={districtResult.countyName || null}
                    />
                  )}

                  {/* Voter Resources & Election Dates */}
                  {allData.electionDates && (
                    <VoterResources data={allData.electionDates} />
                  )}
                </div>
              )}

              {/* Manual Fallback Link */}
              <div className="text-center pt-4">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Having trouble?{' '}
                  <a
                    href="https://www.scstatehouse.gov/legislatorssearch.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: 'var(--class-purple)' }}
                  >
                    Find your district on scstatehouse.gov
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <VoterGuideFooter />
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function VoterGuidePage() {
  return (
    <Suspense fallback={
      <div className="atmospheric-bg min-h-screen flex items-center justify-center">
        <div
          className="animate-spin h-8 w-8 border-2 rounded-full"
          style={{ borderColor: 'var(--class-purple-light)', borderTopColor: 'var(--class-purple)' }}
        />
      </div>
    }>
      <VoterGuideContent />
    </Suspense>
  );
}
