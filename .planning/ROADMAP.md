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
- 🚧 **v1.1 SC Voter Guide Enhancement** - Phases 1-10 (in progress)
- 📋 **v2.0 Monorepo Architecture** - Phase B (PLANNED)
- 📋 **v3.0 SC Production** - Phase C (PLANNED)
- 📋 **v4.0 National Platform** - Phase D (PLANNED)

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

## 🚧 v1.1 SC Voter Guide Enhancement (In Progress)

**Milestone Goal:** Enhance the SC Voter Guide with complete data, improved UX, and production-ready code quality.

**Focus Areas:**
- Data quality improvements (county races, judicial, school board)
- UI/UX enhancements (component refactoring, DemoBadge, UX polish)
- Test coverage and performance optimization

### Phase 1: Data File Scaffolding (COMPLETE)

**Goal**: Create missing data files (judicial-races.json, school-board.json, ballot-measures.json, special-districts.json)
**Depends on**: Phase A complete
**Status**: COMPLETE (2026-01-17)

Plans:
- [x] 01-01: Copy Tier 3 data files to public/data/ (df74b56)

### Phase 2: County Candidate Data

**Goal**: Populate county-races.json with real incumbents (Sheriff, Coroner, Auditor, etc.)
**Depends on**: Phase 1
**Status**: COMPLETE (2026-01-17)

Plans:
- [x] 02-01: Scrape sheriffsc.org + sccounties.org, merge into county-races.json (019c82e)

### Phase 3: DemoBadge Integration (COMPLETE)

**Goal**: Add DemoBadge to all voter guide components displaying demo data
**Depends on**: Phase 2
**Status**: COMPLETE (2026-01-17)

Plans:
- [x] 03-01: Add DemoBadge to 6 demo data voter guide components (de9dc98)

### Phase 4: Voter Guide Decomposition

**Goal**: Break up 666-line voter-guide/page.tsx into smaller, testable components
**Depends on**: Phase 3
**Research**: Unlikely (refactoring internal code)
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: County Contact Extraction

**Goal**: Move hardcoded county election office URLs to public/data/county-contacts.json
**Depends on**: Phase 4
**Research**: Unlikely (data migration)
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Address UX Improvements

**Goal**: Add "Use My Location" button and localStorage address persistence
**Depends on**: Phase 5
**Research**: Likely (browser geolocation API)
**Research topics**: Geolocation API permissions, reverse geocoding workflow
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Error Handling & Validation

**Goal**: Improve error messaging for failed lookups and invalid addresses
**Depends on**: Phase 6
**Research**: Unlikely (UX patterns exist)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: Test Coverage

**Goal**: Add comprehensive tests for voter guide components and district lookup
**Depends on**: Phase 7
**Research**: Unlikely (testing patterns exist)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Performance Optimization

**Goal**: Implement GeoJSON caching and persistent data caching (localStorage/IndexedDB)
**Depends on**: Phase 8
**Research**: Likely (IndexedDB patterns, caching strategies)
**Research topics**: IndexedDB for GeoJSON, cache invalidation strategies
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Real Data Integration

**Goal**: Scrape SC Ethics Commission for real candidate data
**Depends on**: Phase 9
**Research**: Likely (external API/scraping)
**Research topics**: SC Ethics Commission API/HTML structure, data freshness requirements
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

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

| Phase | Milestone | Status | Progress |
|-------|-----------|--------|----------|
| Phase A | v1.0 | COMPLETE | 100% |
| 1. Data File Scaffolding | v1.1 | COMPLETE | 100% |
| 2. County Candidate Data | v1.1 | COMPLETE | 100% |
| 3. DemoBadge Integration | v1.1 | COMPLETE | 100% |
| 4. Voter Guide Decomposition | v1.1 | Not started | 0% |
| 5. County Contact Extraction | v1.1 | Not started | 0% |
| 6. Address UX Improvements | v1.1 | Not started | 0% |
| 7. Error Handling & Validation | v1.1 | Not started | 0% |
| 8. Test Coverage | v1.1 | Not started | 0% |
| 9. Performance Optimization | v1.1 | Not started | 0% |
| 10. Real Data Integration | v1.1 | Not started | 0% |
| Phase B | v2.0 | PLANNED | 0% |
| Phase C | v3.0 | PLANNED | 0% |
| Phase D | v4.0 | PLANNED | 0% |

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
