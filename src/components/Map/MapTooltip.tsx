'use client';

import { useEffect, useState, useRef } from 'react';
import type { District, DistrictElectionHistory } from '@/types/schema';
import type { LensId } from '@/types/lens';
import { DEFAULT_LENS } from '@/types/lens';
import {
  getDistrictCategory,
  getCategoryLabel,
  type OpportunityData,
} from '@/lib/districtColors';

interface MapTooltipProps {
  district: District | null;
  chamber: 'house' | 'senate';
  mousePosition: { x: number; y: number } | null;
  /** Active lens for category display */
  activeLens?: LensId;
  /** Election history for margin calculation */
  electionHistory?: DistrictElectionHistory | null;
  /** Opportunity data for opportunity lens */
  opportunityData?: OpportunityData | null;
}

/**
 * MapTooltip component - Rich cursor-following glassmorphic tooltip for map districts
 *
 * Features:
 * - District number + chamber
 * - Incumbent info
 * - Filing status
 * - Lens-aware category label
 * - Candidate count with party dots
 * - Glassmorphic styling with backdrop blur
 * - Smooth cursor-following with position offset
 */
export default function MapTooltip({
  district,
  chamber,
  mousePosition,
  activeLens = DEFAULT_LENS,
  electionHistory,
  opportunityData,
}: MapTooltipProps) {
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

  // Get lens-aware category
  const category = getDistrictCategory(district, electionHistory || undefined, opportunityData || undefined, activeLens);
  const categoryLabel = getCategoryLabel(category, activeLens);

  // Incumbent info
  const incumbentText = district.incumbent
    ? `${district.incumbent.name} (${district.incumbent.party?.charAt(0) || '?'})`
    : 'Open seat';

  // Filing status
  const filingStatus = hasDem && hasRep
    ? 'Contested'
    : hasDem
    ? 'Dem filed'
    : hasRep
    ? 'Rep only'
    : 'No candidates';

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
        {/* Incumbent row */}
        <div className="tooltip-row">
          <span className="tooltip-label">Incumbent:</span>
          <span className="tooltip-value">{incumbentText}</span>
        </div>

        {/* Filing status with party dots */}
        <div className="tooltip-row">
          <span className="tooltip-label">Status:</span>
          <div className="tooltip-status">
            {hasDem && <span className="party-dot democrat" title="Democrat" />}
            {hasRep && <span className="party-dot republican" title="Republican" />}
            <span className="tooltip-value">{filingStatus}</span>
          </div>
        </div>

        {/* Lens category */}
        <div className="tooltip-row tooltip-category">
          <span className="tooltip-category-label">{categoryLabel}</span>
        </div>
      </div>

      <div className="tooltip-footer">
        <span className="tooltip-hint">Click for details</span>
      </div>
    </div>
  );
}
