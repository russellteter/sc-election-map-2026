# Tier 1 Foundation - Verification Checklist

## Automated Tests
```bash
npm run build          # Must pass
npm test               # Must pass (if tests exist)
npm run test:e2e       # Must pass
```

## Manual UAT

### Environment Setup
1. Verify `.env.local` exists in project root
2. Verify it contains:
   ```
   NEXT_PUBLIC_BALLOTREADY_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131
   NEXT_PUBLIC_TARGETSMART_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7
   ```

### Election Countdown
1. Navigate to /voter-guide
2. Verify countdown timer shows days until Nov 3, 2026
3. Verify date comes from BallotReady API (check Network tab)
4. Verify countdown updates display correctly (days, hours, minutes)

### Polling Place Finder
1. Navigate to /voter-guide
2. Enter address: "1600 Main St, Columbia, SC 29201"
3. Verify polling location is returned
4. Verify location includes address and hours
5. Try an invalid address - verify graceful error handling

### API Integration
1. Open browser dev tools → Network tab
2. Refresh /voter-guide page
3. Verify BallotReady API calls are made (check for civicengine.com requests)
4. Verify responses are 200 OK (not 401/403)

### Regression Check
1. Navigate to / (home page)
2. Verify map loads and is interactive
3. Verify chamber toggle works (House/Senate)
4. Verify filters work
5. Verify search works
6. Navigate to /opportunities
7. Verify table loads with data
8. Navigate to /table
9. Verify strategic table loads

## Sign-Off
- [ ] `.env.local` created with API keys
- [ ] All automated tests pass
- [ ] Election countdown works and shows correct date
- [ ] Polling place finder works for SC addresses
- [ ] API calls succeed (no 401/403 errors)
- [ ] No console errors in browser
- [ ] No regressions in existing features
- [ ] Build completes without errors
- [ ] Ready for deployment
