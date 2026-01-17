import Link from 'next/link';

/**
 * VoterGuideHeader - Sticky header for the voter guide page
 * Contains back navigation and page title
 */
export default function VoterGuideHeader() {
  return (
    <header
      className="glass-surface border-b sticky top-0 z-50"
      style={{ borderColor: 'var(--class-purple-light)' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'var(--class-purple)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Map
            </Link>
          </div>
          <div className="text-right">
            <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-color)' }}>
              SC Voter Guide
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              2026 Elections
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
