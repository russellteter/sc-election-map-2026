'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import { useStateContext } from '@/context/StateContext';
import { KPICardSkeleton, MapSkeleton, CandidateCardSkeleton } from '@/components/Skeleton';
import type { CandidatesData, ElectionsData } from '@/types/schema';

/**
 * Analytics Page - Unified Analytics Dashboard
 *
 * Route: /[state]/analytics
 *
 * Integrates 7 analytics features:
 * - Scenario Simulator
 * - Historical Comparison
 * - Recruitment Radar
 * - Resource Heatmap
 * - Demographics Overlay
 * - Cross-State Comparison
 * - Endorsement Network
 */
export default function AnalyticsPage() {
  const { stateConfig, stateCode, isDemo } = useStateContext();

  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [electionsData, setElectionsData] = useState<ElectionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load candidates and elections data
  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    const cacheBuster = `v=${Date.now()}`;

    // For SC, use existing data structure. For other states, use demo data structure
    const candidatesPath = stateCode === 'SC'
      ? `${basePath}/data/candidates.json`
      : `${basePath}/data/states/${stateCode.toLowerCase()}/candidates.json`;

    const electionsPath = stateCode === 'SC'
      ? `${basePath}/data/elections.json`
      : `${basePath}/data/states/${stateCode.toLowerCase()}/elections.json`;

    Promise.all([
      fetch(`${candidatesPath}?${cacheBuster}`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load candidates: ${res.status}`);
        return res.json();
      }),
      fetch(`${electionsPath}?${cacheBuster}`).then((res) => {
        if (!res.ok) throw new Error(`Failed to load elections: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([candidates, elections]) => {
        setCandidatesData(candidates);
        setElectionsData(elections);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load election data:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [stateCode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="atmospheric-bg min-h-screen flex flex-col">
        <header
          className="glass-surface border-b animate-entrance"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="skeleton-base skeleton-shimmer h-8 w-48 rounded-md" />
                  <div className="skeleton-base skeleton-shimmer h-10 w-28 rounded-lg" />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div
                    key={i}
                    className="skeleton-base skeleton-shimmer h-10 w-32 rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 glass-surface rounded-xl overflow-hidden animate-entrance stagger-3" style={{ minHeight: '400px' }}>
              <MapSkeleton />
            </div>
          </div>

          <aside
            className="w-full lg:w-[420px] glass-surface border-t lg:border-l lg:border-t-0 animate-entrance stagger-5"
            style={{ borderColor: 'var(--class-purple-light)' }}
          >
            <div className="p-4">
              <div className="space-y-4">
                <KPICardSkeleton count={3} />
                <CandidateCardSkeleton count={4} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !candidatesData) {
    return (
      <div className="atmospheric-bg min-h-screen flex items-center justify-center">
        <div className="text-center glass-surface rounded-xl p-8 animate-entrance max-w-md">
          <div
            className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ background: 'var(--color-at-risk-bg)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="var(--color-at-risk)" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="font-medium" style={{ color: 'var(--color-at-risk)' }}>
            {error || 'Failed to load analytics data'}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {isDemo('candidates')
              ? 'Demo data not yet available for ' + stateConfig.name
              : 'Please refresh the page to try again.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
            <Link
              href={`/${stateCode.toLowerCase()}`}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--class-purple)',
                color: 'white',
              }}
            >
              Back to Dashboard
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{
                borderColor: 'var(--class-purple-light)',
                color: 'var(--text-color)',
              }}
            >
              State Selection
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      <AnalyticsDashboard
        candidatesData={candidatesData}
        electionsData={electionsData}
        className="flex-1"
      />
    </div>
  );
}
