'use client';

import { Skeleton } from './Skeleton';

interface CandidateCardSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading state for candidate cards in the side panel.
 * Matches the glassmorphic candidate card layout.
 */
export function CandidateCardSkeleton({ count = 3 }: CandidateCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-surface rounded-lg p-4"
          style={{
            animationDelay: `${i * 50}ms`,
          }}
        >
          {/* Name and badges row */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Candidate name */}
              <Skeleton height={20} width="70%" className="mb-3" />
              {/* Badge row */}
              <div className="flex items-center gap-2">
                <Skeleton height={22} width={80} rounded="full" />
                <Skeleton height={22} width={70} rounded="full" />
              </div>
            </div>
          </div>

          {/* Filed date and status */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton height={16} width={16} rounded="sm" />
              <Skeleton height={14} width={120} />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton height={16} width={16} rounded="sm" />
              <Skeleton height={14} width={100} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CandidateCardSkeleton;
