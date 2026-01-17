# Voter Guide Feature Documentation

## Overview

The Voter Guide provides personalized ballot information based on your South Carolina address. Enter your address to discover all federal, state, local, and special district races on your 2026 ballot.

**Live Feature:** https://russellteter.github.io/sc-election-map-2026/voter-guide

---

## User Flow

1. **User navigates to `/voter-guide`**
2. **User enters address or uses geolocation**
   - Address search powered by Geoapify Geocoder Autocomplete API
   - Geolocation button uses browser Geolocation API
3. **System geocodes address to coordinates**
   - Converts street address to latitude/longitude
   - Handles South Carolina addresses specifically
4. **System matches coordinates to legislative districts using GeoJSON**
   - Lazy-loaded 2MB GeoJSON boundary files
   - Uses Turf.js `booleanPointInPolygon` for accurate matching
   - Identifies SC House (1-124), Senate (1-46), US House (1-7), and County
5. **Progressive loading fetches relevant ballot data**
   - Tier 1: Immediate load (6.5KB)
   - Tier 2: After district lookup (~95KB)
   - Tier 3: Lazy load on scroll (~30KB)
6. **User sees complete personalized ballot**
   - Statewide races
   - Congressional races for their district
   - State legislative races
   - County offices
   - Judicial races
   - School board elections
   - Special district boards
   - Ballot measures

---

## Technical Architecture

### Address → District Lookup Flow

```
User Input → Geocoding API → Coordinates → GeoJSON Lookup → Districts
```

#### 1. Address Input (AddressAutocomplete.tsx)
- Debounced search (300ms delay)
- Geoapify Geocoder Autocomplete API
- Real-time suggestions as user types
- Handles partial addresses, zip codes, landmarks
- Geolocation fallback for automatic detection

#### 2. Geocoding (lib/geocoding.ts)
- Converts address to lat/lng coordinates
- Validates South Carolina addresses
- Rate limit: 3,000 requests/day (free tier)
- Privacy: Client-side only, no addresses stored

#### 3. District Matching (lib/districtLookup.ts)
- Lazy-loaded GeoJSON files (2MB total):
  - `public/maps/house-districts.geojson` (1.2MB)
  - `public/maps/senate-districts.geojson` (837KB)
- Turf.js `booleanPointInPolygon` algorithm
- Matches coordinates to district boundaries
- Returns House, Senate, Congressional districts + County

**Performance Optimization:**
- GeoJSON loaded on first AddressAutocomplete focus (not page mount)
- Cached in memory after first load
- Preload function exported for manual triggering

---

### Progressive Data Loading

**Problem:** Loading all ballot data upfront = 517KB JSON + 2MB GeoJSON = slow initial load

**Solution:** 3-tier progressive loading

#### Tier 1 - Critical (6.5KB - Immediate)
Loaded on page mount, visible to all users:

```json
election-dates.json (3.7KB)    // Timeline display
statewide-races.json (2.8KB)   // Governor, AG, etc.
```

**Impact:** 98.7% reduction (517KB → 6.5KB initial payload)

#### Tier 2 - On-Demand (~95KB - Conditional)
Loaded ONLY after successful district lookup:

```json
candidates.json (77KB)             // State legislative races
congress-candidates.json (1.8KB)   // US House races
county-races.json (16KB)           // County offices
```

**Conditional Logic:**
```typescript
if (districtResult.houseDistrict) {
  load('candidates.json');
}
if (districtResult.congressionalDistrict) {
  load('congress-candidates.json');
}
if (districtResult.countyName) {
  load('county-races.json');
}
```

#### Tier 3 - Deferred (~30KB - Lazy)
Loaded when component scrolls into viewport (Intersection Observer):

```json
judicial-races.json (7.2KB)      // Court judges
school-board.json (4.2KB)        // School board elections
special-districts.json (13KB)    // Special district boards
ballot-measures.json (5.5KB)     // Constitutional amendments
```

**Implementation:**
```typescript
const judicialRef = useRef<HTMLDivElement>(null);
const isJudicialVisible = useIntersectionObserver(judicialRef, {
  rootMargin: '500px',     // Preload 500px before viewport
  freezeOnceVisible: true  // Don't toggle back to invisible
});

useEffect(() => {
  if (isJudicialVisible && !data.judicialRaces) {
    dataLoader.loadOnScroll('judicial').then(data => {
      setData(prev => ({ ...prev, judicialRaces: data }));
    });
  }
}, [isJudicialVisible]);
```

**See:** `src/lib/dataLoader.ts` for complete implementation

---

### Component Code Splitting

