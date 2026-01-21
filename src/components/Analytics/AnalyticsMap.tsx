'use client';

import { useMemo } from 'react';
import NavigableDistrictMap from '@/components/Map/NavigableDistrictMap';
import type { AnalyticsTab } from '@/hooks/useAnalyticsUrl';
import type { CandidatesData, ElectionsData, Chamber } from '@/types/schema';

/**
 * Analytics layer configuration per tab
 */
export interface AnalyticsLayerConfig {
  /** Whether to show base district colors */
  showBaseColors: boolean;
  /** Whether to apply overlay */
  showOverlay: boolean;
  /** Overlay opacity (0-1) */
  overlayOpacity?: number;
  /** Custom color getter for districts */
  getDistrictColor?: (districtNumber: number) => string | undefined;
  /** Custom stroke color for highlights */
  getStrokeColor?: (districtNumber: number) => string | undefined;
  /** Stroke width for highlighted districts */
  highlightStrokeWidth?: number;
}

interface AnalyticsMapProps {
  /** State code */
  stateCode: string;
  /** Active analytics tab */
  activeTab: AnalyticsTab;
  /** Chamber being viewed */
  chamber: Chamber;
  /** Candidates data */
  candidatesData: CandidatesData;
  /** Elections data */
  electionsData: ElectionsData | null;
  /** Selected district */
  selectedDistrict: number | null;
  /** Hovered district */
  hoveredDistrict: number | null;
  /** Callback when district is selected */
  onDistrictSelect: (district: number | null) => void;
  /** Callback when district is hovered */
  onDistrictHover: (district: number | null) => void;
  /** Layer config from active analytics feature */
  layerConfig?: AnalyticsLayerConfig;
  /** Districts to highlight (e.g., targets, hot zones) */
  highlightedDistricts?: Set<number>;
  /** Color map for district fills */
  districtColorMap?: Map<number, string>;
  /** Additional className */
  className?: string;
}

/**
 * AnalyticsMap - Wrapper for NavigableDistrictMap with analytics layer support
 *
 * Renders the base map with analytics-specific overlays based on the active tab.
 * Each analytics feature can provide its own color scheme and highlighting.
 *
 * Features:
 * - Dynamic color overlays per tab
 * - Highlighted districts support
 * - Selection/hover sync
 * - Pass-through to NavigableDistrictMap
 */
export default function AnalyticsMap({
  stateCode,
  activeTab,
  chamber,
  candidatesData,
  electionsData,
  selectedDistrict,
  hoveredDistrict,
  onDistrictSelect,
  onDistrictHover,
  layerConfig,
  highlightedDistricts,
  districtColorMap,
  className = '',
}: AnalyticsMapProps) {
  // Build filtered districts set for highlighting
  const filteredDistricts = useMemo(() => {
    // If no highlighted districts specified, show all
    if (!highlightedDistricts || highlightedDistricts.size === 0) {
      const districts = candidatesData[chamber];
      return new Set(Object.keys(districts).map(Number));
    }
    return highlightedDistricts;
  }, [highlightedDistricts, candidatesData, chamber]);

  // Props passed for future layer integration but currently handled by NavigableDistrictMap
  // Mark as intentionally unused using void to suppress lint warnings
  void activeTab;
  void highlightedDistricts;
  void selectedDistrict;
  void hoveredDistrict;
  void districtColorMap;
  void layerConfig;

  return (
    <div className={`analytics-map ${className}`}>
      <NavigableDistrictMap
        stateCode={stateCode}
        chamber={chamber}
        candidatesData={candidatesData}
        electionsData={electionsData}
        selectedDistrict={selectedDistrict}
        onDistrictSelect={onDistrictSelect}
        onDistrictHover={onDistrictHover}
        filteredDistricts={filteredDistricts}
        enableNavigation={true}
        showChamberToggle={false}
        showModeToggle={false}
      />
    </div>
  );
}

/**
 * Get default layer config for an analytics tab
 */
export function getDefaultLayerConfig(tab: AnalyticsTab): AnalyticsLayerConfig {
  switch (tab) {
    case 'scenario':
      return {
        showBaseColors: false, // Scenario has its own colors
        showOverlay: false,
      };

    case 'historical':
      return {
        showBaseColors: false, // Historical has delta colors
        showOverlay: true,
        overlayOpacity: 0.75,
      };

    case 'recruitment':
      return {
        showBaseColors: true,
        showOverlay: true,
        overlayOpacity: 0.85,
        highlightStrokeWidth: 2,
      };

    case 'resources':
      return {
        showBaseColors: false, // Heatmap has intensity colors
        showOverlay: true,
        overlayOpacity: 0.7,
      };

    case 'demographics':
      return {
        showBaseColors: false, // Choropleth colors
        showOverlay: true,
        overlayOpacity: 0.8,
      };

    case 'comparison':
      return {
        showBaseColors: true,
        showOverlay: false,
      };

    case 'endorsements':
      return {
        showBaseColors: true,
        showOverlay: true,
        overlayOpacity: 0.6,
      };

    default:
      return {
        showBaseColors: true,
        showOverlay: false,
      };
  }
}
