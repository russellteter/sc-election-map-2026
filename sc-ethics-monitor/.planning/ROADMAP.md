# SC Ethics Monitor - Source of Truth Sprint Roadmap

## Overview

This sprint improves the Google Sheets Source of Truth across multiple dimensions: data quality, usability, visual design, and automated candidate discovery.

**Duration:** 2 sprints
**Status:** COMPLETE

---

## Phase 4: Candidate Discovery (COMPLETE)
**Status:** COMPLETE

Build a multi-source candidate discovery pipeline that aggregates candidate data from authoritative public sources.

### Plans

| Plan | Description | Status |
|------|-------------|--------|
| 04-01 | Core Infrastructure (dataclasses, deduplicator) | COMPLETE |
| 04-02 | Ballotpedia Source (Firecrawl scraping) | COMPLETE |
| 04-03 | Party Sources (SCDP/SCGOP websites) | COMPLETE |
| 04-04 | Aggregator and Sheets Integration | COMPLETE |
| 04-05 | Reporting and Verification | COMPLETE |

### Deliverables
- [x] candidate_discovery module with source adapters
- [x] Ballotpedia scraper for all 170 districts
- [x] SCDP and SCGOP party website scrapers
- [x] Candidate aggregator with deduplication
- [x] Google Sheets integration for discovered candidates
- [x] Coverage gap reporting
- [x] End-to-end pipeline tests (213 tests passing)

### New Modules
- `src/candidate_discovery/__init__.py`
- `src/candidate_discovery/sources/base.py`
- `src/candidate_discovery/sources/ballotpedia.py`
- `src/candidate_discovery/sources/scdp.py`
- `src/candidate_discovery/sources/scgop.py`
- `src/candidate_discovery/aggregator.py`
- `src/candidate_discovery/deduplicator.py`
- `src/candidate_discovery/sheets_integration.py`
- `src/candidate_discovery/reporter.py`

### Test Results

| Test File | Tests |
|-----------|-------|
| test_deduplicator.py | 40 |
| test_ballotpedia_source.py | 44 |
| test_party_sources.py | 58 |
| test_aggregator.py | 21 |
| test_sheets_integration.py | 31 |
| test_discovery_pipeline.py | 19 |
| **Total** | **213** |

---

## Completed Phases

## Phase 1: Data Enrichment
**Status:** COMPLETE

Enrich the existing data model with county mapping and additional incumbent metadata.

**Approach:** Generated Excel file with all enrichments (instead of manual Google Sheets editing).

### Plans

| Plan | Description | Status |
|------|-------------|--------|
| 01-01 | Add county columns to Districts tab | COMPLETE |
| 01-02 | Enrich incumbent data (term info, election history) | COMPLETE |
| 01-03 | Add geographic helper columns (region, urban/rural) | COMPLETE |

### Deliverables
- [x] Districts tab includes county column
- [x] Incumbent term years populated
- [x] Regional groupings for filtering
- [x] Urban/rural classification
- [x] Composite recruitment score
- [x] Excel file generated for import

### Columns Added (I-R)
| Column | Name | Description |
|--------|------|-------------|
| I | primary_county | Main county for district |
| J | all_counties | Comma-separated list |
| K | region | Upstate, Midlands, Lowcountry, Pee Dee |
| L | terms_served | Number of terms |
| M | last_election_margin | Victory margin (%) |
| N | last_election_votes | Total votes |
| O | term_status | Open, First-term, Veteran, Long-serving |
| P | district_type | Urban, Suburban, Rural, Mixed |
| Q | estimated_population | ~40K (House), ~105K (Senate) |
| R | composite_score | Recruitment priority (0-10) |

---

## Phase 2: Usability Improvements
**Status:** COMPLETE

Add validation rules, formula columns, and a Lists reference tab.

### Plans

| Plan | Description | Status |
|------|-------------|--------|
| 02-01 | Lists tab, data validation, formula columns | COMPLETE |

### Deliverables
- [x] Lists tab with 8 validation columns
- [x] Data validation on party, region, term_status, district_type
- [x] Formula columns for analysis
- [x] Hidden Lists tab

### Columns Added (S-V)
| Column | Name | Formula Purpose |
|--------|------|-----------------|
| S | is_competitive | TRUE if margin < 10% |
| T | recruitment_priority | High-D-Recruit, Open-Seat, Monitor, Low |
| U | needs_d_candidate | TRUE if R incumbent |
| V | score_category | High, Medium, Low |

