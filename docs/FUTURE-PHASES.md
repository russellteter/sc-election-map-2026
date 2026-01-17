# Blue Intelligence - Future Phases

> Detailed planning for Phase B, C, and D
> Last Updated: 2026-01-17

---

## Phase B: Monorepo Migration

### Trigger
- First paying customer, OR
- Second active contributor

### Goal
Restructure the codebase into a Turborepo monorepo for scalable multi-package architecture.

### Proposed Structure

```
blue-intelligence/
├── apps/
│   ├── demo/                 # Current 5-state demo (GitHub Pages)
│   │   ├── package.json
│   │   └── src/
│   ├── sc-prod/              # SC production site (Phase C)
│   │   ├── package.json
│   │   └── src/
│   └── national/             # 50-state platform (Phase D)
│       ├── package.json
│       └── src/
│
├── packages/
│   ├── ui/                   # Shared component library
│   │   ├── package.json
│   │   └── src/
│   │       ├── DemoBadge.tsx
│   │       ├── CandidateCard.tsx
│   │       └── index.ts
│   │
│   ├── intelligence/         # Intelligence components
│   │   ├── package.json
│   │   └── src/
│   │       ├── ElectorateProfile.tsx
│   │       ├── MobilizationCard.tsx
│   │       └── ResourceOptimizer.tsx
│   │
│   ├── maps/                 # Map rendering
│   │   ├── package.json
│   │   └── src/
│   │       ├── DistrictMap.tsx
│   │       ├── USMap.tsx
│   │       └── Legend.tsx
│   │
│   ├── data/                 # Data loading utilities
│   │   ├── package.json
│   │   └── src/
│   │       ├── dataLoader.ts
│   │       ├── demoDataGenerator.ts
│   │       └── types.ts
│   │
│   └── config/               # State configuration
│       ├── package.json
│       └── src/
│           ├── states/
│           └── index.ts
│
├── tooling/
│   ├── eslint-config/
│   │   └── package.json
│   └── tsconfig/
│       └── base.json
│
├── turbo.json                # Turborepo config
├── package.json              # Root package.json
└── pnpm-workspace.yaml       # Workspace definition
```

### Key Deliverables

1. **Turborepo Configuration**
   - `turbo.json` with pipeline definitions
   - Workspace package management (pnpm)
   - Caching and parallelization

2. **Package Extraction**
   - Extract shared components to `@blue-intel/ui`
   - Extract intelligence features to `@blue-intel/intelligence`
   - Extract map components to `@blue-intel/maps`
   - Extract data utilities to `@blue-intel/data`
   - Extract state configs to `@blue-intel/config`

3. **Per-App Deployments**
   - Demo app to GitHub Pages (existing)
   - SC production app to custom domain
   - National app to scalable hosting

4. **CI/CD Updates**
   - Monorepo-aware build pipeline
   - Selective deployment based on changes
   - Shared test infrastructure

5. **Documentation**
   - Contributor guide
   - Package APIs
   - Development workflow

