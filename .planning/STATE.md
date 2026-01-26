# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Build a national election intelligence platform that helps Democratic campaigns win
**Current focus:** v3.0 Multi-Lens Visualization System — transforming to strategic intelligence platform

## Current Position

Phase: v3.2 Map Sophistication — IN PROGRESS
Milestone: v3.2 Visual Foundation + v3.3 Interaction Polish + v3.4 Subtle Refinements
Plan: 8 enhancements across 3 phases (22-24)
Status: Phase 22 (Visual Foundation) in progress
Last activity: 2026-01-26 — Starting map sophistication implementation

Progress: ░░░░░░░░░░ 0% (v3.2-3.4 map sophistication)

## Shipped Milestones

| Milestone | Shipped | Key Deliverables |
|-----------|---------|------------------|
| v1.0 Blue Intelligence Demo | 2026-01-17 | 5 states, 876 districts, 12 features |
| v1.1 SC Voter Guide Enhancement | 2026-01-18 | Real county data, 155 tests, caching, Ethics scraper |
| v2.0 Map Navigation System | 2026-01-21 | NavigableUSMap, useMapState, ZoomLevelContent, HybridMapContainer |
| v2.1 Strategic Visualization | 2026-01-21 | ScenarioSimulator, HistoricalComparison, RecruitmentRadar, ResourceHeatmap |
| v3.0 Multi-Lens Visualization | 2026-01-23 | 4-lens system, opportunity tiers, LensToggleBar, URL sync |

## v3.1 Comprehensive UX Improvements — IN PROGRESS

**Goal:** Elevate from "functional demo" to "campaign-ready tool"

### Phase A: Quick Wins ✅ COMPLETE
| Task | Files | Status |
|------|-------|--------|
| A1. Lens onboarding tooltip | `LensToggleBar.tsx` | ✅ Complete |
| A2. WCAG contrast fixes | `districtColors.ts`, `lens.ts` | ✅ Complete |
| A3. Non-collapsible legend first visit | `Legend.tsx` | ✅ Complete |
| A4. Data freshness badge | Deferred | 🔜 Pending |
| A5. Standardize transitions | Deferred | 🔜 Pending |

### Phase B: High-Value Features ✅ COMPLETE
| Task | Files | Status |
|------|-------|--------|
| B1. District hover tooltips | `MapTooltip.tsx` enhanced | ✅ Complete |
| B2. Mobile bottom sheet | `MobileDistrictSheet.tsx` created | ✅ Complete |
| B3. Find My District | `AddressSearch.tsx` created | ✅ Complete |
| B4. Screenshot export | `ScreenshotButton.tsx` created | ✅ Complete |

### Phase C: Integration & Polish — COMPLETE
| Task | Files | Status |
|------|-------|--------|
| C1. Wire all new components | `[state]/page.tsx` | ✅ Complete |
| C2. Styling fix | `globals.css` (lens intro overlay) | ✅ Complete |
| C3. Mobile testing | Playwright tests | ✅ Complete (99 passed) |
| C4. Accessibility audit | axe-core validation | ✅ Complete (no critical violations) |
| C5. Documentation update | `docs/CURRENT-STATE.md` | ✅ Complete |

**New Files Created:**
- `src/components/Search/AddressSearch.tsx` - Find My District by address/GPS
- `src/components/Export/ScreenshotButton.tsx` - PNG/JPG map export
- `src/components/Map/MobileDistrictSheet.tsx` - Touch-friendly bottom sheet
- `src/components/ui/Tooltip.tsx` - Reusable tooltip component

**Modified Files:**
- `src/app/[state]/page.tsx` - Integrated all new components
- `src/app/globals.css` - Added styles for AddressSearch, ScreenshotButton, MobileDistrictSheet, lens intro overlay
- `src/components/Lens/LensToggleBar.tsx` - Onboarding intro (styling moved to globals.css)
- `src/components/Map/Legend.tsx` - First-visit expanded state

**Key Fix This Session:**
- Lens intro overlay was displaying as plain text due to styled-jsx scoping issue
- Moved lens intro styles from scoped `<style jsx>` to `globals.css`

---

## v3.0 Multi-Lens Visualization System ✅ SHIPPED

**6 phases, 15 plans, zero initial bundle impact**

Goal: Transform SC Election Map into strategic intelligence platform with 4 switchable lenses

| Phase | Plans | Goal | Status |
|-------|-------|------|--------|
| 16. Data Pipeline | 4 | Opportunity tier calculator, GitHub Actions | ✅ Complete |
| 17. Lens Type System | 2 | Type definitions + useLens hook | ✅ Complete |
| 18. Color System | 3 | Lens-aware color palettes | ✅ Complete |
| 19. UI Components | 3 | LensToggleBar, dynamic Legend, lens KPIs | ✅ Complete |
| 20. Integration | 3 | Wire into state page + all map components | ✅ Complete |
| 21. Polish | 2 | SyncDataButton, opportunity.json refresh | ✅ Complete |

