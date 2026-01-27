'use client';

export interface DemoBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Demo Data Badge
 *
 * Consistent badge to indicate when data is demo/placeholder data
 * rather than live API data.
 */
export default function DemoBadge({ size = 'sm', className = '' }: DemoBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-xs'
    : 'px-2 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses} ${className}`}
      style={{
        background: 'var(--warning-100)',
        color: 'var(--warning-700)',
        border: '1px solid var(--warning-100)',
      }}
      title="This data is simulated for demonstration purposes"
    >
      <svg
        className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Demo Data
    </span>
  );
}
