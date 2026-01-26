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
  onClick?: () => void;
  className?: string;
  animationDelay?: number;
}

const variantStyles: Record<KPIVariant, {
  valueColor: string;
  accentColor: string;
}> = {
  democrat: {
    valueColor: 'var(--party-dem)',
    accentColor: 'var(--party-dem)',
  },
  republican: {
    valueColor: 'var(--party-rep)',
    accentColor: 'var(--party-rep)',
  },
  contested: {
    valueColor: 'var(--status-excellent)',
    accentColor: 'var(--status-excellent)',
  },
  unknown: {
    valueColor: 'var(--text-muted)',
    accentColor: 'var(--status-attention)',
  },
  empty: {
    valueColor: 'var(--text-disabled)',
    accentColor: 'var(--border-default-solid)',
  },
  default: {
    valueColor: 'var(--text-primary)',
    accentColor: 'var(--brand-primary)',
  },
};

/**
 * Clean KPI Card with animated counter - Class Dashboard Style
 */
export function KPICard({
  label,
  value,
  variant = 'default',
  suffix = '',
  prefix = '',
  subtext,
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
        animationDelay: `${animationDelay}ms`,
        cursor: isClickable ? 'pointer' : 'default',
        borderTop: `3px solid ${styles.accentColor}`,
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
      {/* Label */}
      <div className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>

      {/* Animated value */}
      <div className="font-display">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="text-2xl font-bold tracking-tight"
          style={{ color: styles.valueColor }}
          duration={1500}
          formatNumber={(num) => Math.round(num).toLocaleString()}
        />
      </div>

      {/* Optional subtext */}
      {subtext && (
        <p className="text-xs mt-2 pt-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle-solid)' }}>
          {subtext}
        </p>
      )}

      {/* Accessible value for screen readers */}
      <span className="sr-only">
        {label}: {prefix}{value}{suffix}
      </span>
    </div>
  );
}

export default KPICard;
