# Summary Template for Phase 09

Use this frontmatter structure:

```yaml
---
phase: 09-performance-optimization
plan: 01
subsystem: infrastructure
tags: [caching, indexeddb, localstorage, performance]

# Dependency graph
requires:
  - phase: 08-test-coverage
    provides: comprehensive test foundation
provides:
  - IndexedDB caching for GeoJSON boundaries
  - localStorage caching for JSON data with version tracking
affects: [voter-guide, data-loading, district-lookup]

# Tech tracking
tech-stack:
  added: []
  patterns: [IndexedDB for large data, localStorage with version invalidation]

key-files:
  created:
    - src/lib/cacheUtils.ts
    - __tests__/lib/cacheUtils.test.ts
  modified:
    - src/lib/districtLookup.ts
    - src/lib/dataLoader.ts

key-decisions:
  - "[Decision about cache invalidation strategy]"
  - "[Decision about what data to persist vs not]"

patterns-established:
  - "[New patterns for future reference]"

issues-created: []

# Metrics
duration: Xmin
completed: YYYY-MM-DD
---
```
