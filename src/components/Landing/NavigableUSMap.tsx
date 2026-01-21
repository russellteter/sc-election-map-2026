'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatedMapContainer } from '@/components/Map/AnimatedMapContainer';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getAllStates, isStateActive, type AnyStateConfig } from '@/lib/stateConfig';
import { STATE_PATHS, getStateZoomTarget } from './USMap';

interface NavigableUSMapProps {
  onStateClick?: (stateCode: string) => void;
  onInactiveStateClick?: (state: AnyStateConfig) => void;
  /** Initial state to highlight (from URL or prop) */
  initialState?: string;
  /** Whether to sync state to URL (default: true) */
  syncUrl?: boolean;
  /** Whether to auto-zoom to initial state on mount */
  autoZoomOnMount?: boolean;
}

/**
 * NavigableUSMap - Enhanced US Map with keyboard navigation and deep-linking
 *
 * Extends AnimatedUSMap functionality with:
 * - URL state sync (?state=SC)
 * - Keyboard navigation (Tab through states, Enter to select)
 * - Accessibility features (aria-labels, focus-visible styling)
 * - Deep-linking support
 *
 * @example
 * ```tsx
 * // With URL sync (reads ?state= from URL)
 * <NavigableUSMap
 *   onInactiveStateClick={(state) => setModal(state)}
 * />
 *
 * // With manual initial state
 * <NavigableUSMap
 *   initialState="SC"
 *   autoZoomOnMount
 * />
 * ```
 */
