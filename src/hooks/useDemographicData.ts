'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Chamber } from '@/types/schema';

/**
 * Demographic layer types
 */
export type DemographicLayer =
  | 'registration'
  | 'turnout'
  | 'education'
  | 'urbanization'
  | 'diversity';

/**
 * District voter intelligence data structure
 */
export interface DistrictVoterIntelligence {
  districtNumber: number;
  registeredVoters: number;
  turnout2024: number;
  turnout2022: number;
  turnout2020: number;
  registration: {
    democratic: number;
    republican: number;
    independent: number;
    other: number;
  };
  demographics: {
    medianAge: number;
    collegeEducated: number;
    urbanization: 'urban' | 'suburban' | 'rural';
    diversityIndex: number;
  };
  trends: {
    registrationTrend: number;
    turnoutTrend: number;
    demographicShift: number;
  };
}

/**
 * Voter intelligence data indexed by district number
 */
export type VoterIntelligenceData = Record<string, DistrictVoterIntelligence>;

/**
 * Color scale configuration for demographic layers
 */
export interface DemographicColorScale {
  label: string;
  description: string;
  getColor: (value: number) => string;
  getValue: (district: DistrictVoterIntelligence) => number;
  formatValue: (value: number) => string;
  min: number;
  max: number;
}

/**
 * Get value for a demographic layer
 */
function getLayerValue(district: DistrictVoterIntelligence, layer: DemographicLayer): number {
  switch (layer) {
    case 'registration': {
      const { democratic, republican } = district.registration;
      const total = democratic + republican;
      if (total === 0) return 50;
      return (democratic / total) * 100;
    }
    case 'turnout':
      return district.turnout2024 * 100;
    case 'education':
      return district.demographics.collegeEducated * 100;
    case 'urbanization': {
      // Map urbanization to numeric scale: urban=100, suburban=60, rural=20
      const mapping = { urban: 100, suburban: 60, rural: 20 };
      return mapping[district.demographics.urbanization] || 50;
    }
    case 'diversity':
      return district.demographics.diversityIndex * 100;
    default:
      return 0;
  }
}

/**
 * Color scales for each demographic layer
 */
export const DEMOGRAPHIC_COLOR_SCALES: Record<DemographicLayer, DemographicColorScale> = {
  registration: {
    label: 'Registration Advantage',
    description: 'Democrat share of Dem+Rep registrations',
    getValue: (d) => getLayerValue(d, 'registration'),
    formatValue: (v) => `${v.toFixed(0)}% Dem`,
    min: 30,
    max: 70,
    getColor: (value) => {
      // Blue-Red diverging scale centered at 50%
      if (value >= 60) return '#1E40AF'; // Strong Dem
      if (value >= 55) return '#3B82F6'; // Moderate Dem
      if (value >= 52) return '#93C5FD'; // Lean Dem
      if (value >= 48) return '#9CA3AF'; // Competitive
      if (value >= 45) return '#FCA5A5'; // Lean Rep
      if (value >= 40) return '#EF4444'; // Moderate Rep
      return '#B91C1C'; // Strong Rep
    },
  },
  turnout: {
    label: 'Voter Turnout',
    description: '2024 turnout rate',
    getValue: (d) => getLayerValue(d, 'turnout'),
    formatValue: (v) => `${v.toFixed(0)}%`,
    min: 30,
    max: 80,
    getColor: (value) => {
      // Green sequential scale
      if (value >= 70) return '#065F46'; // Very high
      if (value >= 60) return '#059669'; // High
      if (value >= 50) return '#34D399'; // Medium
      if (value >= 40) return '#A7F3D0'; // Low
      return '#D1FAE5'; // Very low
    },
  },
  education: {
    label: 'College Education',
    description: 'Percent with college degree',
    getValue: (d) => getLayerValue(d, 'education'),
    formatValue: (v) => `${v.toFixed(0)}%`,
    min: 15,
    max: 60,
    getColor: (value) => {
      // Purple sequential scale
      if (value >= 50) return '#5B21B6'; // Very high
      if (value >= 40) return '#7C3AED'; // High
      if (value >= 30) return '#A78BFA'; // Medium
      if (value >= 20) return '#C4B5FD'; // Low
      return '#EDE9FE'; // Very low
    },
  },
  urbanization: {
    label: 'Urbanization',
    description: 'Urban/Suburban/Rural classification',
    getValue: (d) => getLayerValue(d, 'urbanization'),
    formatValue: (v) => {
      if (v >= 80) return 'Urban';
      if (v >= 40) return 'Suburban';
      return 'Rural';
    },
    min: 0,
    max: 100,
    getColor: (value) => {
      // Yellow-Orange scale
      if (value >= 80) return '#B45309'; // Urban
      if (value >= 40) return '#F59E0B'; // Suburban
      return '#FDE68A'; // Rural
    },
  },
  diversity: {
    label: 'Diversity Index',
    description: 'Probability two random residents differ by race',
    getValue: (d) => getLayerValue(d, 'diversity'),
    formatValue: (v) => `${v.toFixed(0)}%`,
    min: 10,
    max: 80,
    getColor: (value) => {
      // Teal sequential scale
      if (value >= 70) return '#134E4A'; // Very diverse
      if (value >= 55) return '#0D9488'; // High diversity
      if (value >= 40) return '#2DD4BF'; // Medium diversity
      if (value >= 25) return '#99F6E4'; // Low diversity
      return '#CCFBF1'; // Very low diversity
    },
  },
};

