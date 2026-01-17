'use client';

import { useState, useEffect } from 'react';
import { getLiveElectionTimeline, isConfigured, type LiveElectionTimeline } from '@/lib/ballotready';
import type { ElectionDatesData } from '@/types/schema';

interface ElectionCountdownProps {
  fallbackData?: ElectionDatesData;
}

export default function ElectionCountdown({ fallbackData }: ElectionCountdownProps) {
  const [timeline, setTimeline] = useState<LiveElectionTimeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTimeline() {
      // Check if API is configured
      if (!isConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getLiveElectionTimeline('SC');
        setTimeline(data);
      } catch (err) {
        console.error('Failed to fetch election timeline:', err);
        setError('Unable to load live election data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTimeline();
  }, []);

  // Use fallback data if API fails or isn't configured
  const useFallback = !timeline && fallbackData;

  // Calculate days until election from fallback
  const fallbackElectionDate = fallbackData?.dates.find(
    (d) => d.type === 'election' && d.category === 'election'
  );
  const fallbackDaysUntil = fallbackElectionDate
    ? Math.ceil(
        (new Date(fallbackElectionDate.date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // Determine phase colors
  const getPhaseColor = (phase: string | undefined, daysRemaining: number) => {
    if (daysRemaining <= 7) {
      return {
        bg: 'linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%)',
        border: '#FCA5A5',
        text: '#DC2626',
        accent: '#DC2626',
      };
    }
    if (daysRemaining <= 30) {
      return {
        bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        border: '#FCD34D',
        text: '#B45309',
        accent: '#B45309',
      };
    }
    if (phase === 'filing') {
      return {
        bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
        border: '#93C5FD',
        text: '#1D4ED8',
        accent: '#1D4ED8',
      };
    }
    return {
      bg: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      border: '#6EE7B7',
      text: '#059669',
      accent: '#059669',
    };
  };

  const daysRemaining = timeline?.daysUntilElection ?? fallbackDaysUntil ?? 0;
  const colors = getPhaseColor(timeline?.phase, daysRemaining);

  if (isLoading) {
    return (
      <div className="rounded-lg p-6 animate-pulse" style={{ background: 'var(--card-bg)' }}>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Countdown Card */}
      <div
        className="rounded-xl p-6 shadow-sm"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Countdown Circle */}
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={colors.border}
                strokeWidth="8"
                opacity="0.3"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={colors.accent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(100, (daysRemaining / 365) * 100) * 2.83} 283`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-display font-bold text-3xl"
                style={{ color: colors.text }}
              >
                {daysRemaining}
              </span>
              <span className="text-xs font-medium uppercase" style={{ color: colors.text }}>
                days
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: colors.text }}>
              {timeline?.phase === 'filing'
                ? 'Filing Period'
                : timeline?.phase === 'primary'
                  ? 'Primary Season'
                  : 'Until Election Day'}
            </p>
            <h3 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-color)' }}>
              {timeline?.electionName || '2026 General Election'}
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {timeline?.electionDay
                ? new Date(timeline.electionDay + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : fallbackElectionDate
                  ? new Date(fallbackElectionDate.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'November 3, 2026'}
            </p>

            {/* Live Badge */}
            {timeline && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.6)', color: colors.text }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: colors.accent }} />
                Live from BallotReady
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Milestone */}
      {timeline?.nextMilestone && (
        <div
          className="rounded-lg p-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: colors.accent }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Next Milestone
                </p>
                <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                  {timeline.nextMilestone.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(timeline.nextMilestone.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display font-bold text-2xl" style={{ color: colors.accent }}>
                {timeline.nextMilestone.daysRemaining}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>days</p>
            </div>
          </div>
        </div>
      )}

      {/* Filing Deadlines (if in filing period) */}
      {timeline?.filingDeadlines && timeline.filingDeadlines.length > 0 && (
        <div
          className="rounded-lg p-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-subtle)' }}
        >
          <h4 className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-color)' }}>
            Upcoming Filing Deadlines
          </h4>
          <div className="space-y-2">
            {timeline.filingDeadlines.slice(0, 3).map((deadline, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: deadline.daysRemaining <= 7 ? '#DC2626' : '#1D4ED8' }}
                  />
                  <span style={{ color: 'var(--text-color)' }}>{deadline.positionName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(deadline.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded"
                    style={{
                      background: deadline.daysRemaining <= 7 ? '#FEF2F2' : '#DBEAFE',
                      color: deadline.daysRemaining <= 7 ? '#DC2626' : '#1D4ED8',
                    }}
                  >
                    {deadline.daysRemaining}d
                  </span>
                </div>
              </div>
            ))}
          </div>
          {timeline.filingDeadlines.length > 3 && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              +{timeline.filingDeadlines.length - 3} more deadlines
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && !useFallback && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          {error}. Using cached election data.
        </p>
      )}
    </div>
  );
}
