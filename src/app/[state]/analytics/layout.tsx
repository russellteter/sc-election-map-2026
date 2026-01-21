import { StateProvider } from '@/context/StateContext';
import { ToastProvider } from '@/components/Toast';
import { getStateConfig } from '@/lib/stateConfig';
import { notFound } from 'next/navigation';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ state: string }>;
}

export default async function AnalyticsLayout({
  children,
  params,
}: AnalyticsLayoutProps) {
  const { state } = await params;
  const stateConfig = getStateConfig(state.toUpperCase());

  if (!stateConfig) {
    notFound();
  }

  return (
    <StateProvider stateCode={state.toUpperCase()}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </StateProvider>
  );
}

export async function generateStaticParams() {
  // Generate paths for all supported states
  const states = ['sc', 'nc', 'ga', 'fl', 'va'];
  return states.map((state) => ({
    state,
  }));
}
