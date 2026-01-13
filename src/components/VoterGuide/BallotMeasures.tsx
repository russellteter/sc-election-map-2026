'use client';

import { useState } from 'react';
import type { BallotMeasuresData, StateMeasure, LocalMeasure, LocalMeasureGroup } from '@/types/schema';

interface BallotMeasuresProps {
  data: BallotMeasuresData;
  countyName: string | null;
}

// Color schemes for different measure types
const MEASURE_TYPE_STYLES = {
  constitutional: {
    gradient: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
    border: '#A78BFA',
    text: '#6D28D9',
    label: 'CONSTITUTIONAL',
  },
  statutory: {
    gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    border: '#60A5FA',
    text: '#1D4ED8',
    label: 'STATUTORY',
  },
  advisory: {
    gradient: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    border: '#9CA3AF',
    text: '#4B5563',
    label: 'ADVISORY',
  },
  bond: {
    gradient: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
    border: '#60A5FA',
    text: '#1D4ED8',
    label: 'BOND',
  },
  tax: {
    gradient: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    border: '#FCD34D',
    text: '#B45309',
    label: 'TAX',
  },
  zoning: {
    gradient: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
    border: '#6EE7B7',
    text: '#047857',
    label: 'ZONING',
  },
  other: {
    gradient: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
    border: '#9CA3AF',
    text: '#4B5563',
    label: 'LOCAL',
  },
};

export default function BallotMeasures({ data, countyName }: BallotMeasuresProps) {
  // Find local measures for the selected county
  const localMeasureGroup = countyName
    ? data.localMeasures.find((group) => group.county === countyName)
    : null;

  const hasStateMeasures = data.stateMeasures.length > 0;
  const hasLocalMeasures = localMeasureGroup && localMeasureGroup.measures.length > 0;

  if (!hasStateMeasures && !hasLocalMeasures) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in animate-in-delay-1">
      {/* Section Header */}
      <div className="section-header-accent">
        <div
          className="section-header-icon"
          style={{
            background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
            border: '1px solid #A78BFA',
          }}
        >
          <svg className="w-5 h-5" style={{ color: '#6D28D9' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text-color)' }}>
            Ballot Measures
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Proposed amendments and referendums on your ballot
          </p>
        </div>
      </div>

      {/* State Measures */}
      {hasStateMeasures && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
              style={{
                background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                color: '#6D28D9',
              }}
            >
              Statewide
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              All SC voters vote on these
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.stateMeasures.map((measure) => (
              <StateMeasureCard key={measure.number} measure={measure} />
            ))}
          </div>
        </div>
      )}

      {/* Local Measures */}
      {hasLocalMeasures && localMeasureGroup && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded"
              style={{
                background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                color: '#047857',
              }}
            >
              {countyName} County
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Local measures for your county
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {localMeasureGroup.measures.map((measure) => (
              <LocalMeasureCard key={measure.number} measure={measure} countyName={countyName!} />
            ))}
          </div>
        </div>
      )}

      {/* No local measures message */}
      {countyName && !hasLocalMeasures && (
        <div
          className="rounded-lg p-4 text-center"
          style={{
            background: 'var(--card-bg)',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No local ballot measures for {countyName} County in the 2026 election.
          </p>
        </div>
      )}
    </div>
  );
}

interface StateMeasureCardProps {
  measure: StateMeasure;
}

function StateMeasureCard({ measure }: StateMeasureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const styles = MEASURE_TYPE_STYLES[measure.type];

  const hasProCon = (measure.proArguments && measure.proArguments.length > 0) ||
    (measure.conArguments && measure.conArguments.length > 0);

  return (
    <div className="voter-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-lg font-bold"
              style={{ color: styles.text }}
            >
              Measure {measure.number}
            </span>
            <span
              className="badge text-xs"
              style={{
                background: styles.gradient,
                color: styles.text,
                border: `1px solid ${styles.border}`,
              }}
            >
              {styles.label}
            </span>
          </div>
          <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
            {measure.title}
          </h4>
        </div>
      </div>

      {/* Description */}
      <p
        className="text-sm mb-3 leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {measure.description}
      </p>

      {/* Expandable Pro/Con Section */}
      {hasProCon && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: styles.text }}
          >
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {expanded ? 'Hide Arguments' : 'View Arguments For & Against'}
          </button>

          {expanded && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 animate-in">
              {/* Pro Arguments */}
              {measure.proArguments && measure.proArguments.length > 0 && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
                    border: '1px solid #6EE7B7',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" style={{ color: '#047857' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs font-semibold uppercase" style={{ color: '#047857' }}>
                      Arguments For
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {measure.proArguments.map((arg, idx) => (
                      <li key={idx} className="text-xs" style={{ color: '#047857' }}>
                        {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Con Arguments */}
              {measure.conArguments && measure.conArguments.length > 0 && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
                    border: '1px solid #FCA5A5',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4" style={{ color: '#B91C1C' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-xs font-semibold uppercase" style={{ color: '#B91C1C' }}>
                      Arguments Against
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {measure.conArguments.map((arg, idx) => (
                      <li key={idx} className="text-xs" style={{ color: '#B91C1C' }}>
                        {arg}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {measure.type === 'advisory' ? 'Non-binding' : 'Binding if passed'}
        </span>
        {measure.fullText && (
          <a
            href={measure.fullText}
            target="_blank"
            rel="noopener noreferrer"
            className="underline flex items-center gap-1"
            style={{ color: 'var(--class-purple)' }}
          >
            <span>Full text</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

interface LocalMeasureCardProps {
  measure: LocalMeasure;
  countyName: string;
}

function LocalMeasureCard({ measure, countyName }: LocalMeasureCardProps) {
  const styles = MEASURE_TYPE_STYLES[measure.type];

  return (
    <div className="voter-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-lg font-bold"
              style={{ color: styles.text }}
            >
              Measure {measure.number}
            </span>
            <span
              className="badge text-xs"
              style={{
                background: styles.gradient,
                color: styles.text,
                border: `1px solid ${styles.border}`,
              }}
            >
              {styles.label}
            </span>
          </div>
          <h4 className="font-display font-semibold" style={{ color: 'var(--text-color)' }}>
            {measure.title}
          </h4>
        </div>
      </div>

      {/* Amount (if applicable) */}
      {measure.amount && (
        <div
          className="rounded-lg p-2 mb-3 flex items-center gap-2"
          style={{
            background: styles.gradient,
            border: `1px solid ${styles.border}`,
          }}
        >
          <svg className="w-4 h-4" style={{ color: styles.text }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: styles.text }}>
            {measure.amount}
          </span>
        </div>
      )}

      {/* Description */}
      <p
        className="text-sm mb-3 leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {measure.description}
      </p>

      {/* Footer */}
      <div className="mt-3 pt-2 flex items-center justify-between text-xs" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          {countyName} County only
        </span>
        <a
          href={`https://ballotpedia.org/${countyName}_County,_South_Carolina_ballot_measures`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: 'var(--class-purple)' }}
        >
          Learn more
        </a>
      </div>
    </div>
  );
}
