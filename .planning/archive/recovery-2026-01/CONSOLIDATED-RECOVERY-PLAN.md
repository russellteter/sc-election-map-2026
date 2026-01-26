# SC Election Map 2026 - Project Recovery Plan

**Generated:** 2026-01-25
**Status:** CRITICAL - Immediate action required

---

## Executive Summary

The multi-agent audit has revealed a project with **strong code foundations** but **significant organizational debt**. The good news: core features work and the build passes. The bad news: work is scattered across branches, uncommitted, and out of sync with documentation.

### Key Metrics

| Category | Status | Risk Level |
|----------|--------|------------|
| Build Status | PASSING | Low |
| Uncommitted Files | 24 files, ~11,285 lines | HIGH |
| Unpushed Commits | 4 commits across branches | MEDIUM |
| Local-Only Branches | 4 branches | HIGH |
| Stashed Work | 4 entries | MEDIUM |
| Main Branch | DIVERGED | HIGH |
| Documentation Sync | Out of date | MEDIUM |

---

## Critical Findings

### 1. SECURITY ISSUE (Immediate Action Required)

**File:** `google-service-account copy.json`
**Risk:** Credential exposure
**Action:** Delete immediately

```bash
rm "google-service-account copy.json"
```

### 2. Massive Uncommitted Work

**24 modified files** representing multiple feature sets:
- v3.0 Multi-Lens System (complete but uncommitted)
- v3.1 UX Overhaul (80% complete, uncommitted)
- SC Ethics Monitor Phase 6 upgrades
- Data pipeline improvements

**Risk:** All this work could be lost if not committed.

### 3. Branch Chaos

| Branch | State | Issue |
|--------|-------|-------|
| `main` | DIVERGED | 1 ahead, 5 behind origin |
| `feature/04-01-candidate-discovery-infrastructure` | 3 unpushed | Current branch |
| `feature/04-01-extract-custom-hooks` | LOCAL ONLY | Never pushed |
| `feature/11-01-animated-map-container` | LOCAL ONLY | Never pushed |
| `feature/11-02-animated-us-map` | LOCAL ONLY | Never pushed |
| `feature/11-03-mini-map-preview` | LOCAL ONLY | Never pushed |

### 4. Documentation vs Reality Gap

| Document | Claims | Reality |
|----------|--------|---------|
| ROADMAP.md | v3.0 phases "PLANNED" | v3.0 is COMPLETE |
| STATE.md | v3.1 at 80% | Accurate |
| sc-ethics-monitor STATE.md | Phase 6 items "NOT STARTED" | Phase 6 COMPLETE |

### 5. Dead Code Accumulation

- **9 unused hooks** (4 complete, 5 partial)
- **18 partially integrated components** (built but not wired)
- **2 unused API integrations** (BallotReady, TargetSmart)

---

## Recovery Phases

### Phase 0: Secure & Backup (Do First - 5 minutes)

```bash
# 1. Delete exposed credentials
rm "google-service-account copy.json"

# 2. Backup current state
git stash push -m "recovery-backup-$(date +%Y%m%d-%H%M%S)"

# 3. Push current branch to create remote backup
git push origin feature/04-01-candidate-discovery-infrastructure
```

### Phase 1: Git Reconciliation (30 minutes)

**Goal:** Get all work pushed and branches organized

#### Step 1.1: Push Local-Only Branches
```bash
# Push each local-only branch to create remote backups
git push -u origin feature/04-01-extract-custom-hooks
git push -u origin feature/11-01-animated-map-container
git push -u origin feature/11-02-animated-us-map
git push -u origin feature/11-03-mini-map-preview
```

#### Step 1.2: Reconcile Main Branch
```bash
git checkout main
git fetch origin
git rebase origin/main
git push origin main
```

#### Step 1.3: Evaluate Stashes
```bash
git stash list
# Review each stash and either apply or drop
git stash show -p stash@{0}  # Review
git stash drop stash@{0}     # Drop if not needed
```

### Phase 2: Commit Uncommitted Work (45 minutes)

**Goal:** Group and commit the 24 modified files by feature

#### Commit Group A: v3.0 Lens System
```bash
git add src/components/Lens/
git add src/hooks/useLens.ts
git add src/types/lens.ts
git commit -m "feat(v3.0): complete Multi-Lens System

- Add LensToggleBar component
- Add useLens hook for lens state management
- Add lens type definitions
- Integrate lens filtering across map views"
```

#### Commit Group B: v3.1 UX Components
```bash
git add src/components/Map/MobileDistrictSheet.tsx
git add src/components/Search/AddressSearch.tsx
git add src/components/Export/
git add src/components/ui/Tooltip.tsx
git commit -m "feat(v3.1): UX Overhaul components

- Add MobileDistrictSheet for mobile experience
- Add AddressSearch component
- Add Export functionality
- Add reusable Tooltip component"
```

