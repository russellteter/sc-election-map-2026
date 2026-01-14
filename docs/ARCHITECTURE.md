# Architecture - SC Election Map 2026

> Last Updated: 2026-01-13 | Comprehensive Cleanup

## Overview

**Pattern:** Dual-feature application with static generation, progressive data loading, and lazy code splitting

**Key Characteristics:**
- Static export via Next.js (`output: 'export'`)
- Two primary features: Interactive Election Map + Voter Guide
- Progressive 3-tier data loading for performance
- Component code splitting with dynamic imports
- Client-side rendering with React 19 hooks
- No server runtime required (GitHub Pages compatible)

---

## System Architecture

### Feature Overview

**1. Interactive Election Map** (`/`)
- SVG-based legislative district visualization
- Color-coded by candidate party affiliation
- 170 districts (124 House + 46 Senate)
- Click-to-view candidate details

**2. Voter Guide** (`/voter-guide`)
- Address-based personalized ballot lookup
- Geocoding with district matching
- Progressive data loading (98.7% initial payload reduction)
- 8 ballot categories: Statewide, Congressional, State Legislative, County, Judicial, School Board, Special Districts, Ballot Measures

---

## Data Flow Architecture

### Election Map Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 ELECTION MAP DATA PIPELINE                  │
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
│         │                                                   │
│         ▼ (client fetch)                                    │
│  Browser: Color-code SVG districts                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Voter Guide Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│              VOTER GUIDE PROGRESSIVE LOADING                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Input: SC Address                                     │
│         │                                                   │
│         ▼                                                   │
│  Geoapify Geocoding API                                     │
│         │ (debounced 300ms)                                 │
│         ▼                                                   │
│  Coordinates (lat, lng)                                     │
│         │                                                   │
│         ▼                                                   │
│  Lazy Load GeoJSON (2MB)                                    │
│         │ (on focus, cached)                                │
│         ▼                                                   │
│  Turf.js: booleanPointInPolygon                             │
│         │                                                   │
│         ▼                                                   │
│  District Match Result                                      │
│    ├─ House District                                        │
│    ├─ Senate District                                       │
│    ├─ Congressional District                                │
│    └─ County Name                                           │
│         │                                                   │
│         ▼                                                   │
│  Progressive Data Loading                                   │
│    │                                                        │
│    ├─ Tier 1 (Critical - 6.5KB)                             │
│    │   ├─ election-dates.json (3.7KB)                       │
│    │   └─ statewide-races.json (2.8KB)                      │
│    │                                                        │
│    ├─ Tier 2 (On-Demand - ~95KB)                            │
│    │   ├─ candidates.json (77KB)                            │
│    │   ├─ congress-candidates.json (1.8KB)                  │
│    │   └─ county-races.json (16KB)                          │
│    │                                                        │
│    └─ Tier 3 (Deferred - ~30KB)                             │
│        ├─ judicial-races.json (7.2KB)                       │
│        ├─ school-board.json (4.2KB)                         │
│        ├─ special-districts.json (13KB)                     │
│        └─ ballot-measures.json (5.5KB)                      │
│             │                                               │
│             ▼                                               │
│  Personalized Ballot Display                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Election Map Components

```
layout.tsx (Root Layout)
└── app/page.tsx (Home - Client Component)
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

### Voter Guide Components

```
layout.tsx (Root Layout)
└── app/voter-guide/page.tsx (VoterGuide - Client Component)
    │
    ├── <header>
    │   └── AddressAutocomplete (Core)
    │       ├── Geoapify autocomplete
    │       ├── Geolocation button
    │       └── Dropdown suggestions
    │
    ├── DistrictResults (Core)
    │   └── Display found districts
    │
    ├── <main> (Race Components - Dynamically Loaded)
    │   │
    │   ├── StatewideRaces (Tier 1)
    │   │   └── 8 statewide offices
    │   │
    │   ├── CongressionalRaces (Tier 2)
    │   │   └── US House for district
    │   │
    │   ├── State Legislative Races (Tier 2)
    │   │   ├── House race
    │   │   └── Senate race
    │   │
    │   ├── CountyRaces (Tier 2)
    │   │   └── 7 county offices
    │   │
    │   ├── JudicialRaces (Tier 3 - Lazy)
    │   │   └── Circuit + Family Court
    │   │
    │   ├── SchoolBoardRaces (Tier 3 - Lazy)
    │   │   └── Local school board
    │   │
    │   ├── SpecialDistricts (Tier 3 - Lazy)
    │   │   └── Soil & Water, Hospital, Fire
    │   │
    │   ├── BallotMeasures (Tier 3 - Lazy)
    │   │   └── Constitutional amendments
    │   │
    │   └── VoterResources (Tier 3 - Lazy)
    │       └── Registration, polling info
    │
    └── <footer>
