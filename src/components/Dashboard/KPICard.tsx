'use client';

import { AnimatedCounter } from './AnimatedCounter';

export type KPIVariant = 'democrat' | 'republican' | 'unknown' | 'empty' | 'default' | 'contested';

interface KPICardProps {
  label: string;
  value: number;
  variant?: KPIVariant;
  suffix?: string;
  prefix?: string;
  subtext?: string;
  showPulse?: boolean;
  onClick?: () => void;
  className?: string;
  animationDelay?: number;
}

const variantStyles: Record<KPIVariant, {
  valueColor: string;
  pulseColor: string;
  accentColor: string;
  bgGradient: string;
}> = {
  democrat: {
    valueColor: 'var(--class-purple)',
    pulseColor: 'var(--class-purple)',
    accentColor: 'var(--class-purple)',
    bgGradient: 'linear-gradient(135deg, rgba(71, 57, 231, 0.02) 0%, rgba(71, 57, 231, 0.06) 100%)',
  },
  republican: {
    valueColor: 'var(--color-at-risk)',
    pulseColor: 'var(--color-at-risk)',
    accentColor: 'var(--color-at-risk)',
    bgGradient: 'linear-gradient(135deg, rgba(220, 38, 38, 0.02) 0%, rgba(220, 38, 38, 0.06) 100%)',
  },
  contested: {
    valueColor: 'var(--color-excellent)',
    pulseColor: 'var(--color-excellent)',
    accentColor: 'var(--color-excellent)',
    bgGradient: 'linear-gradient(135deg, rgba(5, 150, 105, 0.02) 0%, rgba(5, 150, 105, 0.06) 100%)',
  },
  unknown: {
    valueColor: 'var(--text-muted)',
    pulseColor: 'var(--color-attention)',
    accentColor: 'var(--color-attention)',
    bgGradient: 'linear-gradient(135deg, rgba(156, 163, 175, 0.02) 0%, rgba(156, 163, 175, 0.06) 100%)',
  },
  empty: {
    valueColor: '#9ca3af',
    pulseColor: 'var(--class-purple-light)',
    accentColor: 'var(--class-purple-light)',
    bgGradient: 'linear-gradient(135deg, rgba(218, 215, 250, 0.1) 0%, rgba(218, 215, 250, 0.2) 100%)',
  },
  default: {
    valueColor: 'var(--text-color)',
    pulseColor: 'var(--class-purple)',
    accentColor: 'var(--class-purple)',
    bgGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 247, 255, 0.7) 100%)',
  },
};

/**
 * Glassmorphic KPI Card with animated counter and pulsing status indicator
 */
export function KPICard({
  label,
  value,
  variant = 'default',
  suffix = '',
  prefix = '',
  subtext,
  showPulse = false,
  onClick,
  className = '',
  animationDelay = 0,
}: KPICardProps) {
  const styles = variantStyles[variant];
  const isClickable = !!onClick;

  return (
    <div
      className={`kpi-card animate-entrance ${className}`}
      style={{
        background: styles.bgGradient,
        animationDelay: `${animationDelay}ms`,
        cursor: isClickable ? 'pointer' : 'default',
        ['--accent-line-color' as string]: styles.accentColor,
      }}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
    >
      {/* Top accent line (animated on hover via CSS) */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] transform scale-x-0 origin-left transition-transform duration-300"
        style={{ background: styles.accentColor }}
      />

      {/* Label with optional pulse indicator */}
      <div className="flex items-center justify-center gap-2 mb-1">
        {showPulse && (
          <span
            className="pulse-indicator"
            style={{ background: styles.pulseColor }}
            aria-hidden="true"
          />
        )}
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
      </div>

      {/* Animated value */}
      <div className="font-display">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="text-2xl font-bold tracking-tight"
          duration={1500}
          formatNumber={(num) => Math.round(num).toLocaleString()}
        />
      </div>

      {/* Optional subtext */}
      {subtext && (
        <p
          className="text-xs mt-2 pt-2 border-t"
          style={{
            color: 'var(--text-muted)',
            borderColor: 'var(--highlight-purple)',
          }}
        >
          {subtext}
        </p>
      )}

      {/* Accessible value for screen readers */}
      <span className="sr-only">
        {label}: {prefix}{value}{suffix}
      </span>

      <style jsx>{`
        .kpi-card:hover > div:first-child {
          transform: scaleX(1);
        }
        .kpi-card .text-2xl {
          color: ${styles.valueColor};
        }
      `}</style>
    </div>
  );
}

export default KPICard;