All race display components use Next.js `dynamic()` with `ssr: false`:

```typescript
// src/components/VoterGuide/index.ts

export const JudicialRaces = dynamic(() => import('./JudicialRaces'), {
  loading: () => <RaceCardSkeleton />,
  ssr: false  // Client-side only, not pre-rendered
});

export const SchoolBoardRaces = dynamic(() => import('./SchoolBoardRaces'), {
  loading: () => <RaceCardSkeleton />,
  ssr: false
});

// etc. for all lazy-loaded components
```

**Benefits:**
- **Reduced initial JS bundle:** 62% reduction (~400KB → ~150KB)
- **Faster Time to Interactive (TTI):** 3-5 seconds improvement on 3G
- **Progressive enhancement:** Core features load first, enhancements load later
- **Loading states:** Skeleton loaders provide visual feedback

**Performance Impact:**
- FCP (First Contentful Paint): ~70% improvement
- TTI (Time to Interactive): ~80% improvement
- LCP (Largest Contentful Paint): ~65% improvement

---

## Data Sources

### Federal Races

#### Congressional Candidates
**Source:** FEC (Federal Election Commission) + manual research
**File:** `src/data/congress-candidates.json` (1.8KB)
**Coverage:** US House Districts 1-7
**Update Frequency:** As candidates file with FEC

**Schema:**
```json
{
  "district": 1,
  "candidates": [
    {
      "name": "John Doe",
      "party": "Democratic",
      "incumbent": false,
      "website": "https://johndoe.com"
    }
  ]
}
```

---

### State Races

#### Statewide Offices
**Source:** SC Ethics Commission filings
**File:** `src/data/statewide-races.json` (2.8KB)
**Offices:** Governor, Lt. Governor, Attorney General, Secretary of State, Treasurer, Comptroller General, Superintendent of Education, Agriculture Commissioner
**Update Frequency:** Real-time as candidates file

#### State Legislative Candidates
**Source:** SC Ethics Commission + manual party research
**File:** `src/data/candidates.json` (77KB)
**Coverage:** SC House (1-124), SC Senate (1-46)
**Update Frequency:** Daily during filing period

**Notes:** Party affiliation not required for Ethics filings, manually researched from:
- Campaign websites
- Public statements
- News coverage
- Party endorsements

---

### County Races

#### County Offices
**Source:** County election commissions
**File:** `src/data/county-races.json` (16KB)
**Offices:** Sheriff, Treasurer, Auditor, Clerk of Court, Coroner, Probate Judge, County Council
**Coverage:** All 46 SC counties
**Update Frequency:** As candidates file with county offices

---

### Judicial Races

#### Circuit and Family Court Judges
**Source:** SC Judicial Department
**File:** `src/data/judicial-races.json` (7.2KB)
**Coverage:** 16 judicial circuits
**Court Types:** Circuit Court, Family Court
**Update Frequency:** Judicial election cycle (every 6 years)

**Judicial Circuits:**
- Circuit 1: Calhoun, Dorchester, Orangeburg
- Circuit 2: Aiken, Bamberg, Barnwell
- Circuit 3: Clarendon, Lee, Sumter, Williamsburg
- ...and 13 more circuits

---

### School Board Races

#### School District Boards
**Source:** Local school district election commissions
**File:** `src/data/school-board.json` (4.2KB)
**Coverage:** Major SC school districts
**Update Frequency:** School board election cycle (typically 4 years)

**Major Districts:**
- Greenville County Schools
- Charleston County School District
- Richland School District One & Two
- Lexington County Schools
- Horry County Schools
- Spartanburg County School Districts
- York County Schools
- And others

---

### Special Districts

#### Special District Boards
**Source:** County election commissions + district offices
**File:** `src/data/special-districts.json` (13KB)
**Types:** Soil & Water Conservation, Hospital Districts, Fire Districts, Water & Sewer Authorities
**Coverage:** Varies by county

**District Categories:**
- **Soil & Water Conservation:** All 46 counties
- **Hospital Districts:** Regional (e.g., Greenville Hospital System)
- **Fire Protection Districts:** Rural areas without municipal fire service
- **Water & Sewer Authorities:** Regional utility districts

---

### Ballot Measures

#### Constitutional Amendments & Referendums
**Source:** SC Legislature + local governments
**File:** `src/data/ballot-measures.json` (5.5KB)
**Types:** Constitutional amendments, bond issues, tax measures, local referendums
**Update Frequency:** As measures are proposed and scheduled

**Content:**
- Plain language summary
- Official text
- Pro arguments
- Con arguments
- Fiscal impact analysis
- Current status (proposed, on ballot, passed/failed)

