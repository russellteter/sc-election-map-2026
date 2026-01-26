'use client';

import { useState, useMemo } from 'react';
import type { LensId } from '@/types/lens';
import { LENS_DEFINITIONS, DEFAULT_LENS } from '@/types/lens';

const LEGEND_PINNED_KEY = 'legendPinned';

interface LegendProps {
  /** Active lens - determines which legend items to show */
  activeLens?: LensId;
  className?: string;
}

/**
 * Legend component (v3.2) - Integrated instrument bezel design
 *
 * Design principles:
 * - Integrated into map container's bottom edge (not floating)
 * - Horizontal flow with subtle dividers
 * - Slides up from container edge on hover
 * - Pinnable: click to keep visible
 * - Glassmorphic surface continuous with map frame
 */
export default function Legend({ activeLens = DEFAULT_LENS, className = '' }: LegendProps) {
  // Pinned state: when true, legend stays visible even without hover
  // Initialize from localStorage using lazy initializer (avoids useEffect setState issue)
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LEGEND_PINNED_KEY) === 'true';
  });

  // Toggle pinned state and save to localStorage
  const handleTogglePin = () => {
    const newState = !isPinned;
    setIsPinned(newState);
    if (typeof window !== 'undefined') {
      if (newState) {
        localStorage.setItem(LEGEND_PINNED_KEY, 'true');
      } else {
        localStorage.removeItem(LEGEND_PINNED_KEY);
      }
    }
  };

  // Get legend items from the active lens definition
  const { legendItems, label: lensLabel } = useMemo(() => {
    const lens = LENS_DEFINITIONS[activeLens];
    return {
      legendItems: lens.legendItems,
      label: lens.label,
    };
  }, [activeLens]);

  return (
    <div
      className={`map-legend-integrated ${isPinned ? 'legend-pinned' : ''} ${className}`}
      role="region"
      aria-label={`${lensLabel} legend`}
    >
      {/* Pin toggle button */}
      <button
        type="button"
        className="legend-pin-btn"
        onClick={handleTogglePin}
        aria-pressed={isPinned}
        aria-label={isPinned ? 'Unpin legend' : 'Pin legend open'}
        title={isPinned ? 'Click to auto-hide' : 'Click to keep visible'}
      >
        <svg
          className={`legend-pin-icon ${isPinned ? 'legend-pin-active' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          width="14"
          height="14"
        >
          {isPinned ? (
            // Filled pin icon when pinned
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              fill="currentColor"
            />
          ) : (
            // Outline pin icon when not pinned
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          )}
        </svg>
      </button>

      {/* Lens label (compact) */}
      <span className="legend-lens-label">{lensLabel}</span>

      {/* Divider */}
      <span className="legend-divider" aria-hidden="true" />

      {/* Legend items - horizontal flow */}
      <ul className="legend-items-row" aria-label="District status legend">
        {legendItems.map((item, index) => (
          <li key={item.label} className="legend-item-inline">
            {item.pattern ? (
              <span
                className={`legend-swatch-inline legend-pattern-${item.pattern}`}
                aria-hidden="true"
              />
            ) : (
              <span
                className="legend-swatch-inline"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
            )}
            <span className="legend-label-inline">{item.label}</span>
            {/* Divider between items (not after last) */}
            {index < legendItems.length - 1 && (
              <span className="legend-item-divider" aria-hidden="true" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
