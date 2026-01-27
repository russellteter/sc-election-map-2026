'use client';

import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface DataFreshnessBadgeProps {
  /** ISO 8601 date string of when the data was last updated */
  lastUpdated: string;
  /** Additional CSS classes */
  className?: string;
}

type FreshnessVariant = 'fresh' | 'recent' | 'stale';

interface FreshnessConfig {
  variant: FreshnessVariant;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

const freshnessConfigs: Record<FreshnessVariant, FreshnessConfig> = {
  fresh: {
    variant: 'fresh',
    bg: 'var(--success-50)',
    text: 'var(--accent-emerald)',
    border: 'var(--success-100)',
    dot: 'var(--accent-emerald)',
  },
  recent: {
    variant: 'recent',
    bg: 'var(--slate-100)',
    text: 'var(--slate-500)',
    border: 'var(--slate-200)',
    dot: 'var(--slate-400)',
  },
  stale: {
    variant: 'stale',
    bg: 'var(--warning-100)',
    text: 'var(--warning-700)',
    border: 'var(--warning-100)',
    dot: 'var(--accent-amber)',
  },
};

/**
 * Calculates the freshness variant based on the time elapsed since lastUpdated.
 * - Fresh: < 24 hours
 * - Recent: 1-7 days
 * - Stale: > 7 days
 */
function calculateFreshness(lastUpdated: string): FreshnessVariant {
  const updateDate = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours < 24) {
    return 'fresh';
  } else if (diffDays <= 7) {
    return 'recent';
  } else {
    return 'stale';
  }
}

/**
 * Formats the relative time for display.
 * Desktop: "Updated 2h ago" or "Updated Jan 24"
 */
function formatRelativeTime(lastUpdated: string): { short: string; full: string } {
  const updateDate = new Date(lastUpdated);
  const now = new Date();
  const diffMs = now.getTime() - updateDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Full date for aria-label
  const fullDate = updateDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  // Short display text
  let shortText: string;
  if (diffMinutes < 1) {
    shortText = 'Just now';
  } else if (diffMinutes < 60) {
    shortText = `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    shortText = `${diffHours}h ago`;
  } else if (diffDays === 1) {
    shortText = 'Yesterday';
  } else if (diffDays < 7) {
    shortText = `${diffDays}d ago`;
  } else {
    // Show date for older updates
    shortText = updateDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return {
    short: shortText,
    full: `Data last updated ${fullDate}`,
  };
}

/**
 * DataFreshnessBadge - Shows when candidate data was last updated with visual freshness indication.
 *
 * Variants:
 * - Fresh (< 24 hours): Green with subtle pulse animation
 * - Recent (1-7 days): Gray, no animation
 * - Stale (> 7 days): Amber with attention indicator
 *
 * Responsive behavior:
 * - Desktop: "Updated 2h ago" with icon
 * - Mobile: Icon-only with tooltip on tap
 *
 * Accessibility:
 * - Includes aria-label with full date
 * - Respects prefers-reduced-motion
 */
export function DataFreshnessBadge({
  lastUpdated,
  className = '',
}: DataFreshnessBadgeProps) {
  const prefersReducedMotion = useReducedMotion();

  const { variant, config, timeDisplay } = useMemo(() => {
    const v = calculateFreshness(lastUpdated);
    return {
      variant: v,
      config: freshnessConfigs[v],
      timeDisplay: formatRelativeTime(lastUpdated),
    };
  }, [lastUpdated]);

  const showPulse = variant === 'fresh' && !prefersReducedMotion;
  const showAttentionIndicator = variant === 'stale';

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-0.5 sm:px-3 sm:py-1
        text-[10px] sm:text-xs
        gap-1 sm:gap-1.5
        min-h-[20px] sm:min-h-[24px]
        font-medium
        rounded-full
        whitespace-nowrap
        transition-all duration-200
        ${className}
      `}
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
      aria-label={timeDisplay.full}
      title={timeDisplay.full}
      role="status"
    >
      {/* Icon / Indicator */}
      <span
        className="relative w-3 h-3 sm:w-4 sm:h-4 flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        {showAttentionIndicator ? (
          // Attention indicator for stale data
          <svg
            className="w-full h-full"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ) : (
          // Clock icon with optional pulse
          <>
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {showPulse && (
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  background: config.dot,
                  opacity: 0.3,
                  animationDuration: '2s',
                }}
              />
            )}
          </>
        )}
      </span>

      {/* Text - hidden on mobile (shown on sm+) */}
      <span className="hidden sm:inline">
        Updated {timeDisplay.short}
      </span>
    </span>
  );
}

export default DataFreshnessBadge;
