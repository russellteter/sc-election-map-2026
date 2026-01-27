'use client';

import { useState, useEffect, useMemo } from 'react';
import { getEarlyVoteTracking, type EarlyVoteTracking } from '@/lib/targetsmart';

interface EarlyVoteTrackerProps {
  chamber: 'house' | 'senate';
  districtNumber: number;
  compact?: boolean;
}

export default function EarlyVoteTracker({
  chamber,
  districtNumber,
  compact = false,
}: EarlyVoteTrackerProps) {
  const [tracking, setTracking] = useState<EarlyVoteTracking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'byDate' | 'byParty'>('overview');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getEarlyVoteTracking(chamber, districtNumber);
        setTracking(data);
      } catch (error) {
        console.error('Failed to fetch early vote tracking:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [chamber, districtNumber]);

  // Calculate derived stats
  const stats = useMemo(() => {
    if (!tracking) return null;

    const { ballotsRequested, ballotsReturned, earlyInPerson } = tracking;
    const totalReturned = ballotsReturned.total + (earlyInPerson?.total || 0);
    const returnRate = ballotsRequested.total > 0
      ? (ballotsReturned.total / ballotsRequested.total) * 100
      : 0;

    // Calculate party advantage
    const demAdvantage = (ballotsReturned.democratic + (earlyInPerson?.total || 0) * 0.48) -
                         (ballotsReturned.republican + (earlyInPerson?.total || 0) * 0.45);

    return {
      totalReturned,
      returnRate,
      demAdvantage,
      demPct: totalReturned > 0 ? ((ballotsReturned.democratic / totalReturned) * 100) : 0,
      repPct: totalReturned > 0 ? ((ballotsReturned.republican / totalReturned) * 100) : 0,
    };
  }, [tracking]);

  if (isLoading) {
    return (
      <div
        className={`rounded-xl animate-pulse ${compact ? 'p-4' : 'p-6'}`}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Show placeholder when no data (outside election season)
  if (!tracking) {
    return (
      <div
        className={`rounded-xl ${compact ? 'p-4' : 'p-6'}`}
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--slate-100)' }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--slate-400)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              Early Vote Tracking
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Data available during election season
            </p>
          </div>
        </div>
        {!compact && (
          <div className="mt-4 text-center p-4 rounded-lg" style={{ background: 'var(--card-bg-elevated)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Early vote tracking becomes available 45 days before Election Day
            </p>
          </div>
        )}
      </div>
    );
  }

  const getAdvantageColor = (adv: number) => {
    if (adv > 100) return { bg: 'var(--dem-tint)', color: 'var(--party-dem)', label: 'Dem Advantage' };
    if (adv < -100) return { bg: 'var(--rep-tint)', color: 'var(--status-at-risk)', label: 'Rep Advantage' };
    return { bg: 'var(--slate-100)', color: 'var(--slate-500)', label: 'Even' };
  };

  const advStyle = getAdvantageColor(stats?.demAdvantage || 0);

  if (compact) {
    return (
      <div
        className="rounded-lg p-3"
        style={{
          background: advStyle.bg,
          border: `1px solid ${advStyle.color}30`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              style={{ color: advStyle.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-sm font-medium" style={{ color: advStyle.color }}>
              Early Vote
            </span>
          </div>
          <span className="text-lg font-display font-bold" style={{ color: advStyle.color }}>
            {stats?.totalReturned.toLocaleString()}
          </span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          <div style={{ width: `${stats?.demPct || 0}%`, background: '#1D4ED8' }} />
          <div style={{ width: `${100 - (stats?.demPct || 0) - (stats?.repPct || 0)}%`, background: '#9CA3AF' }} />
          <div style={{ width: `${stats?.repPct || 0}%`, background: '#DC2626' }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>D: {stats?.demPct.toFixed(0)}%</span>
          <span>R: {stats?.repPct.toFixed(0)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--success-50) 0%, var(--success-100) 100%)',
              border: '1px solid var(--success-100)',
            }}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--accent-emerald)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              Early Vote Tracker
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {tracking.ballotsRequested.total.toLocaleString()} ballots requested
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: advStyle.bg, color: advStyle.color }}
        >
          {advStyle.label}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {(['overview', 'byDate', 'byParty'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'border-b-2' : ''
            }`}
            style={{
              color: activeTab === tab ? 'var(--class-purple)' : 'var(--text-muted)',
              borderColor: activeTab === tab ? 'var(--class-purple)' : 'transparent',
            }}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'byDate' && 'By Date'}
            {tab === 'byParty' && 'By Party'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                label="Total Voted"
                value={stats?.totalReturned.toLocaleString() || '0'}
                color="#059669"
              />
              <MetricCard
                label="Return Rate"
                value={`${stats?.returnRate.toFixed(1)}%`}
                color="#0891B2"
              />
              <MetricCard
                label="Dem Lead"
                value={stats?.demAdvantage && stats.demAdvantage > 0 ? `+${Math.abs(stats.demAdvantage).toLocaleString()}` : stats?.demAdvantage?.toLocaleString() || '0'}
                color={stats?.demAdvantage && stats.demAdvantage > 0 ? '#1D4ED8' : '#DC2626'}
              />
            </div>

            {/* Party Distribution Bar */}
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                Party Distribution
              </p>
              <div className="flex h-6 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${stats?.demPct || 0}%`, background: '#1D4ED8' }}
                >
                  {(stats?.demPct || 0) > 10 && `${stats?.demPct.toFixed(0)}%`}
                </div>
                <div
                  className="flex items-center justify-center text-xs font-medium"
                  style={{
                    width: `${100 - (stats?.demPct || 0) - (stats?.repPct || 0)}%`,
                    background: '#E5E7EB',
                    color: '#6B7280',
                  }}
                >
                  {(100 - (stats?.demPct || 0) - (stats?.repPct || 0)) > 10 && 'Other'}
                </div>
                <div
                  className="flex items-center justify-center text-xs font-medium text-white"
                  style={{ width: `${stats?.repPct || 0}%`, background: '#DC2626' }}
                >
                  {(stats?.repPct || 0) > 10 && `${stats?.repPct.toFixed(0)}%`}
                </div>
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>Democrat</span>
                <span>Republican</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'byDate' && (
          <div className="space-y-2">
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
              Daily Returns (Last 7 Days)
            </p>
            {tracking.ballotsReturned.byDate.slice(-7).map((day, i) => {
              const maxCount = Math.max(...tracking.ballotsReturned.byDate.map(d => d.count));
              const pct = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

              return (
                <div key={day.date} className="flex items-center gap-2">
                  <span className="text-xs w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-4 rounded overflow-hidden" style={{ background: 'var(--slate-200)' }}>
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${pct}%`, background: 'var(--accent-emerald)' }}
                    />
                  </div>
                  <span className="text-xs font-medium w-12 text-right" style={{ color: 'var(--text-color)' }}>
                    {day.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'byParty' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <PartyCard
                party="Democrat"
                requested={tracking.ballotsRequested.democratic}
                returned={tracking.ballotsReturned.democratic}
                color="#1D4ED8"
              />
              <PartyCard
                party="Republican"
                requested={tracking.ballotsRequested.republican}
                returned={tracking.ballotsReturned.republican}
                color="#DC2626"
              />
            </div>
            <PartyCard
              party="Other/Unknown"
              requested={tracking.ballotsRequested.other}
              returned={tracking.ballotsReturned.other}
              color="#6B7280"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ background: `${color}10`, border: `1px solid ${color}30` }}
    >
      <p className="text-lg font-display font-bold" style={{ color }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  );
}

function PartyCard({
  party,
  requested,
  returned,
  color,
}: {
  party: string;
  requested: number;
  returned: number;
  color: string;
}) {
  const returnRate = requested > 0 ? (returned / requested) * 100 : 0;

  return (
    <div
      className="rounded-lg p-3"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    >
      <p className="text-sm font-medium" style={{ color }}>{party}</p>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Requested</span>
          <span style={{ color: 'var(--text-color)' }}>{requested.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Returned</span>
          <span className="font-medium" style={{ color }}>{returned.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--text-muted)' }}>Return Rate</span>
          <span style={{ color }}>{returnRate.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
