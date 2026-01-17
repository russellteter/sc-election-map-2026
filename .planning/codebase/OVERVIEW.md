# Codebase Map Overview

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System
**Method:** 4 parallel Explore agents with SC Voter Guide focus

## Purpose

This codebase map provides structured context for the SC Voter Guide GSD project, focusing on:
1. **Data improvements** - Real data aggregation, better data sources, complete coverage
2. **Design improvements** - UI/UX sophistication and enhancements

## Documents

| Document | Purpose | Key Insights |
|----------|---------|--------------|
| [STACK.md](./STACK.md) | Technology foundation | Next.js 16, React 19, Turf.js, Geoapify |
| [INTEGRATIONS.md](./INTEGRATIONS.md) | External service dependencies | Geoapify API, Nominatim fallback, static JSON |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Conceptual code organization | Progressive loading, address→district→ballot flow |
| [STRUCTURE.md](./STRUCTURE.md) | Physical file organization | src/app, src/components/VoterGuide, src/lib |
| [CONVENTIONS.md](./CONVENTIONS.md) | Coding style and patterns | TypeScript strict, 'use client', Testing Library |
| [TESTING.md](./TESTING.md) | Test framework and patterns | Jest 30, Playwright, Testing Library |
| [CONCERNS.md](./CONCERNS.md) | Known issues and risks | Empty county data, missing DemoBadge, large page component |

## Key Files (SC Voter Guide)

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/voter-guide/page.tsx` | 666 | Main voter guide orchestrator |
| `src/components/VoterGuide/AddressAutocomplete.tsx` | 458 | Geoapify address input |
| `src/lib/districtLookup.ts` | 175 | Turf.js point-in-polygon |
| `src/lib/geocoding.ts` | 265 | Nominatim + validation |
| `src/lib/congressionalLookup.ts` | 236 | County→CD mapping |
| `src/lib/dataLoader.ts` | 143 | Progressive 3-tier loading |
| `src/types/schema.ts` | 730 | All TypeScript types |

## Critical Data Flow

```
User enters address
       ↓
Geoapify API (or Nominatim fallback)
       ↓
Coordinates (lat, lon)
       ↓
Turf.js point-in-polygon (districtLookup.ts)
       ↓
District IDs (HD-X, SD-Y)
       ↓
County lookup (congressionalLookup.ts)
       ↓
Congressional District + County
       ↓
Data loading (dataLoader.ts)
       ↓
Personalized ballot display
```

## Priority Concerns for GSD Project

### Data Quality Issues
1. **Empty county candidates** - `public/data/county-races.json` has empty arrays
2. **Missing data files** - judicial, school board, ballot measures files not found
3. **No DemoBadge** - Voter guide doesn't mark demo data

### Technical Debt
1. **Large page component** - 666 lines in voter-guide/page.tsx
2. **Hardcoded URLs** - County election office links embedded in code
3. **No persistent cache** - Data re-fetched every visit

### Test Coverage Gaps
1. Voter guide page untested
2. District lookup edge cases untested
3. Geocoding fallback flow untested

## Recommended GSD Project Phases

Based on codebase analysis, suggested focus areas:

**Phase 1: Data Foundation**
- Populate county-races.json with real/demo data
- Create missing data files (judicial, school board)
- Add DemoBadge to voter guide components

**Phase 2: Component Refactoring**
- Break up voter-guide/page.tsx into smaller components
- Extract county contact URLs to data file
- Add comprehensive test coverage

**Phase 3: UX Enhancements**
- Add "Use My Location" button
- Implement address persistence (localStorage)
- Improve error messaging for failed lookups

**Phase 4: Data Quality**
- Scrape real candidate data from SC Ethics Commission
- Integrate Google Civic API for polling places
- Add real judicial retention candidates

---

*Generated: 2026-01-17*
*Focus: SC Voter Guide System*
*Method: GSD codebase mapping with 4 parallel Explore agents*
