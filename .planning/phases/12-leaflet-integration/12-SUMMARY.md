---
phase: 12-leaflet-integration
plan: combined
subsystem: maps
tags: [leaflet, react-leaflet, geojson, dynamic-imports]

requires:
  - Phase 11 Foundation (AnimatedMapContainer, CSS zoom tokens)
provides:
  - LeafletMap component with CartoDB Positron tiles
  - DistrictGeoJSONLayer for styled overlays
  - HybridMapContainer (SVG default, Leaflet on interaction)
  - useLeafletMap and useGeoJSONLoader hooks
  - Congressional district GeoJSON
  - Centralized district color utilities
affects: [maps, voter-guide, navigation]

tech-stack:
  added: [leaflet, react-leaflet, @types/leaflet]
  patterns: [dynamic imports, lazy loading, hybrid SVG/Leaflet]

key-files:
  created:
    - src/lib/leafletLoader.ts
    - src/lib/districtColors.ts
    - src/components/Map/LeafletMap.tsx
    - src/components/Map/DistrictGeoJSONLayer.tsx
    - src/components/Map/HybridMapContainer.tsx
    - src/hooks/useLeafletMap.ts
    - src/hooks/useGeoJSONLoader.ts
    - public/data/sc-congressional-districts.geojson
  modified:
    - package.json
    - src/app/globals.css
    - src/lib/districtLookup.ts

key-decisions:
  - Leaflet over MapLibre (18KB vs 55KB bundle)
  - CartoDB Positron tiles (minimal, glassmorphic aesthetic)
  - Dynamic imports for zero initial bundle impact
  - Hybrid approach: fast SVG default, rich Leaflet on demand
patterns-established:
  - leafletLoader.ts for dependency-injected Leaflet imports
  - useGeoJSONLoader for lazy GeoJSON fetching with caching
  - Chamber-specific GeoJSON paths (/data/{state}-{chamber}-districts.geojson)
issues-created: []
---

# Phase 12: Leaflet Integration Summary

**Added real pan/zoom mapping with CartoDB Positron tiles while maintaining zero initial bundle impact.**

Commit: 983bdcf

## Accomplishments

### 12-01: Leaflet Dependencies
- Added leaflet, react-leaflet, @types/leaflet to package.json
- Created leafletLoader.ts with dynamic imports for SSR safety
- Zero-bundle-impact pattern via Next.js dynamic imports

### 12-02: LeafletMap Component
- Created LeafletMap.tsx wrapper around react-leaflet
- CartoDB Positron tiles (minimal, glassmorphic aesthetic)
- Configurable center, zoom, and event handlers
- Glassmorphic attribution and control styling

### 12-03: DistrictGeoJSONLayer
- Created DistrictGeoJSONLayer.tsx for styled GeoJSON overlays
- Uses centralized districtColors.ts for consistent coloring
- Support for highlighted districts with special styling
- Click handler integration for navigation

### 12-04: HybridMapContainer
- Created HybridMapContainer.tsx combining SVG and Leaflet
- SVG renders instantly as default
- Leaflet lazy-loads on user interaction (zoom, pan)
- Smooth transition between modes

### Infrastructure
- useLeafletMap hook for map instance access
- useGeoJSONLoader hook for lazy GeoJSON fetching
- Extended districtLookup.ts with Congressional district support
- Created SC Congressional GeoJSON (7 districts, 59KB optimized)

## Files Created

| File | Purpose | Size |
|------|---------|------|
| src/lib/leafletLoader.ts | Dynamic Leaflet imports | ~30 lines |
| src/lib/districtColors.ts | Centralized color utilities | ~50 lines |
| src/components/Map/LeafletMap.tsx | Base Leaflet wrapper | ~100 lines |
| src/components/Map/DistrictGeoJSONLayer.tsx | GeoJSON overlay | ~80 lines |
| src/components/Map/HybridMapContainer.tsx | SVG/Leaflet hybrid | ~120 lines |
| src/hooks/useLeafletMap.ts | Map instance hook | ~40 lines |
| src/hooks/useGeoJSONLoader.ts | GeoJSON fetch hook | ~50 lines |
| public/data/sc-congressional-districts.geojson | District boundaries | 59KB |

## Bundle Impact

- **Initial bundle:** +0KB (all dynamic imports)
- **Lazy loaded:** ~18KB (leaflet + react-leaflet)
- **GeoJSON:** 59KB (fetched on demand)

## CSS Additions

- Glassmorphic Leaflet control styling
- Custom attribution positioning
- District hover effects with glassmorphic popups
- Dark mode support for map tiles

## Verification Results

- [x] `npm run build` succeeds
- [x] Leaflet components lazy-load correctly
- [x] CartoDB tiles render with glassmorphic styling
- [x] GeoJSON districts display with correct colors
- [x] Click handlers work for district selection

## Next Step

Phase 13: Voter Guide Map (PersonalDistrictMap integration)
