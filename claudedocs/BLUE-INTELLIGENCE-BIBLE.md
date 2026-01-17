# Blue Intelligence - Project Bible

> **The definitive reference document for the Blue Intelligence project.**
> This document serves as the north star for all development, ensuring alignment with mission, strategic context, and technical standards.
> Last Updated: 2026-01-17 | Phase A Complete

---

## Part 1: Mission & Vision

### 1.1 The Core Mission

**Build a national election intelligence platform that helps Democratic campaigns win.**

Blue Intelligence is designed to be a comprehensive campaign intelligence tool that transforms raw election data into actionable strategic insights. While it presents as a professional, fact-based election resource, every architectural decision, data integration, and feature prioritization serves the strategic goal of expanding Democratic representation.

### 1.2 The Problem We're Solving

Democratic campaigns face structural challenges:
1. **No centralized intelligence**: Campaign decisions made with incomplete data
2. **Recruitment gaps**: Competitive districts go uncontested
3. **Resource misallocation**: Money and volunteers deployed inefficiently
4. **Voter disconnection**: No comprehensive tool connecting voters to Democratic candidates

### 1.3 The Vision

Transform election data from **static information** into a **dynamic campaign intelligence platform** that:

1. **For Voters**: Provides comprehensive, personalized ballot information
2. **For Party Staff**: Surfaces strategic opportunities across all districts
3. **For Candidates**: Identifies recruitment opportunities and funding sources
4. **For Campaigns**: Enables data-driven resource allocation

### 1.4 Success Metrics

| Metric | Phase A | Future Target |
|--------|---------|---------------|
| States deployed | 5 | 50 |
| Total districts | 876 | 5,000+ |
| Features implemented | 12 | 12+ with real data |
| Lighthouse Performance | 100 | >90 |
| Lighthouse Accessibility | 94 | >95 |
| Real API integrations | 0 | 2+ |

---

## Part 2: Strategic Context

### 2.1 The Political Landscape

Blue Intelligence is designed for **all 50 states** but currently demonstrates with 5 southeastern states:

| State | House | Senate | Total | Data Type |
|-------|-------|--------|-------|-----------|
| South Carolina | 124 | 46 | 170 | Real + Demo |
| North Carolina | 120 | 50 | 170 | Demo |
| Georgia | 180 | 56 | 236 | Demo |
| Florida | 120 | 40 | 160 | Demo |
| Virginia | 100 | 40 | 140 | Demo |
| **Total** | **644** | **232** | **876** | |

### 2.2 The Dual-Purpose Strategy

The tool operates on two levels:

**Public Layer** (Voter-Facing):
- Clean, professional, neutral-appearing interface
- Comprehensive ballot information for any address
- No overt partisan branding
- Builds trust and drives traffic

**Strategic Layer** (Party Operations):
- Opportunity scoring algorithms
- Recruitment pipeline identification
- Mobilization universe calculations
- Endorsement tracking
- Resource allocation tools
- Clearly labeled as demo data (DemoBadge component)

### 2.3 Key Stakeholders

| Stakeholder | Primary Needs | Features Serving Them |
|-------------|---------------|----------------------|
| State Democratic Party | Statewide strategy, resource allocation | Opportunity tiers, recruitment pipeline |
| House/Senate Caucus | Incumbent protection, pickup identification | Defensive flagging, competitive race analysis |
| Individual Campaigns | Voter data, fundraising leads | Electorate profiles, donor intelligence |
| General Voters | Ballot information | Voter guide, polling places |
| Potential Candidates | Filing info, district viability | Recruitment gap finder, eligibility requirements |

---

## Part 3: Current State (Phase A Complete)

### 3.1 What Exists Today

**Live URL**: https://russellteter.github.io/sc-election-map-2026/

**Core Features** (All 12 phases implemented):
1. **Interactive District Maps** - 876 clickable districts across 5 states
2. **Voter Guide** - Address-based personalized ballot lookup
3. **Race Detail Pages** - Historical data, incumbents, candidates
4. **Strategic Opportunities** - Tier-based district classification
5. **Electorate Profiles** - Partisan composition, turnout propensity
6. **Mobilization Scoring** - "Sleeping giant" district identification
7. **Early Vote Tracker** - Absentee/early vote tracking (demo)
8. **Resource Optimizer** - Field staff allocation recommendations
9. **Endorsement Dashboard** - Track endorsements, gap analysis
10. **Down-Ballot Ecosystem** - Democratic strength mapping
11. **National Landing Page** - US map with state selection
12. **Multi-State Routing** - Dynamic `/[state]/` routes

### 3.2 Data Tiering Strategy

