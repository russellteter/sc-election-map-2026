import { Suspense } from 'react';
import RaceProfileClient from '@/components/Race/RaceProfileClient';

// Force static generation - this page uses generateStaticParams and
// client-side searchParams access only (not server-side)
export const dynamic = 'force-static';

/**
 * Generate all possible chamber/district combinations for static export
 */
export function generateStaticParams() {
  const params: { chamber: string; district: string }[] = [];

  // House districts: 1-124
  for (let i = 1; i <= 124; i++) {
    params.push({ chamber: 'house', district: String(i) });
  }

  // Senate districts: 1-46
  for (let i = 1; i <= 46; i++) {
    params.push({ chamber: 'senate', district: String(i) });
  }

  return params;
}

interface PageProps {
  params: Promise<{
    chamber: string;
    district: string;
  }>;
}

/**
 * Race Profile Page - Dynamic route for individual district races
 * Path: /race/[chamber]/[district]
 * Example: /race/house/15, /race/senate/7
 */
export default async function RaceProfilePage({ params }: PageProps) {
  const { chamber, district } = await params;
  return (
    <Suspense fallback={<RaceProfileLoadingFallback />}>
      <RaceProfileClient chamber={chamber} district={district} />
    </Suspense>
  );
}

function RaceProfileLoadingFallback() {
  return (
    <div className="min-h-screen atmospheric-bg">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="skeleton skeleton-shimmer h-4 w-24 mx-auto rounded" />
            <div className="skeleton skeleton-shimmer h-10 w-48 mx-auto rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-shimmer h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
