# SC Election Map 2026 - Project Definition

> **Generated:** 2026-01-13 | GSD Project Initialization
> **Repository:** https://github.com/russellteter/sc-election-map-2026
> **Live Site:** https://russellteter.github.io/sc-election-map-2026/

---

## Vision

An interactive map visualization of South Carolina's 2026 election races, enabling party recruiters and political organizers to quickly identify which districts have candidates, their party affiliations, and filing status.

## Problem Statement

The current map is **functional but limited**:
- **6% party enrichment** (House) and **0%** (Senate) - map appears as gray blob
- **Zero test coverage** - regressions possible, no confidence in changes
- **Accessibility violations** - excludes users, potential legal risk
- **Plain design** - glassmorphic migration plan exists but not implemented

## Target Users

| User Type | Primary Need |
|-----------|--------------|
| Party Recruiters | Identify gaps where no candidate is running |
| Campaign Staff | Track competitive districts |
| Journalists | Visualize election landscape |
| General Public | Understand local representation |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Party Enrichment (House) | 6% | ≥70% |
| Party Enrichment (Senate) | 0% | ≥70% |
| Test Coverage | 0% | ≥80% |
| Lighthouse Accessibility | ~70 | ≥95 |
| Lighthouse Performance | TBD | ≥90 |
| Glassmorphic Design | 0% | 100% |

---

## Roadmap

### Milestone 1: Make It Useful
**Goal:** Transform the map from gray blob to meaningful visualization

#### Phase 1: Data Completeness
- Research and populate party affiliations for House candidates
- Research and populate party affiliations for Senate candidates
- Improve color scheme (Gray=vacant, Yellow=unknown, Blue/Red=known)
- Add data completeness indicator to UI

**Success Criteria:**
- [ ] House party enrichment ≥50%
- [ ] Senate party enrichment ≥50%
- [ ] Clear visual distinction between vacant and unknown
- [ ] Data freshness visible in UI

#### Phase 2: Accessibility Foundation
- Add keyboard navigation to SVG map
- Add ARIA labels to all interactive elements
- Implement focus management
- Ensure color is not only means of information

**Success Criteria:**
- [ ] Lighthouse Accessibility ≥95
- [ ] Keyboard-only navigation works
- [ ] Screen reader announces selections
- [ ] Focus indicators visible

---

### Milestone 2: Make It Reliable
**Goal:** Establish quality infrastructure to prevent regressions

#### Phase 3: Testing Infrastructure
- Install Jest + Testing Library
- Unit tests for utility functions (getDistrictColor, calculateStats)
- Component tests for key components
- E2E tests with Playwright for critical paths

**Success Criteria:**
- [ ] Jest configured and running
- [ ] Unit test coverage ≥80%
- [ ] E2E tests for map rendering (no black bug regression)
- [ ] CI runs tests on every push

---

### Milestone 3: Make It Beautiful
**Goal:** Implement the glassmorphic design system

#### Phase 4: Glassmorphic Migration
- Implement design tokens from GLASSMORPHIC_MIGRATION_PLAN.md
- Migrate KPI/stats cards to glassmorphic style
- Migrate side panel to glassmorphic style
- Add micro-animations (respect prefers-reduced-motion)
- Update legend with new badge styles

**Success Criteria:**
- [ ] Design tokens in globals.css
- [ ] KPI cards use glassmorphic styling
- [ ] Side panel has backdrop-blur effects
- [ ] Animations disabled for reduced-motion preference

---

### Milestone 4: Make It Powerful
**Goal:** Add advanced features for power users

#### Phase 5: Advanced Features
- Search by district number
- Filter by party affiliation
- URL-based state sharing
- Export/share functionality

**Success Criteria:**
- [ ] Search finds districts quickly
- [ ] Filters work correctly
- [ ] URL reflects current view state
- [ ] Share links work

---

### Milestone 5: API Intelligence Layer
**Goal:** Integrate BallotReady and TargetSmart APIs for live strategic data

#### Phase 6: Tier 1 - Foundation
- Configure API credentials
- Enhance BallotReady client for live election timeline
- Enhance TargetSmart client for basic voter queries
- Create/wire ElectionCountdown component
- Create/wire PollingPlaceFinder component

**Success Criteria:**
- [ ] .env.local created with API keys
- [ ] Election countdown displays live dates from BallotReady
- [ ] Polling place lookup returns results for SC addresses
- [ ] `npm run build` passes
- [ ] E2E tests pass

#### Phase 7: Tier 2 - Strategic Intelligence
- Recruitment pipeline with live vacant seat data
- Electorate profiles from TargetSmart
- Mobilization scoring integration

**Success Criteria:**
- [ ] RecruitmentPipeline component shows real data
- [ ] ElectorateProfile displays district demographics
- [ ] MobilizationCard calculates live scores

#### Phase 8: Tier 3 - Enrichment
- Enhanced candidate profiles from BallotReady officeholders
- Turnout-adjusted opportunity scores
- Endorsement tracking integration

**Success Criteria:**
- [ ] Candidate cards show enriched data
- [ ] Opportunity scores include voter intelligence bonuses
- [ ] EndorsementDashboard tracks endorsements

#### Phase 9: Tier 4 - Advanced
- Early vote tracking (election season only)
- Resource optimizer calculations
- Down-ballot intelligence maps

**Success Criteria:**
- [ ] Early vote dashboard functional
- [ ] Resource allocation recommendations
- [ ] Down-ballot map visualization

---

## Technical Constraints

| Constraint | Reason |
|------------|--------|
| Static export only | GitHub Pages hosting |
| No server-side code | Free tier hosting requirement |
| SVG-based maps | Already invested, works well |
| Tailwind CSS | Existing choice, works with glassmorphic |
| No external state management | App is simple enough for props |

## Data Sources

| Source | Data | Update Frequency |
|--------|------|------------------|
| SC Ethics Monitor | Candidate names, filing dates | Daily (automated) |
| party-data.json | Party affiliations | Manual enrichment |
| SC Election Commission | Official party data | March 2026 (when available) |

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Can't find all party affiliations | Medium | High | Use multiple sources, mark as unknown |
| SVG accessibility complex | Medium | Medium | Follow W3C guidelines |
| Black map bug returns | Low | Critical | E2E test specifically for this |
| Glassmorphic scope creep | Medium | Low | Strictly follow migration plan |

---

## Phase Execution Order

```
Phase 1 (Data) ────┐
                   ├──► Phase 3 (Testing) ──► Phase 4 (Design) ──► Phase 5 (Features)
Phase 2 (A11y) ────┘
```

Phases 1 and 2 can execute in parallel. Phases 3-5 are sequential.

---

## Files Reference

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | This file |
| `.planning/codebase/*.md` | Codebase documentation |
| `docs/GLASSMORPHIC_MIGRATION_PLAN.md` | Design system spec |
| `src/data/party-data.json` | Party enrichment data |
| `src/data/candidates.json` | Candidate filing data |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-13 | Initial PROJECT.md created via /sc:brainstorm analysis |
