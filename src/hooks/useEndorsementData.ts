'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Chamber } from '@/types/schema';

/**
 * Endorsement type categories
 */
export type EndorsementType =
  | 'labor'
  | 'environment'
  | 'newspaper'
  | 'elected'
  | 'advocacy'
  | 'other';

/**
 * Individual endorsement record
 */
export interface Endorsement {
  id: string;
  districtNumber: number;
  candidateName: string;
  endorserName: string;
  endorserType: EndorsementType;
  endorserIcon?: string;
  date?: string;
  description?: string;
  url?: string;
}

/**
 * Endorsement data by district
 */
export type EndorsementData = Record<string, Endorsement[]>;

/**
 * Endorsement type configuration
 */
export const ENDORSEMENT_TYPES: { id: EndorsementType; label: string; icon: string; color: string }[] = [
  { id: 'labor', label: 'Labor Unions', icon: '👷', color: '#F59E0B' },
  { id: 'environment', label: 'Environmental', icon: '🌿', color: '#10B981' },
  { id: 'newspaper', label: 'Newspapers', icon: '📰', color: '#6366F1' },
  { id: 'elected', label: 'Elected Officials', icon: '🏛️', color: '#3B82F6' },
  { id: 'advocacy', label: 'Advocacy Groups', icon: '📣', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: '⭐', color: '#8B5CF6' },
];

/**
 * Get endorsement type config
 */
export function getEndorsementTypeConfig(type: EndorsementType) {
  return ENDORSEMENT_TYPES.find((t) => t.id === type) || ENDORSEMENT_TYPES[ENDORSEMENT_TYPES.length - 1];
}

/**
 * Hook for loading and filtering endorsement data
 */
export interface UseEndorsementDataOptions {
  stateCode: string;
  chamber: Chamber;
  activeTypes?: EndorsementType[];
}

export interface UseEndorsementDataReturn {
  /** Raw endorsement data */
  data: EndorsementData | null;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if load failed */
  error: string | null;
  /** Filtered endorsements */
  filteredEndorsements: Endorsement[];
  /** Districts with endorsements */
  districtsWithEndorsements: Set<number>;
  /** Summary stats */
  summary: {
    totalEndorsements: number;
    totalDistrictsWithEndorsements: number;
    byType: Record<EndorsementType, number>;
  } | null;
  /** Get endorsements for a district */
  getDistrictEndorsements: (districtNumber: number) => Endorsement[];
}

/**
 * Generate demo endorsement data
 * Since we don't have real endorsement data, we generate realistic demo data
 */
function generateDemoEndorsements(
  stateCode: string,
  chamber: Chamber,
  districtCount: number
): EndorsementData {
  const data: EndorsementData = {};

  // Sample endorser names by type
  const endorsersByType: Record<EndorsementType, string[]> = {
    labor: ['AFL-CIO', 'SEIU', 'UAW', 'NEA', 'AFSCME', 'Teamsters'],
    environment: ['Sierra Club', 'LCV', 'Clean Air Council', 'Conservation Voters'],
    newspaper: [`${stateCode} Times`, `${stateCode} Post`, 'State Journal', 'Daily News'],
    elected: ['Gov. Smith', 'Sen. Johnson', 'Rep. Williams', 'Mayor Davis'],
    advocacy: ['Planned Parenthood', 'Everytown', 'ACLU', 'Human Rights Campaign'],
    other: ['Business Leaders PAC', 'Community Coalition', 'Veterans for Democracy'],
  };

  // Generate endorsements for some districts
  const endorsedDistrictCount = Math.floor(districtCount * 0.4); // ~40% of districts
  const endorsedDistricts = new Set<number>();

  while (endorsedDistricts.size < endorsedDistrictCount) {
    endorsedDistricts.add(Math.floor(Math.random() * districtCount) + 1);
  }

  const types = Object.keys(endorsersByType) as EndorsementType[];

  endorsedDistricts.forEach((districtNumber) => {
    const endorsementCount = Math.floor(Math.random() * 4) + 1; // 1-4 endorsements
    const districtEndorsements: Endorsement[] = [];

    for (let i = 0; i < endorsementCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const endorsers = endorsersByType[type];
      const endorser = endorsers[Math.floor(Math.random() * endorsers.length)];

      districtEndorsements.push({
        id: `${stateCode}-${chamber}-${districtNumber}-${i}`,
        districtNumber,
        candidateName: `Democratic Candidate ${districtNumber}`,
        endorserName: endorser,
        endorserType: type,
        endorserIcon: ENDORSEMENT_TYPES.find((t) => t.id === type)?.icon,
        date: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      });
    }

    data[String(districtNumber)] = districtEndorsements;
  });

  return data;
}

/**
 * useEndorsementData - Load and filter endorsement data
 *
 * Provides endorsement data for visualization.
 * Falls back to generated demo data if real data is not available.
 */
export function useEndorsementData({
  stateCode,
  chamber,
  activeTypes = [],
}: UseEndorsementDataOptions): UseEndorsementDataReturn {
  const [data, setData] = useState<EndorsementData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const basePath = typeof window !== 'undefined' && window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';

    const dataPath = `${basePath}/data/states/${stateCode.toLowerCase()}/demo/${chamber}-endorsements.json`;

    fetch(`${dataPath}?v=${Date.now()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('not found');
        }
        return res.json();
      })
      .then((json) => {
        setData(json);
        setIsLoading(false);
      })
      .catch(() => {
        // Generate demo data if real data not available
        const districtCount = chamber === 'house' ? 120 : 50; // Rough estimates
        const demoData = generateDemoEndorsements(stateCode, chamber, districtCount);
        setData(demoData);
        setIsLoading(false);
      });
  }, [stateCode, chamber]);

  // Filter endorsements
  const filteredEndorsements = useMemo(() => {
    if (!data) return [];

    const all = Object.values(data).flat();

    if (activeTypes.length === 0) {
      return all;
    }

    return all.filter((e) => activeTypes.includes(e.endorserType));
  }, [data, activeTypes]);

  // Get districts with endorsements
  const districtsWithEndorsements = useMemo(() => {
    return new Set(filteredEndorsements.map((e) => e.districtNumber));
  }, [filteredEndorsements]);

  // Calculate summary
  const summary = useMemo(() => {
    if (!data) return null;

    const all = Object.values(data).flat();
    const byType: Record<EndorsementType, number> = {
      labor: 0,
      environment: 0,
      newspaper: 0,
      elected: 0,
      advocacy: 0,
      other: 0,
    };

    all.forEach((e) => {
      byType[e.endorserType]++;
    });

    return {
      totalEndorsements: all.length,
      totalDistrictsWithEndorsements: Object.keys(data).length,
      byType,
    };
  }, [data]);

  // Get endorsements for a district
  const getDistrictEndorsements = useMemo(() => {
    return (districtNumber: number): Endorsement[] => {
      if (!data) return [];
      const districtData = data[String(districtNumber)] || [];

      if (activeTypes.length === 0) {
        return districtData;
      }

      return districtData.filter((e) => activeTypes.includes(e.endorserType));
    };
  }, [data, activeTypes]);

  return {
    data,
    isLoading,
    error,
    filteredEndorsements,
    districtsWithEndorsements,
    summary,
    getDistrictEndorsements,
  };
}

export default useEndorsementData;
