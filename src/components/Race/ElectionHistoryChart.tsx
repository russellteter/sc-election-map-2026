'use client';

import { useMemo } from 'react';
import type { DistrictElectionHistory, ElectionResult } from '@/types/schema';

interface ElectionHistoryChartProps {
  history: DistrictElectionHistory;
}

/**
 * Election History Chart - Visual representation of 2020/2022/2024 election results
 * Shows margin trends and party performance over time with bar chart visualization.
 */
export default function ElectionHistoryChart({ history }: ElectionHistoryChartProps) {
  const elections = useMemo(() => {
    const years = ['2020', '2022', '2024'];
    return years
      .filter((yearStr) => history.elections[yearStr])
      .map((yearStr) => history.elections[yearStr]);
  }, [history]);

  if (elections.length === 0) {
    return (
      <div
        className="text-center py-8"
        style={{ color: 'var(--text-muted)' }}
      >
        No election history available
      </div>
    );
  }

  // Calculate max votes for scaling
  const maxVotes = Math.max(...elections.map((e) => e.totalVotes));

  return (
    <div className="space-y-4">
      {/* Chart header */}
      <div className="flex items-center justify-between mb-2">
        <h4
          className="text-sm font-semibold"
          style={{ color: 'var(--text-color)' }}
        >
          Election Results
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ background: 'var(--party-dem)' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>Democrat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ background: 'var(--party-rep)' }}
            />
            <span style={{ color: 'var(--text-muted)' }}>Republican</span>
          </div>
        </div>
      </div>

      {/* Election bars */}
      <div className="space-y-3">
        {elections.map((election, index) => (
          <ElectionBar
            key={election.year}
            election={election}
            maxVotes={maxVotes}
            index={index}
          />
        ))}
      </div>

      {/* Trend indicator */}
      {elections.length >= 2 && (
        <TrendSummary elections={elections} competitiveness={history.competitiveness} />
      )}
    </div>
  );
}

interface ElectionBarProps {
  election: ElectionResult;
  maxVotes: number;
  index: number;
}

function ElectionBar({ election, maxVotes, index }: ElectionBarProps) {
  const winnerIsDem = election.winner.party?.toLowerCase() === 'democratic';
  const runnerUpIsDem = election.runnerUp?.party?.toLowerCase() === 'democratic';

  // Calculate bar widths
  const winnerWidth = (election.winner.votes / maxVotes) * 100;
  const runnerUpWidth = election.runnerUp
    ? (election.runnerUp.votes / maxVotes) * 100
    : 0;

  return (
    <div
      className="animate-entrance"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Year label */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-color)' }}
        >
          {election.year}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {election.totalVotes.toLocaleString()} votes
        </span>
      </div>

      {/* Stacked bar */}
      <div
        className="relative h-8 rounded-md overflow-hidden"
        style={{ background: 'var(--party-dem-bg)' }}
      >
        {election.uncontested ? (
          // Uncontested race - single full bar
          <div
            className="absolute inset-y-0 left-0 flex items-center justify-end px-2 text-xs font-medium text-white transition-all duration-500"
            style={{
              width: `${winnerWidth}%`,
              background: winnerIsDem ? 'var(--party-dem)' : 'var(--party-rep)',
            }}
          >
            <span className="truncate">
              Uncontested - {election.winner.name}
            </span>
          </div>
        ) : (
          // Contested race - show both candidates
          <>
            {/* Winner bar */}
            <div
              className="absolute inset-y-0 left-0 flex items-center px-2 text-xs font-medium text-white transition-all duration-500"
              style={{
                width: `${winnerWidth}%`,
                background: winnerIsDem ? 'var(--party-dem)' : 'var(--party-rep)',
              }}
            >
              <span className="truncate">
                {election.winner.percentage.toFixed(1)}% - {election.winner.name}
              </span>
            </div>

            {/* Runner-up bar (positioned after winner) */}
            {election.runnerUp && (
              <div
                className="absolute inset-y-0 flex items-center justify-end px-2 text-xs font-medium text-white transition-all duration-500"
                style={{
                  left: `${winnerWidth}%`,
                  width: `${runnerUpWidth}%`,
                  background: runnerUpIsDem ? 'var(--party-dem)' : 'var(--party-rep)',
                  opacity: 0.8,
                }}
              >
                <span className="truncate">
                  {election.runnerUp.percentage.toFixed(1)}%
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Margin indicator */}
      {!election.uncontested && (
        <div className="flex items-center justify-between mt-1">
          <span
            className="text-xs"
            style={{
              color: winnerIsDem ? 'var(--party-dem)' : 'var(--party-rep)',
            }}
          >
            {winnerIsDem ? 'D' : 'R'}+{election.margin.toFixed(1)}%
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {election.marginVotes.toLocaleString()} vote margin
          </span>
        </div>
      )}
    </div>
  );
}

interface TrendSummaryProps {
  elections: ElectionResult[];
  competitiveness: {
    score: number;
    avgMargin: number;
    hasSwung: boolean;
    contestedRaces: number;
    dominantParty: string | null;
  };
}

function TrendSummary({ elections, competitiveness }: TrendSummaryProps) {
  // Calculate margin trend between first and last election
  const firstElection = elections[0];
  const lastElection = elections[elections.length - 1];

  // For margin trend, we track if it's getting closer (better for challenger)
  const marginChange = firstElection.margin - lastElection.margin;
  const isTrendingCompetitive = marginChange > 0;

  // Determine if trending toward Democrats
  const demMarginFirst = firstElection.winner.party?.toLowerCase() === 'democratic'
    ? firstElection.margin
    : -firstElection.margin;
  const demMarginLast = lastElection.winner.party?.toLowerCase() === 'democratic'
    ? lastElection.margin
    : -lastElection.margin;
  const demTrend = demMarginLast - demMarginFirst;
  const isTrendingDem = demTrend > 0;

  return (
    <div
      className="mt-4 pt-4 border-t"
      style={{ borderColor: 'var(--border-default)' }}
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Competitiveness Score */}
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Competitiveness
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-lg font-bold"
              style={{
                color: competitiveness.score >= 70
                  ? 'var(--status-excellent)'
                  : competitiveness.score >= 40
                  ? 'var(--status-attention)'
                  : 'var(--text-muted)',
              }}
            >
              {competitiveness.score}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              / 100
            </span>
          </div>
        </div>

        {/* Margin Trend */}
        <div>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Dem Trend
          </p>
          <div className="flex items-center gap-1">
            <span
              className="text-lg"
              style={{
                color: isTrendingDem ? 'var(--status-excellent)' : 'var(--party-rep)',
              }}
            >
              {isTrendingDem ? '+' : ''}{demTrend.toFixed(1)}%
            </span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                color: isTrendingDem ? 'var(--status-excellent)' : 'var(--party-rep)',
              }}
            >
              {isTrendingDem ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Additional stats */}
      <div className="flex flex-wrap gap-2 mt-3">
        {competitiveness.hasSwung && (
          <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">
            Swing District
          </span>
        )}
        <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-700">
          {competitiveness.contestedRaces} of {elections.length} contested
        </span>
        {competitiveness.avgMargin < 10 && (
          <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
            Highly Competitive
          </span>
        )}
      </div>
    </div>
  );
}