```
LAYER 1: Real Free Data
├── Census boundaries (district shapes)
├── State election results (historical margins)
├── Google Civic API (polling places, election dates)
└── Census demographics (for algorithmic generation)

LAYER 2: Real Scraped Data (SC only)
├── SC Ethics Commission (candidate filings)
├── State party websites (verified Democrats)
└── OpenStates (incumbent info)

LAYER 3: Demo Generated Data (all states)
├── Voter intelligence profiles
├── Opportunity scores
├── Mobilization universes
├── Endorsements, early vote tracking
└── Resource optimization recommendations

LAYER 4: Unlockable (When Customer Pays)
├── BallotReady API -> Real candidate data, positions
└── TargetSmart API -> Real voter intelligence
```

### 3.3 Technical Architecture

**Stack**:
- Next.js 16 + React 19
- TypeScript (strict mode)
- Tailwind CSS v4 + Glassmorphic design system
- Static export to GitHub Pages

**Data Loading Strategy** (Progressive 3-Tier):
```
Tier 1 (Critical, <10KB): State metadata, election dates
↓ Loaded immediately
Tier 2 (On-Demand, ~100KB): Candidates, district data
↓ Loaded after user action
Tier 3 (Deferred, ~30KB): Intelligence features
↓ Lazy loaded on scroll
```

**Performance** (Phase A Results):
- Lighthouse Performance: 100
- Lighthouse Accessibility: 94
- Lighthouse Best Practices: 96
- Lighthouse SEO: 100
- Initial payload: <10KB
- Build time: <10 seconds

### 3.4 Key Files & Locations

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
| GeoJSON boundaries | `public/data/*.geojson` |
| SVG maps | `public/maps/[state]/` |

---

## Part 4: Future Transformation (Phases B, C, D)

### 4.1 Phase B: Monorepo Migration

**Trigger**: First paying customer OR second contributor

**Goal**: Restructure into Turborepo monorepo for:
- Scalable multi-package architecture
- Shared component libraries
- Independent deployments per state
- Better CI/CD pipeline

### 4.2 Phase C: SC Production Migration

**Trigger**: Phase B complete + SC Democratic Party contract

**Goal**: Migrate South Carolina from demo data to real API integrations:
- BallotReady API for candidate data
- TargetSmart API for voter intelligence
- Real-time data updates

### 4.3 Phase D: State Expansion

**Trigger**: Phase C success + additional state contracts

**Goal**: Expand to all 50 states with:
- Regional batch deployments
- Per-state customization
- Scalable data pipeline

---

## Part 5: API Integration (Future)

### 5.1 BallotReady API (CivicEngine)

**What It Is**: The most comprehensive database of U.S. elections and elected officials.

**Authentication**: API Key via `x-api-key` header
**Base URL**: `https://api.civicengine.com`

**Key Endpoints**:
| Endpoint | Purpose | Strategic Value |
|----------|---------|-----------------|
| `/elections` | Election metadata, dates | Timeline intelligence |
| `/positions` | All elected positions by address | Down-ballot discovery |
| `/candidates` | Profiles, endorsements, photos | Candidate enrichment |
| `/polling-places` | Voting locations | GOTV infrastructure |
| `/officeholders` | 200K+ current officials | Recruitment pipeline |

### 5.2 TargetSmart API

**What It Is**: The Democratic Party's voter file and modeling platform.

**Authentication**: API Key
**Base URL**: `https://api.targetsmart.com`

**Key Endpoints**:
| Endpoint | Purpose | Strategic Value |
|----------|---------|-----------------|
| `/voter/voter-registration-check` | Verify registration | Registration drives |
| `/voter/voter-suggest` | Search voters | Interactive lookup |
| `/person/data-enhance` | Enrich with models | Targeting intelligence |
| `/service/district` | District lookup | Geographic targeting |

---

## Part 6: Technical Specifications

### 6.1 Architecture: Static Export

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Blue Intelligence Architecture                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────┐    ┌─────────────────────────┐            │
│  │   STATIC DATA           │    │   DEMO GENERATED        │            │
│  │   (GitHub Pages)        │    │   (Build Time)          │            │
│  ├─────────────────────────┤    ├─────────────────────────┤            │
│  │ • GeoJSON boundaries    │    │ • Voter profiles        │            │
│  │ • Historical elections  │    │ • Opportunity scores    │            │
│  │ • SVG district maps     │    │ • Mobilization metrics  │            │
│  │ • State configurations  │    │ • Early vote data       │            │
│  └─────────────────────────┘    └─────────────────────────┘            │
│                                                                          │
│  Decision: Static export (no server runtime required)                    │
│  Rationale: GitHub Pages hosting, simple deployment                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 State Configuration System

Each state has a configuration file in `src/config/states/`:

