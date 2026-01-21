'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CandidatesData, SearchResult } from '@/types/schema';

/**
 * Options for useDistrictSearch hook
 */
export interface UseDistrictSearchOptions {
  /** Maximum number of results to return (default: 10) */
  maxResults?: number;
  /** Filter to specific chamber */
  chamberFilter?: 'house' | 'senate';
  /** Callback when a result is selected */
  onSelect?: (result: SearchResult) => void;
  /** Debounce delay in ms (default: 150) */
  debounceMs?: number;
}

/**
 * Return type for useDistrictSearch hook
 */
export interface UseDistrictSearchReturn {
  /** Current search query */
  query: string;
  /** Set search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchResult[];
  /** Currently selected index for keyboard navigation (-1 = none) */
  selectedIndex: number;
  /** Move selection up/down */
  moveSelection: (delta: number) => void;
  /** Select a specific result */
  selectResult: (result: SearchResult) => void;
  /** Select currently highlighted result */
  selectCurrent: () => void;
  /** Clear search */
  clear: () => void;
  /** Whether search is active (has query) */
  isActive: boolean;
}

/**
 * useDistrictSearch - Search districts by number, candidate name, or county
 *
 * Provides autocomplete search functionality for map navigation.
 *
 * Features:
 * - Search by district number (e.g., "5", "district 5")
 * - Search by candidate name (partial match)
 * - Keyboard navigation support
 * - Configurable max results and chamber filter
 *
 * @param candidatesData - Candidate data to search
 * @param options - Search configuration options
 * @returns Search state and controls
 *
 * @example
 * ```tsx
 * const { query, setQuery, results, selectResult } = useDistrictSearch(candidatesData, {
 *   maxResults: 5,
 *   onSelect: (result) => zoomToDistrict(result.districtNumber),
 * });
 * ```
 */
export function useDistrictSearch(
  candidatesData: CandidatesData,
  options: UseDistrictSearchOptions = {}
): UseDistrictSearchReturn {
  const { maxResults = 10, chamberFilter, onSelect, debounceMs = 150 } = options;

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(-1); // Reset selection on query change
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Search function
  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];

    const q = debouncedQuery.toLowerCase().trim();
    const matches: SearchResult[] = [];

    // Determine which chambers to search
    const chambers: ('house' | 'senate')[] = chamberFilter ? [chamberFilter] : ['house', 'senate'];

    for (const chamber of chambers) {
      const districts = candidatesData[chamber];
      if (!districts) continue;

      for (const [districtNum, district] of Object.entries(districts)) {
        // Match district number
        if (
          districtNum.includes(q) ||
          `district ${districtNum}`.toLowerCase().includes(q) ||
          `${chamber} ${districtNum}`.toLowerCase().includes(q)
        ) {
          const candidateCount = district.candidates.length;
          matches.push({
            type: 'district',
            chamber,
            districtNumber: district.districtNumber,
            label: `${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}`,
            sublabel:
              candidateCount === 0
                ? 'No candidates'
                : `${candidateCount} candidate${candidateCount !== 1 ? 's' : ''}`,
          });
        }

        // Match candidate names
        for (const candidate of district.candidates) {
          if (candidate.name.toLowerCase().includes(q)) {
            matches.push({
              type: 'candidate',
              chamber,
              districtNumber: district.districtNumber,
              label: candidate.name,
              sublabel: `${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}${
                candidate.party ? ` • ${candidate.party}` : ''
              }`,
            });
          }
        }
      }
    }

    // Sort: exact matches first, then candidates, then by label
    return matches
      .sort((a, b) => {
        // Exact district number match first
        const aExact = a.type === 'district' && a.districtNumber.toString() === q;
        const bExact = b.type === 'district' && b.districtNumber.toString() === q;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // Candidates before districts for name searches
        if (a.type !== b.type) {
          return a.type === 'candidate' ? -1 : 1;
        }

        // Alphabetical
        return a.label.localeCompare(b.label);
      })
      .slice(0, maxResults);
  }, [candidatesData, debouncedQuery, chamberFilter, maxResults]);

  // Set query with state update
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
  }, []);

  // Move selection (keyboard navigation)
  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (results.length === 0) return -1;

        const newIndex = prev + delta;
        // Clamp to valid range
        return Math.max(-1, Math.min(newIndex, results.length - 1));
      });
    },
    [results.length]
  );

  // Select a specific result
  const selectResult = useCallback(
    (result: SearchResult) => {
      onSelect?.(result);
      setQueryState('');
      setSelectedIndex(-1);
    },
    [onSelect]
  );

  // Select currently highlighted result
  const selectCurrent = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      selectResult(results[selectedIndex]);
    }
  }, [selectedIndex, results, selectResult]);

  // Clear search
  const clear = useCallback(() => {
    setQueryState('');
    setSelectedIndex(-1);
  }, []);

  return {
    query,
    setQuery,
    results,
    selectedIndex,
    moveSelection,
    selectResult,
    selectCurrent,
    clear,
    isActive: query.trim().length > 0,
  };
}

export default useDistrictSearch;
