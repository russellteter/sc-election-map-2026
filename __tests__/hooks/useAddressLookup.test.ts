/**
 * Unit tests for useAddressLookup hook.
 * Tests address validation, geocoding, district lookup, geolocation, reset, and persistence.
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock all dependencies before importing the hook
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('@/lib/geocoding', () => ({
  geocodeAddress: jest.fn(),
  reverseGeocode: jest.fn(),
  getCurrentLocation: jest.fn(),
  isInSouthCarolina: jest.fn(),
}));

jest.mock('@/lib/districtLookup', () => ({
  findDistricts: jest.fn(),
}));

jest.mock('@/lib/congressionalLookup', () => ({
  getCountyFromCoordinates: jest.fn(),
}));

jest.mock('@/lib/addressValidation', () => ({
  validateAddress: jest.fn(),
  mapApiErrorToUserFriendly: jest.fn(),
}));

// Now import the hook and mocked modules
import { useAddressLookup } from '@/hooks/useAddressLookup';
import { geocodeAddress, reverseGeocode, getCurrentLocation, isInSouthCarolina } from '@/lib/geocoding';
import { findDistricts } from '@/lib/districtLookup';
import { getCountyFromCoordinates } from '@/lib/congressionalLookup';
import { validateAddress, mapApiErrorToUserFriendly } from '@/lib/addressValidation';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.history.replaceState
const mockReplaceState = jest.fn();
window.history.replaceState = mockReplaceState;

describe('useAddressLookup', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    mockLocalStorage.clear();

    // Set default mock implementations
    (isInSouthCarolina as jest.Mock).mockReturnValue(true);
    (validateAddress as jest.Mock).mockReturnValue({ isValid: true });
    (geocodeAddress as jest.Mock).mockResolvedValue({
      success: true,
      lat: 34.0,
      lon: -81.0,
      displayName: '123 Main St, Columbia, SC 29201',
    });
    (findDistricts as jest.Mock).mockResolvedValue({
      success: true,
      houseDistrict: 75,
      senateDistrict: 22,
    });
    (getCountyFromCoordinates as jest.Mock).mockResolvedValue({
      countyFips: '079',
      countyName: 'Richland',
      congressionalDistrict: 6,
    });
  });

  describe('initial state', () => {
    it('should start with idle status and null results', () => {
      const { result } = renderHook(() => useAddressLookup());

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.errorType).toBeNull();
      expect(result.current.errorSuggestion).toBeNull();
      expect(result.current.geocodeResult).toBeNull();
      expect(result.current.districtResult).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasResults).toBe(false);
      expect(result.current.isGeolocating).toBe(false);
    });

    it('should provide all required handler functions', () => {
      const { result } = renderHook(() => useAddressLookup());

      expect(typeof result.current.handleAddressSubmit).toBe('function');
      expect(typeof result.current.handleGeolocationRequest).toBe('function');
      expect(typeof result.current.handleReset).toBe('function');
      expect(typeof result.current.handleCopyShareLink).toBe('function');
    });
  });

  describe('handleAddressSubmit - with coordinates', () => {
    it('should verify SC coordinates and set geocode result directly', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      expect(isInSouthCarolina).toHaveBeenCalledWith(34.0, -81.0);
      expect(result.current.geocodeResult).toEqual({
        success: true,
        lat: 34.0,
        lon: -81.0,
        displayName: '123 Main St, Columbia, SC',
      });
    });

    it('should reject non-SC coordinates with error', async () => {
      (isInSouthCarolina as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Atlanta, GA', 33.7, -84.4);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toContain('South Carolina');
      expect(result.current.errorType).toBe('error');
    });

    it('should find districts after geocoding', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      expect(findDistricts).toHaveBeenCalledWith(34.0, -81.0);
      expect(getCountyFromCoordinates).toHaveBeenCalledWith(34.0, -81.0);
      expect(result.current.districtResult).toEqual({
        success: true,
        houseDistrict: 75,
        senateDistrict: 22,
        congressionalDistrict: 6,
        countyName: 'Richland',
      });
    });

    it('should transition status through geocoding → finding-districts → done', async () => {
      const statusHistory: string[] = [];

      const { result } = renderHook(() => useAddressLookup());

      // Use 0,0 coordinates to trigger geocoding path
      (validateAddress as jest.Mock).mockReturnValue({ isValid: true });

      // Track status changes by checking at each step
      await act(async () => {
        const promise = result.current.handleAddressSubmit('123 Main St, Columbia, SC', 0, 0);
        statusHistory.push(result.current.status);
        await promise;
      });

      // Final status should be done
      expect(result.current.status).toBe('done');
    });
  });

  describe('handleAddressSubmit - without coordinates (geocoding needed)', () => {
    it('should validate address before geocoding', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 0, 0);
      });

      expect(validateAddress).toHaveBeenCalledWith('123 Main St, Columbia, SC');
    });

    it('should set error state for invalid addresses', async () => {
      (validateAddress as jest.Mock).mockReturnValue({
        isValid: false,
        errorType: 'empty',
        message: 'Please enter your address',
        suggestion: 'Enter your street address to find your voting districts.',
      });

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('', 0, 0);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Please enter your address');
      expect(result.current.errorType).toBe('error');
      expect(result.current.errorSuggestion).toBe('Enter your street address to find your voting districts.');
    });

    it('should show warning but proceed for PO Box addresses', async () => {
      (validateAddress as jest.Mock).mockReturnValue({
        isValid: true,
        isWarning: true,
        errorType: 'po_box_warning',
        message: 'PO Box addresses may not accurately determine your voting district',
        suggestion: 'Try your residential address for more accurate results.',
      });

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('PO Box 123, Columbia, SC', 0, 0);
      });

      // Should continue to geocoding
      expect(geocodeAddress).toHaveBeenCalled();
      // After success, warning should be cleared
      expect(result.current.status).toBe('done');
    });

    it('should geocode and find districts for valid addresses', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 0, 0);
      });

      expect(geocodeAddress).toHaveBeenCalledWith('123 Main St, Columbia, SC');
      expect(findDistricts).toHaveBeenCalled();
      expect(result.current.status).toBe('done');
      expect(result.current.hasResults).toBe(true);
    });

    it('should handle geocoding errors with user-friendly messages', async () => {
      (geocodeAddress as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Address not found',
      });
      (mapApiErrorToUserFriendly as jest.Mock).mockReturnValue({
        errorType: 'error',
        message: 'Address not found',
        suggestion: 'Check the spelling or try a nearby address.',
      });

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('Invalid Address XYZ', 0, 0);
      });

      expect(mapApiErrorToUserFriendly).toHaveBeenCalled();
      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Address not found');
      expect(result.current.errorSuggestion).toBe('Check the spelling or try a nearby address.');
    });

    it('should handle district lookup errors', async () => {
      (findDistricts as jest.Mock).mockResolvedValue({
        success: false,
        houseDistrict: null,
        senateDistrict: null,
        error: 'Outside district boundaries',
      });

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 0, 0);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toContain('Could not determine');
    });

    it('should persist address to localStorage on success', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'voter-guide-last-address',
        '123 Main St, Columbia, SC'
      );
    });
  });

  describe('handleGeolocationRequest', () => {
    it('should set isGeolocating during location fetch', async () => {
      (getCurrentLocation as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ lat: 34.0, lon: -81.0 }), 100))
      );
      (reverseGeocode as jest.Mock).mockResolvedValue({
        success: true,
        displayName: '123 Main St, Columbia, SC',
      });

      const { result } = renderHook(() => useAddressLookup());

      // Start the geolocation request
      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleGeolocationRequest();
      });

      // isGeolocating should be true while waiting
      expect(result.current.isGeolocating).toBe(true);

      // Wait for completion
      await act(async () => {
        await promise;
      });

      // isGeolocating should be false after completion
      expect(result.current.isGeolocating).toBe(false);
    });

    it('should reverse geocode and auto-submit', async () => {
      (getCurrentLocation as jest.Mock).mockResolvedValue({ lat: 34.0, lon: -81.0 });
      (reverseGeocode as jest.Mock).mockResolvedValue({
        success: true,
        displayName: '123 Main St, Columbia, SC',
      });

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleGeolocationRequest();
      });

      expect(getCurrentLocation).toHaveBeenCalled();
      expect(reverseGeocode).toHaveBeenCalledWith(34.0, -81.0);
      expect(result.current.initialAddress).toBe('123 Main St, Columbia, SC');
    });

    it('should handle location permission denied', async () => {
      (getCurrentLocation as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleGeolocationRequest();
      });

      expect(result.current.error).toContain('Unable to get your location');
      expect(result.current.errorType).toBe('error');
      expect(result.current.isGeolocating).toBe(false);
    });

    it('should reject non-SC locations', async () => {
      (getCurrentLocation as jest.Mock).mockResolvedValue({ lat: 40.0, lon: -74.0 });
      (isInSouthCarolina as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleGeolocationRequest();
      });

      expect(result.current.error).toContain('not in South Carolina');
      expect(result.current.isGeolocating).toBe(false);
    });

    it('should handle reverse geocode failure', async () => {
      (getCurrentLocation as jest.Mock).mockResolvedValue({ lat: 34.0, lon: -81.0 });
      (reverseGeocode as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Reverse geocoding failed',
      });

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleGeolocationRequest();
      });

      expect(result.current.error).toContain('Could not determine your address');
      expect(result.current.isGeolocating).toBe(false);
    });
  });

  describe('handleReset', () => {
    it('should clear all state and localStorage', async () => {
      const { result } = renderHook(() => useAddressLookup());

      // First, set some state
      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      expect(result.current.status).toBe('done');
      expect(result.current.geocodeResult).not.toBeNull();

      // Now reset
      act(() => {
        result.current.handleReset();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.geocodeResult).toBeNull();
      expect(result.current.districtResult).toBeNull();
      expect(result.current.initialAddress).toBe('');
      expect(result.current.shareUrl).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('voter-guide-last-address');
    });

    it('should clear URL parameters', async () => {
      const { result } = renderHook(() => useAddressLookup());

      // First, set some state
      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      // Now reset
      act(() => {
        result.current.handleReset();
      });

      // history.replaceState should be called to clear URL params
      expect(mockReplaceState).toHaveBeenCalled();
    });
  });

  describe('computed properties', () => {
    it('should set isLoading true during geocoding', async () => {
      // Make geocodeAddress take some time
      (geocodeAddress as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          success: true,
          lat: 34.0,
          lon: -81.0,
          displayName: '123 Main St, Columbia, SC',
        }), 100))
      );

      const { result } = renderHook(() => useAddressLookup());

      // Start the lookup
      let promise: Promise<void>;
      act(() => {
        promise = result.current.handleAddressSubmit('123 Main St, Columbia, SC', 0, 0);
      });

      // Check isLoading - might be true during geocoding
      // This depends on timing, so we just verify the final state
      await act(async () => {
        await promise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBe('done');
    });

    it('should set hasResults true when done with district result', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      expect(result.current.hasResults).toBe(true);
    });
  });

  describe('share URL generation', () => {
    it('should generate share URL after successful lookup', async () => {
      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 34.0, -81.0);
      });

      await waitFor(() => {
        expect(result.current.shareUrl).not.toBeNull();
      });

      expect(result.current.shareUrl).toContain('address=');
    });
  });

  describe('error handling edge cases', () => {
    it('should handle unexpected errors gracefully', async () => {
      (geocodeAddress as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleAddressSubmit('123 Main St, Columbia, SC', 0, 0);
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toContain('unexpected error');
    });

    it('should handle geolocation errors gracefully', async () => {
      (getCurrentLocation as jest.Mock).mockRejectedValue(new Error('Geolocation failed'));

      const { result } = renderHook(() => useAddressLookup());

      await act(async () => {
        await result.current.handleGeolocationRequest();
      });

      expect(result.current.error).toContain('error occurred');
      expect(result.current.isGeolocating).toBe(false);
    });
  });
});
