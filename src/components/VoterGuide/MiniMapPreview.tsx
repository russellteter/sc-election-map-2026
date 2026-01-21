'use client';

import { useEffect, useState, useMemo } from 'react';

interface MiniMapPreviewProps {
  stateCode: string;          // 'sc', 'nc', etc.
  chamber: 'house' | 'senate';
  highlightedDistrict: number | null;
  className?: string;
}

/**
 * MiniMapPreview - Compact, non-interactive map preview showing user's district
 *
 * Renders a small SVG map thumbnail with the user's district highlighted.
 * Used in Voter Guide to provide "you are here" context after address lookup.
 *
 * Features:
 * - Non-interactive (no hover/click handlers)
 * - Lightweight (simplified styling, no tooltips)
 * - Accessible (aria-label describing district location)
 */
export default function MiniMapPreview({
  stateCode,
  chamber,
  highlightedDistrict,
  className = '',
}: MiniMapPreviewProps) {
  const [rawSvgContent, setRawSvgContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  // Load SVG - same pattern as DistrictMap
  useEffect(() => {
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const svgPath = `${basePath}/maps/${stateCode.toLowerCase()}-${chamber}-districts.svg`;

    fetch(svgPath)
      .then((res) => {
        if (!res.ok) throw new Error('SVG not found');
        return res.text();
      })
      .then((svg) => {
        setRawSvgContent(svg);
        setError(false);
      })
      .catch((err) => {
        console.error('Failed to load mini map SVG:', err);
        setError(true);
      });
  }, [stateCode, chamber]);

  // Process SVG to apply mini-map styling and highlight district
  const processedSvgContent = useMemo(() => {
    if (!rawSvgContent) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(rawSvgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return rawSvgContent;

    // Make SVG responsive
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';

    // Remove interactive attributes from SVG root
    svg.removeAttribute('role');
    svg.removeAttribute('aria-label');

    // Process all district paths
    const paths = svg.querySelectorAll('path[id]');
    paths.forEach((path) => {
      const id = path.getAttribute('id');
      if (!id) return;

      const match = id.match(/(?:house|senate)-(\d+)/);
      if (!match) return;

      const districtNum = parseInt(match[1], 10);

      // Remove interactive attributes
      path.removeAttribute('tabindex');
      path.removeAttribute('role');
      path.removeAttribute('aria-label');
      path.removeAttribute('aria-pressed');

      // Apply highlight class if this is the user's district
      if (highlightedDistrict === districtNum) {
        path.setAttribute('class', 'district-highlighted');
      } else {
        path.removeAttribute('class');
      }
    });

    return new XMLSerializer().serializeToString(svg);
  }, [rawSvgContent, highlightedDistrict]);

  // Generate accessible label
  const stateLabel = stateCode.toUpperCase();
  const chamberLabel = chamber === 'house' ? 'House' : 'Senate';
  const ariaLabel = highlightedDistrict
    ? `Map showing ${chamberLabel} District ${highlightedDistrict} in ${stateLabel}`
    : `${stateLabel} ${chamberLabel} district map`;

  // Don't render if error or no content
  if (error || !processedSvgContent) {
    return null;
  }

  return (
    <div
      className={`mini-map-preview ${className}`}
      aria-label={ariaLabel}
      role="img"
    >
      <div
        dangerouslySetInnerHTML={{ __html: processedSvgContent }}
      />
    </div>
  );
}
