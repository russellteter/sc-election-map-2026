# Roadmap: Blue Intelligence Platform

## Overview

Blue Intelligence is a national 50-state election intelligence demo platform. The roadmap consists of four major phases:

- **Phase A** (COMPLETE): 5-State Demo Platform with all 12 features
- **Phase B** (PLANNED): Monorepo Migration for scalability
- **Phase C** (PLANNED): SC Production Migration with real APIs
- **Phase D** (PLANNED): State Expansion to 50 states

## Domain Expertise

Political data visualization, campaign intelligence, React/Next.js development

---

## Milestones

- ✅ **v1.0 Blue Intelligence Demo** - Phase A (COMPLETE, shipped 2026-01-17)
- ✅ **v1.1 SC Voter Guide Enhancement** - Phases 1-10 (COMPLETE, shipped 2026-01-18) → [Archive](milestones/v1.1-ROADMAP.md)
- ✅ **v2.0 Map Navigation System** - Phases 11-14 (COMPLETE, shipped 2026-01-21)
- ✅ **v2.1 Strategic Visualization** - Phase 15 (COMPLETE, shipped 2026-01-21)
- 📋 **v3.0 Monorepo Architecture** - Phase B (PLANNED)
- 📋 **v4.0 SC Production** - Phase C (PLANNED)
- 📋 **v5.0 National Platform** - Phase D (PLANNED)

---

## Phase A: 5-State Demo Platform (COMPLETE)

> **Status:** COMPLETE
> **Completion Date:** 2026-01-17

### Work Packages Completed

| WP | Name | Status |
|----|------|--------|
| WP-1 | Repository Setup | COMPLETE |
| WP-2 | State Configuration System | COMPLETE |
| WP-3 | Multi-State Routing | COMPLETE |
| WP-4 | National Landing Page | COMPLETE |
| WP-5 | State Map Assets | COMPLETE |
| WP-6 | State Config Files | COMPLETE |
| WP-7 | Demo Data Generation | COMPLETE |
| WP-8 | 12-Phase Features | COMPLETE |
| WP-9 | UI Polish & Disclaimers | COMPLETE |
| WP-10 | Deployment & Testing | COMPLETE |

### Features Implemented

All 12 original features from the API Integration Plan:

#### Tier 1: Foundation
- [x] **Phase 1: API Integration Layer** - Demo data generator infrastructure
- [x] **Phase 2: Election Timeline** - Countdown timers, key dates
- [x] **Phase 3: Polling Place Finder** - Address-based lookup

#### Tier 2: Strategic Intelligence
- [x] **Phase 4: Recruitment Pipeline** - Empty competitive districts
- [x] **Phase 5: Electorate Profiles** - Partisan composition, turnout propensity
- [x] **Phase 6: Mobilization Scoring** - "Sleeping giant" district identification

#### Tier 3: Enrichment
- [x] **Phase 7: Candidate Enrichment** - Photos, bios, endorsements
- [x] **Phase 8: Turnout-Adjusted Scoring** - Predictive competitiveness
- [x] **Phase 9: Endorsement Dashboard** - Track endorsements, gap analysis

#### Tier 4: Advanced
- [x] **Phase 10: Early Vote Tracking** - Real-time absentee/early vote
- [x] **Phase 11: Resource Optimizer** - Field staff allocation
- [x] **Phase 12: Down-Ballot Ecosystem** - Democratic strength mapping

### Deliverables

- 5 states live: SC, NC, GA, FL, VA
- 876 total districts with interactive maps
- All Intelligence components with demo data
- DemoBadge component for transparency
- Lighthouse scores: 100/94/96/100

---

<details>
<summary>✅ v1.1 SC Voter Guide Enhancement (Phases 1-10) — SHIPPED 2026-01-18</summary>

**Delivered:** Enhanced SC Voter Guide with real county data, 62% code reduction, 155 tests, persistent caching, Ethics Commission scraper.