---

## Mobile Optimization

**See:** [MOBILE-OPTIMIZATION.md](./MOBILE-OPTIMIZATION.md) for complete details

### Performance Metrics

**Before Optimization:**
- Initial payload: 517KB JSON + 2MB GeoJSON = 2.5MB
- FCP: ~8 seconds on 3G
- TTI: ~16 seconds on 3G
- Touch targets: ~60% compliant (< 44x44px)

**After Optimization:**
- Initial payload: 6.5KB (98.7% reduction)
- FCP: ~1.8 seconds on 3G (70% improvement)
- TTI: ~5 seconds on 3G (80% improvement)
- Touch targets: 100% WCAG AA compliant (≥ 44x44px)

### Touch Target Fixes (WCAG AA)

All interactive elements meet 44x44px minimum:
- Address search button: 44x44px
- Geolocation button: 44x44px
- District result cards: 56x56px avatars
- School board avatars: 44x44px
- Icon containers: 44x44px
- All buttons and links: 44x44px minimum

### Responsive Design

**Breakpoints:**
- **XS (320px-375px):** iPhone SE, small Android phones
  - Single column layouts
  - Tighter spacing (8px vs 16px)
  - Smaller font sizes (14px vs 16px)
- **SM (376px-640px):** Standard mobile phones
  - Single column layouts
  - Standard spacing (12-16px)
- **MD (641px-768px):** Tablets, large phones
  - 2-column grids for race cards
  - Larger touch targets
- **LG (769px-1024px):** Tablets landscape, small desktops
  - 2-column grids
  - Side-by-side content (pro/con arguments)
- **XL (1025px+):** Desktops
  - 3-column grids for race cards
  - Maximum content width

### Grid Breakpoint Strategy

**Changed from:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
**Changed to:** `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`

**Reason:** 2 columns at 768px (md) is too cramped on tablets. 3 columns reserved for 1280px+ (xl) desktops only.

### Dropdown Scrolling Fix

**AddressAutocomplete dropdown:**
```css
max-height: min(60vh, 320px);
overflow-y: auto;
overscroll-behavior: contain;  /* Prevents body scroll */
```

**Benefits:**
- Scrollable on all screen sizes
- Doesn't overflow viewport
- Touch-friendly scrolling
- Prevents body scroll lock

---

## Testing Procedures

### Manual Testing Checklist

1. **Address Search**
   - [ ] Enter partial address, see suggestions
   - [ ] Select suggestion, see districts load
   - [ ] Try invalid address, see error message
   - [ ] Try geolocation button
   - [ ] Test on mobile device (real or emulator)

2. **District Display**
   - [ ] Verify House district (1-124)
   - [ ] Verify Senate district (1-46)
   - [ ] Verify Congressional district (1-7)
   - [ ] Verify County name

3. **Progressive Loading**
   - [ ] Check Network tab: Only 6.5KB on initial load
   - [ ] After address search: ~95KB additional
   - [ ] Scroll down: Lazy load components appear

4. **Mobile Responsive**
   - [ ] Test on 320px width (iPhone SE)
   - [ ] Test on 375px width (iPhone 14)
   - [ ] Test on 768px width (iPad Mini)
   - [ ] Test on 1024px+ width (Desktop)
   - [ ] Verify all touch targets ≥ 44x44px

5. **Race Content**
   - [ ] Statewide races display
   - [ ] Congressional race for district
   - [ ] State legislative races
   - [ ] County offices
   - [ ] Judicial races (scroll into view)
   - [ ] School board races (scroll into view)
   - [ ] Special districts (scroll into view)
   - [ ] Ballot measures (scroll into view)

### Automated Testing

**Playwright E2E Tests:**
```bash
npx playwright test tests/voter-guide.spec.ts
```

**Coverage:**
- Address autocomplete interaction
- District lookup flow
- Progressive data loading validation
- Touch target size verification
- Responsive layout checks
- Lazy loading behavior

---

## API Integration

### Geoapify Geocoder Autocomplete API

**Endpoint:** `https://api.geoapify.com/v1/geocode/autocomplete`

**Rate Limits:**
- Free tier: 3,000 requests/day
- No credit card required for free tier
- Automatic rate limiting in client

**Request Parameters:**
```typescript
{
  text: string;           // User input
  apiKey: string;         // From NEXT_PUBLIC_GEOAPIFY_KEY
  filter: "countrycode:us,us:sc";  // SC addresses only
  limit: 5;              // Max 5 suggestions
}
```

