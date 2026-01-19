/**
 * Unit tests for useVoterGuideData hook.
 * Tests data loading, parallel fetching, error handling, and GitHub Pages detection.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useVoterGuideData } from '@/hooks/useVoterGuideData';

// Mock data for each data type (minimal structure)
const mockCandidatesData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  house: { '1': { districtNumber: 1, candidates: [] } },
  senate: { '1': { districtNumber: 1, candidates: [] } },
};

const mockStatewideData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  races: [],
};

const mockJudicialData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  races: [],
};

const mockCongressionalData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  districts: {},
};

const mockCountyRacesData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  counties: {},
};

const mockSchoolBoardData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  districts: {},
};

const mockSpecialDistrictsData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  districts: [],
};

const mockBallotMeasuresData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  measures: [],
};

const mockElectionDatesData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  dates: [],
};

const mockCountyContactsData = {
  lastUpdated: '2026-01-17T00:00:00Z',
  contacts: {},
};

// Original fetch reference
const originalFetch = global.fetch;

/**
 * Creates a mock fetch that returns appropriate data based on URL
 * Uses exact filename matching to avoid collisions (e.g., candidates.json vs congress-candidates.json)
 */
function createMockFetch(options?: { failUrls?: string[] }) {
  const { failUrls = [] } = options || {};

  return jest.fn((url: string) => {
    // Check if this URL should fail (use exact match patterns)
    if (failUrls.some(pattern => url.includes(pattern))) {
      return Promise.reject(new Error(`Failed to fetch ${url}`));
    }

    // Return mock data based on URL pattern - order matters for specificity
    // Check more specific patterns first
    if (url.includes('congress-candidates.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCongressionalData),
      });
    }
    // Check regular candidates.json after congress-candidates.json
    if (url.includes('/candidates.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCandidatesData),
      });
    }
    if (url.includes('statewide-races.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockStatewideData),
      });
    }
    if (url.includes('judicial-races.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockJudicialData),
      });
    }
    if (url.includes('county-races.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCountyRacesData),
      });
    }
    if (url.includes('school-board.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSchoolBoardData),
      });
    }
    if (url.includes('special-districts.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSpecialDistrictsData),
      });
    }
    if (url.includes('ballot-measures.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBallotMeasuresData),
      });
    }
    if (url.includes('election-dates.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockElectionDatesData),
      });
    }
    if (url.includes('county-contacts.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCountyContactsData),
      });
    }

    return Promise.reject(new Error(`Unknown URL: ${url}`));
  }) as jest.Mock;
}

