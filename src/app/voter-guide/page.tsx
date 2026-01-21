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
  VoterGuideSummary,
  MiniMapPreview,
  PersonalDistrictMap
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
          <ElectionCountdown fallbackData={allData.electionDates || undefined} />

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

                  {/* Interactive District Map - Shows user's location with animated zoom */}
                  {geocodeResult && geocodeResult.lat !== undefined && geocodeResult.lon !== undefined && (
                    <div className="voter-glass-surface rounded-xl overflow-hidden animate-in animate-in-delay-2">
                      <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: 'var(--class-purple-bg)',
                              border: '1px solid var(--class-purple-light)',
                            }}
                          >
                            <svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
                              Your Districts Map
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                              Interactive map showing your location and district boundaries
                            </p>
                          </div>
                        </div>
                      </div>
                      <PersonalDistrictMap
                        lat={geocodeResult.lat}
                        lon={geocodeResult.lon}
                        houseDistrict={districtResult.houseDistrict}
                        senateDistrict={districtResult.senateDistrict}
                        congressionalDistrict={districtResult.congressionalDistrict || null}
                        candidatesData={allData.candidates}
                        displayAddress={geocodeResult.displayName}
                        animateOnMount={true}
                        initialChamber="house"
                      />
                    </div>
                  )}

                  {/* Statewide Constitutional Offices */}
                  {allData.statewide && (
                    <StatewideRaces data={allData.statewide} stateCode="SC" />
                  )}

                  {/* Judicial Races */}
                  {allData.judicialRaces && (
                    <JudicialRaces
                      data={allData.judicialRaces}
                      countyName={districtResult.countyName || null}
                      stateCode="SC"
                    />
                  )}

                  {/* US Congressional Races */}
                  {allData.congressional && (
                    <CongressionalRaces
                      data={allData.congressional}
                      congressionalDistrict={districtResult.congressionalDistrict || null}
                      countyName={districtResult.countyName || null}
                      stateCode="SC"
                    />
                  )}

                  {/* State Legislative Districts */}
                  <div className="space-y-6 animate-in animate-in-delay-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="section-header-accent flex-1">
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
                      {/* Mini map preview showing user's district */}
                      <MiniMapPreview
                        stateCode="sc"
                        chamber="house"
                        highlightedDistrict={districtResult.houseDistrict}
                        className="hidden sm:block"
                      />
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
                      stateCode="SC"
                    />
                  )}

                  {/* Special Districts */}
                  {allData.specialDistricts && (
                    <SpecialDistricts
                      data={allData.specialDistricts}
                      countyName={districtResult.countyName || null}
                      stateCode="SC"
                    />
                  )}

                  {/* Ballot Measures */}
                  {allData.ballotMeasures && (
                    <BallotMeasures
                      data={allData.ballotMeasures}
                      countyName={districtResult.countyName || null}
                      stateCode="SC"
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
