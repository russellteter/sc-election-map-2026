/**
 * VoterGuideSummary - KPI summary card for voter guide results
 * Displays race count, county badge, and action buttons (Share, Print, Reset)
 */

interface VoterGuideSummaryProps {
  raceCount: number;
  countyName: string | null;
  shareUrl: string | null;
  onShare: () => void;
  onPrint: () => void;
  onReset: () => void;
}

export default function VoterGuideSummary({
  raceCount,
  countyName,
  shareUrl,
  onShare,
  onPrint,
  onReset,
}: VoterGuideSummaryProps) {
  return (
    <div className="kpi-summary-card animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        {/* Left side - Title and stats */}
        <div className="flex items-center gap-5">
          {/* Race count with animated counter */}
          <div className="text-center">
            <div
              className="font-display font-bold text-4xl animate-count-up gradient-text"
            >
              {raceCount}
            </div>
            <p className="text-xs font-medium uppercase tracking-wide mt-1" style={{ color: 'var(--text-muted)' }}>
              Races
            </p>
          </div>

          {/* Divider */}
          <div
            className="hidden sm:block w-px h-12"
            style={{ background: 'var(--class-purple-light)' }}
          />

          {/* Title and county */}
          <div>
            <h3 className="font-display font-bold text-xl gradient-text">
              Your 2026 Ballot
            </h3>
            {countyName && (
              <div className="mt-2">
                <span className="county-badge">
                  {countyName} County
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3 flex-wrap no-print">
          {shareUrl && (
            <button
              onClick={onShare}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'var(--class-purple-bg)',
                color: 'var(--class-purple)',
                border: '1px solid var(--class-purple-light)',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
          )}
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'var(--card-bg)',
              color: 'var(--text-color)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
          <button
            onClick={onReset}
            className="text-sm font-medium transition-colors hover:opacity-80 underline"
            style={{ color: 'var(--class-purple)' }}
          >
            Search another address
          </button>
        </div>
      </div>
    </div>
  );
}
