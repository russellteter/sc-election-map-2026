'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import MapTooltip from './MapTooltip';
import { injectPatterns } from './patterns';
import type { CandidatesData, District, OpportunityData, DistrictOpportunity } from '@/types/schema';

// Opportunity tier colors
const TIER_COLORS = {
  HIGH_OPPORTUNITY: '#059669',  // Green - emerald-600
  EMERGING: '#0891B2',          // Teal - cyan-600
  BUILD: '#D97706',             // Amber - amber-600
  DEFENSIVE: '#3676eb',         // Blue - defensive seats
  NON_COMPETITIVE: '#9CA3AF',   // Gray - gray-400
} as const;

// Pattern fill for districts needing candidates
const NEEDS_CANDIDATE_PATTERN = 'url(#needs-candidate)';

interface DistrictMapProps {
  chamber: 'house' | 'senate';
  candidatesData: CandidatesData;
  opportunityData?: OpportunityData | null;
  selectedDistrict: number | null;
  onDistrictClick: (districtNumber: number) => void;
  onDistrictHover: (districtNumber: number | null) => void;
  filteredDistricts?: Set<number>;
  showRepublicanData?: boolean;
  republicanDataMode?: 'none' | 'incumbents' | 'challengers' | 'all';
}

export default function DistrictMap({
  chamber,
  candidatesData,
  opportunityData,
  selectedDistrict,
  onDistrictClick,
  onDistrictHover,
  filteredDistricts,
  showRepublicanData = false,
  republicanDataMode = 'none',
}: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rawSvgContent, setRawSvgContent] = useState<string>('');
  const [justSelected, setJustSelected] = useState<number | null>(null);
  const prevSelectedRef = useRef<number | null>(null);

  // Tooltip state
  const [hoveredDistrict, setHoveredDistrict] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Track selection changes to trigger animation
  useEffect(() => {
    if (selectedDistrict !== null && selectedDistrict !== prevSelectedRef.current) {
      setJustSelected(selectedDistrict);
      // Remove animation class after animation completes
      const timer = setTimeout(() => setJustSelected(null), 400);
      prevSelectedRef.current = selectedDistrict;
      return () => clearTimeout(timer);
    }
    prevSelectedRef.current = selectedDistrict;
  }, [selectedDistrict]);

  // Load SVG
  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const svgPath = `${basePath}/maps/${chamber}-districts.svg`;
    fetch(svgPath)
      .then((res) => res.text())
      .then((svg) => {
        setRawSvgContent(svg);
      })
      .catch((err) => console.error('Failed to load SVG:', err));
  }, [chamber]);

  // Process SVG to add fills BEFORE rendering (fixes dangerouslySetInnerHTML reset issue)
  const processedSvgContent = useMemo(() => {
    if (!rawSvgContent) return '';

    // Parse the SVG and add fill colors to each path
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return rawSvgContent;

    // Inject SVG patterns for crosshatch fills
    injectPatterns(svg);

    // Make SVG responsive and accessible
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.setAttribute('role', 'application');
    svg.setAttribute('aria-label', `${chamber === 'house' ? 'SC House' : 'SC Senate'} District Map. Use Tab to navigate districts, Enter to select.`);

    // Process all district paths
    const paths = svg.querySelectorAll('path[id]');
    paths.forEach((path) => {
      const id = path.getAttribute('id');
      if (!id) return;

      const match = id.match(/(?:house|senate)-(\d+)/);
      if (!match) return;

      const districtNum = parseInt(match[1], 10);
      const districtData = candidatesData[chamber][String(districtNum)];
      const opportunityInfo = opportunityData?.[chamber]?.[String(districtNum)];
      const color = getOpportunityColor(opportunityInfo, districtData, showRepublicanData, republicanDataMode);
      const statusLabel = getDistrictStatusLabel(districtData, opportunityInfo);

      // Apply fill color directly to SVG string
      path.setAttribute('fill', color);
      path.setAttribute('data-district', String(districtNum));

      // Build CSS class list
      const classes = ['district-path'];
      if (selectedDistrict === districtNum) {
        classes.push('selected');
      }
      if (justSelected === districtNum) {
        classes.push('just-selected');
      }
      path.setAttribute('class', classes.join(' '));

      // Apply stroke based on selection
      if (selectedDistrict === districtNum) {
        path.setAttribute('stroke', 'var(--class-purple, #4739E7)');
        path.setAttribute('stroke-width', '2.5');
      } else {
        path.setAttribute('stroke', 'var(--map-stroke, #374151)');
        path.setAttribute('stroke-width', '0.5');
      }

      // Accessibility attributes
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute('aria-label', `${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}: ${statusLabel}`);
      path.setAttribute('aria-pressed', selectedDistrict === districtNum ? 'true' : 'false');

      // Apply filtered state (reduce opacity for districts not in filter)
      if (filteredDistricts && !filteredDistricts.has(districtNum)) {
        path.setAttribute('opacity', '0.2');
        path.setAttribute('style', 'filter: grayscale(0.7);');
      }
    });

    return new XMLSerializer().serializeToString(svg);
  }, [rawSvgContent, chamber, candidatesData, opportunityData, selectedDistrict, filteredDistricts, justSelected, showRepublicanData, republicanDataMode]);

  // Handle click events via event delegation (more efficient than per-path listeners)
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    const path = target.closest('path[data-district]');
    if (path) {
      const districtNum = parseInt(path.getAttribute('data-district') || '0', 10);
      if (districtNum > 0) {
        onDistrictClick(districtNum);
      }
    }
  }, [onDistrictClick]);

  // Handle keyboard events for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as Element;
    const path = target.closest('path[data-district]');
    if (path && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const districtNum = parseInt(path.getAttribute('data-district') || '0', 10);
      if (districtNum > 0) {
        onDistrictClick(districtNum);
      }
    }
  }, [onDistrictClick]);

  // Handle focus events for screen reader feedback
  const handleFocus = useCallback((e: React.FocusEvent) => {
    const target = e.target as Element;
    const path = target.closest('path[data-district]');
    if (path) {
      const districtNum = parseInt(path.getAttribute('data-district') || '0', 10);
      if (districtNum > 0) {
        onDistrictHover(districtNum);
      }
    }
  }, [onDistrictHover]);

  const handleBlur = useCallback(() => {
    onDistrictHover(null);
  }, [onDistrictHover]);

  // Handle hover events via event delegation
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    const path = target.closest('path[data-district]');

    // Update mouse position for tooltip
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (path) {
      const districtNum = parseInt(path.getAttribute('data-district') || '0', 10);
      if (districtNum > 0) {
        setHoveredDistrict(districtNum);
        onDistrictHover(districtNum);
      }
    } else {
      setHoveredDistrict(null);
    }
  }, [onDistrictHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredDistrict(null);
    setMousePosition(null);
    onDistrictHover(null);
  }, [onDistrictHover]);

  // Get hovered district data for tooltip
  const hoveredDistrictData = hoveredDistrict
    ? candidatesData[chamber][String(hoveredDistrict)]
    : null;

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full transition-opacity duration-300"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        dangerouslySetInnerHTML={{ __html: processedSvgContent }}
      />
      <MapTooltip
        district={hoveredDistrictData}
        chamber={chamber}
        mousePosition={mousePosition}
      />
    </>
  );
}

