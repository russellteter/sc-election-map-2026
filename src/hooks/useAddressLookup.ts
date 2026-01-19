/**
 * useAddressLookup Hook
 *
 * Custom React hook for managing address lookup, geocoding, and district finding.
 * Handles the complete flow from address input to district results.
 *
 * Features:
 * - Address geocoding via Geoapify API
 * - Geolocation support with reverse geocoding
 * - District lookup (state, congressional, county)
 * - URL parameter handling for shareable links
 * - Share URL generation
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { geocodeAddress, reverseGeocode, getCurrentLocation, isInSouthCarolina, GeocodeResult } from '@/lib/geocoding';
import { findDistricts, DistrictResult } from '@/lib/districtLookup';
import { getCountyFromCoordinates } from '@/lib/congressionalLookup';
import { validateAddress, mapApiErrorToUserFriendly } from '@/lib/addressValidation';

/**
 * localStorage key for persisting the last successfully looked-up address
 */
const STORAGE_KEY = 'voter-guide-last-address';

/**
 * Safely retrieve stored address from localStorage (handles SSR and private browsing)
 */
function getStoredAddress(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // Handle private browsing mode
  }
}

/**
 * Safely store address to localStorage (handles SSR and private browsing)
 */
function setStoredAddress(address: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, address);
  } catch {
    // Silently fail for private browsing
  }
}

/**
 * Clear stored address from localStorage
 */
function clearStoredAddress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail for private browsing
  }
}

/**
 * Status of the address lookup process
 */
export type LookupStatus = 'idle' | 'geocoding' | 'finding-districts' | 'done' | 'error';

/**
 * Extended district result with congressional and county info
 */
export interface ExtendedDistrictResult extends DistrictResult {
  congressionalDistrict?: number | null;
  countyName?: string | null;
}

/**
 * Return type for useAddressLookup hook
 */
interface UseAddressLookupReturn {
  /** Current status of the lookup process */
  status: LookupStatus;
  /** Status message for user feedback */
  statusMessage: string | null;
  /** Error message if lookup failed */
  error: string | null;
  /** Type of error for styling (error, warning, info) */
  errorType: 'error' | 'warning' | 'info' | null;
  /** Actionable suggestion for the error */
  errorSuggestion: string | null;
  /** Whether geolocation is in progress */
  isGeolocating: boolean;
  /** Geocode result after address lookup */
  geocodeResult: GeocodeResult | null;
  /** District result after district lookup */
  districtResult: ExtendedDistrictResult | null;
  /** Initial address (from URL or geolocation) */
  initialAddress: string;
  /** Shareable URL with address parameter */
  shareUrl: string | null;
  /** Handler for address submission */
  handleAddressSubmit: (address: string, lat: number, lon: number) => Promise<void>;
  /** Handler for geolocation request */
  handleGeolocationRequest: () => Promise<void>;
  /** Handler to reset all state */
  handleReset: () => void;
  /** Handler to copy share link to clipboard */
  handleCopyShareLink: () => Promise<void>;
  /** Whether lookup is in progress (geocoding or finding districts) */
  isLoading: boolean;
  /** Whether we have results to display */
  hasResults: boolean;
}

/**
 * Hook to manage address lookup and district finding
 *
 * @returns Object with lookup state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   status,
 *   error,
 *   geocodeResult,
 *   districtResult,
 *   handleAddressSubmit,
 *   isLoading,
 *   hasResults
 * } = useAddressLookup();
 *
 * return (
 *   <AddressAutocomplete
 *     onAddressSelect={handleAddressSubmit}
 *     isLoading={isLoading}
 *     error={error}
 *   />
 * );
 * ```
 */
