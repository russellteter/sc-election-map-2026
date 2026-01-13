# Architecture - SC Election Map 2026

> Generated: 2026-01-12 | GSD Codebase Mapping

## Overview

**Pattern:** Component-driven client-side application with static generation

**Key Characteristics:**
- Static export via Next.js (`output: 'export'`)
- Client-side data fetching and rendering
- SVG-based interactive maps
- Prop drilling for state management
- No server runtime required

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SC Ethics Commission Website                               │
│         │                                                   │
│         ▼ (curl fetch via GitHub Actions)                   │
│  sc-ethics-monitor/state.json                               │
│         │                                                   │
│         ▼ (Python: scripts/process-data.py)                 │
│  candidates.json (enriched with party-data.json)            │
│         │                                                   │
│         ▼ (auto-commit to repo)                             │
│  public/data/candidates.json                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CLIENT RENDERING                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser loads page.tsx                                     │
│         │                                                   │
│         ▼ (useEffect)                                       │
│  Fetch candidates.json + house/senate SVG maps              │
│         │                                                   │
│         ▼ (useMemo)                                         │
│  Process SVG: add fill colors per candidate data            │
│         │                                                   │
│         ▼ (dangerouslySetInnerHTML)                         │
│  Render colored SVG map with event delegation               │
│         │                                                   │
│         ▼ (onClick/onHover)                                 │
│  Update state → Side panel shows district details           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## State Management

**Approach:** React hooks (useState, useEffect, useMemo, useCallback, useRef)

**State Location:** Centralized in `page.tsx` (Home component)

| State | Type | Trigger |
|-------|------|---------|
| `chamber` | `'house' \| 'senate'` | ChamberToggle button |
| `selectedDistrict` | `number \| null` | Map path click |
| `hoveredDistrict` | `number \| null` | Map path hover |
| `candidatesData` | `CandidatesData \| null` | useEffect on mount |
| `isLoading` | `boolean` | Async data load |
| `rawSvgContent` | `string` | SVG fetch |
| `processedSvgContent` | `string` | useMemo SVG coloring |

**Data Flow Direction:**
- Props flow **down**: `page.tsx` → Child components
- Events flow **up**: Child onClick → Callbacks → setState

## Component Architecture

```
layout.tsx (Root Layout)
└── page.tsx (Home - Client Component)
    │
    ├── <header>
    │   └── ChamberToggle
    │
    ├── <main>
    │   │
    │   ├── Left Section
    │   │   ├── Stats Bar (KPI cards)
    │   │   ├── DistrictMap (SVG)
    │   │   ├── Legend
    │   │   └── Hover Info
    │   │
    │   └── Right Section
    │       └── SidePanel
    │           └── CandidateCard (repeated)
    │
    └── <footer>
```

## Key Architectural Decisions

### 1. SVG Map Rendering

**Strategy:** Pre-process SVG string before rendering

```typescript
// useMemo processes SVG with fills BEFORE React render
const processedSvgContent = useMemo(() => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvgContent, 'image/svg+xml');

  // Add fill colors based on candidate data
  paths.forEach(path => {
    const color = getDistrictColor(districtData);
    path.setAttribute('fill', color);
  });

  return new XMLSerializer().serializeToString(svg);
}, [rawSvgContent, chamber, candidatesData, selectedDistrict]);
```

**Why:** React's `dangerouslySetInnerHTML` resets content on re-render, so colors must be applied to the string before rendering.

### 2. Event Delegation

**Strategy:** Single event handler on container

```typescript
const handleClick = useCallback((e: React.MouseEvent) => {
  const path = e.target.closest('path[data-district]');
  if (path) {
    const districtNum = parseInt(path.getAttribute('data-district'));
    onDistrictClick(districtNum);
  }
}, [onDistrictClick]);
```

**Why:** More efficient than 170 individual path listeners (124 House + 46 Senate).

### 3. Static Export

**Strategy:** Next.js `output: 'export'`

**Benefits:**
- No server required
- GitHub Pages compatible
- Fast CDN delivery
- Simple deployment

### 4. Client-Side Data Loading

**Strategy:** Fetch on component mount

```typescript
useEffect(() => {
  fetch('/data/candidates.json')
    .then(res => res.json())
    .then(data => setCandidatesData(data))
    .catch(err => setError(true));
}, []);
```

**Why:** Static export means no server-side data fetching.

## Color Mapping Logic

```typescript
function getDistrictColor(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return '#f3f4f6'; // gray-100 - no candidates
  }

  const hasDemocrat = district.candidates.some(
    c => c.party?.toLowerCase() === 'democratic'
  );
  const hasRepublican = district.candidates.some(
    c => c.party?.toLowerCase() === 'republican'
  );

  if (hasDemocrat && hasRepublican) return '#a855f7'; // purple - contested
  if (hasDemocrat) return '#3b82f6';                   // blue - Democrat
  if (hasRepublican) return '#ef4444';                 // red - Republican
  return '#9ca3af';                                     // gray - unknown
}
```

## Performance Optimizations

| Optimization | Location | Benefit |
|--------------|----------|---------|
| `useMemo` for SVG | DistrictMap | Prevents re-parsing |
| `useCallback` for handlers | DistrictMap | Prevents child re-renders |
| Event delegation | DistrictMap | Single handler for all paths |
| Conditional rendering | page.tsx | Early return for loading |
| Static JSON | public/data/ | No API latency |
| Path aliases | tsconfig | Cleaner imports |

## Deployment Model

```
Development                    Production
     │                              │
     ▼                              ▼
 npm run dev              npm run build
     │                              │
     ▼                              ▼
 localhost:3000           out/ directory
                                   │
                                   ▼
                          GitHub Pages
                                   │
                                   ▼
                    russellteter.github.io/sc-election-map-2026/
```

## External Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| SC Ethics Monitor | Data | Raw candidate filings |
| US Census TIGER | Maps | District shapefiles |
| GitHub Pages | Hosting | Static deployment |
| GitHub Actions | CI/CD | Build + data updates |