export default function NavigableUSMap({
  onStateClick,
  onInactiveStateClick,
  initialState,
  syncUrl = true,
  autoZoomOnMount = false,
}: NavigableUSMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  // Animation state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Interaction state
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [focusedState, setFocusedState] = useState<string | null>(null);
  const [highlightedState, setHighlightedState] = useState<string | null>(null);

  // Refs for keyboard navigation
  const svgRef = useRef<SVGSVGElement>(null);
  const stateRefs = useRef<Map<string, SVGPathElement>>(new Map());

  // Animation duration (CSS synced)
  const ANIMATION_DURATION = 400;

  // Get all state configs
  const allStates = useMemo(() => getAllStates(), []);

  // Get navigable states (active states in keyboard order)
  const navigableStates = useMemo(() => {
    return Object.keys(STATE_PATHS).filter(isStateActive);
  }, []);

  // Parse state from URL or prop on mount
  useEffect(() => {
    const urlState = searchParams.get('state')?.toUpperCase();
    const targetState = urlState || initialState?.toUpperCase();

    if (targetState && STATE_PATHS[targetState]) {
      setHighlightedState(targetState);

      // Auto-zoom if enabled and state is active
      if (autoZoomOnMount && isStateActive(targetState) && !prefersReducedMotion) {
        const target = getStateZoomTarget(targetState);
        if (target) {
          // Delay to allow mount to complete
          setTimeout(() => {
            setZoomTarget(target);
            setZoomLevel(2.0);
          }, 100);
        }
      }
    }
  }, []); // Only run on mount

  // Update URL when highlighted state changes (if sync enabled)
  const updateUrl = useCallback((stateCode: string | null) => {
    if (!syncUrl || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    if (stateCode) {
      params.set('state', stateCode.toUpperCase());
    } else {
      params.delete('state');
    }

    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;

    window.history.replaceState({}, '', newUrl);
  }, [syncUrl]);

  // Handle state click with animation
  const handleStateClick = useCallback(
    (stateCode: string) => {
      // Update highlight
      setHighlightedState(stateCode);

      if (!isStateActive(stateCode)) {
        const state = allStates.find(s => s.code === stateCode);
        if (state) {
          onInactiveStateClick?.(state);
        }
        return;
      }

      // Call optional callback
      onStateClick?.(stateCode);

      // Skip animation if user prefers reduced motion
      if (prefersReducedMotion) {
        router.push(`/${stateCode.toLowerCase()}`);
        return;
      }

      // Get zoom target
      const target = getStateZoomTarget(stateCode);
      if (!target) {
        router.push(`/${stateCode.toLowerCase()}`);
        return;
      }

      // Prevent multiple animations
      if (isAnimating) return;

      // Trigger animation
      setIsAnimating(true);
      setZoomTarget(target);
      setZoomLevel(2.5);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Navigate after animation
      timeoutRef.current = setTimeout(() => {
        router.push(`/${stateCode.toLowerCase()}`);

        // Reset after navigation
        setTimeout(() => {
          setZoomLevel(1);
          setZoomTarget({ x: 0.5, y: 0.5 });
          setIsAnimating(false);
        }, 100);
      }, ANIMATION_DURATION);
    },
    [router, onStateClick, onInactiveStateClick, prefersReducedMotion, isAnimating, allStates]
  );

  // Keyboard navigation handlers
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, stateCode: string) => {
      const currentIndex = navigableStates.indexOf(stateCode);

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          handleStateClick(stateCode);
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < navigableStates.length - 1) {
            const nextState = navigableStates[currentIndex + 1];
            setFocusedState(nextState);
            stateRefs.current.get(nextState)?.focus();
            updateUrl(nextState);
          }
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevState = navigableStates[currentIndex - 1];
            setFocusedState(prevState);
            stateRefs.current.get(prevState)?.focus();
            updateUrl(prevState);
          }
          break;

        case 'Home':
          e.preventDefault();
          const firstState = navigableStates[0];
          setFocusedState(firstState);
          stateRefs.current.get(firstState)?.focus();
          updateUrl(firstState);
          break;

        case 'End':
          e.preventDefault();
          const lastState = navigableStates[navigableStates.length - 1];
          setFocusedState(lastState);
          stateRefs.current.get(lastState)?.focus();
          updateUrl(lastState);
          break;
      }
    },
    [navigableStates, handleStateClick, updateUrl]
  );

  // Handle focus events
  const handleFocus = useCallback((stateCode: string) => {
    setFocusedState(stateCode);
    updateUrl(stateCode);
  }, [updateUrl]);

  const handleBlur = useCallback(() => {
    setFocusedState(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <AnimatedMapContainer
      zoomLevel={zoomLevel}
      zoomTarget={zoomTarget}
      transitionDuration={ANIMATION_DURATION}
      className="w-full"
    >
      <div className="relative w-full max-w-4xl mx-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 800 500"
          className="w-full h-auto"
          style={{ maxHeight: '60vh' }}
          role="img"
          aria-label="Interactive map of United States. Use Tab to navigate between active states, Enter to select."
        >
          {/* Background */}
          <rect x="0" y="0" width="800" height="500" fill="transparent" />

          {/* State paths */}
          {Object.entries(STATE_PATHS).map(([code, { d, x, y }]) => {
            const active = isStateActive(code);
            const isHovered = hoveredState === code;
            const isFocused = focusedState === code;
            const isHighlighted = highlightedState === code;
            const isEmphasized = isHovered || isFocused || isHighlighted;

            // Color logic
            let fillColor: string;
            if (active) {
              if (isEmphasized) {
                fillColor = '#4739E7'; // Darker purple on emphasis
              } else {
                fillColor = '#6366F1'; // Standard purple
              }
            } else {
              fillColor = isHovered ? '#94A3B8' : '#CBD5E1'; // Gray shades
            }

            const stateName = allStates.find(s => s.code === code)?.name || code;

            return (
              <g key={code}>
                <path
                  ref={(el) => {
                    if (el && active) {
                      stateRefs.current.set(code, el);
                    }
                  }}
                  d={d}
                  fill={fillColor}
                  stroke={active ? (isEmphasized ? '#312E81' : '#3730A3') : '#94A3B8'}
                  strokeWidth={isEmphasized ? 2.5 : 1}
                  className="transition-all duration-200 cursor-pointer outline-none"
                  tabIndex={active ? 0 : -1}
                  role="button"
                  aria-label={`${stateName}${active ? '' : ' (coming soon)'}`}
                  aria-pressed={isHighlighted}
                  onMouseEnter={() => setHoveredState(code)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => handleStateClick(code)}
                  onKeyDown={(e) => handleKeyDown(e, code)}
                  onFocus={() => handleFocus(code)}
                  onBlur={handleBlur}
                  style={{
                    filter: isEmphasized ? 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))' : 'none',
                    transform: isEmphasized ? 'scale(1.03)' : 'scale(1)',
                    transformOrigin: `${x}px ${y}px`,
                  }}
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
        {(hoveredState || focusedState) && (
          <div
            className="absolute glass-surface rounded-lg px-3 py-2 pointer-events-none"
            style={{
              left: '50%',
              bottom: '10px',
              transform: 'translateX(-50%)',
              borderColor: 'var(--class-purple-light)',
            }}
            role="status"
            aria-live="polite"
          >
            <span className="font-medium" style={{ color: 'var(--text-color)' }}>
              {allStates.find(s => s.code === (hoveredState || focusedState))?.name}
            </span>
            <span className="ml-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              {isStateActive(hoveredState || focusedState || '')
                ? 'Press Enter or click to explore'
                : 'Coming soon'}
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#6366F1' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Active States</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: '#CBD5E1' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming Soon</span>
          </div>
        </div>

        {/* Keyboard hint for screen readers */}
        <div className="sr-only" aria-live="polite">
          {focusedState && (
            <span>
              {allStates.find(s => s.code === focusedState)?.name} selected.
              {isStateActive(focusedState)
                ? ' Press Enter to explore this state.'
                : ' This state is coming soon.'}
            </span>
          )}
        </div>
      </div>
    </AnimatedMapContainer>
  );
}
