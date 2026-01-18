/**
 * Unit tests for district lookup module.
 * Tests findDistricts and preloadBoundaries with mocked GeoJSON data.
 */

import type { FeatureCollection, Polygon } from 'geojson';

// Mock GeoJSON data for Columbia, SC area
// House District 75: covering area around 34.0, -81.0
const mockHouseDistricts: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { SLDLST: '075' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-81.1, 33.9],
          [-81.0, 33.9],
          [-81.0, 34.1],
          [-81.1, 34.1],
          [-81.1, 33.9],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { SLDLST: '012' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-80.9, 33.9],
          [-80.8, 33.9],
          [-80.8, 34.1],
          [-80.9, 34.1],
          [-80.9, 33.9],
        ]],
      },
    },
  ],
};

// Senate District 22: same area coverage
const mockSenateDistricts: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { SLDUST: '022' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-81.1, 33.9],
          [-81.0, 33.9],
          [-81.0, 34.1],
          [-81.1, 34.1],
          [-81.1, 33.9],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: { SLDUST: '005' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-80.9, 33.9],
          [-80.8, 33.9],
          [-80.8, 34.1],
          [-80.9, 34.1],
          [-80.9, 33.9],
        ]],
      },
    },
  ],
};

// Store original fetch
const originalFetch = global.fetch;

// Helper to create mock fetch that returns our test data
function createSuccessfulFetchMock() {
  return jest.fn((url: string) => {
    if (url.includes('sc-house-districts.geojson')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockHouseDistricts),
      });
    }
    if (url.includes('sc-senate-districts.geojson')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSenateDistricts),
      });
    }
    return Promise.reject(new Error('Unknown URL'));
  }) as jest.Mock;
}

// Helper to create failing fetch mock
function createFailingFetchMock() {
  return jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;
}

describe('districtLookup', () => {
  // We need to reset modules between tests to clear the module's cached state
  let findDistricts: typeof import('@/lib/districtLookup').findDistricts;
  let preloadBoundaries: typeof import('@/lib/districtLookup').preloadBoundaries;

  beforeEach(() => {
    // Reset modules to clear cached district data
    jest.resetModules();
    // Reset fetch mock
    global.fetch = createSuccessfulFetchMock();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  describe('findDistricts', () => {
    beforeEach(async () => {
      // Re-import after module reset to get fresh state
      const module = await import('@/lib/districtLookup');
      findDistricts = module.findDistricts;
      preloadBoundaries = module.preloadBoundaries;
    });

    it('should find both house and senate districts for valid coordinates', async () => {
      // Coordinates inside both mock district polygons (Columbia, SC area)
      const result = await findDistricts(34.0, -81.05);

      expect(result.success).toBe(true);
      expect(result.houseDistrict).toBe(75);
      expect(result.senateDistrict).toBe(22);
      expect(result.error).toBeUndefined();
    });

    it('should return correct district numbers parsed from SLDLST/SLDUST properties', async () => {
      // Test that leading zeros are parsed correctly: "075" -> 75, "022" -> 22
      const result = await findDistricts(34.0, -81.05);

      expect(result.houseDistrict).toBe(75); // Parsed from "075"
      expect(result.senateDistrict).toBe(22); // Parsed from "022"
    });

    it('should return null districts for coordinates outside all boundaries', async () => {
      // Coordinates far outside any mock district (middle of Atlantic Ocean)
      const result = await findDistricts(35.0, -70.0);

      expect(result.success).toBe(false);
      expect(result.houseDistrict).toBeNull();
      expect(result.senateDistrict).toBeNull();
      expect(result.error).toContain('Could not determine your districts');
    });

    it('should return success: false when no districts found', async () => {
      // Coordinates outside all mock polygons
      const result = await findDistricts(40.0, -75.0);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('outside South Carolina legislative boundaries');
    });

    it('should handle fetch failure gracefully', async () => {
      // Set up failing fetch
      global.fetch = createFailingFetchMock();

      // Re-import to get fresh module with new fetch mock
      jest.resetModules();
      const module = await import('@/lib/districtLookup');
      const findDistrictsWithFailure = module.findDistricts;

      const result = await findDistrictsWithFailure(34.0, -81.05);

      expect(result.success).toBe(false);
      expect(result.houseDistrict).toBeNull();
      expect(result.senateDistrict).toBeNull();
      expect(result.error).toContain('Unable to load district boundaries');
    });

    it('should cache boundaries after first load', async () => {
      // First lookup
      await findDistricts(34.0, -81.05);
      const fetchCallCount = (global.fetch as jest.Mock).mock.calls.length;

      // Second lookup should use cached data
      await findDistricts(34.0, -80.85);

      // Fetch should not be called again (2 calls initially: house + senate)
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallCount);
    });

    it('should handle concurrent requests with single fetch', async () => {
      // Start multiple concurrent requests
      const promises = [
        findDistricts(34.0, -81.05),
        findDistricts(34.0, -80.85),
        findDistricts(33.95, -81.05),
      ];

      await Promise.all(promises);

      // Should only have 2 fetch calls (house + senate) despite 3 concurrent lookups
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    });
  });

  describe('preloadBoundaries', () => {
    beforeEach(async () => {
      // Re-import after module reset to get fresh state
      const module = await import('@/lib/districtLookup');
      findDistricts = module.findDistricts;
      preloadBoundaries = module.preloadBoundaries;
    });

    it('should return true on successful preload', async () => {
      const result = await preloadBoundaries();

      expect(result).toBe(true);
      // Verify fetch was called for both district files
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(2);
    });

    it('should return false on failed preload', async () => {
      // Set up failing fetch
      global.fetch = createFailingFetchMock();

      // Re-import to get fresh module with new fetch mock
      jest.resetModules();
      const module = await import('@/lib/districtLookup');
      const preloadBoundariesWithFailure = module.preloadBoundaries;

      const result = await preloadBoundariesWithFailure();

      expect(result).toBe(false);
    });

    it('should not refetch if already loaded', async () => {
      // First preload
      await preloadBoundaries();
      const fetchCallCount = (global.fetch as jest.Mock).mock.calls.length;

      // Second preload should use cached data
      await preloadBoundaries();

      // Fetch should not be called again
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(fetchCallCount);
    });
  });
});
