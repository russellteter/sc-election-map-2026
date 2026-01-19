/**
 * useVoterGuideData Hook
 *
 * Custom React hook for loading all voter guide data files in parallel.
 * Handles GitHub Pages base path detection and cache-busting.
 *
 * Features:
 * - Loads 10 JSON data files in parallel
 * - Handles GitHub Pages base path detection
 * - Cache-busting with timestamp query param
 * - Graceful error handling (null for failed fetches)
 */

import { useState, useEffect } from 'react';
import type {
  CandidatesData,
  StatewideRacesData,
  CongressionalData,
  ElectionDatesData,
  CountyRacesData,
  JudicialRacesData,
  SchoolBoardData,
  BallotMeasuresData,
  SpecialDistrictsData,
  CountyContactsData
} from '@/types/schema';

/**
 * All races data structure containing data from all JSON files
 */
export interface AllRacesData {
  candidates: CandidatesData | null;
  statewide: StatewideRacesData | null;
  judicialRaces: JudicialRacesData | null;
  congressional: CongressionalData | null;
  countyRaces: CountyRacesData | null;
  schoolBoard: SchoolBoardData | null;
  specialDistricts: SpecialDistrictsData | null;
  ballotMeasures: BallotMeasuresData | null;
  electionDates: ElectionDatesData | null;
  countyContacts: CountyContactsData | null;
}

/**
 * Return type for useVoterGuideData hook
 */
interface UseVoterGuideDataReturn {
  /** All loaded race data */
  data: AllRacesData;
  /** Whether data is currently loading */
  isLoading: boolean;
}

/**
 * Initial empty state for all races data
 */
const initialData: AllRacesData = {
  candidates: null,
  statewide: null,
  judicialRaces: null,
  congressional: null,
  countyRaces: null,
  schoolBoard: null,
  specialDistricts: null,
  ballotMeasures: null,
  electionDates: null,
  countyContacts: null,
};

/**
 * Hook to load all voter guide data files
 *
 * @returns Object with data and isLoading state
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useVoterGuideData();
 *
 * if (isLoading) {
 *   return <LoadingSkeleton />;
 * }
 *
 * return <StatewideRaces data={data.statewide} />;
 * ```
 */
export function useVoterGuideData(): UseVoterGuideDataReturn {
  const [data, setData] = useState<AllRacesData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Detect GitHub Pages base path
    const basePath = window.location.pathname.includes('/sc-election-map-2026')
      ? '/sc-election-map-2026'
      : '';
    const cacheBuster = `v=${Date.now()}`;

    // Load all data files in parallel
    Promise.all([
      fetch(`${basePath}/data/candidates.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/statewide-races.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/judicial-races.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/congress-candidates.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/county-races.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/school-board.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/special-districts.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/ballot-measures.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/election-dates.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
      fetch(`${basePath}/data/county-contacts.json?${cacheBuster}`).then(r => r.json()).catch(() => null),
    ]).then(([candidates, statewide, judicialRaces, congressional, countyRaces, schoolBoard, specialDistricts, ballotMeasures, electionDates, countyContacts]) => {
      setData({
        candidates,
        statewide,
        judicialRaces,
        congressional,
        countyRaces,
        schoolBoard,
        specialDistricts,
        ballotMeasures,
        electionDates,
        countyContacts
      });
      setIsLoading(false);
    }).catch(err => {
      console.error('Failed to load data:', err);
      setIsLoading(false);
    });

    // Note: GeoJSON boundaries are now lazy-loaded on AddressAutocomplete focus
    // This defers 2MB of data until user interaction
  }, []);

  return { data, isLoading };
}