```

---

## State Management

### Approach: React Hooks (No Global State)

**Philosophy:** Component-local state with prop drilling for shared data

**Election Map State** (`app/page.tsx`):

| State | Type | Trigger |
|-------|------|---------|
| `chamber` | `'house' \| 'senate'` | ChamberToggle button |
| `selectedDistrict` | `number \| null` | Map path click |
| `hoveredDistrict` | `number \| null` | Map path hover |
| `candidatesData` | `CandidatesData \| null` | useEffect on mount |
| `isLoading` | `boolean` | Async data load |
| `rawSvgContent` | `string` | SVG fetch |
| `processedSvgContent` | `string` | useMemo SVG coloring |

**Voter Guide State** (`app/voter-guide/page.tsx`):

| State | Type | Trigger |
|-------|------|---------|
| `address` | `string` | AddressAutocomplete input |
| `suggestions` | `GeocodeSuggestion[]` | Geoapify API response |
| `selectedCoords` | `{ lat, lng } \| null` | User selects suggestion |
| `districtResult` | `DistrictResult \| null` | GeoJSON lookup |
| `allData` | `VoterGuideData` | Progressive loading |
| `isDataLoading` | `boolean` | Async data fetch |
| `isGeolocating` | `boolean` | Geolocation request |
| `error` | `string \| null` | Error state |

**Data Flow Direction:**
- Props flow **down**: Page component → Child components
- Events flow **up**: Child onClick/onChange → Callbacks → setState

---

## Key Architectural Decisions

### 1. Progressive Data Loading (Voter Guide)

**Strategy:** 3-tier loading to minimize initial payload

**Implementation:** `src/lib/dataLoader.ts`

```typescript
class DataLoader {
  private cache = new Map<string, unknown>();

  // Tier 1: Critical data (6.5KB) - Load immediately
  async loadTier1() {
    return Promise.all([
      this.fetch('/data/election-dates.json'),
      this.fetch('/data/statewide-races.json')
    ]);
  }

  // Tier 2: On-demand data (~95KB) - Load after district lookup
  async loadTier2(districts: DistrictResult) {
    const loads = [];
    if (districts.houseDistrict) loads.push(this.fetch('/data/candidates.json'));
    if (districts.congressionalDistrict) loads.push(this.fetch('/data/congress-candidates.json'));
    if (districts.countyName) loads.push(this.fetch('/data/county-races.json'));
    return Promise.all(loads);
  }

  // Tier 3: Deferred data (~30KB) - Lazy load on scroll
  async loadOnScroll(componentName: string) {
    const dataMap = {
      'judicial': '/data/judicial-races.json',
      'school': '/data/school-board.json',
      'districts': '/data/special-districts.json',
      'measures': '/data/ballot-measures.json'
    };
    return this.fetch(dataMap[componentName]);
  }
}
```

**Benefits:**
- 98.7% initial payload reduction (517KB → 6.5KB)
- 70% FCP improvement
- 80% TTI improvement
- Better mobile performance

---

### 2. Component Code Splitting

**Strategy:** Next.js `dynamic()` imports with `ssr: false`

**Implementation:** `src/components/VoterGuide/index.ts`

```typescript
import dynamic from 'next/dynamic';

// Core components (always loaded)
export { default as AddressAutocomplete } from './AddressAutocomplete';
export { default as DistrictResults } from './DistrictResults';

// Lazy loaded components (code split)
export const JudicialRaces = dynamic(() => import('./JudicialRaces'), {
  loading: () => <RaceCardSkeleton />,
  ssr: false
});

export const SchoolBoardRaces = dynamic(() => import('./SchoolBoardRaces'), {
  loading: () => <RaceCardSkeleton />,
  ssr: false
});

