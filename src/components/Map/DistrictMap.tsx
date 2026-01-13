'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load SVG
  useEffect(() => {
    // Use relative path from current page
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const svgPath = `${basePath}/maps/${chamber}-districts.svg`;
    fetch(svgPath)
      .then((res) => res.text())
      .then((svg) => {
        setSvgContent(svg);
        setIsLoaded(true);
      })
      .catch((err) => console.error('Failed to load SVG:', err));
  }, [chamber]);

  // Apply styles and event handlers after SVG is loaded
  useEffect(() => {
    if (!isLoaded || !containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    // Make SVG responsive
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.maxWidth = '100%';
    svg.style.height = 'auto';

    // Get all district paths
    const paths = svg.querySelectorAll('path[id]');

    paths.forEach((path) => {
      const id = path.getAttribute('id');
      if (!id) return;

      // Extract district number from id (e.g., "house-70" -> 70)
      const match = id.match(/(?:house|senate)-(\d+)/);
      if (!match) return;

      const districtNum = parseInt(match[1], 10);
      const districtData = candidatesData[chamber][String(districtNum)];

      // Determine color based on candidates
      const color = getDistrictColor(districtData);

      // Apply base styles
      path.setAttribute('fill', color);
      path.setAttribute('stroke', '#374151');
      path.setAttribute('stroke-width', '0.5');
      path.setAttribute('cursor', 'pointer');
      path.setAttribute('data-district', String(districtNum));

      // Apply selected state
      if (selectedDistrict === districtNum) {
        path.setAttribute('stroke', '#1e3a8a');
        path.setAttribute('stroke-width', '2');
      }

      // Remove existing event listeners by cloning
      const newPath = path.cloneNode(true) as Element;
      path.parentNode?.replaceChild(newPath, path);

      // Add event listeners
      newPath.addEventListener('click', () => onDistrictClick(districtNum));
      newPath.addEventListener('mouseenter', () => {
        onDistrictHover(districtNum);
        newPath.setAttribute('opacity', '0.8');
      });
      newPath.addEventListener('mouseleave', () => {
        onDistrictHover(null);
        newPath.setAttribute('opacity', '1');
      });
    });
  }, [isLoaded, svgContent, chamber, candidatesData, selectedDistrict, onDistrictClick, onDistrictHover]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

function getDistrictColor(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return '#f3f4f6'; // gray-100 - no candidates
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
    return '#9ca3af'; // gray-400 - unknown party
  }
}