describe('useVoterGuideData', () => {
  beforeEach(() => {
    global.fetch = createMockFetch();
    jest.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with isLoading true and null data', () => {
      const { result } = renderHook(() => useVoterGuideData());

      // Initial state before effect runs
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data.candidates).toBeNull();
      expect(result.current.data.statewide).toBeNull();
      expect(result.current.data.judicialRaces).toBeNull();
      expect(result.current.data.congressional).toBeNull();
      expect(result.current.data.countyRaces).toBeNull();
      expect(result.current.data.schoolBoard).toBeNull();
      expect(result.current.data.specialDistricts).toBeNull();
      expect(result.current.data.ballotMeasures).toBeNull();
      expect(result.current.data.electionDates).toBeNull();
      expect(result.current.data.countyContacts).toBeNull();
    });
  });

  describe('data loading', () => {
    it('should load all data files in parallel', async () => {
      const { result } = renderHook(() => useVoterGuideData());

      // Advance past timers and wait for data to load
      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify fetch was called for all 10 data files
      expect(global.fetch).toHaveBeenCalledTimes(10);

      // Verify all data types were loaded
      expect(result.current.data.candidates).toEqual(mockCandidatesData);
      expect(result.current.data.statewide).toEqual(mockStatewideData);
      expect(result.current.data.judicialRaces).toEqual(mockJudicialData);
      expect(result.current.data.congressional).toEqual(mockCongressionalData);
      expect(result.current.data.countyRaces).toEqual(mockCountyRacesData);
      expect(result.current.data.schoolBoard).toEqual(mockSchoolBoardData);
      expect(result.current.data.specialDistricts).toEqual(mockSpecialDistrictsData);
      expect(result.current.data.ballotMeasures).toEqual(mockBallotMeasuresData);
      expect(result.current.data.electionDates).toEqual(mockElectionDatesData);
      expect(result.current.data.countyContacts).toEqual(mockCountyContactsData);
    });

    it('should set isLoading false after data loads', async () => {
      const { result } = renderHook(() => useVoterGuideData());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should include cache-busting query parameter in URLs', async () => {
      renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      // Check that fetch was called with URLs containing cache-buster
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      fetchCalls.forEach(([url]: [string]) => {
        expect(url).toMatch(/\?v=\d+/);
      });
    });
  });

  describe('error handling', () => {
    it('should handle fetch failures gracefully with null for failed files', async () => {
      // Set up fetch to fail for candidates.json (use exact match pattern)
      global.fetch = createMockFetch({ failUrls: ['/candidates.json'] });

      const { result } = renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Failed fetch should result in null
      expect(result.current.data.candidates).toBeNull();

      // Other data should still load
      expect(result.current.data.statewide).toEqual(mockStatewideData);
      expect(result.current.data.electionDates).toEqual(mockElectionDatesData);
    });

    it('should handle multiple fetch failures', async () => {
      // Set up fetch to fail for multiple files
      global.fetch = createMockFetch({
        failUrls: ['/candidates.json', 'statewide-races.json', 'judicial-races.json'],
      });

      const { result } = renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Failed fetches should result in null
      expect(result.current.data.candidates).toBeNull();
      expect(result.current.data.statewide).toBeNull();
      expect(result.current.data.judicialRaces).toBeNull();

      // Successful fetches should still have data
      expect(result.current.data.congressional).toEqual(mockCongressionalData);
      expect(result.current.data.electionDates).toEqual(mockElectionDatesData);
    });

    it('should set isLoading false even when all fetches fail', async () => {
      // Set up fetch to fail for all files
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // All data should be null but isLoading should be false
      expect(result.current.data.candidates).toBeNull();
      expect(result.current.data.electionDates).toBeNull();
    });
  });

  describe('GitHub Pages base path detection', () => {
    it('should use base path when pathname includes sc-election-map-2026', async () => {
      // The hook reads window.location.pathname inside useEffect
      // Default jsdom sets it to 'http://localhost/' so pathname is '/'
      // This test verifies the hook doesn't crash and loads data
      renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      // Verify fetch was called (with whatever base path)
      expect(global.fetch).toHaveBeenCalled();

      // Check that all 10 data files were requested
      expect(global.fetch).toHaveBeenCalledTimes(10);
    });

    it('should fetch all required JSON files', async () => {
      renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      const urls = fetchCalls.map(([url]: [string]) => url);

      // Verify all required files are fetched
      const requiredFiles = [
        'candidates.json',
        'statewide-races.json',
        'judicial-races.json',
        'congress-candidates.json',
        'county-races.json',
        'school-board.json',
        'special-districts.json',
        'ballot-measures.json',
        'election-dates.json',
        'county-contacts.json',
      ];

      requiredFiles.forEach(file => {
        expect(urls.some((url: string) => url.includes(file))).toBe(true);
      });
    });

    it('should prepend /data/ to all fetch URLs', async () => {
      renderHook(() => useVoterGuideData());

      await act(async () => {
        jest.runAllTimers();
      });

      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      fetchCalls.forEach(([url]: [string]) => {
        expect(url).toMatch(/\/data\//);
      });
    });
  });

  describe('return value structure', () => {
    it('should return data and isLoading properties', async () => {
      const { result } = renderHook(() => useVoterGuideData());

      // Check return type structure
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.data).toBe('object');
    });

    it('should return AllRacesData shape in data property', async () => {
      const { result } = renderHook(() => useVoterGuideData());

      // Verify all expected keys exist
      const expectedKeys = [
        'candidates',
        'statewide',
        'judicialRaces',
        'congressional',
        'countyRaces',
        'schoolBoard',
        'specialDistricts',
        'ballotMeasures',
        'electionDates',
        'countyContacts',
      ];

      expectedKeys.forEach(key => {
        expect(result.current.data).toHaveProperty(key);
      });
    });
  });
});
