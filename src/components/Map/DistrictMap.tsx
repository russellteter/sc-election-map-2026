'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

interface Candidate {
  name: string;
  party: string | null;
  status: string;
  filedDate: string | null;
  ethicsUrl: string | null;
  reportId: string;
  source: string;
}

interface District {
  districtNumber: number;
  candidates: Candidate[];
}

interface CandidatesData {
  lastUpdated: string;
  house: Record<string, District>;
  senate: Record<string, District>;
}

interface DistrictMapProps {
  chamber: 'house' | 'senate';
  candidatesData: CandidatesData;
  selectedDistrict: number | null;
  onDistrictClick: (districtNumber: number) => void;
  onDistrictHover: (districtNumber: number | null) => void;
}

export default function DistrictMap({
  chamber,
  candidatesData,
  selectedDistrict,
  onDistrictClick,
  onDistrictHover,
}: DistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rawSvgContent, setRawSvgContent] = useState<string>('');

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

      // Apply fill color directly to SVG string
      path.setAttribute('fill', color);
      path.setAttribute('stroke', '#374151');
      path.setAttribute('stroke-width', '0.5');
      path.setAttribute('cursor', 'pointer');
      path.setAttribute('data-district', String(districtNum));

      // Accessibility attributes
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.setAttribute('aria-label', `${chamber === 'house' ? 'House' : 'Senate'} District ${districtNum}: ${statusLabel}`);
      path.setAttribute('aria-pressed', selectedDistrict === districtNum ? 'true' : 'false');

      // Focus styles via CSS class
      path.setAttribute('class', 'district-path');

      // Apply selected state
      if (selectedDistrict === districtNum) {
        path.setAttribute('stroke', '#1e3a8a');
        path.setAttribute('stroke-width', '2');
      }
    });

    return new XMLSerializer().serializeToString(svg);
  }, [rawSvgContent, chamber, candidatesData, selectedDistrict]);

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
    if (path) {
      const districtNum = parseInt(path.getAttribute('data-district') || '0', 10);
      if (districtNum > 0) {
        onDistrictHover(districtNum);
        path.setAttribute('opacity', '0.8');
      }
    }
  }, [onDistrictHover]);

  const handleMouseLeave = useCallback((e: React.MouseEvent) => {
    // Reset opacity on all paths when leaving
    const container = e.currentTarget as Element;
    const paths = container.querySelectorAll('path[data-district]');
    paths.forEach(p => p.setAttribute('opacity', '1'));
    onDistrictHover(null);
  }, [onDistrictHover]);

  // Reset opacity when mouse leaves a path but stays in container
  const handleMouseOver = useCallback((e: React.MouseEvent) => {
    const target = e.target as Element;
    const relatedTarget = e.relatedTarget as Element | null;

    // If we left a path, reset its opacity
    if (relatedTarget?.closest('path[data-district]') &&
        !target.closest('path[data-district]')) {
      const paths = containerRef.current?.querySelectorAll('path[data-district]');
      paths?.forEach(p => p.setAttribute('opacity', '1'));
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseOut={handleMouseOver}
      dangerouslySetInnerHTML={{ __html: processedSvgContent }}
    />
  );
}

/**
 * Get the fill color for a district based on candidate data.
 *
 * Color scheme:
 * - Gray (#e5e7eb) - No candidates filed (vacant)
 * - Amber (#fbbf24) - Candidates filed but party unknown (needs enrichment)
 * - Blue (#3b82f6) - Democrat(s) only
 * - Red (#ef4444) - Republican(s) only
 * - Purple (#a855f7) - Both parties (contested)
 */
function getDistrictColor(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return '#e5e7eb'; // gray-200 - no candidates (vacant)
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
    return '#a855f7'; // purple-500 - contested
  } else if (hasDemocrat) {
    return '#3b82f6'; // blue-500 - Democrat only
  } else if (hasRepublican) {
    return '#ef4444'; // red-500 - Republican only
  } else {
    return '#fbbf24'; // amber-400 - candidates with unknown party
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
