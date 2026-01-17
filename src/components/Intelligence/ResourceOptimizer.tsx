'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { getDistrictElectorateProfile, type DistrictElectorateProfile } from '@/lib/targetsmart';

interface ResourceOptimizerProps {
  chamber: 'house' | 'senate';
  districtNumber: number;
  compact?: boolean;
}

interface ResourceAllocation {
  category: string;
  label: string;
  percentage: number;
  reasoning: string;
  color: string;
  icon: ReactNode;
}

export default function ResourceOptimizer({
  chamber,
  districtNumber,
  compact = false,
}: ResourceOptimizerProps) {
  const [profile, setProfile] = useState<DistrictElectorateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const data = await getDistrictElectorateProfile(chamber, districtNumber);
        setProfile(data);
      } catch (error) {
        console.error('Failed to fetch electorate profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, [chamber, districtNumber]);

  // Calculate resource allocation based on profile data
  const allocation = useMemo((): ResourceAllocation[] => {
    if (!profile) return [];

    const mobilization = profile.mobilizationUniverse;
    const composition = profile.partisanComposition;
    const turnout = profile.turnoutProfile;

    // Calculate strategic priorities
    const lowTurnoutDemPct = mobilization.lowTurnoutDems.percentage;
    const swingPct = mobilization.swingVoters.percentage;
    const demAdvantage = composition.averagePartisanScore - 50;
    const hasHighMobilizationPotential = mobilization.lowTurnoutDems.potential === 'high';

    let gotv = 0;
    let persuasion = 0;
    let digital = 0;
    let fieldOrg = 0;
    let voterReg = 0;

    // Strong Dem district with low turnout Dems = focus on GOTV
    if (demAdvantage > 10 && hasHighMobilizationPotential) {
      gotv = 45;
      fieldOrg = 30;
      digital = 15;
      persuasion = 5;
      voterReg = 5;
    }
    // Competitive district = balanced approach with persuasion focus
    else if (Math.abs(demAdvantage) <= 10) {
      persuasion = 35;
      gotv = 25;
      digital = 20;
      fieldOrg = 15;
      voterReg = 5;
    }
    // Lean R district = heavy persuasion and registration
    else if (demAdvantage < -5) {
      persuasion = 30;
      voterReg = 25;
      digital = 25;
      gotv = 15;
      fieldOrg = 5;
    }
    // Moderate Dem lean = balanced GOTV + persuasion
    else {
      gotv = 35;
      persuasion = 25;
      digital = 20;
      fieldOrg = 15;
      voterReg = 5;
    }

    return [
      {
        category: 'gotv',
        label: 'GOTV Operations',
        percentage: gotv,
        reasoning: hasHighMobilizationPotential
          ? `High potential: ${mobilization.lowTurnoutDems.count.toLocaleString()} low-turnout Democrats`
          : `Standard turnout operations for base voters`,
        color: '#1D4ED8',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        category: 'persuasion',
        label: 'Persuasion',
        percentage: persuasion,
        reasoning: swingPct > 15
          ? `High swing voter concentration: ${swingPct.toFixed(1)}%`
          : `Targeted persuasion for lean voters`,
        color: '#7C3AED',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        category: 'digital',
        label: 'Digital/Media',
        percentage: digital,
        reasoning: 'Broad reach for awareness and micro-targeting',
        color: '#0891B2',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        category: 'field',
        label: 'Field Organization',
        percentage: fieldOrg,
        reasoning: 'Door-to-door canvassing and local events',
        color: '#059669',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        category: 'registration',
        label: 'Voter Registration',
        percentage: voterReg,
        reasoning: demAdvantage < 0
          ? 'Priority: expand electorate in challenging district'
          : 'Maintain registration drives in target communities',
        color: '#D97706',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        ),
      },
    ].sort((a, b) => b.percentage - a.percentage);
  }, [profile]);

  // Strategy summary
  const strategySummary = useMemo(() => {
    if (!profile) return null;

    const demAdvantage = profile.partisanComposition.averagePartisanScore - 50;
    const potential = profile.mobilizationUniverse.lowTurnoutDems.potential;

    if (demAdvantage > 10 && potential === 'high') {
      return { type: 'mobilization', label: 'Mobilization Priority', color: '#059669' };
    } else if (Math.abs(demAdvantage) <= 10) {
      return { type: 'competitive', label: 'Competitive Battle', color: '#7C3AED' };
    } else if (demAdvantage < -5) {
      return { type: 'expansion', label: 'Expansion Required', color: '#D97706' };
    } else {
      return { type: 'balanced', label: 'Balanced Approach', color: '#1D4ED8' };
    }
  }, [profile]);

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

  if (!profile || allocation.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div
        className="rounded-lg p-3"
        style={{
          background: `${strategySummary?.color}10`,
          border: `1px solid ${strategySummary?.color}30`,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              style={{ color: strategySummary?.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <span className="text-sm font-medium" style={{ color: strategySummary?.color }}>
              {strategySummary?.label}
            </span>
          </div>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden">
          {allocation.map((item) => (
            <div
              key={item.category}
              style={{ width: `${item.percentage}%`, background: item.color }}
              title={`${item.label}: ${item.percentage}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>{allocation[0]?.label}: {allocation[0]?.percentage}%</span>
          <span>{allocation[1]?.label}: {allocation[1]?.percentage}%</span>
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
              background: `linear-gradient(135deg, ${strategySummary?.color}20 0%, ${strategySummary?.color}10 100%)`,
              border: `1px solid ${strategySummary?.color}40`,
            }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: strategySummary?.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              Resource Optimizer
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Recommended allocation strategy
            </p>
          </div>
        </div>

        {/* Strategy Badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            background: `${strategySummary?.color}15`,
            color: strategySummary?.color,
          }}
        >
          {strategySummary?.label}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Allocation Bar */}
        <div>
          <div className="flex h-6 rounded-lg overflow-hidden">
            {allocation.map((item) => (
              <div
                key={item.category}
                className="flex items-center justify-center text-[10px] font-medium text-white transition-all hover:opacity-80"
                style={{ width: `${item.percentage}%`, background: item.color }}
                title={`${item.label}: ${item.percentage}%`}
              >
                {item.percentage >= 15 && `${item.percentage}%`}
              </div>
            ))}
          </div>
        </div>

        {/* Allocation Details */}
        <div className="space-y-2">
          {allocation.map((item) => (
            <div
              key={item.category}
              className="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-gray-50"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}15`, color: item.color }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm" style={{ color: 'var(--text-color)' }}>
                    {item.label}
                  </span>
                  <span className="font-display font-bold text-sm" style={{ color: item.color }}>
                    {item.percentage}%
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {item.reasoning}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Strategy Insight */}
        <div
          className="rounded-lg p-3"
          style={{
            background: `${strategySummary?.color}08`,
            border: `1px solid ${strategySummary?.color}20`,
          }}
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: strategySummary?.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-color)' }}>
              {strategySummary?.type === 'mobilization' && (
                <>Strong Democratic base with untapped turnout potential. Prioritize voter contact and GOTV operations to maximize base turnout.</>
              )}
              {strategySummary?.type === 'competitive' && (
                <>Competitive district requires balanced investment. Split resources between persuasion of swing voters and base mobilization.</>
              )}
              {strategySummary?.type === 'expansion' && (
                <>Challenging territory requires electorate expansion. Focus on voter registration and persuasion to shift the playing field.</>
              )}
              {strategySummary?.type === 'balanced' && (
                <>Moderate Democratic lean suggests balanced approach. Maintain strong GOTV while investing in persuasion outreach.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
