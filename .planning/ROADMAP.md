# Roadmap: SC Election Map 2026 - API Integration

## Overview

Transform the SC Election Map from a static election visualization into a dynamic campaign intelligence platform by integrating BallotReady and TargetSmart APIs across 4 implementation tiers: Foundation (API infrastructure + quick wins), Strategic Intelligence (recruitment and mobilization), Enrichment (full data integration), and Advanced (party operations features).

## Domain Expertise

None (political data API integration - patterns established in PROJECT.md and API Integration Plan)

## Milestones

- 🚧 **v2.0 API Integration** - Phases 1-12 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

### Tier 1: Foundation

- [ ] **Phase 1: API Integration Layer** - BallotReady + TargetSmart clients with caching and error handling
- [ ] **Phase 2: Election Timeline** - Live dates from BallotReady, countdown timers, ICS calendar export
- [ ] **Phase 3: Polling Place Finder** - Location lookup, early voting locations, driving directions

### Tier 2: Strategic Intelligence

- [ ] **Phase 4: Recruitment Pipeline** - Empty competitive districts, filing requirements, deadline tracking
- [ ] **Phase 5: Electorate Profiles** - Partisan composition, turnout propensity per district (aggregated)
- [ ] **Phase 6: Mobilization Scoring** - "Sleeping giant" districts, enhanced opportunity tiers

### Tier 3: Enrichment

- [ ] **Phase 7: Candidate Enrichment** - Photos, bios, endorsements, issue stances from BallotReady
- [ ] **Phase 8: Turnout-Adjusted Scoring** - Predictive competitiveness combining historical + turnout models
- [ ] **Phase 9: Endorsement Dashboard** - Track endorsements, gap analysis, endorser database

### Tier 4: Advanced

- [ ] **Phase 10: Early Vote Tracking** - Real-time absentee/early vote returns by district
- [ ] **Phase 11: Resource Optimizer** - Field staff allocation based on combined API data
- [ ] **Phase 12: Down-Ballot Ecosystem** - Democratic strength mapping at all levels

---

## Phase Details

### Phase 1: API Integration Layer
**Goal**: Establish API infrastructure with BallotReady and TargetSmart clients
**Depends on**: Nothing (first phase)
**Research**: Likely (external APIs, authentication patterns, rate limiting)
**Research topics**: BallotReady API structure and endpoints, TargetSmart authentication, client-side caching strategies
**Plans**: TBD

Key deliverables:
- `src/lib/ballotready.ts` - BallotReady API client
- `src/lib/targetsmart.ts` - TargetSmart API client
- `src/types/ballotready.d.ts` - Type definitions
- `src/types/targetsmart.d.ts` - Type definitions
- `.env.local` configuration

### Phase 2: Election Timeline
**Goal**: Replace static election dates with live BallotReady data + countdown UI
**Depends on**: Phase 1
**Research**: Likely (BallotReady /elections endpoint, ICS format)
**Research topics**: BallotReady election date formats, ICS calendar export standards
**Plans**: TBD

Key deliverables:
- `src/components/VoterGuide/ElectionCountdown.tsx`
- Integration with Voter Guide page
- ICS calendar export for key dates

### Phase 3: Polling Place Finder
**Goal**: Address-based polling place lookup with early voting and directions
**Depends on**: Phase 1
**Research**: Likely (BallotReady polling place endpoint)
**Research topics**: BallotReady polling place data structure, Google Maps directions URL format
**Plans**: TBD

Key deliverables:
- `src/components/VoterGuide/PollingPlaceFinder.tsx`
- Early voting location display
- Driving directions integration

### Phase 4: Recruitment Pipeline
**Goal**: Identify competitive districts without Democratic candidates + filing info
**Depends on**: Phase 1, Phase 5
**Research**: Likely (BallotReady /officeholders, filing requirements)
**Research topics**: BallotReady officeholder data, filing deadline formats, eligibility requirements
**Plans**: TBD

Key deliverables:
- "Recruit" tab on /opportunities page
- `src/components/Intelligence/RecruitmentPipeline.tsx`
- Filing requirements display

### Phase 5: Electorate Profiles
**Goal**: Pre-computed voter intelligence per district (privacy-safe aggregates)
**Depends on**: Phase 1
**Research**: Likely (TargetSmart aggregation patterns)
**Research topics**: TargetSmart data enhancement API, privacy-safe aggregation design
**Plans**: TBD

Key deliverables:
- `public/data/voter-intelligence/house-profiles.json`
- `public/data/voter-intelligence/senate-profiles.json`
- `src/components/Intelligence/ElectorateProfile.tsx`

