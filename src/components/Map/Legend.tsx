'use client';

import { useState, useMemo, useEffect } from 'react';
import type { LensId } from '@/types/lens';
import { LENS_DEFINITIONS, DEFAULT_LENS } from '@/types/lens';

const LEGEND_COLLAPSED_KEY = 'legendCollapsed';

interface LegendProps {
  /** Active lens - determines which legend items to show */
  activeLens?: LensId;
  className?: string;
}

/**
 * Legend component with dynamic lens-aware content.
 * Renders legend items from LENS_DEFINITIONS based on active lens.
 * Positioned as bottom-left overlay with table-style layout.
 *
 * First-visit behavior: Legend starts expanded and cannot be collapsed until
 * the user explicitly collapses it (preference saved to localStorage).
 */
export default function Legend({ activeLens = DEFAULT_LENS, className = '' }: LegendProps) {
  // Start expanded on first visit, use stored preference thereafter
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasBeenCollapsed, setHasBeenCollapsed] = useState(false);

  // Check localStorage on mount for user's previous preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(LEGEND_COLLAPSED_KEY);
    if (stored === 'true') {
      setIsCollapsed(true);
      setHasBeenCollapsed(true);
    }
  }, []);

  // Save collapse state to localStorage when user collapses
  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (newState) {
      setHasBeenCollapsed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(LEGEND_COLLAPSED_KEY, 'true');
      }
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LEGEND_COLLAPSED_KEY);
      }
    }
  };

  // Get legend items from the active lens definition
  const { legendItems, footnote, label: lensLabel } = useMemo(() => {
    const lens = LENS_DEFINITIONS[activeLens];
    return {
      legendItems: lens.legendItems,
      footnote: lens.footnote,
      label: lens.label,
    };
  }, [activeLens]);

  return (
    <div className={`legend-overlay ${isCollapsed ? 'legend-collapsed' : ''} ${className}`}>
      {/* Header with collapse toggle */}
      <button
        type="button"
        className="legend-header"
        onClick={handleToggle}
        aria-expanded={!isCollapsed}
        aria-controls="legend-content"
      >
        <span className="legend-title">{lensLabel} Legend</span>
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
                    {item.pattern ? (
                      <span
                        className={`legend-swatch legend-pattern-${item.pattern}`}
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="legend-swatch"
                        style={{ backgroundColor: item.color }}
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
          <p className="legend-footnote">{footnote}</p>
        </div>
      )}
    </div>
  );
}
