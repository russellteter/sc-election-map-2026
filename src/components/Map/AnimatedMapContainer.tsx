'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export interface AnimatedMapContainerProps {
  children: React.ReactNode;
  /** Zoom level: 1 = full view, 2 = zoomed, 3 = deep zoom */
  zoomLevel: number;
  /** Center point of zoom (0-1 normalized coordinates, default: center) */
  zoomTarget?: { x: number; y: number };
  /** Transition duration in ms (default: 400) */
  transitionDuration?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * AnimatedMapContainer - CSS-powered zoom container for SVG maps
 *
 * Provides smooth zoom transitions using CSS transforms for map navigation.
 * Supports prefers-reduced-motion for accessibility.
 *
 * @example
 * ```tsx
 * <AnimatedMapContainer
 *   zoomLevel={2}
 *   zoomTarget={{ x: 0.3, y: 0.5 }}
 *   transitionDuration={400}
 * >
 *   <USMap />
 * </AnimatedMapContainer>
 * ```
 */
export function AnimatedMapContainer({
  children,
  zoomLevel = 1,
  zoomTarget = { x: 0.5, y: 0.5 },
  transitionDuration = 400,
  className = '',
}: AnimatedMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Handle animation state for will-change optimization
  const handleTransitionStart = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const handleTransitionEnd = useCallback(() => {
    setIsAnimating(false);
  }, []);

  // Track zoom level changes to trigger animation class
  useEffect(() => {
    if (!prefersReducedMotion) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, transitionDuration);
      return () => clearTimeout(timer);
    }
  }, [zoomLevel, zoomTarget?.x, zoomTarget?.y, transitionDuration, prefersReducedMotion]);

  // Calculate transform values
  // Scale: zoomLevel 1 = scale(1), zoomLevel 2 = scale(1.5), zoomLevel 3 = scale(2.5)
  const getScale = (level: number): number => {
    if (level <= 1) return 1;
    if (level === 2) return 1.5;
    if (level >= 3) return 2.5;
    // Linear interpolation for intermediate values
    if (level < 2) return 1 + (level - 1) * 0.5;
    return 1.5 + (level - 2) * 1;
  };

  const scale = getScale(zoomLevel);

  // Calculate translation to center on target
  // When zoomed, we need to translate to keep the target centered
  // Formula: translate = (0.5 - target) * (scale - 1) * 100%
  const translateX = (0.5 - zoomTarget.x) * (scale - 1) * 100;
  const translateY = (0.5 - zoomTarget.y) * (scale - 1) * 100;

  // Build inline styles for transform
  const transformStyle: React.CSSProperties = {
    transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
    transformOrigin: `${zoomTarget.x * 100}% ${zoomTarget.y * 100}%`,
    transition: prefersReducedMotion
      ? 'none'
      : `transform var(--map-zoom-duration, ${transitionDuration}ms) var(--map-zoom-easing, cubic-bezier(0.16, 1, 0.3, 1))`,
    willChange: isAnimating ? 'transform' : 'auto',
  };

  return (
    <div
      className={`map-zoom-wrapper overflow-hidden ${className}`}
      style={{ position: 'relative' }}
    >
      <div
        ref={containerRef}
        className={`map-zoom-container ${isAnimating ? 'animating' : ''}`}
        style={transformStyle}
        onTransitionStart={handleTransitionStart}
        onTransitionEnd={handleTransitionEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default AnimatedMapContainer;
