'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LensId, DEFAULT_LENS, isValidLensId } from '@/types/lens';

/**
 * Options for useLens hook
 */
export interface UseLensOptions {
  /** Debounce delay for URL updates (default: 150ms) */
  debounceMs?: number;
  /** Whether to sync state from URL on mount (default: true) */
  syncOnMount?: boolean;
  /** URL parameter name (default: 'lens') */
  paramName?: string;
}

/**
 * Return type for useLens hook
 */
export interface UseLensReturn {
  /** Current active lens */
  activeLens: LensId;
  /** Set the active lens (updates URL) */
  setLens: (lens: LensId) => void;
  /** Whether state has been initialized from URL */
  isInitialized: boolean;
  /** Whether a lens transition is in progress (for animation) */
  isTransitioning: boolean;
}

/**
 * useLens - URL-synced lens state management
 *
 * Enables deep-linking to specific lens views by persisting the active lens
 * to URL query parameters.
 *
 * Features:
 * - Parses initial lens from URL on mount
 * - Debounces URL updates to prevent thrashing
 * - Uses replaceState (not pushState) to avoid history spam
 * - SSR-safe: returns default lens during server rendering
 * - Preserves other URL parameters
 *
 * @param options - Configuration options
 * @returns Lens state and control functions
 *
 * @example
 * ```tsx
 * const { activeLens, setLens, isInitialized } = useLens();
 *
 * // Render lens toggle
 * <LensToggleBar
 *   activeLens={activeLens}
 *   onLensChange={setLens}
 * />
 *
 * // Pass to map
 * <DistrictMap activeLens={activeLens} ... />
 * ```
 */
export function useLens(options: UseLensOptions = {}): UseLensReturn {
  const {
    debounceMs = 150,
    syncOnMount = true,
    paramName = 'lens',
  } = options;

  // Internal state
  const [activeLens, setActiveLens] = useState<LensId>(DEFAULT_LENS);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're in the browser
  const isBrowser = typeof window !== 'undefined';

  // Parse URL state on mount (client-side only)
  useEffect(() => {
    if (!isBrowser || !syncOnMount) {
      setIsInitialized(true);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const urlLens = params.get(paramName);

    if (urlLens && isValidLensId(urlLens)) {
      setActiveLens(urlLens);
    }

    setIsInitialized(true);
  }, [isBrowser, syncOnMount, paramName]);

  // Sync lens to URL (debounced)
  const syncToUrl = useCallback(
    (lens: LensId) => {
      if (!isBrowser) return;

      // Clear any pending debounce
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        // Get existing params (preserve other params)
        const currentParams = new URLSearchParams(window.location.search);

        // Update or remove lens param
        if (lens === DEFAULT_LENS) {
          // Remove param for default lens (cleaner URLs)
          currentParams.delete(paramName);
        } else {
          currentParams.set(paramName, lens);
        }

        // Build new URL
        const queryString = currentParams.toString();
        const newUrl = queryString
          ? `${window.location.pathname}?${queryString}`
          : window.location.pathname;

        // Update URL without navigation
        window.history.replaceState({}, '', newUrl);
      }, debounceMs);
    },
    [isBrowser, debounceMs, paramName]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  // Set lens with URL sync and transition animation
  const setLens = useCallback(
    (lens: LensId) => {
      if (!isValidLensId(lens)) {
        console.warn(`Invalid lens ID: ${lens}, using default`);
        lens = DEFAULT_LENS;
      }

      // Trigger transition animation
      setIsTransitioning(true);

      // Clear any pending transition timer
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }

      // End transition after animation completes (300ms matches CSS)
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 300);

      setActiveLens(lens);
      syncToUrl(lens);
    },
    [syncToUrl]
  );

  return {
    activeLens,
    setLens,
    isInitialized,
    isTransitioning,
  };
}

export default useLens;