/**
 * Get the fill color for a district based on opportunity score.
 * Uses tier-based coloring for strategic visualization.
 *
 * Color scheme:
 * - Green - High Opportunity (score 70+)
 * - Teal - Emerging (score 50-69)
 * - Amber - Build (score 30-49)
 * - Blue - Defensive (Dem incumbent)
 * - Gray - Non-competitive (score <30) or no data
 * - Blue crosshatch pattern - Needs Candidate (no Dem filed)
 * - Light gray - No candidates filed at all
 *
 * When Republican data is shown:
 * - Split coloring for contested districts
 * - Red (#DC2626) for Republican-only districts
 */
function getOpportunityColor(
  opportunity: DistrictOpportunity | undefined,
  district: District | undefined,
  showRepublicanData: boolean = false,
  republicanDataMode: 'none' | 'incumbents' | 'challengers' | 'all' = 'none'
): string {
  // No candidates = light gray
  if (!district || district.candidates.length === 0) {
    return '#f3f4f6'; // gray-100
  }

  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const hasRepublican = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  // When Republican toggle is enabled, show party-based coloring for certain scenarios
  if (showRepublicanData && republicanDataMode !== 'none') {
    // Contested districts - show purple gradient (or use opportunity tier if available)
    if (hasDemocrat && hasRepublican) {
      // If opportunity data exists, still use tier color for strategic view
      if (opportunity) {
        return TIER_COLORS[opportunity.tier] || TIER_COLORS.NON_COMPETITIVE;
      }
      return '#a855f7'; // Purple - both parties
    }

    // Republican-only districts - use crosshatch pattern to indicate "needs candidate"
    if (hasRepublican && !hasDemocrat) {
      return NEEDS_CANDIDATE_PATTERN; // Blue crosshatch pattern
    }
  }

  // Check if this is a "needs candidate" district (opportunity flag)
  if (opportunity?.flags?.needsCandidate && !hasDemocrat) {
    return NEEDS_CANDIDATE_PATTERN; // Blue crosshatch pattern
  }

  // If we have opportunity data, use tier colors (default behavior)
  if (opportunity) {
    return TIER_COLORS[opportunity.tier] || TIER_COLORS.NON_COMPETITIVE;
  }

  // Fallback: use basic Democratic presence coloring
  return hasDemocrat ? '#4739E7' : '#9ca3af';
}

/**
 * Get an accessible status label for a district.
 * Includes opportunity tier information.
 */
function getDistrictStatusLabel(
  district: District | undefined,
  opportunity: DistrictOpportunity | undefined
): string {
  if (!district || district.candidates.length === 0) {
    return 'No candidates filed';
  }

  const candidateCount = district.candidates.length;
  const candidateText = candidateCount === 1 ? '1 candidate' : `${candidateCount} candidates`;

  if (opportunity) {
    const tierLabel = opportunity.tierLabel;
    const score = opportunity.opportunityScore;
    return `${candidateText}, ${tierLabel} (score ${score})`;
  }

  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );

  return hasDemocrat
    ? `${candidateText}, Democratic`
    : `${candidateText} filed, party unknown`;
}
