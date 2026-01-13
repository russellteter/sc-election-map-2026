'use client';

import { useState } from 'react';

interface LegendProps {
  className?: string;
  showRepublicanData?: boolean;
}

/**
 * Legend component for opportunity tiers.
 * Positioned as bottom-left overlay with table-style layout and definitions.
 * Collapsible on mobile for space efficiency.
 */
export default function Legend({ className = '', showRepublicanData = false }: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const legendItems = [
    {
      color: '#059669',
      pattern: null,
      label: 'High Opportunity',
      description: 'Score 70+ with strong Dem potential',
    },
    {
      color: '#0891B2',
      pattern: null,
      label: 'Emerging',
      description: 'Score 50-69, growing competitiveness',
    },
    {
      color: '#D97706',
      pattern: null,
      label: 'Build',
      description: 'Score 30-49, long-term investment',
    },
    {
      color: null,
      pattern: 'needs-candidate',
      label: 'Needs Candidate',
      description: 'No Democrat filed - recruit opportunity',
    },
    {
      color: '#3676eb',
      pattern: null,
      label: 'Defensive',
      description: 'Democratic incumbent seat to protect',
    },
    {
      color: '#9CA3AF',
      pattern: null,
      label: 'Non-Competitive',
      description: 'Score below 30, safe Republican seat',
    },
  ];

  // Add Republican item when toggle is enabled
  if (showRepublicanData) {
    legendItems.push({
      color: '#DC2626',
      pattern: null,
      label: 'GOP Only',
      description: 'Republican filed, no Democrat',
    });
  }

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
          <table className="legend-table" role="list" aria-label="Opportunity tier legend">
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
        </div>
      )}
    </div>
  );
}
