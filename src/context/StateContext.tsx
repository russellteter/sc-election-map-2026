'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { StateConfig } from '@/types/stateConfig';
import { getActiveStateConfig, getStateDataPaths, ACTIVE_STATE_CODES } from '@/lib/stateConfig';
import { BASE_PATH } from '@/lib/constants';

/**
 * State Context Value
 * Provides state configuration and utility functions to child components
 */
interface StateContextValue {
  /** Current state configuration */
  stateConfig: StateConfig;
  /** Current state code (uppercase, e.g., "SC") */
  stateCode: string;
  /** Data file paths for current state */
  dataPaths: ReturnType<typeof getStateDataPaths>;
  /** Get URL for a route within this state */
  getStateUrl: (path: string) => string;
  /** Check if this state uses demo data for a specific feature */
  isDemo: (feature: 'candidates' | 'voterIntelligence') => boolean;
}

const StateContext = createContext<StateContextValue | null>(null);

/**
 * Props for StateProvider component
 */
interface StateProviderProps {
  children: ReactNode;
  /** Two-letter state code */
  stateCode: string;
}

/**
 * State Provider Component
 * Wraps state-specific pages and provides state context
 */
export function StateProvider({ children, stateCode }: StateProviderProps) {
  const normalizedCode = stateCode.toUpperCase();
  const stateConfig = getActiveStateConfig(normalizedCode);

  const value = useMemo(() => {
    if (!stateConfig) {
      throw new Error(`Invalid state code: ${stateCode}`);
    }

    const dataPaths = getStateDataPaths(normalizedCode, BASE_PATH);

    return {
      stateConfig,
      stateCode: normalizedCode,
      dataPaths,
      getStateUrl: (path: string) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${BASE_PATH}/${normalizedCode.toLowerCase()}${cleanPath}`;
      },
      isDemo: (feature: 'candidates' | 'voterIntelligence') => {
        return stateConfig.dataSources[feature] === 'demo';
      },
    };
  }, [stateConfig, normalizedCode, stateCode]);

  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
}

/**
 * Hook to access state context
 * Must be used within a StateProvider
 */
export function useStateContext(): StateContextValue {
  const context = useContext(StateContext);
  if (!context) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
}

/**
 * Hook to access state config directly
 * Convenience wrapper around useStateContext
 */
export function useStateConfig(): StateConfig {
  const { stateConfig } = useStateContext();
  return stateConfig;
}

/**
 * Hook to get state-aware URLs
 * Convenience wrapper around useStateContext
 */
export function useStateUrl() {
  const { getStateUrl } = useStateContext();
  return getStateUrl;
}

/**
 * Type-safe state code validation
 */
export function isValidActiveStateCode(code: string): code is typeof ACTIVE_STATE_CODES[number] {
  return ACTIVE_STATE_CODES.includes(code.toUpperCase() as typeof ACTIVE_STATE_CODES[number]);
}
