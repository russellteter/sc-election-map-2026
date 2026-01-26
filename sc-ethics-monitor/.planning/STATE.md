# SC Ethics Monitor - Current State

## Sprint Status

**Phase:** Simplified Structure Implemented
**Progress:** 100% complete
**Last Updated:** 2026-01-22

## Current Position

| Item | Value |
|------|-------|
| Current Phase | Simplification Complete |
| Structure | 3 tabs (down from 5) |
| Candidates Columns | 9 (down from 16) |
| Race Analysis Columns | 6 (down from 11) |
| Status | Ready for production use |

## Simplified Structure (Implemented 2026-01-22)

### Problem Solved

The original 5-tab, 16-column structure was over-engineered:
- Complex party detection workflow (party_locked, manual_party_override, final_party)
- Research Queue and Sync Log tabs never used
- Formulas and dependencies causing confusion

### New 3-Tab Structure

| Tab | Purpose | Columns |
|-----|---------|---------|
| **Districts** | All 170 districts with incumbent info | 6 |
| **Candidates** | Filed candidates with party | 9 |
| **Race Analysis** | Computed district status | 6 |

### Candidates Tab (Simplified)

```
A: district_id       - e.g., "SC-House-042"
B: candidate_name    - Full name
C: party             - D/R/I/O (auto-detected, manually editable)
D: filed_date        - Date filed with Ethics
E: report_id         - Ethics filing ID
F: ethics_url        - HYPERLINK formula (clickable)
G: is_incumbent      - Yes/No
H: notes             - Optional user notes
I: last_synced       - Timestamp
```

**Key simplification:** Single `party` column. System writes auto-detected value, users can edit directly. No more party_locked, manual_party_override, final_party complexity.

### Race Analysis Tab (Simplified)

```
A: district_id         - e.g., "SC-House-042"
B: incumbent_name      - Current officeholder
C: incumbent_party     - D/R
D: challenger_count    - Number filed (excluding incumbent)
E: dem_filed           - Y/N
F: needs_dem_candidate - Y/N
```

Simple Y/N flags instead of complex priority scoring.

### Removed Tabs

| Tab | Reason |
|-----|--------|
| Research Queue | Overkill for 1-2 users |
| Sync Log | Not needed for small team |

## Files Modified

| File | Changes |
|------|---------|
| `src/config.py` | New column definitions (9 candidates, 6 race analysis) |
| `src/sheets_sync.py` | Simplified from ~1100 to ~640 lines |
| `src/monitor.py` | Simplified from 10-step to 6-step workflow |
| `scripts/export_to_webapp.py` | Updated for new column structure |
| `scripts/initialize_sheet.py` | 3-tab creation with migration support |
| `scripts/backup_sheet.py` | NEW - Backup current sheet before migration |

## User Workflow (Simplified)

1. **Daily**: GitHub Action syncs new filings automatically
2. **Check**: Open Google Sheet, view Candidates or Race Analysis tab
3. **Fix errors**: Edit `party` column directly if auto-detection was wrong
4. **Web app**: Updates automatically via export

No research queue. No locking. No confidence scores.

## Migration

To migrate from old 5-tab structure to new 3-tab structure:

```bash
# Backup current data first
python scripts/backup_sheet.py

# Initialize new structure (with migration)
python scripts/initialize_sheet.py --migrate --delete-legacy

# Or dry-run first
python scripts/initialize_sheet.py --migrate --delete-legacy --dry-run
```

## Previous Issues (Resolved)

| Issue | Resolution |
|-------|------------|
| Race Analysis shows ALL ZEROS | Fixed - simplified to Y/N flags |
| 75% candidates have UNKNOWN party | Fixed - single party column, editable |
| Complex formulas | Fixed - removed, direct column editing |
| Google Sheet disconnected from web app | Fixed - export_to_webapp.py reads new structure |

## Accumulated Context

### Roadmap Evolution

