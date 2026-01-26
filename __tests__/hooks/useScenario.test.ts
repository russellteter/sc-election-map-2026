/**
 * Tests for useScenario hook
 *
 * Tests scenario simulation functionality including district toggling,
 * seat count calculations, and serialization.
 *
 * Note: URL synchronization tests are skipped due to JSDOM limitations
 * with window.location. The URL sync functionality should be tested via E2E tests.
 */

import { renderHook, act } from '@testing-library/react';
import { useScenario, type UseScenarioOptions } from '@/hooks/useScenario';
import type { SeatCount } from '@/lib/districtColors';

// =============================================================================
// Test Helpers
// =============================================================================

/**
 * Create default options for the hook
 */
function createDefaultOptions(
  overrides?: Partial<UseScenarioOptions>
): UseScenarioOptions {
  return {
    chamber: 'house',
    baselineCounts: { dem: 24, rep: 100, tossup: 0 },
    districtParties: new Map([
      [1, 'D'],
      [2, 'D'],
      [3, 'R'],
      [4, 'R'],
      [5, null], // No incumbent
    ]),
    syncUrl: false, // Disable URL sync for unit tests
    ...overrides,
  };
}

// =============================================================================
// Basic Hook Tests
// =============================================================================

describe('useScenario - Basic Functionality', () => {
  it('initializes with empty scenario map', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    expect(result.current.scenarioMap.size).toBe(0);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.flippedCount).toBe(0);
  });

  it('returns baseline counts unchanged initially', () => {
    const baselineCounts: SeatCount = { dem: 24, rep: 100, tossup: 0 };
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions({ baselineCounts }))
    );

    expect(result.current.baselineCounts).toEqual(baselineCounts);
    expect(result.current.scenarioCounts).toEqual(baselineCounts);
  });

  it('tracks chamber correctly', () => {
    const { result: houseResult } = renderHook(() =>
      useScenario(createDefaultOptions({ chamber: 'house' }))
    );

    const { result: senateResult } = renderHook(() =>
      useScenario(createDefaultOptions({ chamber: 'senate' }))
    );

    // Both hooks should function independently
    expect(houseResult.current.scenarioMap.size).toBe(0);
    expect(senateResult.current.scenarioMap.size).toBe(0);
  });
});

// =============================================================================
// toggleDistrict Tests
// =============================================================================

describe('useScenario - toggleDistrict', () => {
  it('toggles R district to flipped-dem', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 0, rep: 1, tossup: 0 },
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1);
    });

    expect(result.current.scenarioMap.get(1)).toBe('flipped-dem');
    expect(result.current.hasChanges).toBe(true);
    expect(result.current.flippedCount).toBe(1);
  });

  it('toggles D district to flipped-rep', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'D'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 1, rep: 0, tossup: 0 },
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1);
    });

    expect(result.current.scenarioMap.get(1)).toBe('flipped-rep');
  });

  it('cycles R district: baseline -> flipped-dem -> tossup -> baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 0, rep: 1, tossup: 0 },
        })
      )
    );

    // First toggle: baseline -> flipped-dem
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('flipped-dem');

    // Second toggle: flipped-dem -> tossup
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('tossup');

    // Third toggle: tossup -> baseline (removed from map)
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.has(1)).toBe(false);
    expect(result.current.hasChanges).toBe(false);
  });

  it('cycles D district: baseline -> flipped-rep -> tossup -> baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'D'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 1, rep: 0, tossup: 0 },
        })
      )
    );

    // First toggle: baseline -> flipped-rep
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('flipped-rep');

    // Second toggle: flipped-rep -> tossup
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('tossup');

    // Third toggle: tossup -> baseline
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.has(1)).toBe(false);
  });

  it('cycles null baseline: baseline -> tossup -> flipped-dem -> flipped-rep -> baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, null],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 0, rep: 0, tossup: 0 },
        })
      )
    );

    // First toggle: baseline -> tossup
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('tossup');

    // Second toggle: tossup -> flipped-dem
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('flipped-dem');

    // Third toggle: flipped-dem -> flipped-rep
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.get(1)).toBe('flipped-rep');

    // Fourth toggle: flipped-rep -> baseline
    act(() => {
      result.current.toggleDistrict(1);
    });
    expect(result.current.scenarioMap.has(1)).toBe(false);
  });

  it('handles multiple districts independently', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
      [2, 'D'],
      [3, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 1, rep: 2, tossup: 0 },
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1); // R -> flipped-dem
      result.current.toggleDistrict(2); // D -> flipped-rep
    });

    expect(result.current.scenarioMap.get(1)).toBe('flipped-dem');
    expect(result.current.scenarioMap.get(2)).toBe('flipped-rep');
    expect(result.current.scenarioMap.has(3)).toBe(false);
    expect(result.current.flippedCount).toBe(2);
  });
});

