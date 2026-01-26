'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HybridMapContainer, { type HybridMapContainerProps } from './HybridMapContainer';
import ShareButton from './ShareButton';
import type { CandidatesData, ElectionsData } from '@/types/schema';
import type { LensId } from '@/types/lens';
import { DEFAULT_LENS } from '@/types/lens';
import type { OpportunityData } from '@/lib/districtColors';

type LegislativeChamber = 'house' | 'senate';

export interface NavigableDistrictMapProps {
  /** State code for routing (e.g., 'sc', 'nc') */
  stateCode: string;
  /** Current chamber selection */
  chamber: LegislativeChamber | 'congressional';
  /** Candidate data for coloring */
  candidatesData: CandidatesData;
  /** Election history for margin-based coloring */
  electionsData?: ElectionsData | null;
  /** Currently selected district */
  selectedDistrict: number | null;
  /** Callback when district is selected (single-click) */
  onDistrictSelect: (districtNumber: number) => void;
  /** Callback when district is hovered */
  onDistrictHover: (districtNumber: number | null) => void;
  /** Filter to specific districts */
  filteredDistricts?: Set<number>;
  /** Enable navigation on double-click (default: true) */
  enableNavigation?: boolean;
  /** Optional callback when navigation occurs */
  onNavigate?: (districtNumber: number) => void;
  /** Show chamber toggle (default: true) */
  showChamberToggle?: boolean;
  /** Show mode toggle button (default: true) */
  showModeToggle?: boolean;
  /** Additional className */
  className?: string;
  /** Active lens for multi-lens visualization (default: 'incumbents') */
  activeLens?: LensId;
  /** Opportunity data for opportunity lens */
  opportunityData?: Record<string, OpportunityData>;
}

/**
 * NavigableDistrictMap
 *
 * Wraps HybridMapContainer with navigation behavior:
 * - Single-click: Select district (updates side panel)
 * - Double-click: Navigate to district detail view (updates URL)
 *
 * Uses Next.js router for navigation to preserve app state.
 */
export default function NavigableDistrictMap({
  stateCode,
  chamber,
  candidatesData,
  electionsData,
  selectedDistrict,
  onDistrictSelect,
  onDistrictHover,
  filteredDistricts,
  enableNavigation = true,
  onNavigate,
  showChamberToggle = true,
  showModeToggle = true,
  className,
  activeLens = DEFAULT_LENS,
  opportunityData,
}: NavigableDistrictMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track click timing for double-click detection
  const lastClickRef = useRef<{ district: number; time: number } | null>(null);
  const DOUBLE_CLICK_THRESHOLD = 300; // milliseconds

  // Tooltip state for navigation hint
  const [showNavigationHint, setShowNavigationHint] = useState<number | null>(null);

  /**
   * Handle district click with double-click detection
   * Single-click: Select district
   * Double-click: Navigate to district detail
   */
  const handleDistrictClick = useCallback((districtNumber: number) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;

    // Check for double-click on same district
    if (
      enableNavigation &&
      lastClick &&
      lastClick.district === districtNumber &&
      now - lastClick.time < DOUBLE_CLICK_THRESHOLD
    ) {
      // Double-click detected - navigate
      lastClickRef.current = null; // Reset to prevent triple-click

      // Build URL with current chamber and district
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('chamber', chamber === 'congressional' ? 'house' : chamber);
      params.set('district', String(districtNumber));

      const url = `/${stateCode.toLowerCase()}?${params.toString()}`;
      router.push(url);

      // Call optional callback
      onNavigate?.(districtNumber);
    } else {
      // Single-click - select district
      lastClickRef.current = { district: districtNumber, time: now };
      onDistrictSelect(districtNumber);
    }
  }, [enableNavigation, stateCode, chamber, searchParams, router, onDistrictSelect, onNavigate]);

  /**
   * Handle hover - show navigation hint on first hover
   */
  const handleDistrictHover = useCallback((districtNumber: number | null) => {
    // Show navigation hint briefly on hover
    if (districtNumber !== null && enableNavigation) {
      setShowNavigationHint(districtNumber);
    } else {
      setShowNavigationHint(null);
    }

    // Pass through to parent handler
    onDistrictHover(districtNumber);
  }, [enableNavigation, onDistrictHover]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    : false;

  return (
    <div className={`navigable-district-map relative ${className || ''}`}>
      {/* Wrap HybridMapContainer */}
      <HybridMapContainer
        initialChamber={chamber}
        candidatesData={candidatesData}
        electionsData={electionsData}
        selectedDistrict={selectedDistrict}
        onDistrictClick={handleDistrictClick}
        onDistrictHover={handleDistrictHover}
        filteredDistricts={filteredDistricts}
        stateCode={stateCode}
        showChamberToggle={showChamberToggle}
        showModeToggle={showModeToggle}
        className="h-full cursor-pointer"
        activeLens={activeLens}
        opportunityData={opportunityData}
      />

      {/* Share button - top right corner */}
      <div className="absolute top-3 right-3 z-20">
        <ShareButton
          mapState={{
            chamber: chamber === 'congressional' ? 'house' : chamber,
            district: selectedDistrict ?? undefined,
          }}
          options={{
            title: `${stateCode.toUpperCase()} Election Map`,
            text: selectedDistrict
              ? `View ${chamber === 'congressional' ? 'House' : chamber.charAt(0).toUpperCase() + chamber.slice(1)} District ${selectedDistrict}`
              : `View the ${stateCode.toUpperCase()} Election Map`,
          }}
          size="sm"
        />
      </div>

      {/* Navigation hint tooltip */}
      {enableNavigation && showNavigationHint !== null && !prefersReducedMotion && (
        <div
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          role="tooltip"
          aria-live="polite"
        >
          <div
            className="glass-surface px-3 py-1.5 rounded-lg text-xs shadow-lg border animate-fade-in"
            style={{
              borderColor: 'var(--class-purple-light)',
              background: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>
              Double-click to view details
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export { NavigableDistrictMap };
