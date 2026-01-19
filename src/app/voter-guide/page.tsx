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
  VoterGuideFooter,
  VoterGuideSummary
} from '@/components/VoterGuide';
import { useVoterGuideData } from '@/hooks/useVoterGuideData';
import { useAddressLookup } from '@/hooks/useAddressLookup';

function VoterGuideContent() {
  // Load all voter guide data
  const { data: allData, isLoading: isDataLoading } = useVoterGuideData();

  // Address lookup and district finding
  const {
    error,
    errorType,
    errorSuggestion,
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
                errorType={errorType}
                errorSuggestion={errorSuggestion}
                statusMessage={statusMessage}
                initialAddress={initialAddress}
              />

              {/* Results Section */}
              {hasResults && districtResult && allData.candidates && (
                <div className="space-y-10">
                  <VoterGuideSummary
                    raceCount={raceCount}
                    countyName={districtResult.countyName || null}
                    shareUrl={shareUrl}
                    onShare={handleCopyShareLink}
                    onPrint={() => window.print()}
                    onReset={handleReset}
                  />

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
                      countyContacts={allData.countyContacts}
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
