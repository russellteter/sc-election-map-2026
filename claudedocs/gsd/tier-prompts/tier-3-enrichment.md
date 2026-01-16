# Ralph Loop: Tier 3 Enrichment

## Context (Read First)
@claudedocs/gsd/CONTEXT.md
@claudedocs/gsd/OPERATIONS.md
@.planning/phases/08-tier-3-enrichment/08-01-PLAN.md
@.planning/phases/07-tier-2-intelligence/SUMMARY.md

## Completion Promise
<promise>Tier 3 complete: enhanced candidate profiles showing BallotReady data, opportunity scores include voter intelligence bonuses, endorsement tracking functional</promise>

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

## Tier 3 Objectives
- Enhanced candidate profiles from BallotReady officeholders
- Turnout-adjusted opportunity scores
- Endorsement tracking integration

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
- [ ] Candidate cards show enriched data from BallotReady
- [ ] Opportunity scores include voter intelligence bonuses
- [ ] EndorsementDashboard tracks endorsements
- [ ] Race detail pages show enhanced candidate info

## Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output <promise>...</promise> when ALL final verification passes
- NEVER lie about completion to exit the loop

## Key Files to Modify
- `src/lib/ballotready.ts` - Add officeholder queries
- `src/lib/voterIntelligence.ts` - Add turnout adjustments
- `src/components/Intelligence/EndorsementDashboard.tsx` - Track endorsements
- `src/app/race/[chamber]/[district]/page.tsx` - Enhanced candidate display
- `src/app/opportunities/page.tsx` - Intelligence-adjusted scores
