'use client';

import { useEffect, useState, useRef } from 'react';
import type { District } from '@/types/schema';

interface MapTooltipProps {
  district: District | null;
  chamber: 'house' | 'senate';
  mousePosition: { x: number; y: number } | null;
}

/**
 * MapTooltip component - Rich cursor-following glassmorphic tooltip for map districts
 *
 * Features:
 * - District number + chamber
 * - Candidate count with party dots
 * - "+X more" indicator
 * - Glassmorphic styling with backdrop blur
 * - `pointer-events: none` for performance
 * - Smooth cursor-following with position offset
 */
export default function MapTooltip({ district, chamber, mousePosition }: MapTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!mousePosition || !district) {
      return;
    }

    // Use requestAnimationFrame for smooth position updates
    const updatePosition = () => {
      const offset = 16; // Offset from cursor
      const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 0;

      let x = mousePosition.x + offset;
      let y = mousePosition.y + offset;

      // Keep tooltip within viewport bounds
      if (x + tooltipWidth > window.innerWidth) {
        x = mousePosition.x - tooltipWidth - offset;
      }
      if (y + tooltipHeight > window.innerHeight) {
        y = mousePosition.y - tooltipHeight - offset;
      }

      setPosition({ x, y });
    };

    rafRef.current = requestAnimationFrame(updatePosition);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [mousePosition, district]);

  if (!district || !mousePosition) {
    return null;
  }

  const chamberLabel = chamber === 'house' ? 'House' : 'Senate';

  // Count candidates by party
  const hasDem = district.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
  const hasRep = district.candidates.some((c) => c.party?.toLowerCase() === 'republican');
  const candidateCount = district.candidates.length;

  // Determine display text
  const candidateText = candidateCount === 0
    ? 'No candidates'
    : candidateCount === 1
    ? '1 candidate'
    : `${Math.min(candidateCount, 3)} candidate${candidateCount > 1 ? 's' : ''}`;

  const moreText = candidateCount > 3 ? `+${candidateCount - 3} more` : null;

  return (
    <div
      ref={tooltipRef}
      className="map-tooltip"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="tooltip-header">
        <span className="tooltip-chamber">{chamberLabel}</span>
        <span className="tooltip-district">District {district.districtNumber}</span>
      </div>

      <div className="tooltip-body">
        <div className="tooltip-candidates">
          {candidateCount > 0 && (
            <div className="party-dots">
              {hasDem && <span className="party-dot democrat" title="Democrat running" />}
              {hasRep && <span className="party-dot republican" title="Republican running" />}
            </div>
          )}
          <span className="candidate-count">{candidateText}</span>
        </div>
        {moreText && <span className="more-text">{moreText}</span>}
      </div>
    </div>
  );
}
