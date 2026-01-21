'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  aggregateCrossStateComparison,
  getMetricConfig,
  type StateSummary,
  type ComparisonMetric,
} from '@/lib/crossStateAggregator';
import { getStateConfig } from '@/lib/stateConfig';
import type { CandidatesData, Chamber } from '@/types/schema';

/**
 * Available states for comparison
 */
const COMPARISON_STATES = ['SC', 'NC', 'GA', 'FL', 'VA'];

interface CrossStateComparisonProps {
  /** Currently focused state */
  currentState: string;
  /** Chamber being compared */
  chamber: Chamber;
  /** States selected for comparison */
  selectedStates?: string[];
  /** Callback when states selection changes */
  onStatesChange?: (states: string[]) => void;
  /** Additional className */
  className?: string;
}

/**
 * State card component for mini comparison display
 */
function StateCard({
  summary,
  isCurrentState,
  isSelected,
  onToggle,
}: {
  summary: StateSummary;
  isCurrentState: boolean;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const coverage = summary.demCoverage.toFixed(0);

  return (
    <button
      onClick={onToggle}
      className={`
        p-3 rounded-lg border transition-all
        ${isSelected ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}
        ${isCurrentState ? 'ring-2 ring-offset-1' : ''}
      `}
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, var(--card-bg) 0%, #F8FAFC 100%)'
          : 'var(--card-bg)',
        borderColor: isSelected ? 'var(--class-purple-light)' : 'var(--border-subtle)',
        ['--tw-ring-color' as string]: 'var(--class-purple)',
      }}
    >
      <div className="text-center">
        <div
          className="text-lg font-bold font-display"
          style={{ color: isCurrentState ? 'var(--class-purple)' : 'var(--text-color)' }}
        >
          {summary.stateCode}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {summary.totalDistricts} districts
        </div>
        <div
          className="text-sm font-medium mt-2"
          style={{ color: '#3B82F6' }}
        >
          {coverage}% coverage
        </div>
        <div className="flex justify-center gap-1 mt-1">
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#DBEAFE', color: '#1E40AF' }}>
            {summary.demIncumbents}D
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
            {summary.repIncumbents}R
          </span>
        </div>
      </div>
    </button>
  );
}

/**
 * Metric comparison bar component
 */
function MetricBar({
  summary,
  metric,
  maxValue,
  isCurrentState,
}: {
  summary: StateSummary;
  metric: ComparisonMetric;
  maxValue: number;
  isCurrentState: boolean;
}) {
  const config = getMetricConfig(metric);
  const value = summary[metric];
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-8 text-right text-sm font-medium ${isCurrentState ? 'font-bold' : ''}`}
        style={{ color: isCurrentState ? 'var(--class-purple)' : 'var(--text-color)' }}
      >
        {summary.stateCode}
      </span>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percentage}%`,
            background: config.color,
            opacity: isCurrentState ? 1 : 0.7,
          }}
        />
      </div>
      <span className="w-16 text-right text-sm" style={{ color: 'var(--text-muted)' }}>
        {config.format(value)}
      </span>
    </div>
  );
}

/**
 * CrossStateComparison - Multi-State Electoral Comparison
 *
 * Compares electoral statistics across 5 southern states.
 *
 * Features:
 * - State selection toggles
 * - Metric comparison bars
 * - Summary statistics
 * - Ranking display
 *
 * @example
 * ```tsx
 * <CrossStateComparison
 *   currentState="SC"
 *   chamber="house"
 *   selectedStates={['SC', 'NC', 'GA']}
 *   onStatesChange={(states) => setStates(states)}
 * />
 * ```
 */
