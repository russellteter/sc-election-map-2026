'use client';

import { useState, useEffect } from 'react';
import { getDistrictElectorateProfile, type DistrictElectorateProfile } from '@/lib/targetsmart';

interface ElectorateProfileProps {
  chamber: 'house' | 'senate';
  districtNumber: number;
}

export default function ElectorateProfile({
  chamber,
  districtNumber,
}: ElectorateProfileProps) {
  const [profile, setProfile] = useState<DistrictElectorateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'partisan' | 'turnout' | 'demographics'>('partisan');

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

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-6 animate-pulse"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
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
              background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
              border: '1px solid #93C5FD',
            }}
          >
            <svg className="w-5 h-5" style={{ color: '#1D4ED8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
              Electorate Profile
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {profile.partisanComposition.totalRegistered.toLocaleString()} registered voters
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: profile.confidenceLevel === 'high' ? '#ECFDF5' : profile.confidenceLevel === 'medium' ? '#FEF3C7' : '#FEF2F2',
            color: profile.confidenceLevel === 'high' ? '#059669' : profile.confidenceLevel === 'medium' ? '#B45309' : '#DC2626',
          }}
        >
          {profile.confidenceLevel} confidence
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        {(['partisan', 'turnout', 'demographics'] as const).map((tab) => (
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
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'partisan' && (
          <PartisanTab composition={profile.partisanComposition} />
        )}
        {activeTab === 'turnout' && (
          <TurnoutTab turnout={profile.turnoutProfile} />
        )}
        {activeTab === 'demographics' && (
          <DemographicsTab demographics={profile.demographics} />
        )}
      </div>
    </div>
  );
}

function PartisanTab({ composition }: { composition: DistrictElectorateProfile['partisanComposition'] }) {
  const total = composition.totalRegistered;
  const dist = composition.partisanDistribution;

  return (
    <div className="space-y-4">
      {/* Partisan Score Gauge */}
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
          Average Partisan Score
        </p>
        <div className="relative h-4 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
          <div
            className="absolute inset-y-0 left-0 transition-all"
            style={{
              width: `${composition.averagePartisanScore}%`,
              background: `linear-gradient(90deg, #DC2626 0%, #9CA3AF 50%, #1D4ED8 100%)`,
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 shadow"
            style={{
              left: `${composition.averagePartisanScore}%`,
              borderColor: composition.averagePartisanScore > 50 ? '#1D4ED8' : '#DC2626',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>R</span>
          <span className="font-bold" style={{ color: composition.averagePartisanScore > 50 ? '#1D4ED8' : '#DC2626' }}>
            {composition.averagePartisanScore}
          </span>
          <span>D</span>
        </div>
      </div>

      {/* Distribution Bars */}
      <div className="space-y-2">
        <DistributionBar
          label="Strong Dem"
          value={dist.strongDem}
          total={total}
          color="#1D4ED8"
        />
        <DistributionBar
          label="Lean Dem"
          value={dist.leanDem}
          total={total}
          color="#60A5FA"
        />
        <DistributionBar
          label="Swing"
          value={dist.swing}
          total={total}
          color="#9CA3AF"
        />
        <DistributionBar
          label="Lean Rep"
          value={dist.leanRep}
          total={total}
          color="#F87171"
        />
        <DistributionBar
          label="Strong Rep"
          value={dist.strongRep}
          total={total}
          color="#DC2626"
        />
      </div>
    </div>
  );
}

function TurnoutTab({ turnout }: { turnout: DistrictElectorateProfile['turnoutProfile'] }) {
  const dist = turnout.turnoutDistribution;
  const total = dist.high + dist.medium + dist.low + dist.veryLow;

  return (
    <div className="space-y-4">
      {/* Turnout Type Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Presidential', value: turnout.averageTurnout.presidential, color: '#1D4ED8' },
          { label: 'Midterm', value: turnout.averageTurnout.midterm, color: '#0891B2' },
          { label: 'Primary', value: turnout.averageTurnout.primary, color: '#D97706' },
          { label: 'General', value: turnout.averageTurnout.general, color: '#059669' },
        ].map((item) => (
          <div key={item.label} className="text-center p-3 rounded-lg" style={{ background: 'var(--card-bg-elevated)' }}>
            <p className="text-2xl font-display font-bold" style={{ color: item.color }}>
              {item.value.toFixed(0)}%
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Propensity Distribution */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Turnout Propensity Distribution
        </p>
        <div className="space-y-2">
          <DistributionBar label="High (80-100)" value={dist.high} total={total} color="#059669" />
          <DistributionBar label="Medium (50-79)" value={dist.medium} total={total} color="#0891B2" />
          <DistributionBar label="Low (20-49)" value={dist.low} total={total} color="#D97706" />
          <DistributionBar label="Very Low (0-19)" value={dist.veryLow} total={total} color="#DC2626" />
        </div>
      </div>
    </div>
  );
}

function DemographicsTab({ demographics }: { demographics: DistrictElectorateProfile['demographics'] }) {
  const ageTotal = Object.values(demographics.ageDistribution).reduce((a, b) => a + b, 0);
  const genderTotal = Object.values(demographics.genderDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Age Distribution */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Age Distribution
        </p>
        <div className="space-y-2">
          <DistributionBar label="18-29" value={demographics.ageDistribution.age18_29} total={ageTotal} color="#8B5CF6" />
          <DistributionBar label="30-44" value={demographics.ageDistribution.age30_44} total={ageTotal} color="#06B6D4" />
          <DistributionBar label="45-64" value={demographics.ageDistribution.age45_64} total={ageTotal} color="#F59E0B" />
          <DistributionBar label="65+" value={demographics.ageDistribution.age65Plus} total={ageTotal} color="#6366F1" />
        </div>
      </div>

      {/* Gender Pie Chart (simplified as bars) */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Gender Distribution
        </p>
        <div className="flex h-6 rounded-full overflow-hidden">
          <div
            style={{
              width: `${(demographics.genderDistribution.female / genderTotal) * 100}%`,
              background: '#EC4899',
            }}
          />
          <div
            style={{
              width: `${(demographics.genderDistribution.male / genderTotal) * 100}%`,
              background: '#3B82F6',
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          <span>Female {((demographics.genderDistribution.female / genderTotal) * 100).toFixed(0)}%</span>
          <span>Male {((demographics.genderDistribution.male / genderTotal) * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Education */}
      <div>
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          Education Level
        </p>
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: 'HS or less', value: demographics.educationDistribution.highSchoolOrLess },
            { label: 'Some College', value: demographics.educationDistribution.someCollege },
            { label: 'Bachelor\'s', value: demographics.educationDistribution.bachelors },
            { label: 'Graduate', value: demographics.educationDistribution.graduate },
          ].map((item) => {
            const total = Object.values(demographics.educationDistribution).reduce((a, b) => a + b, 0);
            return (
              <div key={item.label} className="p-2 rounded" style={{ background: 'var(--card-bg-elevated)' }}>
                <p className="font-bold" style={{ color: 'var(--text-color)' }}>
                  {((item.value / total) * 100).toFixed(0)}%
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-20 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-medium w-12 text-right" style={{ color }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}
