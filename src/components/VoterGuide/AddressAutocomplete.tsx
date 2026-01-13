'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { preloadBoundaries } from '@/lib/districtLookup';

// Geoapify API configuration
const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || '';

// South Carolina bounding box
const SC_BOUNDS = {
  lon1: -83.35,  // West
  lat1: 32.03,   // South
  lon2: -78.54,  // East
  lat2: 35.21,   // North
};

interface AddressAutocompleteProps {
  onAddressSelect: (address: string, lat: number, lon: number) => void;
  onGeolocationRequest: () => void;
  isLoading: boolean;
  error?: string | null;
  statusMessage?: string | null;
  initialAddress?: string;
  isGeolocating?: boolean;
}

interface GeoapifySuggestion {
  properties: {
    formatted: string;
    lat: number;
    lon: number;
    city?: string;
    state?: string;
    country?: string;
    address_line1?: string;
    address_line2?: string;
  };
}

export default function AddressAutocomplete({
  onAddressSelect,
  onGeolocationRequest,
  isLoading,
  error,
  statusMessage,
  initialAddress = '',
  isGeolocating = false,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState<GeoapifySuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFetching, setIsFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update input when initialAddress changes (e.g., from URL or geolocation)
  useEffect(() => {
    if (initialAddress) {
      setInputValue(initialAddress);
    }
  }, [initialAddress]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions from Geoapify
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Don't fetch without API key - fall back to manual entry
    if (!GEOAPIFY_API_KEY) {
      console.warn('[AddressAutocomplete] No Geoapify API key configured');
      return;
    }

    setIsFetching(true);

    try {
      const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
      url.searchParams.set('text', query);
      url.searchParams.set('apiKey', GEOAPIFY_API_KEY);
      url.searchParams.set('type', 'street');
      url.searchParams.set('filter', `rect:${SC_BOUNDS.lon1},${SC_BOUNDS.lat1},${SC_BOUNDS.lon2},${SC_BOUNDS.lat2}`);
      url.searchParams.set('bias', `rect:${SC_BOUNDS.lon1},${SC_BOUNDS.lat1},${SC_BOUNDS.lon2},${SC_BOUNDS.lat2}`);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '5');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Geoapify error: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      // Filter to only SC addresses
      const scResults = results.filter((item: GeoapifySuggestion) => {
        const state = item.properties.state?.toLowerCase() || '';
        return state.includes('south carolina') || state === 'sc';
      });

      setSuggestions(scResults);
      setIsOpen(scResults.length > 0);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error('[AddressAutocomplete] Fetch error:', err);
      setSuggestions([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  // Debounced input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API calls
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelect = (suggestion: GeoapifySuggestion) => {
    const { formatted, lat, lon } = suggestion.properties;
    setInputValue(formatted);
    setIsOpen(false);
    setSuggestions([]);
    onAddressSelect(formatted, lat, lon);
  };

  // Handle form submission (manual entry without autocomplete)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      setIsOpen(false);
      // When submitting manually, we don't have coordinates yet
      // The parent component will need to geocode
      onAddressSelect(inputValue.trim(), 0, 0);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (inputValue.trim()) {
          setIsOpen(false);
          onAddressSelect(inputValue.trim(), 0, 0);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="glass-surface rounded-lg p-6 animate-entrance">
      <h2
        className="font-display font-semibold text-xl mb-2"
        style={{ color: 'var(--text-color)' }}
      >
        Find Your Districts
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Enter your South Carolina address to see the candidates running in your districts.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            {/* Location Icon */}
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
                // Lazy load GeoJSON boundaries (2MB) on first interaction
                preloadBoundaries().catch(console.error);
              }}
              placeholder="123 Main Street, Columbia, SC 29201"
              disabled={isLoading || isGeolocating}
              className="w-full pl-10 pr-12 py-3 rounded-lg text-base transition-all focus:outline-none focus:ring-2"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-color)',
                fontSize: '16px',
              }}
              onFocusCapture={(e) => {
                e.target.style.borderColor = 'var(--class-purple)';
                e.target.style.boxShadow = '0 0 0 3px var(--class-purple-bg)';
              }}
              onBlurCapture={(e) => {
                // Delay to allow click on dropdown
                setTimeout(() => {
                  e.target.style.borderColor = 'var(--border-subtle)';
                  e.target.style.boxShadow = 'none';
                }, 150);
              }}
              aria-label="Enter your South Carolina address"
              aria-describedby={error ? 'address-error' : undefined}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
              role="combobox"
              aria-autocomplete="list"
              autoComplete="off"
            />

            {/* Geolocation Button */}
            <button
              type="button"
              onClick={onGeolocationRequest}
              disabled={isLoading || isGeolocating}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Use my current location"
              aria-label="Use my current location"
            >
              {isGeolocating ? (
                <svg className="w-5 h-5 animate-spin" style={{ color: 'var(--class-purple)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M2 12h2m16 0h2" />
                </svg>
              )}
            </button>

            {/* Loading indicator for autocomplete */}
            {isFetching && (
              <div className="absolute right-12 top-1/2 -translate-y-1/2">
                <svg className="w-4 h-4 animate-spin" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}

            {/* Autocomplete Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 w-full mt-1 rounded-lg shadow-lg overflow-y-auto"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-subtle)',
                  backdropFilter: 'blur(12px)',
                  maxHeight: 'min(60vh, 320px)',
                  overscrollBehavior: 'contain',
                }}
                role="listbox"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className="w-full px-4 py-3 text-left transition-colors flex items-start gap-3"
                    style={{
                      background: highlightedIndex === index ? 'var(--class-purple-bg)' : 'transparent',
                      color: 'var(--text-color)',
                      borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                    role="option"
                    aria-selected={highlightedIndex === index}
                  >
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {suggestion.properties.address_line1 || suggestion.properties.formatted.split(',')[0]}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {suggestion.properties.address_line2 || suggestion.properties.formatted.split(',').slice(1).join(',')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isGeolocating || !inputValue.trim()}
            className="px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--class-purple)',
              color: 'white',
            }}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Looking up...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find My Districts
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Status Message */}
      {statusMessage && !error && (
        <div
          className="flex items-center gap-2 mt-4 p-3 rounded-lg"
          style={{
            background: 'var(--class-purple-bg)',
            border: '1px solid var(--class-purple-light)',
          }}
        >
          <svg className="w-4 h-4 flex-shrink-0 animate-spin" style={{ color: 'var(--class-purple)' }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--class-purple)' }}>
            {statusMessage}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          id="address-error"
          className="flex items-start gap-2 mt-4 p-3 rounded-lg animate-entrance"
          style={{
            background: 'var(--color-at-risk-bg)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
          }}
          role="alert"
        >
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: 'var(--color-at-risk)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm" style={{ color: 'var(--color-at-risk)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Help Text */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {GEOAPIFY_API_KEY
            ? 'Start typing for address suggestions, or use the crosshair to detect your location.'
            : 'Enter a complete street address including city and state.'
          }
        </p>
        {!GEOAPIFY_API_KEY && (
          <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--class-purple-bg)', color: 'var(--class-purple)' }}>
            Manual entry mode
          </span>
        )}
      </div>
    </div>
  );
}
