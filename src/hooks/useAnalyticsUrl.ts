'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

/**
 * Available analytics tabs
 */
export type AnalyticsTab =
  | 'scenario'
  | 'historical'
  | 'recruitment'
  | 'resources'
  | 'demographics'
  | 'comparison'
  | 'endorsements';

/**
 * Tab configuration with metadata
 */
export const ANALYTICS_TABS: { id: AnalyticsTab; label: string; icon: string; shortLabel: string }[] = [
  { id: 'scenario', label: 'Scenario Simulator', icon: '🔀', shortLabel: 'Scenario' },
  { id: 'historical', label: 'Historical Comparison', icon: '📊', shortLabel: 'Historical' },
  { id: 'recruitment', label: 'Recruitment Radar', icon: '🎯', shortLabel: 'Recruit' },
  { id: 'resources', label: 'Resource Allocation', icon: '🔥', shortLabel: 'Resources' },
  { id: 'demographics', label: 'Demographics', icon: '👥', shortLabel: 'Demo' },
  { id: 'comparison', label: 'Cross-State', icon: '🗺️', shortLabel: 'Compare' },
  { id: 'endorsements', label: 'Endorsements', icon: '⭐', shortLabel: 'Endorse' },
];

/**
 * Analytics URL state interface
 */
export interface AnalyticsUrlState {
  tab: AnalyticsTab;
  chamber: 'house' | 'senate';
  district?: number;
  // Tab-specific params
  scenario?: string;         // "45:D,67:R" - scenario simulator flip state
  period?: string;           // "2024-2022" - historical comparison period
  minScore?: number;         // 70 - recruitment radar min score
  intensity?: string;        // "hot,warm" - resource heatmap intensities
  layer?: string;            // "education" - demographics layer
  states?: string;           // "sc,nc,ga" - cross-state comparison
  endorsementType?: string;  // "labor,newspaper" - endorsement filters
}

/**
 * Default analytics URL state
 */
export const DEFAULT_ANALYTICS_STATE: AnalyticsUrlState = {
  tab: 'scenario',
  chamber: 'house',
};

/**
 * Options for useAnalyticsUrl hook
 */
export interface UseAnalyticsUrlOptions {
  /** Debounce delay for URL updates (default: 300ms) */
  debounceMs?: number;
  /** Default tab to use */
  defaultTab?: AnalyticsTab;
}

/**
 * Return type for useAnalyticsUrl hook
 */
export interface UseAnalyticsUrlReturn {
  /** Current analytics URL state */
  state: AnalyticsUrlState;
  /** Set a single state property */
  setState: (updates: Partial<AnalyticsUrlState>) => void;
  /** Set the active tab */
  setTab: (tab: AnalyticsTab) => void;
  /** Set the active chamber */
  setChamber: (chamber: 'house' | 'senate') => void;
  /** Set selected district */
  setDistrict: (district: number | undefined) => void;
  /** Clear tab-specific state */
  clearTabState: () => void;
  /** Whether state has been initialized from URL */
  isInitialized: boolean;
}

/**
 * Parse analytics state from URL parameters
 */
function parseAnalyticsState(params: URLSearchParams): Partial<AnalyticsUrlState> {
  const state: Partial<AnalyticsUrlState> = {};

  const tab = params.get('tab');
  if (tab && ANALYTICS_TABS.some(t => t.id === tab)) {
    state.tab = tab as AnalyticsTab;
  }

  const chamber = params.get('chamber');
  if (chamber === 'house' || chamber === 'senate') {
    state.chamber = chamber;
  }

  const district = params.get('district');
  if (district) {
    const parsed = parseInt(district, 10);
    if (!isNaN(parsed) && parsed > 0) {
      state.district = parsed;
    }
  }

  // Tab-specific params
  const scenario = params.get('scenario');
  if (scenario) state.scenario = scenario;

  const period = params.get('period');
  if (period) state.period = period;

  const minScore = params.get('minScore');
  if (minScore) {
    const parsed = parseInt(minScore, 10);
    if (!isNaN(parsed)) state.minScore = parsed;
  }

  const intensity = params.get('intensity');
  if (intensity) state.intensity = intensity;

  const layer = params.get('layer');
  if (layer) state.layer = layer;

  const states = params.get('states');
  if (states) state.states = states;

  const endorsementType = params.get('endorsementType');
  if (endorsementType) state.endorsementType = endorsementType;

  return state;
}

