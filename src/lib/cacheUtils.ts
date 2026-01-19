/**
 * Cache Utilities for Voter Guide
 *
 * Provides persistent caching across sessions:
 * - IndexedDB for large data (GeoJSON boundaries ~2MB)
 * - localStorage for smaller JSON data (~100KB)
 * - Version-based cache invalidation
 */

import type { FeatureCollection } from 'geojson';

// Increment this to invalidate all caches (e.g., after data format changes)
export const CACHE_VERSION = '1.0.0';

// IndexedDB configuration
const DB_NAME = 'voter-guide-cache';
const DB_VERSION = 1;
const GEOJSON_STORE = 'geojson';
const META_STORE = 'meta';

// localStorage key prefix
const LS_PREFIX = 'vg-cache-';

// Debug mode
const DEBUG = typeof window !== 'undefined' && localStorage?.getItem('voter-guide-debug') === 'true';

function log(message: string, data?: unknown) {
  if (DEBUG) console.log(`[CacheUtils] ${message}`, data || '');
}

// ============================================================================
// IndexedDB Helpers (for GeoJSON - large data)
// ============================================================================

/**
 * Open IndexedDB database, creating stores if needed
 */
async function openGeoJsonCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(GEOJSON_STORE)) {
        db.createObjectStore(GEOJSON_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Retrieve cached GeoJSON from IndexedDB
 */
export async function getGeoJsonFromCache(key: string): Promise<FeatureCollection | null> {
  try {
    const db = await openGeoJsonCache();
    return new Promise((resolve) => {
      const tx = db.transaction(GEOJSON_STORE, 'readonly');
      const store = tx.objectStore(GEOJSON_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result?.data) {
          log(`IndexedDB cache hit: ${key}`);
          resolve(result.data as FeatureCollection);
        } else {
          log(`IndexedDB cache miss: ${key}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        log(`IndexedDB read error: ${key}`, request.error);
        resolve(null);
      };

      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    log('IndexedDB open error', error);
    return null;
  }
}

/**
 * Store GeoJSON in IndexedDB
 */
export async function setGeoJsonInCache(key: string, data: FeatureCollection): Promise<void> {
  try {
    const db = await openGeoJsonCache();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(GEOJSON_STORE, 'readwrite');
      const store = tx.objectStore(GEOJSON_STORE);
      const request = store.put({ key, data, version: CACHE_VERSION });

      request.onsuccess = () => {
        log(`IndexedDB cache set: ${key}`);
        resolve();
      };

      request.onerror = () => {
        log(`IndexedDB write error: ${key}`, request.error);
        reject(request.error);
      };

      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    log('IndexedDB store error', error);
    // Don't throw - caching failure shouldn't break the app
  }
}

/**
 * Clear all GeoJSON from IndexedDB
 */
export async function clearGeoJsonCache(): Promise<void> {
  try {
    const db = await openGeoJsonCache();
    return new Promise((resolve) => {
      const tx = db.transaction(GEOJSON_STORE, 'readwrite');
      const store = tx.objectStore(GEOJSON_STORE);
      store.clear();
      tx.oncomplete = () => {
        log('IndexedDB cache cleared');
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore errors during clear
  }
}

// ============================================================================
// localStorage Helpers (for JSON data - smaller data)
// ============================================================================

interface CachedJsonData<T> {
  version: string;
  data: T;
  timestamp: number;
}

/**
 * Retrieve cached JSON from localStorage
 */
export function getJsonFromCache<T>(key: string): T | null {
  // SSR safety
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(`${LS_PREFIX}${key}`);
    if (!stored) {
      log(`localStorage cache miss: ${key}`);
      return null;
    }

    const parsed: CachedJsonData<T> = JSON.parse(stored);

    // Check version
    if (parsed.version !== CACHE_VERSION) {
      log(`localStorage cache version mismatch: ${key} (${parsed.version} vs ${CACHE_VERSION})`);
      localStorage.removeItem(`${LS_PREFIX}${key}`);
      return null;
    }

    log(`localStorage cache hit: ${key}`);
    return parsed.data;
  } catch (error) {
    log(`localStorage read error: ${key}`, error);
    return null;
  }
}

/**
 * Store JSON in localStorage
 */
export function setJsonInCache(key: string, data: unknown): void {
  // SSR safety
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cacheData: CachedJsonData<unknown> = {
      version: CACHE_VERSION,
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${LS_PREFIX}${key}`, JSON.stringify(cacheData));
    log(`localStorage cache set: ${key}`);
  } catch (error) {
    // localStorage might be full or disabled in private browsing
    log(`localStorage write error: ${key}`, error);
  }
}

/**
 * Remove a specific key from localStorage cache
 */
export function removeJsonFromCache(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(`${LS_PREFIX}${key}`);
    log(`localStorage cache removed: ${key}`);
  } catch {
    // Ignore errors
  }
}

/**
 * Clear all localStorage cache entries (keys starting with vg-cache-)
 */
export function clearJsonCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(LS_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    log(`localStorage cache cleared: ${keysToRemove.length} entries`);
  } catch {
    // Ignore errors
  }
}

// ============================================================================
// Version Management
// ============================================================================

const VERSION_KEY = 'vg-cache-version';

/**
 * Check cache version and clear if mismatched
 * Call this on app initialization to ensure stale caches are cleared
 */
export async function checkCacheVersion(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);

    if (storedVersion !== CACHE_VERSION) {
      log(`Cache version mismatch: ${storedVersion} -> ${CACHE_VERSION}`);
      await clearAllCaches();
      localStorage.setItem(VERSION_KEY, CACHE_VERSION);
    } else {
      log(`Cache version OK: ${CACHE_VERSION}`);
    }
  } catch (error) {
    log('Version check error', error);
  }
}

/**
 * Clear all caches (both IndexedDB and localStorage)
 */
export async function clearAllCaches(): Promise<void> {
  log('Clearing all caches...');
  clearJsonCache();
  await clearGeoJsonCache();
  log('All caches cleared');
}
