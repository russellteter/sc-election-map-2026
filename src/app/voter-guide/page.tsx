'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AddressInput, DistrictResults } from '@/components/VoterGuide';
import { geocodeAddress, GeocodeResult } from '@/lib/geocoding';
import { findDistricts, preloadBoundaries, DistrictResult } from '@/lib/districtLookup';
import type { CandidatesData } from '@/types/schema';

type LookupStatus = 'idle' | 'geocoding' | 'finding-districts' | 'done' | 'error';

export default function VoterGuidePage() {
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Lookup state
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [districtResult, setDistrictResult] = useState<DistrictResult | null>(null);

  // Load candidates data and preload boundaries on mount
  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const cacheBuster = `v=${Date.now()}`;

    // Load candidates data
    fetch(`${basePath}/data/candidates.json?${cacheBuster}`)
      .then((res) => res.json())
      .then((data) => {
        setCandidatesData(data);
        setIsDataLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load candidates data:', err);
        setIsDataLoading(false);
      });

    // Preload GeoJSON boundaries in background
    preloadBoundaries().then((success) => {
      if (success) {
        console.log('[VoterGuide] District boundaries preloaded');
      }
    });
  }, []);

  const handleAddressSubmit = async (address: string) => {
    // Reset state
    setError(null);
    setGeocodeResult(null);
    setDistrictResult(null);

    try {
      // Step 1: Geocode the address
      setStatus('geocoding');
      setStatusMessage('Looking up address...');

      const geoResult = await geocodeAddress(address);

      if (!geoResult.success) {
        setStatus('error');
        setError(geoResult.error || 'Address lookup failed');
        setStatusMessage(null);
        return;
      }

      setGeocodeResult(geoResult);
      setStatusMessage(`Found: ${geoResult.displayName?.split(',').slice(0, 3).join(',')}`);

      // Step 2: Find districts
      setStatus('finding-districts');
      setStatusMessage('Finding your districts...');

      const districts = await findDistricts(geoResult.lat!, geoResult.lon!);

      if (!districts.success) {
        setStatus('error');
        setError(districts.error || 'Could not determine districts');
        setStatusMessage(null);
        return;
      }

      setDistrictResult(districts);
      setStatus('done');
      setStatusMessage(null);

    } catch (err) {
      console.error('Lookup error:', err);
      setStatus('error');
      setError('An unexpected error occurred. Please try again.');
      setStatusMessage(null);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setError(null);
    setStatusMessage(null);
    setGeocodeResult(null);
    setDistrictResult(null);
  };

  const isLoading = status === 'geocoding' || status === 'finding-districts';
  const hasResults = status === 'done' && districtResult;

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
              Find Your Candidates
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
              Enter your address to see who&apos;s running in your SC House and Senate districts
            </p>
          </div>

          {/* Loading State */}
          {isDataLoading && (
            <div className="glass-surface rounded-lg p-8 text-center">
              <div
                className="animate-spin h-8 w-8 mx-auto mb-4 border-2 rounded-full"
                style={{ borderColor: 'var(--class-purple-light)', borderTopColor: 'var(--class-purple)' }}
              />
              <p style={{ color: 'var(--text-muted)' }}>Loading candidate data...</p>
            </div>
          )}

          {/* Main Content */}
          {!isDataLoading && (
            <div className="space-y-8">
              {/* Address Input */}
              <AddressInput
                onSubmit={handleAddressSubmit}
                isLoading={isLoading}
                error={error}
                statusMessage={statusMessage}
              />

              {/* Results Section */}
              {hasResults && candidatesData && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
                      Your Districts
                    </h3>
                    <button
                      onClick={handleReset}
                      className="text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: 'var(--class-purple)' }}
                    >
                      Search another address
                    </button>
                  </div>
                  <DistrictResults
                    houseDistrict={districtResult.houseDistrict}
                    senateDistrict={districtResult.senateDistrict}
                    displayAddress={geocodeResult?.displayName || ''}
                    candidatesData={candidatesData}
                  />
                </>
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
            {' '}and{' '}
            <a
              href="https://scvotes.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              SC Election Commission
            </a>
            . Address lookup powered by{' '}
            <a
              href="https://nominatim.openstreetmap.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--class-purple)' }}
            >
              OpenStreetMap
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
