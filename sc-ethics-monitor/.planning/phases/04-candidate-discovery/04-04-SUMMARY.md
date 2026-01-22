# Phase 04-04 Summary: Aggregator and Integration

## Status: COMPLETED

**Execution Date:** 2026-01-22

## Overview

This phase implemented the aggregation layer that combines candidates from multiple discovery sources and integrates them with the existing Google Sheets workflow.

## Components Implemented

### 1. CandidateAggregator (`src/candidate_discovery/aggregator.py`)

**Dataclasses:**
- `SourceResult` - Tracks individual source discovery outcomes
  - source_name, success, candidates, error, partial_coverage, duration_seconds
  - Property: `candidate_count`

- `AggregationResult` - Final aggregation output
  - candidates (MergedCandidate list), source_stats, conflicts, total_raw, total_deduplicated
  - Properties: `successful_sources`, `failed_sources`, `deduplication_ratio`, `conflict_count`

**CandidateAggregator Class:**
- `__init__(sources, similarity_threshold)` - Sorts sources by priority
- `aggregate_all(chambers)` - Async method that:
  1. Iterates through sources in priority order
  2. Collects candidates with error handling
  3. Calls deduplicator on combined results
  4. Detects conflicts using `_find_conflicts()`
  5. Returns AggregationResult with stats
- `_find_conflicts(candidates)` - Identifies party disagreements between sources
- `_should_flag_for_review(records)` - Determines if conflict needs manual review
- `_build_conflict_notes(candidate, party_values)` - Creates human-readable conflict descriptions
- `aggregate_for_district(district_id)` - Single-district convenience method
- `get_source_summary()` - Returns configured sources info

### 2. DiscoverySheetIntegration (`src/candidate_discovery/sheets_integration.py`)

**Dataclass:**
- `SyncResult` - Tracks sync outcomes
  - added, updated, skipped, errors lists
  - Properties: `total_processed`, `success_rate`
  - Method: `__str__()` for readable summary

**DiscoverySheetIntegration Class:**
- `__init__(sheets_sync, similarity_threshold)` - Accepts existing SheetsSync instance
- `_build_name_index(sheet_state)` - Creates normalized name -> report_id mapping
- `_normalize_name(name)` - Applies name normalization (suffixes, initials, punctuation)
- `_calculate_similarity(s1, s2)` - LCS-based similarity calculation
- `_names_fuzzy_match(name1, name2)` - Checks if names match within threshold
- `_find_existing(candidate, sheet_state, name_index)` - Matches discovered to existing
- `sync_discovered_candidates(candidates)` - Main sync method:
  1. Reads current sheet state
  2. Matches candidates to existing records
  3. Updates existing (if not locked) or adds new
  4. Returns SyncResult
- `_update_existing_candidate(report_id, candidate, existing)` - Updates with confidence comparison
- `_add_new_candidate(candidate)` - Creates placeholder with `DISC-` prefix
- `get_unmatched_candidates(candidates)` - Finds candidates not in sheet
- `get_candidates_needing_party()` - Finds unlocked candidates without party

### 3. Monitor Integration (`src/monitor.py`)

**Added:**
- Import for asyncio, DISCOVERY_ENABLED, DISCOVERY_FREQUENCY, DISCOVERY_SOURCES
- `force_discovery` parameter in `__init__`
- `DISCOVERY_STATE_FILE` class attribute for tracking last run
- `discovery_results` instance variable

**New Methods:**
- `_should_run_discovery()` - Checks schedule or force flag
- `_run_candidate_discovery()` - Async method that:
  1. Initializes sources based on DISCOVERY_SOURCES config
  2. Creates CandidateAggregator and runs discovery
  3. Syncs results to sheets (if not dry run)
  4. Logs conflicts for review
  5. Saves discovery state
- `_save_discovery_state()` - Persists last run timestamp to cache

**CLI Updates:**
- Added `--force-discovery` flag
- Updated help text and examples

**Workflow Integration:**
- Discovery runs as Step 9 (before email notification)
- Results included in monitor output

## Conflict Resolution Strategy

**Party Conflict Detection:**
1. Checks merged candidates with multiple sources
2. Identifies when sources report different parties
3. Resolution: Uses party from highest-priority source