**The 4 Lenses:**
1. **Incumbents** (default) - Traditional R/D incumbent display
2. **Dem Filing** - Blue coverage vs amber gaps
3. **Opportunity** - Heat map (HOT/WARM/POSSIBLE/LONG_SHOT/DEFENSIVE)
4. **Battleground** - Contested vs uncontested races

**New Files Created:**
- `src/types/lens.ts` - Lens type definitions and LENS_DEFINITIONS
- `src/hooks/useLens.ts` - URL-synced lens state management
- `src/components/Lens/LensToggleBar.tsx` - Horizontal pill-button toggle
- `src/components/Lens/lensKpis.ts` - Lens-aware KPI calculations
- `src/components/Admin/SyncDataButton.tsx` - GitHub Actions trigger
- `scripts/calculate_opportunity.py` - 5-tier opportunity classifier

**Modified Files:**
- `src/lib/districtColors.ts` - Added LENS_COLORS, getDistrictFillColorWithLens
- `src/components/Map/Legend.tsx` - Dynamic lens-aware legend
- `src/components/Map/DistrictMap.tsx` - activeLens prop support
- `src/components/Map/DistrictGeoJSONLayer.tsx` - activeLens for Leaflet mode
- `src/components/Map/HybridMapContainer.tsx` - Lens passthrough
- `src/components/Map/NavigableDistrictMap.tsx` - Lens passthrough
- `src/app/[state]/page.tsx` - Full lens integration with URL sync

## v2.0 Map Navigation System ✅ SHIPPED

**4 phases, 14 plans, zero initial bundle impact**

Goal: Transform Blue Intelligence into a map-first navigation experience

| Phase | Plans | Goal | Status |
|-------|-------|------|--------|
| 11. Foundation | 3 | Enhanced SVG animations, zoom transitions | ✅ Complete |
| 12. Leaflet Integration | 4 | Real pan/zoom with CartoDB Positron tiles | ✅ Complete |
| 13. Voter Guide Map | 3 | Personal location zoom, district highlighting | ✅ Complete |
| 14. Navigation Maps | 4 | Maps as primary navigation, URL-synced | ✅ Complete |

**Architecture Decisions:**
- Map Library: Leaflet + react-leaflet (18KB lazy)
- Tile Provider: CartoDB Positron (minimal, glassmorphic)
- Pattern: Hybrid SVG/Leaflet (SVG default, Leaflet on interaction)

## v2.1 Strategic Visualization ✅ SHIPPED

**4 components for campaign intelligence**

Goal: Advanced map-driven features for strategic decision-making

| Phase | Component | Purpose | Status |
|-------|-----------|---------|--------|
| 15-01 | Scenario Simulator | What-if district flipping | ✅ Complete |
| 15-02 | Historical Comparison | Margin changes between cycles | ✅ Complete |
| 15-03 | Recruitment Radar | Districts needing candidates | ✅ Complete |
| 15-04 | Resource Heatmap | Investment prioritization | ✅ Complete |

**New Components:**
- `src/components/Scenario/ScenarioSimulator.tsx` - Click districts to toggle outcomes
- `src/components/Historical/HistoricalComparison.tsx` - Diverging color scale for margin shifts
- `src/components/Recruitment/RecruitmentRadar.tsx` - Ranked target list with pulse animation
- `src/components/ResourceHeatmap/ResourceHeatmap.tsx` - Three-tier intensity with CSV export

**New Hooks:**
- `src/hooks/useScenario.ts` - Scenario state with URL sync
- `src/hooks/useHistoricalComparison.ts` - Election cycle delta calculations
- `src/hooks/useRecruitmentRadar.ts` - Opportunity scoring for recruitment
- `src/hooks/useResourceHeatmap.ts` - Composite resource allocation scoring

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Leaflet over MapLibre | Smaller bundle (18KB vs 55KB), mobile-optimized |
| 2026-01-20 | CartoDB Positron tiles | Minimal, elegant, matches glassmorphic design |
| 2026-01-20 | Hybrid SVG/Leaflet | Best of both: fast SVG default, rich Leaflet on demand |
| 2026-01-21 | Scenario URL sync | Shareable what-if scenarios via `?scenario=d23,r45` |
| 2026-01-21 | Three-tier resource intensity | Hot/Warm/Cool for investment prioritization |
| 2026-01-23 | 4-lens visualization system | Multiple perspectives for strategic decision-making |
| 2026-01-23 | 5-tier opportunity scoring | HOT/WARM/POSSIBLE/LONG_SHOT/DEFENSIVE based on margins |
| 2026-01-23 | Lens URL sync | Shareable lens views via `?lens=opportunity` |
| 2026-01-25 | Mobile bottom sheet pattern | Touch-friendly district details with swipe-to-close |
| 2026-01-25 | html-to-image for screenshots | PNG/JPG export with 2x pixel ratio for retina |
| 2026-01-25 | Global CSS for overlays | Avoid styled-jsx scoping issues with fixed-position elements |

