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

## Hybrid Workflow: GSD + Ralph Wiggum

This project uses **GSD** for structure/planning and **Ralph Wiggum** for persistent execution.

### GSD Commands (Planning & Structure)

```bash
/gsd:new-project        # Initialize project with brief
/gsd:create-roadmap     # Create roadmap and phases
/gsd:plan-phase N       # Create PLAN.md for phase N
/gsd:progress           # Check current phase status
/gsd:verify-work        # Run verification checklist
/gsd:complete-milestone # Archive milestone, prepare next
```

### Ralph Wiggum Commands (Execution)

```bash
# Execute a phase plan with persistent iteration
/ralph-loop "Execute PLAN.md at .planning/phases/XX-name/XX-01-PLAN.md.
Read @claudedocs/gsd/CONTEXT.md first. Follow task XML exactly.
Commit after each working task." \
  --completion-promise 'All tasks complete and verified' \
  --max-iterations 50

# Cancel an active loop
/cancel-ralph

# Show ralph-wiggum help
/help
```

### Execution Flow

```
/gsd:plan-phase N          → Creates PLAN.md
        ↓
/ralph-loop "..." --completion-promise '...' --max-iterations 50
        ↓
(Claude iterates until promise fulfilled or max reached)
        ↓
/gsd:verify-work           → Manual UAT from verification checklist
        ↓
git push origin main       → Deploy
```

## Quick Start

1. `/clear` - Fresh context
2. `/gsd:new-project` - Initialize (if not done)
3. `/gsd:create-roadmap` - Create phases
4. `/gsd:plan-phase 1` - Plan first phase
5. Use `/ralph-loop` with tier prompt from `gsd/tier-prompts/`
6. `/gsd:verify-work` - Verify completion

## Tier Prompts (for Ralph Loop)

| Tier | Prompt File | Focus |
|------|-------------|-------|
| 1 | `gsd/tier-prompts/tier-1-foundation.md` | API setup, countdown, polling |
| 2 | `gsd/tier-prompts/tier-2-intelligence.md` | Recruitment, profiles, scores |
| 3 | `gsd/tier-prompts/tier-3-enrichment.md` | Candidates, endorsements |
| 4 | `gsd/tier-prompts/tier-4-advanced.md` | Early vote, optimizer, maps |

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