#### Commit Group C: Map Improvements
```bash
git add src/components/Map/DistrictGeoJSONLayer.tsx
git add src/components/Map/DistrictMap.tsx
git add src/components/Map/HybridMapContainer.tsx
git add src/components/Map/Legend.tsx
git add src/components/Map/MapTooltip.tsx
git add src/components/Map/NavigableDistrictMap.tsx
git add src/lib/districtColors.ts
git commit -m "feat(map): enhance map rendering and interactions

- Improve DistrictGeoJSONLayer rendering
- Update Legend with lens support
- Enhance MapTooltip styling
- Refactor districtColors for consistency"
```

#### Commit Group D: SC Ethics Monitor
```bash
git add sc-ethics-monitor/
git commit -m "feat(ethics-monitor): complete Phase 6 data pipeline

- Implement source-of-truth Google Sheet architecture
- Add backup and migration scripts
- Update sheets_sync with improved error handling
- Add export_to_webapp.py for data pipeline"
```

#### Commit Group E: Data Updates
```bash
git add public/data/candidates.json
git add public/data/opportunity.json
git add public/data/party-data.json
git add src/data/party-data.json
git commit -m "data: update candidate and opportunity scoring data"
```

#### Commit Group F: Planning & Config
```bash
git add .planning/ROADMAP.md
git add .planning/STATE.md
git add .github/workflows/ethics-monitor.yml
git add package.json package-lock.json
git commit -m "docs: update roadmap and state for v3.0-v3.1

- Mark v3.0 Multi-Lens phases as complete
- Add v3.1 UX Overhaul tracking
- Update CI workflow for ethics monitor"
```

### Phase 3: Documentation Sync (20 minutes)

**Goal:** Align all planning documents with reality

#### Update ROADMAP.md
- Mark v3.0 phases 16-21 as COMPLETE
- Add v3.1 milestone definition
- Fix version numbering (Monorepo = v4.0, not v3.0)

#### Update sc-ethics-monitor STATE.md
- Mark Phase 6 as COMPLETE
- Archive PAUSE_CONTEXT.md as historical

#### Clean Up Orphaned Files
```bash
rm .planning/phases/04-recruitment-pipeline/Untitled
rm "SC Election Map Strategic Overhaul.md"  # Move to docs/ if needed
```

### Phase 4: Dead Code Cleanup (30 minutes)

**Goal:** Remove unused code to reduce maintenance burden

#### Remove Unused Hooks
```bash
# Delete if confirmed unused after review:
rm src/hooks/useGeoJSONLoader.ts
rm src/hooks/useIntersectionObserver.ts
rm src/hooks/useLeafletMap.ts
rm src/hooks/useSearchShortcut.ts
```

#### Remove Unused API Integrations
```bash
rm src/lib/ballotready.ts src/types/ballotready.d.ts
rm src/lib/targetsmart.ts src/types/targetsmart.d.ts
rm src/lib/navigationContext.ts
```

### Phase 5: Branch Cleanup (15 minutes)

**Goal:** Merge completed work and delete stale branches

```bash
# After merging feature branches to main:
git branch -d feature/04-01-extract-custom-hooks
git branch -d feature/11-01-animated-map-container
git branch -d feature/11-02-animated-us-map
git branch -d feature/11-03-mini-map-preview

# Delete remote stale branches
git push origin --delete feature/voter-guide-poc
git push origin --delete feature/voter-guide-v2
```

---

## Feature Status Matrix

After recovery, this should be the documented state:

| Feature | Version | Status | Notes |
|---------|---------|--------|-------|
| 5-State Demo | Phase A | COMPLETE | SC, NC, GA, FL, VA |
| SC Voter Guide | v1.1 | COMPLETE | Address lookup, candidate display |
| Map Navigation | v2.0 | COMPLETE | Leaflet integration, zoom/pan |
| Strategic Visualization | v2.1 | COMPLETE | Opportunity scoring, legends |
| Multi-Lens System | v3.0 | COMPLETE | Lens toggle, filtered views |
| UX Overhaul | v3.1 | 80% | Mobile sheet, address search |
| SC Ethics Monitor | Phase 6 | COMPLETE | Source-of-truth architecture |

---

## Post-Recovery Checklist

- [ ] Security: Credential file deleted
- [ ] Git: All commits pushed to remote
- [ ] Git: Main branch reconciled
- [ ] Git: Local-only branches pushed
- [ ] Git: Stashes reviewed and cleared
- [ ] Commits: All 24 modified files committed
- [ ] Docs: ROADMAP.md updated
- [ ] Docs: STATE.md accurate
- [ ] Docs: sc-ethics-monitor STATE.md updated
- [ ] Cleanup: Orphaned files removed
- [ ] Cleanup: Dead code removed
- [ ] Cleanup: Stale branches deleted

---

## Recommended Next Steps

After recovery is complete:

1. **Complete v3.1** - Finish remaining 20% of UX Overhaul
2. **Create PR** - Merge current branch to main
3. **Deploy** - Push to production (GitHub Pages)
4. **Plan v4.0** - Define Monorepo architecture requirements
5. **Document** - Create user-facing README with screenshots

---

## Agent IDs for Follow-up

If you need to resume any analysis agent:

- Project Manager: `a76a84c`
- Planning Analyst: `a9dd34e`
- Codebase Auditor: `a492301`
- Git Analyst: `a50acb9`

---

*Recovery plan generated by multi-agent orchestration system*
