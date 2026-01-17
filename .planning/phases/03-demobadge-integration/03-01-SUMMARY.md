---
phase: 03-demobadge-integration
plan: 01
subsystem: ui
tags: [DemoBadge, voter-guide, transparency, components]

# Dependency graph
requires:
  - phase: 02-county-candidate-data
    provides: Real county incumbent data (to differentiate from demo data)
provides:
  - DemoBadge visible on all demo data sections
  - Clear distinction between real and demo data
affects: [voter-guide, ui-consistency]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DemoBadge inline with section title using flex"

key-files:
  created: []
  modified:
    - src/components/VoterGuide/StatewideRaces.tsx
    - src/components/VoterGuide/CongressionalRaces.tsx
    - src/components/VoterGuide/JudicialRaces.tsx
    - src/components/VoterGuide/SchoolBoardRaces.tsx
    - src/components/VoterGuide/SpecialDistricts.tsx
    - src/components/VoterGuide/BallotMeasures.tsx

key-decisions:
  - "DemoBadge placed inline with title using flexbox for consistency"
  - "CountyRaces left without badge - absence of DemoBadge implies real data"

patterns-established:
  - "Section header pattern: flex container with h3 + DemoBadge"

issues-created: []

# Metrics
duration: 3min
completed: 2026-01-17
---

# Phase 3 Plan 01: DemoBadge Integration Summary

**Added DemoBadge to 6 Voter Guide components with demo data; CountyRaces intentionally left without badge to indicate real data**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-17T23:19:55Z
- **Completed:** 2026-01-17T23:22:39Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Added DemoBadge import and component to StatewideRaces, CongressionalRaces, JudicialRaces, SchoolBoardRaces, SpecialDistricts, and BallotMeasures
- Consistent placement pattern: DemoBadge inline with section title using `flex items-center gap-2` wrapper
- CountyRaces correctly left without DemoBadge since it contains real incumbent data from Phase 2 scraping

## Task Commits

Each task was committed atomically:

1. **Task 1 & 2: Add DemoBadge to demo data components** - `de9dc98` (feat)
   - Combined into single commit since Task 2 was verification-only (CountyRaces already had no badge)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/VoterGuide/StatewideRaces.tsx` - Added DemoBadge import and inline badge with "Statewide Offices" title
- `src/components/VoterGuide/CongressionalRaces.tsx` - Added DemoBadge import and inline badge with "U.S. Congress" title
- `src/components/VoterGuide/JudicialRaces.tsx` - Added DemoBadge import and inline badge with "Judicial Offices" title
- `src/components/VoterGuide/SchoolBoardRaces.tsx` - Added DemoBadge import and inline badge with "School Board Races" title
- `src/components/VoterGuide/SpecialDistricts.tsx` - Added DemoBadge import and inline badge with "Special Districts" title
- `src/components/VoterGuide/BallotMeasures.tsx` - Added DemoBadge import and inline badge with "Ballot Measures" title

## Decisions Made

1. **Badge placement**: Used inline flex pattern (`flex items-center gap-2`) to place DemoBadge next to section titles, following the pattern established in RaceProfileClient.tsx
2. **CountyRaces handling**: No badge added - the absence of DemoBadge serves as implicit indication of real data. This is simpler than adding a separate "Real Data" indicator and maintains clear visual distinction.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - straightforward implementation. Pre-existing lint warnings in codebase (unrelated to DemoBadge changes) were noted but not addressed as out of scope.

## Next Phase Readiness

Ready for Phase 4: Voter Guide Decomposition
- All demo data sections now clearly labeled
- CountyRaces real data properly distinguished
- Component patterns established for future use

---
*Phase: 03-demobadge-integration*
*Completed: 2026-01-17*
