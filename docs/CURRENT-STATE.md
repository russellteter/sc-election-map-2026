# Blue Intelligence - Current State

> Last Updated: 2026-01-26 | v3.1 Complete (E2E Verified)

---

## Deployment Status

| Attribute | Value |
|-----------|-------|
| **URL** | https://russellteter.github.io/sc-election-map-2026/ |
| **Last Deploy** | 2026-01-17 |
| **Status** | Production |
| **Hosting** | GitHub Pages |
| **Build** | Next.js Static Export |

---

## Coverage

### States Deployed

| State | Code | House | Senate | Total | Data Type |
|-------|------|-------|--------|-------|-----------|
| South Carolina | SC | 124 | 46 | 170 | Real + Demo |
| North Carolina | NC | 120 | 50 | 170 | Demo |
| Georgia | GA | 180 | 56 | 236 | Demo |
| Florida | FL | 120 | 40 | 160 | Demo |
| Virginia | VA | 100 | 40 | 140 | Demo |
| **Total** | - | **644** | **232** | **876** | |

### Routes Available

| Route | Description |
|-------|-------------|
| `/` | National landing page with US map |
| `/sc/` | South Carolina election map |
| `/nc/` | North Carolina election map |
| `/ga/` | Georgia election map |
| `/fl/` | Florida election map |
| `/va/` | Virginia election map |
| `/[state]/voter-guide/` | State voter guide |
| `/[state]/opportunities/` | Strategic opportunities |
| `/[state]/race/[id]/` | Individual race details |

---

## Lighthouse Scores (Production)

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Performance | 100 | >90 | PASS |
| Accessibility | 94 | >90 | PASS |
| Best Practices | 96 | >90 | PASS |
| SEO | 100 | >90 | PASS |

---

## Feature Matrix

### Core Features

| Feature | Status | Component | Notes |
|---------|--------|-----------|-------|
| Interactive District Maps | Live | `DistrictMap.tsx` | 876 districts |
| Voter Guide | Live | `/voter-guide` | Address-based lookup |
| Race Detail Pages | Live | `/race/[id]` | Historical data |
| Table View | Live | `/table` | Sortable, filterable |
| Strategic Opportunities | Live | `/opportunities` | Tier classification |

### Multi-Lens Visualization (v3.0)

| Lens | Component | Description |
|------|-----------|-------------|
| Incumbents | `LensToggleBar.tsx` | Current party control of each district |
| Dem Filing | `LensToggleBar.tsx` | Democratic candidate filing coverage |
| Opportunity | `LensToggleBar.tsx` | Strategic opportunity tiers (HOT/WARM/POSSIBLE) |
| Battleground | `LensToggleBar.tsx` | Contested vs uncontested races |

**Key Components:**
- `src/types/lens.ts` - Lens type definitions and configurations
- `src/components/Lens/LensToggleBar.tsx` - Lens switcher UI
- `src/hooks/useLens.ts` - Lens state management
- `src/lib/districtColors.ts` - Lens-aware district coloring
- `src/components/Map/Legend.tsx` - Dynamic lens-aware legend

### UX Overhaul (v3.1)

| Feature | Component | Description |
|---------|-----------|-------------|
| Address Search | `AddressSearch.tsx` | Find district by address or GPS location |
| Mobile District Sheet | `MobileDistrictSheet.tsx` | Touch-friendly bottom sheet for mobile |
| Screenshot Export | `ScreenshotButton.tsx` | Export map as PNG/JPG for sharing |
| Dynamic Legend | `Legend.tsx` | Collapsible, lens-aware legend |
| Glassmorphic KPIs | `lensKpis.ts` | Lens-specific KPI calculations |

**Key Files:**
- `src/components/Search/AddressSearch.tsx` - Geoapify-powered address lookup
- `src/components/Map/MobileDistrictSheet.tsx` - Swipe-to-close district details
- `src/components/Export/ScreenshotButton.tsx` - html-to-image export
- `src/components/ui/Tooltip.tsx` - Reusable tooltip component

### Intelligence Features (Phase A)

