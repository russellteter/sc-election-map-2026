/**
 * State Configuration Loader
 *
 * Provides utilities for loading and accessing state configurations
 * in the multi-state election intelligence platform.
 */

import type { StateConfig, AnyStateConfig, StateConfigMap, InactiveStateConfig, isActiveState as isActiveStateType } from '@/types/stateConfig';

// Import all state configs statically for static export compatibility
import scConfig from '@/config/states/sc.json';
import ncConfig from '@/config/states/nc.json';
import gaConfig from '@/config/states/ga.json';
import flConfig from '@/config/states/fl.json';
import vaConfig from '@/config/states/va.json';

// Re-export the type guard
export { isActiveState } from '@/types/stateConfig';

/**
 * All active state configurations
 */
const activeStates: Record<string, StateConfig> = {
  SC: scConfig as StateConfig,
  NC: ncConfig as StateConfig,
  GA: gaConfig as StateConfig,
  FL: flConfig as StateConfig,
  VA: vaConfig as StateConfig,
};

/**
 * Inactive states (placeholder for 50-state coverage)
 */
const inactiveStates: InactiveStateConfig[] = [
  { code: 'AL', name: 'Alabama', isActive: false },
  { code: 'AK', name: 'Alaska', isActive: false },
  { code: 'AZ', name: 'Arizona', isActive: false },
  { code: 'AR', name: 'Arkansas', isActive: false },
  { code: 'CA', name: 'California', isActive: false },
  { code: 'CO', name: 'Colorado', isActive: false },
  { code: 'CT', name: 'Connecticut', isActive: false },
  { code: 'DE', name: 'Delaware', isActive: false },
  // FL is active
  // GA is active
  { code: 'HI', name: 'Hawaii', isActive: false },
  { code: 'ID', name: 'Idaho', isActive: false },
  { code: 'IL', name: 'Illinois', isActive: false },
  { code: 'IN', name: 'Indiana', isActive: false },
  { code: 'IA', name: 'Iowa', isActive: false },
  { code: 'KS', name: 'Kansas', isActive: false },
  { code: 'KY', name: 'Kentucky', isActive: false },
  { code: 'LA', name: 'Louisiana', isActive: false },
  { code: 'ME', name: 'Maine', isActive: false },
  { code: 'MD', name: 'Maryland', isActive: false },
  { code: 'MA', name: 'Massachusetts', isActive: false },
  { code: 'MI', name: 'Michigan', isActive: false },
  { code: 'MN', name: 'Minnesota', isActive: false },
  { code: 'MS', name: 'Mississippi', isActive: false },
  { code: 'MO', name: 'Missouri', isActive: false },
  { code: 'MT', name: 'Montana', isActive: false },
  { code: 'NE', name: 'Nebraska', isActive: false },
  { code: 'NV', name: 'Nevada', isActive: false },
  { code: 'NH', name: 'New Hampshire', isActive: false },
  { code: 'NJ', name: 'New Jersey', isActive: false },
  { code: 'NM', name: 'New Mexico', isActive: false },
  { code: 'NY', name: 'New York', isActive: false },
  // NC is active
  { code: 'ND', name: 'North Dakota', isActive: false },
  { code: 'OH', name: 'Ohio', isActive: false },
  { code: 'OK', name: 'Oklahoma', isActive: false },
  { code: 'OR', name: 'Oregon', isActive: false },
  { code: 'PA', name: 'Pennsylvania', isActive: false },
  { code: 'RI', name: 'Rhode Island', isActive: false },
  // SC is active
  { code: 'SD', name: 'South Dakota', isActive: false },
  { code: 'TN', name: 'Tennessee', isActive: false },
  { code: 'TX', name: 'Texas', isActive: false },
  { code: 'UT', name: 'Utah', isActive: false },
  // VA is active
  { code: 'VT', name: 'Vermont', isActive: false },
  { code: 'WA', name: 'Washington', isActive: false },
  { code: 'WV', name: 'West Virginia', isActive: false },
  { code: 'WI', name: 'Wisconsin', isActive: false },
  { code: 'WY', name: 'Wyoming', isActive: false },
  { code: 'DC', name: 'District of Columbia', isActive: false },
];

/**
 * Combined map of all states (active and inactive)
 */
const allStatesMap: StateConfigMap = {
  ...activeStates,
  ...Object.fromEntries(inactiveStates.map(s => [s.code, s])),
};

/**
 * Get configuration for a specific state
 * @param stateCode Two-letter state code (e.g., "SC")
 * @returns State configuration or undefined if not found
 */
export function getStateConfig(stateCode: string): AnyStateConfig | undefined {
  return allStatesMap[stateCode.toUpperCase()];
}

/**
 * Get configuration for an active state only
 * @param stateCode Two-letter state code (e.g., "SC")
 * @returns Active state configuration or undefined
 */
export function getActiveStateConfig(stateCode: string): StateConfig | undefined {
  const config = activeStates[stateCode.toUpperCase()];
  return config;
}

/**
 * Get all active state configurations
 * @returns Array of active state configs sorted by displayOrder
 */
export function getActiveStates(): StateConfig[] {
  return Object.values(activeStates).sort(
    (a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)
  );
}

/**
 * Get all state configurations (active and inactive)
 * @returns Array of all state configs
 */
export function getAllStates(): AnyStateConfig[] {
  return [
    ...Object.values(activeStates),
    ...inactiveStates,
  ].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all inactive states
 * @returns Array of inactive state configs
 */
export function getInactiveStates(): InactiveStateConfig[] {
  return inactiveStates.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if a state code is valid
 * @param stateCode Two-letter state code
 */
export function isValidStateCode(stateCode: string): boolean {
  return stateCode.toUpperCase() in allStatesMap;
}

/**
 * Check if a state is active (has full data)
 * @param stateCode Two-letter state code
 */
export function isStateActive(stateCode: string): boolean {
  return stateCode.toUpperCase() in activeStates;
}

/**
 * Get data file paths for a specific state
 * @param stateCode Two-letter state code
 * @param basePath Base URL path for data files
 */
export function getStateDataPaths(stateCode: string, basePath: string = '') {
  const code = stateCode.toLowerCase();
  const stateDataBase = `${basePath}/data/states/${code}`;

  return {
    // Core data
    config: `${stateDataBase}/config.json`,
    candidates: `${stateDataBase}/candidates.json`,
    districts: `${stateDataBase}/districts.json`,

    // Demo data (generated)
    voterIntelligence: `${stateDataBase}/demo/voter-intelligence.json`,
    opportunityScores: `${stateDataBase}/demo/opportunity-scores.json`,
    mobilization: `${stateDataBase}/demo/mobilization.json`,
    endorsements: `${stateDataBase}/demo/endorsements.json`,
    earlyVote: `${stateDataBase}/demo/early-vote.json`,

    // Maps
    houseDistrictsGeoJson: `${basePath}/maps/${code}-house-districts.geojson`,
    senateDistrictsGeoJson: `${basePath}/maps/${code}-senate-districts.geojson`,
    houseDistrictsSvg: `${basePath}/maps/${code}-house-districts.svg`,
    senateDistrictsSvg: `${basePath}/maps/${code}-senate-districts.svg`,
  };
}

/**
 * Get the default state code (first active state)
 */
export function getDefaultStateCode(): string {
  const states = getActiveStates();
  return states[0]?.code ?? 'SC';
}

/**
 * Active state codes as a constant array (useful for static generation)
 */
export const ACTIVE_STATE_CODES = ['SC', 'NC', 'GA', 'FL', 'VA'] as const;
export type ActiveStateCode = typeof ACTIVE_STATE_CODES[number];
