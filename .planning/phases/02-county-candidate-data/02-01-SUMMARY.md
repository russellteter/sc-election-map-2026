---
phase: 02-county-candidate-data
plan: 01
subsystem: data
tags: [scraping, python, beautifulsoup, json, county-data]

# Dependency graph
requires:
  - phase: 01-data-file-scaffolding
    provides: Data file structure and Tier 3 files
provides:
  - Complete county-races.json with 46 SC counties
  - Sheriff data for all 46 counties
  - 6 additional county offices for all counties
  - Reusable Python scrapers for data updates
affects: [county-display, voter-guide, data-refresh]

# Tech tracking
tech-stack:
  added: [beautifulsoup4, requests]
  patterns: [web-scraping, data-merge, conflict-resolution]

key-files:
  created:
    - scripts/scrape-sc-sheriffs.py
    - scripts/scrape-scac-officials.py
    - scripts/merge-county-officials.py
    - scripts/data/sheriffs-raw.json
    - scripts/data/scac-raw.json
  modified:
    - public/data/county-races.json

key-decisions:
  - "Scraped sheriffsc.org for sheriff names - 100% success rate"
  - "Scraped sccounties.org for other officials - 92% success rate"
  - "Register of Deeds only elected in 25/46 counties - rest are combined/appointed"
  - "Newer scraped data wins in conflict resolution"
  - "Party data preserved only where name matched exactly"

patterns-established:
  - "Python scrapers with rate limiting (1 req/sec)"
  - "Raw JSON audit trail in scripts/data/"
  - "Merge script for multi-source data"

issues-created: []

# Metrics
duration: 18min
completed: 2026-01-17
---

# Phase 2 Plan 01: County Candidate Data Summary

**Real incumbent data for all 46 SC counties scraped from sheriffsc.org and sccounties.org with 300 officials across 7 offices**

## Performance

- **Duration:** 18 min
- **Started:** 2026-01-17T20:13:58Z
- **Completed:** 2026-01-17T20:31:36Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Expanded county-races.json from 10 to 46 counties (100% SC coverage)
- Scraped 46 sheriffs from SC Sheriffs' Association
- Scraped 254 other officials from SCAC county directories
- Created reusable Python scrapers for future data updates
- Resolved 51 data conflicts with newer data taking precedence

## Task Commits

Each task was committed atomically:

1. **Task 1: Build SC Sheriffs scraper** - `2045532` (feat)
2. **Task 2: Extract SCAC Directory data** - `2a1d044` (feat)
3. **Task 3: Merge sources and update county-races.json** - `019c82e` (feat)

**Plan metadata:** (pending)

## Files Created/Modified

- `scripts/scrape-sc-sheriffs.py` - Web scraper for sheriffsc.org with regex patterns for various name formats
- `scripts/scrape-scac-officials.py` - Web scraper for sccounties.org county directory pages
- `scripts/merge-county-officials.py` - Merge script combining all sources
- `scripts/data/sheriffs-raw.json` - Raw sheriff data audit trail
- `scripts/data/scac-raw.json` - Raw SCAC data audit trail
- `public/data/county-races.json` - Complete 46-county data file

## Decisions Made

1. **Two-source strategy** - Sheriffs from dedicated sheriffsc.org site (more reliable), other officials from SCAC directory
2. **Register of Deeds handling** - Only 25/46 counties have this as elected position; left null for others
3. **Conflict resolution** - Newer scraped data wins (e.g., Anderson officials updated from 2022 to 2024 election results)
4. **Party data approach** - Only preserved where name matched exactly; 276 officials without party data (needs separate research)

## Deviations from Plan

None - plan executed exactly as written.

## Data Quality

- **Counties with complete data:** 25/46 (7/7 offices)
- **Counties with partial data:** 21/46 (6/7 offices - missing Register of Deeds)
- **Total officials found:** 300
- **Officials with party data:** 24 (8%)
- **Source conflicts resolved:** 51

### Coverage by Office

| Office | Coverage |
|--------|----------|
| Sheriff | 46/46 (100%) |
| Auditor | 46/46 (100%) |
| Treasurer | 45/46 (98%) |
| Coroner | 46/46 (100%) |
| Clerk of Court | 46/46 (100%) |
| Register of Deeds | 25/46 (54%) |
| Probate Judge | 46/46 (100%) |

## Issues Encountered

None - both websites were scrape-friendly with consistent HTML structures.

## Next Phase Readiness

- County data is now complete for all 46 SC counties
- Party affiliations need research for 276 officials (separate task)
- DemoBadge may still be needed for county data since party is incomplete
- Ready for Phase 3: DemoBadge Integration

---
*Phase: 02-county-candidate-data*
*Completed: 2026-01-17*