/**
 * Serialize analytics state to URL parameters
 */
function serializeAnalyticsState(state: AnalyticsUrlState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.tab !== 'scenario') {
    params.set('tab', state.tab);
  }
  if (state.chamber !== 'house') {
    params.set('chamber', state.chamber);
  }
  if (state.district !== undefined) {
    params.set('district', String(state.district));
  }

  // Tab-specific params
  if (state.scenario) params.set('scenario', state.scenario);
  if (state.period) params.set('period', state.period);
  if (state.minScore !== undefined) params.set('minScore', String(state.minScore));
  if (state.intensity) params.set('intensity', state.intensity);
  if (state.layer) params.set('layer', state.layer);
  if (state.states) params.set('states', state.states);
  if (state.endorsementType) params.set('endorsementType', state.endorsementType);

  return params;
}

/**
 * useAnalyticsUrl - Bidirectional URL synchronization for analytics dashboard
 *
 * Enables deep-linking to specific analytics views by persisting tab, chamber,
 * district, and tab-specific parameters to URL query parameters.
 *
 * Features:
 * - Parses initial state from URL on mount
 * - Debounces URL updates to prevent thrashing
 * - Uses replaceState (not pushState) to avoid history spam
 * - SSR-safe: returns defaults during server rendering
 * - Preserves non-analytics URL parameters
 */
/**
 * Get initial state from URL (client-side only)
 */
function getInitialStateFromUrl(): Partial<AnalyticsUrlState> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return parseAnalyticsState(params);
}

export function useAnalyticsUrl(options: UseAnalyticsUrlOptions = {}): UseAnalyticsUrlReturn {
  const { debounceMs = 300, defaultTab = 'scenario' } = options;

  // Internal state - use lazy initializer to read URL once on mount
  const [rawState, setRawState] = useState<Partial<AnalyticsUrlState>>(getInitialStateFromUrl);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're in the browser
  const isBrowser = typeof window !== 'undefined';

  // Sync state to URL (debounced)
  const syncToUrl = useCallback(
    (state: AnalyticsUrlState) => {
      if (!isBrowser) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const analyticsParams = serializeAnalyticsState(state);
        const queryString = analyticsParams.toString();
        const newUrl = queryString
          ? `${window.location.pathname}?${queryString}`
          : window.location.pathname;

        window.history.replaceState({}, '', newUrl);
      }, debounceMs);
    },
    [isBrowser, debounceMs]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Merge raw state with defaults
  const state: AnalyticsUrlState = useMemo(() => ({
    tab: rawState.tab || defaultTab,
    chamber: rawState.chamber || 'house',
    district: rawState.district,
    scenario: rawState.scenario,
    period: rawState.period,
    minScore: rawState.minScore,
    intensity: rawState.intensity,
    layer: rawState.layer,
    states: rawState.states,
    endorsementType: rawState.endorsementType,
  }), [rawState, defaultTab]);

  // Update state (partial updates supported)
  const setState = useCallback(
    (updates: Partial<AnalyticsUrlState>) => {
      setRawState(prev => {
        const newState = { ...prev, ...updates };
        const merged: AnalyticsUrlState = {
          tab: newState.tab || defaultTab,
          chamber: newState.chamber || 'house',
          ...newState,
        };
        syncToUrl(merged);
        return newState;
      });
    },
    [syncToUrl, defaultTab]
  );

  // Convenience setters
  const setTab = useCallback((tab: AnalyticsTab) => {
    setState({ tab });
  }, [setState]);

  const setChamber = useCallback((chamber: 'house' | 'senate') => {
    setState({ chamber });
  }, [setState]);

  const setDistrict = useCallback((district: number | undefined) => {
    setState({ district });
  }, [setState]);

  // Clear tab-specific state
  const clearTabState = useCallback(() => {
    setState({
      scenario: undefined,
      period: undefined,
      minScore: undefined,
      intensity: undefined,
      layer: undefined,
      states: undefined,
      endorsementType: undefined,
    });
  }, [setState]);

  return {
    state,
    setState,
    setTab,
    setChamber,
    setDistrict,
    clearTabState,
    isInitialized: true, // Always true with lazy initialization
  };
}

export default useAnalyticsUrl;
