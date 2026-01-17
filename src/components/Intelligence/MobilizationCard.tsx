'use client';

import { useState, useEffect } from 'react';
import { getDistrictElectorateProfile, type MobilizationUniverse } from '@/lib/targetsmart';

interface MobilizationCardProps {
  chamber: 'house' | 'senate';
  districtNumber: number;
  compact?: boolean;
}

export default function MobilizationCard({
  chamber,
  districtNumber,
  compact = false,
}: MobilizationCardProps) {
  const [mobilization, setMobilization] = useState<MobilizationUniverse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const profile = await getDistrictElectorateProfile(chamber, districtNumber);
        setMobilization(profile?.mobilizationUniverse || null);
      } catch (error) {
        console.error('Failed to fetch mobilization data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [chamber, districtNumber]);

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

  if (!mobilization) {
    return null;
  }

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'high':
        return { bg: '#ECFDF5', color: '#059669', border: '#6EE7B7' };
      case 'medium':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FCD34D' };
      default:
        return { bg: '#F3F4F6', color: '#6B7280', border: '#D1D5DB' };
    }
  };

  const potentialStyles = getPotentialColor(mobilization.lowTurnoutDems.potential);

  if (compact) {
    return (
      <div
        className="rounded-lg p-3"
        style={{
          background: potentialStyles.bg,
          border: `1px solid ${potentialStyles.border}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              style={{ color: potentialStyles.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="text-sm font-medium" style={{ color: potentialStyles.color }}>
              Mobilization Potential
            </span>
          </div>
          <span
            className="text-lg font-display font-bold"
            style={{ color: potentialStyles.color }}
          >
            {mobilization.mobilizationPriority}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{mobilization.lowTurnoutDems.count.toLocaleString()} low-turnout Dems</span>
          <span>+{mobilization.estimatedVotePickup.toLocaleString()} potential votes</span>
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
      <div
        className="p-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${potentialStyles.bg} 0%, white 100%)`,
          borderBottom: `1px solid ${potentialStyles.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: potentialStyles.bg, border: `2px solid ${potentialStyles.border}` }}
          >
            <svg
              className="w-6 h-6"
              style={{ color: potentialStyles.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              Mobilization Universe
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Untapped Democratic voters
            </p>
          </div>
        </div>

        {/* Priority Score */}
        <div className="text-center">
          <span
            className="text-3xl font-display font-bold"
            style={{ color: potentialStyles.color }}
          >
            {mobilization.mobilizationPriority}
          </span>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Priority</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <MetricBox
            label="Low-Turnout Dems"
            value={mobilization.lowTurnoutDems.count.toLocaleString()}
            sublabel={`${mobilization.lowTurnoutDems.percentage.toFixed(1)}% of district`}
            color={potentialStyles.color}
          />
          <MetricBox
            label="Swing Voters"
            value={mobilization.swingVoters.count.toLocaleString()}
            sublabel={`${mobilization.swingVoters.percentage.toFixed(1)}% of district`}
            color="#6B7280"
          />
          <MetricBox
            label="Vote Pickup"
            value={`+${mobilization.estimatedVotePickup.toLocaleString()}`}
            sublabel="at full mobilization"
            color="#1D4ED8"
            highlight
          />
        </div>

        {/* Persuadable Universe */}
        <div
          className="rounded-lg p-3"
          style={{ background: 'var(--card-bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Persuadable Voters
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${(mobilization.persuadable.leanDem / mobilization.persuadable.total) * 100}%`,
                    background: '#60A5FA',
                  }}
                />
                <div
                  style={{
                    width: `${(mobilization.persuadable.leanRep / mobilization.persuadable.total) * 100}%`,
                    background: '#F87171',
                  }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>Lean D: {mobilization.persuadable.leanDem.toLocaleString()}</span>
                <span>Lean R: {mobilization.persuadable.leanRep.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                {mobilization.persuadable.total.toLocaleString()}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>total</p>
            </div>
          </div>
        </div>

        {/* Strategy Recommendation */}
        <div
          className="rounded-lg p-3"
          style={{
            background: mobilization.lowTurnoutDems.potential === 'high' ? '#ECFDF5' : '#F9FAFB',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: potentialStyles.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-color)' }}>
              {mobilization.lowTurnoutDems.potential === 'high'
                ? `Strong mobilization opportunity. Focus on turning out ${mobilization.lowTurnoutDems.count.toLocaleString()} low-propensity Democrats who already lean our way.`
                : mobilization.lowTurnoutDems.potential === 'medium'
                  ? `Moderate mobilization potential. Balance turnout operations with persuasion of ${mobilization.swingVoters.count.toLocaleString()} swing voters.`
                  : `Limited mobilization universe. Focus resources on persuasion and voter registration.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
  sublabel,
  color,
  highlight = false,
}: {
  label: string;
  value: string;
  sublabel: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{
        background: highlight ? `${color}10` : 'var(--card-bg-elevated)',
        border: highlight ? `1px solid ${color}40` : '1px solid var(--border-subtle)',
      }}
    >
      <p className="text-lg font-display font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {sublabel}
      </p>
    </div>
  );
}
