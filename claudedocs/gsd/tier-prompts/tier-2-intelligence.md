# Ralph Loop: Tier 2 Strategic Intelligence

## Command to Execute

```bash
/ralph-loop "Execute Tier 2 Strategic Intelligence plan.

## Context Files (Read First)
- @claudedocs/gsd/CONTEXT.md
- @claudedocs/gsd/OPERATIONS.md
- @.planning/phases/02-tier-2-intelligence/02-01-PLAN.md
- @.planning/phases/01-tier-1-foundation/SUMMARY.md

## Objectives
- Recruitment pipeline with live vacant seat data
- Electorate profiles from TargetSmart
- Mobilization scoring integration

## Key Files to Modify
- src/lib/voterIntelligence.ts - Wire up to TargetSmart
- src/components/Intelligence/RecruitmentPipeline.tsx - Add real data
- src/components/Intelligence/ElectorateProfile.tsx - Display demographics
- src/components/Intelligence/MobilizationCard.tsx - Calculate scores
- src/app/opportunities/page.tsx - Integrate components

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
   c. Output <promise>Tier 2 complete and verified</promise>

## Rules
- Complete each task FULLY before next
- NEVER skip verification steps
- Commit working code immediately
- ONLY output promise when ALL verification passes" \
  --completion-promise 'Tier 2 complete and verified' \
  --max-iterations 50
```

---

## Reference Documentation

### Context Files
- @claudedocs/gsd/CONTEXT.md
- @claudedocs/gsd/OPERATIONS.md
- @.planning/phases/02-tier-2-intelligence/02-01-PLAN.md
- @.planning/phases/01-tier-1-foundation/SUMMARY.md

### Completion Promise
`<promise>Tier 2 complete and verified</promise>`

### Final Verification (All Must Pass)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] RecruitmentPipeline component renders with real data
- [ ] ElectorateProfile shows partisan composition for House District 1
- [ ] MobilizationCard displays calculated scores (not mock data)
- [ ] Opportunities page shows enhanced intelligence data

### Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output `<promise>...</promise>` when ALL final verification passes
- NEVER lie about completion to exit the loop
