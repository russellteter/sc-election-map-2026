---
phase: 09-performance-optimization
plan: 01
subsystem: infra
tags: [indexeddb, localstorage, caching, performance]

# Dependency graph
requires:
  - phase: 06-address-ux-improvements
    provides: localStorage patterns for SSR-safe storage
provides:
  - IndexedDB caching for GeoJSON boundaries (~2MB)
  - localStorage caching for JSON data files (~100KB)
  - Version-based cache invalidation system
  - Cross-session data persistence
affects: [voter-guide, district-lookup, data-loading]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - IndexedDB for large data (GeoJSON boundaries)
    - localStorage for smaller JSON data (Tier 2/3)
    - Version-based cache invalidation (CACHE_VERSION constant)
    - SSR-safe storage with window checks and try/catch

key-files:
  created:
    - src/lib/cacheUtils.ts
    - __tests__/lib/cacheUtils.test.ts
  modified:
    - src/lib/districtLookup.ts
    - src/lib/dataLoader.ts

key-decisions:
  - "IndexedDB for GeoJSON (large data, fast retrieval)"
  - "localStorage for JSON (smaller data, simpler API)"
  - "Tier 1 data in-memory only (changes frequently)"
  - "Tier 2/3 data persisted (larger, static data)"
  - "Async caching after network fetch (non-blocking)"

patterns-established:
  - "Version-based cache invalidation via CACHE_VERSION constant"
  - "Cache hierarchy: in-memory → persistent storage → network"
  - "Graceful degradation when storage unavailable"

issues-created: []

# Metrics
duration: 4 min
completed: 2026-01-18
---

# Phase 9 Plan 01: Persistent Caching Summary

**IndexedDB caching for ~2MB GeoJSON boundaries, localStorage caching for ~100KB JSON data files, with version-based invalidation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-18T01:09:11Z
- **Completed:** 2026-01-18T01:13:19Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created cacheUtils.ts module with IndexedDB and localStorage helpers
- Added IndexedDB persistence for GeoJSON district boundaries (~2MB cached)
- Added localStorage persistence for Tier 2/3 JSON data (~100KB cached)
- Implemented version-based cache invalidation system
- Added 26 comprehensive tests for cache utilities

## Task Commits

Each task was committed atomically:

1. **Task 1: Create cache utilities with version tracking** - `36d2b5c` (feat)
2. **Task 2: Add IndexedDB persistence to districtLookup** - `c800657` (perf)
3. **Task 3: Add localStorage persistence to dataLoader** - `bd2df17` (perf)

## Files Created/Modified

- `src/lib/cacheUtils.ts` - New module with IndexedDB/localStorage helpers and version management
- `__tests__/lib/cacheUtils.test.ts` - 26 tests for cache utilities
- `src/lib/districtLookup.ts` - Added IndexedDB caching for GeoJSON boundaries
- `src/lib/dataLoader.ts` - Added localStorage caching for Tier 2/3 JSON data

## Decisions Made

1. **IndexedDB for GeoJSON** - GeoJSON boundaries are ~2MB, too large for localStorage (5MB limit). IndexedDB provides fast, structured storage for this data.

2. **localStorage for JSON data** - Tier 2/3 JSON files are ~100KB total, well within localStorage limits and simpler to work with.

3. **Tier 1 stays in-memory** - Election dates and statewide races change more frequently and are small (~6.5KB). Not worth persistence complexity.

4. **Async caching after network** - Caching to IndexedDB/localStorage happens asynchronously after network fetch completes. This keeps the critical path fast.

5. **Version-based invalidation** - Single CACHE_VERSION constant controls all cache validity. Increment to clear all caches after data format changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Cache Performance Expectations

| Data Type | Size | Storage | First Visit | Repeat Visit |
|-----------|------|---------|-------------|--------------|
| GeoJSON Boundaries | ~2MB | IndexedDB | Network fetch | Instant (cached) |
| Tier 1 (critical) | ~6.5KB | Memory only | Network fetch | Network fetch |
| Tier 2 (on-demand) | ~95KB | localStorage | Network fetch | Instant (cached) |
| Tier 3 (deferred) | ~30KB | localStorage | Network fetch | Instant (cached) |

**Total cacheable data:** ~2.1MB (GeoJSON) + ~125KB (JSON)
**Repeat visit savings:** Eliminates ~2.2MB of network requests

## Next Phase Readiness

- Caching infrastructure complete
- Ready for Phase 10: Real Data Integration
- No blockers or concerns

---
*Phase: 09-performance-optimization*
*Completed: 2026-01-18*
