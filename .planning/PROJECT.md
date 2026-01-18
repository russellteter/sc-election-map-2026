# Blue Intelligence - Project Definition

> Generated: 2026-01-17 | v1.1 Shipped 2026-01-18

---

## Current State (v1.1 Shipped)

**Live URL:** https://russellteter.github.io/sc-election-map-2026/

**What shipped:**
- 5 states deployed (SC, NC, GA, FL, VA) with 876 districts
- All 12 intelligence features with demo data
- SC Voter Guide with real county officials, Ethics Commission scraper integration
- 155 tests passing, comprehensive coverage
- Persistent caching (IndexedDB for GeoJSON, localStorage for JSON)
- Mobile-optimized with Lighthouse scores 100/94/96/100

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Turf.js
**LOC:** 24,219 TypeScript

---

## Mission

**Build a national election intelligence platform that helps Democratic campaigns win.**

Blue Intelligence transforms election data into strategic campaign intelligence that:
1. **For Voters**: Provides comprehensive, personalized ballot information
2. **For Party Staff**: Surfaces strategic opportunities across all districts
3. **For Candidates**: Identifies recruitment opportunities and resources
4. **For Campaigns**: Enables data-driven resource allocation

---

## Strategic Context

### The Vision: 50-State Platform

Blue Intelligence is designed as a **national platform** that can scale to all 50 states. Phase A demonstrates the concept with 5 southeastern states:

| State | Districts | Data Type | Status |
|-------|-----------|-----------|--------|
| South Carolina | 170 | Real + Demo | Live |
| North Carolina | 170 | Demo | Live |
| Georgia | 236 | Demo | Live |
| Florida | 160 | Demo | Live |
| Virginia | 140 | Demo | Live |
| **Total** | **876** | | |

### Current State (Phase A Complete)

- **5 states deployed** with full feature set
- **876 total districts** with interactive maps
- **All 12 features** implemented with demo data
- **Lighthouse scores**: 100/94/96/100
- **Mobile-optimized** with <10KB initial payload

### Dual-Purpose Strategy

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
- Clearly labeled as demo data until real APIs integrated

---

## Data Tiering Strategy

### LAYER 1: Real Free Data
- Census boundaries (district shapes)
- State election results (historical margins)
- Google Civic API (polling places, election dates)
- Census demographics (for algorithmic generation)

### LAYER 2: Real Scraped Data
- SC Ethics Commission (candidate filings)
- State party websites (verified Democrats)
- OpenStates (incumbent info)
- *Currently SC only, expandable per state*

### LAYER 3: Demo Generated Data
- Voter intelligence profiles
- Opportunity scores
- Mobilization universes
- Endorsements, early vote tracking
- Resource optimization recommendations
- *Clearly labeled with DemoBadge component*

### LAYER 4: Unlockable (Customer Integration)
- BallotReady API -> Real candidate data, positions
- TargetSmart API -> Real voter intelligence
- *Available when paying customer provides API access*

---

## Technical Constraints

| Constraint | Requirement | Rationale |
|------------|-------------|-----------|
| Hosting | Static export to GitHub Pages | No server runtime available |
| API Keys | Client-side (`NEXT_PUBLIC_*`) | Acceptable for read-only data |
| Performance | <10KB initial payload | Mobile-first user base |
| Build Time | <30 seconds | Developer velocity |
| Bundle Size | <5MB total | CDN efficiency |
| Appearance | Neutral public UI | Builds trust, drives traffic |
| Demo Data | Clearly labeled | Transparency and trust |

---

## Success Metrics

### Phase A (Complete)

| Metric | Target | Achieved |
|--------|--------|----------|
| States deployed | 5 | 5 |
| Total districts | 800+ | 876 |
| Features implemented | 12 | 12 |
| Lighthouse Performance | >90 | 100 |
| Lighthouse Accessibility | >90 | 94 |
| Mobile optimization | <10KB | <10KB |

### Future Phases

| Metric | Phase B | Phase C | Phase D |
|--------|---------|---------|---------|
| States | 5 | 5 | 50 |
| Real data states | 0 | 1 (SC) | 5+ |
| API integrations | 0 | 2 | 2 |
| Paying customers | 0 | 1 | 3+ |

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
| GeoJSON boundaries | `public/data/*.geojson` |

---

## Guiding Principles

**DO:**
- Maintain professional, neutral-appearing public interface
- Use DemoBadge component to clearly label demo data
- Follow existing component patterns
- Use the established type system
- Leverage progressive data loading strategy
- Keep mobile performance optimized
- Build for 50-state scalability

**DON'T:**
- Add overt Democratic branding to public-facing UI
- Present demo data as real data
- Break the existing glassmorphic design system
- Introduce dependencies without clear justification
- Create one-off components that don't follow patterns
- Add features that don't serve the core mission
- Hardcode state-specific logic (use config system)

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `/CLAUDE.md` | Primary Claude Code entry point |
| `claudedocs/BLUE-INTELLIGENCE-BIBLE.md` | Complete strategic context |
| `docs/CURRENT-STATE.md` | Live metrics, feature matrix |
| `docs/FUTURE-PHASES.md` | Phase B, C, D details |
| `.planning/codebase/OVERVIEW.md` | Technical codebase reference |
| `claudedocs/gsd/tier-prompts/` | Execution prompts |
| `claudedocs/gsd/verification/` | Verification checklists |

---

## Requirements

### Validated (v1.1)

- Interactive district maps with 876 districts across 5 states - v1.0
- 12 intelligence features with demo data generation - v1.0
- DemoBadge component for transparent demo data labeling - v1.0
- Mobile optimization with <10KB initial payload - v1.0
- Real county official data scraped from sheriffsc.org/sccounties.org - v1.1
- Voter Guide page refactored to testable components - v1.1
- Comprehensive test coverage (155 tests, >90% validation) - v1.1
- Persistent caching (IndexedDB/localStorage) - v1.1
- SC Ethics Commission scraper integration - v1.1
- Address validation with user-friendly error messages - v1.1

### Active (v2.0+)

- [ ] Monorepo migration (Turborepo)
- [ ] BallotReady API client implementation
- [ ] TargetSmart API client implementation
- [ ] Multi-contributor workflow support
- [ ] Per-state production deployments

### Out of Scope

- Mobile native apps - web-first approach, PWA sufficient
- Offline mode - real-time data is core value
- Video chat features - use external tools
- Breaking static export compatibility - GitHub Pages constraint

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Demo data strategy | Enable full demo without paid APIs | Good - demonstrates all features |
| 5-state regional focus | Prove concept before 50-state expansion | Good - validated architecture |
| DemoBadge component | Clear labeling of demo vs real data | Good - builds trust |
| Extract hooks before components | Data logic first, then UI extraction | Good - clean separation |
| IndexedDB for GeoJSON | Large data (~2MB) needs structured storage | Good - fast repeat visits |
| Pre-flight validation | Reduce unnecessary API calls | Good - immediate feedback |

---

*Last updated: 2026-01-18 after v1.1 milestone*

*Every feature serves the mission: Build a national election intelligence platform that helps Democratic campaigns win.*
