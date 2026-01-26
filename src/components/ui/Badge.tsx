'use client';

import { HTMLAttributes } from 'react';

export type BadgeVariant =
  | 'excellent'    // Green - success/positive states
  | 'healthy'      // Purple - Democrat/normal states
  | 'attention'    // Amber - needs attention (WCAG compliant)
  | 'at-risk'      // Red - critical/negative states
  | 'neutral'      // Gray - neutral/inactive states
  | 'info';        // Blue - informational states

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Shows animated pulse indicator */
  showPulse?: boolean;
  /** Custom dot color (overrides variant color) */
  dotColor?: string;
  /** Icon to display before the label */
  leftIcon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, {
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  excellent: {
    bg: 'var(--status-excellent-bg)',
    text: 'var(--status-excellent)',
    border: 'var(--status-excellent-border)',
    dot: 'var(--status-excellent)',
  },
  healthy: {
    bg: 'var(--status-healthy-bg)',
    text: 'var(--brand-primary)',
    border: 'var(--status-healthy-border)',
    dot: 'var(--brand-primary)',
  },
  attention: {
    bg: 'var(--status-attention-bg)',
    text: 'var(--status-attention-dark)',
    border: 'var(--status-attention-border)',
    dot: 'var(--status-attention)',
  },
  'at-risk': {
    bg: 'var(--status-at-risk-bg)',
    text: 'var(--status-at-risk)',
    border: 'var(--status-at-risk-border)',
    dot: 'var(--status-at-risk)',
  },
  neutral: {
    bg: 'var(--status-neutral-bg)',
    text: 'var(--status-neutral)',
    border: 'var(--status-neutral-border)',
    dot: 'var(--text-disabled)',
  },
  info: {
    bg: 'var(--status-info-bg)',
    text: 'var(--status-info-dark)',
    border: 'var(--status-info-border)',
    dot: 'var(--status-info)',
  },
};

const sizeStyles: Record<BadgeSize, {
  padding: string;
  fontSize: string;
  gap: string;
  dotSize: string;
  minHeight: string;
}> = {
  sm: {
    padding: 'px-2 py-0.5',
    fontSize: 'text-[10px]',
    gap: 'gap-1',
    dotSize: 'w-1.5 h-1.5',
    minHeight: 'min-h-[20px]',
  },
  md: {
    padding: 'px-3 py-1',
    fontSize: 'text-xs',
    gap: 'gap-1.5',
    dotSize: 'w-2 h-2',
    minHeight: 'min-h-[24px]',
  },
  lg: {
    padding: 'px-4 py-1.5',
    fontSize: 'text-sm',
    gap: 'gap-2',
    dotSize: 'w-2.5 h-2.5',
    minHeight: 'min-h-[32px]',
  },
};

/**
 * Badge primitive for status indicators with consistent styling and optional pulse animation.
 *
 * Variants:
 * - excellent: Green for success/positive states (e.g., "Both parties running")
 * - healthy: Purple for Democrat/normal states (e.g., "Democrat filed")
 * - attention: Amber for states needing attention - WCAG AA compliant
 * - at-risk: Red for critical/negative states (e.g., "At risk")
 * - neutral: Gray for neutral/inactive states (e.g., "Unknown")
 * - info: Blue for informational states (e.g., "Defensive")
 *
 * Features:
 * - Optional animated pulse indicator (great for "live" status)
 * - Three sizes for different contexts
 * - Gradient backgrounds for depth
 * - Accessible contrast ratios
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  showPulse = false,
  dotColor,
  leftIcon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];
  const sizeClasses = sizeStyles[size];
  const effectiveDotColor = dotColor || styles.dot;

  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${sizeClasses.padding}
        ${sizeClasses.fontSize}
        ${sizeClasses.gap}
        ${sizeClasses.minHeight}
        font-semibold
        rounded-full
        whitespace-nowrap
        uppercase
        tracking-wide
        ${className}
      `}
      style={{
        background: styles.bg,
        color: styles.text,
        border: `1px solid ${styles.border}`,
      }}
      {...props}
    >
      {showPulse && (
        <span
          className={`relative ${sizeClasses.dotSize} rounded-full flex-shrink-0`}
          style={{ background: effectiveDotColor }}
          aria-hidden="true"
        >
          {/* Pulse ring animation */}
          <span
            className={`absolute inset-[-3px] rounded-full animate-pulse-ring`}
            style={{ background: effectiveDotColor }}
          />
        </span>
      )}
      {leftIcon && !showPulse && (
        <span className={sizeClasses.dotSize} aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
    </span>
  );
}

export default Badge;
