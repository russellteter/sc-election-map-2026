'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import USMap, { getStateZoomTarget, STATE_PATHS } from './USMap';
import { AnimatedMapContainer } from '@/components/Map/AnimatedMapContainer';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isStateActive, getAllStates, type AnyStateConfig } from '@/lib/stateConfig';

interface NavigableUSMapProps {
  /** Callback when an active state is clicked */
  onStateClick?: (stateCode: string) => void;
  /** Callback when an inactive state is clicked */
  onInactiveStateClick?: (state: AnyStateConfig) => void;
  /** Highlight specific state on mount (from URL or prop) */
  initialState?: string;
  /** Enable URL state sync (default: true) */
  syncUrl?: boolean;
}

/**
 * NavigableUSMap - Navigation-first US Map with URL state sync
 *
 * Extends AnimatedUSMap with:
 * - URL parameter sync for deep-linking (?state=SC)
 * - Keyboard navigation (Tab + Enter on states)
 * - Accessibility features (aria-labels, focus-visible)
 * - Auto-scroll and highlight from URL state
 *
 * @example
 * ```tsx
 * <NavigableUSMap
 *   onInactiveStateClick={(state) => showModal(state)}
 *   syncUrl={true}
 * />
 * ```
 */
export default function NavigableUSMap({
  onStateClick,
  onInactiveStateClick,
  initialState,
  syncUrl = true,
}: NavigableUSMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedState, setHighlightedState] = useState<string | null>(null);
  const [focusedState, setFocusedState] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Animation duration matches CSS variable (400ms)
  const ANIMATION_DURATION = 400;

  // Get all state codes for keyboard navigation order
  const allStateCodes = Object.keys(STATE_PATHS);
  const allStates = getAllStates();

  // Parse initial state from URL or prop
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Priority: URL param > prop > none
    const urlState = syncUrl ? searchParams.get('state')?.toUpperCase() : null;
    const stateToHighlight = urlState || initialState?.toUpperCase();

    if (stateToHighlight && STATE_PATHS[stateToHighlight]) {
      setHighlightedState(stateToHighlight);

      // Scroll map into view if state specified
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Auto-zoom to highlighted state after brief delay (only for active states)
      if (isStateActive(stateToHighlight) && !prefersReducedMotion) {
        const autoZoomDelay = setTimeout(() => {
          const target = getStateZoomTarget(stateToHighlight);
          if (target) {
            setZoomTarget(target);
            setZoomLevel(1.5); // Subtle zoom, not full navigation zoom
          }
        }, 500);
        return () => clearTimeout(autoZoomDelay);
      }
    }
  }, [searchParams, initialState, syncUrl, prefersReducedMotion]);

  // Clear URL state param after successful navigation
  const clearUrlState = useCallback(() => {
    if (!syncUrl || typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (url.searchParams.has('state')) {
      url.searchParams.delete('state');
      window.history.replaceState({}, '', url.toString());
    }
  }, [syncUrl]);

  // Handle state click (zoom animation + navigate)
  const handleStateClick = useCallback(
    (stateCode: string) => {
      // Only animate for active states
      if (!isStateActive(stateCode)) {
        return; // Let USMap handle inactive state modal
      }

      // Call optional callback
      onStateClick?.(stateCode);

      // Clear any highlighted state
      setHighlightedState(null);

      // Skip animation if user prefers reduced motion
      if (prefersReducedMotion) {
        clearUrlState();
        router.push(`/${stateCode.toLowerCase()}`);
        return;
      }

      // Get zoom target coordinates for the state
      const target = getStateZoomTarget(stateCode);
      if (!target) {
        clearUrlState();
        router.push(`/${stateCode.toLowerCase()}`);
        return;
      }

      // Prevent multiple animations
      if (isAnimating) return;

      // Set zoom state to trigger animation
      setIsAnimating(true);
      setZoomTarget(target);
      setZoomLevel(2.5);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Navigate after animation completes
      timeoutRef.current = setTimeout(() => {
        clearUrlState();
        router.push(`/${stateCode.toLowerCase()}`);

        // Reset zoom state after navigation (for back navigation)
        setTimeout(() => {
          setZoomLevel(1);
          setZoomTarget({ x: 0.5, y: 0.5 });
          setIsAnimating(false);
        }, 100);
      }, ANIMATION_DURATION);
    },
    [router, onStateClick, prefersReducedMotion, isAnimating, clearUrlState]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, stateCode: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStateClick(stateCode);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = allStateCodes.indexOf(stateCode);
        const nextIndex = (currentIndex + 1) % allStateCodes.length;
        setFocusedState(allStateCodes[nextIndex]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = allStateCodes.indexOf(stateCode);
        const prevIndex = (currentIndex - 1 + allStateCodes.length) % allStateCodes.length;
        setFocusedState(allStateCodes[prevIndex]);
      }
    },
    [handleStateClick, allStateCodes]
  );

  // Focus management for keyboard navigation
  useEffect(() => {
    if (focusedState) {
      const element = document.querySelector(`[data-state-code="${focusedState}"]`) as HTMLElement;
      element?.focus();
    }
  }, [focusedState]);

  // Get state name for accessibility
  const getStateName = (stateCode: string): string => {
    const state = allStates.find(s => s.code === stateCode);
    return state?.name || stateCode;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="navigable-us-map-container">
      <AnimatedMapContainer
        zoomLevel={zoomLevel}
        zoomTarget={zoomTarget}
        transitionDuration={ANIMATION_DURATION}
        className="w-full"
      >
        <div className="relative w-full max-w-4xl mx-auto" role="application" aria-label="United States map navigation">
          <svg
            viewBox="0 0 800 500"
            className="w-full h-auto"
            style={{ maxHeight: '60vh' }}
            role="img"
            aria-label="Interactive map of United States showing election data availability by state"
          >
            {/* Background */}
            <rect x="0" y="0" width="800" height="500" fill="transparent" />

            {/* State paths with accessibility and keyboard support */}
            {Object.entries(STATE_PATHS).map(([code, { d, x, y }]) => {
              const active = isStateActive(code);
              const isHighlighted = highlightedState === code;
              const isFocused = focusedState === code;
              const stateName = getStateName(code);

              return (
                <g key={code} role="button" aria-label={`${stateName}${active ? ' - Click to explore election data' : ' - Coming soon'}`}>
                  <path
                    d={d}
                    data-state-code={code}
                    tabIndex={0}
                    fill={active
                      ? (isHighlighted || isFocused ? '#4739E7' : '#6366F1')
                      : (isHighlighted || isFocused ? '#94A3B8' : '#CBD5E1')
                    }
                    stroke={active ? '#3730A3' : '#94A3B8'}
                    strokeWidth={isHighlighted || isFocused ? 3 : 1}
                    className="transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    onMouseEnter={() => setHighlightedState(code)}
                    onMouseLeave={() => setHighlightedState(null)}
                    onFocus={() => setFocusedState(code)}
                    onBlur={() => setFocusedState(null)}
                    onClick={() => {
                      if (active) {
                        handleStateClick(code);
                      } else {
                        const state = allStates.find(s => s.code === code);
                        if (state) {
                          onInactiveStateClick?.(state);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (active) {
                        handleKeyDown(e, code);
                      } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const state = allStates.find(s => s.code === code);
                        if (state) {
                          onInactiveStateClick?.(state);
                        }
                      }
                    }}
                    style={{
                      filter: isHighlighted || isFocused ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none',
                      transform: isHighlighted || isFocused ? 'scale(1.02)' : 'scale(1)',
                      transformOrigin: `${x}px ${y}px`,
                    }}
                    aria-pressed={isHighlighted || isFocused}
                  />
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10"
                    fontWeight="500"
                    fill={active ? 'white' : '#64748B'}
                    className="pointer-events-none select-none"
                    style={{ textShadow: active ? '0 1px 2px rgba(0,0,0,0.2)' : 'none' }}
                    aria-hidden="true"
                  >
                    {code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip */}
          {(highlightedState || focusedState) && (
            <div
              className="absolute glass-surface rounded-lg px-3 py-2 pointer-events-none"
              style={{
                left: '50%',
                bottom: '10px',
                transform: 'translateX(-50%)',
                borderColor: 'var(--class-purple-light)',
              }}
              role="tooltip"
              aria-live="polite"
            >
              <span className="font-medium" style={{ color: 'var(--text-color)' }}>
                {getStateName(highlightedState || focusedState || '')}
              </span>
              <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                {isStateActive(highlightedState || focusedState || '') ? 'Click to explore' : 'Coming soon'}
              </span>
            </div>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: '#6366F1' }} aria-hidden="true" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Active States</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: '#CBD5E1' }} aria-hidden="true" />
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming Soon</span>
            </div>
          </div>

          {/* Screen reader instructions */}
          <div className="sr-only" aria-live="polite">
            Use arrow keys to navigate between states. Press Enter or Space to select a state.
          </div>
        </div>
      </AnimatedMapContainer>
    </div>
  );
}
