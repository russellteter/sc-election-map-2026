# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-18)

**Core value:** Build a national election intelligence platform that helps Democratic campaigns win
**Current focus:** v2.1 Strategic Visualization complete — ready for integration

## Current Position

Phase: 15 of 15 (Strategic Visualization) ✅ COMPLETE
Milestone: v2.1 Strategic Visualization ✅ SHIPPED
Plan: All 4 plans complete
Status: Ready for integration into dashboards
Last activity: 2026-01-21 — Phase 15 Strategic Visualization complete

Progress: ██████████ 100% (v2.0 + v2.1 complete)

## Shipped Milestones

| Milestone | Shipped | Key Deliverables |
|-----------|---------|------------------|
| v1.0 Blue Intelligence Demo | 2026-01-17 | 5 states, 876 districts, 12 features |
| v1.1 SC Voter Guide Enhancement | 2026-01-18 | Real county data, 155 tests, caching, Ethics scraper |
| v2.0 Map Navigation System | 2026-01-21 | NavigableUSMap, useMapState, ZoomLevelContent, HybridMapContainer |
| v2.1 Strategic Visualization | 2026-01-21 | ScenarioSimulator, HistoricalComparison, RecruitmentRadar, ResourceHeatmap |

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

Last session: 2026-01-21
Stopped at: Phase 15 Strategic Visualization complete
Resume file: None

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
