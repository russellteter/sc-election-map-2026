'use client';

import { useEffect, useState } from 'react';

interface VoterResourcesData {
  elections: Record<string, { date: string; name: string }>;
  deadlines: Record<string, { date: string; description: string }>;
  resources: Record<string, { url: string; label: string; description: string }>;
  votingInfo: {
    pollHours: string;
    idRequired: boolean;
    idInfo: string;
    earlyVotingAvailable: boolean;
    earlyVotingNote: string;
  };
}

export default function VoterResources() {
  const [data, setData] = useState<VoterResourcesData | null>(null);

  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    fetch(`${basePath}/data/voter-resources.json`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-surface rounded-lg p-4 h-32" />
        ))}
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDeadlineStatus = (dateStr: string) => {
    const deadline = new Date(dateStr);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { status: 'passed', label: 'Passed' };
    if (daysUntil <= 14) return { status: 'soon', label: `${daysUntil} days` };
    return { status: 'upcoming', label: formatDate(dateStr) };
  };

  return (
    <div className="space-y-6 animate-entrance" style={{ animationDelay: '200ms' }}>
      {/* Election Dates Section */}
      <div className="glass-surface rounded-lg p-6">
        <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          2026 Elections
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(data.elections).map(([key, election]) => (
            <div
              key={key}
              className="rounded-lg p-4"
              style={{
                background: 'var(--class-purple-bg)',
                border: '1px solid var(--class-purple-light)',
              }}
            >
              <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {election.name}
              </p>
              <p className="text-lg font-bold font-display" style={{ color: 'var(--class-purple)' }}>
                {formatDate(election.date)}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Polls open {data.votingInfo.pollHours}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Registration & Deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <div className="glass-surface rounded-lg p-6">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Voter Tools
          </h3>
          <div className="space-y-3">
            <a
              href={data.resources.checkRegistration.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg p-3 transition-all hover:scale-[1.01]"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                    {data.resources.checkRegistration.label}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {data.resources.checkRegistration.description}
                  </p>
                </div>
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>

            <a
              href={data.resources.registerToVote.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg p-3 transition-all hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, var(--class-purple-bg) 0%, #E0E7FF 100%)',
                border: '1px solid var(--class-purple-light)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--class-purple)' }}>
                    {data.resources.registerToVote.label}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {data.resources.registerToVote.description}
                  </p>
                </div>
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>

            <a
              href={data.resources.findPollingPlace.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg p-3 transition-all hover:scale-[1.01]"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-color)' }}>
                    {data.resources.findPollingPlace.label}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {data.resources.findPollingPlace.description}
                  </p>
                </div>
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </a>
          </div>
        </div>

        {/* Deadlines */}
        <div className="glass-surface rounded-lg p-6">
          <h3 className="font-display font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
            <svg className="w-5 h-5" style={{ color: 'var(--class-purple)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Important Deadlines
          </h3>
          <div className="space-y-3">
            {Object.entries(data.deadlines).map(([key, deadline]) => {
              const { status, label } = getDeadlineStatus(deadline.date);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-color)' }}>
                    {deadline.description}
                  </p>
                  <span
                    className="badge text-xs"
                    style={{
                      background:
                        status === 'passed'
                          ? 'var(--color-safe-bg)'
                          : status === 'soon'
                          ? 'var(--color-attention-bg)'
                          : 'var(--class-purple-bg)',
                      color:
                        status === 'passed'
                          ? 'var(--text-muted)'
                          : status === 'soon'
                          ? 'var(--color-attention)'
                          : 'var(--class-purple)',
                      border:
                        status === 'soon'
                          ? '1px solid var(--color-attention)'
                          : '1px solid transparent',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ID Requirements */}
      <div
        className="rounded-lg p-4"
        style={{
          background: 'var(--color-attention-bg)',
          border: '1px solid rgba(217, 119, 6, 0.3)',
        }}
      >
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-attention)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium" style={{ color: 'var(--color-attention)' }}>
              Photo ID Required to Vote
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {data.votingInfo.idInfo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
