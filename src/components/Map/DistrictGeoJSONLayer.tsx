'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { importLeaflet, GEOJSON_PATHS, getDistrictPropertyKey, getBasePath, type ChamberType } from '@/lib/leafletLoader';
import { getGeoJsonFromCache, setGeoJsonInCache } from '@/lib/cacheUtils';
import {
  getDistrictFillColor,
  getCongressionalFillColor,
  DISTRICT_COLORS_SOLID,
  CONGRESSIONAL_COLORS,
} from '@/lib/districtColors';
import type { Feature, FeatureCollection, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';
import type { CandidatesData, ElectionsData } from '@/types/schema';
import type { PathOptions, Layer, LeafletMouseEvent } from 'leaflet';

type DistrictFeature = Feature<Polygon | MultiPolygon, GeoJsonProperties>;

export interface DistrictGeoJSONLayerProps {
  /** Chamber type: house, senate, or congressional */
  chamber: ChamberType;
  /** Candidate data for coloring (house/senate only) */
  candidatesData?: CandidatesData;
  /** Election history for margin-based coloring */
  electionsData?: ElectionsData | null;
  /** Currently selected district number */
  selectedDistrict?: number | null;
  /** Callback when district is clicked */
  onDistrictClick?: (districtNumber: number) => void;
  /** Callback when district is hovered */
  onDistrictHover?: (districtNumber: number | null) => void;
  /** Filter to specific districts (numbers) */
  filteredDistricts?: Set<number>;
}

/**
 * GeoJSON layer for district boundaries in Leaflet
 *
 * Supports House, Senate, and Congressional districts with
 * appropriate coloring schemes.
 */
export default function DistrictGeoJSONLayer({
  chamber,
  candidatesData,
  electionsData,
  selectedDistrict,
  onDistrictClick,
  onDistrictHover,
  filteredDistricts,
}: DistrictGeoJSONLayerProps) {
  const [geoJsonData, setGeoJsonData] = useState<FeatureCollection | null>(null);
  const [leafletComponents, setLeafletComponents] = useState<Awaited<ReturnType<typeof importLeaflet>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Leaflet components
  useEffect(() => {
    importLeaflet().then(setLeafletComponents);
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    let mounted = true;
    const cacheKey = `sc-${chamber}-districts`;

    async function loadGeoJSON() {
      setIsLoading(true);
      setError(null);

      try {
        // Try cache first
        const cached = await getGeoJsonFromCache(cacheKey);
        if (cached && mounted) {
          setGeoJsonData(cached);
          setIsLoading(false);
          return;
        }

        // Fetch from network
        const basePath = getBasePath();
        const path = GEOJSON_PATHS[chamber];
        const response = await fetch(`${basePath}${path}`);

        if (!response.ok) {
          throw new Error(`Failed to load ${chamber} district GeoJSON`);
        }

        const data = await response.json();

        if (mounted) {
          setGeoJsonData(data);
          setIsLoading(false);

          // Cache for future use
          setGeoJsonInCache(cacheKey, data).catch(console.error);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load districts');
          setIsLoading(false);
        }
      }
    }

    loadGeoJSON();

    return () => {
      mounted = false;
    };
  }, [chamber]);

  // Get district number from feature
  const getDistrictNumber = useCallback((feature: DistrictFeature): number | null => {
    const propKey = getDistrictPropertyKey(chamber);
    const value = feature.properties?.[propKey];
    if (value === undefined || value === null) return null;
    return parseInt(String(value), 10);
  }, [chamber]);

  // Style function for GeoJSON features
  const getStyle = useCallback((feature: DistrictFeature | undefined): PathOptions => {
    if (!feature) return {};

    const districtNum = getDistrictNumber(feature);
    if (districtNum === null) return {};

    // Base style
    const isSelected = selectedDistrict === districtNum;
    const isFiltered = filteredDistricts && !filteredDistricts.has(districtNum);

    // Get fill color based on chamber type
    let fillColor: string;
    if (chamber === 'congressional') {
      // Congressional uses party-based coloring
      const districtId = feature.properties?.CD118FP || String(districtNum).padStart(2, '0');
      fillColor = getCongressionalFillColor(districtId);
    } else {
      // House/Senate uses candidate data
      const districtData = candidatesData?.[chamber]?.[String(districtNum)];
      const electionHistory = electionsData?.[chamber]?.[String(districtNum)];
      fillColor = getDistrictFillColor(districtData, electionHistory, true);
    }

    return {
      fillColor,
      fillOpacity: isFiltered ? 0.2 : 0.7,
      color: isSelected ? '#4739E7' : '#374151',
      weight: isSelected ? 3 : 1,
      opacity: isFiltered ? 0.3 : 1,
    };
  }, [chamber, candidatesData, electionsData, selectedDistrict, filteredDistricts, getDistrictNumber]);

  // Highlight style on hover
  const highlightStyle: PathOptions = {
    weight: 2,
    fillOpacity: 0.85,
  };

  // Event handlers
  const onEachFeature = useCallback((feature: DistrictFeature, layer: Layer) => {
    const districtNum = getDistrictNumber(feature);
    if (districtNum === null) return;

    // Click handler
    layer.on('click', () => {
      if (onDistrictClick) {
        onDistrictClick(districtNum);
      }
    });

    // Hover handlers
    layer.on('mouseover', (e: LeafletMouseEvent) => {
      const targetLayer = e.target;
      targetLayer.setStyle(highlightStyle);
      targetLayer.bringToFront();
      if (onDistrictHover) {
        onDistrictHover(districtNum);
      }
    });

    layer.on('mouseout', (e: LeafletMouseEvent) => {
      const targetLayer = e.target;
      targetLayer.setStyle(getStyle(feature));
      if (onDistrictHover) {
        onDistrictHover(null);
      }
    });
  }, [getDistrictNumber, getStyle, onDistrictClick, onDistrictHover]);

  // Generate unique key for GeoJSON layer (forces re-render on data changes)
  const layerKey = useMemo(() => {
    return `${chamber}-${selectedDistrict}-${JSON.stringify(Array.from(filteredDistricts || []))}`;
  }, [chamber, selectedDistrict, filteredDistricts]);

  // Render nothing during loading or error states
  if (isLoading || error || !geoJsonData || !leafletComponents) {
    return null;
  }

  const { GeoJSON } = leafletComponents;

  return (
    <GeoJSON
      key={layerKey}
      data={geoJsonData}
      style={(feature) => getStyle(feature as DistrictFeature)}
      onEachFeature={(feature, layer) => onEachFeature(feature as DistrictFeature, layer)}
    />
  );
}

export { DistrictGeoJSONLayer };
