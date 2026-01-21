'use client';

import { useMemo } from 'react';

/**
 * Zoom level thresholds for progressive disclosure
 */
export const ZOOM_THRESHOLDS = {
  /** State overview level: zoom <= 8 */
  STATE: 8,
  /** Region/county level: 8 < zoom <= 10 */
  REGION: 10,
  /** District detail level: zoom > 10 */
  DISTRICT: 10,
} as const;

/**
 * Zoom level categories
 */
export type ZoomLevel = 'state' | 'region' | 'district';

/**
 * Determine zoom level category from numeric zoom value
 */
export function getZoomLevel(zoom: number): ZoomLevel {
  if (zoom <= ZOOM_THRESHOLDS.STATE) return 'state';
  if (zoom <= ZOOM_THRESHOLDS.REGION) return 'region';
  return 'district';
}

/**
 * Props for ZoomLevelContent component
 */
export interface ZoomLevelContentProps {
  /** Current map zoom level */
  currentZoom: number;
  /** Content to show at state/overview zoom level (zoom <= 8) */
  stateViewContent: React.ReactNode;
  /** Content to show at region zoom level (8 < zoom <= 10) */
  regionViewContent?: React.ReactNode;
  /** Content to show at district zoom level (zoom > 10) */
  districtViewContent?: React.ReactNode;
  /** Transition duration in milliseconds (default: 300) */
  transitionDuration?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ZoomLevelContent - Progressive disclosure based on map zoom level
 *
 * Shows different UI content depending on how zoomed in the map is:
 * - State view (zoom <= 8): Overview KPIs and statewide data
 * - Region view (8 < zoom <= 10): Regional context and county-level info
 * - District view (zoom > 10): Detailed district information
 *
 * Features:
 * - Smooth CSS transitions between content levels
 * - Respects prefers-reduced-motion accessibility setting
 * - Graceful fallbacks (region falls back to state, district falls back to region)
 * - Glassmorphic styling matching design system
 *
 * @example
 * ```tsx
 * <ZoomLevelContent
 *   currentZoom={mapState.zoom}
 *   stateViewContent={<KPICards stats={stats} />}
 *   regionViewContent={<RegionSummary county={county} />}
 *   districtViewContent={<DistrictMiniCard district={district} />}
 * />
 * ```
 */
export function ZoomLevelContent({
  currentZoom,
  stateViewContent,
  regionViewContent,
  districtViewContent,
  transitionDuration = 300,
  className = '',
}: ZoomLevelContentProps): React.ReactElement {
  // Determine current zoom level category
  const zoomLevel = useMemo(() => getZoomLevel(currentZoom), [currentZoom]);

  // Determine which content to render (with fallbacks)
  const activeContent = useMemo(() => {
    switch (zoomLevel) {
      case 'district':
        return districtViewContent ?? regionViewContent ?? stateViewContent;
      case 'region':
        return regionViewContent ?? stateViewContent;
      case 'state':
      default:
        return stateViewContent;
    }
  }, [zoomLevel, stateViewContent, regionViewContent, districtViewContent]);

  // CSS custom property for transition duration
  const transitionStyle = {
    '--zoom-transition-duration': `${transitionDuration}ms`,
  } as React.CSSProperties;

  return (
    <div
      className={`zoom-level-content ${className}`}
      style={transitionStyle}
      data-zoom-level={zoomLevel}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="zoom-level-content__wrapper">
        {activeContent}
      </div>
    </div>
  );
}

/**
 * Hook to get current zoom level category
 * Useful when you need zoom level in component logic
 */
export function useZoomLevel(zoom: number): ZoomLevel {
  return useMemo(() => getZoomLevel(zoom), [zoom]);
}

/**
 * Check if zoom level is at or below state overview
 */
export function isStateLevel(zoom: number): boolean {
  return zoom <= ZOOM_THRESHOLDS.STATE;
}

/**
 * Check if zoom level is at region level
 */
export function isRegionLevel(zoom: number): boolean {
  return zoom > ZOOM_THRESHOLDS.STATE && zoom <= ZOOM_THRESHOLDS.REGION;
}

/**
 * Check if zoom level is at district level
 */
export function isDistrictLevel(zoom: number): boolean {
  return zoom > ZOOM_THRESHOLDS.DISTRICT;
}

export default ZoomLevelContent;
