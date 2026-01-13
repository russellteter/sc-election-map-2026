'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  formatNumber?: (num: number) => string;
}

/**
 * Animated counter that counts up from 0 to a target value
 * Uses requestAnimationFrame for smooth 60fps animations
 * Respects prefers-reduced-motion accessibility setting
 */
export function AnimatedCounter({
  value,
  duration = 1500,
  suffix = '',
  prefix = '',
  className = '',
  formatNumber: customFormat,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Default number formatter
  const formatNumber = customFormat || ((num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 10000) {
      return Math.round(num).toLocaleString();
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return Math.round(num).toLocaleString();
  });

  // Expo-out easing for satisfying deceleration
  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Reset for new animation
    startTimeRef.current = null;
    const startValue = hasAnimated ? displayValue : 0;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setHasAnimated(true);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return (
    <span
      ref={elementRef}
      className={className}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
}

export default AnimatedCounter;