export function useAddressLookup(): UseAddressLookupReturn {
  const searchParams = useSearchParams();

  // Lookup state
  const [status, setStatus] = useState<LookupStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning' | 'info' | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Results state
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);
  const [districtResult, setDistrictResult] = useState<ExtendedDistrictResult | null>(null);

  // Address from URL for sharing
  const [initialAddress, setInitialAddress] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Computed values
  const isLoading = status === 'geocoding' || status === 'finding-districts';
  const hasResults = status === 'done' && districtResult !== null;

  const handleAddressSubmit = useCallback(async (address: string, lat: number, lon: number) => {
    // Reset state
    setError(null);
    setErrorType(null);
    setErrorSuggestion(null);
    setGeocodeResult(null);
    setDistrictResult(null);
    setShareUrl(null);

    try {
      let finalLat = lat;
      let finalLon = lon;
      let displayName = address;

      // If we have coordinates from autocomplete, use them directly
      if (lat !== 0 && lon !== 0) {
        // Verify they're in SC
        if (!isInSouthCarolina(lat, lon)) {
          setStatus('error');
          setError('This address does not appear to be in South Carolina');
          setErrorType('error');
          setErrorSuggestion('This tool only works for South Carolina addresses.');
          return;
        }

        setGeocodeResult({
          success: true,
          lat,
          lon,
          displayName: address,
        });
      } else {
        // Pre-flight validation BEFORE any API call
        const validation = validateAddress(address);

        if (!validation.isValid) {
          setStatus('error');
          setError(validation.message || 'Invalid address');
          setErrorType('error');
          setErrorSuggestion(validation.suggestion || null);
          return;
        }

        // Handle PO Box warning (validation passed but with warning)
        if (validation.isWarning) {
          // Set warning state but continue with lookup
          setError(validation.message || null);
          setErrorType('warning');
          setErrorSuggestion(validation.suggestion || null);
          // Note: We continue execution here, not return
        }

        // Need to geocode the address
        setStatus('geocoding');
        setStatusMessage('Looking up address...');

        const geoResult = await geocodeAddress(address);

        if (!geoResult.success) {
          // Map API error to user-friendly message
          const userError = mapApiErrorToUserFriendly(geoResult.error || 'Unknown error');
          setStatus('error');
          setError(userError.message);
          setErrorType(userError.errorType);
          setErrorSuggestion(userError.suggestion);
          setStatusMessage(null);
          return;
        }

        finalLat = geoResult.lat!;
        finalLon = geoResult.lon!;
        displayName = geoResult.displayName || address;

        setGeocodeResult(geoResult);
      }

      setStatusMessage(`Found: ${displayName.split(',').slice(0, 3).join(',')}`);

      // Step 2: Find all districts
      setStatus('finding-districts');
      setStatusMessage('Finding your districts...');

      // Get state legislative districts
      const districts = await findDistricts(finalLat, finalLon);

      // Get county and congressional district
      const countyInfo = await getCountyFromCoordinates(finalLat, finalLon);

      if (!districts.success) {
        setStatus('error');
        setError('Could not determine your voting districts');
        setErrorType('error');
        setErrorSuggestion('The address may be outside district boundaries. Try a nearby address or contact your county election office.');
        setStatusMessage(null);
        return;
      }

      // Combine all district info
      const extendedResult: ExtendedDistrictResult = {
        ...districts,
        congressionalDistrict: countyInfo.congressionalDistrict,
        countyName: countyInfo.countyName,
      };

      setDistrictResult(extendedResult);
      setStatus('done');
      setStatusMessage(null);

      // Clear any warning once we have successful results
      if (errorType === 'warning') {
        setError(null);
        setErrorType(null);
        setErrorSuggestion(null);
      }

      // Update URL with address (without triggering navigation)
      const url = new URL(window.location.href);
      url.searchParams.set('address', encodeURIComponent(displayName));
      window.history.replaceState({}, '', url.toString());

      // Persist address to localStorage for returning users
      setStoredAddress(displayName);

    } catch (err) {
      console.error('Lookup error:', err);
      setStatus('error');
      setError('An unexpected error occurred');
      setErrorType('error');
      setErrorSuggestion('Please try again. If the problem persists, enter a different address.');
      setStatusMessage(null);
    }
  }, [errorType]);

  const handleGeolocationRequest = useCallback(async () => {
    setIsGeolocating(true);
    setError(null);
    setErrorType(null);
    setErrorSuggestion(null);

    try {
      const location = await getCurrentLocation();

      if (!location) {
        setError('Unable to get your location');
        setErrorType('error');
        setErrorSuggestion('Check your browser permissions and try again, or enter your address manually.');
        setIsGeolocating(false);
        return;
      }

      const { lat, lon } = location;

      // Check if in SC
      if (!isInSouthCarolina(lat, lon)) {
        setError('Your location is not in South Carolina');
        setErrorType('error');
        setErrorSuggestion('This tool only works for South Carolina addresses. Please enter an address manually.');
        setIsGeolocating(false);
        return;
      }

      // Reverse geocode to get address
      setStatusMessage('Getting your address...');
      const reverseResult = await reverseGeocode(lat, lon);

      if (!reverseResult.success) {
        setError('Could not determine your address');
        setErrorType('error');
        setErrorSuggestion('Please enter your address manually.');
        setIsGeolocating(false);
        return;
      }

      // Set the address in the input
      setInitialAddress(reverseResult.displayName || '');
      setIsGeolocating(false);

      // Auto-submit with the coordinates we already have
      handleAddressSubmit(reverseResult.displayName || '', lat, lon);

    } catch (err) {
      console.error('Geolocation error:', err);
      setError('An error occurred while getting your location');
      setErrorType('error');
      setErrorSuggestion('Please enter your address manually.');
      setIsGeolocating(false);
    }
  }, [handleAddressSubmit]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setErrorType(null);
    setErrorSuggestion(null);
    setStatusMessage(null);
    setGeocodeResult(null);
    setDistrictResult(null);
    setInitialAddress('');
    setShareUrl(null);
    // Clear URL params
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
    // Clear localStorage
    clearStoredAddress();
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
    }
  }, [shareUrl]);

  // Handle URL parameter on mount (for shareable links) or localStorage (for returning users)
  useEffect(() => {
    // Skip if we already have results
    if (geocodeResult) return;

    // Priority 1: URL parameter (shareable links take precedence)
    const addressParam = searchParams.get('address');
    if (addressParam) {
      const decodedAddress = decodeURIComponent(addressParam);
      setInitialAddress(decodedAddress);
      // Auto-search if we have an address in the URL
      handleAddressSubmit(decodedAddress, 0, 0);
      return;
    }

    // Priority 2: localStorage (returning users)
    const storedAddress = getStoredAddress();
    if (storedAddress) {
      setInitialAddress(storedAddress);
      // Auto-search with the stored address
      handleAddressSubmit(storedAddress, 0, 0);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate shareable URL when we have results
  useEffect(() => {
    if (geocodeResult?.displayName) {
      const url = new URL(window.location.href);
      url.searchParams.set('address', encodeURIComponent(geocodeResult.displayName));
      setShareUrl(url.toString());
    } else {
      setShareUrl(null);
    }
  }, [geocodeResult]);

  return {
    status,
    statusMessage,
    error,
    errorType,
    errorSuggestion,
    isGeolocating,
    geocodeResult,
    districtResult,
    initialAddress,
    shareUrl,
    handleAddressSubmit,
    handleGeolocationRequest,
    handleReset,
    handleCopyShareLink,
    isLoading,
    hasResults,
  };
}
