/**
 * Unit tests for useDistrictSearch hook
 *
 * Tests the district search functionality including:
 * - Search by district number
 * - Search by representative name
 * - Autocomplete results
 * - Keyboard navigation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDistrictSearch } from '@/hooks/useDistrictSearch';
import type { CandidatesData } from '@/types/schema';

// Enable fake timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// Mock candidate data
const mockCandidatesData: CandidatesData = {
  house: {
    '1': {
      districtNumber: 1,
      candidates: [
        { name: 'John Smith', party: 'DEM', address: '123 Main St' },
        { name: 'Jane Doe', party: 'REP', address: '456 Oak Ave' },
      ],
    },
    '2': {
      districtNumber: 2,
      candidates: [{ name: 'Alice Johnson', party: 'DEM', address: '789 Elm Blvd' }],
    },
    '10': {
      districtNumber: 10,
      candidates: [],
    },
  },
  senate: {
    '1': {
      districtNumber: 1,
      candidates: [{ name: 'Bob Williams', party: 'REP', address: '321 Pine Ln' }],
    },
    '5': {
      districtNumber: 5,
      candidates: [{ name: 'Carol Brown', party: 'DEM', address: '654 Maple Dr' }],
    },
  },
};

// Use 0 debounce for synchronous tests
const testOptions = { debounceMs: 0 };

describe('useDistrictSearch hook', () => {
  it('should return empty results for empty query', () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    expect(result.current.results).toEqual([]);
    expect(result.current.query).toBe('');
  });

  it('should search by district number', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    act(() => {
      result.current.setQuery('1');
    });

    // Advance timers and wait for state updates
    await act(async () => {
      jest.runAllTimers();
    });

    // Should find House District 1 and Senate District 1
    expect(result.current.results.length).toBeGreaterThanOrEqual(2);
    expect(result.current.results.some((r) => r.label.includes('House') && r.label.includes('1'))).toBe(true);
    expect(result.current.results.some((r) => r.label.includes('Senate') && r.label.includes('1'))).toBe(true);
  });

  it('should search by candidate name', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    act(() => {
      result.current.setQuery('john');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // Should find John Smith and Alice Johnson
    expect(result.current.results.length).toBeGreaterThanOrEqual(1);
    expect(result.current.results.some((r) => r.label.toLowerCase().includes('john'))).toBe(true);
  });

  it('should return candidate type results for name matches', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    act(() => {
      result.current.setQuery('Smith');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    const candidateResult = result.current.results.find((r) => r.type === 'candidate');
    expect(candidateResult).toBeDefined();
    expect(candidateResult?.label).toBe('John Smith');
    expect(candidateResult?.districtNumber).toBe(1);
  });

  it('should clear results when query is cleared', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    act(() => {
      result.current.setQuery('1');
    });

    await act(async () => {
      jest.runAllTimers();
    });
    expect(result.current.results.length).toBeGreaterThan(0);

    act(() => {
      result.current.setQuery('');
    });

    await act(async () => {
      jest.runAllTimers();
    });
    expect(result.current.results).toEqual([]);
  });

  it('should call onSelect callback when selecting a result', async () => {
    const onSelectMock = jest.fn();
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, { ...testOptions, onSelect: onSelectMock }));

    act(() => {
      result.current.setQuery('1');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    const firstResult = result.current.results[0];
    act(() => {
      result.current.selectResult(firstResult);
    });

    expect(onSelectMock).toHaveBeenCalledWith(firstResult);
  });

  it('should track selected index for keyboard navigation', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    act(() => {
      result.current.setQuery('1');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current.selectedIndex).toBe(-1);

    act(() => {
      result.current.moveSelection(1);
    });
    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      result.current.moveSelection(1);
    });
    expect(result.current.selectedIndex).toBe(1);

    // Should not go past last item
    act(() => {
      result.current.moveSelection(100);
    });
    expect(result.current.selectedIndex).toBeLessThan(result.current.results.length);
  });

  it('should reset selection when query changes', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, testOptions));

    act(() => {
      result.current.setQuery('1');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    act(() => {
      result.current.moveSelection(1);
    });
    expect(result.current.selectedIndex).toBe(0);

    act(() => {
      result.current.setQuery('2');
    });

    await act(async () => {
      jest.runAllTimers();
    });
    expect(result.current.selectedIndex).toBe(-1);
  });

  it('should limit results to max configured', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, { ...testOptions, maxResults: 2 }));

    act(() => {
      result.current.setQuery('1');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current.results.length).toBeLessThanOrEqual(2);
  });

  it('should filter by chamber when specified', async () => {
    const { result } = renderHook(() => useDistrictSearch(mockCandidatesData, { ...testOptions, chamberFilter: 'house' }));

    act(() => {
      result.current.setQuery('1');
    });

    await act(async () => {
      jest.runAllTimers();
    });

    // All results should be from house chamber
    result.current.results.forEach((r) => {
      if (r.type === 'district') {
        expect(r.chamber).toBe('house');
      }
    });
  });
});
