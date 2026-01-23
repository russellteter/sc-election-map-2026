# SC Ethics Monitor: Data Remediation

## System Design Document

**Version:** 1.0
**Date:** 2026-01-22
**Status:** Design Complete - Ready for Implementation

---

## 1. Executive Summary

### 1.1 Problem Statement

Investigation on 2026-01-22 revealed that the "complete" implementation (Phases 1-4) has severe data quality issues. The infrastructure works, but the data population and matching logic is broken.

**Critical Finding:** Data exists in source files but is not reaching the Google Sheet correctly.

### 1.2 Solution Overview

This phase remediates 5 specific issues:
1. Party detection name matching failures
2. Race Analysis aggregation producing all zeros
3. Missing incumbent data population
4. Unused Candidate Discovery Pipeline
5. Cross-reference verification against known candidate lists

---

## 2. Gap Analysis

### 2.1 Current State of Google Sheet

**Sheet ID:** `17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo`

| Tab | Status | Issues |
|-----|--------|--------|
| Candidates | 28 rows | 75% (21/28) have UNKNOWN party despite data existing |
| Race Analysis | 170 rows | ALL ZEROS - aggregation completely broken |
| Research Queue | 40 rows | ALL "Pending" status, no assignments |
| Districts | EXISTS | incumbent_name/incumbent_party columns EMPTY |
| Sync Log | EXISTS | Working |

### 2.2 Root Causes Identified

| Issue | Root Cause | Severity |
|-------|------------|----------|
| UNKNOWN parties | Name matching format mismatch | CRITICAL |
| All zeros in Race Analysis | `update_race_analysis()` not counting correctly | CRITICAL |
| Empty incumbent data | Population script never created | HIGH |
| No discovered candidates | Pipeline built but never executed | HIGH |
| Missing cross-reference | No validation against SCHouseMap7.0 | MEDIUM |

### 2.3 Data Sources Verified

**SCHouseMap7.0** (https://kjatwood.github.io/SCHouseMap7.0/):
- 34 blue districts with 35 confirmed Democratic candidates
- District 070 has 2 candidates: Robert Reese (incumbent) + Noah Barker (challenger)

**party-data.json** (`src/data/party-data.json`):
- Contains ALL 35 Democrats from SCHouseMap7.0
- Has 124 House + 46 Senate incumbents
- Includes alternate name forms (e.g., "JA Moore" + "Moore, JA")

**The data exists - the matching/aggregation code is broken.**

---

## 3. Remediation Plan Overview

| Plan | Issue | Priority | Dependency |
|------|-------|----------|------------|
| 05-01 | Fix party detection name matching | CRITICAL | None |
| 05-02 | Fix Race Analysis aggregation | CRITICAL | 05-01 |
| 05-03 | Populate incumbent data | HIGH | None |
| 05-04 | Run candidate discovery pipeline | HIGH | 05-01, 05-02, 05-03 |
| 05-05 | Final sync and verification | MEDIUM | 05-01 through 05-04 |

---

## 4. Technical Details

### 4.1 Party Detection Issue

**Current behavior:**
- `run_party_detection.py` uses `name_similarity()` with 0.85 threshold
- Ethics format: "Morgan, Tyler A"
- party-data.json: "Morgan, Tyler A" (exact match exists!)

**Why it fails:**
- Investigation needed to determine exact mismatch cause
- Likely: normalization differences or lookup order

**Files involved:**
- `sc-ethics-monitor/scripts/run_party_detection.py` (lines 38-50, 71-125)
- `sc-ethics-monitor/src/sheets_sync.py` - `get_all_candidates()` method

### 4.2 Race Analysis Issue

**Current behavior:**
- 170 rows all show:
  - dem_candidates: 0
  - rep_candidates: 0
  - other_candidates: 0
  - race_status: "Unknown"
  - incumbent_name: (empty)
  - incumbent_party: (empty)

**Root cause:** `update_race_analysis()` in sheets_sync.py not properly:
1. Reading candidate data from Candidates tab
2. Grouping by district_id
3. Counting by final_party

### 4.3 Incumbent Data Issue

**Data source available:**
```json
"incumbents": {
  "house": { "1": { "name": "Bill Whitmire", "party": "Republican" }, ... },
  "senate": { "1": { "name": "Thomas C. Alexander", "party": "Republican" }, ... }
}
```

**Missing:** Script to populate this data into Race Analysis and Districts tabs.

### 4.4 Discovery Pipeline Issue

**Status:** Pipeline exists with 213+ passing tests but was NEVER RUN

**Location:** `sc-ethics-monitor/src/candidate_discovery/`

**Execution command:**
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
python scripts/verify_discovery.py --verbose
```

---

## 5. Expected Outcomes

After remediation:

| Metric | Current | Target |
|--------|---------|--------|
| Candidates with party | 7/28 (25%) | 28/28 (100%) |
| Race Analysis counts | All zeros | Actual counts |
| Incumbent data | 0/170 | 170/170 |
| Discovery pipeline | Never run | Run weekly |
| SCHouseMap7.0 match | Unknown | 35/35 verified |

---

## 6. Files to Modify

| File | Purpose | Changes |
|------|---------|---------|
| `scripts/run_party_detection.py` | Party detection | Fix name matching logic |
| `src/sheets_sync.py` | Sheets sync | Fix `update_race_analysis()` |
| `scripts/populate_incumbents.py` | NEW | Create script to populate incumbent data |
| `src/data/party-data.json` | Party data | Already complete, no changes needed |

---

## 7. Verification Checklist

After all plans complete:

- [ ] **Candidates tab**: All 28+ candidates have detected_party filled (not UNKNOWN)
- [ ] **Race Analysis**: Shows actual candidate counts (not all zeros)
- [ ] **Race Analysis**: incumbent_name/incumbent_party populated for all 170 districts
- [ ] **Research Queue**: Items assigned and being processed
- [ ] **Candidate Discovery**: Pipeline has run at least once
- [ ] **Cross-reference**: SCHouseMap7.0's 35 Democrats all appear in sheets

---

## 8. SCHouseMap7.0 Democratic Candidates Reference

35 total candidates extracted 2026-01-22:

| District | Candidate(s) |
|----------|--------------|
| 015 | JA Moore |
| 023 | Chandra Dillard |
| 025 | Wendell Jones |
| 031 | Rosalyn Henderson-Myers |
| 041 | Annie McDaniel |
| 049 | John King |
| 050 | Keishan Scott |
| 051 | David Weeks |
| 054 | Jason Luck |
| 055 | Jackie Hayes |
| 057 | Lucas Atkinson |
| 059 | Terry Alexander |
| 062 | Robert Williams |
| 070 | Robert Reese, Noah Barker |
| 072 | Seth Rose |
| 073 | Chris Hart |
| 074 | Todd Rutherford |
| 075 | Heather Bauer |
| 076 | Leon Howard |
| 077 | Kambrell Garvin |
| 078 | Beth Bernstein |
| 079 | Hamilton Grant |
| 082 | Bill Clyburn |
| 090 | Justin Bamberg |
| 091 | Lonnie Hosey |
| 093 | Jerry Govan |
| 095 | Gilda Cobb-Hunter |
| 101 | Roger Kirby |
| 103 | Carl Anderson |
| 109 | Tiffany Spann-Wilder |
| 111 | Wendell Gilliard |
| 113 | Courtney Waters |
| 119 | Leon Stavrinakis |
| 121 | Michael Rivers |

---

*Document generated for SC Ethics Monitor Phase 5 Remediation*
