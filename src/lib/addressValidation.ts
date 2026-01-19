/**
 * Address Validation Module for SC Election Map Voter Guide
 *
 * Provides pre-flight validation for address inputs before geocoding API calls.
 * Returns user-friendly error messages with actionable suggestions.
 */

// Debug mode - enable via localStorage.setItem('voter-guide-debug', 'true')
const DEBUG = typeof window !== 'undefined' && localStorage.getItem('voter-guide-debug') === 'true';

function log(message: string, data?: unknown) {
  if (DEBUG) console.log(`[AddressValidation] ${message}`, data || '');
}

/**
 * Types of validation errors that can occur
 */
export type ValidationErrorType =
  | 'empty'
  | 'too_short'
  | 'missing_street'
  | 'po_box_warning'
  | 'zip_only'
  | 'city_only'
  | 'non_sc';

/**
 * Result of address validation
 */
export interface ValidationResult {
  /** Whether the address passed validation */
  isValid: boolean;
  /** Type of error if validation failed */
  errorType?: ValidationErrorType;
  /** User-friendly error message */
  message?: string;
  /** Actionable suggestion for fixing the error */
  suggestion?: string;
  /** Whether this is a warning (can still proceed) vs an error (must fix) */
  isWarning?: boolean;
}

/**
 * Pattern to detect ZIP-only inputs (5 digits or 5+4 format)
 */
const ZIP_ONLY_PATTERN = /^\d{5}(-\d{4})?$/;

/**
 * Pattern to detect city-only inputs (word(s) + optional ", SC" or ", South Carolina")
 * Examples: "Columbia", "Columbia, SC", "North Charleston", "North Charleston, SC"
 */
const CITY_ONLY_PATTERN = /^[A-Za-z\s]+(?:,\s*(?:SC|South Carolina))?$/i;

/**
 * Pattern to detect PO Box addresses
 */
const PO_BOX_PATTERN = /\b(?:p\.?\s*o\.?\s*box|post\s*office\s*box)\b/i;

/**
 * Pattern to detect addresses that start with a letter (no street number)
 * Must contain at least one letter and no numbers at the start
 */
const NO_STREET_NUMBER_PATTERN = /^[A-Za-z]/;

/**
 * Pattern to detect if the address contains any numbers
 */
const CONTAINS_NUMBER_PATTERN = /\d/;

