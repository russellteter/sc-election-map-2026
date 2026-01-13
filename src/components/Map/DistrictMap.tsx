'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import MapTooltip from './MapTooltip';
import type { CandidatesData, District } from '@/types/schema';

interface DistrictMapProps {
  chamber: 'house' | 'senate';
  candidatesData: CandidatesData;
  selectedDistrict: number | null;
  onDistrictClick: (districtNumber: number) => void;
  onDistrictHover: (districtNumber: number | null) => void;
  filteredDistricts?: Set<number>;
}

export default function DistrictMap({
  chamber,
  candidatesData,
  selectedDistrict,
  onDistrictClick,
  onDistrictHover,
  filteredDistricts,
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
      const color = getDistrictColor(districtData);
      const statusLabel = getDistrictStatusLabel(districtData);

      // Check if district is contested (both parties running)
      const hasDem = districtData?.candidates.some((c) => c.party?.toLowerCase() === 'democratic');
      const hasRep = districtData?.candidates.some((c) => c.party?.toLowerCase() === 'republican');
      const isContested = hasDem && hasRep;

      // Apply fill color directly to SVG string
      path.setAttribute('fill', color);
      path.setAttribute('data-district', String(districtNum));

      // Add contested indicator for beacon animation
      if (isContested) {
        path.setAttribute('data-contested', 'true');
      }

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
  }, [rawSvgContent, chamber, candidatesData, selectedDistrict, filteredDistricts, justSelected]);

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
 * Get the fill color for a district based on candidate data.
 * Uses CSS variable fallbacks for consistency with design system.
 *
 * Color scheme:
 * - Gray - No candidates filed (vacant)
 * - Amber - Candidates filed but party unknown (needs enrichment)
 * - Purple/Blue - Democrat(s) only
 * - Red - Republican(s) only
 * - Purple (bright) - Both parties (contested)
 */
function getDistrictColor(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return '#f3f4f6'; // gray-100 - no candidates (vacant)
  }

  // Check if any Democrat is running
  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );

  // Check if any Republican is running
  const hasRepublican = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  if (hasDemocrat && hasRepublican) {
    return '#a855f7'; // purple-500 - contested (both parties)
  } else if (hasDemocrat) {
    return '#4739E7'; // class-purple - Democrat only
  } else if (hasRepublican) {
    return '#DC2626'; // red-600 - Republican only
  } else {
    return '#9ca3af'; // gray-400 - candidates with unknown party
  }
}

/**
 * Get an accessible status label for a district.
 * Used for screen reader announcements.
 */
function getDistrictStatusLabel(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return 'No candidates filed';
  }

  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );
  const hasRepublican = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'republican'
  );

  const candidateCount = district.candidates.length;
  const candidateText = candidateCount === 1 ? '1 candidate' : `${candidateCount} candidates`;

  if (hasDemocrat && hasRepublican) {
    return `Contested race with ${candidateText}, both Democratic and Republican`;
  } else if (hasDemocrat) {
    return `${candidateText}, Democratic`;
  } else if (hasRepublican) {
    return `${candidateText}, Republican`;
  } else {
    return `${candidateText} filed, party unknown`;
  }
}
