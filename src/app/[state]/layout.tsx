import { notFound } from 'next/navigation';
import { StateProvider } from '@/context/StateContext';
import { isStateActive, ACTIVE_STATE_CODES, getActiveStateConfig } from '@/lib/stateConfig';
import type { Metadata } from 'next';

interface StateLayoutProps {
  children: React.ReactNode;
  params: Promise<{ state: string }>;
}

/**
 * Generate static params for all active states
 * Required for static export to pre-render state routes
 */
export function generateStaticParams() {
  return ACTIVE_STATE_CODES.map((code) => ({
    state: code.toLowerCase(),
  }));
}

/**
 * Generate metadata for state pages
 */
export async function generateMetadata({ params }: StateLayoutProps): Promise<Metadata> {
  const { state } = await params;
  const config = getActiveStateConfig(state);

  if (!config) {
    return {
      title: 'State Not Found | Blue Intelligence',
    };
  }

  return {
    title: `${config.name} | Blue Intelligence`,
    description: `Election intelligence for ${config.name} - voter guide, opportunity scoring, and mobilization tools for Democratic campaigns`,
  };
}

/**
 * State Layout Component
 * Validates state code and provides state context to all child pages
 */
export default async function StateLayout({ children, params }: StateLayoutProps) {
  const { state } = await params;
  const stateCode = state.toUpperCase();

  // Validate state code
  if (!isStateActive(stateCode)) {
    notFound();
  }

  return (
    <StateProvider stateCode={stateCode}>
      {children}
    </StateProvider>
  );
}
