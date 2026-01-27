'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StrategicTable } from '@/components/Table';
import ChamberToggle from '@/components/Map/ChamberToggle';
import FilterPanel, { FilterState, defaultFilters } from '@/components/Search/FilterPanel';
import { useToast } from '@/components/Toast';
import { buildTableRows, exportToCSV, exportFilteredToCSV } from '@/lib/exportCSV';
import type {
  CandidatesData,
  ElectionsData,
  OpportunityData,
  Chamber,
} from '@/types/schema';
import type { StrategicTableRow } from '@/lib/exportCSV';

export default function TablePage() {
  const router = useRouter();
  const { showToast } = useToast();

  // State
  const [chamber, setChamber] = useState<Chamber>('house');
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [electionsData, setElectionsData] = useState<ElectionsData | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Load data
  useEffect(() => {
    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    const cacheBuster = `v=${Date.now()}`;
    Promise.all([
      fetch(`${basePath}/data/candidates.json?${cacheBuster}`).then((res) => res.json()),
      fetch(`${basePath}/data/elections.json?${cacheBuster}`).then((res) => res.json()),
      fetch(`${basePath}/data/opportunity.json?${cacheBuster}`).then((res) => res.json()),
    ])
      .then(([candidates, elections, opportunity]) => {
        setCandidatesData(candidates);
        setElectionsData(elections);
        setOpportunityData(opportunity);
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
    const urlOpportunity = params.get('opportunity');

    if (urlChamber === 'senate') setChamber('senate');

    if (urlOpportunity) {
      setFilters((prev) => ({
        ...prev,
        opportunity: urlOpportunity.split(',').filter(Boolean),
      }));
    }
  }, []);

  // Update URL when state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams();
    params.set('chamber', chamber);
    if (filters.opportunity.length > 0) {
      params.set('opportunity', filters.opportunity.join(','));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [chamber, filters]);

  // Build table rows from data
  const allRows = useMemo(() => {
    if (!candidatesData || !opportunityData || !electionsData) return [];
    return buildTableRows(candidatesData, opportunityData, electionsData, chamber);
  }, [candidatesData, opportunityData, electionsData, chamber]);

  // Apply filters to rows
  const filteredRows = useMemo(() => {
    let rows = allRows;

    // Filter by opportunity tier
    if (filters.opportunity.length > 0) {
      rows = rows.filter((row) => {
        // Check tier match
        const tierMatch = filters.opportunity.some((filterOpp) => {
          if (filterOpp === 'needsCandidate') {
            return row.needsCandidate;
          }
          return row.tier === filterOpp;
        });
        return tierMatch;
      });
    }

    // Filter by party
    if (filters.party.length > 0) {
      rows = rows.filter((row) => {
        return filters.party.some((party) => {
          if (party === 'Democratic') return row.hasDemocrat;
          if (party === 'Republican') return row.hasRepublican;
          if (party === 'unknown') return row.challenger && row.challengerParty === 'Unknown';
          return false;
        });
      });
    }

    // Filter by hasCandidate
    if (filters.hasCandidate === 'yes') {
      rows = rows.filter((row) => row.challenger !== '');
    } else if (filters.hasCandidate === 'no') {
      rows = rows.filter((row) => row.challenger === '');
    }

    // Filter by contested
    if (filters.contested === 'yes') {
      rows = rows.filter((row) => row.hasDemocrat && row.hasRepublican);
    } else if (filters.contested === 'no') {
      rows = rows.filter((row) => !(row.hasDemocrat && row.hasRepublican));
    }

    return rows;
  }, [allRows, filters]);

  // Tier stats
  const tierStats = useMemo(() => {
    const stats = {
      highOpportunity: 0,
      emerging: 0,
      defensive: 0,
      needsCandidate: 0,
    };

    for (const row of allRows) {
      if (row.tier === 'HIGH_OPPORTUNITY') stats.highOpportunity++;
      if (row.tier === 'EMERGING') stats.emerging++;
      if (row.tier === 'DEFENSIVE') stats.defensive++;
      if (row.needsCandidate) stats.needsCandidate++;
    }

    return stats;
  }, [allRows]);

  // Handle row click - navigate to map with district selected
  const handleRowClick = useCallback(
    (row: StrategicTableRow) => {
      router.push(`/sc?chamber=${row.chamber}&district=${row.districtNumber}`);
    },
    [router]
  );

  // Handle CSV export
  const handleExportCSV = useCallback(() => {
    if (filteredRows.length === 0) {
      showToast('No data to export', 'warning');
      return;
    }

    const chamberLabel = chamber === 'house' ? 'House' : 'Senate';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `sc-${chamberLabel.toLowerCase()}-strategic-${dateStr}.csv`;

    exportToCSV(filteredRows, filename);
    showToast(`Exported ${filteredRows.length} districts to CSV`, 'success');
  }, [filteredRows, chamber, showToast]);

  // Quick filter buttons
  const handleQuickFilter = useCallback((tier: string) => {
    setFilters((prev) => {
      const isActive = prev.opportunity.includes(tier);
      return {
        ...prev,
        opportunity: isActive
          ? prev.opportunity.filter((t) => t !== tier)
          : [...prev.opportunity, tier],
      };
    });
  }, []);

  return (
    <div className="atmospheric-bg min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="glass-surface border-b animate-entrance sticky top-0 z-40"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Row 1: Title + Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/sc"
                  className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: 'var(--class-purple)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Map
                </Link>
                <h1
                  className="text-xl font-bold font-display"
                  style={{ color: 'var(--text-color)' }}
                >
                  Strategic Table View
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <ChamberToggle chamber={chamber} onChange={setChamber} />
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'var(--class-purple)',
                    borderColor: 'var(--class-purple)',
                    color: 'white',
                  }}
                  aria-label="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Row 2: Quick Filters + Filter Panel */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Quick filter chips */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFilter('HIGH_OPPORTUNITY')}
                  className={`quick-filter-chip ${
                    filters.opportunity.includes('HIGH_OPPORTUNITY') ? 'active' : ''
                  }`}
                  style={{
                    '--chip-color': '#059669',
                  } as React.CSSProperties}
                >
                  <span className="dot" />
                  High Opportunity ({tierStats.highOpportunity})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilter('EMERGING')}
                  className={`quick-filter-chip ${
                    filters.opportunity.includes('EMERGING') ? 'active' : ''
                  }`}
                  style={{
                    '--chip-color': '#0891B2',
                  } as React.CSSProperties}
                >
                  <span className="dot" />
                  Emerging ({tierStats.emerging})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilter('DEFENSIVE')}
                  className={`quick-filter-chip ${
                    filters.opportunity.includes('DEFENSIVE') ? 'active' : ''
                  }`}
                  style={{
                    '--chip-color': '#3676eb',
                  } as React.CSSProperties}
                >
                  <span className="dot" />
                  Defensive ({tierStats.defensive})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFilter('needsCandidate')}
                  className={`quick-filter-chip ${
                    filters.opportunity.includes('needsCandidate') ? 'active' : ''
                  }`}
                  style={{
                    '--chip-color': '#F59E0B',
                  } as React.CSSProperties}
                >
                  <span className="dot" />
                  Needs Candidate ({tierStats.needsCandidate})
                </button>
              </div>

              {/* Full filter panel */}
              <FilterPanel
                filters={filters}
                onFilterChange={setFilters}
                className="ml-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Active Filter Pills */}
      {filters.opportunity.length > 0 && (
        <div
          className="px-4 py-2 border-b animate-entrance"
          style={{
            background: 'linear-gradient(90deg, var(--class-purple-bg) 0%, rgba(255,255,255,0.95) 100%)',
            borderColor: 'var(--class-purple-light)',
          }}
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-muted)' }}>
              Active filters:
            </span>
            {filters.opportunity.map((opp) => {
              const colors: Record<string, { bg: string; color: string; label: string }> = {
                HIGH_OPPORTUNITY: { bg: '#ECFDF5', color: '#059669', label: 'High Opportunity' },
                EMERGING: { bg: '#ECFEFF', color: '#0891B2', label: 'Emerging' },
                DEFENSIVE: { bg: '#EFF6FF', color: '#3676eb', label: 'Defensive' },
                needsCandidate: { bg: '#FFFBEB', color: '#F59E0B', label: 'Needs Candidate' },
              };
              const style = colors[opp] || { bg: '#F9FAFB', color: '#6B7280', label: opp };
              return (
                <button
                  key={opp}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      opportunity: prev.opportunity.filter((o) => o !== opp),
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={{
                    background: style.bg,
                    color: style.color,
                    border: `1px solid ${style.color}30`,
                  }}
                  aria-label={`Remove ${style.label} filter`}
                >
                  {style.label}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              );
            })}
            <button
              onClick={() => setFilters((prev) => ({ ...prev, opportunity: [] }))}
              className="text-xs font-medium ml-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Stats summary */}
          {!isLoading && (
            <div className="kpi-grid mb-6 animate-entrance stagger-2">
              <div className="kpi-card" style={{ animationDelay: '0ms' }}>
                <div className="label" style={{ color: '#059669' }}>High Opportunity</div>
                <div className="value font-display" style={{ color: '#059669' }}>
                  {tierStats.highOpportunity}
                </div>
              </div>
              <div className="kpi-card" style={{ animationDelay: '50ms' }}>
                <div className="label" style={{ color: '#0891B2' }}>Emerging</div>
                <div className="value font-display" style={{ color: '#0891B2' }}>
                  {tierStats.emerging}
                </div>
              </div>
              <div className="kpi-card" style={{ animationDelay: '100ms' }}>
                <div className="label" style={{ color: '#3676eb' }}>Defensive</div>
                <div className="value font-display" style={{ color: '#3676eb' }}>
                  {tierStats.defensive}
                </div>
              </div>
              <div className="kpi-card" style={{ animationDelay: '150ms' }}>
                <div className="label" style={{ color: '#F59E0B' }}>Needs Candidate</div>
                <div className="value font-display" style={{ color: '#F59E0B' }}>
                  {tierStats.needsCandidate}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="glass-surface rounded-xl p-4 animate-entrance stagger-3">
            <StrategicTable
              rows={filteredRows}
              onRowClick={handleRowClick}
              isLoading={isLoading}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="glass-surface border-t py-4 px-4 animate-entrance stagger-4"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="max-w-7xl mx-auto text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          <p>
            Data updated:{' '}
            {candidatesData
              ? new Date(candidatesData.lastUpdated).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'Loading...'}
          </p>
        </div>
      </footer>
    </div>
  );
}