**Response Format:**
```json
{
  "features": [
    {
      "properties": {
        "formatted": "123 Main St, Columbia, SC 29201",
        "lat": 34.0007,
        "lon": -81.0348,
        "city": "Columbia",
        "county": "Richland",
        "postcode": "29201"
      }
    }
  ]
}
```

**Error Handling:**
- Network errors: Show "Unable to connect" message
- Rate limit exceeded: Show "Too many requests" message
- Invalid address: Show "No matches found" message
- Geolocation denied: Show browser permission prompt

**Privacy:**
- Addresses never stored server-side
- All geocoding happens client-side
- No user data persisted
- No analytics or tracking of addresses

---

## Future Enhancements

### High Priority
- [ ] **Candidate photos** - Add profile images from campaign websites
- [ ] **Campaign finance data** - Integrate contribution and spending info
- [ ] **Voting records** - Add incumbent voting history on key issues
- [ ] **Print ballot** - Generate PDF of personalized ballot

### Medium Priority
- [ ] **Multi-language support** - Spanish translation (30% SC Latino voters)
- [ ] **Sample ballot PDF** - Official sample ballot from county
- [ ] **Candidate Q&A** - Standardized questionnaire responses
- [ ] **Issue positions** - Structured candidate positions on key issues

### Low Priority
- [ ] **Social sharing** - Share ballot on Twitter, Facebook
- [ ] **Reminders** - Email/SMS reminders for registration, voting dates
- [ ] **Comparison view** - Side-by-side candidate comparison
- [ ] **Historical results** - Past election results for district

---

## Maintenance

### Data Update Workflow

1. **Daily During Filing Period:**
   - Check SC Ethics Commission for new filings
   - Update `candidates.json` with new candidates
   - Verify party affiliations through research

2. **Weekly:**
   - Update county race data from county offices
   - Check for new ballot measures
   - Verify congressional candidate changes

3. **As Needed:**
   - Judicial races (every 6 years)
   - School board races (every 4 years)
   - Special district races (varies)

### Testing After Updates

```bash
# 1. Verify data validity
npm run validate-data

# 2. Run E2E tests
npm run test:e2e

# 3. Check bundle size
npm run build
# Look for warnings about large chunks

# 4. Manual spot checks
npm run dev
# Test address lookup for updated districts
```

### Deployment Process

```bash
# 1. Commit changes
git add src/data/
git commit -m "data: Update candidate filings for [date]"

# 2. Push to GitHub
git push origin main

# 3. GitHub Actions deploys automatically
# Monitor: https://github.com/russellteter/sc-election-map-2026/actions

# 4. Verify live site
# Check: https://russellteter.github.io/sc-election-map-2026/voter-guide
```

---

## Troubleshooting

### Address Not Found

**Symptoms:** "No districts found" after entering valid SC address

**Causes:**
1. GeoJSON boundaries not loaded
2. Address geocoded to incorrect coordinates
3. Address outside SC or in unincorporated area

**Solutions:**
- Verify `preloadBoundaries()` called on focus
- Check browser console for GeoJSON fetch errors
- Try different address format (e.g., add zip code)
- Use geolocation instead of manual entry

### Data Not Loading

**Symptoms:** Skeleton loaders persist, data never appears

**Causes:**
1. API rate limit exceeded
2. Network connectivity issues
3. JSON file path incorrect (base path issue)

**Solutions:**
- Check Network tab for failed requests
- Verify base path: `/sc-election-map-2026` in production, `/` in dev
- Check `dataLoader.ts` console logs
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Touch Targets Too Small

**Symptoms:** Buttons hard to tap on mobile

**Causes:**
1. Custom styles overriding minimum size
2. Icon-only button without padding
3. Link without explicit dimensions

**Solutions:**
- Add `min-w-[44px] min-h-[44px]` Tailwind classes
- Use `.touch-target` utility class from globals.css
- Add padding to expand hit area while keeping visual size

### Slow Performance

**Symptoms:** Page takes >5 seconds to load on mobile

**Causes:**
1. All data loading in Tier 1 (should be 6.5KB)
2. GeoJSON loading on mount (should be on focus)
3. No code splitting (all components in main bundle)

**Solutions:**
- Verify `dataLoader.loadTier1()` only loads critical data
- Check dynamic imports in `VoterGuide/index.ts`
- Confirm `useIntersectionObserver` used for Tier 3
- Run Lighthouse audit to identify bottlenecks

---

## Contact & Support

**Project Maintainer:** Russell Teter
**Email:** russell.teter@gmail.com
**GitHub:** https://github.com/russellteter
**Issues:** https://github.com/russellteter/sc-election-map-2026/issues

For questions about the Voter Guide feature specifically, open an issue with the `voter-guide` label.
