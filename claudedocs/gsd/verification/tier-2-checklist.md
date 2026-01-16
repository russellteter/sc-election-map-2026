# Tier 2 Strategic Intelligence - Verification Checklist

## Automated Tests
```bash
npm run build          # Must pass
npm test               # Must pass
npm run test:e2e       # Must pass
```

## Manual UAT

### Recruitment Pipeline
1. Navigate to /opportunities
2. Locate RecruitmentPipeline component
3. Verify it shows vacant seats data (not placeholder text)
4. Verify seats are categorized by opportunity level
5. Click on a vacant seat - verify navigation works

### Electorate Profile
1. Navigate to /race/house/1 (House District 1)
2. Locate ElectorateProfile component
3. Verify partisan composition percentages display
4. Verify demographics data shows (if available)
5. Verify data comes from TargetSmart (check Network tab)

### Mobilization Card
1. Navigate to /opportunities
2. Locate MobilizationCard component
3. Verify mobilization scores display (not "N/A" or placeholder)
4. Verify scores are calculated values (vary by district)
5. Verify score breakdowns show individual factors

### Intelligence Integration
1. Navigate to /opportunities
2. Verify intelligence data enhances the opportunity table
3. Verify sorting by intelligence metrics works
4. Verify filters include intelligence-based options

### API Calls
1. Open browser dev tools → Network tab
2. Navigate through intelligence features
3. Verify TargetSmart API calls succeed
4. Verify responses contain real data

### Regression Check
1. Navigate to / (home page)
2. Verify map still works
3. Verify Tier 1 features still work:
   - Election countdown shows dates
   - Polling place finder works
4. Navigate to all main pages - verify no errors

## Sign-Off
- [ ] All automated tests pass
- [ ] RecruitmentPipeline shows real vacant seat data
- [ ] ElectorateProfile displays demographic data
- [ ] MobilizationCard shows calculated scores
- [ ] Intelligence data integrates into opportunities
- [ ] API calls to TargetSmart succeed
- [ ] No console errors
- [ ] No regressions in Tier 1 features
- [ ] No regressions in existing features
- [ ] Build completes without errors
- [ ] Ready for deployment
