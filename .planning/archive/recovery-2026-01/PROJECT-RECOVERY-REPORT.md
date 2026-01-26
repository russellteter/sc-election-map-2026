# SC Election Map 2026 - Project Recovery Report

**Generated:** 2026-01-25
**Auditor:** Senior Project Manager (Recovery Initiative)

---

## Executive Summary

The SC Election Map 2026 project has accumulated significant organizational debt across multiple development cycles. While the **core application builds successfully** (197 static pages, <5s build time), the project suffers from:

1. **24 modified files** in working directory not committed
2. **10 local branches** (6 stale, 4 potentially obsolete)
3. **4 stashed change sets** potentially containing lost work
4. **13 commits ahead of main** on current branch (not merged)
5. **Scattered planning artifacts** with stale/conflicting status information
6. **Root-level clutter** including duplicate files and sensitive credentials

**Recommendation:** Execute a 3-phase recovery: (1) Commit/stash triage, (2) Branch consolidation, (3) Documentation alignment.

---

## 1. Git Status Summary

### 1.1 Current Branch State

| Metric | Value |
|--------|-------|
| Current branch | `feature/04-01-candidate-discovery-infrastructure` |
| Commits ahead of main | 13 |
| Modified files (unstaged) | 24 |
| Untracked files/directories | 20+ |
| Stashed changes | 4 |

### 1.2 Modified Files (Uncommitted)

**High Priority - Core Application:**
```
M src/app/[state]/page.tsx           # State dashboard with lens/search integration
M src/app/globals.css                 # +853 lines of new styles (AddressSearch, ScreenshotButton, etc.)
M src/components/Map/*.tsx            # 6 map components with lens support
M src/lib/districtColors.ts           # +267 lines (lens color system)
```

**Data Files:**
```
M public/data/candidates.json         # -852 lines (simplified)
M public/data/opportunity.json        # Recalculated opportunity tiers
M public/data/party-data.json         # +7 party mappings
```

**SC Ethics Monitor Subproject:**
```
M sc-ethics-monitor/src/*.py          # config, monitor, sheets_sync modified
M sc-ethics-monitor/scripts/*.py      # initialize_sheet modified
M sc-ethics-monitor/.planning/STATE.md # Updated to simplified structure
```

### 1.3 Untracked Files Requiring Decisions

