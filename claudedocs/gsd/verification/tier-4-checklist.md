# Tier 4 Advanced - Verification Checklist

## Automated Tests
```bash
npm run build          # Must pass
npm test               # Must pass
npm run test:e2e       # Must pass
```

## Manual UAT

### Early Vote Tracking
1. Navigate to early vote dashboard (location TBD)
2. If during election season:
   - Verify early vote data displays
   - Verify county-by-county breakdown
   - Verify daily updates show
3. If outside election season:
   - Verify graceful fallback message
   - Verify no errors or broken UI
   - Verify historical data displays (if available)

### Resource Optimizer
1. Navigate to /opportunities
2. Locate resource allocation recommendations
3. Verify recommendations display:
   - Suggested resource levels
   - Priority rankings
   - ROI estimates
4. Verify calculations make sense based on opportunity scores

### Down-Ballot Intelligence Map
1. Navigate to down-ballot map view
2. Verify map renders correctly
3. Verify down-ballot races display
4. Verify filtering by race type works
5. Verify integration with main map

### Full System Integration
1. Start at / (home page)
2. Navigate through complete user journey:
   - Home → select district → view race
   - View candidate details (enriched)
   - Check voter guide features
   - Review opportunities with intelligence
3. Verify all features work together seamlessly

### Performance Check
1. Open browser dev tools → Performance tab
2. Navigate through application
3. Verify no significant performance degradation
4. Verify API calls are cached appropriately
5. Verify no memory leaks (check Memory tab)

### Regression Check
1. Verify all Tier 1 features work
2. Verify all Tier 2 features work
3. Verify all Tier 3 features work
4. Navigate to all main pages - verify no errors
5. Test mobile responsiveness

## Sign-Off
- [ ] All automated tests pass
- [ ] Early vote tracking works (or graceful fallback)
- [ ] Resource optimizer shows recommendations
- [ ] Down-ballot map visualization renders
- [ ] All intelligence features integrate properly
- [ ] No performance degradation
- [ ] No console errors
- [ ] No regressions in Tier 1-3 features
- [ ] No regressions in existing features
- [ ] Build completes without errors
- [ ] Mobile responsive design works
- [ ] Ready for deployment
- [ ] Ready for production use

## Final Milestone Sign-Off
- [ ] All 4 tiers complete and verified
- [ ] Full integration testing passed
- [ ] Documentation updated
- [ ] User acceptance confirmed
- [ ] Ready for production deployment
