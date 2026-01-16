# Tier 3 Enrichment - Verification Checklist

## Automated Tests
```bash
npm run build          # Must pass
npm test               # Must pass
npm run test:e2e       # Must pass
```

## Manual UAT

### Enhanced Candidate Profiles
1. Navigate to /race/house/1 (or any race with candidates)
2. View candidate cards
3. Verify enriched data displays:
   - Bio information (if available)
   - Previous offices held
   - Committee memberships
4. Verify data comes from BallotReady (check Network tab)

### Turnout-Adjusted Opportunity Scores
1. Navigate to /opportunities
2. View opportunity scores
3. Verify scores incorporate voter turnout data
4. Compare scores with and without turnout adjustment (if visible)
5. Verify calculation breakdown shows turnout factor

### Endorsement Dashboard
1. Navigate to /opportunities (or wherever EndorsementDashboard lives)
2. Locate EndorsementDashboard component
3. Verify endorsements display for candidates
4. Verify endorsement sources are listed
5. Verify endorsement impact on candidate display

### Race Detail Enhancements
1. Navigate to /race/house/1
2. Verify enhanced candidate information displays
3. Verify strategic insights incorporate new data
4. Verify side-by-side candidate comparison works

### Score Calculations
1. Navigate to /opportunities
2. Sort by opportunity score
3. Verify sorting reflects intelligence-adjusted scores
4. Verify top opportunities make sense with enriched data

### Regression Check
1. Navigate to / (home page) - verify map works
2. Verify Tier 1 features:
   - Election countdown works
   - Polling place finder works
3. Verify Tier 2 features:
   - Recruitment pipeline shows data
   - Electorate profiles display
   - Mobilization scores calculate
4. Navigate to all main pages - verify no errors

## Sign-Off
- [ ] All automated tests pass
- [ ] Candidate cards show BallotReady enriched data
- [ ] Opportunity scores include turnout adjustment
- [ ] EndorsementDashboard tracks endorsements
- [ ] Race detail pages show enhanced info
- [ ] API calls to BallotReady succeed
- [ ] No console errors
- [ ] No regressions in Tier 1-2 features
- [ ] No regressions in existing features
- [ ] Build completes without errors
- [ ] Ready for deployment