| File/Directory | Size | Recommendation |
|----------------|------|----------------|
| `SC Election Map Strategic Overhaul.md` | 350KB | **Archive to docs/** - comprehensive design doc |
| `scratchpad/` | 4 PNG files | **Delete** - temporary lens screenshots |
| `src/components/Admin/` | 2 files | **Stage** - SyncDataButton.tsx used |
| `src/components/Export/` | 1 file | **Stage** - ScreenshotButton.tsx used |
| `src/components/Lens/` | 3 files | **Stage** - Lens system components |
| `src/components/Map/MobileDistrictSheet.tsx` | 220 lines | **Stage** - Mobile bottom sheet |
| `src/components/Search/AddressSearch.tsx` | 314 lines | **Stage** - Find My District |
| `src/components/ui/Tooltip.tsx` | New component | **Stage** - Used by Lens system |
| `src/hooks/useLens.ts` | 181 lines | **Stage** - URL-synced lens hook |
| `src/types/lens.ts` | 235 lines | **Stage** - Lens type definitions |
| `scripts/calculate_opportunity.py` | 303 lines | **Stage** - Opportunity tier calculator |
| `sc-ethics-monitor/backups/` | Backup data | **Add to .gitignore** |
| `sc-ethics-monitor/scripts/*.py` | 5 new scripts | **Evaluate** - migration/export scripts |
| `google-service-account copy.json` | 2.4KB | **DELETE IMMEDIATELY** - credentials! |

### 1.4 Stashed Changes

```
stash@{0}: WIP on feature/11-03-mini-map-preview (MiniMap work)
stash@{1}: WIP on feature/11-02-animated-us-map (Zoom helper)
stash@{2}: WIP on feature/11-02-animated-us-map (Duplicate)
stash@{3}: WIP on feature/11-03-mini-map-preview (CSS styles)
```

**Recommendation:** Review stash@{0} and stash@{3} for any work not merged to main, then `git stash drop` all.

### 1.5 Branch Analysis

| Branch | Last Activity | Ahead of Main | Status | Action |
|--------|---------------|---------------|--------|--------|
| `feature/04-01-candidate-discovery-infrastructure` | 3 days | 13 commits | **ACTIVE** | Merge to main |
| `main` | 4 days | - | Base | Keep |
| `feature/11-02-animated-us-map` | 5 days | 0 | Stale | Delete |
| `feature/11-03-mini-map-preview` | 5 days | 0 | Stale | Delete |
| `feature/11-01-animated-map-container` | 5 days | 0 | Stale | Delete |
| `feature/04-01-extract-custom-hooks` | 8 days | 0 | Obsolete | Delete |
| `feature/voter-guide-v2` | 12 days | 0 | Obsolete | Delete |
| `feature/voter-guide-poc` | 12 days | 1 commit | **Review** | Evaluate then delete |
| `feature/comprehensive-navigation-architecture` | 13 days | 0 | Obsolete | Delete |
| `feature/race-profiles-table-view-republican-toggle` | 13 days | 0 | Obsolete | Delete |

**Remote Branches to Prune:**
- `origin/feature/14-04-navigable-us-map` (merged)
- Several others tracking deleted local branches

---

## 2. Feature Implementation Matrix

### 2.1 Web Application Features

| Feature | Implementation | Files | Status | Notes |
|---------|----------------|-------|--------|-------|
| **v3.1 UX Overhaul** | | | | |
| - Lens onboarding tooltip | LensToggleBar.tsx | 1 | 100% | Working |
| - WCAG contrast fixes | districtColors.ts, lens.ts | 2 | 100% | WCAG AA compliant |
| - Non-collapsible legend | Legend.tsx | 1 | 100% | First-visit expanded |
| - District hover tooltips | MapTooltip.tsx | 1 | 100% | Enhanced |
| - Mobile bottom sheet | MobileDistrictSheet.tsx | 1 | 100% | **UNTRACKED** |
| - Find My District | AddressSearch.tsx | 1 | 100% | **UNTRACKED** |
| - Screenshot export | ScreenshotButton.tsx | 1 | 100% | **UNTRACKED** |
| - Data freshness badge | N/A | - | 0% | Deferred |
| - Standardized transitions | N/A | - | 0% | Deferred |
| - Mobile Playwright tests | N/A | - | 0% | **PENDING** |
| - Accessibility audit | N/A | - | 0% | **PENDING** |
| **v3.0 Multi-Lens System** | | | | |
| - 4-lens visualization | lens.ts, useLens.ts | 2 | 100% | **UNTRACKED** |
| - Lens color palettes | districtColors.ts | 1 | 100% | Modified but unstaged |
| - LensToggleBar | LensToggleBar.tsx | 1 | 100% | **UNTRACKED** |
| - Dynamic Legend | Legend.tsx | 1 | 100% | Modified |
| - Lens KPIs | lensKpis.ts | 1 | 100% | **UNTRACKED** |
| - URL sync (?lens=) | useLens.ts | 1 | 100% | **UNTRACKED** |
| - SyncDataButton | SyncDataButton.tsx | 1 | 100% | **UNTRACKED** |
| - Opportunity calculator | calculate_opportunity.py | 1 | 100% | **UNTRACKED** |
| **v2.0 Map Navigation** | | | | |
| - All features | Multiple | 10+ | 100% | Merged to main |
| **v2.1 Strategic Viz** | | | | |
| - All features | Multiple | 8+ | 100% | Merged to main |

### 2.2 SC Ethics Monitor Features

| Feature | Implementation | Status | Notes |
|---------|----------------|--------|-------|
| Phase 1-3: Data Enrichment | Excel generation | 100% | Complete |
| Phase 4: Candidate Discovery | Python modules | 100% | 213 tests passing |
| Phase 5: Simplified Structure | 3-tab Google Sheet | 100% | Implemented 2026-01-22 |
| Phase 6: Data Pipeline Integration | Multiple scripts | 60% | Partially implemented |
| - export_to_webapp.py | **UNTRACKED** | 100% | Ready |
| - setup_source_of_truth.py | **UNTRACKED** | 100% | Ready |
| - migrate_to_source_of_truth.py | **UNTRACKED** | 100% | Ready |
| - backup_sheet.py | **UNTRACKED** | 100% | Ready |
| - verify_unknown_parties.py | **UNTRACKED** | 100% | Ready |

---

## 3. Loose Ends Catalog

### 3.1 Critical Issues

| Issue | Impact | Resolution |
|-------|--------|------------|
| `google-service-account copy.json` in repo | **SECURITY RISK** | Delete immediately, verify not in git history |
| 24 modified files uncommitted | Work could be lost | Commit as v3.1 release |
| 13 commits not merged to main | Production out of date | Create PR and merge |

### 3.2 Documentation Drift

| Document | Issue | Action |
|----------|-------|--------|
| `.planning/ROADMAP.md` | Shows v3.0 as "IN PROGRESS" but it's complete | Update to COMPLETE |
| `.planning/STATE.md` | Accurate but has uncommitted changes | Commit with feature code |
| `docs/CURRENT-STATE.md` | May be outdated | Verify after merge |
| `CLAUDE.md` | References v1.x patterns | Review for v3.x |

### 3.3 Root-Level Clutter

Files that should be moved or deleted:

```
DELETE (duplicates or temp):
- "DEPLOYMENT-SUMMARY 2.txt"
- "MOBILE-OPTIMIZATION 2.md"
- "SPRINT-5-COMPLETE 2.md"
- "VOTER-GUIDE 2.md"
- scratchpad/ (entire directory)
- google-service-account copy.json (SECURITY!)

MOVE to docs/:
- COMPONENTS.md
- DATA_PIPELINE.md
- MOBILE-OPTIMIZATION.md
- SPRINT-5-COMPLETE.md
- VOTER-GUIDE.md
- "SC Election Map Strategic Overhaul.md"

MOVE to .planning/archives/:
- SC_Ethics_Monitor_Source_of_Truth.xlsx
- SC_Ethics_Monitor_v2.xlsx

KEEP (appropriate location):
- README.md
- CHANGELOG.md
- CLAUDE.md
- DEPLOYMENT-SUMMARY.txt
```

### 3.4 Orphaned/Unused Code

| File | Reason | Action |
|------|--------|--------|
| `src/components/Intelligence/*.tsx` | May be demo-only | Verify usage |
| `feature/voter-guide-poc` branch | Has 1 commit not in main | Review for relevant code |
| `.planning/current-agent-id 2.txt` | Duplicate | Delete |
| `When Stuck - Problem-Solving Dispatch/` | Reference material | Move to docs/ or delete |

---

## 4. Decision Points for Owner

### 4.1 Immediate Decisions Required

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | What to do with uncommitted v3.1 work? | A) Commit all, B) Cherry-pick, C) Discard | **A) Commit all as v3.1** |
| 2 | Merge current branch to main? | A) Yes, B) No, wait | **A) Yes, via PR** |
| 3 | Delete stale branches? | A) Yes, B) Keep some | **A) Yes, all 6 stale** |
| 4 | Handle credential file? | A) Delete, B) Rotate secrets | **A) Delete + verify history** |

### 4.2 Strategic Decisions

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 5 | SC Ethics Monitor integration | A) Complete Phase 6, B) Defer | **A) Complete - 60% done** |
| 6 | v3.1 remaining tasks | A) Complete (tests, a11y), B) Ship as-is | **B) Ship, create v3.2 issues** |
| 7 | Documentation overhaul | A) Now, B) After merge | **B) After merge** |
| 8 | Branch naming convention | A) Keep current, B) Simplify | **B) Use feat/fix/docs** |

---

## 5. Recommended Roadmap

### Phase 1: Immediate Cleanup (Today)

**Time estimate: 30-60 minutes**

1. **Delete sensitive file:**
   ```bash
   rm "google-service-account copy.json"
   git status  # verify gone
   ```

2. **Stage all v3.1 work:**
   ```bash
   # Stage new components
   git add src/components/Admin/
   git add src/components/Export/
   git add src/components/Lens/
   git add src/components/Map/MobileDistrictSheet.tsx
   git add src/components/Search/AddressSearch.tsx
   git add src/components/ui/Tooltip.tsx
   git add src/hooks/useLens.ts
   git add src/types/lens.ts
   git add scripts/calculate_opportunity.py

   # Stage modified files
   git add src/app/[state]/page.tsx
   git add src/app/globals.css
   git add src/components/Map/*.tsx
   git add src/lib/districtColors.ts
   git add public/data/*.json
   git add .planning/STATE.md
   git add .planning/ROADMAP.md
   ```

3. **Commit v3.1 UX Overhaul:**
   ```bash
   git commit -m "feat(v3.1): complete UX overhaul with lens system, mobile sheet, and address search

   - Add 4-lens visualization system (incumbents, dem-filing, opportunity, battleground)
   - Add MobileDistrictSheet for touch-friendly interactions
   - Add AddressSearch with GPS/geocoding for Find My District
   - Add ScreenshotButton for PNG/JPG map export
   - Add URL sync for lens state (?lens=opportunity)
   - Fix WCAG contrast issues in color system
   - Add first-visit expanded legend state

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

4. **Create PR to main:**
   ```bash
   git push origin feature/04-01-candidate-discovery-infrastructure
   gh pr create --title "v3.1 UX Overhaul + Lens System" --body "..."
   ```

### Phase 2: Branch Consolidation (After PR Merge)

**Time estimate: 15-20 minutes**

1. **Delete stale local branches:**
   ```bash
   git branch -d feature/11-01-animated-map-container
   git branch -d feature/11-02-animated-us-map
   git branch -d feature/11-03-mini-map-preview
   git branch -d feature/04-01-extract-custom-hooks
   git branch -d feature/voter-guide-v2
   git branch -d feature/comprehensive-navigation-architecture
   git branch -d feature/race-profiles-table-view-republican-toggle
   ```

2. **Review voter-guide-poc branch:**
   ```bash
   git log main..feature/voter-guide-poc --oneline
   # If nothing valuable: git branch -d feature/voter-guide-poc
   ```

3. **Clean stashes:**
   ```bash
   git stash list
   git stash show -p stash@{0}  # Review each
   git stash drop stash@{0}     # After review
   ```

4. **Prune remote tracking:**
   ```bash
   git fetch --prune
   ```

### Phase 3: Organization & Documentation (Next Session)

**Time estimate: 1-2 hours**

1. **Clean root directory:**
   - Move documentation files to `docs/`
   - Delete duplicate files
   - Move Excel files to `sc-ethics-monitor/data/`

2. **Update .gitignore:**
   ```
   # Add these entries
   sc-ethics-monitor/backups/
   scratchpad/
   *.xlsx
   google-service-account*.json
   ```

3. **Align planning documents:**
   - Update ROADMAP.md to show v3.0 and v3.1 as COMPLETE
   - Archive completed phase plans
   - Create v3.2 milestone for remaining tasks

4. **Create issues for deferred work:**
   - Mobile Playwright tests
   - Accessibility audit (axe-core)
   - Data freshness badge
   - Standardized transitions

---

## 6. Summary Statistics

| Category | Count | Notes |
|----------|-------|-------|
| Uncommitted files | 24 | All related to v3.1 |
| Untracked files | 20+ | Mix of features and clutter |
| Stale branches | 6 | Safe to delete |
| Stashed changes | 4 | Review then drop |
| Sensitive files | 1 | **DELETE IMMEDIATELY** |
| Duplicate files | 4 | Clean up |
| Build status | **PASSING** | 197 pages, <5s |
| Test status | Unknown | Run `npm test` to verify |

---

## Appendix A: File Manifest

### A.1 New Components (Untracked, Stage)

```
src/components/Admin/SyncDataButton.tsx     - GitHub Actions trigger button
src/components/Admin/index.ts               - Barrel export
src/components/Export/ScreenshotButton.tsx  - PNG/JPG map export
src/components/Lens/LensToggleBar.tsx       - Lens selector UI
src/components/Lens/lensKpis.ts             - Lens-aware KPI calculations
src/components/Lens/index.ts                - Barrel export
src/components/Map/MobileDistrictSheet.tsx  - Mobile bottom sheet
src/components/Search/AddressSearch.tsx     - Find My District
src/components/ui/Tooltip.tsx               - Reusable tooltip
src/hooks/useLens.ts                        - URL-synced lens state
src/types/lens.ts                           - Lens type definitions
scripts/calculate_opportunity.py            - Opportunity tier calculator
```

### A.2 Modified Files (Unstaged)

```
src/app/[state]/page.tsx                    - Full lens + search integration
src/app/globals.css                         - +853 lines (new component styles)
src/components/Map/DistrictGeoJSONLayer.tsx - Lens support
src/components/Map/DistrictMap.tsx          - Lens support
src/components/Map/HybridMapContainer.tsx   - Lens passthrough
src/components/Map/Legend.tsx               - Dynamic lens-aware legend
src/components/Map/MapTooltip.tsx           - Enhanced tooltips
src/components/Map/NavigableDistrictMap.tsx - Lens passthrough
src/lib/districtColors.ts                   - Lens color system (+267 lines)
public/data/candidates.json                 - Simplified data
public/data/opportunity.json                - New opportunity tiers
public/data/party-data.json                 - Party mappings
.planning/ROADMAP.md                        - Progress updates
.planning/STATE.md                          - Current state
```

---

*Report generated by Senior Project Manager Recovery Agent*
*Next action: Owner review and approval of Phase 1 cleanup*
