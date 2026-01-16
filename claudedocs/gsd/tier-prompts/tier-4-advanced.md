# Ralph Loop: Tier 4 Advanced

## Context (Read First)
@claudedocs/gsd/CONTEXT.md
@claudedocs/gsd/OPERATIONS.md
@.planning/phases/09-tier-4-advanced/09-01-PLAN.md
@.planning/phases/08-tier-3-enrichment/SUMMARY.md

## Completion Promise
<promise>Tier 4 complete: early vote dashboard functional, resource allocation recommendations display, down-ballot map visualization works</promise>

## Execution Protocol
1. Read all @context files before starting
2. For each task in PLAN.md:
   a. Implement the code changes
   b. Run verification: `npm run build`
   c. Test manually: `npm run dev` → check feature works
   d. Commit: `git add -A && git commit -m "feat: [task description]"`
3. After all tasks:
   a. Run full test suite: `npm test && npm run test:e2e`
   b. Verify no TypeScript errors
   c. Only then output <promise>...</promise>

## Tier 4 Objectives
- Early vote tracking (election season only)
- Resource optimizer calculations
- Down-ballot intelligence maps

## Verification Checkpoints
After each task, verify:
- [ ] `npm run build` completes without errors
- [ ] Feature works in browser at localhost:3000
- [ ] No console errors in browser dev tools
- [ ] Existing features still work (no regressions)

## Final Verification (All Must Pass)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] Early vote dashboard shows data (or graceful fallback outside election season)
- [ ] Resource allocation recommendations appear on opportunities page
- [ ] Down-ballot map visualization renders correctly
- [ ] All intelligence features work together without conflicts

## Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output <promise>...</promise> when ALL final verification passes
- NEVER lie about completion to exit the loop

## Key Files to Modify
- `src/components/Intelligence/EarlyVoteTracker.tsx` - Live vote data
- `src/lib/voterIntelligence.ts` - Resource optimization algorithms
- `src/components/Dashboard/DownBallotMap.tsx` - Visualization
- `src/app/opportunities/page.tsx` - Resource recommendations
- New route: `/intelligence` or integrated into existing pages

## Notes on Election Season Features
- Early vote tracking only works during active election periods
- Implement graceful fallbacks for off-season
- Test with mock data that simulates election period behavior