/**
 * Layer options for UI
 */
export const DEMOGRAPHIC_LAYERS: { id: DemographicLayer; label: string; icon: string }[] = [
  { id: 'registration', label: 'Registration', icon: '🗳️' },
  { id: 'turnout', label: 'Turnout', icon: '📊' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'urbanization', label: 'Urbanization', icon: '🏙️' },
  { id: 'diversity', label: 'Diversity', icon: '🌍' },
];

/**
 * Hook for loading and processing demographic/voter intelligence data
 */
export interface UseDemographicDataOptions {
  stateCode: string;
  chamber: Chamber;
  activeLayer?: DemographicLayer;
}

export interface UseDemographicDataReturn {
  /** Raw voter intelligence data */
  data: VoterIntelligenceData | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Active color scale */
  colorScale: DemographicColorScale;
  /** Get color for a district */
  getDistrictColor: (districtNumber: number) => string;
  /** Get formatted value for a district */
  getDistrictValue: (districtNumber: number) => string;
  /** District summary stats */
  summary: {
    avgValue: number;
    minValue: number;
    maxValue: number;
    totalDistricts: number;
  } | null;
}

/**
 * useDemographicData - Load and process voter intelligence data
 *
 * Provides demographic layer data for choropleth visualization.
 */
export function useDemographicData({
  stateCode,
  chamber,
  activeLayer = 'registration',
}: UseDemographicDataOptions): UseDemographicDataReturn {
  const [data, setData] = useState<VoterIntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    const dataPath = `${basePath}/data/states/${stateCode.toLowerCase()}/demo/${chamber}-voter-intelligence.json`;

    fetch(`${dataPath}?v=${Date.now()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load demographic data: ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load demographic data:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [stateCode, chamber]);

  // Get active color scale
  const colorScale = DEMOGRAPHIC_COLOR_SCALES[activeLayer];

  // Get color for a district
  const getDistrictColor = useMemo(() => {
    return (districtNumber: number): string => {
      if (!data) return '#E5E7EB';
      const district = data[String(districtNumber)];
      if (!district) return '#E5E7EB';
      const value = colorScale.getValue(district);
      return colorScale.getColor(value);
    };
  }, [data, colorScale]);

  // Get formatted value for a district
  const getDistrictValue = useMemo(() => {
    return (districtNumber: number): string => {
      if (!data) return 'N/A';
      const district = data[String(districtNumber)];
      if (!district) return 'N/A';
      const value = colorScale.getValue(district);
      return colorScale.formatValue(value);
    };
  }, [data, colorScale]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!data) return null;

    const values = Object.values(data).map((d) => colorScale.getValue(d));
    if (values.length === 0) return null;

    return {
      avgValue: values.reduce((a, b) => a + b, 0) / values.length,
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      totalDistricts: values.length,
    };
  }, [data, colorScale]);

  return {
    data,
    isLoading,
    error,
    colorScale,
    getDistrictColor,
    getDistrictValue,
    summary,
  };
}

export default useDemographicData;
