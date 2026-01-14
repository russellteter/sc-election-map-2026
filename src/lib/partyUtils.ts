/**
 * Party classification and styling utilities
 *
 * Consolidates party badge logic used across multiple components
 * to maintain consistency and reduce code duplication.
 */

export type Party = 'democratic' | 'republican' | 'independent' | 'libertarian' | null;

/**
 * Get CSS class for party badge styling
 *
 * Maps party affiliations to predefined CSS classes for badge styling.
 * Used in components that display party badges with consistent styling.
 *
 * @param party - Party affiliation string (case-insensitive)
 * @returns CSS class name for the party badge
 *
 * @example
 * ```tsx
 * <span className={getPartyBadgeClass(candidate.party)}>
 *   {candidate.party}
 * </span>
 * ```
 */
export function getPartyBadgeClass(party: string | null): string {
  const normalized = party?.toLowerCase();

  switch (normalized) {
    case 'democratic':
      return 'badge-democrat';
    case 'republican':
      return 'badge-republican';
    case 'independent':
      return 'badge-independent';
    case 'libertarian':
      return 'badge-libertarian';
    default:
      return 'badge-unknown';
  }
}

/**
 * Get party colors for inline styles
 *
 * Returns an object with background, text, and border colors for the specified party.
 * Used when CSS classes are not available or when dynamic styling is needed.
 *
 * @param party - Party affiliation string (case-insensitive)
 * @returns Object containing bg, text, and border color values
 *
 * @example
 * ```tsx
 * const colors = getPartyColor(candidate.party);
 * <div style={{
 *   backgroundColor: colors.bg,
 *   color: colors.text,
 *   border: `1px solid ${colors.border}`
 * }}>
 *   {candidate.name}
 * </div>
 * ```
 */
export function getPartyColor(party: string | null): {
  bg: string;
  text: string;
  border: string;
} {
  const normalized = party?.toLowerCase();

  switch (normalized) {
    case 'democratic':
      return {
        bg: 'rgba(59, 130, 246, 0.1)',   // blue-500 at 10% opacity
        text: '#2563eb',                  // blue-600
        border: 'rgba(59, 130, 246, 0.3)' // blue-500 at 30% opacity
      };
    case 'republican':
      return {
        bg: 'rgba(239, 68, 68, 0.1)',    // red-500 at 10% opacity
        text: '#dc2626',                  // red-600
        border: 'rgba(239, 68, 68, 0.3)' // red-500 at 30% opacity
      };
    case 'independent':
      return {
        bg: 'rgba(107, 114, 128, 0.1)',   // gray-500 at 10% opacity
        text: '#6b7280',                   // gray-500
        border: 'rgba(107, 114, 128, 0.3)' // gray-500 at 30% opacity
      };
    case 'libertarian':
      return {
        bg: 'rgba(245, 158, 11, 0.1)',    // amber-500 at 10% opacity
        text: '#d97706',                   // amber-600
        border: 'rgba(245, 158, 11, 0.3)' // amber-500 at 30% opacity
      };
    default:
      return {
        bg: 'rgba(107, 114, 128, 0.1)',   // gray-500 at 10% opacity
        text: '#6b7280',                   // gray-500
        border: 'rgba(107, 114, 128, 0.3)' // gray-500 at 30% opacity
      };
  }
}

/**
 * Normalize party name for display
 *
 * Converts party affiliation to a user-friendly display format with proper capitalization.
 * Handles null/undefined values gracefully.
 *
 * @param party - Party affiliation string (case-insensitive)
 * @returns Properly capitalized party name or "Unknown"
 *
 * @example
 * ```tsx
 * normalizePartyName('democratic') // Returns: "Democratic"
 * normalizePartyName('REPUBLICAN') // Returns: "Republican"
 * normalizePartyName(null)         // Returns: "Unknown"
 * ```
 */
export function normalizePartyName(party: string | null): string {
  if (!party) return 'Unknown';

  const normalized = party.toLowerCase();

  // Special case handling for common abbreviations
  if (normalized === 'd' || normalized === 'dem') return 'Democratic';
  if (normalized === 'r' || normalized === 'rep') return 'Republican';
  if (normalized === 'i' || normalized === 'ind') return 'Independent';
  if (normalized === 'l' || normalized === 'lib') return 'Libertarian';

  // Default: capitalize first letter
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Check if a party is a major party (Democratic or Republican)
 *
 * @param party - Party affiliation string (case-insensitive)
 * @returns true if party is Democratic or Republican
 *
 * @example
 * ```tsx
 * isMajorParty('Democratic')  // Returns: true
 * isMajorParty('Independent') // Returns: false
 * ```
 */
export function isMajorParty(party: string | null): boolean {
  const normalized = party?.toLowerCase();
  return normalized === 'democratic' || normalized === 'republican';
}

/**
 * Get party abbreviation
 *
 * @param party - Party affiliation string (case-insensitive)
 * @returns Single-letter party abbreviation
 *
 * @example
 * ```tsx
 * getPartyAbbreviation('Democratic')  // Returns: "D"
 * getPartyAbbreviation('Republican')  // Returns: "R"
 * getPartyAbbreviation('Independent') // Returns: "I"
 * ```
 */
export function getPartyAbbreviation(party: string | null): string {
  const normalized = party?.toLowerCase();

  switch (normalized) {
    case 'democratic':
      return 'D';
    case 'republican':
      return 'R';
    case 'independent':
      return 'I';
    case 'libertarian':
      return 'L';
    default:
      return '?';
  }
}