| Feature | Status | Component | Data Source |
|---------|--------|-----------|-------------|
| Electorate Profiles | Live | `ElectorateProfile.tsx` | Demo generated |
| Mobilization Scoring | Live | `MobilizationCard.tsx` | Demo generated |
| Early Vote Tracker | Live | `EarlyVoteTracker.tsx` | Demo (placeholder) |
| Resource Optimizer | Live | `ResourceOptimizer.tsx` | Demo generated |
| Endorsement Dashboard | Partial | N/A | Demo generated |
| Down-Ballot Ecosystem | Live | Multiple | Demo generated |

### Multi-State Features

| Feature | Status | Notes |
|---------|--------|-------|
| National Landing Page | Live | US map with state selection |
| Dynamic State Routing | Live | `/[state]/` pattern |
| State Configuration | Live | Per-state config files |
| Demo Data Generation | Live | Algorithmic per state |
| DemoBadge Component | Live | Marks all demo data |

---

## Performance Metrics

### Build Statistics

| Metric | Value |
|--------|-------|
| Build Time | <10 seconds |
| Initial Payload | <10KB |
| Total Bundle | <3MB |
| Static Pages | ~200+ |

### Data Loading Strategy

| Tier | Size | Trigger | Content |
|------|------|---------|---------|
| Critical | <10KB | Immediate | State metadata, election dates |
| On-Demand | ~100KB | User action | Candidates, district data |
| Deferred | ~30KB | Scroll | Intelligence features |

---

## Data Sources

### Real Data (SC Only)

| Source | Data Provided | Update Method |
|--------|---------------|---------------|
| SC Ethics Commission | Candidate filings | Daily scrape |
| kjatwood SCHouseMap7.0 | Democratic verification | Manual merge |
| SC Election Commission | Historical results | Manual compilation |
| Geoapify | Address geocoding | Live API |
| GeoJSON Boundaries | District polygons | Static files |

### Demo Generated Data (All States)

| Data Type | Generation Method |
|-----------|-------------------|
| Voter Intelligence | Algorithmic from Census |
| Opportunity Scores | Historical margins + demographics |
| Mobilization Universes | Turnout modeling |
| Endorsements | Random assignment |
| Early Vote Data | Placeholder values |

---

## Technical Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16 |
| UI Library | React | 19 |
| Language | TypeScript | 5 (strict) |
| Styling | Tailwind CSS | 4 |
| Hosting | GitHub Pages | - |
| Maps | SVG + GeoJSON | - |

---

## Known Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| Demo data only (4 states) | Limited real intelligence | DemoBadge labels |
| No real-time API | Static data | Phase C will add APIs |
| SC real data partial | Some gaps | Demo fills gaps |
| Static export | No SSR | Acceptable for use case |

---

## Quality Metrics

### Code Quality

| Metric | Status |
|--------|--------|
| TypeScript strict mode | Enabled |
| ESLint | Passing |
| Type coverage | High |
| Console errors | None |

### Accessibility

| Feature | Status | Test Coverage |
|---------|--------|---------------|
| Keyboard navigation | Implemented | E2E tests |
| Skip link | Implemented | E2E tests |
| ARIA labels | Present | axe-core audit |
| Color contrast | WCAG AA | axe-core audit |
| Focus management | Implemented | E2E tests |
| Screen reader | Tested | axe-core audit |
| Mobile responsive | Yes | E2E viewport tests |

**E2E Test Coverage (2026-01-26):**
- `tests/e2e/accessibility.spec.ts` - axe-core WCAG 2.1 AA audit
- `tests/e2e/v31-components.spec.ts` - v3.1 UX component tests
- `tests/e2e/map.spec.ts` - Core map functionality
- **Results:** 99 passed, 7 skipped across 4 browsers (Chrome, Firefox, Safari, Mobile Chrome)

---

## Recent Releases

| Version | Features | Date |
|---------|----------|------|
| v3.1 | UX Overhaul (AddressSearch, MobileSheet, Screenshot) | 2026-01-25 |
| v3.0 | Multi-Lens System (4 visualization modes) | 2026-01-24 |
| v2.0 | Multi-State (5 states, 876 districts) | 2026-01-17 |

## Upcoming

| Feature | Priority | Trigger |
|---------|----------|---------|
| Data Pipeline Fix | P2 | Enable scraper for 100+ candidates |
| BallotReady API | Future | SC contract |
| TargetSmart API | Future | SC contract |
| Real voter data | Future | API integration |
| Additional states | Future | Demand |

---

*For full technical details, see `.planning/codebase/OVERVIEW.md`*
