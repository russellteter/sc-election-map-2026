# Ralph Loop: Tier 3 Enrichment

## Command to Execute

```bash
/ralph-loop "Execute Tier 3 Enrichment plan.

## Context Files (Read First)
- @claudedocs/gsd/CONTEXT.md
- @claudedocs/gsd/OPERATIONS.md
- @.planning/phases/03-tier-3-enrichment/03-01-PLAN.md
- @.planning/phases/02-tier-2-intelligence/SUMMARY.md

## Objectives
- Enhanced candidate profiles from BallotReady officeholders
- Turnout-adjusted opportunity scores
- Endorsement tracking integration

## Key Files to Modify
- src/lib/ballotready.ts - Add officeholder queries
- src/lib/voterIntelligence.ts - Add turnout adjustments
- src/components/Intelligence/EndorsementDashboard.tsx - Track endorsements
- src/app/race/[chamber]/[district]/page.tsx - Enhanced candidate display
- src/app/opportunities/page.tsx - Intelligence-adjusted scores

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
   c. Output <promise>Tier 3 complete and verified</promise>

## Rules
- Complete each task FULLY before next
- NEVER skip verification steps
- Commit working code immediately
- ONLY output promise when ALL verification passes" \
  --completion-promise 'Tier 3 complete and verified' \
  --max-iterations 50
```

---

## Reference Documentation

### Context Files
- @claudedocs/gsd/CONTEXT.md
- @claudedocs/gsd/OPERATIONS.md
- @.planning/phases/03-tier-3-enrichment/03-01-PLAN.md
- @.planning/phases/02-tier-2-intelligence/SUMMARY.md

### Completion Promise
`<promise>Tier 3 complete and verified</promise>`

### Final Verification (All Must Pass)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run test:e2e` passes
- [ ] Candidate cards show enriched data from BallotReady
- [ ] Opportunity scores include voter intelligence bonuses
- [ ] EndorsementDashboard tracks endorsements
- [ ] Race detail pages show enhanced candidate info

### Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output `<promise>...</promise>` when ALL final verification passes
- NEVER lie about completion to exit the loop
