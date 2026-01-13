'use client';

import { Skeleton } from './Skeleton';

/**
 * Skeleton loading state for the district map.
 * Displays a glassmorphic placeholder while SVG loads.
 */
export function MapSkeleton() {
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
      {/* Background shape placeholder */}
      <div
        className="absolute inset-0 skeleton-base skeleton-shimmer rounded-lg"
        style={{
          background: 'linear-gradient(135deg, var(--class-purple-bg) 0%, rgba(255, 255, 255, 0.95) 100%)',
        }}
      />

      {/* Centered loading indicator */}
      <div className="relative z-10 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ background: 'var(--class-purple-bg)' }}
        >
          <svg
            className="w-8 h-8 animate-pulse"
            style={{ color: 'var(--class-purple-light)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
        <Skeleton height={16} width={120} className="mx-auto mb-2" />
        <Skeleton height={12} width={80} className="mx-auto" />
      </div>

      {/* Simulated district regions */}
      <div className="absolute inset-4 pointer-events-none opacity-30">
        <Skeleton className="absolute top-[10%] left-[20%] w-[30%] h-[25%]" rounded="lg" />
        <Skeleton className="absolute top-[15%] right-[15%] w-[25%] h-[20%]" rounded="lg" />
        <Skeleton className="absolute bottom-[20%] left-[10%] w-[35%] h-[30%]" rounded="lg" />
        <Skeleton className="absolute bottom-[25%] right-[20%] w-[20%] h-[22%]" rounded="lg" />
      </div>
    </div>
  );
}

export default MapSkeleton;
