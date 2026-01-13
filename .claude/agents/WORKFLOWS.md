# Agent Workflows - Quick Start Guide

## How to Use the Multi-Agent System

This guide shows how to invoke agents for common tasks on the SC Election Map project.

---

## Quick Reference

| Task | Agent | Command |
|------|-------|---------|
| Plan new feature | Strategic Planner | `/sc:brainstorm "feature" --strategy systematic` |
| Run tests | QA/Testing | `Task tool: subagent_type="EvidenceQA"` |
| Design component | UI/UX | `Task tool: subagent_type="UI Designer"` |
| Debug data issues | Data Pipeline | `Task tool: subagent_type="Backend Architect"` |
| Performance audit | Performance | `Task tool: subagent_type="Performance Benchmarker"` |
| Generate docs | Documentation | `/sc:document` or `/sc:index` |

---

## Workflow 1: Implement a New Feature

**Scenario:** User requests "Add search functionality"

### Step 1: Strategic Planning
```
/sc:brainstorm "Add search functionality to filter districts by candidate name" --strategy systematic --depth deep
```

Agent output: Task breakdown, priority, assigned agents

### Step 2: UI/UX Design
```
Use Task tool with:
- subagent_type: "UI Designer"
- prompt: "Design SearchBar component for filtering districts.
  Read .claude/agents/ui-ux.md for design tokens.
  Requirements: autocomplete, mobile-friendly, accessible"
```

Agent output: Component design, props interface, CSS

### Step 3: Implementation
```
Use Task tool with:
- subagent_type: "Frontend Developer"
- prompt: "Implement SearchBar component per design.
  Location: src/components/Search/SearchBar.tsx
  See design spec from UI/UX agent"
```

### Step 4: QA Testing
```
Use Task tool with:
- subagent_type: "EvidenceQA"
- prompt: "Test SearchBar implementation.
  Read .claude/agents/qa-testing.md for test suites.
  Requirements: functional tests, accessibility, screenshots"
```

Agent output: Test report with evidence

### Step 5: Documentation
```
/sc:document src/components/Search/SearchBar.tsx --type inline
```

### Step 6: Release Approval
Strategic Planner reviews all outputs and approves release.

---

## Workflow 2: Fix a Bug

**Scenario:** User reports "Map shows wrong color for district 45"

### Step 1: QA Investigation
```
Use Task tool with:
- subagent_type: "EvidenceQA"
- prompt: "Investigate: District 45 showing wrong color.
  1. Navigate to https://russellteter.github.io/sc-election-map-2026/
  2. Take screenshot of district 45
  3. Check candidates.json for district 45 data
  4. Verify expected vs actual color"
```

Agent output: Bug confirmed with evidence, root cause identified

### Step 2: Prioritization
```
Strategic Planner assigns priority based on impact:
- Critical: Production broken
- High: User-visible bug
- Medium: Minor visual issue
```

### Step 3: Fix Implementation
Assigned to appropriate agent (UI/UX for visual, Data for data issues)

### Step 4: Verification
```
Use Task tool with:
- subagent_type: "EvidenceQA"
- prompt: "Verify fix for district 45 color bug.
  Take before/after screenshots as evidence."
```

---

## Workflow 3: Performance Audit

**Scenario:** Weekly performance check

### Step 1: Run Audit
```
Use Task tool with:
- subagent_type: "Performance Benchmarker"
- prompt: "Run performance audit on SC Election Map.
  Read .claude/agents/performance.md for targets.
  Check: Lighthouse scores, bundle size, Core Web Vitals"
```

### Step 2: Review Results
Agent provides:
- Lighthouse scores vs targets
- Bundle analysis
- Recommendations

### Step 3: Optimization (if needed)
If scores below target, create optimization tasks.

---

## Workflow 4: Data Enrichment

**Scenario:** New candidate detected without party info

### Step 1: Research
```
Use Task tool with:
- subagent_type: "Backend Architect"
- prompt: "Research party affiliation for candidate 'John Smith, House District 45'.
  Sources: news, social media, candidate website, Ballotpedia.
  Update party-data.json if verified."
```

### Step 2: Update Data
Agent updates party-data.json with verified information.

### Step 3: Verify in UI
After next pipeline run, verify candidate shows correct party color.

---

## Workflow 5: Documentation Update

**Scenario:** After feature release

### Step 1: Component Docs
```
/sc:document src/components/NewFeature --type api --style detailed
```

### Step 2: User Guide
```
Use Task tool with:
- subagent_type: "Explore"
- prompt: "Create user documentation for new FilterPanel feature.
  Include: usage instructions, screenshots, examples"
```

### Step 3: Update README
```
/sc:document README.md --type guide
```

---

## Parallel Agent Execution

When tasks are independent, launch agents in parallel:

```
// Single message with multiple Task tool calls:

Task 1: subagent_type="UI Designer", prompt="Design SearchBar"
Task 2: subagent_type="Backend Architect", prompt="Design search API"
Task 3: subagent_type="Performance Benchmarker", prompt="Set search performance budget"
```

All three agents work simultaneously, then results are combined.

---

## Agent Communication Examples

### Handoff: UI → QA
After UI/UX creates a component:
```
QA Agent receives:
- Component location: src/components/Search/SearchBar.tsx
- Design spec reference
- Test requirements
```

### Escalation: QA → Planner
When QA finds critical issue:
```
Strategic Planner receives:
- Issue description
- Evidence (screenshots)
- Severity assessment
- Recommended action
```

### Broadcast: Planner → All
Phase transition announcement:
```
All agents receive:
- Phase 8 complete
- Phase 9 starting
- New priorities
```

---

## Best Practices

1. **Always read agent config** before launching
   - `.claude/agents/[agent-name].md`

2. **Provide clear context** in prompts
   - Reference relevant files
   - State expected outputs

3. **Use parallel execution** when possible
   - Independent tasks can run simultaneously

4. **Collect evidence** for decisions
   - Screenshots for visual changes
   - Test reports for code changes

5. **Update TodoWrite** throughout
   - Track progress
   - Document blockers

6. **Document outcomes**
   - Update relevant docs after each workflow