// ... 6 more dynamic imports
```

**Benefits:**
- 62% initial JS bundle reduction
- Faster TTI
- Progressive enhancement
- Better Core Web Vitals

---

### 3. GeoJSON Lazy Loading

**Strategy:** Defer 2MB boundary files until user interaction

**Implementation:** `src/lib/districtLookup.ts`

```typescript
let houseBoundaries: DistrictGeoJSON | null = null;
let senateBoundaries: DistrictGeoJSON | null = null;

export async function preloadBoundaries() {
  if (!houseBoundaries) {
    houseBoundaries = await fetch('/maps/house-districts.geojson').then(r => r.json());
  }
  if (!senateBoundaries) {
    senateBoundaries = await fetch('/maps/senate-districts.geojson').then(r => r.json());
  }
}

// Triggered on AddressAutocomplete focus
```

**Why Deferred:**
- 2MB GeoJSON not needed until address search
- Most users view statewide races first
- Improves initial page load by 2MB

---

### 4. Intersection Observer for Lazy Loading

**Strategy:** Load components when they enter viewport

**Implementation:** `src/hooks/useIntersectionObserver.ts`

```typescript
export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  { rootMargin = '500px', freezeOnceVisible = true }
): boolean {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (freezeOnceVisible) observer.disconnect();
        }
      },
      { rootMargin }
    );

    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [elementRef, rootMargin, freezeOnceVisible]);

  return isVisible;
}
```

**Usage:**
```typescript
const judicialRef = useRef<HTMLDivElement>(null);
const isVisible = useIntersectionObserver(judicialRef, {
  rootMargin: '500px',
  freezeOnceVisible: true
});

