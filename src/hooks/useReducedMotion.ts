'use client';

import { useState, useEffect } from 'react';

/**
 * useReducedMotion - Hook for respecting prefers-reduced-motion preference
 *
 * Returns true if the user has requested reduced motion in their OS settings.
 * Use this to disable or simplify animations for accessibility.
 *
 * @returns {boolean} true if user prefers reduced motion, false otherwise
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <div style={{
 *     transition: prefersReducedMotion ? 'none' : 'transform 0.3s ease'
 *   }}>
 *     Animated content
 *   </div>
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side only)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Use modern addEventListener API (not deprecated addListener)
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;