/**
 * Validates an address before making geocoding API calls.
 * Returns validation result with user-friendly error messages.
 *
 * @param address - The address string to validate
 * @returns ValidationResult with isValid, errorType, message, and suggestion
 *
 * @example
 * ```typescript
 * const result = validateAddress('Columbia');
 * // { isValid: false, errorType: 'city_only', message: '...', suggestion: '...' }
 *
 * const result = validateAddress('123 Main St, Columbia, SC');
 * // { isValid: true }
 * ```
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = address.trim();

  log('Validating address:', trimmed);

  // Check 1: Empty input
  if (!trimmed) {
    log('Validation failed: empty');
    return {
      isValid: false,
      errorType: 'empty',
      message: 'Please enter your address',
      suggestion: 'Enter your street address to find your voting districts.',
    };
  }

  // Check 2: Too short (less than 5 characters)
  if (trimmed.length < 5) {
    log('Validation failed: too_short');
    return {
      isValid: false,
      errorType: 'too_short',
      message: 'Please enter a complete street address',
      suggestion: 'Example: 123 Main Street, Columbia, SC 29201',
    };
  }

  // Check 3: ZIP-only input
  if (ZIP_ONLY_PATTERN.test(trimmed)) {
    log('Validation failed: zip_only');
    return {
      isValid: false,
      errorType: 'zip_only',
      message: 'Please enter a full street address, not just a ZIP code',
      suggestion: 'Try: 123 Main Street, [city], SC [your ZIP]',
    };
  }

  // Check 4: City-only input (word(s) with no numbers, possibly ending in ", SC")
  // Only trigger if no numbers present and matches city pattern
  if (CITY_ONLY_PATTERN.test(trimmed) && !CONTAINS_NUMBER_PATTERN.test(trimmed)) {
    log('Validation failed: city_only');
    return {
      isValid: false,
      errorType: 'city_only',
      message: 'Please include your street address',
      suggestion: 'Try: [street number] [street name], [city], SC',
    };
  }

  // Check 5: Missing street number (starts with letter, no numbers in the string)
  // This catches addresses like "Main Street, Columbia" but not "123 Main Street"
  if (NO_STREET_NUMBER_PATTERN.test(trimmed) && !CONTAINS_NUMBER_PATTERN.test(trimmed)) {
    log('Validation failed: missing_street');
    return {
      isValid: false,
      errorType: 'missing_street',
      message: 'Please include your street number',
      suggestion: 'Example: 123 Main Street, Columbia, SC',
    };
  }

  // Check 6: PO Box detection (warning, not error)
  if (PO_BOX_PATTERN.test(trimmed)) {
    log('Validation warning: po_box_warning');
    return {
      isValid: true, // Allow to proceed, but warn
      isWarning: true,
      errorType: 'po_box_warning',
      message: 'PO Box addresses may not accurately determine your voting district',
      suggestion: 'Try your residential address for more accurate results.',
    };
  }

  // All checks passed
  log('Validation passed');
  return {
    isValid: true,
  };
}

/**
 * Returns a context-aware suggestion based on the error type.
 * Useful for providing additional help in error displays.
 *
 * @param errorType - The type of validation error
 * @returns A helpful suggestion string, or undefined if no suggestion available
 */
export function getErrorSuggestion(errorType: ValidationErrorType | undefined): string | undefined {
  if (!errorType) return undefined;

  const suggestions: Record<ValidationErrorType, string> = {
    empty: 'Enter your street address to find your voting districts.',
    too_short: 'Example: 123 Main Street, Columbia, SC 29201',
    zip_only: 'Try: 123 Main Street, [city], SC [your ZIP]',
    city_only: 'Try: [street number] [street name], [city], SC',
    missing_street: 'Example: 123 Main Street, Columbia, SC',
    po_box_warning: 'Try your residential address for more accurate results.',
    non_sc: 'This tool only works for South Carolina addresses.',
  };

  return suggestions[errorType];
}

/**
 * Maps API/geocoding errors to user-friendly error types and messages.
 * Called when geocoding fails after validation passes.
 *
 * @param errorMessage - The technical error message from the API
 * @returns Object with errorType, message, and suggestion
 */
export function mapApiErrorToUserFriendly(errorMessage: string): {
  errorType: 'error' | 'warning';
  message: string;
  suggestion: string;
} {
  const lowerError = errorMessage.toLowerCase();

  // Address not found
  if (lowerError.includes('not found') || lowerError.includes('no results')) {
    return {
      errorType: 'error',
      message: 'Address not found',
      suggestion: 'Check the spelling or try a nearby address.',
    };
  }

  // Network errors
  if (lowerError.includes('network') || lowerError.includes('connect') || lowerError.includes('fetch')) {
    return {
      errorType: 'error',
      message: 'Unable to connect',
      suggestion: 'Check your internet connection and try again.',
    };
  }

  // Not in South Carolina
  if (lowerError.includes('south carolina') || lowerError.includes('not in sc')) {
    return {
      errorType: 'error',
      message: 'Address not in South Carolina',
      suggestion: 'This tool only works for South Carolina addresses.',
    };
  }

  // Service errors
  if (lowerError.includes('service') || lowerError.includes('server') || lowerError.includes('500')) {
    return {
      errorType: 'error',
      message: 'Service temporarily unavailable',
      suggestion: 'Please try again in a few moments.',
    };
  }

  // Default fallback
  return {
    errorType: 'error',
    message: 'Address lookup failed',
    suggestion: 'Please check your address and try again.',
  };
}
