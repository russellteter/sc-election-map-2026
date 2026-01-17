'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  PollingPlaceFinder
} from '@/components/VoterGuide';
import { geocodeAddress, reverseGeocode, getCurrentLocation, isInSouthCarolina, GeocodeResult } from '@/lib/geocoding';
import { findDistricts, preloadBoundaries, DistrictResult } from '@/lib/districtLookup';
import { getCountyFromCoordinates } from '@/lib/congressionalLookup';
import type {
  CandidatesData,
  StatewideRacesData,
  CongressionalData,
  ElectionDatesData,
  CountyRacesData,
  JudicialRacesData,
  SchoolBoardData,
  BallotMeasuresData,
  SpecialDistrictsData
} from '@/types/schema';

type LookupStatus = 'idle' | 'geocoding' | 'finding-districts' | 'done' | 'error';

interface AllRacesData {
  candidates: CandidatesData | null;
  statewide: StatewideRacesData | null;
  judicialRaces: JudicialRacesData | null;
  congressional: CongressionalData | null;
  countyRaces: CountyRacesData | null;
  schoolBoard: SchoolBoardData | null;
  specialDistricts: SpecialDistrictsData | null;
  ballotMeasures: BallotMeasuresData | null;
  electionDates: ElectionDatesData | null;
}

interface ExtendedDistrictResult extends DistrictResult {
  congressionalDistrict?: number | null;
  countyName?: string | null;
}

function VoterGuideContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allData, setAllData] = useState<AllRacesData>({
    candidates: null,
    statewide: null,
    judicialRaces: null,
    congressional: null,
    countyRaces: null,
    schoolBoard: null,
    specialDistricts: null,
    ballotMeasures: null,
    electionDates: null,
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Lookup state
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Results state
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [districtResult, setDistrictResult] = useState<ExtendedDistrictResult | null>(null);

  // Address from URL for sharing
  const [initialAddress, setInitialAddress] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Load all data on mount
  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const cacheBuster = `v=${Date.now()}`;

    // Load all data files in parallel
    Promise.all([
      fetch(`${basePath}/data/candidates.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/statewide-races.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/judicial-races.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/congress-candidates.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/county-races.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/school-board.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/special-districts.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/ballot-measures.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/election-dates.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
    ]).then(([candidates, statewide, judicialRaces, congressional, countyRaces, schoolBoard, specialDistricts, ballotMeasures, electionDates]) => {
      setAllData({
        candidates,
        statewide,
        judicialRaces,
        congressional,
        countyRaces,
        schoolBoard,
        specialDistricts,
        ballotMeasures,
        electionDates
      });
      setIsDataLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setIsDataLoading(false);
    });

    // Note: GeoJSON boundaries are now lazy-loaded on AddressAutocomplete focus
    // This defers 2MB of data until user interaction
  }, []);

  // Handle URL parameter on mount (for shareable links)
  useEffect(() => {
    const addressParam = searchParams.get('address');
    if (addressParam && !geocodeResult) {
      const decodedAddress = decodeURIComponent(addressParam);
      setInitialAddress(decodedAddress);
      // Auto-search if we have an address in the URL
      handleAddressSubmit(decodedAddress, 0, 0);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate shareable URL when we have results
  useEffect(() => {
    if (geocodeResult?.displayName) {
      const url = new URL(window.location.href);
      url.searchParams.set('address', encodeURIComponent(geocodeResult.displayName));
      setShareUrl(url.toString());
    } else {
      setShareUrl(null);
    }
  }, [geocodeResult]);

  const handleAddressSubmit = useCallback(async (address: string, lat: number, lon: number) => {
    // Reset state
    setError(null);
    setGeocodeResult(null);
    setDistrictResult(null);
    setShareUrl(null);

    try {
      let finalLat = lat;
      let finalLon = lon;
      let displayName = address;

      // If we have coordinates from autocomplete, use them directly
      if (lat !== 0 && lon !== 0) {
        // Verify they're in SC
        if (!isInSouthCarolina(lat, lon)) {
          setStatus('error');
          setError('This address does not appear to be in South Carolina. Please enter a South Carolina address.');
          return;
        }

        setGeocodeResult({
          success: true,
          lat,
          lon,
          displayName: address,
        });
      } else {
        // Need to geocode the address
        setStatus('geocoding');
        setStatusMessage('Looking up address...');

        const geoResult = await geocodeAddress(address);

        if (!geoResult.success) {
          setStatus('error');
          setError(geoResult.error || 'Address lookup failed');
          setStatusMessage(null);
          return;
        }

        finalLat = geoResult.lat!;
        finalLon = geoResult.lon!;
        displayName = geoResult.displayName || address;

        setGeocodeResult(geoResult);
      }

      setStatusMessage(`Found: ${displayName.split(',').slice(0, 3).join(',')}`);

      // Step 2: Find all districts
      setStatus('finding-districts');
      setStatusMessage('Finding your districts...');

      // Get state legislative districts
      const districts = await findDistricts(finalLat, finalLon);

      // Get county and congressional district
      const countyInfo = await getCountyFromCoordinates(finalLat, finalLon);

      if (!districts.success) {
        setStatus('error');
        setError(districts.error || 'Could not determine districts');
        setStatusMessage(null);
        return;
      }

      // Combine all district info
      const extendedResult: ExtendedDistrictResult = {
        ...districts,
        congressionalDistrict: countyInfo.congressionalDistrict,
        countyName: countyInfo.countyName,
      };

      setDistrictResult(extendedResult);
      setStatus('done');
      setStatusMessage(null);

      // Update URL with address (without triggering navigation)
      const url = new URL(window.location.href);
      url.searchParams.set('address', encodeURIComponent(displayName));
      window.history.replaceState({}, '', url.toString());

    } catch (err) {
      console.error('Lookup error:', err);
      setStatus('error');
      setError('An unexpected error occurred. Please try again.');
      setStatusMessage(null);
    }
  }, [router]);

  const handleGeolocationRequest = useCallback(async () => {
    setIsGeolocating(true);
    setError(null);

    try {
      const location = await getCurrentLocation();

      if (!location) {
        setError('Unable to get your location. Please check your browser permissions and try again, or enter your address manually.');
        setIsGeolocating(false);
        return;
      }

      const { lat, lon } = location;

      // Check if in SC
      if (!isInSouthCarolina(lat, lon)) {
        setError('Your location does not appear to be in South Carolina. Please enter a South Carolina address manually.');
        setIsGeolocating(false);
        return;
      }

      // Reverse geocode to get address
      setStatusMessage('Getting your address...');
      const reverseResult = await reverseGeocode(lat, lon);

      if (!reverseResult.success) {
        setError(reverseResult.error || 'Could not determine your address');
        setIsGeolocating(false);
        return;
      }

      // Set the address in the input
      setInitialAddress(reverseResult.displayName || '');
      setIsGeolocating(false);

      // Auto-submit with the coordinates we already have
      handleAddressSubmit(reverseResult.displayName || '', lat, lon);

    } catch (err) {
      console.error('Geolocation error:', err);
      setError('An error occurred while getting your location. Please enter your address manually.');
      setIsGeolocating(false);
    }
  }, [handleAddressSubmit]);

  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setStatusMessage(null);
    setGeocodeResult(null);
    setDistrictResult(null);
    setInitialAddress('');
    setShareUrl(null);
    // Clear URL params
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  };

  const handleCopyShareLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    }
  };

  const isLoading = status === 'geocoding' || status === 'finding-districts';
  const hasResults = status === 'done' && districtResult;

  // Count total races for display
  const raceCount = hasResults ? (
    2 + // House + Senate state legislative
    (allData.statewide?.races.length || 0) +
    (districtResult.congressionalDistrict ? 2 : 0) // US House + US Senate
  ) : 0;

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="glass-surface border-b sticky top-0 z-50"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--class-purple)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Map
              </Link>
            </div>
            <div className="text-right">
              <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-color)' }}>
                SC Voter Guide
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                2026 Elections
              </p>
            </div>
          </div>
        </div>
      </header>

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
              {hasResults && allData.candidates && (
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

      {/* Footer */}
      <footer
        className="border-t py-6"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--card-bg)' }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Data sourced from the{' '}
            <a
              href="https://ethicsfiling.sc.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              SC Ethics Commission
            </a>
            ,{' '}
            <a
              href="https://scvotes.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              SC Election Commission
            </a>
            , and{' '}
            <a
              href="https://ballotpedia.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              Ballotpedia
            </a>
            .
          </p>
        </div>
      </footer>
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