### Phase 6: Mobilization Scoring
**Goal**: Identify "sleeping giant" districts and enhance opportunity tiers
**Depends on**: Phase 5
**Research**: Likely (scoring algorithm design)
**Research topics**: TargetSmart turnout models, mobilization universe calculation
**Plans**: TBD

Key deliverables:
- `mobilizationUniverse` metric in opportunity scoring
- Enhanced strategic recommendations
- `src/components/Intelligence/MobilizationCard.tsx`

### Phase 7: Candidate Enrichment
**Goal**: Enhance CandidateCard with BallotReady profile data
**Depends on**: Phase 1
**Research**: Likely (BallotReady candidate data structure)
**Research topics**: BallotReady candidate photo URLs, bio formats, endorsement data
**Plans**: TBD

Key deliverables:
- Enhanced `src/components/Dashboard/CandidateCard.tsx`
- Photo, bio, endorsement display
- Campaign website/social links

### Phase 8: Turnout-Adjusted Scoring
**Goal**: Predictive competitiveness combining historical margins + turnout models
**Depends on**: Phase 5, Phase 6
**Research**: Likely (algorithm design)
**Research topics**: Combining TargetSmart turnout propensity with historical margins, weighting strategies
**Plans**: TBD

Key deliverables:
- New `adjustedOpportunityScore` calculation
- Districts ranked by predictive competitiveness
- Updated opportunity tiers

### Phase 9: Endorsement Dashboard
**Goal**: Track candidate endorsements and identify gaps
**Depends on**: Phase 7
**Research**: Likely (BallotReady endorsement data)
**Research topics**: BallotReady endorsement structure, endorser categorization
**Plans**: TBD

Key deliverables:
- Endorsement tracking view
- Gap analysis for candidates needing endorsements
- Democratic-aligned endorser database

### Phase 10: Early Vote Tracking
**Goal**: Real-time absentee/early vote returns by district (election season)
**Depends on**: Phase 1
**Research**: Likely (TargetSmart early vote data)
**Research topics**: TargetSmart early vote tracking API, update frequency, data availability timing
**Plans**: TBD

Key deliverables:
- Early vote dashboard component
- Per-district early vote metrics
- Comparison to previous elections

### Phase 11: Resource Optimizer
**Goal**: Recommend field staff allocation based on combined API data
**Depends on**: Phase 5, Phase 6, Phase 8
**Research**: Likely (complex algorithm design)
**Research topics**: Resource allocation algorithms, combining race density with voter universes
**Plans**: TBD

Key deliverables:
- Resource allocation recommendations
- "Where should our 10 field organizers go?" feature
- Export for party operations

### Phase 12: Down-Ballot Ecosystem
**Goal**: Map Democratic strength at all levels (school board, city council, etc.)
**Depends on**: Phase 1, Phase 7
**Research**: Likely (BallotReady full position hierarchy)
**Research topics**: BallotReady position types, local officeholder data, visualization approaches
**Plans**: TBD

Key deliverables:
- Full down-ballot position discovery
- Democratic strength visualization
- Long-term pipeline identification

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Tier | Plans Complete | Status | Completed |
|-------|------|----------------|--------|-----------|
| 1. API Integration | Foundation | 0/TBD | Not started | - |
| 2. Election Timeline | Foundation | 0/TBD | Not started | - |
| 3. Polling Place Finder | Foundation | 0/TBD | Not started | - |
| 4. Recruitment Pipeline | Intelligence | 0/TBD | Not started | - |
| 5. Electorate Profiles | Intelligence | 0/TBD | Not started | - |
| 6. Mobilization Scoring | Intelligence | 0/TBD | Not started | - |
| 7. Candidate Enrichment | Enrichment | 0/TBD | Not started | - |
| 8. Turnout-Adjusted Scoring | Enrichment | 0/TBD | Not started | - |
| 9. Endorsement Dashboard | Enrichment | 0/TBD | Not started | - |
| 10. Early Vote Tracking | Advanced | 0/TBD | Not started | - |
| 11. Resource Optimizer | Advanced | 0/TBD | Not started | - |
| 12. Down-Ballot Ecosystem | Advanced | 0/TBD | Not started | - |

---

## Verification Checklists

Each tier has a verification checklist in `claudedocs/gsd/verification/`:
- `tier-1-checklist.md` - Foundation verification
- `tier-2-checklist.md` - Intelligence verification
- `tier-3-checklist.md` - Enrichment verification
- `tier-4-checklist.md` - Advanced verification

## Tier Prompts

Execution prompts for each tier in `claudedocs/gsd/tier-prompts/`:
- `tier-1-foundation.md`
- `tier-2-intelligence.md`
- `tier-3-enrichment.md`
- `tier-4-advanced.md`