- [x] Phase 1: Data File Scaffolding (1/1 plan) — 2026-01-17
- [x] Phase 2: County Candidate Data (1/1 plan) — 2026-01-17
- [x] Phase 3: DemoBadge Integration (1/1 plan) — 2026-01-17
- [x] Phase 4: Voter Guide Decomposition (2/2 plans) — 2026-01-17
- [x] Phase 5: County Contact Extraction (1/1 plan) — 2026-01-17
- [x] Phase 6: Address UX Improvements (1/1 plan) — 2026-01-17
- [x] Phase 7: Error Handling & Validation (1/1 plan) — 2026-01-18
- [x] Phase 8: Test Coverage (3/3 plans) — 2026-01-18
- [x] Phase 9: Performance Optimization (1/1 plan) — 2026-01-18
- [x] Phase 10: Real Data Integration (1/1 plan) — 2026-01-18

**Full details:** [milestones/v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md)

</details>

---

## v2.0 Map Navigation System ✅ COMPLETE

> **Status:** COMPLETE
> **Shipped:** 2026-01-21
> **Goal:** Transform Blue Intelligence into a map-first navigation experience

### Overview

Transform static district visualization into dynamic, interactive mapping:
- Maps serve as primary navigation (country → state → district)
- User location searches trigger animated zoom-to-district
- Beautiful CartoDB Positron tiles (not boring Google Maps)
- Zero initial bundle impact (all lazy-loaded)

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map Library | Leaflet + react-leaflet | Lightweight (18KB), mobile-optimized, static-export compatible |
| Tile Provider | CartoDB Positron | Minimal, elegant, matches glassmorphic design |
| Architecture | Hybrid SVG/Leaflet | SVG fast default, Leaflet lazy-loads on interaction |

### Phases

- [x] **Phase 11: Foundation** - Enhanced SVG animations, zoom transitions ✅ 2026-01-21
- [x] **Phase 12: Leaflet Integration** - Real pan/zoom with CartoDB tiles ✅ 2026-01-21
- [x] **Phase 13: Voter Guide Map** - Personal location zoom, district highlighting ✅ 2026-01-21
- [x] **Phase 14: Navigation Maps** - Maps as primary navigation, URL-synced ✅ 2026-01-21

### Phase Details

#### Phase 11: Foundation ✅ COMPLETE
**Goal**: Enhance existing SVG maps with smooth animations - no new dependencies
**Completed**: 2026-01-21
**Plans**: 3/3 complete

- [x] 11-01: AnimatedMapContainer with CSS zoom transitions
- [x] 11-02: AnimatedUSMap with zoom-to-state navigation
- [x] 11-03: MiniMapPreview component for Voter Guide thumbnail

#### Phase 12: Leaflet Integration ✅ COMPLETE
**Goal**: Add real pan/zoom mapping with CartoDB Positron tiles
**Completed**: 2026-01-21
**Commit**: 983bdcf
**Plans**: 4/4 complete

- [x] 12-01: Install Leaflet + react-leaflet, configure dynamic imports
- [x] 12-02: LeafletMap wrapper with SVG fallback
- [x] 12-03: DistrictGeoJSONLayer with existing color scheme
- [x] 12-04: HybridMapContainer (SVG default, Leaflet on interaction)

#### Phase 13: Voter Guide Map ✅ COMPLETE
**Goal**: Personal location-focused map that zooms to user's address
**Completed**: 2026-01-21
**Commit**: 983bdcf
**Plans**: 3/3 complete

- [x] 13-01: PersonalDistrictMap centering on user coordinates
- [x] 13-02: MapZoomAnimation from state to user location
- [x] 13-03: Integrate map into Voter Guide page

#### Phase 14: Navigation Maps ✅ COMPLETE
**Goal**: Maps as primary navigation interface with URL-synced state
**Completed**: 2026-01-21
**Plans**: 4/4 complete

