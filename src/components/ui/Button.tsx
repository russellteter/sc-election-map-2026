'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon to display before the label */
  leftIcon?: React.ReactNode;
  /** Icon to display after the label */
  rightIcon?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, {
  base: string;
  hover: string;
  active: string;
}> = {
  primary: {
    base: 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]',
    hover: 'hover:bg-[var(--brand-primary-hover)] hover:border-[var(--brand-primary-hover)] hover:shadow-[var(--shadow-primary)]',
    active: 'active:bg-[var(--brand-primary-active)]',
  },
  secondary: {
    base: 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-default-solid)]',
    hover: 'hover:bg-[var(--background-alt)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
    active: 'active:bg-[var(--brand-primary-light)]',
  },
  ghost: {
    base: 'bg-transparent text-[var(--text-secondary)] border-transparent',
    hover: 'hover:bg-[var(--highlight-purple)] hover:text-[var(--brand-primary)]',
    active: 'active:bg-[var(--brand-primary-light)]',
  },
  danger: {
    base: 'bg-[var(--status-at-risk)] text-white border-[var(--status-at-risk)]',
    hover: 'hover:bg-[var(--status-at-risk-dark)] hover:border-[var(--status-at-risk-dark)] hover:shadow-[var(--shadow-danger)]',
    active: 'active:bg-[#991b1b]',
  },
};

const sizeStyles: Record<ButtonSize, {
  padding: string;
  fontSize: string;
  minHeight: string;
  iconSize: string;
  gap: string;
}> = {
  sm: {
    padding: 'px-3 py-1.5',
    fontSize: 'text-xs',
    minHeight: 'min-h-[36px]',
    iconSize: 'w-3.5 h-3.5',
    gap: 'gap-1.5',
  },
  md: {
    padding: 'px-4 py-2',
    fontSize: 'text-sm',
    minHeight: 'min-h-[44px]', // WCAG touch target
    iconSize: 'w-4 h-4',
    gap: 'gap-2',
  },
  lg: {
    padding: 'px-6 py-3',
    fontSize: 'text-base',
    minHeight: 'min-h-[52px]',
    iconSize: 'w-5 h-5',
    gap: 'gap-2.5',
  },
};

/**
 * Button primitive with consistent styling, accessibility, and touch targets.
 *
 * Variants:
 * - primary: Purple filled button for primary actions
 * - secondary: White with purple border for secondary actions
 * - ghost: Transparent background for tertiary actions
 * - danger: Red filled button for destructive actions
 *
 * Sizes:
 * - sm: Small buttons for compact UI
 * - md: Default size with 44px min-height (WCAG touch target)
 * - lg: Large buttons for prominent CTAs
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = false,
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = variantStyles[variant];
    const sizeClasses = sizeStyles[size];
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          ${sizeClasses.padding}
          ${sizeClasses.fontSize}
          ${sizeClasses.minHeight}
          ${sizeClasses.gap}
          font-medium
          rounded-[var(--radius-md)]
          border
          transition-all duration-[var(--transition-fast)]
          focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)] focus-visible:outline-offset-2
          ${variantClasses.base}
          ${!isDisabled ? variantClasses.hover : ''}
          ${!isDisabled ? variantClasses.active : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className={`${sizeClasses.iconSize} animate-spin`}
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className={sizeClasses.iconSize} aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className={sizeClasses.iconSize} aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
