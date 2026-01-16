# SC Election Map 2026 - Political Data API Integration Plan

## Executive Summary

Integrate two powerful political data APIs (BallotReady and TargetSmart) into the SC Election Map to transform it from a static election visualization tool into a dynamic, data-rich campaign intelligence platform that helps Democrats win more elections in South Carolina.

### Key Decisions
- **Target Users**: Public voters + Democratic Party operations (dual-purpose tool)
- **API Security**: Client-side keys (simpler, stays on GitHub Pages)
- **Scope**: Full 12-feature roadmap across 4 implementation tiers

---

## Phase 1: API Research Findings

### Current SC Election Map Capabilities
- **Framework**: Next.js 16.1.1 with React 19.2.3, static export for GitHub Pages
- **Current Data**: SC Ethics Commission filings, historical election results (2020-2024), opportunity scoring
- **Features**: Interactive district map, voter guide (address lookup), election history, strategic analysis
- **Architecture**: 3-tier progressive data loading, TypeScript strict mode, comprehensive type system

### BallotReady API (CivicEngine)

**Authentication**: API Key via \`x-api-key\` header
**Base URL**: \`https://api.civicengine.com\`

**Key Endpoints**:
1. \`/elections\` - Election metadata, dates, candidate counts
2. \`/positions\` - All elected positions by address/location
3. \`/candidates\` - Candidate profiles, party, endorsements, photos

**Data Available**:
- Candidate profiles with bios, issue stances, endorsements
- Every elected position from local to federal
- 200,000+ officeholder records
- Polling place and early voting information
- District/subdistrict polygon data
- Filing requirements and eligibility info

**Query Capabilities**:
- Address-based lookup
- Lat/lon coordinate lookup
- Filter by level (federal/state/local/county)
- Filter by election_id
- Search radius up to 30 miles

### TargetSmart API

**Authentication**: API Key (client-provisioned)
**Base URL**: \`https://api.targetsmart.com\`

**Key Endpoints**:
1. \`/voter/voter-registration-check\` - Verify voter registration by name/address
2. \`/voter/voter-suggest\` - Low-latency voter search for interactive UIs
3. \`/person/data-enhance\` - Enrich records with demographic/political data
4. \`/service/district\` - District lookup services

**Data Available** (VoterBase - 208M+ voters):
- Voter registration status and history
- Vote history records
- Partisan scoring models
- Turnout prediction models
- Issue-support models
- Demographic data
- Political district assignments
- ContributorBase (6.7B+ in contribution records)
- Early voting/absentee tracking

**Query Capabilities**:
- Name + address search
- Wildcard searches
- Multiple ID type lookups (voterbase, phone, email, etc.)

---

## Phase 2: Strategic Integration Analysis

### BallotReady Integration Opportunities (7 Features)

| # | Feature | Complexity | Strategic Value |
|---|---------|------------|-----------------|
| 1 | **Live Candidate Profile Enrichment** - Photos, bios, endorsements, issue stances | Medium | Voter education, Democratic advantage |
| 2 | **Endorsement Intelligence Dashboard** - Track endorsements, identify gaps | Medium | Coalition building, strategic targeting |
| 3 | **Full Down-Ballot Discovery** - Replace static JSON with live ALL races | High | Complete voter engagement |
| 4 | **Candidate Recruitment Gap Finder** - Winnable races without Democrats + filing deadlines | Medium | **Critical for seat flipping** |
| 5 | **Polling Place & Early Voting Finder** - Location lookup with maps | Low | GOTV infrastructure |
| 6 | **Election Timeline & Deadline Intelligence** - Live dates, countdowns, calendar export | Low | Mobilization timing |
| 7 | **Competitive Race Intelligence** - BallotReady metrics + opportunity scoring | Medium | Resource allocation |

### TargetSmart Integration Opportunities (6 Features)

| # | Feature | Complexity | Strategic Value |
|---|---------|------------|-----------------|
| 1 | **District Electorate Composition** - Partisan breakdown, turnout profile, demographics | Medium | Understand WHO lives in each district |
| 2 | **Mobilization Opportunity Finder** - Low-turnout Dem-leaning voters by district | Medium | **GOTV prioritization** |
| 3 | **Persuasion Universe Calculator** - Swing voter concentrations, issue priorities | Medium-High | Message strategy |
| 4 | **Voter Registration Gap Analysis** - Unregistered voters by district | Low-Medium | Registration drive targeting |
| 5 | **Early Vote Tracking Dashboard** - Real-time absentee/early vote by district | High | Live campaign intelligence |
| 6 | **Contribution Network Intelligence** - Donor capacity and patterns by district | Medium | Fundraising strategy |

### Combined API Synergies (5 High-Value Use Cases)

| Priority | Use Case | Description |
|----------|----------|-------------|
| **MUST HAVE** | **Precision Candidate Recruitment Pipeline** | Combine BallotReady officeholder data (local elected officials who could run) with TargetSmart donor/activist data to identify and recruit candidates for empty competitive districts |
| **MUST HAVE** | **Turnout Modeling Dashboard** | Replace backward-looking margins with TargetSmart turnout propensity + BallotReady ballot depth to predict ACTUAL 2026 competitiveness |
| SHOULD HAVE | **Resource Optimizer** | Combine persuadable/mobilization universes (TargetSmart) with race density (BallotReady) to allocate field staff and ad spend |
| SHOULD HAVE | **Down-Ballot Ecosystem Map** | Map Democratic strength at ALL levels (school board, special districts) to build long-term pipeline |
| NICE TO HAVE | **Donor-Candidate Matchmaking** | Connect new candidates with donors who gave to similar races/issues |

---

## Phase 3: Recommended Implementation Approach

### Priority Tier 1: Foundation (Weeks 1-3)
**Quick wins + infrastructure**

1. **API Integration Layer**
   - Create \`/src/lib/ballotready.ts\` - API client with caching
   - Create \`/src/lib/targetsmart.ts\` - API client with caching
   - Secure credential storage in \`.env.local\`
   - Rate limiting and error handling

2. **Election Timeline Enhancement** (BallotReady - Low complexity)
   - Replace static \`election-dates.json\` with live API data
   - Add countdown timers to key deadlines
   - Calendar export (ICS) for voter mobilization dates

3. **Polling Place Finder** (BallotReady - Low complexity)
   - Add to Voter Guide after address lookup
   - Early voting locations and hours
   - Driving directions integration

### Priority Tier 2: Strategic Intelligence (Weeks 4-8)
**Core campaign value**

4. **Candidate Recruitment Gap Finder** (BallotReady + existing data)
   - New "Recruit" view on Opportunities page
   - Filter: \`hasDemocrat: false\` + \`opportunityScore >= 50\`
   - Display filing requirements, deadlines, eligibility
   - Show nearby Democratic officeholders who could run

5. **District Electorate Profiles** (TargetSmart - aggregated)
   - Partisan composition breakdown per district
   - Turnout propensity distribution
   - Pre-computed JSON files (privacy-safe aggregates)

6. **Mobilization Opportunity Scores** (TargetSmart)
   - Add \`mobilizationUniverse\` metric to opportunity scoring
   - Identify "sleeping giant" districts
   - Integrate into strategic recommendations

### Priority Tier 3: Enhanced Features (Weeks 9-12)
**Full integration**

7. **Candidate Profile Enrichment** (BallotReady)
   - Enhance CandidateCard with photos, bios, endorsements
   - Issue stances and policy positions
   - Campaign website and social links

8. **Turnout-Adjusted Opportunity Scoring**
   - Combine historical margins with TargetSmart turnout models
   - Account for ballot depth (BallotReady)
   - Recalculate opportunity tiers with predictive data

9. **Endorsement Dashboard**
   - Track which candidates have endorsements
   - Gap analysis for campaigns seeking endorsements

### Priority Tier 4: Advanced (Post-Launch)
**Party operations**

10. **Early Vote Tracking** (TargetSmart - election season only)
11. **Resource Optimizer** (Combined APIs)
12. **Down-Ballot Ecosystem Map** (BallotReady + TargetSmart)

---

## Phase 4: Technical Implementation Plan

### Architecture Decision: Hybrid Approach

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     SC Election Map                          │
├─────────────────────────────────────────────────────────────┤
│  Static Data (GitHub Pages)    │  Dynamic API Calls          │
│  ─────────────────────────────│──────────────────────────── │
│  • District boundaries (GeoJSON)│ • Polling place lookup     │
│  • Historical elections        │ • Election timeline         │
│  • Pre-computed opportunity    │ • Voter registration check  │
│  • Aggregated voter profiles   │ • Candidate enrichment      │
│  • Candidate base data         │   (on-demand)               │
└─────────────────────────────────────────────────────────────┘
\`\`\`

### API Key Security

**Option A: Client-Side (Simpler, Less Secure)** - SELECTED
\`\`\`env
NEXT_PUBLIC_BALLOTREADY_KEY=<your-key>
NEXT_PUBLIC_TARGETSMART_KEY=<your-key>
\`\`\`
- Keys exposed in browser
- Acceptable for read-only public data
- Add domain restrictions if APIs support it

**Option B: Serverless Proxy (More Secure, More Complex)**
- Deploy API routes on Vercel/Netlify
- Keys stored server-side only
- Requires moving off pure GitHub Pages

### New Files to Create

\`\`\`
src/lib/
  ballotready.ts       # BallotReady API client
  targetsmart.ts       # TargetSmart API client
  voterIntelligence.ts # Aggregation utilities

src/types/
  ballotready.d.ts     # BallotReady response types
  targetsmart.d.ts     # TargetSmart response types
  voterIntelligence.ts # New intelligence data types

src/components/
  Intelligence/
    ElectorateProfile.tsx
    MobilizationCard.tsx
    RecruitmentPipeline.tsx
  VoterGuide/
    PollingPlaceFinder.tsx
    ElectionCountdown.tsx

public/data/
  voter-intelligence/
    house-profiles.json   # Pre-computed district profiles
    senate-profiles.json
    mobilization-scores.json
\`\`\`

### Key Files to Modify

| File | Changes |
|------|---------|
| \`src/types/schema.ts\` | Extend with BallotReady/TargetSmart types |
| \`src/lib/dataLoader.ts\` | Add API data sources to tiered loading |
| \`src/app/opportunities/page.tsx\` | Add Recruitment view, new metrics |
| \`src/components/Dashboard/CandidateCard.tsx\` | Enrich with BallotReady data |
| \`src/components/Race/StrategicInsights.tsx\` | Add voter intelligence metrics |
| \`src/app/voter-guide/page.tsx\` | Add polling place, early voting |
| \`.env.local\` (create) | Store API credentials |
| \`.env.example\` | Document required credentials |

### Data Refresh Strategy

| Data Type | Refresh Frequency | Storage |
|-----------|-------------------|---------|
| Election dates/deadlines | Daily | API call |
| Candidate profiles | 6-hour cache | API + local cache |
| Polling places | 1-hour cache | API call |
| Voter aggregates | Weekly batch | Static JSON |
| Early vote tracking | Daily (election season) | API call |

---

## Verification Plan

### Phase 1 Verification
- [ ] API clients successfully authenticate
- [ ] Election timeline displays live data
- [ ] Polling place finder returns results for SC addresses

### Phase 2 Verification
- [ ] Recruitment gap finder shows correct districts
- [ ] Electorate profiles display for all 170 districts
- [ ] Mobilization scores integrate with opportunity tiers

### Phase 3 Verification
- [ ] Candidate cards show enriched profiles
- [ ] Turnout-adjusted scores differ from historical-only scores
- [ ] Endorsement dashboard populates correctly

### End-to-End Test
1. Enter SC address in Voter Guide
2. Verify all races display (expanded via BallotReady)
3. Click district → verify enhanced strategic insights
4. Check Opportunities page → verify new recruitment and mobilization columns
5. Export CSV → verify new fields included

---

## API Credentials

Store in \`.env.local\` (gitignored):
\`\`\`env
NEXT_PUBLIC_BALLOTREADY_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131
NEXT_PUBLIC_TARGETSMART_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7
\`\`\`

**Security Notes**:
- \`.env.local\` is gitignored by default in Next.js
- Consider domain restrictions if APIs support it
- Consider server-side proxy for sensitive voter data operations

---

## Sources

- [BallotReady API Documentation](https://organizations.ballotready.org/ballotready-api)
- [BallotReady Developer Portal](https://developers.civicengine.com/)
- [TargetSmart API Overview](https://docs.targetsmart.com/developers/tsapis/v2/index.html)
- [TargetSmart Data Products](https://docs.targetsmart.com/my_tsmart/data-products.html)
- [NGPVan Getting Started](https://docs.ngpvan.com/docs/getting-started)
