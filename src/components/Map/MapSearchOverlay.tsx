'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDistrictSearch, type UseDistrictSearchOptions } from '@/hooks/useDistrictSearch';
import type { CandidatesData, SearchResult } from '@/types/schema';

export interface MapSearchOverlayProps {
  /** Candidate data to search */
  candidatesData: CandidatesData;
  /** Whether the search overlay is open */
  isOpen: boolean;
  /** Callback to close the overlay */
  onClose: () => void;
  /** Callback when a district is selected */
  onSelect: (result: SearchResult) => void;
  /** Filter to specific chamber */
  chamberFilter?: 'house' | 'senate';
  /** Maximum results to show */
  maxResults?: number;
}

/**
 * MapSearchOverlay - Keyboard-accessible search overlay for district maps
 *
 * Features:
 * - Autocomplete search by district number or candidate name
 * - Keyboard navigation (arrows, enter, escape)
 * - Opens with `/` or `Cmd+K` keyboard shortcuts (handled externally)
 * - Closes on escape or outside click
 * - Accessible with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <MapSearchOverlay
 *   candidatesData={candidatesData}
 *   isOpen={showSearch}
 *   onClose={() => setShowSearch(false)}
 *   onSelect={(result) => {
 *     zoomToDistrict(result.districtNumber, result.chamber);
 *     setShowSearch(false);
 *   }}
 * />
 * ```
 */
export default function MapSearchOverlay({
  candidatesData,
  isOpen,
  onClose,
  onSelect,
  chamberFilter,
  maxResults = 8,
}: MapSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const searchOptions: UseDistrictSearchOptions = {
    maxResults,
    chamberFilter,
    onSelect: (result) => {
      onSelect(result);
      onClose();
    },
  };

  const { query, setQuery, results, selectedIndex, moveSelection, selectCurrent, clear } =
    useDistrictSearch(candidatesData, searchOptions);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      clear();
    }
  }, [isOpen, clear]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveSelection(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveSelection(-1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0) {
            selectCurrent();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [moveSelection, selectedIndex, selectCurrent, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      selectedEl?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle outside click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search districts"
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
        style={{
          background: 'var(--card-bg, #FFFFFF)',
          border: '1px solid var(--class-purple-light, #DAD7FA)',
        }}
      >
        {/* Search input */}
        <div className="relative p-3 border-b" style={{ borderColor: 'var(--class-purple-light)' }}>
          <label htmlFor="map-search-input" className="sr-only">
            Search districts or candidates
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5"
              style={{ color: 'var(--text-muted)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={inputRef}
              id="map-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by district number or candidate name..."
              className="w-full pl-11 pr-10 py-3 text-base rounded-lg border-0 focus:outline-none focus:ring-2"
              style={{
                background: 'transparent',
                color: 'var(--text-color)',
                caretColor: 'var(--class-purple)',
              }}
              role="combobox"
              aria-expanded={results.length > 0}
              aria-controls="map-search-results"
              aria-activedescendant={
                selectedIndex >= 0 ? `map-search-result-${selectedIndex}` : undefined
              }
              aria-autocomplete="list"
              autoComplete="off"
            />
            {/* Keyboard shortcut hint */}
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--class-purple-bg)',
                color: 'var(--text-muted)',
              }}
            >
              ESC
            </div>
          </div>
        </div>

        {/* Results list */}
        {results.length > 0 && (
          <ul
            ref={listRef}
            id="map-search-results"
            role="listbox"
            className="max-h-72 overflow-auto py-2"
          >
            {results.map((result, index) => (
              <li
                key={`${result.type}-${result.chamber}-${result.districtNumber}-${result.label}`}
                id={`map-search-result-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className="px-4 py-2.5 cursor-pointer transition-colors"
                style={{
                  background:
                    index === selectedIndex ? 'var(--class-purple-bg, #F6F6FE)' : 'transparent',
                }}
                onClick={() => {
                  onSelect(result);
                  onClose();
                }}
                onMouseEnter={() => moveSelection(index - selectedIndex)}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  {result.type === 'candidate' ? (
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--class-purple-bg)' }}
                    >
                      <svg
                        className="w-4 h-4"
                        style={{ color: 'var(--class-purple)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--class-purple-bg)' }}
                    >
                      <svg
                        className="w-4 h-4"
                        style={{ color: 'var(--class-purple)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium truncate"
                      style={{ color: 'var(--text-color)' }}
                    >
                      {result.label}
                    </div>
                    {result.sublabel && (
                      <div className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                        {result.sublabel}
                      </div>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  {index === selectedIndex && (
                    <svg
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: 'var(--class-purple)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* No results message */}
        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <svg
              className="w-10 h-10 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>No districts or candidates found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}

        {/* Empty state */}
        {!query && (
          <div className="px-4 py-6 text-center" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">
              Type to search by district number or candidate name
            </p>
            <div className="flex justify-center gap-2 mt-3 text-xs">
              <span className="px-2 py-1 rounded" style={{ background: 'var(--class-purple-bg)' }}>
                ↑↓ Navigate
              </span>
              <span className="px-2 py-1 rounded" style={{ background: 'var(--class-purple-bg)' }}>
                ↵ Select
              </span>
              <span className="px-2 py-1 rounded" style={{ background: 'var(--class-purple-bg)' }}>
                ESC Close
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { MapSearchOverlay };
