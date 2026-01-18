/**
 * Tests for Address Validation Module
 *
 * Comprehensive test suite for validateAddress, getErrorSuggestion,
 * and mapApiErrorToUserFriendly functions.
 */

import {
  validateAddress,
  getErrorSuggestion,
  mapApiErrorToUserFriendly,
  ValidationResult,
  ValidationErrorType,
} from '@/lib/addressValidation';

describe('validateAddress', () => {
  describe('empty and short inputs', () => {
    it('should reject empty string', () => {
      const result = validateAddress('');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('empty');
      expect(result.message).toBe('Please enter your address');
      expect(result.suggestion).toContain('Enter your street');
    });

    it('should reject whitespace-only input', () => {
      const result = validateAddress('   ');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('empty');
    });

    it('should reject input with only 3 characters', () => {
      const result = validateAddress('123');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('too_short');
    });

    it('should reject input with only 4 characters', () => {
      const result = validateAddress('test');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('too_short');
      expect(result.message).toBe('Please enter a complete street address');
    });
  });

  describe('ZIP-only inputs', () => {
    it('should reject 5-digit ZIP code', () => {
      const result = validateAddress('29201');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('zip_only');
      expect(result.message).toContain('not just a ZIP code');
    });

    it('should reject ZIP+4 format', () => {
      const result = validateAddress('29201-1234');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('zip_only');
    });
  });

  describe('city-only inputs', () => {
    it('should reject single city name', () => {
      const result = validateAddress('Columbia');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('city_only');
      expect(result.message).toBe('Please include your street address');
    });

    it('should reject city with state abbreviation', () => {
      const result = validateAddress('Columbia, SC');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('city_only');
    });

    it('should reject two-word city name', () => {
      const result = validateAddress('North Charleston');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('city_only');
    });

    it('should reject two-word city with state', () => {
      const result = validateAddress('North Charleston, SC');
      expect(result.isValid).toBe(false);
      expect(result.errorType).toBe('city_only');
    });
  });

  describe('missing street number', () => {
    it('should reject street name with city but no number', () => {
      const result = validateAddress('Main Street, Columbia');
      expect(result.isValid).toBe(false);
      // Falls through city_only check (no "SC" suffix) to missing_street check
      expect(result.errorType).toBe('missing_street');
      expect(result.message).toBe('Please include your street number');
    });

    it('should reject street name only', () => {
      const result = validateAddress('Main Street');
      expect(result.isValid).toBe(false);
      // Matches city_only pattern (no comma, just words)
      expect(result.errorType).toBe('city_only');
    });
  });

  describe('PO Box addresses (warning, not error)', () => {
    it('should accept PO Box with warning', () => {
      const result = validateAddress('PO Box 123, Columbia, SC');
      expect(result.isValid).toBe(true);
      expect(result.isWarning).toBe(true);
      expect(result.errorType).toBe('po_box_warning');
      expect(result.message).toContain('PO Box addresses');
    });

    it('should accept P.O. Box format with warning', () => {
      const result = validateAddress('P.O. Box 456');
      expect(result.isValid).toBe(true);
      expect(result.isWarning).toBe(true);
      expect(result.errorType).toBe('po_box_warning');
    });

    it('should accept Post Office Box format with warning', () => {
      const result = validateAddress('Post Office Box 789');
      expect(result.isValid).toBe(true);
      expect(result.isWarning).toBe(true);
      expect(result.errorType).toBe('po_box_warning');
    });

    it('should accept lowercase po box with warning', () => {
      const result = validateAddress('po box 100');
      expect(result.isValid).toBe(true);
      expect(result.isWarning).toBe(true);
    });
  });

  describe('valid addresses', () => {
    it('should accept full address with city and state', () => {
      const result = validateAddress('123 Main Street, Columbia, SC');
      expect(result.isValid).toBe(true);
      expect(result.isWarning).toBeUndefined();
      expect(result.errorType).toBeUndefined();
    });

    it('should accept address with just street number and name', () => {
      const result = validateAddress('456 Elm Ave');
      expect(result.isValid).toBe(true);
    });

    it('should accept full address with ZIP', () => {
      const result = validateAddress('789 Oak Blvd, Charleston, SC 29401');
      expect(result.isValid).toBe(true);
    });

    it('should accept apartment-style addresses', () => {
      const result = validateAddress('100 Main St Apt 5, Columbia, SC');
      expect(result.isValid).toBe(true);
    });

    it('should accept addresses with suite numbers', () => {
      const result = validateAddress('200 Business Pkwy Suite 300');
      expect(result.isValid).toBe(true);
    });
  });
});

