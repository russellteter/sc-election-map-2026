# Blue Intelligence - Claude Code Documentation

> Quick navigation for Claude Code context loading

---

## Context Loading Workflow

For new Claude Code sessions, load context in this order:

### 1. Quick Start (30 seconds)
```
/CLAUDE.md → Instant project overview and status
```

### 2. Mission Context (if needed)
```
.planning/PROJECT.md → Mission, strategic context, constraints
```

### 3. Current Progress
```
.planning/STATE.md → Phase completion status
docs/CURRENT-STATE.md → Live metrics, feature matrix
```

### 4. Deep Context (when needed)
```
claudedocs/BLUE-INTELLIGENCE-BIBLE.md → Full strategic and technical context
```

### 5. Technical Reference
```
.planning/codebase/OVERVIEW.md → Consolidated codebase documentation
```

---

## Document Index

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `/CLAUDE.md` | Primary entry point | Every session |
| `.planning/PROJECT.md` | Mission & strategy | Understanding goals |
| `.planning/STATE.md` | Progress tracking | Checking current state |
| `.planning/ROADMAP.md` | Phase planning | Planning future work |
| `docs/CURRENT-STATE.md` | Live metrics | Verifying deployment |
| `BLUE-INTELLIGENCE-BIBLE.md` | Full context | Deep understanding |
| `.planning/codebase/OVERVIEW.md` | Technical reference | Implementation work |

---

## GSD Workflow Commands

This project uses the GSD (Get Stuff Done) system:

```bash
/gsd:progress        # Check current state and route to next action
/gsd:plan-phase N    # Create detailed plan for phase N
/gsd:execute-plan    # Execute a PLAN.md file
/gsd:verify-work     # Manual UAT verification
```

---

## Current Project Status

**Phase A:** COMPLETE (5 states, 876 districts, all 12 features)
**Live URL:** https://russellteter.github.io/sc-election-map-2026/
**Lighthouse:** 100/94/96/100

---

## Directory Structure

```
claudedocs/
├── README.md                     # This file
├── BLUE-INTELLIGENCE-BIBLE.md    # Complete project context
└── gsd/
    ├── CONTEXT.md                # Condensed execution context
    ├── OPERATIONS.md             # Dev/deploy/test commands
    ├── tier-prompts/             # Execution prompts by tier
    │   ├── tier-1-foundation.md
    │   ├── tier-2-intelligence.md
    │   ├── tier-3-enrichment.md
    │   └── tier-4-advanced.md
    └── verification/             # Verification checklists
        ├── tier-1-checklist.md
        ├── tier-2-checklist.md
        ├── tier-3-checklist.md
        └── tier-4-checklist.md
```

---

## Key Information

### States Deployed
- South Carolina (SC) - Real + Demo data
- North Carolina (NC) - Demo data
- Georgia (GA) - Demo data
- Florida (FL) - Demo data
- Virginia (VA) - Demo data

### Tech Stack
- Next.js 16 + React 19
- TypeScript (strict mode)
- Tailwind CSS v4
- Static export to GitHub Pages

### Critical Constraints
- Static export (no server runtime)
- Neutral public UI (no overt Democratic branding)
- <10KB initial payload (mobile-first)
- Demo data clearly labeled (DemoBadge component)

---

## Quick Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npm test         # Run tests
```

---

*For the primary Claude Code entry point, see `/CLAUDE.md`*
