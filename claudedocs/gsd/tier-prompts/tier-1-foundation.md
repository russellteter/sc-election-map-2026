# Ralph Loop: Tier 1 Foundation

## Context (Read First)
@claudedocs/gsd/CONTEXT.md
@claudedocs/gsd/OPERATIONS.md
@.planning/phases/06-tier-1-foundation/06-01-PLAN.md

## Completion Promise
<promise>Tier 1 complete: election countdown shows live dates, polling place lookup returns SC locations, build passes, E2E tests pass</promise>

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

## Tier 1 Objectives
- Configure API credentials in .env.local
- Enhance BallotReady client for live election timeline
- Enhance TargetSmart client for basic voter queries
- Create/wire ElectionCountdown component
- Create/wire PollingPlaceFinder component

## Verification Checkpoints
After each task, verify:
- [ ] `npm run build` completes without errors
- [ ] Feature works in browser at localhost:3000
- [ ] No console errors in browser dev tools
- [ ] Existing features still work (no regressions)

## Final Verification (All Must Pass)
- [ ] `npm run build` succeeds
- [ ] `npm test` passes (or no tests if none exist yet)
- [ ] `npm run test:e2e` passes
- [ ] Election countdown displays date from BallotReady API
- [ ] Polling place finder returns results for: "1600 Main St, Columbia, SC"
- [ ] Voter guide page loads without errors

## Iteration Rules
- Complete each task FULLY before moving to next
- NEVER skip verification steps
- Commit working code immediately (atomic commits)
- If stuck on a task for 3+ iterations, document the blocker and move on
- ONLY output <promise>...</promise> when ALL final verification passes
- NEVER lie about completion to exit the loop

## API Patterns to Follow
```typescript
// Rate limiting pattern
const RATE_LIMIT_MS = 100;
let lastCall = 0;
async function rateLimit() {
  const elapsed = Date.now() - lastCall;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS - elapsed));
  }
  lastCall = Date.now();
}

// Cache pattern
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

## Component Patterns to Follow
```typescript
'use client';
import { useState, useEffect } from 'react';
// Glassmorphic styling via Tailwind
// Skeleton loader during data fetch
// Error boundary fallback
```