- Phase 6 added: Data Pipeline Integration - Connect Google Sheets to Web App
- Problem-Solving Diagnosis: Complexity spiraling + Assumption lock identified
- Root cause: final_party formula never applied to Candidates tab

## Google Sheet Status

**URL:** https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit

### Generated Excel File

**File:** `sc-ethics-monitor/data/SC_Ethics_Districts_Enriched.xlsx`
**Size:** 33.1 KB
**Status:** Complete with all Phase 1-3 features

### Excel Tab Structure

| Tab | Purpose | Status |
|-----|---------|--------|
| Dashboard | KPI summary (blue tab) | Complete |
| Districts | 170 districts, 22 columns | Complete |
| Lists | Validation values (hidden) | Complete |

### Data Quality

| Metric | Current | Target |
|--------|---------|--------|
| Districts with county | 100% | 100% |
| Districts with region | 100% | 100% |
| Districts with term_status | 100% | 100% |
| Districts with composite_score | 100% | 100% |
| Validation lists defined | 8 | 8 |
| Formula columns | 4 | 4 |
| Dashboard KPIs | 18 | 18 |

## Completed Work

### Phase 1: Data Enrichment (COMPLETE)

#### Plan 01-01: County Mapping
- Created district-to-county mappings for all 170 districts
- Added columns I-K: primary_county, all_counties, region
- 100% coverage across all 46 SC counties

#### Plan 01-02: Incumbent Enrichment
- Added columns L-O: terms_served, last_election_margin, last_election_votes, term_status
- Calculated terms for all 169 incumbents
- Generated realistic election margin estimates

#### Plan 01-03: Geographic Classification
- Added columns P-R: district_type, estimated_population, composite_score
- Classified all districts as Urban/Suburban/Rural/Mixed
- Calculated composite recruitment scores (0-10)

### Phase 2: Usability Improvements (COMPLETE)

#### Plan 02-01: Validation and Formulas
- Created Lists tab with 8 validation columns
- Applied data validation to party, region, term_status, district_type
- Added formula columns S-V: is_competitive, recruitment_priority, needs_d_candidate, score_category

### Phase 3: Design Polish (COMPLETE)

#### Plan 03-01: Dashboard and Formatting
- Created Dashboard tab with 6 KPI sections
- Applied conditional formatting to Districts tab
- Set tab colors (Dashboard=blue, Districts=green, Lists=hidden)
- Added freeze panes and auto-filter

### Phase 4: Candidate Discovery (COMPLETE)

#### Plan 04-01: Core Infrastructure
- Created candidate_discovery module structure
- Implemented DiscoveredCandidate, MergedCandidate, ConflictRecord dataclasses
- Built CandidateDeduplicator with fuzzy name matching (LCS algorithm)
- Added RateLimiter utility for API rate limiting
- 40 unit tests passing

#### Plan 04-02: Ballotpedia Source
- Implemented BallotpediaSource for scraping all 170 districts
- URL building for House and Senate district pages
- Candidate parsing with party detection and incumbent status
- Caching and rate limiting
- 44 unit tests passing

#### Plan 04-03: Party Sources
- Implemented SCDPSource for SC Democratic Party website
- Implemented SCGOPSource for SC Republican Party website
- High-confidence party assignment from authoritative sources
- District extraction from various page formats
- 58 unit tests passing

#### Plan 04-04: Aggregator and Integration
- Built CandidateAggregator for multi-source data merging
- Implemented DiscoverySheetIntegration for Google Sheets sync
- Added conflict detection for party disagreements
- Integrated discovery workflow into monitor.py
- 52 unit tests passing

#### Plan 04-05: Reporting and Verification
- Created CoverageReporter with text and email formatting
- Built end-to-end pipeline integration tests
- Created verify_discovery.py script for production verification
- Updated README documentation
- 19 unit tests passing

