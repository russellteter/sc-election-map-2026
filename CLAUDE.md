# Blue Intelligence - Claude Code Context

> **Primary entry point for Claude Code sessions**
> Last Updated: 2026-01-17 | Phase A Complete

---

## Project Status

| Phase | Status | Details |
|-------|--------|---------|
| **Phase A** | COMPLETE | 5 states, 876 districts, all 12 features |
| **Phase B** | PLANNED | Monorepo Migration |
| **Phase C** | PLANNED | SC Production Migration |
| **Phase D** | PLANNED | State Expansion |

**Live URL:** https://russellteter.github.io/sc-election-map-2026/

**Lighthouse Scores (Production):**
| Metric | Score |
|--------|-------|
| Performance | 100 |
| Accessibility | 94 |
| Best Practices | 96 |
| SEO | 100 |

---

## What is Blue Intelligence?

A **national 50-state election intelligence demo platform** for Democratic campaigns. Currently deployed with 5 states as a proof-of-concept:

| State | House | Senate | Total | Data Type |
|-------|-------|--------|-------|-----------|
| SC | 124 | 46 | 170 | Real + Demo |
| NC | 120 | 50 | 170 | Demo |
| GA | 180 | 56 | 236 | Demo |
| FL | 120 | 40 | 160 | Demo |
| VA | 100 | 40 | 140 | Demo |
| **Total** | **644** | **232** | **876** | |

---

## Quick Reference

| Purpose | Location |
|---------|----------|
| Mission & Strategy | `.planning/PROJECT.md` |
| Current Progress | `.planning/STATE.md` |
| Roadmap & Phases | `.planning/ROADMAP.md` |
| Full Context Bible | `claudedocs/BLUE-INTELLIGENCE-BIBLE.md` |
| Codebase Reference | `.planning/codebase/OVERVIEW.md` |
| Architecture | `docs/ARCHITECTURE.md` |
| Current State Metrics | `docs/CURRENT-STATE.md` |

---

## Context Loading Priority

For new Claude Code sessions, load context in this order:

1. **This file** (instant overview)
2. `.planning/PROJECT.md` (mission, constraints)
3. `.planning/STATE.md` (current progress)
4. `docs/CURRENT-STATE.md` (live metrics, feature matrix)
5. `claudedocs/BLUE-INTELLIGENCE-BIBLE.md` (deep context when needed)

---

## Critical Constraints

| Constraint | Requirement | Rationale |
|------------|-------------|-----------|
| Hosting | Static export to GitHub Pages | No server runtime available |
| API Keys | Client-side (`NEXT_PUBLIC_*`) | Read-only public demo data |
| Performance | <10KB initial payload | Mobile-first user base |
| Appearance | Neutral public UI | No overt Democratic branding |
| Demo Data | Clearly labeled with DemoBadge | Transparency for demo mode |

---

## Key Commands

```bash
# Development
npm run dev          # Development server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests

# Deployment
git push origin main # Auto-deploys via GitHub Actions
```

---

## GSD Workflow

This project uses the GSD (Get Stuff Done) system for structured execution.

```bash
/gsd:progress        # Check current state and route to next action
/gsd:plan-phase N    # Create detailed plan for phase N
/gsd:execute-plan    # Execute a PLAN.md file
/gsd:verify-work     # Manual UAT verification
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + Glassmorphic tokens |
| Build | Static export (`output: 'export'`) |
| Hosting | GitHub Pages |
| Maps | SVG district maps + GeoJSON boundaries |

---

## Feature Matrix (Phase A Complete)

| Feature | Status | Component |
|---------|--------|-----------|
| Interactive District Maps | Live | `DistrictMap.tsx` |
| Voter Guide | Live | `/voter-guide` |
| Electorate Profiles | Live | `ElectorateProfile.tsx` |
| Mobilization Scoring | Live | `MobilizationCard.tsx` |
| Early Vote Tracker | Live | `EarlyVoteTracker.tsx` |
| Resource Optimizer | Live | `ResourceOptimizer.tsx` |
| Endorsement Dashboard | Partial | Demo data only |
| National Landing Page | Live | US map with state selection |
| Multi-State Routing | Live | `/[state]/` dynamic routes |

---

## Data Tiering Strategy

```
LAYER 1: Real Free Data
├── Census boundaries (district shapes)
├── State election results (historical margins)
├── Google Civic API (polling places, election dates)
└── Census demographics (for algorithmic generation)

LAYER 2: Real Scraped Data (SC only)
├── SC Ethics Commission (candidate filings)
├── SC State party websites (verified Democrats)
└── OpenStates (incumbent info)

LAYER 3: Demo Generated Data (all states)
├── Voter intelligence profiles
├── Opportunity scores
├── Mobilization universes
├── Endorsements, early vote tracking
└── Resource optimization recommendations

LAYER 4: Unlockable (When Customer Pays)
├── BallotReady API -> Real candidate data
└── TargetSmart API -> Real voter intelligence
```

---

## Key Files

| Purpose | Location |
|---------|----------|
| Type definitions | `src/types/schema.ts` |
| State configurations | `src/config/states/` |
| Demo data generator | `src/lib/demoDataGenerator.ts` |
| Data loading | `src/lib/dataLoader.ts` |
| District lookup | `src/lib/districtLookup.ts` |
| Main pages | `src/app/` |
| Components | `src/components/` |
| Static data | `public/data/` |

---

## Guiding Principles

**DO:**
- Maintain professional, neutral-appearing public interface
- Use DemoBadge component to clearly label demo/generated data
- Follow existing component patterns
- Use the established type system
- Keep mobile performance optimized
- Prioritize Democratic-strategic features in background

**DON'T:**
- Add overt Democratic branding to public-facing UI
- Present demo data as real data
- Break the existing glassmorphic design system
- Introduce dependencies without clear justification
- Add features that don't serve the core mission

---

## Mission Statement

> **Build a national election intelligence platform that helps Democratic campaigns win.**

Every feature serves this goal. Phase A proves the concept with 5 states and demo data. Future phases will add real API integrations and expand to all 50 states.

---

*For detailed context, see `claudedocs/BLUE-INTELLIGENCE-BIBLE.md`*
