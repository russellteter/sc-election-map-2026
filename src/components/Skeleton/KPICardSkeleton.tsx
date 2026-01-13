'use client';

import { Skeleton } from './Skeleton';

interface KPICardSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading state for KPI card grid.
 * Matches the glassmorphic KPI card layout.
 */
export function KPICardSkeleton({ count = 4 }: KPICardSkeletonProps) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="kpi-card"
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        >
          {/* Label skeleton */}
          <Skeleton height={14} width="60%" className="mb-2" />
          {/* Value skeleton */}
          <Skeleton height={32} width="80%" />
        </div>
      ))}
    </div>
  );
}

export default KPICardSkeleton;