**Review Flagging Criteria:**
- Both SCDP and SCGOP claim the candidate (requires_review=True)
- Sources with similar priorities (within 1 level) disagree
- Large priority gap: Auto-resolved, no review needed

**Priority Order:**
1. ethics_commission (1)
2. ballotpedia (2)
3. scdp, scgop (3)
4. election_commission (4)
5. web_search (5)

## Test Coverage

### test_aggregator.py (21 tests)

**TestSourceResult:**
- test_basic_creation
- test_with_candidates
- test_failed_result

**TestAggregationResult:**
- test_basic_creation
- test_successful_sources
- test_deduplication_ratio
- test_deduplication_ratio_zero
- test_conflict_count

**TestCandidateAggregator:**
- test_source_sorting
- test_get_source_summary

**TestAggregateAll:**
- test_aggregate_empty_sources
- test_aggregate_single_source
- test_aggregate_multiple_sources
- test_aggregate_handles_source_failure

**TestConflictDetection:**
- test_no_conflicts_single_source
- test_no_conflicts_matching_parties
- test_detects_party_conflict
- test_party_sites_conflict_requires_review

**TestShouldFlagForReview:**
- test_both_party_sites_should_flag
- test_similar_priority_should_flag
- test_large_priority_gap_no_flag

### test_sheets_integration.py (31 tests)

**TestSyncResult:**
- test_basic_creation
- test_total_processed
- test_success_rate
- test_success_rate_empty
- test_str_representation

**TestNameNormalization:**
- test_lowercase_conversion
- test_suffix_removal
- test_middle_initial_removal
- test_punctuation_removal
- test_whitespace_normalization
- test_empty_string

**TestSimilarityCalculation:**
- test_exact_match
- test_empty_strings
- test_similar_names

**TestFuzzyMatching:**
- test_exact_match
- test_case_insensitive
- test_with_suffix
- test_with_middle_initial
- test_different_people

**TestBuildNameIndex:**
- test_builds_index
- test_handles_duplicates

**TestFindExisting:**
- test_finds_exact_match
- test_finds_fuzzy_match
- test_no_match_different_district

**TestSyncDiscoveredCandidates:**
- test_adds_new_candidate
- test_updates_existing_candidate
- test_skips_locked_candidate
- test_handles_empty_list

**TestGetUnmatchedCandidates:**
- test_returns_unmatched

**TestGetCandidatesNeedingParty:**
- test_returns_candidates_without_party
- test_excludes_locked_candidates

## Files Modified/Created

### Created:
- `src/candidate_discovery/aggregator.py` (269 lines)
- `src/candidate_discovery/sheets_integration.py` (338 lines)
- `tests/test_aggregator.py` (318 lines)
- `tests/test_sheets_integration.py` (323 lines)

### Modified:
- `src/candidate_discovery/__init__.py` - Added exports for new modules
- `src/candidate_discovery/sources/__init__.py` - Added SCDP/SCGOP exports
- `src/monitor.py` - Added discovery integration (~90 lines)

## Usage

### Run Discovery Manually
```bash
# Force discovery regardless of schedule
python -m src.monitor --force-discovery

# Or set environment variable
FORCE_DISCOVERY=1 python -m src.monitor
```

### Configure Discovery Schedule
```bash
# In .env
DISCOVERY_ENABLED=true
DISCOVERY_FREQUENCY=weekly  # daily, weekly, or manual
DISCOVERY_SOURCES=ballotpedia,scdp,scgop
```

### Run Tests
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
pytest tests/test_aggregator.py tests/test_sheets_integration.py -v
```

## Verification Results

```
52 tests passed in 0.17s
```

All tests pass successfully.

## Dependencies

No new dependencies required. Uses existing:
- gspread (Google Sheets)
- firecrawl-py (web scraping)
- requests (HTTP)
- tenacity (retry logic)

## Phase Complete

Phase 04-04 successfully implements:
- Multi-source aggregation with priority ordering
- Comprehensive conflict detection and resolution
- Seamless Google Sheets integration
- Respect for party_locked flags
- Full test coverage (52 tests)
- Monitor workflow integration with scheduling
