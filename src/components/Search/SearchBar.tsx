'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { CandidatesData, SearchResult } from '@/types/schema';

interface SearchBarProps {
  candidatesData: CandidatesData;
  onSelectResult: (result: SearchResult) => void;
  className?: string;
}

export default function SearchBar({
  candidatesData,
  onSelectResult,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Search function
  const search = useCallback(
    (searchQuery: string): SearchResult[] => {
      if (!searchQuery.trim()) return [];

      const q = searchQuery.toLowerCase().trim();
      const matches: SearchResult[] = [];

      // Search both chambers
      for (const chamber of ['house', 'senate'] as const) {
        const districts = candidatesData[chamber];

        for (const [districtNum, district] of Object.entries(districts)) {
          // Match district number
          if (districtNum.includes(q) || `district ${districtNum}`.includes(q)) {
            const candidateCount = district.candidates.length;
            matches.push({
              type: 'district',
              chamber,
              districtNumber: district.districtNumber,
              label: `${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}`,
              sublabel: candidateCount === 0
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

      // Sort: candidates first (more specific), then by label
      return matches
        .sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'candidate' ? -1 : 1;
          }
          return a.label.localeCompare(b.label);
        })
        .slice(0, 10); // Limit to 10 results
    },
    [candidatesData]
  );

  // Update results when query changes
  useEffect(() => {
    const searchResults = search(query);
    setResults(searchResults);
    setSelectedIndex(-1);
    // Keep dropdown open if there's a query (to show "no results" message)
    setIsOpen(query.trim().length > 0);
  }, [query, search]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          onSelectResult(results[selectedIndex]);
          setQuery('');
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click on result
  const handleResultClick = (result: SearchResult) => {
    onSelectResult(result);
    setQuery('');
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      <label htmlFor="search-input" className="sr-only">
        Search candidates or districts
      </label>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
          style={{ color: 'var(--color-text-muted, #4A5568)' }}
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
          id="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search candidates or districts..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all"
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            borderColor: isOpen ? 'var(--class-purple, #4739E7)' : 'var(--class-purple-light, #DAD7FA)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results"
          aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
          aria-autocomplete="list"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              style={{ color: 'var(--color-text-muted, #4A5568)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          id="search-results"
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-64 overflow-auto rounded-lg border shadow-lg"
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            borderColor: 'var(--class-purple-light, #DAD7FA)',
          }}
        >
          {results.map((result, index) => (
            <li
              key={`${result.type}-${result.chamber}-${result.districtNumber}-${result.label}`}
              id={`search-result-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className="px-4 py-2 cursor-pointer transition-colors"
              style={{
                background: index === selectedIndex ? 'var(--class-purple-bg, #F6F6FE)' : 'transparent',
              }}
              onClick={() => handleResultClick(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-2">
                {result.type === 'candidate' ? (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: 'var(--class-purple, #4739E7)' }}
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
                ) : (
                  <svg
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: 'var(--color-text-muted, #4A5568)' }}
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
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-sm truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {result.label}
                  </div>
                  {result.sublabel && (
                    <div
                      className="text-xs truncate"
                      style={{ color: 'var(--color-text-muted, #4A5568)' }}
                    >
                      {result.sublabel}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {isOpen && query && results.length === 0 && (
        <div
          className="absolute z-50 w-full mt-1 p-4 rounded-lg border text-center text-sm"
          style={{
            background: 'var(--card-bg, #FFFFFF)',
            borderColor: 'var(--class-purple-light, #DAD7FA)',
            color: 'var(--color-text-muted, #4A5568)',
          }}
        >
          No candidates or districts found
        </div>
      )}
    </div>
  );
}
