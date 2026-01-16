# SC Election Map 2026 - Documentation Index

## Quick Navigation
| Document | Purpose |
|----------|---------|
| [Project Bible](./# SC Election Map 2026 - Project Bible.md) | Complete strategic context, mission, API specs |
| [API Integration Plan](./API-INTEGRATION-PLAN.md) | 4-tier implementation roadmap |
| [gsd/CONTEXT.md](./gsd/CONTEXT.md) | Condensed context for GSD plans |
| [gsd/OPERATIONS.md](./gsd/OPERATIONS.md) | All dev/deploy/test commands |

## Current State
- **Working:** Map, opportunities, voter guide, race details, table, filters, KPIs
- **Stubbed:** BallotReady API, TargetSmart API, voter intelligence features

## GSD Commands
```bash
/gsd:progress           # Check current phase status
/gsd:plan-phase N       # Create PLAN.md for phase N
/gsd:execute-phase N    # Execute all plans in phase N
/gsd:verify-work        # Run verification checklist
/gsd:complete-milestone # Archive milestone, prepare next
```

## Ralph Loop Commands
```bash
/ralph-loop "prompt" --completion-promise 'PHRASE' --max-iterations 50
```

## Quick Start
1. Read `gsd/CONTEXT.md` (2 min)
2. Run `/gsd:progress` to see current state
3. Run `/gsd:plan-phase N` for next phase

## Tier Overview
| Tier | Phase | Focus |
|------|-------|-------|
| 1 - Foundation | 6 | API credentials, election countdown, polling place finder |
| 2 - Intelligence | 7 | Recruitment pipeline, electorate profiles, mobilization scores |
| 3 - Enrichment | 8 | Enhanced candidates, turnout-adjusted scores, endorsements |
| 4 - Advanced | 9 | Early vote tracking, resource optimizer, down-ballot maps |

## File Structure
```
claudedocs/
├── README.md                     # This file
├── # SC Election Map 2026 - Project Bible.md
├── API-INTEGRATION-PLAN.md
└── gsd/
    ├── CONTEXT.md                # Condensed execution context
    ├── OPERATIONS.md             # Dev/deploy/test commands
    ├── tier-prompts/
    │   ├── tier-1-foundation.md
    │   ├── tier-2-intelligence.md
    │   ├── tier-3-enrichment.md
    │   └── tier-4-advanced.md
    └── verification/
        ├── tier-1-checklist.md
        ├── tier-2-checklist.md
        ├── tier-3-checklist.md
        └── tier-4-checklist.md
```