- [x] 14-01: NavigableDistrictMap with click-to-navigate
- [x] 14-02: useMapState hook for URL synchronization
- [x] 14-03: ZoomLevelContent for progressive disclosure
- [x] 14-04: NavigableUSMap with deep-linking and keyboard navigation

### Bundle Impact

| Phase | Initial | Lazy | Cumulative |
|-------|---------|------|------------|
| 11. Foundation | +0KB | N/A | 0KB |
| 12. Leaflet | +0KB | +18KB | 18KB |
| 13. Voter Guide | +0KB | +2KB | 20KB |
| 14. Navigation | +0KB | +3KB | 23KB |

**Total Initial: +0KB** | **Total Lazy: ~23KB**

### Progress

| Phase | Plans | Status |
|-------|-------|--------|
| 11. Foundation | 3/3 | ✅ Complete |
| 12. Leaflet Integration | 4/4 | ✅ Complete |
| 13. Voter Guide Map | 3/3 | ✅ Complete |
| 14. Navigation Maps | 4/4 | ✅ Complete |

---

## v2.1 Strategic Visualization ✅ COMPLETE

> **Status:** COMPLETE
> **Shipped:** 2026-01-21
> **Goal:** Advanced map-driven features for strategic campaign decision-making

### Overview

Four strategic visualization components inspired by industry leaders:
- **270toWin** - Scenario simulator concept
- **NYC Election Atlas** - Historical comparison slider
- **FiveThirtyEight** - Swing-O-Matic demographic modeling

### Phase 15: Strategic Visualization ✅ COMPLETE

| Plan | Component | Purpose | Status |
|------|-----------|---------|--------|
| 15-01 | Scenario Simulator | Click districts to toggle D/R/Tossup outcomes | ✅ Complete |
| 15-02 | Historical Comparison | Margin changes between election cycles | ✅ Complete |
| 15-03 | Recruitment Radar | Districts needing Democratic candidates | ✅ Complete |
| 15-04 | Resource Heatmap | Investment prioritization with ROI scoring | ✅ Complete |

### New Components

- `src/components/Scenario/ScenarioSimulator.tsx` - What-if district flipping with seat counters
- `src/components/Historical/HistoricalComparison.tsx` - Period selector with diverging color scale
- `src/components/Recruitment/RecruitmentRadar.tsx` - Ranked target list with pulse animation
- `src/components/ResourceHeatmap/ResourceHeatmap.tsx` - Three-tier intensity with CSV export

### New Hooks

- `src/hooks/useScenario.ts` - Scenario state management with URL sync (`?scenario=d23,r45`)
- `src/hooks/useHistoricalComparison.ts` - Election cycle delta calculations
- `src/hooks/useRecruitmentRadar.ts` - Opportunity scoring for recruitment targets
- `src/hooks/useResourceHeatmap.ts` - Composite resource allocation scoring

### Color Systems (districtColors.ts)

- `SCENARIO_COLORS` - Flipped district patterns (striped overlays)
- `HISTORICAL_DELTA_COLORS` - Diverging blue↔gray↔red scale
- `RESOURCE_HEATMAP_COLORS` - Hot/Warm/Cool intensity levels

---

## Phase B: Monorepo Migration (PLANNED)

> **Status:** PLANNED
> **Trigger:** First paying customer OR second contributor
> **Estimated Effort:** 2-3 weeks

### Goal

Restructure the codebase into a Turborepo monorepo for:
- Scalable multi-package architecture
- Shared component libraries
- Independent deployments per state
- Better CI/CD pipeline

### Structure

```
blue-intelligence/
├── apps/
│   ├── demo/           # Current 5-state demo (GitHub Pages)
│   ├── sc-prod/        # SC production site (Phase C)
│   └── national/       # 50-state platform (Phase D)
├── packages/
│   ├── ui/             # Shared component library
│   ├── intelligence/   # Intelligence components
│   ├── maps/           # Map rendering
│   ├── data/           # Data loading utilities
│   └── config/         # State configuration system
└── tooling/
    ├── eslint-config/
    └── tsconfig/
```

