'use client';

import Link from 'next/link';
import type { StrategicTableRow } from '@/lib/exportCSV';

interface TableRowProps {
  row: StrategicTableRow;
  index: number;
  onClick: (row: StrategicTableRow) => void; // Keep for backward compatibility
}

/**
 * Get tier badge styles based on opportunity tier
 */
function getTierStyles(tier: string): { bg: string; color: string; border: string } {
  switch (tier) {
    case 'HIGH_OPPORTUNITY':
      return {
        bg: 'var(--success-50)',
        color: 'var(--accent-emerald)',
        border: 'var(--success-100)',
      };
    case 'EMERGING':
      return {
        bg: 'var(--info-50)',
        color: 'var(--accent-cyan)',
        border: 'var(--info-100)',
      };
    case 'BUILD':
      return {
        bg: 'var(--warning-100)',
        color: 'var(--accent-amber)',
        border: 'var(--warning-100)',
      };
    case 'DEFENSIVE':
      return {
        bg: 'var(--dem-tint)',
        color: 'var(--dem-lean)',
        border: 'var(--info-100)',
      };
    case 'NON_COMPETITIVE':
    default:
      return {
        bg: 'var(--slate-100)',
        color: 'var(--slate-500)',
        border: 'var(--slate-200)',
      };
  }
}

/**
 * Get score color based on opportunity score value
 */
function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--accent-emerald)'; // High opportunity - green
  if (score >= 50) return 'var(--accent-cyan)'; // Emerging - cyan
  if (score >= 30) return 'var(--accent-amber)'; // Build - amber
  return 'var(--slate-500)'; // Non-competitive - gray
}

/**
 * Get margin display color based on party advantage
 */
function getMarginColor(marginDisplay: string): string {
  if (marginDisplay === 'N/A') return 'var(--text-muted)';
  // + means Republican advantage (red), - means Democrat (blue)
  if (marginDisplay.startsWith('+')) return 'var(--party-rep)';
  return 'var(--party-dem)';
}

export default function TableRow({ row, index, onClick }: TableRowProps) {
  const tierStyles = getTierStyles(row.tier);
  const scoreColor = getScoreColor(row.opportunityScore);
  const marginColor = getMarginColor(row.marginDisplay);
  const isHighOpportunity = row.tier === 'HIGH_OPPORTUNITY';
  const isDefensive = row.tier === 'DEFENSIVE';

  return (
    <tr
      className={`strategic-table-row ${
        isHighOpportunity ? 'tier-highlight' : ''
      } ${isDefensive ? 'tier-defensive' : ''} ${
        index % 2 === 0 ? 'even' : 'odd'
      }`}
      aria-label={`${row.districtId}: ${row.tierLabel}, Score ${row.opportunityScore}`}
    >
      {/* District */}
      <td className="strategic-table-td text-left">
        <div className="flex items-center gap-2">
          <span className="font-medium hover:underline" style={{ color: 'var(--party-dem)' }}>
            {row.districtId}
          </span>
          {row.needsCandidate && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
              style={{
                background: 'var(--warning-100)',
                color: 'var(--accent-amber)',
              }}
              title="Needs Democratic candidate"
            >
              Recruit
            </span>
          )}
          {row.openSeat && (
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: 'var(--class-purple-bg)',
                color: 'var(--class-purple)',
              }}
              title="Open seat"
            >
              Open
            </span>
          )}
        </div>
      </td>

      {/* Incumbent */}
      <td className="strategic-table-td text-left hidden md:table-cell">
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[140px]" style={{ color: 'var(--text-color)' }}>
            {row.incumbent}
          </span>
          <span
            className="text-xs"
            style={{
              color:
                row.incumbentParty === 'Republican'
                  ? 'var(--party-rep)'
                  : row.incumbentParty === 'Democratic'
                  ? 'var(--party-dem)'
                  : 'var(--text-muted)',
            }}
          >
            {row.incumbentParty}
          </span>
        </div>
      </td>

      {/* Challenger */}
      <td className="strategic-table-td text-left hidden md:table-cell">
        {row.challenger ? (
          <div className="flex flex-col">
            <span className="font-medium truncate max-w-[140px]" style={{ color: 'var(--text-color)' }}>
              {row.challenger}
            </span>
            <span
              className="text-xs"
              style={{
                color:
                  row.challengerParty === 'Democratic'
                    ? 'var(--party-dem)'
                    : row.challengerParty === 'Republican'
                    ? 'var(--party-rep)'
                    : 'var(--text-muted)',
              }}
            >
              {row.challengerParty}
            </span>
          </div>
        ) : (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            None filed
          </span>
        )}
      </td>

      {/* Tier */}
      <td className="strategic-table-td text-left">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: tierStyles.bg,
            color: tierStyles.color,
          }}
        >
          {row.tierLabel}
        </span>
      </td>

      {/* Score */}
      <td className="strategic-table-td text-center">
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: scoreColor }}
        >
          {row.opportunityScore}
        </span>
      </td>

      {/* 2024 Margin */}
      <td className="strategic-table-td text-right">
        <span
          className="font-mono text-sm font-semibold"
          style={{ color: marginColor }}
        >
          {row.marginDisplay}
        </span>
      </td>

      {/* Actions */}
      <td className="strategic-table-td text-center">
        <div className="flex items-center justify-center gap-2">
          {/* View on Map button */}
          <Link
            href={`/sc?chamber=${row.chamber}&district=${row.districtNumber}`}
            className="p-1.5 rounded-lg transition-all hover:bg-blue-50 focus-ring"
            style={{
              border: '1px solid var(--class-purple-light, #DAD7FA)',
              color: 'var(--class-purple, #4739E7)',
            }}
            aria-label={`View ${row.districtId} on map`}
            title="View on Map"
            onClick={(e) => e.stopPropagation()} // Prevent row click
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </Link>

          {/* View Profile button */}
          <Link
            href={`/race/${row.chamber}/${row.districtNumber}?returnContext=table`}
            className="p-1.5 rounded-lg transition-all hover:bg-purple-50 focus-ring"
            style={{
              border: '1px solid var(--class-purple-light, #DAD7FA)',
              color: 'var(--class-purple, #4739E7)',
            }}
            aria-label={`View ${row.districtId} race profile`}
            title="View Race Profile"
            onClick={(e) => e.stopPropagation()} // Prevent row click
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </Link>
        </div>
      </td>
    </tr>
  );
}
