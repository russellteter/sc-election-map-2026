'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type {
  CandidatesData,
  ElectionsData,
  OpportunityData,
  District,
  DistrictElectionHistory,
  DistrictOpportunity,
} from '@/types/schema';
import {
  RaceHero,
  StrategicInsights,
  ElectionHistoryChart,
  CandidateComparison,
  StrategicRecommendations,
} from '@/components/Race';
import { Button } from '@/components/ui';
import {
  ElectorateProfile,
  MobilizationCard,
  ResourceOptimizer,
  EarlyVoteTracker,
} from '@/components/Intelligence';
import { DemoBadge } from '@/components/ui';

type Chamber = 'house' | 'senate';

interface RaceProfileClientProps {
  chamber: string;
  district: string;
}

/**
 * Client component for the Race Profile Page
 * Handles data loading and rendering
 */
export default function RaceProfileClient({ chamber: chamberParam, district: districtParam }: RaceProfileClientProps) {
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [electionsData, setElectionsData] = useState<ElectionsData | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backToMapUrl, setBackToMapUrl] = useState<string>('/');

  // Validate chamber parameter
  const chamber = chamberParam.toLowerCase() as Chamber;
  const districtNumber = parseInt(districtParam, 10);

  const isValidChamber = chamber === 'house' || chamber === 'senate';
  const isValidDistrict =
    !isNaN(districtNumber) &&
    districtNumber > 0 &&
    (chamber === 'house' ? districtNumber <= 124 : districtNumber <= 46);

  // Parse return context from URL for "Back to Map" navigation (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);
    const returnFilters = searchParams.get('returnFilters');

    if (returnFilters) {
      setBackToMapUrl(`/?${returnFilters}`);
    } else {
      setBackToMapUrl(`/?chamber=${chamber}&district=${districtNumber}`);
    }
  }, [chamber, districtNumber]);

  // Load data
  useEffect(() => {
    if (!isValidChamber || !isValidDistrict) {
      setIsLoading(false);
      return;
    }

    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const cacheBuster = `v=${Date.now()}`;

    Promise.all([
      fetch(`${basePath}/data/candidates.json?${cacheBuster}`).then((res) => {
        if (!res.ok) throw new Error('Failed to load candidates data');
        return res.json();
      }),
      fetch(`${basePath}/data/elections.json?${cacheBuster}`).then((res) => {
        if (!res.ok) throw new Error('Failed to load elections data');
        return res.json();
      }),
      fetch(`${basePath}/data/opportunity.json?${cacheBuster}`).then((res) => {
        if (!res.ok) throw new Error('Failed to load opportunity data');
        return res.json();
      }),
    ])
      .then(([candidates, elections, opportunity]) => {
        setCandidatesData(candidates);
        setElectionsData(elections);
        setOpportunityData(opportunity);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [isValidChamber, isValidDistrict]);

  // Handle invalid parameters
  if (!isValidChamber || !isValidDistrict) {
    return (
      <div className="min-h-screen atmospheric-bg">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <NotFoundState chamber={chamber || undefined} district={districtNumber > 0 ? districtNumber.toString() : undefined} />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen atmospheric-bg">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <LoadingState />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen atmospheric-bg">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <ErrorState message={error} />
        </div>
      </div>
    );
  }

  // Get district data
  const districtKey = districtNumber.toString();
  const district: District | undefined = candidatesData?.[chamber]?.[districtKey];
  const history: DistrictElectionHistory | undefined = electionsData?.[chamber]?.[districtKey];
  const opportunity: DistrictOpportunity | undefined = opportunityData?.[chamber]?.[districtKey];

  // District not found in data
  if (!district) {
    return (
      <div className="min-h-screen atmospheric-bg">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <NotFoundState chamber={chamber} district={districtNumber.toString()} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen atmospheric-bg">
      {/* Navigation header */}
      <header
        className="sticky top-0 z-50 glass-surface border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={backToMapUrl}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--class-purple)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Map
          </Link>

          {/* Navigation between districts + Table View */}
          <div className="flex items-center gap-3">
            {/* View in Table button */}
            <Link
              href={`/table?chamber=${chamber}&highlight=${districtNumber}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-70"
              style={{
                background: 'var(--card-bg, #FFFFFF)',
                border: '1px solid var(--class-purple-light, #DAD7FA)',
                color: 'var(--text-primary)',
              }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              View in Table
            </Link>

            {/* Prev/Next navigation */}
            <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: 'var(--class-purple-light)' }}>
            {districtNumber > 1 && (
              <Link
                href={`/race/${chamber}/${districtNumber - 1}`}
                className="p-2 rounded-lg transition-colors hover:bg-white/50"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Previous district"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}

            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {chamber === 'house' ? `${districtNumber}/124` : `${districtNumber}/46`}
            </span>

            {districtNumber < (chamber === 'house' ? 124 : 46) && (
              <Link
                href={`/race/${chamber}/${districtNumber + 1}`}
                className="p-2 rounded-lg transition-colors hover:bg-white/50"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Next district"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero section */}
        <section className="animate-entrance">
          <RaceHero
            chamber={chamber}
            districtNumber={districtNumber}
            incumbent={district.incumbent}
            candidates={district.candidates}
            opportunity={opportunity}
          />
        </section>

        {/* Two-column layout for insights and history */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategic Insights */}
          <section className="animate-entrance stagger-1">
            <StrategicInsights
              opportunity={opportunity}
              history={history}
            />
          </section>

          {/* Election History */}
          <section className="animate-entrance stagger-2">
            <div className="glass-surface rounded-xl p-5">
              <h3
                className="text-base font-semibold font-display mb-4"
                style={{ color: 'var(--text-color)' }}
              >
                Election History
              </h3>
              {history ? (
                <ElectionHistoryChart history={history} />
              ) : (
                <div
                  className="text-center py-8"
                  style={{ color: 'var(--text-muted)' }}
                >
                  No election history available
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Candidates section */}
        <section className="animate-entrance stagger-3">
          <CandidateComparison
            candidates={district.candidates}
            incumbent={district.incumbent}
          />
        </section>

        {/* Strategic Recommendations */}
        <section className="animate-entrance stagger-4">
          <StrategicRecommendations
            opportunity={opportunity}
            history={history}
            candidates={district.candidates}
            chamber={chamber}
            districtNumber={districtNumber}
          />
        </section>

        {/* Voter Intelligence Section */}
        <section className="animate-entrance stagger-5">
          <div className="glass-surface rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3
                    className="text-base font-semibold font-display"
                    style={{ color: 'var(--text-color)' }}
                  >
                    Voter Intelligence
                  </h3>
                  <DemoBadge />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Electorate profile and campaign strategy insights
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Electorate Profile */}
              <div>
                <ElectorateProfile
                  chamber={chamber}
                  districtNumber={districtNumber}
                />
              </div>

              {/* Mobilization Card */}
              <div>
                <MobilizationCard
                  chamber={chamber}
                  districtNumber={districtNumber}
                  compact
                />
              </div>

              {/* Resource Optimizer */}
              <div>
                <ResourceOptimizer
                  chamber={chamber}
                  districtNumber={districtNumber}
                  compact
                />
              </div>

              {/* Early Vote Tracker */}
              <div>
                <EarlyVoteTracker
                  chamber={chamber}
                  districtNumber={districtNumber}
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        {/* Data freshness indicator */}
        <footer className="text-center pt-4">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Data last updated:{' '}
            {candidatesData?.lastUpdated
              ? new Date(candidatesData.lastUpdated).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'Unknown'}
          </p>
        </footer>
      </main>
    </div>
  );
}

// Loading skeleton
function LoadingState() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="skeleton skeleton-shimmer h-4 w-24 mx-auto rounded" />
        <div className="skeleton skeleton-shimmer h-10 w-48 mx-auto rounded" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-shimmer h-32 rounded-xl" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton skeleton-shimmer h-64 rounded-xl" />
        <div className="skeleton skeleton-shimmer h-64 rounded-xl" />
      </div>

      <div className="skeleton skeleton-shimmer h-48 rounded-xl" />
    </div>
  );
}

// Error state
function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ background: 'var(--color-at-risk-bg)' }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--color-at-risk)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2
        className="text-xl font-bold font-display mb-2"
        style={{ color: 'var(--text-color)' }}
      >
        Error Loading Data
      </h2>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
      <Link href="/sc">
        <Button variant="primary">Return to Map</Button>
      </Link>
    </div>
  );
}

// Not found state
function NotFoundState({
  chamber,
  district,
}: {
  chamber: string | undefined;
  district: string | undefined;
}) {
  return (
    <div className="text-center py-12">
      <div
        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
        style={{ background: 'var(--class-purple-bg)' }}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--class-purple)' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2
        className="text-xl font-bold font-display mb-2"
        style={{ color: 'var(--text-color)' }}
      >
        District Not Found
      </h2>
      <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
        {chamber && district
          ? `${chamber.charAt(0).toUpperCase() + chamber.slice(1)} District ${district} does not exist.`
          : 'The requested district could not be found.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/sc">
          <Button variant="primary">View Map</Button>
        </Link>
        <Link href="/sc/opportunities">
          <Button variant="secondary">Browse Opportunities</Button>
        </Link>
      </div>
    </div>
  );
}
