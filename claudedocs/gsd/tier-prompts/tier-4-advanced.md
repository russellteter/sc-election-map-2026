# Ralph Loop: Tier 4 Advanced

## Command to Execute

```bash
/ralph-loop "Execute Tier 4 Advanced plan.

## Context Files (Read First)
- @claudedocs/gsd/CONTEXT.md
- @claudedocs/gsd/OPERATIONS.md
- @.planning/phases/04-tier-4-advanced/04-01-PLAN.md
- @.planning/phases/03-tier-3-enrichment/SUMMARY.md

## Objectives
- Early vote tracking (election season only)
- Resource optimizer calculations
- Down-ballot intelligence maps

## Key Files to Modify
- src/components/Intelligence/EarlyVoteTracker.tsx - Live vote data
- src/lib/voterIntelligence.ts - Resource optimization algorithms
- src/components/Dashboard/DownBallotMap.tsx - Visualization
- src/app/opportunities/page.tsx - Resource recommendations

## Execution Protocol
1. Read all context files before starting
2. For each task in PLAN.md:
   a. Implement the code changes
   b. Run: npm run build
   c. Test: npm run dev → verify feature works
   d. Commit: git add -A && git commit -m 'feat: [task]'
3. After ALL tasks complete:
   a. Run: npm test && npm run test:e2e
   b. Verify no TypeScript errors
   c. Output <promise>Tier 4 complete and verified</promise>

## Rules
- Complete each task FULLY before next
- NEVER skip verification steps
- Commit working code immediately
- ONLY output promise when ALL verification passes

## Notes
- Early vote tracking only works during active election periods
- Implement graceful fallbacks for off-season
- Test with mock data that simulates election period behavior" \
  --completion-promise 'Tier 4 complete and verified' \
  --max-iterations 50
```

---

## Reference Documentation

### Context Files
- @claudedocs/gsd/CONTEXT.md
- @claudedocs/gsd/OPERATIONS.md
- @.planning/phases/04-tier-4-advanced/04-01-PLAN.md
- @.planning/phases/03-tier-3-enrichment/SUMMARY.md

### Completion Promise
`<promise>Tier 4 complete and verified</promise>`

### Final Verification (All Must Pass)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] Early vote dashboard shows data (or graceful fallback outside election season)
- [ ] Resource allocation recommendations appear on opportunities page
- [ ] Down-ballot map visualization renders correctly
- [ ] All intelligence features work together without conflicts

### Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output `<promise>...</promise>` when ALL final verification passes
- NEVER lie about completion to exit the loop

### Notes on Election Season Features
- Early vote tracking only works during active election periods
- Implement graceful fallbacks for off-season
- Test with mock data that simulates election period behavior
