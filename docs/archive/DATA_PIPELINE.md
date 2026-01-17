# Data Pipeline Documentation

Comprehensive guide to the data processing, enrichment, and integration pipeline for the SC 2026 Election Map.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Sources](#data-sources)
3. [Data Flow](#data-flow)
4. [Data Enrichment](#data-enrichment)
5. [Schema Reference](#schema-reference)
6. [Cache-Busting Strategy](#cache-busting-strategy)
7. [Manual Data Updates](#manual-data-updates)
8. [Quality Assurance](#quality-assurance)

---

## Overview

The SC 2026 Election Map uses a **multi-source data integration pipeline** that combines:
1. **SC Ethics Commission** - Raw candidate filings (no party data)
2. **kjatwood SCHouseMap7.0** - Verified Democratic candidates (40 House districts)
3. **Historical Election Results** - Competitiveness scoring and trends

All data is **statically committed** to `/public/data/` and served with **cache-busting timestamps** to ensure freshness.

---

## Data Sources

### 1. SC Ethics Commission (Primary)

**URL:** https://ethicsfiling.sc.gov/public/campaign-reports/reports

**What it provides:**
| Field | Example | Description |
|-------|---------|-------------|
| Candidate Name | "Courtney Waters" | Full name as filed |
| Office | "SC House District 113" | Office sought |
| Report ID | "414669" | Unique identifier |
| Filing Date | "2025-05-08" | Date report filed |
| Ethics URL | `https://ethicsfiling.sc.gov/...` | Link to filing |

**What it lacks:**
- ❌ Party affiliation (not required for Ethics filings)
- ❌ Incumbent status
- ❌ Historical election data

**Format:** HTML table (requires web scraping)

**Update Frequency:** Real-time (as candidates file)

---

### 2. kjatwood SCHouseMap7.0 (Party Attribution)

**URL:** https://kjatwood.github.io/SCHouseMap7.0/

**What it provides:**
- 40 Democratic House candidates
- District numbers
- Verified party attributions

**Format:** Embedded JavaScript object in page source:
```javascript
const candidates = {
  "015": "JA Moore",
  "023": "Chandra Dillard",
  "113": "Courtney Waters",
  // ... 40 total entries
}
```

**Integration:** Scraped once and manually merged into `party-data.json`

**Coverage:** ~32% of House Democrats (40 of 124 districts)

---

### 3. Historical Election Results (Manual Compilation)

**Sources:**
- Ballotpedia
- SC Election Commission archives
- News reports

**What it provides:**
| Field | Example | Description |
|-------|---------|-------------|
| Winner | "Terry Alexander (D)" | Name and party |
| Votes | 12,345 | Vote count |
| Margin | +48.2% | Victory margin |
| Uncontested | true/false | Race status |

**Coverage:** 2024, 2022, 2020 for all 170 districts

**Used for:**
- Competitiveness scoring (0-100 scale)
- Swing district detection (party flips)
- Sparkline trend visualization

---

## Voter Guide Data Sources

### 4. Ballot Measures

**Source:** SC Legislature - Published constitutional amendments and referendums

**File:** `src/data/ballot-measures.json`

**What it provides:**
| Field | Description |
|-------|-------------|
| id | Unique identifier (e.g., "amendment-2026-01") |
| title | Short title (e.g., "Property Tax Relief Amendment") |
| description | Full text description of the measure |
| proArguments | Array of arguments in favor |
| conArguments | Array of arguments against |
| impactSummary | Plain language explanation of what passage would mean |
| type | "constitutional-amendment" or "referendum" |
| jurisdiction | "statewide" or county name |

**Update Frequency:** As amendments are proposed (typically during legislative session)

**Coverage:** All statewide ballot measures + major county referendums

**Schema:**
```typescript
interface BallotMeasure {
  id: string;
  title: string;
  description: string;
  proArguments: string[];
  conArguments: string[];
  impactSummary: string;
  type: 'constitutional-amendment' | 'referendum';
  jurisdiction: 'statewide' | string;  // County name if local
}
```

---

### 5. Judicial Races

**Source:** SC Judicial Department - Circuit and Family Court elections

**File:** `src/data/judicial-races.json`

**What it provides:**
| Field | Description |
|-------|-------------|
| court | "Circuit Court" or "Family Court" |
| circuit | Circuit number (1-16) |
| seat | Seat identifier (e.g., "Seat 1") |
| candidates | Array of judicial candidates |
| incumbentName | Name of current judge (if applicable) |

**Update Frequency:** Judicial election cycle (typically every 6 years)

**Coverage:** All 16 circuits in South Carolina

**Schema:**
```typescript
interface JudicialRace {
  court: 'Circuit Court' | 'Family Court';
  circuit: number;  // 1-16
  seat: string;
  candidates: JudicialCandidate[];
  incumbentName?: string;
}

interface JudicialCandidate {
  name: string;
  incumbent: boolean;
  experience: string;  // Years of legal practice
  background?: string;  // Education, previous positions
}
```

**Note:** Judicial races in SC are retention elections (judges run uncontested for retention) or contested elections when seats are vacant.

---

### 6. School Board Races

**Source:** Local school district election commissions

**File:** `src/data/school-board.json`

**What it provides:**
| Field | Description |
|-------|-------------|
| district | School district name |
| county | County or counties served |
| seats | Array of contested board seats |

**Update Frequency:** School board election cycle (varies by district)

**Coverage:** Major districts (Greenville, Charleston, Richland, Lexington, etc.)

**Schema:**
```typescript
interface SchoolBoardRace {
  district: string;  // "Greenville County Schools"
  county: string | string[];  // Single or multiple counties
  seats: SchoolBoardSeat[];
}

interface SchoolBoardSeat {
  seat: string;  // "District 23" or "At-Large Seat 1"
  candidates: SchoolBoardCandidate[];
  incumbentName?: string;
}

interface SchoolBoardCandidate {
  name: string;
  incumbent: boolean;
  background?: string;
}
```

**Note:** School board elections are non-partisan in South Carolina.

---

### 7. Special Districts

**Source:** County election commissions

**File:** `src/data/special-districts.json`

**What it provides:**
| Field | Description |
|-------|-------------|
| districtType | Type of special district |
| name | District name |
| county | County served |
| seats | Board seats being elected |

**Update Frequency:** Special district election cycle (varies by type)

**Coverage:** Major districts - Soil & Water Conservation, Hospital Districts, Fire Districts

**Types of Special Districts:**
- Soil & Water Conservation Districts
- Hospital District boards
- Fire District boards
- Public Service District boards

**Schema:**
```typescript
interface SpecialDistrict {
  districtType: 'soil-water' | 'hospital' | 'fire' | 'public-service';
  name: string;
  county: string | string[];
  seats: SpecialDistrictSeat[];
}

interface SpecialDistrictSeat {
  seat: string;
  candidates: SpecialDistrictCandidate[];
  incumbentName?: string;
}

interface SpecialDistrictCandidate {
  name: string;
  incumbent: boolean;
  background?: string;
}
```

---

### 8. Address Geocoding (Geoapify)

**Service:** Geoapify Geocoder Autocomplete API

**Purpose:** Convert user-entered SC addresses to latitude/longitude coordinates

**API Endpoint:** `https://api.geoapify.com/v1/geocode/autocomplete`

**Rate Limit:** 3,000 requests/day (free tier)

**Usage Flow:**
1. User types address in AddressAutocomplete component
2. Debounced search (300ms) triggers API call
3. API returns suggestions with coordinates
4. User selects suggestion
5. Coordinates passed to district lookup

**Request Example:**
```typescript
const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&apiKey=${API_KEY}&filter=countrycode:us&filter=circle:-80.5,34.0,100000`;
```

**Response Schema:**
```typescript
interface GeocodeSuggestion {
  properties: {
    formatted: string;        // "123 Main St, Columbia, SC 29201"
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    postcode: string;
    lat: number;              // Latitude
    lon: number;              // Longitude
  };
}
```

**Privacy:** No addresses are stored. Geocoding happens client-side. API calls include no user identification.

**Error Handling:**
- Rate limit exceeded: Show fallback message with geolocation option
- Invalid address: Show "No results found" message
- Network error: Retry with exponential backoff

---

### 9. District Boundaries (GeoJSON)

**Source:** SC Legislature - Official district shapefiles converted to GeoJSON

**Files:**
- `public/maps/house-districts.geojson` (1.2MB) - 124 SC House districts
- `public/maps/senate-districts.geojson` (837KB) - 46 SC Senate districts

**What they provide:**
- Precise geographic boundaries for each legislative district
- GeoJSON Polygon/MultiPolygon geometries
- District metadata (number, name)

**Loading Strategy:** Lazy loaded on AddressAutocomplete focus (deferred 2MB)

**Why Deferred:**
- Not needed until user interacts with address search
- Large file size impacts initial page load
- Most users view statewide races before searching

**District Matching Algorithm:**
1. User address → Geocoding API → Coordinates (lat, lng)
2. Load GeoJSON boundaries (if not already loaded)
3. Use Turf.js `booleanPointInPolygon()` to test coordinates against each district polygon
4. Return matching district number(s)

**Implementation:** `src/lib/districtLookup.ts`

```typescript
import * as turf from '@turf/turf';

export async function findDistrict(lat: number, lng: number): Promise<DistrictResult> {
  // Lazy load GeoJSON (only once)
  if (!houseBoundaries) {
    houseBoundaries = await fetch('/maps/house-districts.geojson').then(r => r.json());
  }

  const point = turf.point([lng, lat]);

  for (const feature of houseBoundaries.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      return {
        houseDistrict: feature.properties.DISTRICT,
        // ... senate and congressional lookup
      };
    }
  }
}
```

**Schema:**
```typescript
interface DistrictGeoJSON {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}

interface DistrictFeature {
  type: 'Feature';
  properties: {
    DISTRICT: number;      // District number
    NAME?: string;         // Optional district name
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}
```

**Performance Optimization:**
- GeoJSON loaded only once and cached in memory
- Point-in-polygon checks are O(n) where n = number of districts (~170)
- Average lookup time: <50ms

**Accuracy:** GeoJSON boundaries are sourced from official SC Legislature shapefiles, ensuring 100% accuracy for district matching.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FULL DATA PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1] SC Ethics Commission                                       │
│       │  (Live scraping or export)                              │
│       ▼                                                         │
│  ethics-data.json                                               │
│       │  {                                                      │
│       │    "name": "Courtney Waters",                           │
│       │    "office": "SC House District 113",                   │
│       │    "reportId": "414669",                                │
│       │    "filedDate": "2025-05-08",                           │
│       │    "party": null  ← Missing!                            │
│       │  }                                                      │
│       │                                                         │
│       ▼                                                         │
│  [2] Data Processor (scripts/process-data.py)                   │
│       │                                                         │
│       ├──► Load ethics-data.json                                │
│       ├──► Load party-data.json (kjatwood + manual)             │
│       ├──► Load elections.json (historical results)             │
│       │                                                         │
│       └──► ENRICHMENT LOGIC:                                    │
│            • Match candidates by name + district               │
│            • Add party from party-data.json                    │
│            • Add isIncumbent flag                              │
│            • Calculate competitiveness scores                  │
│            • Detect swing districts                            │
│            • Add "source" field: "ethics" or "kjatwood"        │
│                                                                 │
│       ▼                                                         │
│  [3] Output Files (/public/data/)                               │
│       │                                                         │
│       ├──► candidates.json                                      │
│       │    {                                                    │
│       │      "house": {                                         │
│       │        "113": {                                         │
│       │          "districtNumber": 113,                         │
│       │          "candidates": [{                               │
│       │            "name": "Courtney Waters",                   │
│       │            "party": "Democratic",  ← Enriched!          │
│       │            "status": "filed",                           │
│       │            "filedDate": "2025-05-08",                   │
│       │            "ethicsUrl": "https://...",                  │
│       │            "reportId": "414669",                        │
│       │            "source": "kjatwood"                         │
│       │          }]                                             │
│       │        }                                                │
│       │      }                                                  │
│       │    }                                                    │
│       │                                                         │
│       ├──► elections.json                                       │
│       │    {                                                    │
│       │      "house": {                                         │
│       │        "113": {                                         │
│       │          "districtNumber": 113,                         │
│       │          "elections": {                                 │
│       │            "2024": {                                    │
│       │              "winner": { "name": "...", "party": "D" }, │
│       │              "margin": 48.2,                            │
│       │              "uncontested": true                        │
│       │            }                                            │
│       │          },                                             │
│       │          "competitiveness": {                           │
│       │            "score": 5,                                  │
│       │            "hasSwung": false                            │
│       │          }                                              │
│       │        }                                                │
│       │      }                                                  │
│       │    }                                                    │
│       │                                                         │
│       └──► party-data.json (reference)                          │
│            {                                                    │
│              "house": {                                         │
│                "113": { "party": "Democratic", "verified": true }│
│              }                                                  │
│            }                                                    │
│                                                                 │
│       ▼                                                         │
│  [4] Next.js Build Process                                      │
│       │                                                         │
│       ├──► Static Site Generation (SSG)                         │
│       ├──► All JSON files bundled into /out/data/              │
│       └──► Pre-render all pages                                │
│                                                                 │
│       ▼                                                         │
│  [5] Client-Side Loading (src/lib/dataLoader.ts)                │
│       │                                                         │
│       └──► fetch(`/data/candidates.json?v=${Date.now()}`)      │
│            • Cache-busting timestamp                           │
│            • Returns enriched candidate data                   │
│                                                                 │
│       ▼                                                         │
│  [6] React Components                                           │
│       │                                                         │
│       ├──► DistrictMap (color-codes based on party)            │
│       ├──► SidePanel (displays candidate details)              │
│       └──► Sparkline (trends from elections.json)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Enrichment

### Step-by-Step Process

#### 1. Load Raw Data

```python
# scripts/process-data.py

# Load Ethics Commission data
with open('ethics-data.json') as f:
    ethics_data = json.load(f)

# Load party attributions
with open('party-data.json') as f:
    party_data = json.load(f)

# Load historical results
with open('elections.json') as f:
    elections = json.load(f)
```

#### 2. Match Candidates

```python
def match_candidate(candidate):
    """
    Match Ethics candidate to party data by:
    1. District number (exact match)
    2. Name (fuzzy match with Levenshtein distance)
    """
    district = extract_district_number(candidate['office'])
    name = normalize_name(candidate['name'])

    # Lookup in party-data.json
    if district in party_data['house']:
        party_info = party_data['house'][district]
        similarity = fuzzy_match(name, party_info['name'])
        if similarity > 0.85:  # 85% match threshold
            return party_info['party']

    return None  # Party unknown
```

#### 3. Add Incumbent Flags

```python
def add_incumbent_status(candidate, district):
    """
    Mark incumbent if they won the 2024 election
    """
    if district in elections['house']:
        winner_2024 = elections['house'][district]['elections']['2024']['winner']
        if winner_2024['name'].lower() == candidate['name'].lower():
            candidate['isIncumbent'] = True
    return candidate
```

#### 4. Calculate Competitiveness

```python
def calculate_competitiveness(district):
    """
    Competitiveness score (0-100) based on:
    - Historical margins (smaller = more competitive)
    - Party flips (swing districts)
    - Uncontested races (less competitive)
    """
    margins = []
    parties = []

    for year in ['2020', '2022', '2024']:
        election = district.elections.get(year)
        if election:
            margins.append(abs(election['margin']))
            parties.append(election['winner']['party'])

    # Calculate average margin
    avg_margin = sum(margins) / len(margins) if margins else 100

    # Check for party flip
    has_swung = len(set(parties)) > 1

    # Score: 100 = highly competitive, 0 = safe seat
    score = max(0, 100 - avg_margin)
    if has_swung:
        score += 20  # Bonus for swing districts

    return {
        'score': min(100, round(score)),
        'hasSwung': has_swung
    }
```

#### 5. Output Enriched Data

```python
# Structure: { chamber: { district_number: { districtNumber, candidates[] } } }
output = {
    'house': {},
    'senate': {}
}

for candidate in enriched_candidates:
    chamber = extract_chamber(candidate['office'])
    district = extract_district_number(candidate['office'])

    if district not in output[chamber]:
        output[chamber][district] = {
            'districtNumber': district,
            'candidates': []
        }

    output[chamber][district]['candidates'].append({
        'name': candidate['name'],
        'party': candidate.get('party'),  # May be null
        'status': 'filed',
        'filedDate': candidate['filedDate'],
        'ethicsUrl': candidate['ethicsUrl'],
        'reportId': candidate['reportId'],
        'source': candidate['source']  # "ethics" or "kjatwood"
    })

# Save to /public/data/candidates.json
with open('../public/data/candidates.json', 'w') as f:
    json.dump(output, f, indent=2)
```

---

## Schema Reference

### candidates.json

```typescript
interface CandidatesData {
  house: { [districtNumber: string]: District };
  senate: { [districtNumber: string]: District };
}

interface District {
  districtNumber: number;
  candidates: Candidate[];
}

interface Candidate {
  name: string;
  party: 'Democratic' | 'Republican' | null;  // May be unknown
  status: 'filed';                            // Always "filed" (from Ethics)
  filedDate: string | null;                   // ISO format: "2025-05-08"
  ethicsUrl: string | null;                   // Link to Ethics filing
  reportId: string;                           // Unique identifier
  source: 'ethics' | 'kjatwood';              // Data source
  isIncumbent?: boolean;                      // Optional: if won 2024
}
```

### elections.json

```typescript
interface ElectionsData {
  house: { [districtNumber: string]: DistrictElectionHistory };
  senate: { [districtNumber: string]: DistrictElectionHistory };
}

interface DistrictElectionHistory {
  districtNumber: number;
  elections: {
    [year: string]: Election;  // "2024", "2022", "2020"
  };
  competitiveness?: CompetitivenessScore;
}

interface Election {
  winner: {
    name: string;
    party: string;
    votes: number;
  };
  runnerUp?: {
    name: string;
    party: string;
    votes: number;
  };
  margin: number;                             // Percentage (e.g., 48.2)
  turnout: number;                            // Total votes
  uncontested: boolean;
}

interface CompetitivenessScore {
  score: number;                              // 0-100 (100 = highly competitive)
  hasSwung: boolean;                          // District has changed parties
}
```

### party-data.json

```typescript
interface PartyData {
  house: { [districtNumber: string]: PartyInfo };
  senate: { [districtNumber: string]: PartyInfo };
}

interface PartyInfo {
  name: string;                               // Candidate name
  party: 'Democratic' | 'Republican';
  verified: boolean;                          // Manual verification flag
  source?: 'kjatwood' | 'manual';             // Data source
}
```

---

## Cache-Busting Strategy

### Problem

GitHub Pages serves static files with aggressive caching:
```
Cache-Control: max-age=600
```

Result: Users see stale data for up to 10 minutes after deployment.

### Solution: Timestamp Query Parameters

**Implementation:** `src/lib/dataLoader.ts`

```typescript
export async function loadCandidatesData(): Promise<CandidatesData> {
  const timestamp = Date.now();  // Current timestamp
  const basePath = getBasePath();

  // Append ?v=<timestamp> to force fresh fetch
  const url = `${basePath}/data/candidates.json?v=${timestamp}`;

  const response = await fetch(url, {
    cache: 'no-store'  // Disable browser cache
  });

  return response.json();
}
```

**How it works:**
1. Every page load generates a unique timestamp
2. URL becomes: `/data/candidates.json?v=1736789123456`
3. Browser treats this as a new URL, bypassing cache
4. CDN cache is bypassed (query parameters are not cached)

**Benefits:**
- ✅ Immediate data updates after deployment
- ✅ No CDN cache invalidation needed
- ✅ Works on all static hosts (GitHub Pages, Netlify, Vercel, S3)

**Tradeoffs:**
- ⚠️ Slightly more bandwidth (no caching)
- ⚠️ Every page load fetches fresh data

**Verification:**
```bash
# Check deployed site
curl -I "https://russellteter.github.io/sc-election-map-2026/data/candidates.json?v=1"

# Should return 200 OK (not 304 Not Modified)
```

---

## Manual Data Updates

### Adding New Candidates

**Scenario:** A new candidate files with the Ethics Commission but hasn't been added to kjatwood's map.

**Process:**

1. **Verify Filing:**
   - Visit https://ethicsfiling.sc.gov/public/campaign-reports/reports
   - Search for candidate by name or district
   - Confirm office is "SC House" or "SC Senate"

2. **Update party-data.json:**
   ```json
   {
     "house": {
       "015": {
         "name": "JA Moore",
         "party": "Democratic",
         "verified": true,
         "source": "manual"
       }
     }
   }
   ```

3. **Run Data Processor:**
   ```bash
   cd /Users/russellteter/Desktop/sc-election-map-2026
   python scripts/process-data.py
   ```

4. **Verify Output:**
   ```bash
   cat public/data/candidates.json | jq '.house["015"]'
   # Should show enriched candidate with party: "Democratic"
   ```

5. **Commit and Deploy:**
   ```bash
   git add public/data/candidates.json public/data/party-data.json
   git commit -m "data: add JA Moore (D) - House District 15"
   git push origin main
   ```

---

### Adding Historical Election Data

**Scenario:** Add 2018 or 2016 election results for deeper trend analysis.

**Process:**

1. **Research Results:**
   - Source: Ballotpedia or SC Election Commission
   - Collect: Winner name, party, vote count, margin

2. **Update elections.json:**
   ```json
   {
     "house": {
       "113": {
         "districtNumber": 113,
         "elections": {
           "2024": { ... },
           "2022": { ... },
           "2020": { ... },
           "2018": {
             "winner": {
               "name": "Courtney Waters",
               "party": "Democratic",
               "votes": 8543
             },
             "runnerUp": {
               "name": "John Smith",
               "party": "Republican",
               "votes": 3210
             },
             "margin": 62.4,
             "turnout": 11753,
             "uncontested": false
           }
         }
       }
     }
   }
   ```

3. **Recalculate Competitiveness:**
   ```bash
   python scripts/calculate-competitiveness.py
   # Updates competitiveness scores based on 2018-2024 data
   ```

4. **Commit and Deploy:**
   ```bash
   git add public/data/elections.json
   git commit -m "data: add 2018 election results for historical analysis"
   git push origin main
   ```

---

## Quality Assurance

### Data Validation Checklist

Before deploying data updates:

**1. Schema Validation:**
```bash
# Validate JSON structure
cat public/data/candidates.json | jq . > /dev/null && echo "Valid JSON"
```

**2. Candidate Count:**
```bash
# Count total candidates
cat public/data/candidates.json | jq '[.house, .senate] | map(to_entries | map(.value.candidates | length) | add) | add'

# Expected: 40-60 candidates (as of January 2026)
```

**3. Party Attribution Coverage:**
```bash
# Count candidates with party data
cat public/data/candidates.json | jq '[.house, .senate] | map(to_entries | map(.value.candidates | map(select(.party != null)) | length) | add) | add'

# Target: >30% coverage
```

**4. No Duplicates:**
```bash
# Check for duplicate report IDs
cat public/data/candidates.json | jq '[.house, .senate] | map(to_entries | map(.value.candidates | map(.reportId))) | flatten | group_by(.) | map(select(length > 1))'

# Should return: []
```

**5. Ethics URLs Valid:**
```bash
# Check that all URLs start with https://ethicsfiling.sc.gov
cat public/data/candidates.json | jq '[.house, .senate] | map(to_entries | map(.value.candidates | map(.ethicsUrl) | map(select(startswith("https://ethicsfiling.sc.gov") | not)))) | flatten'

# Should return: []
```

**6. Manual Spot Check:**
- Select 5 random districts
- Verify candidates on SC Ethics website
- Confirm party matches kjatwood map (if applicable)

---

## Troubleshooting

### Issue: Stale Data After Deployment

**Symptoms:**
- Map shows old candidate counts
- New candidates don't appear

**Diagnosis:**
```bash
# Check if cache-busting is working
curl -I "https://russellteter.github.io/sc-election-map-2026/data/candidates.json?v=$(date +%s)"

# Should return: 200 OK (not 304)
```

**Solution:**
1. Verify cache-busting in `src/lib/dataLoader.ts`
2. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
3. Check browser DevTools Network tab for `?v=` parameter

---

### Issue: Party Data Not Matching

**Symptoms:**
- Candidate shows as "Party Unknown" but is listed on kjatwood map

**Diagnosis:**
```bash
# Check party-data.json for district
cat public/data/party-data.json | jq '.house["113"]'

# Should return party info
```

**Solution:**
1. Verify name spelling matches exactly
2. Run fuzzy matcher: `python scripts/match-names.py`
3. Manually add to `party-data.json` if needed

---

### Issue: Competitiveness Scores Incorrect

**Symptoms:**
- Swing district not showing "SWING" badge
- Competitive district has low score

**Diagnosis:**
```bash
# Check election history
cat public/data/elections.json | jq '.house["113"]'

# Verify margins and party flips
```

**Solution:**
1. Recalculate: `python scripts/calculate-competitiveness.py`
2. Manually adjust threshold if needed (currently 60+)

---

## Future Improvements

**Automated Data Pipeline:**
- [ ] GitHub Action to scrape Ethics Commission daily
- [ ] Automatic party matching with ML fuzzy matching
- [ ] Historical data import from Ballotpedia API

**Real-Time Updates:**
- [ ] WebSocket connection for live updates
- [ ] Server-side data enrichment
- [ ] Redis caching layer

**Data Quality:**
- [ ] Automated validation tests
- [ ] Duplicate detection
- [ ] Name normalization (e.g., "J.A. Moore" vs "JA Moore")

**Enhanced Attribution:**
- [ ] SC Election Commission CSV import (March 2026)
- [ ] Ballotpedia API integration
- [ ] Fundraising data from Ethics Commission
