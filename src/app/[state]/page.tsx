'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import NavigableDistrictMap from '@/components/Map/NavigableDistrictMap';
import Legend from '@/components/Map/Legend';
import ChamberToggle from '@/components/Map/ChamberToggle';
import ShareButton from '@/components/Map/ShareButton';
import ZoomLevelContent, { useZoomLevel, ZOOM_THRESHOLDS } from '@/components/Map/ZoomLevelContent';
import SidePanel from '@/components/Dashboard/SidePanel';
import SearchBar from '@/components/Search/SearchBar';
import AddressSearch from '@/components/Search/AddressSearch';
import FilterPanel, { FilterState, defaultFilters } from '@/components/Search/FilterPanel';
import KeyboardShortcutsHelp from '@/components/Search/KeyboardShortcutsHelp';
import MobileDistrictSheet from '@/components/Map/MobileDistrictSheet';
import ScreenshotButton from '@/components/Export/ScreenshotButton';
import { DataFreshnessBadge } from '@/components/ui';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/components/Toast';
import { KPICardSkeleton, MapSkeleton, CandidateCardSkeleton } from '@/components/Skeleton';
import { useStateContext } from '@/context/StateContext';
import { useMapState } from '@/hooks/useMapState';
import { useLens } from '@/hooks/useLens';
import { LensToggleBar, getLensKpis } from '@/components/Lens';
// Note: BASE_PATH not needed - data fetching uses window.location detection, navigation uses Next.js auto basePath
import { getDistrictCenter } from '@/lib/districtLookup';
import type { CandidatesData, ElectionsData, SearchResult } from '@/types/schema';
import type { OpportunityData } from '@/lib/districtColors';

