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
 * MapTooltip - Refined "whisper" tooltip (v3.2)
 *
 * Design principles (Bloomberg Terminal quality):
 * - Max 180px width for minimal footprint
 * - Lighter glassmorphic panel
 * - Two-tier disclosure: initial (instant) + expanded (500ms hover)
 * - Fade + translateY entrance, no arrows
 * - Adjacent positioning, never overlapping district
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
  const [isExpanded, setIsExpanded] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDistrictRef = useRef<number | null>(null);

  // Track sustained hover for two-tier disclosure
  useEffect(() => {
    if (!district) {
      setIsExpanded(false);
      lastDistrictRef.current = null;
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      return;
    }

    // Reset expansion when district changes
    if (district.districtNumber !== lastDistrictRef.current) {
      setIsExpanded(false);
      lastDistrictRef.current = district.districtNumber;

      // Start timer for sustained hover (500ms)
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      hoverTimerRef.current = setTimeout(() => {
        setIsExpanded(true);
      }, 500);
    }

    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, [district]);

  useEffect(() => {
    if (!mousePosition || !district) {
      return;
    }

    // Use requestAnimationFrame for smooth position updates
    const updatePosition = () => {
      const offset = 12; // Slightly closer for whisper feel
      const tooltipWidth = tooltipRef.current?.offsetWidth || 180;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 80;

      let x = mousePosition.x + offset;
      let y = mousePosition.y - (tooltipHeight / 2); // Center vertically relative to cursor

      // Keep tooltip within viewport bounds with padding
      const padding = 8;
      if (x + tooltipWidth > window.innerWidth - padding) {
        x = mousePosition.x - tooltipWidth - offset;
      }
      if (y < padding) {
        y = padding;
      }
      if (y + tooltipHeight > window.innerHeight - padding) {
        y = window.innerHeight - tooltipHeight - padding;
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

  const chamberLabel = chamber === 'house' ? 'HD' : 'SD'; // Compact labels

  // Count candidates by party
  const hasDem = district.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
  const hasRep = district.candidates.some((c) => c.party?.toLowerCase() === 'republican');

  // Get lens-aware category
  const category = getDistrictCategory(district, electionHistory || undefined, opportunityData || undefined, activeLens);
  const categoryLabel = getCategoryLabel(category, activeLens);

  // Filing status - compact
  const filingStatus = hasDem && hasRep
    ? 'Contested'
    : hasDem
    ? 'D filed'
    : hasRep
    ? 'R only'
    : 'Open';

  // Incumbent info - compact
  const incumbentShort = district.incumbent
    ? `${district.incumbent.party?.charAt(0) || '?'} incumbent`
    : 'Open seat';

  return (
    <div
      ref={tooltipRef}
      className={`district-whisper ${isExpanded ? 'district-whisper-expanded' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* Initial tier - always visible */}
      <div className="whisper-primary">
        <span className="whisper-district">
          {chamberLabel}-{district.districtNumber}
        </span>
        <span className="whisper-category">{categoryLabel}</span>
      </div>

      {/* Expanded tier - after 500ms sustained hover */}
      {isExpanded && (
        <div className="whisper-expanded">
          <div className="whisper-row">
            <span className="whisper-label">{incumbentShort}</span>
            <div className="whisper-dots">
              {hasDem && <span className="party-dot-mini dem" />}
              {hasRep && <span className="party-dot-mini rep" />}
              <span className="whisper-status">{filingStatus}</span>
            </div>
          </div>
          {district.incumbent?.name && (
            <div className="whisper-incumbent">{district.incumbent.name}</div>
          )}
        </div>
      )}
    </div>
  );
}