### Technical Decisions

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Package Manager | npm, yarn, pnpm | pnpm (workspace support) |
| Monorepo Tool | Nx, Turborepo, Lerna | Turborepo (simpler) |
| Package Scope | @blue-intel/* | Consistent namespace |
| Build Tool | Next.js, Vite | Keep Next.js |

### Verification Checklist

- [ ] All packages build independently
- [ ] Demo app works after extraction
- [ ] Shared components render correctly
- [ ] CI/CD pipeline functional
- [ ] Documentation complete

---

## Phase C: SC Production Migration

### Trigger
- Phase B complete
- SC Democratic Party contract signed

### Goal
Migrate South Carolina from demo data to real API integrations.

### API Integrations

#### BallotReady API (CivicEngine)

**Purpose:** Candidate data, positions, elections

**Endpoints to Implement:**
| Endpoint | Use Case |
|----------|----------|
| `/elections` | Election dates, deadlines |
| `/positions` | All elected positions |
| `/candidates` | Candidate profiles, endorsements |
| `/polling-places` | Voting locations |
| `/officeholders` | Current officials |

**Implementation:**
```typescript
// packages/data/src/ballotready.ts
export class BallotReadyClient {
  constructor(private apiKey: string) {}

  async getElections(state: string): Promise<Election[]> { }
  async getPositions(address: string): Promise<Position[]> { }
  async getCandidates(positionId: string): Promise<Candidate[]> { }
  async getPollingPlaces(address: string): Promise<PollingPlace[]> { }
}
```

#### TargetSmart API

**Purpose:** Voter files, turnout models

**Endpoints to Implement:**
| Endpoint | Use Case |
|----------|----------|
| `/voter/registration-check` | Verify registration |
| `/person/data-enhance` | Voter modeling |
| `/service/district` | District lookup |

**Implementation:**
```typescript
// packages/data/src/targetsmart.ts
export class TargetSmartClient {
  constructor(private apiKey: string) {}

  async checkRegistration(voter: VoterQuery): Promise<RegistrationStatus> { }
  async enhanceData(person: PersonQuery): Promise<EnhancedData> { }
  async lookupDistrict(address: string): Promise<DistrictInfo> { }
}
```

### Data Validation Layer

```typescript
// packages/data/src/validation.ts
export function validateCandidate(raw: unknown): Candidate {
  // Zod schema validation
  return CandidateSchema.parse(raw);
}

export function validateElection(raw: unknown): Election {
  return ElectionSchema.parse(raw);
}
```

### Migration Strategy

1. **Parallel Operation (2 weeks)**
   - Run demo and production in parallel
   - Compare data quality
   - Monitor for discrepancies

2. **Gradual Cutover**
   - Switch candidates first
   - Then elections
   - Then voter intelligence
   - Finally, full cutover

3. **Fallback Plan**
   - Keep demo data as fallback
   - Feature flags for data source
   - Quick rollback capability

### Verification Checklist

- [ ] BallotReady API authenticated
- [ ] TargetSmart API authenticated
- [ ] SC candidates match real data
- [ ] Voter guide shows real positions
- [ ] Intelligence features use real data
- [ ] 2-week parallel operation successful
- [ ] Full cutover complete

---

## Phase D: State Expansion

### Trigger
- Phase C success
- Additional state contracts

### Goal
Expand to all 50 states with real data where available, demo data otherwise.

### Expansion Priorities

| Priority | States | Rationale |
|----------|--------|-----------|
| **P1** | PA, MI, WI, AZ, NV, GA | 2026 battlegrounds |
| **P2** | NC, FL, TX, OH | Competitive legislatures |
| **P3** | VA, CO, MN, NM | Growing opportunities |
| **P4** | Remaining states | Complete coverage |

### Per-State Requirements

For each new state:

1. **Configuration** (~1 hour)
   - `src/config/states/[state].ts`
   - Chamber definitions
   - Feature flags

2. **Map Assets** (~2 hours)
   - House districts SVG
   - Senate districts SVG
   - GeoJSON boundaries

3. **Data Setup** (~2 hours)
   - Historical election data
   - District metadata
   - Demo data generation

4. **Testing** (~1 hour)
   - Map rendering
   - Navigation
   - Data accuracy

**Total per state: 6-10 hours** (first time)
**With automation: 4 hours** (subsequent states)

### Automation Opportunities

1. **Map Generation**
   - Script to convert Census TIGER files to SVG
   - Automated district ID assignment

2. **Data Pipeline**
   - Batch scraping for historical data
   - Automated demo data generation

3. **Testing**
   - Visual regression tests
   - Automated Lighthouse audits

### Regional Batch Strategy

Deploy states in regional batches for efficiency:

| Batch | States | Timing |
|-------|--------|--------|
| Southeast | SC, NC, GA, FL, VA | Phase A (done) |
| Midwest | PA, MI, WI, OH, IN | Phase D.1 |
| Southwest | AZ, NV, NM, CO | Phase D.2 |
| Northeast | NY, NJ, CT, MA | Phase D.3 |
| South | TX, LA, MS, AL | Phase D.4 |
| West | CA, WA, OR | Phase D.5 |
| Remaining | All others | Phase D.6 |

### Infrastructure Scaling

| Metric | Phase A | Phase D |
|--------|---------|---------|
| States | 5 | 50 |
| Districts | 876 | ~8,000 |
| Data files | ~50 | ~500 |
| Build time | <10s | <2min |
| Bundle size | <3MB | <10MB |

### Verification Checklist

- [ ] All 50 state configs created
- [ ] All maps render correctly
- [ ] Navigation works across states
- [ ] Performance within budget
- [ ] Demo data for non-API states
- [ ] Real data where available

---

## Timeline Overview

| Phase | Trigger | Duration | Key Milestone |
|-------|---------|----------|---------------|
| A | N/A | Complete | 5-state demo live |
| B | Customer/Contributor | 2-3 weeks | Monorepo architecture |
| C | SC contract | 2-3 weeks | Real SC data live |
| D | State contracts | Ongoing | 50-state platform |

### Key Dates

| Date | Event |
|------|-------|
| 2026-01-17 | Phase A Complete |
| 2026-03-01 | Target: Phase B start |
| 2026-06-01 | Target: Primary season features |
| 2026-09-01 | Target: General election ready |
| 2026-11-03 | Election Day |

---

*For current progress, see `.planning/STATE.md`*