export default function StateDashboard() {
  const { stateConfig, stateCode, isDemo } = useStateContext();

  const [chamber, setChamber] = useState<'house' | 'senate'>('house');
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [electionsData, setElectionsData] = useState<ElectionsData | null>(null);
  const [opportunityData, setOpportunityData] = useState<Record<string, OpportunityData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Lens state with URL sync
  const { activeLens, setLens, isTransitioning } = useLens();

  // Map state with URL sync for deep-linking
  const { mapState, setMapState } = useMapState({ debounceMs: 300 });
  const currentZoom = mapState.zoom;
  const zoomLevel = useZoomLevel(currentZoom);

  const prevFiltersRef = useRef<FilterState>(defaultFilters);

  // Get district counts from state config
  const houseCount = stateConfig.chambers.house.count;
  const senateCount = stateConfig.chambers.senate.count;
  const districtCount = chamber === 'house' ? houseCount : senateCount;

  // Load candidates, elections, and opportunity data
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

    const opportunityPath = stateCode === 'SC'
      ? `${basePath}/data/opportunity.json`
      : `${basePath}/data/states/${stateCode.toLowerCase()}/opportunity.json`;

    Promise.all([
      fetch(`${candidatesPath}?${cacheBuster}`).then((res) => res.json()),
      fetch(`${electionsPath}?${cacheBuster}`).then((res) => res.json()),
      fetch(`${opportunityPath}?${cacheBuster}`).then((res) => res.json()).catch(() => ({})),
    ])
      .then(([candidates, elections, opportunity]) => {
        setCandidatesData(candidates);
        setElectionsData(elections);
        // Opportunity data may have nested chamber structure
        setOpportunityData(opportunity);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load election data:', err);
        setIsLoading(false);
      });
  }, [stateCode]);

  // Parse URL state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlChamber = params.get('chamber');
    const urlDistrict = params.get('district');
    const urlParty = params.get('party');
    const urlHasCandidate = params.get('hasCandidate');
    const urlContested = params.get('contested');
    const urlOpportunity = params.get('opportunity');
    const urlShowRepublican = params.get('showRepublican');
    const urlRepublicanMode = params.get('republicanMode');

    if (urlChamber === 'senate') setChamber('senate');
    if (urlDistrict) setSelectedDistrict(parseInt(urlDistrict, 10));

    const parsedFilters: FilterState = {
      party: urlParty ? urlParty.split(',').filter(Boolean) : [],
      hasCandidate: (urlHasCandidate === 'yes' || urlHasCandidate === 'no') ? urlHasCandidate : 'all',
      contested: (urlContested === 'yes' || urlContested === 'no') ? urlContested : 'all',
      opportunity: urlOpportunity ? urlOpportunity.split(',').filter(Boolean) : [],
      showRepublicanData: urlShowRepublican === 'true',
      republicanDataMode: (urlRepublicanMode === 'incumbents' || urlRepublicanMode === 'challengers' || urlRepublicanMode === 'all')
        ? urlRepublicanMode
        : 'none',
    };
    if (urlParty || urlHasCandidate || urlContested || urlOpportunity || urlShowRepublican || urlRepublicanMode) {
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
    if (filters.opportunity.length > 0) params.set('opportunity', filters.opportunity.join(','));
    if (filters.showRepublicanData) params.set('showRepublican', 'true');
    if (filters.republicanDataMode !== 'none') params.set('republicanMode', filters.republicanDataMode);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [chamber, selectedDistrict, filters]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  useEffect(() => {
    setSelectedDistrict(null);
  }, [chamber]);

  // Toast notifications for filter changes
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

    if (
      prev.party.join(',') !== filters.party.join(',') ||
      prev.hasCandidate !== filters.hasCandidate ||
      prev.contested !== filters.contested
    ) {
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

  // Handle search result selection with zoom
  const handleSearchSelect = useCallback(async (result: SearchResult) => {
    // Change chamber if needed
    if (result.chamber !== chamber) {
      setChamber(result.chamber);
    }

    // Set selected district
    setSelectedDistrict(result.districtNumber);

    // Zoom to district center (only for SC for now)
    if (stateCode === 'SC') {
      try {
        const center = await getDistrictCenter(result.chamber, result.districtNumber);
        if (center.success && center.lat && center.lng) {
          setMapState({
            lat: center.lat,
            lng: center.lng,
            zoom: 10, // Zoom in to district level
            district: result.districtNumber,
          });
        }
      } catch {
        // Fallback: just select without zoom
        console.debug('Could not zoom to district center');
      }
    }
  }, [chamber, stateCode, setMapState]);

  // Handle address search district selection
  const handleAddressDistrictFound = useCallback(async (districtNumber: number, foundChamber: 'house' | 'senate') => {
    // Change chamber if needed
    if (foundChamber !== chamber) {
      setChamber(foundChamber);
    }

    // Set selected district
    setSelectedDistrict(districtNumber);

    // Show success toast
    showToast(`Found ${foundChamber === 'house' ? 'House' : 'Senate'} District ${districtNumber}`, 'success');

    // Zoom to district center (only for SC for now)
    if (stateCode === 'SC') {
      try {
        const center = await getDistrictCenter(foundChamber, districtNumber);
        if (center.success && center.lat && center.lng) {
          setMapState({
            lat: center.lat,
            lng: center.lng,
            zoom: 10,
            district: districtNumber,
          });
        }
      } catch {
        console.debug('Could not zoom to district center');
      }
    }
  }, [chamber, stateCode, setMapState, showToast]);

  // Mobile sheet handlers
  const handleMobileDistrictSelect = useCallback((districtNumber: number) => {
    setSelectedDistrict(districtNumber);
    // On mobile, show the bottom sheet instead of relying on side panel
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowMobileSheet(true);
    }
  }, []);

  const handleMobileSheetViewDetails = useCallback(() => {
    setShowMobileSheet(false);
    // Scroll to side panel on mobile, or let it be visible
  }, []);

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

  // Filter districts
  const filteredDistricts = useMemo(() => {
    if (!candidatesData) return new Set<number>();

    const districts = candidatesData[chamber];
    const elections = electionsData?.[chamber] || {};
    const filtered = new Set<number>();

    for (const [districtNum, district] of Object.entries(districts)) {
      const num = parseInt(districtNum, 10);
      const hasCandidates = district.candidates.length > 0;
      const hasDem = district.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
      const hasRep = district.candidates.some((c) => c.party?.toLowerCase() === 'republican');
      const isDemIncumbent = district.incumbent?.party === 'Democratic';

      if (filters.hasCandidate === 'yes' && !hasCandidates) continue;
      if (filters.hasCandidate === 'no' && hasCandidates) continue;

      if (hasCandidates) {
        const isContested = hasDem && hasRep;
        if (filters.contested === 'yes' && !isContested) continue;
        if (filters.contested === 'no' && isContested) continue;
      }

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

      if (filters.opportunity.length > 0) {
        const electionHistory = elections[districtNum];
        const lastElection = electionHistory?.elections?.['2024']
          || electionHistory?.elections?.['2022']
          || electionHistory?.elections?.['2020'];
        const margin = lastElection?.margin ?? 100;

        const matchesFilter = filters.opportunity.some((filterOpp) => {
          switch (filterOpp) {
            case 'needsCandidate':
              return !hasDem && !isDemIncumbent && margin <= 15;
            case 'DEFENSIVE':
              return isDemIncumbent;
            case 'HIGH_OPPORTUNITY':
            case 'EMERGING':
              return hasDem && !isDemIncumbent;
            default:
              return false;
          }
        });
        if (!matchesFilter) continue;
      }

      filtered.add(num);
    }

    return filtered;
  }, [candidatesData, electionsData, chamber, filters]);

  const selectedDistrictData = selectedDistrict && candidatesData
    ? candidatesData[chamber][String(selectedDistrict)]
    : null;

  const selectedDistrictElections = selectedDistrict && electionsData
    ? electionsData[chamber][String(selectedDistrict)]
    : null;

  // Get chamber-specific opportunity data
  const chamberOpportunityData = useMemo((): Record<string, OpportunityData> | undefined => {
    if (!opportunityData) return undefined;
    // Opportunity data may be nested by chamber or flat
    const chamberData = (opportunityData as Record<string, unknown>)[chamber];
    if (chamberData && typeof chamberData === 'object' && !('score' in chamberData)) {
      return chamberData as unknown as Record<string, OpportunityData>;
    }
    return opportunityData as unknown as Record<string, OpportunityData>;
  }, [opportunityData, chamber]);

  // Calculate lens-aware KPIs
  const lensKpis = useMemo(() => {
    if (!candidatesData) return [];
    const districts = Object.values(candidatesData[chamber]);
    return getLensKpis(activeLens, districts, chamberOpportunityData);
  }, [candidatesData, chamber, activeLens, chamberOpportunityData]);

  // Calculate objective stats
  const objectiveStats = useMemo(() => {
    if (!candidatesData || !electionsData) return null;
    const districts = candidatesData[chamber];
    const elections = electionsData[chamber];

    let demFiled = 0;
    let demIncumbents = 0;
    let contested = 0;
    let closeOpportunities = 0;
    const totalDistricts = Object.keys(districts).length;

    for (const [districtNum, district] of Object.entries(districts)) {
      const hasDem = district.candidates.some(c => c.party?.toLowerCase() === 'democratic');
      const hasRep = district.candidates.some(c => c.party?.toLowerCase() === 'republican');
      const isDemIncumbent = district.incumbent?.party === 'Democratic';

      if (hasDem || isDemIncumbent) demFiled++;
      if (isDemIncumbent) demIncumbents++;
      if (hasDem && hasRep) contested++;

      if (!hasDem && !isDemIncumbent) {
        const electionHistory = elections[districtNum];
        const lastElection = electionHistory?.elections?.['2024']
          || electionHistory?.elections?.['2022']
          || electionHistory?.elections?.['2020'];
        if (lastElection && lastElection.margin <= 15) {
          closeOpportunities++;
        }
      }
    }

    return { demFiled, demIncumbents, contested, closeOpportunities, totalDistricts };
  }, [candidatesData, electionsData, chamber]);

  // Note: Don't include BASE_PATH - Next.js Link automatically handles basePath
  const stateUrl = (path: string) => `/${stateCode.toLowerCase()}${path}`;

  if (isLoading) {
    return (
      <div className="atmospheric-bg min-h-screen flex flex-col">
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

        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="flex-1 flex flex-col p-4">
            <div className="mb-4 animate-entrance stagger-2">
              <KPICardSkeleton count={4} />
            </div>
            <div className="flex-1 glass-surface rounded-xl overflow-hidden animate-entrance stagger-3" style={{ minHeight: '400px' }}>
              <MapSkeleton />
            </div>
          </div>

          <aside className="w-full lg:w-[380px] glass-surface border-t lg:border-l lg:border-t-0 animate-entrance stagger-5" style={{ borderColor: 'var(--class-purple-light)' }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
                <div className="skeleton-base skeleton-shimmer h-6 w-40 rounded mb-2" />
                <div className="skeleton-base skeleton-shimmer h-4 w-28 rounded" />
              </div>
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
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: 'var(--color-at-risk-bg)' }}>
            <svg className="w-6 h-6" fill="none" stroke="var(--color-at-risk)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: 'var(--color-at-risk)' }}>
            {isDemo('candidates') ? 'Demo data not yet available for ' + stateConfig.name : 'Failed to load election data'}
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {isDemo('candidates') ? 'Check back soon!' : 'Please refresh the page to try again.'}
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: 'var(--class-purple)',
              color: 'white',
            }}
          >
            Back to State Selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      <a
        href="#map-container"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
        style={{ background: 'var(--class-purple)', color: 'white' }}
      >
        Skip to map
      </a>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {selectedDistrict
          ? `Selected ${chamber === 'house' ? stateConfig.chambers.house.name : stateConfig.chambers.senate.name} District ${selectedDistrict}`
          : hoveredDistrict
          ? `Hovering over District ${hoveredDistrict}`
          : ''}
      </div>

      <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Header */}
      <header className="glass-surface border-b animate-entrance stagger-1 sticky top-0 z-40" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--class-purple)' }}>
                      All States
                    </Link>
                    <span style={{ color: 'var(--text-muted)' }}>/</span>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
                        {stateConfig.name} 2026
                      </h1>
                      {candidatesData?.lastUpdated && (
                        <DataFreshnessBadge lastUpdated={candidatesData.lastUpdated} />
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Tracking {chamber === 'house' ? `${houseCount} ${stateConfig.chambers.house.name}` : `${senateCount} ${stateConfig.chambers.senate.name}`} districts
                    {filteredDistricts.size < districtCount && (
                      <span> - Showing {filteredDistricts.size} of {districtCount}</span>
                    )}
                    {isDemo('candidates') && (
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        Demo Data
                      </span>
                    )}
                  </p>
                </div>

                <div className="hidden sm:block">
                  <SearchBar
                    candidatesData={candidatesData}
                    onSelectResult={handleSearchSelect}
                    className="w-64"
                  />
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Link
                  href={stateUrl(`/table?chamber=${chamber}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-70 focus-ring"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--class-purple-light)',
                    color: 'var(--text-color)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Table</span>
                </Link>
                <Link
                  href={stateUrl('/opportunities')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-70 focus-ring"
                  style={{
                    background: 'var(--card-bg)',
                    border: '1px solid var(--class-purple-light)',
                    color: 'var(--text-color)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>Opportunities</span>
                </Link>
                <Link
                  href="/voter-guide"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-70 focus-ring"
                  style={{
                    background: 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)',
                    color: 'var(--class-purple)',
                    border: '1px solid var(--class-purple-light)',
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Voter Guide</span>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <ChamberToggle chamber={chamber} onChange={setChamber} />
                <ShareButton
                  mapState={{
                    chamber,
                    district: selectedDistrict ?? undefined,
                    zoom: mapState.zoom,
                    lat: mapState.lat,
                    lng: mapState.lng,
                  }}
                  options={{
                    title: `${stateConfig.name} Election Map`,
                    text: selectedDistrict
                      ? `View ${chamber === 'house' ? stateConfig.chambers.house.name : stateConfig.chambers.senate.name} District ${selectedDistrict}`
                      : `View the ${stateConfig.name} Election Map`,
                  }}
                  size="sm"
                />
                <button
                  type="button"
                  onClick={() => setShowShortcuts(true)}
                  className="p-2 rounded-lg border transition-all hover:opacity-70"
                  style={{
                    background: 'var(--card-bg)',
                    borderColor: 'var(--class-purple-light)',
                    color: 'var(--text-muted)',
                  }}
                  aria-label="Show keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="sm:hidden">
              <SearchBar
                candidatesData={candidatesData}
                onSelectResult={handleSearchSelect}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="border-b animate-entrance stagger-2" style={{ background: '#FAFAFA', borderColor: '#E2E8F0' }}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <FilterPanel filters={filters} onFilterChange={setFilters} variant="horizontal" />
        </div>
      </div>

      {/* Lens Toggle Bar */}
      <div className="border-b animate-entrance stagger-2" style={{ background: '#FAFAFA', borderColor: '#E2E8F0' }}>
        <div className="max-w-7xl mx-auto px-4 py-2">
          <LensToggleBar activeLens={activeLens} onLensChange={setLens} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col p-4">
          {lensKpis.length > 0 && (
            <ZoomLevelContent
              currentZoom={currentZoom}
              className="mb-4 animate-entrance stagger-2"
              stateViewContent={
                /* State level (zoom <= 8): Full 4-column KPI grid - lens-aware */
                <div className="kpi-grid">
                  {lensKpis.map((kpi, index) => (
                    <div
                      key={kpi.label}
                      className="kpi-card animate-entrance"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="label" style={{ color: kpi.color || 'var(--text-muted)' }}>
                        {kpi.label}
                      </div>
                      <div className="value font-display" style={{ color: kpi.color || 'var(--text-color)' }}>
                        {kpi.value}
                      </div>
                      {kpi.description && (
                        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          {kpi.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              }
              regionViewContent={
                /* Region level (8 < zoom <= 10): Simplified 2-column KPI - first 2 lens KPIs */
                <div className="grid grid-cols-2 gap-3">
                  {lensKpis.slice(0, 2).map((kpi) => (
                    <div key={kpi.label} className="kpi-card">
                      <div className="label" style={{ color: kpi.color || 'var(--text-muted)' }}>
                        {kpi.label}
                      </div>
                      <div className="value font-display text-lg" style={{ color: kpi.color || 'var(--text-color)' }}>
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>
              }
              districtViewContent={
                /* District level (zoom > 10): Selected district mini-summary */
                selectedDistrictData ? (
                  <div className="glass-surface rounded-lg p-3 border" style={{ borderColor: 'var(--class-purple-light)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          {chamber === 'house' ? stateConfig.chambers.house.name : stateConfig.chambers.senate.name}
                        </span>
                        <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
                          District {selectedDistrict}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Candidates</span>
                        <div className="font-display font-bold text-lg" style={{ color: 'var(--class-purple)' }}>
                          {selectedDistrictData.candidates.length}
                        </div>
                      </div>
                    </div>
                    {selectedDistrictData.incumbent && (
                      <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                        Incumbent: {selectedDistrictData.incumbent.name} ({selectedDistrictData.incumbent.party})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-surface rounded-lg p-3 border text-center" style={{ borderColor: 'var(--class-purple-light)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Click a district to view details
                    </span>
                  </div>
                )
              }
            />
          )}

          <div
            ref={mapContainerRef}
            id="map-container"
            className={`flex-1 map-container min-h-[400px] animate-entrance stagger-3 relative ${isTransitioning ? 'lens-transitioning' : ''}`}
            role="region"
            aria-label="Interactive district map - double-click a district to view details"
          >
            {/* Map Controls Overlay */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddressSearch(!showAddressSearch)}
                className="screenshot-button"
                aria-label="Find my district"
                aria-expanded={showAddressSearch}
                title="Find my district by address"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18" height="18">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="screenshot-text">Find District</span>
              </button>
              <ScreenshotButton
                targetRef={mapContainerRef}
                filename="sc-election-map"
                chamber={chamber}
                stateCode={stateCode}
                showMenu={true}
              />
            </div>

            {/* Address Search Panel (collapsible) */}
            {showAddressSearch && (
              <div className="absolute top-14 right-3 z-10 w-80 max-w-[calc(100vw-24px)] animate-entrance">
                <AddressSearch
                  chamber={chamber}
                  onDistrictFound={handleAddressDistrictFound}
                  placeholder={`Enter SC address to find your district`}
                />
              </div>
            )}

            <div className="map-svg-wrapper h-full">
              <NavigableDistrictMap
                stateCode={stateCode}
                chamber={chamber}
                candidatesData={candidatesData}
                electionsData={electionsData}
                selectedDistrict={selectedDistrict}
                onDistrictSelect={handleMobileDistrictSelect}
                onDistrictHover={setHoveredDistrict}
                filteredDistricts={filteredDistricts}
                enableNavigation={true}
                showChamberToggle={false}
                showModeToggle={true}
                activeLens={activeLens}
                opportunityData={chamberOpportunityData}
              />
            </div>
            <Legend activeLens={activeLens} />
          </div>

          {hoveredDistrict && (
            <div
              className="fixed bottom-4 left-4 glass-surface rounded-lg p-3 animate-tooltip-in shadow-lg"
              style={{ borderColor: 'var(--class-purple-light)' }}
            >
              <span className="font-medium font-display" style={{ color: 'var(--text-color)' }}>
                {chamber === 'house' ? stateConfig.chambers.house.name : stateConfig.chambers.senate.name} District {hoveredDistrict}
              </span>
            </div>
          )}
        </div>

        <div
          className="w-full lg:w-96 glass-surface border-l animate-entrance stagger-5"
          style={{ borderColor: 'var(--class-purple-light)' }}
        >
          <SidePanel
            chamber={chamber}
            district={selectedDistrictData}
            electionHistory={selectedDistrictElections}
            onClose={() => setSelectedDistrict(null)}
            showRepublicanData={filters.showRepublicanData}
            republicanDataMode={filters.republicanDataMode}
            filters={filters}
          />
        </div>
      </div>

      {/* Mobile Bottom Sheet for district details */}
      <MobileDistrictSheet
        isOpen={showMobileSheet}
        onClose={() => setShowMobileSheet(false)}
        district={selectedDistrictData}
        chamber={chamber}
        chamberName={chamber === 'house' ? stateConfig.chambers.house.name : stateConfig.chambers.senate.name}
        electionHistory={selectedDistrictElections}
        opportunityData={selectedDistrict && chamberOpportunityData ? chamberOpportunityData[String(selectedDistrict)] : undefined}
        activeLens={activeLens}
        onViewDetails={handleMobileSheetViewDetails}
      />

      {/* Footer */}
      <footer
        className="glass-surface border-t py-4 px-4 animate-entrance stagger-6"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-7xl mx-auto text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {candidatesData.lastUpdated && (
            <p>
              Data updated: {new Date(candidatesData.lastUpdated).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {isDemo('candidates') && <span className="ml-2">(Demo Data)</span>}
            </p>
          )}
          {stateConfig.urls.electionCommission && (
            <p className="mt-1">
              Source:{' '}
              <a
                href={stateConfig.urls.electionCommission}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: 'var(--class-purple)' }}
              >
                {stateConfig.name} Election Commission
              </a>
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}
