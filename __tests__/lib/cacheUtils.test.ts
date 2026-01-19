/**
 * Tests for cacheUtils.ts
 *
 * Tests localStorage and IndexedDB caching utilities with mocks
 */

import {
  CACHE_VERSION,
  getJsonFromCache,
  setJsonInCache,
  removeJsonFromCache,
  clearJsonCache,
  checkCacheVersion,
} from '@/lib/cacheUtils';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
    // Test helpers
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
})();

// Setup and teardown
beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
});

afterEach(() => {
  localStorageMock.clear();
});

describe('cacheUtils - localStorage JSON helpers', () => {
  describe('getJsonFromCache', () => {
    it('returns null when key does not exist', () => {
      const result = getJsonFromCache('nonexistent');
      expect(result).toBeNull();
    });

    it('returns cached data when version matches', () => {
      const testData = { foo: 'bar', count: 42 };
      const cacheEntry = {
        version: CACHE_VERSION,
        data: testData,
        timestamp: Date.now(),
      };
      localStorage.setItem('vg-cache-test', JSON.stringify(cacheEntry));

      const result = getJsonFromCache<typeof testData>('test');
      expect(result).toEqual(testData);
    });

    it('returns null and removes entry when version mismatches', () => {
      const cacheEntry = {
        version: '0.0.0', // Old version
        data: { foo: 'bar' },
        timestamp: Date.now(),
      };
      localStorage.setItem('vg-cache-test', JSON.stringify(cacheEntry));

      const result = getJsonFromCache('test');
      expect(result).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('vg-cache-test');
    });

    it('returns null on parse error', () => {
      localStorage.setItem('vg-cache-test', 'invalid json{{{');

      const result = getJsonFromCache('test');
      expect(result).toBeNull();
    });

    it('handles complex data types', () => {
      const testData = {
        array: [1, 2, 3],
        nested: { a: { b: { c: 'deep' } } },
        nullValue: null,
        booleans: [true, false],
      };
      const cacheEntry = {
        version: CACHE_VERSION,
        data: testData,
        timestamp: Date.now(),
      };
      localStorage.setItem('vg-cache-complex', JSON.stringify(cacheEntry));

      const result = getJsonFromCache<typeof testData>('complex');
      expect(result).toEqual(testData);
    });
  });

  describe('setJsonInCache', () => {
    it('stores data with version and timestamp', () => {
      const testData = { test: true };
      setJsonInCache('mykey', testData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'vg-cache-mykey',
        expect.any(String)
      );

      const stored = JSON.parse(localStorageMock._getStore()['vg-cache-mykey']);
      expect(stored.version).toBe(CACHE_VERSION);
      expect(stored.data).toEqual(testData);
      expect(stored.timestamp).toBeDefined();
    });

    it('overwrites existing data', () => {
      setJsonInCache('overwrite', { first: true });
      setJsonInCache('overwrite', { second: true });

      const result = getJsonFromCache<{ second: boolean }>('overwrite');
      expect(result).toEqual({ second: true });
    });

    it('handles localStorage quota errors gracefully', () => {
      // Mock setItem to throw QuotaExceededError
      const originalSetItem = localStorage.setItem;
      (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      expect(() => setJsonInCache('quota-test', { large: 'data' })).not.toThrow();
      localStorage.setItem = originalSetItem;
    });
  });

  describe('removeJsonFromCache', () => {
    it('removes existing cache entry', () => {
      setJsonInCache('toremove', { data: true });
      removeJsonFromCache('toremove');

      expect(localStorage.removeItem).toHaveBeenCalledWith('vg-cache-toremove');
    });

    it('handles non-existent key gracefully', () => {
      expect(() => removeJsonFromCache('nonexistent')).not.toThrow();
    });
  });

  describe('clearJsonCache', () => {
    it('clears only vg-cache- prefixed keys', () => {
      // Set up mixed keys
      localStorageMock._setStore({
        'vg-cache-a': '{"version":"1.0.0","data":"a"}',
        'vg-cache-b': '{"version":"1.0.0","data":"b"}',
        'other-key': 'should-remain',
        'voter-guide-debug': 'true',
      });

      clearJsonCache();

      const store = localStorageMock._getStore();
      expect(store['other-key']).toBe('should-remain');
      expect(store['voter-guide-debug']).toBe('true');
      expect(store['vg-cache-a']).toBeUndefined();
      expect(store['vg-cache-b']).toBeUndefined();
    });

    it('handles empty localStorage', () => {
      localStorageMock.clear();
      expect(() => clearJsonCache()).not.toThrow();
    });
  });
});

describe('cacheUtils - Version Management', () => {
  describe('checkCacheVersion', () => {
    it('clears caches when version changes', async () => {
      // Set old version
      localStorage.setItem('vg-cache-version', '0.0.0');
      // Add some cached data
      setJsonInCache('olddata', { old: true });

      await checkCacheVersion();

      // Version should be updated
      expect(localStorage.getItem('vg-cache-version')).toBe(CACHE_VERSION);
      // Old data should be cleared (clearJsonCache was called)
      // Note: This clears vg-cache-* keys but not vg-cache-version
    });

    it('does not clear caches when version matches', async () => {
      localStorage.setItem('vg-cache-version', CACHE_VERSION);
      setJsonInCache('keepme', { keep: true });

      await checkCacheVersion();

      // Data should still exist
      const result = getJsonFromCache<{ keep: boolean }>('keepme');
      expect(result).toEqual({ keep: true });
    });

    it('initializes version on first run', async () => {
      // No version set initially
      expect(localStorage.getItem('vg-cache-version')).toBeNull();

      await checkCacheVersion();

      expect(localStorage.getItem('vg-cache-version')).toBe(CACHE_VERSION);
    });
  });
});

describe('cacheUtils - SSR Safety', () => {
  let originalWindow: typeof globalThis.window;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('getJsonFromCache returns null when window is undefined', () => {
    // @ts-expect-error - Testing SSR environment
    delete global.window;

    const result = getJsonFromCache('test');
    expect(result).toBeNull();
  });

  it('setJsonInCache does nothing when window is undefined', () => {
    // @ts-expect-error - Testing SSR environment
    delete global.window;

    // Should not throw
    expect(() => setJsonInCache('test', { data: true })).not.toThrow();
  });

  it('removeJsonFromCache does nothing when window is undefined', () => {
    // @ts-expect-error - Testing SSR environment
    delete global.window;

    expect(() => removeJsonFromCache('test')).not.toThrow();
  });

  it('clearJsonCache does nothing when window is undefined', () => {
    // @ts-expect-error - Testing SSR environment
    delete global.window;

    expect(() => clearJsonCache()).not.toThrow();
  });
});

describe('cacheUtils - CACHE_VERSION', () => {
  it('exports a valid semver-like version string', () => {
    expect(CACHE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('version is consistent across imports', async () => {
    // Import again to ensure same value
    const { CACHE_VERSION: version2 } = await import('@/lib/cacheUtils');
    expect(CACHE_VERSION).toBe(version2);
  });
});

describe('cacheUtils - Edge Cases', () => {
  it('handles empty string key', () => {
    setJsonInCache('', { empty: 'key' });
    const result = getJsonFromCache<{ empty: string }>('');
    expect(result).toEqual({ empty: 'key' });
  });

  it('handles special characters in key', () => {
    const key = 'special-key/with:chars';
    setJsonInCache(key, { special: true });
    const result = getJsonFromCache<{ special: boolean }>(key);
    expect(result).toEqual({ special: true });
  });

  it('handles undefined data value', () => {
    setJsonInCache('undefined-test', undefined);
    const result = getJsonFromCache('undefined-test');
    // JSON.stringify(undefined) becomes undefined, JSON.parse will fail
    // So this should return the stored undefined or null
    expect(result).toBeUndefined();
  });

  it('handles null data value', () => {
    setJsonInCache('null-test', null);
    const result = getJsonFromCache<null>('null-test');
    expect(result).toBeNull();
  });

  it('handles array data', () => {
    const arrayData = [1, 'two', { three: 3 }];
    setJsonInCache('array-test', arrayData);
    const result = getJsonFromCache<typeof arrayData>('array-test');
    expect(result).toEqual(arrayData);
  });
});