// =============================================================================
// setDistrictStatus Tests
// =============================================================================

describe('useScenario - setDistrictStatus', () => {
  it('sets specific status for a district', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(3, 'flipped-dem');
    });

    expect(result.current.scenarioMap.get(3)).toBe('flipped-dem');
  });

  it('setting baseline removes district from map', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(3, 'flipped-dem');
    });
    expect(result.current.scenarioMap.has(3)).toBe(true);

    act(() => {
      result.current.setDistrictStatus(3, 'baseline');
    });
    expect(result.current.scenarioMap.has(3)).toBe(false);
  });

  it('can set tossup status', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(1, 'tossup');
    });

    expect(result.current.scenarioMap.get(1)).toBe('tossup');
  });

  it('can overwrite existing status', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-dem');
    });
    expect(result.current.scenarioMap.get(1)).toBe('flipped-dem');

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-rep');
    });
    expect(result.current.scenarioMap.get(1)).toBe('flipped-rep');
  });
});

// =============================================================================
// resetScenario Tests
// =============================================================================

describe('useScenario - resetScenario', () => {
  it('clears all scenario changes', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    // Make some changes
    act(() => {
      result.current.toggleDistrict(1);
      result.current.toggleDistrict(2);
      result.current.toggleDistrict(3);
    });
    expect(result.current.flippedCount).toBe(3);

    // Reset
    act(() => {
      result.current.resetScenario();
    });

    expect(result.current.scenarioMap.size).toBe(0);
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.flippedCount).toBe(0);
  });

  it('restores scenario counts to baseline', () => {
    const baselineCounts: SeatCount = { dem: 24, rep: 100, tossup: 0 };
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
      [2, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts,
          districtParties,
        })
      )
    );

    // Flip some districts
    act(() => {
      result.current.toggleDistrict(1); // R -> D
      result.current.toggleDistrict(2); // R -> D
    });

    // Counts should be modified
    expect(result.current.scenarioCounts.dem).toBe(26);
    expect(result.current.scenarioCounts.rep).toBe(98);

    // Reset
    act(() => {
      result.current.resetScenario();
    });

    // Counts should return to baseline
    expect(result.current.scenarioCounts).toEqual(baselineCounts);
  });
});

// =============================================================================
// scenarioCounts Calculation Tests
// =============================================================================

describe('useScenario - scenarioCounts', () => {
  it('increments dem count when R flips to D', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 10, rep: 90, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1); // R -> flipped-dem
    });

    expect(result.current.scenarioCounts.dem).toBe(11);
    expect(result.current.scenarioCounts.rep).toBe(89);
  });

  it('increments rep count when D flips to R', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'D'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 10, rep: 90, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1); // D -> flipped-rep
    });

    expect(result.current.scenarioCounts.dem).toBe(9);
    expect(result.current.scenarioCounts.rep).toBe(91);
  });

  it('handles tossup from D baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'D'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 10, rep: 90, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1); // D -> flipped-rep
      result.current.toggleDistrict(1); // flipped-rep -> tossup
    });

    expect(result.current.scenarioCounts.dem).toBe(9);
    expect(result.current.scenarioCounts.rep).toBe(90);
    expect(result.current.scenarioCounts.tossup).toBe(1);
  });

  it('handles tossup from R baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 10, rep: 90, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(1); // R -> flipped-dem
      result.current.toggleDistrict(1); // flipped-dem -> tossup
    });

    expect(result.current.scenarioCounts.dem).toBe(10);
    expect(result.current.scenarioCounts.rep).toBe(89);
    expect(result.current.scenarioCounts.tossup).toBe(1);
  });

  it('handles flipped-dem from null baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, null],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 10, rep: 90, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-dem');
    });

    // From null baseline, adding a D just increments dem
    expect(result.current.scenarioCounts.dem).toBe(11);
    expect(result.current.scenarioCounts.rep).toBe(90);
  });

  it('handles flipped-rep from null baseline', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, null],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 10, rep: 90, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-rep');
    });

    expect(result.current.scenarioCounts.dem).toBe(10);
    expect(result.current.scenarioCounts.rep).toBe(91);
  });

  it('handles multiple simultaneous changes', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
      [2, 'R'],
      [3, 'D'],
      [4, 'D'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 20, rep: 80, tossup: 0 },
          districtParties,
        })
      )
    );

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-dem'); // R -> D: +1 D, -1 R
      result.current.setDistrictStatus(2, 'flipped-dem'); // R -> D: +1 D, -1 R
      result.current.setDistrictStatus(3, 'flipped-rep'); // D -> R: -1 D, +1 R
      result.current.setDistrictStatus(4, 'tossup'); // D -> tossup: -1 D, +1 tossup
    });

    // Expected: dem: 20 + 2 - 2 = 20, rep: 80 - 2 + 1 = 79, tossup: 1
    expect(result.current.scenarioCounts.dem).toBe(20);
    expect(result.current.scenarioCounts.rep).toBe(79);
    expect(result.current.scenarioCounts.tossup).toBe(1);
  });
});

