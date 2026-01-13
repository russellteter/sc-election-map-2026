/**
 * useIntersectionObserver Hook
 *
 * Custom React hook for lazy loading content based on viewport visibility.
 * Used to implement Tier 3 progressive data loading for voter guide components.
 *
 * Features:
 * - Observes when an element enters the viewport
 * - Configurable root margin (preload distance)
 * - Optional freeze-on-visible (load once)
 * - Automatic cleanup on unmount
 */

import { useEffect, useState, useRef, RefObject } from 'react';

interface UseIntersectionObserverOptions {
  /**
   * Margin around the root (viewport) to trigger early
   * Default: '500px' - load 500px before element is visible
   */
  rootMargin?: string;

  /**
   * Percentage of element that must be visible (0.0 to 1.0)
   * Default: 0 - trigger as soon as any part is visible
   */
  threshold?: number | number[];

  /**
   * Once visible, stay visible (don't toggle back to false)
   * Default: false
   */
  freezeOnceVisible?: boolean;
}

/**
 * Hook to observe element visibility in viewport
 *
 * @param elementRef - Ref to the element to observe
 * @param options - Configuration options
 * @returns boolean - true if element is visible (or was visible if frozen)
 *
 * @example
 * ```tsx
 * const judicialRef = useRef<HTMLDivElement>(null);
 * const isJudicialVisible = useIntersectionObserver(judicialRef, {
 *   rootMargin: '500px',
 *   freezeOnceVisible: true
 * });
 *
 * useEffect(() => {
 *   if (isJudicialVisible && !data) {
 *     loadJudicialData();
 *   }
 * }, [isJudicialVisible]);
 * ```
 */
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  {
    threshold = 0,
    rootMargin = '500px',
    freezeOnceVisible = false,
  }: UseIntersectionObserverOptions = {}
): boolean {
  const [isVisible, setIsVisible] = useState(false);
  const frozenRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;

    // No element to observe
    if (!element) return;

    // Already frozen as visible
    if (frozenRef.current && freezeOnceVisible) return;

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: assume visible if no support
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);

        // Freeze state on first visibility
        if (visible && freezeOnceVisible) {
          frozenRef.current = true;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    // Cleanup observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, rootMargin, freezeOnceVisible]);

  return isVisible;
}
