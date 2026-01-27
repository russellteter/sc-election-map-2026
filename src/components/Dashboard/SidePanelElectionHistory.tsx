'use client';

import type { DistrictElectionHistory } from '@/types/schema';

interface SidePanelElectionHistoryProps {
  history: DistrictElectionHistory;
}

const YEARS = ['2024', '2022', '2020'];

function getPartyColor(party: string): { bg: string; text: string } {
  const lower = party.toLowerCase();
  if (lower.includes('democrat')) {
    return { bg: 'var(--party-dem)', text: 'var(--party-dem)' };
  }
  if (lower.includes('republican')) {
    return { bg: 'var(--party-rep)', text: 'var(--party-rep)' };
  }
  return { bg: 'var(--text-muted)', text: 'var(--text-muted)' };
}

function isDem(party: string): boolean {
  return party.toLowerCase().includes('democrat');
}

function lastName(name: string): string {
  const parts = name.split(' ');
  return parts[parts.length - 1];
}

export default function SidePanelElectionHistory({ history }: SidePanelElectionHistoryProps) {
  const years = YEARS.filter((y) => history.elections[y]);

  if (years.length === 0) return null;

  // Calculate trend
  const margins = years
    .slice()
    .reverse()
    .map((y) => {
      const e = history.elections[y];
      return isDem(e.winner.party) ? e.margin : -e.margin;
    });

  const trendChange = margins.length >= 2 ? margins[margins.length - 1] - margins[0] : 0;

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--surface-secondary)',
        borderLeft: '2px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)',
      }}
    >
      <div className="space-y-2.5">
        {years.map((year, idx) => {
          const election = history.elections[year];
          const { winner, runnerUp, uncontested, margin } = election;
          const winnerIsDem = isDem(winner.party);
          const winnerColor = getPartyColor(winner.party);

          if (uncontested) {
            return (
              <div key={year} className="flex items-center gap-2">
                <span
                  className="election-year-label text-[11px] font-medium font-display shrink-0"
                  style={{ color: 'var(--text-muted)', width: 32 }}
                >
                  {year}
                </span>
                <div className="flex-1">
                  <div
                    className="election-bar h-6 rounded overflow-hidden flex items-center px-2"
                    style={{
                      background: winnerColor.bg,
                      animationDelay: `${idx * 60}ms`,
                    }}
                  >
                    <span className="election-bar-label election-bar-name text-[10px] font-medium text-white"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                      {lastName(winner.name)} - Uncontested
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          const demPct = winnerIsDem ? winner.percentage : (runnerUp?.percentage ?? 0);
          const repPct = winnerIsDem ? (runnerUp?.percentage ?? 0) : winner.percentage;
          const demName = winnerIsDem ? winner.name : (runnerUp?.name ?? '');
          const repName = winnerIsDem ? (runnerUp?.name ?? '') : winner.name;
          const demWon = winnerIsDem;

          const marginLabel = winnerIsDem
            ? `D+${margin.toFixed(1)}`
            : `R+${margin.toFixed(1)}`;

          return (
            <div key={year}>
              <div className="flex items-center gap-2">
                <span
                  className="election-year-label text-[11px] font-medium font-display shrink-0"
                  style={{ color: 'var(--text-muted)', width: 32 }}
                >
                  {year}
                </span>
                <div className="flex-1">
                  <div
                    className="election-bar h-6 rounded overflow-hidden flex"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Democratic segment */}
                    <div
                      className="h-full flex items-center px-1.5 overflow-hidden"
                      style={{
                        width: `${demPct}%`,
                        background: 'var(--party-dem)',
                        opacity: demWon ? 1 : 0.7,
                      }}
                    >
                      <span
                        className="election-bar-label election-bar-name text-[10px] font-medium text-white truncate"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {lastName(demName)} {demPct.toFixed(0)}%
                      </span>
                    </div>
                    {/* Republican segment */}
                    <div
                      className="h-full flex items-center justify-end px-1.5 overflow-hidden"
                      style={{
                        width: `${repPct}%`,
                        background: 'var(--party-rep)',
                        opacity: demWon ? 0.7 : 1,
                      }}
                    >
                      <span
                        className="election-bar-label election-bar-name text-[10px] font-medium text-white truncate"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                      >
                        {lastName(repName)} {repPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-[40px] mt-0.5">
                <span
                  className="text-[10px] font-medium"
                  style={{ color: winnerColor.text }}
                >
                  {marginLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trend summary */}
      <div
        className="mt-3 pt-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--class-purple-light)' }}
      >
        {history.competitiveness && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: history.competitiveness.score >= 60
                ? 'rgba(5, 150, 105, 0.12)'
                : history.competitiveness.score >= 30
                ? 'rgba(217, 119, 6, 0.12)'
                : 'rgba(107, 114, 128, 0.12)',
              color: history.competitiveness.score >= 60
                ? 'var(--color-excellent)'
                : history.competitiveness.score >= 30
                ? 'var(--color-attention)'
                : 'var(--text-muted)',
            }}
          >
            {history.competitiveness.score >= 60
              ? 'Competitive'
              : history.competitiveness.score >= 30
              ? 'Leaning'
              : 'Safe'}
            {' '}{history.competitiveness.score}
          </span>
        )}
        {margins.length >= 2 && (
          <span
            className="text-[10px] font-medium flex items-center gap-1"
            style={{
              color: trendChange > 0 ? 'var(--color-excellent)' : trendChange < 0 ? 'var(--color-at-risk)' : 'var(--text-muted)',
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {trendChange > 0 ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              ) : trendChange < 0 ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
              )}
            </svg>
            {trendChange > 0 ? '+' : ''}{trendChange.toFixed(1)}% Dem margin
          </span>
        )}
      </div>
    </div>
  );
}
