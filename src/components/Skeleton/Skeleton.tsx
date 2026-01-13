'use client';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  animate?: boolean;
}

const roundedClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

/**
 * Base skeleton component with glassmorphic shimmer animation.
 * Used for loading states throughout the application.
 */
export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={`skeleton-base ${roundedClasses[rounded]} ${animate ? 'skeleton-shimmer' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
