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

/**
 * Map variant to CSS class modifier
 */
const variantClasses: Record<KPIVariant, string> = {
  democrat: 'kpi-card--democrat',
  republican: 'kpi-card--republican',
  contested: 'kpi-card--contested',
  unknown: 'kpi-card--unknown',
  empty: 'kpi-card--empty',
  default: '',
};

/**
 * Clean KPI Card with animated counter - Class Dashboard Style
 * v4.0 - Uses CSS classes from components.css
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
  const variantClass = variantClasses[variant];
  const isClickable = !!onClick;

  return (
    <div
      className={`kpi-card animate-entrance ${variantClass} ${className}`.trim()}
      style={animationDelay > 0 ? { animationDelay: `${animationDelay}ms` } : undefined}
      data-clickable={isClickable}
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
      <div className="kpi-card__label">
        {label}
      </div>

      {/* Animated value */}
      <div className="font-display">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={suffix}
          className="kpi-card__value"
          duration={1500}
          formatNumber={(num) => Math.round(num).toLocaleString()}
        />
      </div>

      {/* Optional subtext */}
      {subtext && (
        <p className="kpi-card__subtext">
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
