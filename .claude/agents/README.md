# SC Election Map 2026 - Multi-Agent Architecture

## Overview

This project uses a coordinated multi-agent system for development, testing, and maintenance. Each agent has specialized responsibilities and communicates through a defined protocol.

## Agent Architecture

```
                    ┌─────────────────────────────────────────┐
                    │         ORCHESTRATION LAYER             │
                    │    (Claude Code - Central Coordinator)  │
                    └─────────────────┬───────────────────────┘
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   STRATEGIC   │           │   QA/TESTING  │           │    UI/UX      │
│   PLANNER     │◀─────────▶│    AGENT      │◀─────────▶│ ENHANCEMENT   │
│    AGENT      │           │               │           │    AGENT      │
└───────────────┘           └───────────────┘           └───────────────┘
        │                             │                             │
        ▼                             ▼                             ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│     DATA      │           │  PERFORMANCE  │           │ DOCUMENTATION │
│   PIPELINE    │◀─────────▶│    AGENT      │◀─────────▶│    AGENT      │
│    AGENT      │           │               │           │               │
└───────────────┘           └───────────────┘           └───────────────┘
```

## Agents

| Agent | Subagent Type | Responsibilities |
|-------|---------------|------------------|
| Strategic Planner | `Plan` | Roadmap, architecture, prioritization |
| QA/Testing | `EvidenceQA` | Playwright E2E, regression, accessibility |
| UI/UX Enhancement | `UI Designer` | Design system, accessibility, responsive |
| Data Pipeline | `Backend Architect` | Data quality, enrichment, new sources |
| Performance | `Performance Benchmarker` | Bundle size, Core Web Vitals, caching |
| Documentation | `Explore` | User guides, API docs, code comments |

## Usage

### Launching Agents

```
# Strategic planning session
/sc:brainstorm "new feature idea" --strategy systematic

# QA testing session
Task tool with subagent_type="EvidenceQA"

# UI enhancement session
Task tool with subagent_type="UI Designer"

# Data pipeline work
Task tool with subagent_type="Backend Architect"

# Performance audit
Task tool with subagent_type="Performance Benchmarker"

# Documentation generation
/sc:document or /sc:index
```

### Feature Development Workflow

1. **Strategic Planner** analyzes feature request, creates task breakdown
2. **UI/UX Agent** designs components and interactions
3. **Data Pipeline Agent** prepares data requirements
4. **Performance Agent** sets performance budgets
5. **Implementation** (coordinated development)
6. **QA Agent** runs comprehensive tests
7. **Documentation Agent** updates all docs
8. **Strategic Planner** approves release

## Success Metrics

| Agent | Key Metric | Target |
|-------|------------|--------|
| Strategic Planner | Feature delivery rate | > 90% |
| QA/Testing | Test coverage | > 80% |
| UI/UX Enhancement | Lighthouse A11y | > 95 |
| Data Pipeline | Party enrichment rate | > 70% |
| Performance | Lighthouse Performance | > 90 |
| Documentation | Doc coverage | > 80% |

## Files

- `strategic-planner.md` - Strategic planning agent configuration
- `qa-testing.md` - QA and testing agent configuration
- `ui-ux.md` - UI/UX enhancement agent configuration
- `data-pipeline.md` - Data pipeline agent configuration
- `performance.md` - Performance agent configuration
- `documentation.md` - Documentation agent configuration