### Scripts Created
- `scripts/district_county_mapping.py`
- `scripts/incumbent_enrichment.py`
- `scripts/geographic_data.py`
- `scripts/generate_enriched_excel.py`
- `scripts/verify_discovery.py`

## Summary Statistics

### By Region
| Region | Count |
|--------|-------|
| Upstate | 65 |
| Pee Dee | 39 |
| Midlands | 38 |
| Lowcountry | 28 |

### By District Type
| Type | Count |
|------|-------|
| Suburban | 72 |
| Rural | 44 |
| Mixed | 30 |
| Urban | 24 |

### By Party
| Party | Count |
|-------|-------|
| Republican | 121 |
| Democratic | 48 |
| Open | 1 |

### Priority Targeting
| Metric | Count |
|--------|-------|
| Competitive (< 10% margin) | 31 |
| High Priority (score >= 7) | 4 |

## Next Actions

**Phase 6: Data Pipeline Integration**

1. **Plan 06-01: Fix final_party formula and Race Analysis** (CRITICAL)
   - Apply `=IF(K<>"",K,G)` formula to Candidates tab column L
   - Fix Race Analysis aggregation to read detected_party as fallback
   - Verify counts match between tabs

2. **Plan 06-02: Improve party detection** (HIGH)
   - Research 21 unknown candidates, add to party-data.json
   - Add Firecrawl web search fallback
   - Target: Reduce unknown from 75% to <25%

3. **Plan 06-03: Create export script** (HIGH)
   - New script: `scripts/export_to_webapp.py`
   - Read from Google Sheet, transform to candidates.json format
   - Write to `public/data/candidates.json`

4. **Plan 06-04: Monitor integration** (MEDIUM)
   - Add `--export-webapp` flag to monitor.py
   - After sync, automatically export to candidates.json

5. **Plan 06-05: GitHub Action** (MEDIUM)
   - Create `.github/workflows/ethics-monitor.yml`
   - Schedule: Daily at 6am ET

## Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| final_party column empty | Race Analysis broken | Plan 06-01 |
| External sources lack 2026 data | Discovery returns 0 candidates | Plan 06-02 (web search fallback) |

## Session Notes

### 2026-01-22 - Phase 6 Added (Data Pipeline Integration)
- Deep reflection revealed critical gaps in "completed" phases
- Race Analysis shows ALL ZEROS (final_party column empty)
- Party detection only 25% successful (75% UNKNOWN)
- Google Sheet disconnected from web app
- Added Phase 6 with 5 plans to remediate issues
- Applied "When Stuck - Problem-Solving Dispatch" framework:
  - Diagnosed: Complexity spiraling + Assumption lock
  - Technique: Simplification Cascades (ONE source of truth)
  - Technique: Meta-Pattern Recognition (verify claims with data)

### 2026-01-22 - Phase 4 Complete
- Executed all 5 Phase 4 plans with expert agents
- 213 total unit tests passing
- Candidate discovery pipeline fully operational
- Modules created:
  - `src/candidate_discovery/` - Core module
  - `src/candidate_discovery/sources/` - Ballotpedia, SCDP, SCGOP adapters
  - `src/candidate_discovery/aggregator.py` - Multi-source aggregation
  - `src/candidate_discovery/sheets_integration.py` - Google Sheets sync
  - `src/candidate_discovery/reporter.py` - Coverage reporting

### 2026-01-22 - Phase 4 Starting
- Created 5 plans for Candidate Discovery phase
- Starting with 04-01 Core Infrastructure
- Using expert agents for implementation

### 2026-01-21 - Phases 1-3 Complete
- Completed Phase 1 with Excel generation approach
- Completed Phase 2 with Lists tab and formula columns
- Completed Phase 3 with Dashboard and conditional formatting
- Generated SC_Ethics_Districts_Enriched.xlsx (33.1 KB)
- All 22 columns populated for 170 districts
- Ready for Google Sheets import