```typescript
// src/config/states/sc.ts
export const scConfig: StateConfig = {
  code: 'SC',
  name: 'South Carolina',
  chambers: {
    house: { seats: 124, name: 'SC House' },
    senate: { seats: 46, name: 'SC Senate' }
  },
  dataSource: 'real+demo', // or 'demo' for other states
  features: {
    voterGuide: true,
    intelligenceFeatures: true,
    endorsements: true
  }
};
```

### 6.3 Demo Data Generator

The `demoDataGenerator.ts` creates realistic demo data based on:
- Historical election margins
- Census demographics
- District characteristics
- Regional patterns

All demo data is clearly labeled with the DemoBadge component.

---

## Part 7: Operational Guidelines for Claude Code

### 7.1 Mission Alignment

**ALWAYS REMEMBER**: This tool exists to help Democrats win elections. Every feature, every decision, every line of code should serve this mission.

**When implementing features, ask yourself**:
1. Does this help identify competitive districts?
2. Does this help recruit candidates?
3. Does this help mobilize voters?
4. Does this help allocate resources efficiently?

If the answer is "no" to all four, reconsider the feature.

### 7.2 Design Principles

**DO**:
- Maintain the professional, neutral-appearing public interface
- Use DemoBadge component to clearly label demo data
- Follow existing component patterns
- Use the established type system
- Leverage the progressive data loading strategy
- Keep mobile performance optimized (<10KB initial)
- Build for 50-state scalability

**DON'T**:
- Add overt Democratic branding to public-facing UI
- Present demo data as real data
- Break the existing glassmorphic design system
- Introduce new dependencies without clear justification
- Create one-off components that don't follow patterns
- Add features that don't serve the core mission
- Hardcode state-specific logic (use config system)

### 7.3 Code Patterns to Follow

**Component Creation**:
```typescript
interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'muted';
  state?: StateCode;
}

export function Component({ variant = 'default', state, ...props }: ComponentProps) {
  const config = useStateConfig(state);
  return <div className={variantStyles[variant]} {...props} />;
}
```

**Data Loading**:
```typescript
import { dataLoader } from '@/lib/dataLoader';

const data = await dataLoader.loadStateData(stateCode, {
  tier: 'critical' | 'onDemand' | 'deferred'
});
```

### 7.4 Quality Gates

**Before Committing**:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Feature serves the Democratic mission
- [ ] Mobile performance not degraded
- [ ] Follows existing patterns
- [ ] Demo data clearly labeled

**Before Deploying**:
- [ ] Test on mobile viewport (375px)
- [ ] Verify all 5 states render correctly
- [ ] Check Lighthouse scores >90
- [ ] Confirm demo badges visible where needed

---

## Part 8: Verification & Testing

### 8.1 Phase A Complete Verification

All items verified on 2026-01-17:
- [x] 5 states deployed (SC, NC, GA, FL, VA)
- [x] 876 districts with interactive maps
- [x] All 12 features implemented
- [x] DemoBadge component in place
- [x] Lighthouse scores >90 all categories
- [x] Mobile optimization verified

### 8.2 Ongoing Quality Checks

**Performance Budgets**:
| Metric | Target | Current |
|--------|--------|---------|
| Initial payload | <10KB | <10KB |
| Build time | <30s | <10s |
| Largest JS chunk | <300KB | Within budget |
| Lighthouse Performance | >90 | 100 |
| Lighthouse Accessibility | >90 | 94 |

---

## Part 9: Reference Information

### 9.1 Documentation Links

| Document | Purpose |
|----------|---------|
| `/CLAUDE.md` | Primary Claude Code entry point |
| `.planning/PROJECT.md` | Mission and strategic context |
| `.planning/STATE.md` | Current progress |
| `.planning/ROADMAP.md` | Phase B, C, D plans |
| `docs/CURRENT-STATE.md` | Live metrics, feature matrix |
| `.planning/codebase/OVERVIEW.md` | Technical codebase reference |

### 9.2 Project URLs

- **Live Site**: https://russellteter.github.io/sc-election-map-2026/
- **Repository**: https://github.com/russellteter/sc-election-map-2026

### 9.3 Key Commands

```bash
# Development
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests

# GSD Workflow
/gsd:progress        # Check current state
/gsd:plan-phase N    # Plan next phase
```

---

## Appendix: Quick Reference Card

### Key Files
```
src/types/schema.ts          # Type definitions
src/config/states/           # State configurations
src/lib/demoDataGenerator.ts # Demo data generation
src/lib/dataLoader.ts        # Data loading
src/app/                     # Pages and routes
src/components/              # UI components
```

### Mission Statement
**Build a national election intelligence platform that helps Democratic campaigns win.**

Every feature serves this goal. Phase A proves the concept with 5 states and demo data. Future phases will add real API integrations and expand to all 50 states.
