/**
 * Lens Type Definitions for Multi-Lens Visualization System
 *
 * The lens system transforms the map from a single view into a strategic
 * intelligence platform with 4 switchable visualization modes.
 */

/**
 * Lens identifiers - the 4 available visualization modes
 */
export type LensId = 'incumbents' | 'dem-filing' | 'opportunity' | 'battleground';

/**
 * Legend item configuration for a lens
 */
export interface LensLegendItem {
  /** Color hex code or CSS value */
  color: string;
  /** Pattern ID if using SVG pattern instead of solid color */
  pattern?: string;
  /** Short label for legend display */
  label: string;
  /** Longer description for tooltips/accessibility */
  description: string;
}

/**
 * Complete definition of a lens including display properties and legend
 */
export interface LensDefinition {
  /** Unique lens identifier */
  id: LensId;
  /** Display label for the lens */
  label: string;
  /** Short label for mobile/compact displays */
  shortLabel: string;
  /** Description of what this lens shows */
  description: string;
  /** Icon name or SVG path (optional) */
  icon?: string;
  /** Legend items for this lens */
  legendItems: LensLegendItem[];
  /** Footnote text for the legend */
  footnote: string;
}

/**
 * All lens definitions with their configurations
 */
export const LENS_DEFINITIONS: Record<LensId, LensDefinition> = {
  /**
   * Incumbents Lens (Default)
   * Traditional R/D incumbent display - shows current party control
   * WCAG AA compliant colors
   */
  incumbents: {
    id: 'incumbents',
    label: 'Incumbents',
    shortLabel: 'Inc.',
    description: 'Current party control of each district',
    icon: 'users',
    legendItems: [
      {
        color: '#1E40AF',
        label: 'Dem Incumbent',
        description: 'Current representative is Democrat',
      },
      {
        color: '#DC2626',
        label: 'Rep Incumbent',
        description: 'Current representative is Republican',
      },
      {
        color: '#7C3AED',
        label: 'Open Seat',
        description: 'No incumbent running',
      },
      {
        color: '#D1D5DB',
        label: 'Unknown',
        description: 'Incumbent data unavailable',
      },
    ],
    footnote: 'Based on current officeholder data',
  },

  /**
   * Dem Filing Lens
   * Shows Democratic coverage vs gaps in candidate filing
   */
  'dem-filing': {
    id: 'dem-filing',
    label: 'Dem Filing',
    shortLabel: 'Filing',
    description: 'Democratic candidate filing coverage',
    icon: 'file-text',
    legendItems: [
      {
        color: '#1E40AF',
        label: 'Dem Filed',
        description: 'Democratic candidate has filed',
      },
      {
        color: '#3B82F6',
        label: 'Dem Incumbent',
        description: 'Dem incumbent district (may not have filed yet)',
      },
      {
        color: '#9333EA',
        label: 'Priority Gap',
        description: 'No Dem filed, margin ≤15pts (urgent)',
      },
      {
        color: '#A78BFA',
        pattern: 'priority-gap',
        label: 'Opportunity',
        description: 'No Dem filed, margin ≤10pts',
      },
      {
        color: '#E5E7EB',
        label: 'Safe R',
        description: 'No Dem filed, margin >15pts',
      },
    ],
    footnote: 'Filing status from SC Ethics Commission',
  },

  /**
   * Opportunity Lens
   * Heat map showing strategic opportunity tiers
   * WCAG AA compliant purple gradient with clear tier differentiation
   */
  opportunity: {
    id: 'opportunity',
    label: 'Opportunity',
    shortLabel: 'Opp.',
    description: 'Strategic opportunity tiers for investment',
    icon: 'target',
    legendItems: [
      {
        color: '#6D28D9',
        label: 'HOT',
        description: 'Top priority (≤5pt margin)',
      },
      {
        color: '#8B5CF6',
        label: 'WARM',
        description: 'Strong opportunity (6-10pt margin)',
      },
      {
        color: '#C4B5FD',
        label: 'POSSIBLE',
        description: 'Worth watching (11-15pt margin)',
      },
      {
        color: '#9CA3AF',
        label: 'LONG_SHOT',
        description: 'Unlikely flip (>15pt margin)',
      },
      {
        color: '#1E40AF',
        label: 'DEFENSIVE',
        description: 'Dem-held seat to protect',
      },
    ],
    footnote: 'Based on historical margin and filing status',
  },

  /**
   * Battleground Lens
   * Shows contested vs uncontested races
   * WCAG AA compliant colors
   */
  battleground: {
    id: 'battleground',
    label: 'Battleground',
    shortLabel: 'Battle',
    description: 'Contested races with both D and R candidates',
    icon: 'swords',
    legendItems: [
      {
        color: '#7C3AED',
        label: 'Contested',
        description: 'Both D and R candidates filed',
      },
      {
        color: '#3B82F6',
        label: 'Dem Only',
        description: 'Only Democratic candidate filed',
      },
      {
        color: '#EF4444',
        label: 'Rep Only',
        description: 'Only Republican candidate filed',
      },
      {
        color: '#E5E7EB',
        label: 'None Filed',
        description: 'No candidates have filed',
      },
    ],
    footnote: 'Based on current candidate filings',
  },
};

/**
 * Default lens when none specified
 */
export const DEFAULT_LENS: LensId = 'incumbents';

/**
 * Validate if a string is a valid lens ID
 */
export function isValidLensId(value: unknown): value is LensId {
  return (
    typeof value === 'string' &&
    ['incumbents', 'dem-filing', 'opportunity', 'battleground'].includes(value)
  );
}

/**
 * Get lens definition by ID with fallback to default
 */
export function getLensDefinition(lensId: LensId | string): LensDefinition {
  if (isValidLensId(lensId)) {
    return LENS_DEFINITIONS[lensId];
  }
  return LENS_DEFINITIONS[DEFAULT_LENS];
}

/**
 * Array of all lens IDs for iteration
 */
export const ALL_LENS_IDS: LensId[] = ['incumbents', 'dem-filing', 'opportunity', 'battleground'];
