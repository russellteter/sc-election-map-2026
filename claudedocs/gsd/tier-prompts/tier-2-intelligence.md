# Ralph Loop: Tier 2 Strategic Intelligence

## Context (Read First)
@claudedocs/gsd/CONTEXT.md
@claudedocs/gsd/OPERATIONS.md
@.planning/phases/07-tier-2-intelligence/07-01-PLAN.md
@.planning/phases/06-tier-1-foundation/SUMMARY.md

## Completion Promise
<promise>Tier 2 complete: recruitment pipeline shows live vacant seats, electorate profiles display demographics, mobilization scores calculate correctly</promise>

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

## Tier 2 Objectives
- Recruitment pipeline with live vacant seat data
- Electorate profiles from TargetSmart
- Mobilization scoring integration

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
- [ ] RecruitmentPipeline component renders with real data
- [ ] ElectorateProfile shows partisan composition for House District 1
- [ ] MobilizationCard displays calculated scores (not mock data)
- [ ] Opportunities page shows enhanced intelligence data

## Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output <promise>...</promise> when ALL final verification passes
- NEVER lie about completion to exit the loop

## Key Files to Modify
- `src/lib/voterIntelligence.ts` - Wire up to TargetSmart
- `src/components/Intelligence/RecruitmentPipeline.tsx` - Add real data
- `src/components/Intelligence/ElectorateProfile.tsx` - Display demographics
- `src/components/Intelligence/MobilizationCard.tsx` - Calculate scores
- `src/app/opportunities/page.tsx` - Integrate components