---

## Phase 3: Design Polish
**Status:** COMPLETE

Create Dashboard tab and polish visual formatting for operational use.

### Plans

| Plan | Description | Status |
|------|-------------|--------|
| 03-01 | Dashboard, conditional formatting, tab styling | COMPLETE |

### Deliverables
- [x] Dashboard tab with 6 KPI sections
- [x] Color-coded party columns (blue/red)
- [x] Color-scaled composite score
- [x] Highlighted term status (Open=gold, First-term=blue)
- [x] Tab colors (Dashboard=blue, Districts=green)
- [x] Freeze panes and auto-filter
- [x] Lists tab hidden

### Dashboard KPIs
- Overview: Total, House, Senate counts
- By Party: R, D, Open counts
- By Region: Upstate, Midlands, Lowcountry, Pee Dee
- By Term Status: Open, First-term, Veteran, Long-serving
- By District Type: Urban, Suburban, Rural, Mixed
- Priority Targeting: Competitive, Very Competitive, High Priority

---

## Sprint Summary

### Excel File
**Location:** `sc-ethics-monitor/data/SC_Ethics_Districts_Enriched.xlsx`
**Size:** 33.1 KB
**Rows:** 170 districts + 1 header
**Columns:** 22 (A-V)

### Tab Structure
1. **Dashboard** (blue tab) - KPI summary with 18 metrics
2. **Districts** (green tab) - All district data with validation
3. **Lists** (hidden) - Validation reference values

### Data Coverage
- 170 SC legislative districts (124 House + 46 Senate)
- 46 SC counties mapped
- 4 regions defined
- 4 term status categories
- 4 district types
- 31 competitive districts identified
- 4 high-priority recruitment targets

---

## Verification Checklist

### Phase 1 (DONE)
- [x] All 170 districts have county assigned
- [x] All 170 districts have region assigned
- [x] All 170 districts have district_type
- [x] All 170 districts have composite_score
- [x] Excel file generated successfully

### Phase 2 (DONE)
- [x] Lists tab with 8 validation columns
- [x] Data validation applied to 4 columns
- [x] Formula columns S-V calculate correctly
- [x] No formula errors

### Phase 3 (DONE)
- [x] Dashboard shows all 18 KPIs
- [x] Conditional formatting applied
- [x] Tab colors set correctly
- [x] Lists tab hidden
- [x] Freeze panes and filters enabled

### Phase 4 (DONE)
- [x] candidate_discovery module created
- [x] BallotpediaSource scrapes all 170 districts
- [x] SCDPSource and SCGOPSource implemented
- [x] CandidateAggregator merges multi-source data
- [x] DiscoverySheetIntegration syncs to Google Sheets
- [x] CoverageReporter generates metrics
- [x] 213 unit tests passing
- [x] verify_discovery.py script operational
- [x] README documentation complete

---

## Import Instructions

**Import the complete Excel file to Google Sheets:**

1. Open: https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit
2. Go to **File > Import**
3. Click **Upload** tab
4. Select: `sc-ethics-monitor/data/SC_Ethics_Districts_Enriched.xlsx`
5. Choose **Replace spreadsheet** or **Insert new sheet(s)**
6. Click **Import data**
7. Verify:
   - Dashboard tab shows KPIs
   - Districts tab has 170 rows, 22 columns (A-V)
   - Lists tab is hidden (right-click to unhide if needed)
   - Conditional formatting preserved

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/district_county_mapping.py` | County/region mappings |
| `scripts/incumbent_enrichment.py` | Term calculations, election data |
| `scripts/geographic_data.py` | Urban/rural classifications |
| `scripts/generate_enriched_excel.py` | Main Excel generation (Phase 1-3) |
| `scripts/verify_discovery.py` | Candidate discovery verification |

To regenerate the Excel file:
```bash
cd sc-ethics-monitor
python scripts/generate_enriched_excel.py
```

To run candidate discovery:
```bash
cd sc-ethics-monitor
FORCE_DISCOVERY=1 python src/monitor.py --force-discovery
```

To verify discovery pipeline:
```bash
cd sc-ethics-monitor
python scripts/verify_discovery.py --dry-run
```
