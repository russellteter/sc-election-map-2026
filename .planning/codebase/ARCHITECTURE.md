# Architecture

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## Pattern Overview

**Overall:** Static Site Generator with Progressive Data Loading

**Key Characteristics:**
- Static export to HTML/JS/CSS (no server runtime)
- Client-side data fetching with progressive loading tiers
- Address-to-ballot flow (geocode → district lookup → candidate display)
- Glassmorphic UI design system

## Layers

**Presentation Layer:**
- Purpose: React components for UI rendering
- Contains: Page components, reusable UI components, voter guide sections
- Location: `src/app/` (pages), `src/components/` (shared)
- Depends on: Data layer for candidates/districts, lib utilities
- Used by: Next.js App Router

**Data Loading Layer:**
- Purpose: Progressive data fetching with caching
- Contains: Tier-based loaders, cache deduplication, JSON fetchers
- Location: `src/lib/dataLoader.ts`
- Depends on: Static JSON files in `public/data/`
- Used by: Page components, Voter Guide components

**Geospatial Layer:**
- Purpose: Address geocoding and district detection
- Contains: Geoapify integration, Nominatim fallback, Turf.js point-in-polygon
- Location: `src/lib/geocoding.ts`, `src/lib/districtLookup.ts`, `src/lib/congressionalLookup.ts`
- Depends on: External APIs (Geoapify, Nominatim), GeoJSON boundaries
- Used by: Voter Guide address flow

**Type Layer:**
- Purpose: TypeScript type definitions
- Contains: Candidate, District, Race, VoterGuide interfaces
- Location: `src/types/schema.ts`
- Depends on: Nothing (pure types)
- Used by: All other layers

## Data Flow

**Voter Guide Flow (Core User Journey):**

1. User enters address in `AddressAutocomplete.tsx`
2. Geoapify API returns coordinate suggestions (debounced 300ms)
3. User selects address → coordinates extracted
4. `districtLookup.ts` performs point-in-polygon with Turf.js
5. County determined → `congressionalLookup.ts` maps to Congressional District
6. `dataLoader.ts` fetches relevant candidate/race data
7. Voter Guide page renders personalized ballot

```
┌─────────────────┐
│ Address Input   │ AddressAutocomplete.tsx
└────────┬────────┘
         │ coordinates
         ▼
┌─────────────────┐
│ District Lookup │ districtLookup.ts (Turf.js)
└────────┬────────┘
         │ house/senate district IDs
         ▼
┌─────────────────┐
│ County Lookup   │ congressionalLookup.ts
└────────┬────────┘
         │ county + congressional district
         ▼
┌─────────────────┐
│ Data Loading    │ dataLoader.ts
└────────┬────────┘
         │ candidates, races
         ▼
┌─────────────────┐
│ Ballot Display  │ voter-guide/page.tsx
└─────────────────┘
```

**Progressive Data Loading:**

```
Tier 1 (6.5KB) - Immediate
├── State config
├── Critical UI data
└── Navigation structure

Tier 2 (95KB) - On-Demand
├── Candidate data
├── District information
└── Race details

Tier 3 (30KB) - Deferred
├── Endorsements
├── Historical data
└── Secondary intelligence
```

**State Management:**
- No global state management library (no Redux, Zustand)
- React useState/useEffect for component state
- Singleton cache in `dataLoader.ts` for data deduplication
- URL-based state via Next.js dynamic routes

## Key Abstractions

**DataLoader (Singleton):**
- Purpose: Cache-deduplicated data fetching
- Location: `src/lib/dataLoader.ts`
- Pattern: Singleton with Promise caching
- Methods: `loadTier1()`, `loadTier2(districts)`, `loadOnScroll(component)`

**DistrictLookup:**
- Purpose: Coordinate-to-district mapping
- Location: `src/lib/districtLookup.ts`
- Pattern: Lazy-loaded GeoJSON with Turf.js processing
- Methods: `findDistricts(lat, lon)`, `preloadBoundaries()`

**AddressAutocomplete:**
- Purpose: Geoapify-powered address input
- Location: `src/components/VoterGuide/AddressAutocomplete.tsx`
- Pattern: Controlled component with debounced API calls
- Features: SC bounding box, keyboard navigation, ARIA accessibility

**Schema Types:**
- Purpose: TypeScript interfaces for all data structures
- Location: `src/types/schema.ts` (730 lines)
- Types: `Candidate`, `District`, `StatewideRace`, `CountyRace`, `JudicialRaces`, `SchoolBoard`, `BallotMeasures`, etc.

## Entry Points

**National Landing:**
- Location: `src/app/page.tsx`
- Triggers: Root URL access
- Responsibilities: US map display, state selection routing

**State Pages:**
- Location: `src/app/[state]/page.tsx`
- Triggers: `/sc/`, `/nc/`, `/ga/`, `/fl/`, `/va/` routes
- Responsibilities: State-specific district map, navigation

**Voter Guide:**
- Location: `src/app/voter-guide/page.tsx` (666 lines)
- Triggers: `/voter-guide` route
- Responsibilities: Address input, district detection, full ballot display

## Error Handling

**Strategy:** Try/catch with graceful degradation and fallbacks

**Patterns:**
- Geoapify failure → Nominatim fallback (`src/lib/geocoding.ts`)
- Network errors → Cached data or loading states
- Missing data → "No candidates found" UI messages
- Invalid coordinates → SC bounds validation

**Error Boundaries:**
- Not explicitly implemented
- Relies on React default error handling

## Cross-Cutting Concerns

**Logging:**
- Console.log for development debugging
- No production logging infrastructure

**Validation:**
- SC bounding box validation for coordinates
- TypeScript compile-time type checking
- No runtime schema validation (Zod not used)

**Performance:**
- Progressive data loading (3 tiers)
- Lazy-loaded GeoJSON boundaries (~2MB)
- Debounced API calls (300ms)
- Performance budgets in webpack config

**Accessibility:**
- ARIA attributes in AddressAutocomplete
- Keyboard navigation support
- Focus management in interactive components

---

*Architecture analysis: 2026-01-17*
*Update when major patterns change*
