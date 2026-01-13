'use client';

import { useState } from 'react';

interface LegendProps {
  className?: string;
}

/**
 * Legend component with OBJECTIVE FACT-BASED descriptions only.
 * No made-up scores or arbitrary tiers.
 * Positioned as bottom-left overlay with table-style layout.
 */
export default function Legend({ className = '' }: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Objective fact-based legend items - no scores
  const legendItems = [
    {
      color: '#1E40AF',
      pattern: null,
      label: 'Dem Incumbent',
      description: 'Current representative is Democrat',
    },
    {
      color: '#3B82F6',
      pattern: null,
      label: 'Dem Challenger',
      description: 'Democrat filed to run',
    },
    {
      color: null,
      pattern: 'needs-candidate',
      label: 'Close Race',
      description: 'No Dem filed, margin ≤15pts',
    },
    {
      color: '#E5E7EB',
      pattern: null,
      label: 'Safe R Seat',
      description: 'No Dem filed, margin >15pts',
    },
  ];

  return (
    <div className={`legend-overlay ${isCollapsed ? 'legend-collapsed' : ''} ${className}`}>
      {/* Header with collapse toggle */}
      <button
        type="button"
        className="legend-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-expanded={!isCollapsed}
        aria-controls="legend-content"
      >
        <span className="legend-title">Map Legend</span>
        <svg
          className={`legend-toggle-icon ${isCollapsed ? 'legend-toggle-collapsed' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="16"
          height="16"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Legend content */}
      {!isCollapsed && (
        <div id="legend-content" className="legend-content">
          <table className="legend-table" role="list" aria-label="District status legend">
            <tbody>
              {legendItems.map((item) => (
                <tr key={item.label} role="listitem">
                  <td className="legend-swatch-cell">
                    {item.pattern === 'needs-candidate' ? (
                      <span className="legend-swatch legend-pattern-needs" aria-hidden="true" />
                    ) : (
                      <span
                        className="legend-swatch"
                        style={{ backgroundColor: item.color || '#E5E7EB' }}
                        aria-hidden="true"
                      />
                    )}
                  </td>
                  <td className="legend-label-cell">
                    <span className="legend-label">{item.label}</span>
                  </td>
                  <td className="legend-desc-cell">
                    <span className="legend-desc">{item.description}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="legend-footnote">
            Margin based on most recent election (SC Election Commission)
          </p>
        </div>
      )}
    </div>
  );
}
