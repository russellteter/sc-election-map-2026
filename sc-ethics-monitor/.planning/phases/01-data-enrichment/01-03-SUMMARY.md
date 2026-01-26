# Plan 01-03 Summary: Geographic Classification & Composite Score

**Status:** COMPLETE
**Completed:** 2026-01-21
**Output:** `sc-ethics-monitor/data/SC_Ethics_Districts_Enriched.xlsx`

## Accomplishments

### Data Created
- Classified all 170 districts as Urban/Suburban/Rural/Mixed
- Added population estimates for all districts
- Calculated composite recruitment priority scores (0-10)

### Files Created
- `scripts/geographic_data.py` - District type classifications and functions
- `scripts/generate_enriched_excel.py` - Main Excel generation script

### Columns Added to Excel
| Column | Name | Description |
|--------|------|-------------|
| P | district_type | Urban, Suburban, Rural, or Mixed |
| Q | estimated_population | ~40,000 (House) or ~105,000 (Senate) |
| R | composite_score | Recruitment priority (0-10 scale) |

## Distribution by District Type

| Type | Count | Percentage |
|------|-------|------------|
| Suburban | 72 | 42.4% |
| Rural | 44 | 25.9% |
| Mixed | 30 | 17.6% |
| Urban | 24 | 14.1% |
| **Total** | **170** | **100%** |

## Composite Score Distribution

The composite score combines term status, election margin, and incumbent party:

| Score Range | Priority | Count |
|-------------|----------|-------|
| 8-10 | High | 0 |
| 7 | High | 4 |
| 5-6 | Medium | 50 |
| 2-4 | Low | 97 |
| 0-1 | Very Low | 19 |

## Top Priority Districts (Score 7+)

| District | Score | Status | Party | Margin | Region | Type |
|----------|-------|--------|-------|--------|--------|------|
| SC-House-063 | 7 | First-term | R | 2.5% | Pee Dee | Suburban |
| SC-Senate-016 | 7 | First-term | R | 8.9% | Upstate | Suburban |
| SC-Senate-029 | 7 | First-term | R | 4.3% | Pee Dee | Mixed |
| SC-Senate-046 | 7 | First-term | R | 7.9% | Lowcountry | Suburban |

## Score Formula Components

```
Composite Score (0-10) =
    Term Status (0-3):  Open=3, First-term=2, Veteran=1, Long-serving=0
  + Margin (0-3):       <5%=3, <10%=2, >10%=1, Unopposed=0
  + Party (0-2):        R incumbent=2, Open=2, D incumbent=0
```

## Data Quality Notes

- All 170 districts have district_type classifications
- Population estimates based on 2020 census apportionment
- Composite scores calculated consistently across all districts
- Conditional formatting applied (Red=High, Yellow=Medium, Green=Low)

## Phase 1 Complete Summary

### Total Data Enrichment

| Category | Columns | New Fields |
|----------|---------|------------|
| County Mapping | I-K | 3 fields |
| Incumbent Enrichment | L-O | 4 fields |
| Geographic Classification | P-R | 3 fields |
| **Total** | **10 columns** | **10 fields** |

**Total Data Points:** 1,700 (170 districts x 10 enrichment fields)

### Scripts Created

| Script | Purpose |
|--------|---------|
| district_county_mapping.py | County/region mappings |
| incumbent_enrichment.py | Term calculations, election data |
| geographic_data.py | Urban/rural classifications |
| generate_enriched_excel.py | Main Excel generation |

### Excel File

**Location:** `sc-ethics-monitor/data/SC_Ethics_Districts_Enriched.xlsx`
**Size:** 23.8 KB
**Rows:** 170 data rows + 1 header row
**Columns:** A-R (18 columns total)

## Import Instructions for Google Sheets

1. Open Google Sheets at: https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit
2. Go to **File > Import**
3. Click **Upload** and select `SC_Ethics_Districts_Enriched.xlsx`
4. Choose **Replace spreadsheet** or **Insert new sheet(s)**
5. Click **Import data**
6. Verify:
   - All 170 districts imported
   - Columns A-R present with headers
   - Conditional formatting preserved (or re-apply if needed)

## Next Phase: Usability Improvements

With Phase 1 complete, Phase 2 can proceed to add:
- Named ranges for easier formula reference
- Additional data validation rules
- Improved formulas in Race Analysis tab
- Cross-tab reference formulas

**Note:** Phase 2 improvements will be applied directly in Google Sheets after importing the Excel file.
