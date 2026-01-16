# SC Election Map 2026 - Project Definition

> Generated: 2026-01-16 | GSD Project Initialization

---

## Mission

**Help Democrats win more elections in South Carolina.**

Transform the SC Election Map from a static election visualization into a dynamic campaign intelligence platform that:
1. **For Voters**: Provides comprehensive, personalized ballot information
2. **For Party Staff**: Surfaces strategic opportunities across all 170 districts
3. **For Candidates**: Identifies recruitment opportunities and funding sources
4. **For Campaigns**: Enables data-driven resource allocation

---

## Strategic Context

**South Carolina 2026 Election Cycle**:
- All 124 House seats on ballot
- ~23 of 46 Senate seats on ballot (staggered terms)
- Governor, Attorney General, other statewide offices
- County offices, school boards, special districts

**Current State**:
- SC House: 124 seats, ~79% Republican control
- SC Senate: 46 seats, ~80% Republican control
- Only ~40 of 124 House districts have Democratic candidates

**Dual-Purpose Strategy**:
- **Public Layer**: Clean, professional, neutral-appearing voter information tool
- **Strategic Layer**: Opportunity scoring, recruitment pipeline, mobilization targeting

---

## Validated Capabilities (Current Foundation)

These features are **live and working** at https://russellteter.github.io/sc-election-map-2026/

| Feature | Description | Status |
|---------|-------------|--------|
| Interactive District Map | 170 clickable districts (124 House + 46 Senate) with color-coded party status | LIVE |
| Voter Guide | Address-based personalized ballot lookup via Geoapify geocoding | LIVE |
| Race Detail Pages | Historical data (2020-2024), incumbents, candidate information | LIVE |
| Strategic Opportunities | Tier-based district classification (HIGH_OPPORTUNITY, EMERGING, BUILD, etc.) | LIVE |
| Table View | Sortable/filterable data with CSV export | LIVE |
| Progressive Data Loading | 3-tier system: 6.5KB critical → 95KB on-demand → 30KB deferred | LIVE |
| Mobile Optimization | <10KB initial payload, 177 pre-rendered static pages | LIVE |

**Current Data Sources**:
- SC Ethics Commission (candidate filings)
- kjatwood SCHouseMap7.0 (Democratic candidate verification)
- SC Election Commission (historical results 2020-2024)
- Geoapify (address geocoding)
- Static GeoJSON (district boundaries)

---

## Active Requirements (API Integration)

### API Access

**BallotReady API** (CivicEngine):
- Base URL: `https://api.civicengine.com`
- Authentication: `x-api-key` header
- Capabilities: Elections, positions, candidates, polling places, officeholders

**TargetSmart API**:
- Base URL: `https://api.targetsmart.com`
- Authentication: API Key
- Capabilities: Voter registration, voter search, data enhancement, district lookup

### Feature Roadmap

#### Tier 1: Foundation
1. **API Integration Layer** - BallotReady + TargetSmart clients with caching
2. **Election Timeline Enhancement** - Live dates, countdown timers, calendar export
3. **Polling Place Finder** - Location lookup, early voting, driving directions

#### Tier 2: Strategic Intelligence
4. **Candidate Recruitment Gap Finder** - Empty competitive districts + filing requirements
5. **District Electorate Profiles** - Partisan composition, turnout propensity (aggregated)
6. **Mobilization Opportunity Scores** - "Sleeping giant" district identification

#### Tier 3: Enrichment
7. **Candidate Profile Enrichment** - Photos, bios, endorsements, issue stances
8. **Turnout-Adjusted Opportunity Scoring** - Predictive competitiveness models
9. **Endorsement Dashboard** - Track endorsements, gap analysis

#### Tier 4: Advanced (Post-Launch)
10. **Early Vote Tracking** - Real-time absentee/early vote by district
11. **Resource Optimizer** - Field staff allocation recommendations
12. **Down-Ballot Ecosystem Map** - Democratic strength at all levels

---

## Technical Constraints

| Constraint | Requirement | Rationale |
|------------|-------------|-----------|
| Hosting | Static export to GitHub Pages | No server runtime available |
| API Keys | Client-side (`NEXT_PUBLIC_*`) | Acceptable for read-only public data |
| Performance | <10KB initial payload | Mobile-first user base |
| Build Time | <15 seconds | Developer velocity |
| Bundle Size | <3MB total | CDN efficiency |
| Appearance | Neutral public UI | Builds trust, drives traffic |
| Strategy | Hidden backend features | Opportunity scoring stays hidden |

---

## Success Metrics

| Metric | Current State | Target State |
|--------|---------------|--------------|
| Districts with Democratic candidates | ~40 of 124 House | 80+ of 124 House |
| Competitive races identified | Historical margins only | Turnout-adjusted projections |
| Down-ballot coverage | State legislature only | All elected positions |
| Data freshness | Manual updates | Live API integration |
| User actionability | View-only | Export, recruit, mobilize |

---

## Key Files

| Purpose | Location |
|---------|----------|
| Type definitions | `src/types/schema.ts` |
| Data loading | `src/lib/dataLoader.ts` |
| District lookup | `src/lib/districtLookup.ts` |
| Constants | `src/lib/constants.ts` |
| Main pages | `src/app/` (page.tsx, voter-guide/, opportunities/, race/) |
| Components | `src/components/` |
| Static data | `public/data/*.json` |
| GeoJSON boundaries | `public/data/*.geojson` |

---

## Guiding Principles

**DO**:
- Maintain professional, neutral-appearing public interface
- Prioritize Democratic-strategic features in the background
- Follow existing component patterns
- Use the established type system
- Leverage the 3-tier data loading strategy
- Keep mobile performance optimized

**DON'T**:
- Add overt Democratic branding to public-facing UI
- Expose opportunity scoring algorithms prominently
- Break the existing glassmorphic design system
- Introduce dependencies without clear justification
- Create one-off components that don't follow patterns
- Add features that don't serve the core mission

---

## Documentation References

- **Project Bible**: `claudedocs/# SC Election Map 2026 - Project Bible.md`
- **API Integration Plan**: `claudedocs/api-integration-plan.md`
- **Codebase Mapping**: `.planning/codebase/` (7 documents)
- **GSD Prompts**: `claudedocs/gsd/tier-prompts/`
- **Verification Checklists**: `claudedocs/gsd/verification/`

---

*Every feature serves the mission: Help Democrats win more elections in South Carolina.*
