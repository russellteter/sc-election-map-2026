'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import USMap, { getStateZoomTarget } from './USMap';
import { AnimatedMapContainer } from '@/components/Map/AnimatedMapContainer';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isStateActive, type AnyStateConfig } from '@/lib/stateConfig';

interface AnimatedUSMapProps {
  onStateClick?: (stateCode: string) => void;
  onInactiveStateClick?: (state: AnyStateConfig) => void;
}

/**
 * AnimatedUSMap - Enhanced US Map with zoom-to-state animation
 *
 * Wraps USMap with AnimatedMapContainer to provide a smooth zoom
 * animation before navigating to a state page.
 *
 * @example
 * ```tsx
 * <AnimatedUSMap
 *   onInactiveStateClick={(state) => setSelectedInactiveState(state)}
 * />
 * ```
 */
export default function AnimatedUSMap({
  onStateClick,
  onInactiveStateClick,
}: AnimatedUSMapProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomTarget, setZoomTarget] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation duration matches CSS variable (400ms)
  const ANIMATION_DURATION = 400;

  const handleStateClick = useCallback(
    (stateCode: string) => {
      // Only animate for active states
      if (!isStateActive(stateCode)) {
        return; // Let USMap handle inactive state modal
      }

      // Call optional callback
      onStateClick?.(stateCode);

      // Skip animation if user prefers reduced motion
      if (prefersReducedMotion) {
        router.push(\`/\${stateCode.toLowerCase()}\`);
        return;
      }

      // Get zoom target coordinates for the state
      const target = getStateZoomTarget(stateCode);
      if (!target) {
        router.push(\`/\${stateCode.toLowerCase()}\`);
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
        router.push(\`/\${stateCode.toLowerCase()}\`);

        // Reset zoom state after navigation (for back navigation)
        setTimeout(() => {
          setZoomLevel(1);
          setZoomTarget({ x: 0.5, y: 0.5 });
          setIsAnimating(false);
        }, 100);
      }, ANIMATION_DURATION);
    },
    [router, onStateClick, prefersReducedMotion, isAnimating]
  );

  return (
    <AnimatedMapContainer
      zoomLevel={zoomLevel}
      zoomTarget={zoomTarget}
      transitionDuration={ANIMATION_DURATION}
      className="w-full"
    >
      <USMap
        onStateClick={handleStateClick}
        onInactiveStateClick={onInactiveStateClick}
        disableInternalNavigation
      />
    </AnimatedMapContainer>
  );
}
