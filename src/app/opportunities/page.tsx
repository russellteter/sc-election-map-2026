'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { OpportunityData, DistrictOpportunity, CandidatesData } from '@/types/schema';
import OpportunityCard from '@/components/Dashboard/OpportunityCard';
import { RecruitmentPipeline, EndorsementDashboard } from '@/components/Intelligence';

// Tier colors matching the map
const TIER_COLORS = {
  HIGH_OPPORTUNITY: '#059669',
  EMERGING: '#0891B2',
  BUILD: '#D97706',
  DEFENSIVE: '#3676eb',
  NON_COMPETITIVE: '#9CA3AF',
} as const;

type SortField = 'score' | 'trend' | 'tier' | 'district';
type SortDirection = 'asc' | 'desc';

export default function OpportunitiesPage() {
  const [opportunityData, setOpportunityData] = useState<OpportunityData | null>(null);
  const [candidatesData, setCandidatesData] = useState<CandidatesData | null>(null);
  const [chamber, setChamber] = useState<'house' | 'senate'>('house');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [showNeedsCandidate, setShowNeedsCandidate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const cacheBuster = `v=${Date.now()}`;

    Promise.all([
      fetch(`${basePath}/data/opportunity.json?${cacheBuster}`).then((res) => res.json()),
      fetch(`${basePath}/data/candidates.json?${cacheBuster}`).then((res) => res.json()),
    ])
      .then(([opportunity, candidates]) => {
        setOpportunityData(opportunity);
        setCandidatesData(candidates);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setIsLoading(false);
      });
  }, []);

  // Sort and filter districts
  const sortedDistricts = useMemo(() => {
    if (!opportunityData) return [];

    const districts = Object.values(opportunityData[chamber]) as DistrictOpportunity[];

    // Apply filters
    let filtered = districts;

    if (tierFilter.length > 0) {
      filtered = filtered.filter((d) => tierFilter.includes(d.tier));
    }

    if (showNeedsCandidate) {
      filtered = filtered.filter((d) => d.flags.needsCandidate);
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'score':
          comparison = a.opportunityScore - b.opportunityScore;
          break;
        case 'trend':
          comparison = a.metrics.trendChange - b.metrics.trendChange;
          break;
        case 'district':
          comparison = a.districtNumber - b.districtNumber;
          break;
        case 'tier':
          const tierOrder = ['HIGH_OPPORTUNITY', 'EMERGING', 'BUILD', 'DEFENSIVE', 'NON_COMPETITIVE'];
          comparison = tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier);
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [opportunityData, chamber, sortField, sortDirection, tierFilter, showNeedsCandidate]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleTierFilter = (tier: string) => {
    setTierFilter((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const getCandidate = (districtNum: number) => {
    if (!candidatesData) return null;
    const district = candidatesData[chamber][String(districtNum)];
    const demCandidate = district?.candidates.find(
      (c) => c.party?.toLowerCase() === 'democratic'
    );
    return demCandidate;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen atmospheric-bg flex items-center justify-center">
        <div className="glass-surface rounded-xl p-8 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen atmospheric-bg">
      {/* Header */}
      <header className="glass-surface border-b sticky top-0 z-40" style={{ borderColor: 'var(--class-purple-light)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-sm hover:underline mb-1 inline-block"
                style={{ color: 'var(--class-purple)' }}
              >
                ← Back to Map
              </Link>
              <h1 className="text-xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
                Priority Districts
              </h1>
            </div>

            {/* Chamber Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChamber('house')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chamber === 'house' ? 'text-white' : ''
                }`}
                style={{
                  background: chamber === 'house' ? 'var(--class-purple)' : 'transparent',
                  color: chamber === 'house' ? 'white' : 'var(--text-muted)',
                }}
              >
                House
              </button>
              <button
                onClick={() => setChamber('senate')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  chamber === 'senate' ? 'text-white' : ''
                }`}
                style={{
                  background: chamber === 'senate' ? 'var(--class-purple)' : 'transparent',
                  color: chamber === 'senate' ? 'white' : 'var(--text-muted)',
                }}
              >
                Senate
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Filter by tier:
            </span>
            {Object.entries(TIER_COLORS).map(([tier, color]) => (
              <button
                key={tier}
                onClick={() => toggleTierFilter(tier)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  tierFilter.includes(tier) ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: tierFilter.includes(tier) ? color : `${color}20`,
                  color: tierFilter.includes(tier) ? 'white' : color,
                  ['--tw-ring-color' as string]: color,
                } as React.CSSProperties}
              >
                {tier.replace('_', ' ').replace('HIGH OPPORTUNITY', 'High').replace('NON COMPETITIVE', 'Low')}
              </button>
            ))}
            <div className="border-l pl-2 ml-2" style={{ borderColor: 'var(--class-purple-light)' }}>
              <button
                onClick={() => setShowNeedsCandidate(!showNeedsCandidate)}
                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                  showNeedsCandidate ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  background: showNeedsCandidate ? '#F59E0B' : '#F59E0B20',
                  color: showNeedsCandidate ? 'white' : '#F59E0B',
                  ['--tw-ring-color' as string]: '#F59E0B',
                } as React.CSSProperties}
              >
                Needs Candidate
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Recruitment Pipeline (Phase 2 Feature) */}
      {opportunityData && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <RecruitmentPipeline opportunityData={opportunityData} chamber={chamber} />
        </div>
      )}

      {/* Endorsement Dashboard (Phase 3 Feature) */}
      {candidatesData && (
        <div className="max-w-7xl mx-auto px-4 pb-4">
          <EndorsementDashboard candidatesData={candidatesData} chamber={chamber} />
        </div>
      )}

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing {sortedDistricts.length} districts
          {tierFilter.length > 0 && ` (filtered by ${tierFilter.length} tier${tierFilter.length > 1 ? 's' : ''})`}
          {showNeedsCandidate && ' needing candidates'}
        </p>
      </div>

      {/* Mobile Cards View - Hidden on md+ screens */}
      <div className="md:hidden max-w-7xl mx-auto px-4 pb-8">
        <div className="space-y-3">
          {sortedDistricts.map((district, index) => (
            <OpportunityCard
              key={district.districtNumber}
              district={district}
              chamber={chamber}
              candidate={getCandidate(district.districtNumber)}
              animationDelay={index * 30}
            />
          ))}
          {sortedDistricts.length === 0 && (
            <div className="glass-surface rounded-xl p-8 text-center">
              <p style={{ color: 'var(--text-muted)' }}>
                No districts match your filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 pb-8">
        <div className="glass-surface rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--class-purple-bg)' }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <button
                      onClick={() => handleSort('district')}
                      className="flex items-center gap-1 hover:opacity-70"
                    >
                      District
                      {sortField === 'district' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <button
                      onClick={() => handleSort('score')}
                      className="flex items-center gap-1 hover:opacity-70"
                    >
                      Score
                      {sortField === 'score' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <button
                      onClick={() => handleSort('tier')}
                      className="flex items-center gap-1 hover:opacity-70"
                    >
                      Tier
                      {sortField === 'tier' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    <button
                      onClick={() => handleSort('trend')}
                      className="flex items-center gap-1 hover:opacity-70"
                    >
                      Trend
                      {sortField === 'trend' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Candidate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--class-purple-light)' }}>
                {sortedDistricts.map((district, index) => {
                  const candidate = getCandidate(district.districtNumber);
                  const tierColor = TIER_COLORS[district.tier];

                  return (
                    <tr
                      key={district.districtNumber}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                          {chamber === 'house' ? 'House' : 'Senate'} {district.districtNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-bold font-display text-lg"
                          style={{ color: tierColor }}
                        >
                          {district.opportunityScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background: `${tierColor}20`,
                            color: tierColor,
                          }}
                        >
                          {district.tierLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-medium"
                          style={{
                            color: district.metrics.trendChange > 0 ? '#059669' : district.metrics.trendChange < 0 ? '#DC2626' : 'var(--text-muted)',
                          }}
                        >
                          {district.metrics.trendChange > 0 ? '↑' : district.metrics.trendChange < 0 ? '↓' : '→'}
                          {' '}
                          {Math.abs(district.metrics.trendChange).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {district.flags.openSeat && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                              Open
                            </span>
                          )}
                          {district.flags.needsCandidate && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                              Recruit
                            </span>
                          )}
                          {district.flags.defensive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                              Defend
                            </span>
                          )}
                          {district.flags.trendingDem && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-100 text-teal-700">
                              Trending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {candidate ? (
                          <span className="text-sm" style={{ color: 'var(--class-purple)' }}>
                            {candidate.name.split(',').reverse().join(' ').trim()}
                          </span>
                        ) : (
                          <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                            None filed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/?chamber=${chamber}&district=${district.districtNumber}`}
                          className="text-xs font-medium px-2 py-1 rounded hover:opacity-70 transition-opacity"
                          style={{
                            background: 'var(--class-purple)',
                            color: 'white',
                          }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

