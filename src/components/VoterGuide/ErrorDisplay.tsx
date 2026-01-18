'use client';

/**
 * ErrorDisplay Component
 *
 * A reusable error, warning, and info display component with severity levels.
 * Follows the glassmorphic design system with appropriate colors for each type.
 *
 * Features:
 * - Three severity levels: error, warning, info
 * - Appropriate ARIA roles for accessibility
 * - Optional suggestion text
 * - Optional recovery action (link or button)
 * - Smooth entrance animation
 */

export interface ErrorDisplayProps {
  /** The severity type of the message */
  type: 'error' | 'warning' | 'info';
  /** The main message to display */
  message: string;
  /** Optional suggestion text shown below the message */
  suggestion?: string;
  /** Optional recovery action (link or onClick handler) */
  recoveryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Icons for each severity type
 */
function ErrorIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

/**
 * Style configurations for each severity type
 */
const styleConfig = {
  error: {
    background: 'var(--color-at-risk-bg)',
    border: 'rgba(220, 38, 38, 0.3)',
    color: 'var(--color-at-risk)',
    Icon: ErrorIcon,
    role: 'alert' as const,
  },
  warning: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    color: 'rgb(180, 83, 9)',
    Icon: WarningIcon,
    role: 'status' as const,
  },
  info: {
    background: 'var(--class-purple-bg)',
    border: 'var(--class-purple-light)',
    color: 'var(--class-purple)',
    Icon: InfoIcon,
    role: 'status' as const,
  },
};

/**
 * Reusable error/warning/info display component.
 * Accessible with appropriate ARIA roles and supports recovery actions.
 *
 * @example
 * ```tsx
 * // Simple error
 * <ErrorDisplay type="error" message="Address not found" />
 *
 * // Error with suggestion
 * <ErrorDisplay
 *   type="error"
 *   message="Address not found"
 *   suggestion="Check the spelling or try a nearby address."
 * />
 *
 * // Warning with recovery action
 * <ErrorDisplay
 *   type="warning"
 *   message="PO Box may not accurately determine your district"
 *   suggestion="Try your residential address."
 *   recoveryAction={{
 *     label: "Look up county office",
 *     href: "https://scvotes.gov",
 *   }}
 * />
 * ```
 */
export function ErrorDisplay({
  type,
  message,
  suggestion,
  recoveryAction,
}: ErrorDisplayProps) {
  const config = styleConfig[type];
  const { Icon, role, background, border, color } = config;

  const handleActionClick = (e: React.MouseEvent) => {
    if (recoveryAction?.onClick) {
      e.preventDefault();
      recoveryAction.onClick();
    }
  };

  return (
    <div
      className="flex items-start gap-3 mt-4 p-3 rounded-lg animate-entrance"
      style={{
        background,
        border: `1px solid ${border}`,
      }}
      role={role}
    >
      <div style={{ color }} className="mt-0.5">
        <Icon />
      </div>

      <div className="flex-1 min-w-0">
        {/* Main message */}
        <p className="text-sm font-medium" style={{ color }}>
          {message}
        </p>

        {/* Suggestion text */}
        {suggestion && (
          <p
            className="text-xs mt-1"
            style={{ color, opacity: 0.85 }}
          >
            {suggestion}
          </p>
        )}

        {/* Recovery action */}
        {recoveryAction && (
          recoveryAction.href ? (
            <a
              href={recoveryAction.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium mt-2 underline hover:no-underline"
              style={{ color }}
            >
              {recoveryAction.label}
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1 text-xs font-medium mt-2 underline hover:no-underline"
              style={{ color }}
            >
              {recoveryAction.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default ErrorDisplay;