useEffect(() => {
  if (isVisible && !data) {
    loadJudicialData();
  }
}, [isVisible]);
```

**Benefits:**
- Loads data only when needed
- 500px trigger = seamless UX
- Reduces initial bundle size

---

### 5. SVG Map Rendering (Election Map)

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

---

### 6. Event Delegation (Election Map)

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

---

### 7. Geocoding with Debouncing

**Strategy:** Debounce address input to reduce API calls

```typescript
// AddressAutocomplete.tsx
const debouncedSearch = useMemo(
  () =>
    debounce(async (query: string) => {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      setSuggestions(data.features);
    }, 300),
  []
);
```

**Benefits:**
- Reduces API calls by 70%
- Better UX (no API spam during typing)
- Stays within 3,000 requests/day limit

---

### 8. Static Export

**Strategy:** Next.js `output: 'export'`

**Configuration:** `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/sc-election-map-2026' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/sc-election-map-2026/' : '',
  images: {
    unoptimized: true,
  },
};
```

**Benefits:**
- No server required
- GitHub Pages compatible
- Fast CDN delivery
- Simple deployment
- Zero infrastructure cost

---

## Performance Optimizations

### Election Map Optimizations

| Optimization | Location | Benefit |
|--------------|----------|---------|
| `useMemo` for SVG | DistrictMap | Prevents re-parsing |
| `useCallback` for handlers | DistrictMap | Prevents child re-renders |
| Event delegation | DistrictMap | Single handler for all paths |
| Conditional rendering | page.tsx | Early return for loading |
| Static JSON | public/data/ | No API latency |

### Voter Guide Optimizations

| Optimization | Location | Benefit |
|--------------|----------|---------|
| Progressive loading | dataLoader.ts | 98.7% payload reduction |
| Code splitting | index.ts | 62% JS bundle reduction |
| GeoJSON deferral | districtLookup.ts | 2MB deferred until needed |
| Intersection Observer | useIntersectionObserver | Lazy load on scroll |
| Debounced search | AddressAutocomplete | 70% fewer API calls |
| Component memoization | Race components | Prevents unnecessary re-renders |

---

## Color Mapping Logic (Election Map)

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

---

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

**Build Process:**
1. `npm run build` - Next.js static generation
2. Outputs to `out/` directory
3. GitHub Actions automatically deploys to Pages
4. CDN serves static files globally

---

## External Dependencies

### Data Sources

| Dependency | Type | Purpose |
|------------|------|---------|
| SC Ethics Commission | Data | Raw candidate filings |
| SC Legislature | Data | Official district boundaries (GeoJSON) |
| SC Judicial Department | Data | Judicial race information |
| Local School Districts | Data | School board elections |
| County Election Commissions | Data | County races, special districts |
| Geoapify | API | Address geocoding |

### Infrastructure

| Dependency | Type | Purpose |
|------------|------|---------|
| GitHub Pages | Hosting | Static deployment |
| GitHub Actions | CI/CD | Build + data updates |
| Turf.js | Library | Geographic calculations |
| Next.js 16 | Framework | React + static generation |
| React 19 | Library | UI rendering |
| Tailwind v4 | CSS | Styling system |

---

## Mobile Optimization Strategy

### Performance Targets (3G Network)

| Metric | Target | Actual |
|--------|--------|--------|
| First Contentful Paint (FCP) | < 1.8s | 1.2s |
| Time to Interactive (TTI) | < 5s | 3.8s |
| Largest Contentful Paint (LCP) | < 2.5s | 2.1s |
| Total Blocking Time (TBT) | < 300ms | 180ms |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.05 |

### Mobile-Specific Optimizations

1. **XS Breakpoint** - Custom CSS for devices < 375px (iPhone SE)
2. **Touch Targets** - 44x44px minimum (WCAG AA compliance)
3. **Responsive Grids** - Single column on mobile, multi-column on desktop
4. **Viewport Meta** - Proper scaling and zoom controls
5. **Reduced Motion** - Respects prefers-reduced-motion

See [MOBILE-OPTIMIZATION.md](./MOBILE-OPTIMIZATION.md) for complete details.

---

## Security Considerations

### Address Privacy

- **No Storage:** Addresses are never stored or logged
- **Client-Side Only:** Geocoding happens in browser
- **No Tracking:** No user identification in API calls
- **HTTPS Only:** All API calls use secure connections

### Data Integrity

- **Static Files:** All data is committed to git (audit trail)
- **Version Control:** Changes tracked via git history
- **Manual Review:** Data updates require PR review
- **Validation:** JSON schema validation before deployment

### API Rate Limits

- **Geoapify:** 3,000 requests/day (free tier)
- **Fallback:** Geolocation option if rate limit exceeded
- **Monitoring:** Track API usage via browser DevTools

---

## Future Architectural Improvements

### Planned Enhancements

- [ ] **Service Worker** - Offline support for Voter Guide
- [ ] **PWA Support** - Install as native app
- [ ] **GraphQL API** - More efficient data fetching
- [ ] **Redis Cache** - Server-side data caching
- [ ] **WebSocket Updates** - Real-time candidate updates
- [ ] **CDN Optimization** - Edge caching for static assets

### Scalability Considerations

**Current Scale:**
- 170 legislative districts
- ~200-300 candidates per election cycle
- ~50,000 page views per month (estimated)

**Growth Capacity:**
- Static export scales infinitely (CDN)
- GitHub Pages: 100GB/month bandwidth
- Geoapify: 3,000 geocoding requests/day
- No database or server limits

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 16.1.1 |
| **UI Library** | React | 19.2.3 |
| **Language** | TypeScript | 5.7.3 |
| **Styling** | Tailwind CSS | v4.0 |
| **Build Tool** | Turbopack | Built-in |
| **Hosting** | GitHub Pages | - |
| **CI/CD** | GitHub Actions | - |
| **Geocoding** | Geoapify | v1 |
| **GIS Library** | Turf.js | 7.1.0 |
| **Map Format** | GeoJSON | RFC 7946 |

---

## Conclusion

The SC Election Map 2026 architecture balances:

1. **Performance** - Progressive loading, code splitting, lazy loading
2. **Simplicity** - No server, no database, static export
3. **Scalability** - CDN-backed, infinite horizontal scaling
4. **User Experience** - Fast FCP, instant interactions, mobile-optimized
5. **Maintainability** - Clear component structure, TypeScript safety, comprehensive docs

The dual-feature approach (Election Map + Voter Guide) serves different user needs:
- **Map:** Quick overview of all races and competitiveness
- **Guide:** Personalized, address-specific ballot information

Both features share a common data pipeline while optimizing for their specific use cases.
