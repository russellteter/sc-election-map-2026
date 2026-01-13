'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DistrictMap from '@/components/Map/DistrictMap';
import Legend from '@/components/Map/Legend';
import ChamberToggle from '@/components/Map/ChamberToggle';
import SidePanel from '@/components/Dashboard/SidePanel';
import SearchBar from '@/components/Search/SearchBar';
import FilterPanel, { FilterState, defaultFilters } from '@/components/Search/FilterPanel';
import KeyboardShortcutsHelp from '@/components/Search/KeyboardShortcutsHelp';
import { KPICard } from '@/components/Dashboard/KPICard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/components/Toast';
import { KPICardSkeleton, MapSkeleton, CandidateCardSkeleton } from '@/components/Skeleton';
import type { CandidatesData, ChamberStats, ElectionsData } from '@/types/schema';

export default function Home() {
  const [chamber, setChamber] = useState<'house' | 'senate'>('house');
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [electionsData, setElectionsData] = useState<ElectionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Track previous filter state for toast notifications
  const prevFiltersRef = useRef<FilterState>(defaultFilters);

  // Load candidates and elections data
  useEffect(() => {
    // Use relative path from current page
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    // Load both data files in parallel with cache-busting
    const cacheBuster = `v=${Date.now()}`;
    Promise.all([
      fetch(`${basePath}/data/candidates.json?${cacheBuster}`).then((res) => res.json()),
      fetch(`${basePath}/data/elections.json?${cacheBuster}`).then((res) => res.json()),
    ])
      .then(([candidates, elections]) => {
        setCandidatesData(candidates);
        setElectionsData(elections);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load election data:', err);
        setIsLoading(false);
      });
  }, []);

  // Parse URL state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlChamber = params.get('chamber');
    const urlDistrict = params.get('district');
    const urlParty = params.get('party');
    const urlHasCandidate = params.get('hasCandidate');
    const urlContested = params.get('contested');

    if (urlChamber === 'senate') setChamber('senate');
    if (urlDistrict) setSelectedDistrict(parseInt(urlDistrict, 10));

    const parsedFilters: FilterState = {
      party: urlParty ? urlParty.split(',').filter(Boolean) : [],
      hasCandidate: (urlHasCandidate === 'yes' || urlHasCandidate === 'no') ? urlHasCandidate : 'all',
      contested: (urlContested === 'yes' || urlContested === 'no') ? urlContested : 'all',
    };
    if (urlParty || urlHasCandidate || urlContested) {
      setFilters(parsedFilters);
    }
  }, []);

  // Update URL when state changes
  const updateUrl = useCallback(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    params.set('chamber', chamber);
    if (selectedDistrict !== null) params.set('district', String(selectedDistrict));
    if (filters.party.length > 0) params.set('party', filters.party.join(','));
    if (filters.hasCandidate !== 'all') params.set('hasCandidate', filters.hasCandidate);
    if (filters.contested !== 'all') params.set('contested', filters.contested);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [chamber, selectedDistrict, filters]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  // Clear selection when chamber changes
  useEffect(() => {
    setSelectedDistrict(null);
  }, [chamber]);

  // Show toast notification when filters change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    const hasActiveFilters =
      filters.party.length > 0 ||
      filters.hasCandidate !== 'all' ||
      filters.contested !== 'all';
    const hadActiveFilters =
      prev.party.length > 0 ||
      prev.hasCandidate !== 'all' ||
      prev.contested !== 'all';

    // Only show toast if filters actually changed (not on initial mount)
    if (
      prev.party.join(',') !== filters.party.join(',') ||
      prev.hasCandidate !== filters.hasCandidate ||
      prev.contested !== filters.contested
    ) {
      // Skip toast on initial URL parsing
      if (hadActiveFilters || hasActiveFilters) {
        if (!hasActiveFilters && hadActiveFilters) {
          showToast('Filters cleared', 'info', 2500);
        } else if (hasActiveFilters) {
          const filterCount = [
            filters.party.length > 0 ? 1 : 0,
            filters.hasCandidate !== 'all' ? 1 : 0,
            filters.contested !== 'all' ? 1 : 0,
          ].reduce((a, b) => a + b, 0);
          showToast(`${filterCount} filter${filterCount > 1 ? 's' : ''} applied`, 'success', 2500);
        }
      }
    }

    prevFiltersRef.current = filters;
  }, [filters, showToast]);

  // Get total district count for navigation
  const districtCount = useMemo(() => {
    return chamber === 'house' ? 124 : 46;
  }, [chamber]);

  // Keyboard shortcuts
  const handleNextDistrict = useCallback(() => {
    setSelectedDistrict((prev) => {
      if (prev === null) return 1;
      return prev < districtCount ? prev + 1 : 1;
    });
  }, [districtCount]);

  const handlePrevDistrict = useCallback(() => {
    setSelectedDistrict((prev) => {
      if (prev === null) return districtCount;
      return prev > 1 ? prev - 1 : districtCount;
    });
  }, [districtCount]);

  useKeyboardShortcuts({
    onToggleChamber: () => setChamber((c) => (c === 'house' ? 'senate' : 'house')),
    onFocusSearch: () => {
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.focus();
    },
    onClearSelection: () => {
      setSelectedDistrict(null);
      setShowShortcuts(false);
    },
    onNextDistrict: handleNextDistrict,
    onPrevDistrict: handlePrevDistrict,
    onToggleHelp: () => setShowShortcuts((prev) => !prev),
    enabled: !showShortcuts,
  });

  // Filter districts based on current filters
  const filteredDistricts = useMemo(() => {
    if (!candidatesData) return new Set<number>();

    const districts = candidatesData[chamber];
    const filtered = new Set<number>();

    for (const [districtNum, district] of Object.entries(districts)) {
      const num = parseInt(districtNum, 10);
      const hasCandidates = district.candidates.length > 0;

      // Check hasCandidate filter
      if (filters.hasCandidate === 'yes' && !hasCandidates) continue;
      if (filters.hasCandidate === 'no' && hasCandidates) continue;

      // Check contested filter (both parties running)
      if (hasCandidates) {
        const hasDem = district.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
        const hasRep = district.candidates.some((c) => c.party?.toLowerCase() === 'republican');
        const isContested = hasDem && hasRep;

        if (filters.contested === 'yes' && !isContested) continue;
        if (filters.contested === 'no' && isContested) continue;
      }

      // Check party filter
      if (filters.party.length > 0 && hasCandidates) {
        const matchesParty = filters.party.some((filterParty) => {
          if (filterParty === 'unknown') {
            return district.candidates.some((c) => !c.party);
          }
          return district.candidates.some(
            (c) => c.party?.toLowerCase() === filterParty.toLowerCase()
          );
        });
        if (!matchesParty) continue;
      }

      filtered.add(num);
    }

    return filtered;
  }, [candidatesData, chamber, filters]);

  const selectedDistrictData = selectedDistrict && candidatesData
    ? candidatesData[chamber][String(selectedDistrict)]
    : null;

  const selectedDistrictElections = selectedDistrict && electionsData
    ? electionsData[chamber][String(selectedDistrict)]
    : null;

  // Calculate statistics
  const stats = candidatesData ? calculateStats(candidatesData, chamber) : null;

  if (isLoading) {
    return (
      <div className="atmospheric-bg min-h-screen flex flex-col">
        {/* Skeleton header */}
        <header className="glass-surface border-b animate-entrance" style={{ borderColor: 'var(--class-purple-light)' }}>
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="skeleton-base skeleton-shimmer h-8 w-48 rounded-md" />
                <div className="skeleton-base skeleton-shimmer h-10 w-28 rounded-lg" />
              </div>
              <div className="flex items-center gap-3">
                <div className="skeleton-base skeleton-shimmer h-10 flex-1 max-w-md rounded-lg" />
                <div className="skeleton-base skeleton-shimmer h-10 w-10 rounded-lg" />
              </div>
            </div>
          </div>
        </header>

        {/* Skeleton main content */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Map section skeleton */}
          <div className="flex-1 flex flex-col p-4">
            {/* KPI skeleton */}
            <div className="mb-4 animate-entrance stagger-2">
              <KPICardSkeleton count={4} />
            </div>

            {/* Map skeleton */}
            <div
              className="flex-1 glass-surface rounded-xl overflow-hidden animate-entrance stagger-3"
              style={{ minHeight: '400px' }}
            >
              <MapSkeleton />
            </div>

            {/* Legend skeleton */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 animate-entrance stagger-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="skeleton-base skeleton-shimmer w-4 h-4 rounded-sm" />
                  <div className="skeleton-base skeleton-shimmer h-3 w-20 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Side panel skeleton */}
          <aside
            className="w-full lg:w-[380px] glass-surface border-t lg:border-l lg:border-t-0 animate-entrance stagger-5"
            style={{ borderColor: 'var(--class-purple-light)' }}
          >
            <div className="h-full flex flex-col">
              {/* Panel header skeleton */}
              <div className="p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
                <div className="skeleton-base skeleton-shimmer h-6 w-40 rounded mb-2" />
                <div className="skeleton-base skeleton-shimmer h-4 w-28 rounded" />
              </div>

              {/* Candidates skeleton */}
              <div className="flex-1 p-4">
                <CandidateCardSkeleton count={2} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (!candidatesData) {
    return (
      <div className="atmospheric-bg min-h-screen flex items-center justify-center">
        <div className="text-center glass-surface rounded-xl p-8 animate-entrance">
          <div
            className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full"
            style={{ background: 'var(--color-at-risk-bg)' }}
          >
            <svg className="w-6 h-6" fill="none" stroke="var(--color-at-risk)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: 'var(--color-at-risk)' }}>
            Failed to load election data
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Please refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      {/* Skip link for keyboard users */}
      <a
        href="#map-container"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
        style={{ background: 'var(--class-purple)', color: 'white' }}
      >
        Skip to map
      </a>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {selectedDistrict
          ? `Selected ${chamber === 'house' ? 'House' : 'Senate'} District ${selectedDistrict}`
          : hoveredDistrict
          ? `Hovering over ${chamber === 'house' ? 'House' : 'Senate'} District ${hoveredDistrict}`
          : ''}
      </div>

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Header - Glassmorphic */}
      <header className="glass-surface border-b animate-entrance stagger-1" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4">
            {/* Top row: Title and Chamber toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
                  SC 2026 Election Map
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  Tracking {chamber === 'house' ? '124 House' : '46 Senate'} districts
                  {filteredDistricts.size < districtCount && (
                    <span> • Showing {filteredDistricts.size} of {districtCount}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ChamberToggle chamber={chamber} onChange={setChamber} />
                <button
                  type="button"
                  onClick={() => setShowShortcuts(true)}
                  className="p-2 rounded-lg border transition-all hover:opacity-70"
                  style={{
                    background: 'var(--card-bg, #FFFFFF)',
                    borderColor: 'var(--class-purple-light, #DAD7FA)',
                    color: 'var(--color-text-muted, #4A5568)',
                  }}
                  aria-label="Show keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bottom row: Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                candidatesData={candidatesData}
                onSelectResult={(result) => {
                  if (result.chamber !== chamber) {
                    setChamber(result.chamber);
                  }
                  setTimeout(() => setSelectedDistrict(result.districtNumber), 0);
                }}
                className="flex-1 max-w-md"
              />
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Active Filter Pills - Shows when filters are applied */}
      {(filters.party.length > 0 || filters.hasCandidate !== 'all' || filters.contested !== 'all') && (
        <div
          className="px-4 py-2 border-b animate-entrance"
          style={{
            background: 'linear-gradient(90deg, var(--class-purple-bg) 0%, rgba(255,255,255,0.95) 100%)',
            borderColor: 'var(--class-purple-light)',
          }}
        >
          <div className="max-w-[1800px] mx-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>
              Active filters:
            </span>

            {/* Party filters */}
            {filters.party.map((party) => (
              <button
                key={party}
                onClick={() => setFilters((prev) => ({
                  ...prev,
                  party: prev.party.filter((p) => p !== party),
                }))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 focus-ring"
                style={{
                  background: party === 'democratic'
                    ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
                    : party === 'republican'
                    ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
                    : 'linear-gradient(135deg, #FFFCF0 0%, #FEF8E0 100%)',
                  color: party === 'democratic'
                    ? 'var(--class-purple)'
                    : party === 'republican'
                    ? 'var(--color-at-risk)'
                    : '#92400E',
                  border: `1px solid ${
                    party === 'democratic'
                      ? 'rgba(71, 57, 231, 0.3)'
                      : party === 'republican'
                      ? 'rgba(220, 38, 38, 0.3)'
                      : 'rgba(217, 119, 6, 0.2)'
                  }`,
                }}
                aria-label={`Remove ${party} filter`}
              >
                {party === 'democratic' ? 'Democrat' : party === 'republican' ? 'Republican' : 'Unknown Party'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}

            {/* Has candidate filter */}
            {filters.hasCandidate !== 'all' && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, hasCandidate: 'all' }))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 focus-ring"
                style={{
                  background: 'linear-gradient(135deg, var(--class-purple-bg) 0%, #EDE9FE 100%)',
                  color: 'var(--class-purple)',
                  border: '1px solid rgba(71, 57, 231, 0.3)',
                }}
                aria-label="Remove candidate status filter"
              >
                {filters.hasCandidate === 'yes' ? 'Has Candidates' : 'No Candidates'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Contested filter */}
            {filters.contested !== 'all' && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, contested: 'all' }))}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 focus-ring"
                style={{
                  background: filters.contested === 'yes'
                    ? 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)'
                    : 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
                  color: filters.contested === 'yes' ? 'var(--color-excellent)' : '#6B7280',
                  border: `1px solid ${filters.contested === 'yes' ? 'rgba(5, 150, 105, 0.3)' : 'rgba(156, 163, 175, 0.3)'}`,
                }}
                aria-label="Remove contested filter"
              >
                {filters.contested === 'yes' ? 'Contested Only' : 'Uncontested Only'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Clear all filters */}
            <button
              onClick={() => setFilters(defaultFilters)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 focus-ring ml-auto"
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
              }}
              aria-label="Clear all filters"
            >
              Clear all
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map section */}
        <div className="flex-1 flex flex-col p-4">
          {/* Stats bar - Glassmorphic KPI Grid with Animated Counters */}
          {stats && (
            <div className="kpi-grid mb-4 animate-entrance stagger-2">
              <KPICard
                label="Democrats"
                value={stats.democrats}
                variant="democrat"
                showPulse
                animationDelay={0}
              />
              <KPICard
                label="Republicans"
                value={stats.republicans}
                variant="republican"
                showPulse
                animationDelay={50}
              />
              <KPICard
                label="Unknown Party"
                value={stats.unknown}
                variant="unknown"
                animationDelay={100}
              />
              <KPICard
                label="No Candidates"
                value={stats.empty}
                variant="empty"
                animationDelay={150}
              />
              <div className="kpi-card animate-entrance" style={{ animationDelay: '200ms' }}>
                <div className="label">Party Data</div>
                <div className="value font-display" style={{ color: 'var(--class-purple)' }}>{stats.enrichmentPercent}%</div>
                <div className="mt-2 w-full rounded-full h-1.5" style={{ background: 'var(--class-purple-light)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats.enrichmentPercent}%`,
                      background: stats.enrichmentPercent >= 70
                        ? 'var(--color-excellent)'
                        : stats.enrichmentPercent >= 40
                        ? 'var(--color-attention)'
                        : 'var(--color-at-risk)'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Map container - Glassmorphic */}
          <div
            id="map-container"
            className="flex-1 glass-surface rounded-lg p-4 min-h-[400px] animate-entrance stagger-3"
            role="region"
            aria-label="Interactive district map"
          >
            <DistrictMap
              chamber={chamber}
              candidatesData={candidatesData}
              selectedDistrict={selectedDistrict}
              onDistrictClick={setSelectedDistrict}
              onDistrictHover={setHoveredDistrict}
              filteredDistricts={filteredDistricts}
            />
          </div>

          {/* Legend - Glassmorphic */}
          <div className="glass-surface rounded-lg p-4 mt-4 animate-entrance stagger-4">
            <Legend />
          </div>

          {/* Hover info - Glassmorphic with enhanced styling */}
          {hoveredDistrict && (
            <div
              className="fixed bottom-4 left-4 glass-surface rounded-lg p-3 animate-tooltip-in shadow-lg"
              style={{ borderColor: 'var(--class-purple-light)' }}
            >
              <span className="font-medium font-display" style={{ color: 'var(--text-color)' }}>
                {chamber === 'house' ? 'House' : 'Senate'} District {hoveredDistrict}
              </span>
            </div>
          )}
        </div>

        {/* Side panel - Glassmorphic */}
        <div
          className="w-full lg:w-96 glass-surface border-l animate-entrance stagger-5"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <SidePanel
            chamber={chamber}
            district={selectedDistrictData}
            electionHistory={selectedDistrictElections}
            onClose={() => setSelectedDistrict(null)}
          />
        </div>
      </div>

      {/* Footer - Glassmorphic */}
      <footer
        className="glass-surface border-t py-4 px-4 animate-entrance stagger-6"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-7xl mx-auto text-center text-sm" style={{ color: 'var(--color-text-muted, #4A5568)' }}>
          <p>
            Data updated: {new Date(candidatesData.lastUpdated).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1">
            Source:{' '}
            <a
              href="https://ethicsfiling.sc.gov/public/campaign-reports/reports"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: 'var(--class-purple, #4739E7)' }}
            >
              SC Ethics Commission
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function calculateStats(data: CandidatesData, chamber: 'house' | 'senate') {
  let democrats = 0;
  let republicans = 0;
  let unknown = 0;
  let empty = 0;
  let totalCandidates = 0;
  let enrichedCandidates = 0;

  const districts = data[chamber];
  for (const district of Object.values(districts)) {
    if (district.candidates.length === 0) {
      empty++;
    } else {
      const hasDem = district.candidates.some(
        (c) => c.party?.toLowerCase() === 'democratic'
      );
      const hasRep = district.candidates.some(
        (c) => c.party?.toLowerCase() === 'republican'
      );

      if (hasDem) democrats++;
      if (hasRep) republicans++;
      if (!hasDem && !hasRep) unknown++;

      // Count individual candidates for enrichment stats
      for (const candidate of district.candidates) {
        totalCandidates++;
        if (candidate.party) {
          enrichedCandidates++;
        }
      }
    }
  }

  const enrichmentPercent = totalCandidates > 0
    ? Math.round((enrichedCandidates / totalCandidates) * 100)
    : 0;

  return { democrats, republicans, unknown, empty, totalCandidates, enrichedCandidates, enrichmentPercent };
}