### Key Deliverables

- [ ] Turborepo configuration
- [ ] Package extraction from current app
- [ ] Shared UI component library
- [ ] Per-app deployment pipelines
- [ ] Documentation for contributors

---

## Phase C: SC Production Migration (PLANNED)

> **Status:** PLANNED
> **Trigger:** Phase B complete + SC Democratic Party contract
> **Estimated Effort:** 2-3 weeks

### Goal

Migrate South Carolina from demo data to real API integrations:
- BallotReady API for candidate data
- TargetSmart API for voter intelligence
- Real-time data updates

### Key Deliverables

- [ ] BallotReady API client implementation
- [ ] TargetSmart API client implementation
- [ ] Data validation layer
- [ ] SC-specific production deployment
- [ ] 2-week parallel operation with demo
- [ ] Cutover and demo deprecation

### Data Sources

| Source | Purpose | Integration |
|--------|---------|-------------|
| BallotReady | Candidates, positions, elections | API client |
| TargetSmart | Voter files, turnout models | API client |
| SC Ethics Commission | Candidate filings | Existing scraper |
| OpenStates | Legislative data | API client |

---

## Phase D: State Expansion (PLANNED)

> **Status:** PLANNED
> **Trigger:** Phase C success + additional state contracts
> **Estimated Effort:** 4-6 hours per state once infrastructure exists

### Goal

Expand to all 50 states with:
- Regional batch deployments
- Per-state customization
- Scalable data pipeline

### Expansion Strategy

| Priority | States | Rationale |
|----------|--------|-----------|
| High | Battleground states (PA, MI, WI, AZ, NV) | Electoral impact |
| Medium | Competitive state legislatures | Flip potential |
| Lower | Safe states | Complete coverage |

### Per-State Requirements

- State configuration file
- SVG maps for both chambers
- GeoJSON boundaries
- Historical election data
- Demo data generation (if no API access)

---

## Progress Summary

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 Blue Intelligence Demo | Phase A (10 WPs) | 10 | COMPLETE | 2026-01-17 |
| v1.1 SC Voter Guide | Phases 1-10 | 13 | COMPLETE | 2026-01-18 |
| v2.0 Map Navigation System | Phases 11-14 | 14 | COMPLETE | 2026-01-21 |
| v2.1 Strategic Visualization | Phase 15 | 4 | COMPLETE | 2026-01-21 |
| v3.0 Monorepo Architecture | Phase B | TBD | PLANNED | - |
| v4.0 SC Production | Phase C | TBD | PLANNED | - |
| v5.0 National Platform | Phase D | TBD | PLANNED | - |

---

## Verification Checklists

Phase A verification complete. Future phase checklists in:
- `claudedocs/gsd/verification/phase-b-checklist.md` (to be created)
- `claudedocs/gsd/verification/phase-c-checklist.md` (to be created)
- `claudedocs/gsd/verification/phase-d-checklist.md` (to be created)

---

## Technical Debt (Address in Phase B)

| Item | Priority | Phase |
|------|----------|-------|
| Consolidate duplicate types | High | B |
| Add comprehensive test coverage | High | B |
| Implement error boundaries | Medium | B |
| Add service worker for offline | Low | D |
| Performance monitoring | Medium | C |

---

## Key Dates

| Date | Event |
|------|-------|
| 2026-01-17 | Phase A Complete |
| TBD | Phase B Trigger (customer/contributor) |
| TBD | Phase C Trigger (SC contract) |
| 2026-06-01 | Target: Primary season features live |
| 2026-11-03 | 2026 Election Day |

---

*For detailed Phase A work packages, see `.planning/phases/phase-a-complete/SUMMARY.md`*