## Accumulated Context

### Research Completed
- Explored mapcn (MapLibre-based, shadcn compatible)
- Explored Leaflet (lightweight, battle-tested)
- Analyzed StateNavigate.org patterns
- Analyzed 270toWin scenario simulator
- Analyzed NYC Election Atlas historical comparison
- Analyzed FiveThirtyEight Swing-O-Matic

### Deferred Issues

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-26
Stopped at: Project cleanup and organization complete
Resume file: None

### Session Summary (2026-01-26)
**Completed:**
- Deleted 9 duplicate/archived files from root
- Moved DEPLOYMENT-SUMMARY.txt to docs/archive/
- Moved 2 Excel files to sc-ethics-monitor/data/
- Updated .gitignore (playwright-report/, test-results/, *.xlsx)
- Archived recovery directory to .planning/archive/recovery-2026-01/
- Ran full E2E test suite: 99 passed, 7 skipped, 0 failed
- Updated docs/CURRENT-STATE.md with test results
- v3.1 UX Overhaul marked COMPLETE

**v3.1 Final Status:**
- All Phase A (Quick Wins) tasks complete
- All Phase B (High-Value Features) tasks complete
- All Phase C (Integration & Polish) tasks complete
- E2E tests passing across Chrome, Firefox, Safari, Mobile Chrome

### Session Summary (2026-01-25)
**Completed:**
- Fixed lens intro overlay styling (moved from styled-jsx to globals.css)
- All Phase B components integrated into state page
- Build verified: 197 static pages generated successfully

**Technical Notes:**
- styled-jsx scoping issue: Styles inside a div don't apply to sibling elements
- Solution: Global CSS for overlay components that render outside their parent container
- html-to-image library installed for screenshot export functionality

## Phase 14 Accomplishments

**4 plans completed:**

| Plan | Key Deliverables |
|------|------------------|
| 14-01 | NavigableDistrictMap with click-to-navigate |
| 14-02 | useMapState hook for URL synchronization |
| 14-03 | ZoomLevelContent for progressive disclosure |
| 14-04 | NavigableUSMap with deep-linking and keyboard nav |

**New Components:**
- `src/components/Map/NavigableDistrictMap.tsx` - Click-to-navigate district map
- `src/components/Map/ZoomLevelContent.tsx` - Progressive disclosure by zoom
- `src/components/Landing/NavigableUSMap.tsx` - Deep-linking + keyboard navigation

**New Hooks:**
- `src/hooks/useMapState.ts` - Bidirectional URL sync

## Phase 15 Accomplishments

**4 strategic visualization components:**

| Plan | Component | Lines | Key Features |
|------|-----------|-------|--------------|
| 15-01 | ScenarioSimulator | 450 | District flipping, seat counters, URL sync |
| 15-02 | HistoricalComparison | 360 | Period selector, color legend, top movers |
| 15-03 | RecruitmentRadar | 350 | Ranked targets, pulse animation, urgency levels |
| 15-04 | ResourceHeatmap | 450 | Composite scoring, CSV export, filter toggles |

**Color Systems Added to districtColors.ts:**
- `SCENARIO_COLORS` - Flipped district patterns
- `HISTORICAL_DELTA_COLORS` - Diverging blue↔red scale
- `RESOURCE_HEATMAP_COLORS` - Hot/Warm/Cool intensity

## Phase 16-21 Accomplishments (v3.0)

**6 phases, 15 plans completed:**

| Phase | Key Deliverables |
|-------|------------------|
| 16 | calculate_opportunity.py, ethics-monitor.yml update, opportunity.json |
| 17 | src/types/lens.ts, src/hooks/useLens.ts, URL sync with ?lens param |
| 18 | LENS_COLORS, getDistrictCategory, getDistrictFillColorWithLens, getCategoryLabel |
| 19 | LensToggleBar.tsx, lens-aware Legend.tsx, lensKpis.ts |
| 20 | DistrictMap lens support, NavigableDistrictMap passthrough, state page integration |
| 21 | SyncDataButton.tsx, opportunity.json regeneration, build verification |

**New Color Palettes:**
- Incumbents: Blue/Red for D/R incumbents, Amber for open seats
- Dem Filing: Blue coverage, Amber/Orange gaps
- Opportunity: Red HOT → Orange WARM → Yellow POSSIBLE → Gray LONG_SHOT → Blue DEFENSIVE
- Battleground: Purple contested, Blue D-only, Red R-only, Gray none

**Lens-Aware KPIs:**
- Each lens shows 4 relevant KPIs that update when lens changes
- Incumbents: Dem/Rep/Open Seats + Total
- Dem Filing: Filed/Needs Candidate/Coverage % + Total
- Opportunity: Hot/Warm/Possible/Defensive counts
- Battleground: Contested/D-only/R-only/None counts