// =============================================================================
// serializeScenario Tests
// =============================================================================

describe('useScenario - serializeScenario', () => {
  it('returns empty string for no changes', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    expect(result.current.serializeScenario()).toBe('');
  });

  it('serializes flipped-dem as d prefix', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(42, 'flipped-dem');
    });

    expect(result.current.serializeScenario()).toBe('d42');
  });

  it('serializes flipped-rep as r prefix', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(23, 'flipped-rep');
    });

    expect(result.current.serializeScenario()).toBe('r23');
  });

  it('serializes tossup as t prefix', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(15, 'tossup');
    });

    expect(result.current.serializeScenario()).toBe('t15');
  });

  it('serializes multiple changes comma-separated', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-dem');
      result.current.setDistrictStatus(2, 'flipped-rep');
      result.current.setDistrictStatus(3, 'tossup');
    });

    const serialized = result.current.serializeScenario();
    // Order may vary based on Map iteration, so check contains
    expect(serialized).toContain('d1');
    expect(serialized).toContain('r2');
    expect(serialized).toContain('t3');
    expect(serialized.split(',').length).toBe(3);
  });

  it('does not serialize baseline status', () => {
    const { result } = renderHook(() =>
      useScenario(createDefaultOptions())
    );

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-dem');
      result.current.setDistrictStatus(1, 'baseline');
    });

    expect(result.current.serializeScenario()).toBe('');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('useScenario - Edge Cases', () => {
  it('handles empty districtParties map', () => {
    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties: new Map(),
        })
      )
    );

    // Should not throw when toggling unknown district
    act(() => {
      result.current.toggleDistrict(999);
    });

    // Unknown districts treated as null baseline
    expect(result.current.scenarioMap.get(999)).toBe('tossup');
  });

  it('handles district number 0', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [0, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(0);
    });

    expect(result.current.scenarioMap.get(0)).toBe('flipped-dem');
  });

  it('handles large district numbers', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [99999, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
        })
      )
    );

    act(() => {
      result.current.toggleDistrict(99999);
    });

    expect(result.current.scenarioMap.get(99999)).toBe('flipped-dem');
    expect(result.current.serializeScenario()).toBe('d99999');
  });

  it('handles rapid toggles correctly', () => {
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          districtParties,
          baselineCounts: { dem: 0, rep: 1, tossup: 0 },
        })
      )
    );

    // Rapidly toggle the same district
    act(() => {
      result.current.toggleDistrict(1); // baseline -> flipped-dem
      result.current.toggleDistrict(1); // flipped-dem -> tossup
      result.current.toggleDistrict(1); // tossup -> baseline
    });

    // Should end up back at baseline
    expect(result.current.scenarioMap.has(1)).toBe(false);
    expect(result.current.scenarioCounts).toEqual({ dem: 0, rep: 1, tossup: 0 });
  });

  it('handles zero baseline counts', () => {
    // Use a district with R baseline so flipped-dem actually increments dem count
    const districtParties = new Map<number, 'D' | 'R' | null>([
      [1, 'R'],
    ]);

    const { result } = renderHook(() =>
      useScenario(
        createDefaultOptions({
          baselineCounts: { dem: 0, rep: 0, tossup: 0 },
          districtParties,
        })
      )
    );

    expect(result.current.scenarioCounts).toEqual({ dem: 0, rep: 0, tossup: 0 });

    act(() => {
      result.current.setDistrictStatus(1, 'flipped-dem');
    });

    // Flipping R to D should increment dem (even if baseline is 0)
    expect(result.current.scenarioCounts.dem).toBe(1);
  });

  it('maintains referential stability of callbacks across rerenders', () => {
    // Use stable options object to ensure callbacks remain stable
    const stableDistrictParties = new Map<number, 'D' | 'R' | null>([
      [1, 'D'],
      [2, 'R'],
    ]);
    const stableOptions: UseScenarioOptions = {
      chamber: 'house',
      baselineCounts: { dem: 1, rep: 1, tossup: 0 },
      districtParties: stableDistrictParties,
      syncUrl: false,
    };

    const { result, rerender } = renderHook(
      (props: UseScenarioOptions) => useScenario(props),
      { initialProps: stableOptions }
    );

    const initialToggle = result.current.toggleDistrict;
    const initialReset = result.current.resetScenario;
    const initialSetStatus = result.current.setDistrictStatus;

    // Rerender with same props reference
    rerender(stableOptions);

    expect(result.current.toggleDistrict).toBe(initialToggle);
    expect(result.current.resetScenario).toBe(initialReset);
    expect(result.current.setDistrictStatus).toBe(initialSetStatus);
  });
});
