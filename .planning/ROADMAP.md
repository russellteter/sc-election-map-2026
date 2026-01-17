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

- **v1.0 Blue Intelligence Demo** - Phase A (COMPLETE)
- **v2.0 Monorepo Architecture** - Phase B (PLANNED)
- **v3.0 SC Production** - Phase C (PLANNED)
- **v4.0 National Platform** - Phase D (PLANNED)

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

| Phase | Status | Progress |
|-------|--------|----------|
| Phase A | COMPLETE | 100% |
| Phase B | PLANNED | 0% |
| Phase C | PLANNED | 0% |
| Phase D | PLANNED | 0% |

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
