'use client';

import { HTMLAttributes } from 'react';

export type CardVariant = 'glass' | 'solid' | 'outlined';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Show top accent line on hover */
  showAccent?: boolean;
  /** Custom accent color (defaults to --class-purple) */
  accentColor?: string;
  /** Enable interactive lift effect on hover */
  interactive?: boolean;
  /** Padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<CardVariant, {
  background: string;
  border: string;
  backdrop: boolean;
}> = {
  glass: {
    background: 'var(--glass-gradient)',
    border: 'var(--glass-border)',
    backdrop: true,
  },
  solid: {
    background: 'var(--surface)',
    border: 'var(--border-subtle-solid)',
    backdrop: false,
  },
  outlined: {
    background: 'transparent',
    border: 'var(--border-default-solid)',
    backdrop: false,
  },
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Card primitive with glassmorphic styling and interactive hover effects.
 *
 * Variants:
 * - glass: Glassmorphic background with blur and gradient (default)
 * - solid: Solid white background
 * - outlined: Transparent with border only
 *
 * Features:
 * - Optional animated accent line on hover
 * - Interactive lift effect for clickable cards
 * - Noise texture overlay for premium depth (glass variant)
 * - Configurable padding
 */
export function Card({
  variant = 'glass',
  showAccent = true,
  accentColor = 'var(--brand-primary)',
  interactive = false,
  padding = 'md',
  className = '',
  children,
  onClick,
  ...props
}: CardProps) {
  const styles = variantStyles[variant];
  const isClickable = !!onClick;

  return (
    <div
      className={`
        relative
        rounded-[var(--radius-lg)]
        overflow-hidden
        transition-all duration-[var(--transition-fast)]
        ${paddingStyles[padding]}
        ${styles.backdrop ? 'backdrop-blur-[12px]' : ''}
        ${interactive || isClickable ? 'cursor-pointer' : ''}
        ${interactive || isClickable ? 'hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]' : ''}
        focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2
        ${className}
      `}
      style={{
        background: styles.background,
        border: `1px solid ${styles.border}`,
        boxShadow: 'var(--shadow-md)',
      }}
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      onKeyDown={isClickable ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      } : undefined}
      {...props}
    >
        {/* Top accent line (animated on hover) */}
        {showAccent && (
          <div
            className={`
              absolute top-0 left-0 right-0 h-[3px]
              transform origin-left
              transition-transform duration-300
              ${interactive || isClickable ? 'scale-x-0 group-hover:scale-x-100' : 'scale-x-0'}
            `}
            style={{ background: accentColor }}
            aria-hidden="true"
          />
        )}

        {/* Noise texture overlay for glass variant */}
        {variant === 'glass' && (
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              opacity: 0.03,
              mixBlendMode: 'overlay',
            }}
            aria-hidden="true"
          />
        )}

        {/* Card content */}
        <div className="relative z-10">
          {children}
        </div>

        {/* Hover effect styles */}
        <style jsx>{`
          div:hover > div:first-child {
            transform: scaleX(1);
          }
        `}</style>
    </div>
  );
}

/**
 * Card Header component for consistent card header styling
 */
export function CardHeader({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        pb-3 mb-3
        border-b border-[var(--border-subtle-solid)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Title component
 */
export function CardTitle({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`
        text-base font-semibold
        text-[var(--text-color)]
        font-[var(--font-display)]
        ${className}
      `}
      {...props}
    >
      {children}
    </h3>
  );
}

/**
 * Card Description component
 */
export function CardDescription({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`
        text-sm text-[var(--text-muted)]
        ${className}
      `}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Card Footer component
 */
export function CardFooter({
  className = '',
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`
        pt-3 mt-3
        border-t border-[var(--border-subtle-solid)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
