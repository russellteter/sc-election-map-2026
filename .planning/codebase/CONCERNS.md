# Codebase Concerns

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## Tech Debt

**Large Page Component (voter-guide/page.tsx):**
- Issue: Main voter guide page is 666 lines - handles address input, district lookup, all race sections
- File: `src/app/voter-guide/page.tsx`
- Why: Rapid iteration during development, incremental feature additions
- Impact: Hard to maintain, test, and extend; cognitive overhead
- Fix approach: Extract sections into dedicated components (FederalRaces, StatewideRaces, CountyRaces, etc.)

**Hardcoded County Election Office URLs:**
- Issue: County contact URLs are hardcoded in components
- File: `src/components/VoterGuide/` (exact file TBD)
- Why: Quick implementation without data abstraction
- Impact: Cannot update URLs without code changes, no central data source
- Fix approach: Move to `public/data/county-contacts.json` or state config

**No DemoBadge Usage in Voter Guide:**
- Issue: Voter guide components don't use DemoBadge despite demo data
- Files: `src/app/voter-guide/page.tsx`, `src/components/VoterGuide/*.tsx`
- Why: DemoBadge pattern established later, not retrofitted
- Impact: Users may not realize candidate data is demo/placeholder
- Fix approach: Add DemoBadge to candidate cards and race sections

## Known Bugs

**Empty County Race Candidates:**
- Symptoms: County races display with "No candidates" despite race entries existing
- Trigger: Load voter guide, view any county race section
- File: `public/data/county-races.json`
- Workaround: None (data gap)
- Root cause: JSON file has race entries but `"candidates": []` arrays are empty
- Fix: Populate with real or demo candidate data

## Data Gaps

**Missing Data Files:**
- Files not found that may be referenced in code:
  - `judicial-races.json` - Judicial retention elections
  - `school-board.json` - School board candidates
  - `ballot-measures.json` - Ballot initiatives/referendums
  - `special-districts.json` - Special district races
- Impact: These race types cannot display, may cause silent failures
- Fix: Create files with demo data or remove references

**Incomplete County Data:**
- Issue: County-level offices have structure but no candidate data
- File: `public/data/county-races.json`
- Example: Sheriff, Coroner, Auditor races have empty candidates arrays
- Impact: County races section appears incomplete
- Fix: Scrape SC Ethics Commission or generate demo data

## Security Considerations

**Client-Side API Keys:**
- Risk: `NEXT_PUBLIC_GEOAPIFY_KEY` exposed in client bundle
- File: `src/components/VoterGuide/AddressAutocomplete.tsx`
- Current mitigation: Geoapify has domain restrictions, key is rate-limited
- Recommendations: Monitor Geoapify dashboard for abuse, consider server proxy

**No Input Sanitization for Address:**
- Risk: Address input passed directly to external APIs
- File: `src/lib/geocoding.ts`
- Current mitigation: External APIs handle their own sanitization
- Recommendations: Basic XSS sanitization before display

## Performance Bottlenecks

**GeoJSON Boundary Loading:**
- Problem: ~2MB GeoJSON loaded when user focuses address input
- File: `src/lib/districtLookup.ts`
- Measurement: First load adds 2-3 seconds on slow connections
- Cause: Full boundaries needed for point-in-polygon
- Improvement path:
  - Simplify boundary polygons (reduce vertex count)
  - Load only relevant state boundaries
  - Consider quadtree/spatial index

**No Caching Between Sessions:**
- Problem: All data re-fetched on each page visit
- File: `src/lib/dataLoader.ts`
- Measurement: 100KB+ loaded per visit
- Cause: In-memory cache only, no persistence
- Improvement path: LocalStorage caching with version invalidation

## Fragile Areas

**Address Autocomplete Debouncing:**
- File: `src/components/VoterGuide/AddressAutocomplete.tsx`
- Why fragile: Complex state management with debounce, API calls, keyboard navigation
- Common failures: Race conditions if user types quickly then selects
- Safe modification: Add comprehensive tests before changes
- Test coverage: Limited (component is large)

**District Lookup Flow:**
- Files: `src/lib/districtLookup.ts`, `src/lib/congressionalLookup.ts`
- Why fragile: Multiple coordinate systems, county→district mappings, GeoJSON parsing
- Common failures: Coordinates at district boundaries may return unexpected results
- Safe modification: Test with edge case coordinates (borders, corners)
- Test coverage: Unknown

## Scaling Limits

**Static JSON Data:**
- Current capacity: 5 states, 876 districts
- Limit: JSON files will grow linearly with states (estimated 100KB per state)
- Symptoms at limit: Slow initial load, high bandwidth usage
- Scaling path:
  - Split data by state (lazy load per state)
  - Consider IndexedDB for client-side storage
  - Server-side API for 50-state version

**GitHub Pages:**
- Current capacity: Unlimited bandwidth (for public repos)
- Limit: 100MB repo size recommended, 1GB hard limit
- Symptoms at limit: Slow clone times, push failures
- Scaling path: Move large data files to separate CDN

## Dependencies at Risk

**Geoapify Free Tier:**
- Risk: Limited requests (3000/day on free tier), may hit limits
- Impact: Address autocomplete stops working
- Migration plan: Upgrade plan or implement Nominatim as full fallback

**@geoapify/geocoder-autocomplete:**
- Risk: Small npm package, update frequency unknown
- Impact: May need to maintain fork if abandoned
- Migration plan: Can replace with direct API calls if needed

## Missing Critical Features

**No Address Validation Feedback:**
- Problem: Invalid addresses may return empty results with no user feedback
- Current workaround: User tries different address
- Blocks: User experience on failed lookups
- Implementation complexity: Low (add validation messaging)

**No "My Location" Feature:**
- Problem: Users must type full address, no geolocation option
- Current workaround: Type address manually
- Blocks: Mobile users, accessibility
- Implementation complexity: Medium (browser geolocation API + reverse geocode)

**No Saved Addresses:**
- Problem: Users must re-enter address on each visit
- Current workaround: None
- Blocks: Returning user experience
- Implementation complexity: Low (localStorage)

## Test Coverage Gaps

**Voter Guide Page:**
- What's not tested: Main voter guide page component (666 lines)
- File: `src/app/voter-guide/page.tsx`
- Risk: Complex UI flow could break unnoticed
- Priority: High
- Difficulty: Complex mocking needed for geocoding + district lookup

**District Lookup Logic:**
- What's not tested: Point-in-polygon accuracy, edge cases
- File: `src/lib/districtLookup.ts`
- Risk: Coordinate boundary errors
- Priority: High
- Difficulty: Need test coordinates for each district

**Geocoding Fallback:**
- What's not tested: Geoapify→Nominatim fallback flow
- File: `src/lib/geocoding.ts`
- Risk: Fallback might silently fail
- Priority: Medium
- Difficulty: Need to mock API failures

## Improvement Opportunities (Voter Guide Focus)

**Data Quality:**
1. Scrape real candidate data from SC Ethics Commission
2. Add real judicial retention candidates
3. Populate county race candidates
4. Add school board candidates for major districts

**UX Enhancements:**
1. Add "Use My Location" button
2. Save last searched address in localStorage
3. Add DemoBadge to demo data sections
4. Improve error messaging for failed lookups

**Technical:**
1. Break up voter-guide/page.tsx into smaller components
2. Add comprehensive test coverage
3. Implement persistent caching
4. Optimize GeoJSON loading

---

*Concerns audit: 2026-01-17*
*Update as issues are fixed or new ones discovered*