describe('getErrorSuggestion', () => {
  it('should return undefined for undefined errorType', () => {
    const result = getErrorSuggestion(undefined);
    expect(result).toBeUndefined();
  });

  it('should return suggestion for empty error', () => {
    const result = getErrorSuggestion('empty');
    expect(result).toContain('street address');
  });

  it('should return suggestion for too_short error', () => {
    const result = getErrorSuggestion('too_short');
    expect(result).toContain('Example:');
  });

  it('should return suggestion for zip_only error', () => {
    const result = getErrorSuggestion('zip_only');
    expect(result).toContain('Try:');
  });

  it('should return suggestion for city_only error', () => {
    const result = getErrorSuggestion('city_only');
    expect(result).toContain('street');
  });

  it('should return suggestion for missing_street error', () => {
    const result = getErrorSuggestion('missing_street');
    expect(result).toContain('Example:');
  });

  it('should return suggestion for po_box_warning error', () => {
    const result = getErrorSuggestion('po_box_warning');
    expect(result).toContain('residential');
  });

  it('should return suggestion for non_sc error', () => {
    const result = getErrorSuggestion('non_sc');
    expect(result).toContain('South Carolina');
  });
});

describe('mapApiErrorToUserFriendly', () => {
  describe('address not found errors', () => {
    it('should map "not found" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('Address not found');
      expect(result.errorType).toBe('error');
      expect(result.message).toBe('Address not found');
      expect(result.suggestion).toContain('spelling');
    });

    it('should map "no results" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('no results returned');
      expect(result.message).toBe('Address not found');
    });
  });

  describe('network errors', () => {
    it('should map "network error" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('network error');
      expect(result.errorType).toBe('error');
      expect(result.message).toBe('Unable to connect');
      expect(result.suggestion).toContain('internet');
    });

    it('should map "connection failed" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('connection failed');
      expect(result.message).toBe('Unable to connect');
    });

    it('should map "fetch failed" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('fetch failed');
      expect(result.message).toBe('Unable to connect');
    });
  });

  describe('South Carolina errors', () => {
    it('should map "not in South Carolina" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('Address not in South Carolina');
      expect(result.errorType).toBe('error');
      expect(result.message).toBe('Address not in South Carolina');
      expect(result.suggestion).toContain('South Carolina');
    });

    it('should map "not in SC" to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('Location not in SC');
      expect(result.message).toBe('Address not in South Carolina');
    });
  });

  describe('service errors', () => {
    it('should map server 500 error to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('Internal server error 500');
      expect(result.message).toBe('Service temporarily unavailable');
      expect(result.suggestion).toContain('try again');
    });

    it('should map service unavailable to user-friendly message', () => {
      const result = mapApiErrorToUserFriendly('service unavailable');
      expect(result.message).toBe('Service temporarily unavailable');
    });
  });

  describe('fallback for unknown errors', () => {
    it('should return generic message for unknown error', () => {
      const result = mapApiErrorToUserFriendly('unknown weird error xyz');
      expect(result.errorType).toBe('error');
      expect(result.message).toBe('Address lookup failed');
      expect(result.suggestion).toContain('try again');
    });

    it('should return generic message for empty error', () => {
      const result = mapApiErrorToUserFriendly('');
      expect(result.message).toBe('Address lookup failed');
    });
  });
});
