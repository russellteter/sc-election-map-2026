# SC Election Map 2026 - Roadmap

> **Generated:** 2026-01-16 | GSD Roadmap Update
> **Current Milestone:** 5 - API Intelligence Layer
> **Current Phase:** 6 - Tier 1 Foundation

---

## Milestone Overview

| Milestone | Goal | Status |
|-----------|------|--------|
| 1 - Make It Useful | Transform map from gray blob to meaningful visualization | Complete |
| 2 - Make It Reliable | Establish quality infrastructure | Complete |
| 3 - Make It Beautiful | Implement glassmorphic design system | Complete |
| 4 - Make It Powerful | Add advanced features for power users | Complete |
| **5 - API Intelligence** | Integrate BallotReady and TargetSmart APIs | **Active** |

---

## Phase Definitions

### Milestone 5: API Intelligence Layer

#### Phase 6: Tier 1 - Foundation
**Directory:** `.planning/phases/06-tier-1-foundation/`
**Focus:** API credentials and basic integrations

**Deliverables:**
- `.env.local` with API credentials
- BallotReady client enhanced for election timeline
- TargetSmart client enhanced for voter queries
- ElectionCountdown component (wired to BallotReady)
- PollingPlaceFinder component (wired to API)

**Verification:** `claudedocs/gsd/verification/tier-1-checklist.md`

---

#### Phase 7: Tier 2 - Strategic Intelligence
**Directory:** `.planning/phases/07-tier-2-intelligence/`
**Focus:** Live strategic data integration

**Deliverables:**
- RecruitmentPipeline with live vacant seat data
- ElectorateProfile with TargetSmart demographics
- MobilizationCard with calculated scores
- Intelligence data integrated into opportunities

**Dependencies:** Phase 6 complete

**Verification:** `claudedocs/gsd/verification/tier-2-checklist.md`

---

#### Phase 8: Tier 3 - Enrichment
**Directory:** `.planning/phases/08-tier-3-enrichment/`
**Focus:** Enhanced candidate and scoring data

**Deliverables:**
- Enhanced candidate profiles from BallotReady
- Turnout-adjusted opportunity scores
- EndorsementDashboard tracking
- Race detail page enhancements

**Dependencies:** Phase 7 complete

**Verification:** `claudedocs/gsd/verification/tier-3-checklist.md`

---

#### Phase 9: Tier 4 - Advanced
**Directory:** `.planning/phases/09-tier-4-advanced/`
**Focus:** Election season features and optimization

**Deliverables:**
- Early vote tracking dashboard
- Resource optimizer calculations
- Down-ballot intelligence maps
- Full system integration

**Dependencies:** Phase 8 complete

**Verification:** `claudedocs/gsd/verification/tier-4-checklist.md`

---

## Execution Flow

```
Phase 6 (Foundation) → Phase 7 (Intelligence) → Phase 8 (Enrichment) → Phase 9 (Advanced)
     ↓                      ↓                        ↓                       ↓
   Verify               Verify                   Verify                  Verify
     ↓                      ↓                        ↓                       ↓
   Deploy               Deploy                   Deploy                  Deploy
```

All phases are sequential - each depends on the previous.

---

## Execution Protocol

### Per Phase:
1. **Pre-flight:** `/gsd:progress`, `npm run build`, `git status`
2. **Plan:** `/gsd:plan-phase N`
3. **Execute:** Ralph loop or `/gsd:execute-phase N`
4. **Verify:** `/gsd:verify-work` + UAT checklist
5. **Complete:** Create SUMMARY.md, commit, push

### Per Tier (Ralph Loop):
```bash
/ralph-loop "Execute PLAN.md at .planning/phases/NN-name/NN-01-PLAN.md" \
  --completion-promise 'Tier N complete and verified' \
  --max-iterations 50
```

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-16 | Added Milestone 5 (Phases 6-9) for API Intelligence |
| 2026-01-13 | Initial roadmap with Milestones 1-4 |