export default function CrossStateComparison({
  currentState,
  chamber,
  selectedStates = ['SC', 'NC', 'GA'],
  onStatesChange,
  className = '',
}: CrossStateComparisonProps) {
  const [stateDataMap, setStateDataMap] = useState<Map<string, CandidatesData | null>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<ComparisonMetric>('demCoverage');

  // Load data for all states (isLoading starts as true)
  useEffect(() => {
    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    const loadPromises = COMPARISON_STATES.map(async (stateCode) => {
      try {
        const candidatesPath = stateCode === 'SC'
          ? `${basePath}/data/candidates.json`
          : `${basePath}/data/states/${stateCode.toLowerCase()}/candidates.json`;

        const res = await fetch(`${candidatesPath}?v=${Date.now()}`);
        if (!res.ok) return [stateCode, null] as const;
        const data = await res.json();
        return [stateCode, data] as const;
      } catch {
        return [stateCode, null] as const;
      }
    });

    Promise.all(loadPromises).then((results) => {
      const map = new Map<string, CandidatesData | null>();
      results.forEach(([code, data]) => {
        map.set(code, data);
      });
      setStateDataMap(map);
      setIsLoading(false);
    });
  }, []);

  // Calculate comparison data
  const comparison = useMemo(() => {
    const statesWithData = COMPARISON_STATES.map((code) => {
      const config = getStateConfig(code);
      return {
        code,
        name: config?.name || code,
        data: stateDataMap.get(code) || null,
      };
    });

    return aggregateCrossStateComparison(statesWithData, chamber);
  }, [stateDataMap, chamber]);

  // Filter to selected states
  const selectedSummaries = useMemo(() => {
    return comparison.states.filter((s) =>
      selectedStates.includes(s.stateCode.toLowerCase()) ||
      selectedStates.includes(s.stateCode.toUpperCase())
    );
  }, [comparison.states, selectedStates]);

  // Get max values for bars
  const maxValues = useMemo(() => ({
    demCoverage: 100,
    contested: Math.max(...selectedSummaries.map((s) => s.contested), 1),
    openSeats: Math.max(...selectedSummaries.map((s) => s.openSeats), 1),
    demIncumbents: Math.max(...selectedSummaries.map((s) => s.demIncumbents), 1),
    totalDistricts: Math.max(...selectedSummaries.map((s) => s.totalDistricts), 1),
  }), [selectedSummaries]);

  // Toggle state selection
  const toggleState = (stateCode: string) => {
    const normalizedCode = stateCode.toLowerCase();
    const newStates = selectedStates.includes(normalizedCode)
      ? selectedStates.filter((s) => s.toLowerCase() !== normalizedCode)
      : [...selectedStates, normalizedCode];

    // Always keep at least the current state selected
    if (newStates.length === 0) {
      newStates.push(currentState.toLowerCase());
    }

    onStatesChange?.(newStates);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`cross-state-comparison ${className}`}>
        <div className="glass-surface rounded-xl p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const metricOptions: ComparisonMetric[] = ['demCoverage', 'contested', 'openSeats', 'demIncumbents'];

  return (
    <div className={`cross-state-comparison ${className}`}>
      {/* Header */}
      <div
        className="glass-surface rounded-t-xl p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-color)' }}>
          Cross-State Comparison
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {chamber === 'house' ? 'House' : 'Senate'} - Compare {selectedSummaries.length} states
        </p>
      </div>

      {/* State selector grid */}
      <div
        className="glass-surface p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="grid grid-cols-5 gap-2">
          {comparison.states.map((summary) => (
            <StateCard
              key={summary.stateCode}
              summary={summary}
              isCurrentState={summary.stateCode.toUpperCase() === currentState.toUpperCase()}
              isSelected={
                selectedStates.includes(summary.stateCode.toLowerCase()) ||
                selectedStates.includes(summary.stateCode.toUpperCase())
              }
              onToggle={() => toggleState(summary.stateCode)}
            />
          ))}
        </div>
      </div>

      {/* Totals summary */}
      <div
        className="glass-surface p-4 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Total Districts
            </div>
            <div className="text-xl font-bold font-display" style={{ color: 'var(--text-color)' }}>
              {selectedSummaries.reduce((a, s) => a + s.totalDistricts, 0)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Avg Coverage
            </div>
            <div className="text-xl font-bold font-display" style={{ color: '#3B82F6' }}>
              {selectedSummaries.length > 0
                ? (selectedSummaries.reduce((a, s) => a + s.demCoverage, 0) / selectedSummaries.length).toFixed(0)
                : 0}%
            </div>
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Dem Seats
            </div>
            <div className="text-xl font-bold font-display" style={{ color: '#1E40AF' }}>
              {selectedSummaries.reduce((a, s) => a + s.demIncumbents, 0)}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Contested
            </div>
            <div className="text-xl font-bold font-display" style={{ color: '#059669' }}>
              {selectedSummaries.reduce((a, s) => a + s.contested, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Metric selector */}
      <div
        className="glass-surface p-3 border-b"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <div className="flex flex-wrap gap-2">
          {metricOptions.map((metric) => {
            const config = getMetricConfig(metric);
            const isActive = activeMetric === metric;
            return (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive ? 'shadow-sm' : 'hover:opacity-80'}
                `}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)'
                    : 'var(--card-bg)',
                  color: isActive ? 'var(--class-purple)' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--class-purple-light)' : 'var(--border-subtle)'}`,
                }}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison bars */}
      <div className="glass-surface p-4">
        <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>
          {getMetricConfig(activeMetric).label} Comparison
        </h3>
        <div className="space-y-3">
          {selectedSummaries
            .sort((a, b) => b[activeMetric] - a[activeMetric])
            .map((summary) => (
              <MetricBar
                key={summary.stateCode}
                summary={summary}
                metric={activeMetric}
                maxValue={maxValues[activeMetric]}
                isCurrentState={summary.stateCode.toUpperCase() === currentState.toUpperCase()}
              />
            ))}
        </div>
      </div>

      {/* Footer */}
      <div
        className="glass-surface rounded-b-xl p-3 text-center border-t"
        style={{ borderColor: 'var(--class-purple-light)' }}
      >
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Click state cards to toggle comparison
        </p>
      </div>
    </div>
  );
}
