'use client';

import { useState, useCallback, useRef } from 'react';
import { geocodeAddress, getCurrentLocation, reverseGeocode } from '@/lib/geocoding';
import { findDistricts, type DistrictResult } from '@/lib/districtLookup';

interface AddressSearchProps {
  /** Currently active chamber for district selection */
  chamber: 'house' | 'senate';
  /** Callback when a district is found - parent should highlight/select it */
  onDistrictFound: (districtNumber: number, chamber: 'house' | 'senate') => void;
  /** Optional callback with all district results */
  onAllDistrictsFound?: (result: DistrictResult & { address?: string }) => void;
  /** Optional className for custom styling */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
}

type SearchState = 'idle' | 'searching' | 'locating' | 'success' | 'error';

/**
 * AddressSearch - Find your district by address or current location
 *
 * Features:
 * - Address text input with geocoding
 * - "Use My Location" button for GPS-based lookup
 * - Loading states with spinner
 * - Error handling with user-friendly messages
 * - Emits district selection to parent for map highlighting
 */
export default function AddressSearch({
  chamber,
  onDistrictFound,
  onAllDistrictsFound,
  className = '',
  placeholder = 'Enter address (e.g., 123 Main St, Columbia, SC)',
}: AddressSearchProps) {
  const [address, setAddress] = useState('');
  const [state, setState] = useState<SearchState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [foundAddress, setFoundAddress] = useState<string | null>(null);
  const [foundResult, setFoundResult] = useState<DistrictResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Perform district lookup from coordinates
   */
  const lookupDistricts = useCallback(
    async (lat: number, lon: number, displayAddress?: string) => {
      const result = await findDistricts(lat, lon);

      if (!result.success) {
        setState('error');
        setError(result.error || 'Could not find districts for this location.');
        return;
      }

      setFoundResult(result);
      setFoundAddress(displayAddress || null);
      setState('success');

      // Emit the district for the active chamber
      const districtNum = chamber === 'house' ? result.houseDistrict : result.senateDistrict;
      if (districtNum) {
        onDistrictFound(districtNum, chamber);
      }

      // Emit all results if callback provided
      if (onAllDistrictsFound) {
        onAllDistrictsFound({ ...result, address: displayAddress });
      }
    },
    [chamber, onDistrictFound, onAllDistrictsFound]
  );

  /**
   * Handle address search submission
   */
  const handleSearch = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      const trimmed = address.trim();
      if (!trimmed) {
        setError('Please enter an address.');
        return;
      }

      setState('searching');
      setError(null);
      setFoundResult(null);
      setFoundAddress(null);

      // Geocode the address
      const geocodeResult = await geocodeAddress(trimmed);

      if (!geocodeResult.success || !geocodeResult.lat || !geocodeResult.lon) {
        setState('error');
        setError(geocodeResult.error || 'Could not find this address.');
        return;
      }

      // Look up districts
      await lookupDistricts(geocodeResult.lat, geocodeResult.lon, geocodeResult.displayName);
    },
    [address, lookupDistricts]
  );

  /**
   * Handle "Use My Location" button
   */
  const handleUseLocation = useCallback(async () => {
    setState('locating');
    setError(null);
    setFoundResult(null);
    setFoundAddress(null);

    // Get current location
    const location = await getCurrentLocation();

    if (!location) {
      setState('error');
      setError('Could not access your location. Please check your browser permissions or enter an address manually.');
      return;
    }

    // Reverse geocode for display
    const reverseResult = await reverseGeocode(location.lat, location.lon);
    const displayAddress = reverseResult.success ? reverseResult.displayName : undefined;

    // Look up districts
    await lookupDistricts(location.lat, location.lon, displayAddress);
  }, [lookupDistricts]);

  /**
   * Clear results and reset state
   */
  const handleClear = useCallback(() => {
    setAddress('');
    setState('idle');
    setError(null);
    setFoundResult(null);
    setFoundAddress(null);
    inputRef.current?.focus();
  }, []);

  /**
   * Switch to the other chamber's district
   */
  const handleSwitchChamber = useCallback(
    (targetChamber: 'house' | 'senate') => {
      if (!foundResult) return;

      const districtNum = targetChamber === 'house' ? foundResult.houseDistrict : foundResult.senateDistrict;
      if (districtNum) {
        onDistrictFound(districtNum, targetChamber);
      }
    },
    [foundResult, onDistrictFound]
  );

  const isLoading = state === 'searching' || state === 'locating';

  return (
    <div className={`address-search ${className}`}>
      <form onSubmit={handleSearch} className="address-search-form">
        <div className="address-search-input-wrapper">
          <svg
            className="address-search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            width="18"
            height="18"
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
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={placeholder}
            className="address-search-input"
            disabled={isLoading}
            aria-label="Address search"
            aria-describedby={error ? 'address-search-error' : undefined}
          />
          {address && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="address-search-clear"
              aria-label="Clear address"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="address-search-actions">
          <button
            type="submit"
            className="address-search-btn address-search-btn-primary"
            disabled={isLoading || !address.trim()}
          >
            {state === 'searching' ? (
              <>
                <span className="address-search-spinner" />
                Searching...
              </>
            ) : (
              'Find District'
            )}
          </button>

          <button
            type="button"
            onClick={handleUseLocation}
            className="address-search-btn address-search-btn-secondary"
            disabled={isLoading}
            title="Use my current location"
          >
            {state === 'locating' ? (
              <>
                <span className="address-search-spinner" />
                Locating...
              </>
            ) : (
              <>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
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
                <span className="address-search-btn-text">Use Location</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div id="address-search-error" className="address-search-error" role="alert">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Success result */}
      {state === 'success' && foundResult && (
        <div className="address-search-result">
          {foundAddress && (
            <p className="address-search-address">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {foundAddress}
            </p>
          )}

          <div className="address-search-districts">
            {foundResult.houseDistrict && (
              <button
                type="button"
                className={`address-search-district-btn ${chamber === 'house' ? 'active' : ''}`}
                onClick={() => handleSwitchChamber('house')}
              >
                <span className="address-search-district-label">House</span>
                <span className="address-search-district-number">District {foundResult.houseDistrict}</span>
              </button>
            )}

            {foundResult.senateDistrict && (
              <button
                type="button"
                className={`address-search-district-btn ${chamber === 'senate' ? 'active' : ''}`}
                onClick={() => handleSwitchChamber('senate')}
              >
                <span className="address-search-district-label">Senate</span>
                <span className="address-search-district-number">District {foundResult.senateDistrict}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
