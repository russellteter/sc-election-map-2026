# Integrations - SC Election Map 2026

> Generated: 2026-01-12 | GSD Codebase Mapping

## External Data Sources

### 1. SC Ethics Commission

| Attribute | Value |
|-----------|-------|
| **Website** | https://ethicsfiling.sc.gov/public/campaign-reports/reports |
| **Data Type** | Candidate filing information |
| **Integration** | Indirect via SC Ethics Monitor |
| **Update Frequency** | Daily (via separate monitor project) |

**Link Format:**
```
https://ethicsfiling.sc.gov/public/candidates-public-officials/person/campaign-disclosure-reports/report-detail?personId={id}&seiId={id}&officeId={id}&reportId={id}
```

### 2. SC Ethics Monitor Repository

| Attribute | Value |
|-----------|-------|
| **Repository** | https://github.com/russellteter/sc-ethics-monitor |
| **Data Endpoint** | https://raw.githubusercontent.com/russellteter/sc-ethics-monitor/main/state.json |
| **Integration** | Daily fetch via GitHub Actions |
| **Data Format** | JSON with report metadata |

**Data Flow:**
```
SC Ethics Website → SC Ethics Monitor → state.json → This Project
```

### 3. US Census TIGER/Line

| Attribute | Value |
|-----------|-------|
| **Source** | US Census Bureau |
| **Data Type** | Geographic shapefiles |
| **Files Used** | SC State Legislative Districts (2024) |
| **Integration** | One-time conversion to SVG |

**Shapefile IDs:**
- `tl_2024_45_sldl` - SC House (Lower chamber)
- `tl_2024_45_sldu` - SC Senate (Upper chamber)
- `45` = South Carolina FIPS code

## Hosting & Deployment

### GitHub Pages

| Attribute | Value |
|-----------|-------|
| **Service** | GitHub Pages |
| **Repository** | russellteter/sc-election-map-2026 |
| **URL** | https://russellteter.github.io/sc-election-map-2026/ |
| **Build** | Static export (Next.js) |
| **CDN** | GitHub Pages CDN |

**Deployment Configuration:**
```typescript
// next.config.ts
{
  output: 'export',
  basePath: '/sc-election-map-2026',
  assetPrefix: '/sc-election-map-2026/',
  trailingSlash: true
}
```

## GitHub Actions Workflows

### 1. Deploy Workflow

**File:** `.github/workflows/deploy.yml`

| Attribute | Value |
|-----------|-------|
| **Trigger** | Push to main, manual dispatch |
| **Runner** | ubuntu-latest |
| **Node Version** | 20 |

**Steps:**
1. Checkout repository
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Build (`npm run build`)
5. Upload artifact (`out/` directory)
6. Deploy to GitHub Pages

**Actions Used:**
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`

### 2. Update Data Workflow

**File:** `.github/workflows/update-data.yml`

| Attribute | Value |
|-----------|-------|
| **Trigger** | Daily at 15:00 UTC (10 AM EST), manual |
| **Runner** | ubuntu-latest |
| **Python Version** | 3.11 |

**Steps:**
1. Checkout repository
2. Setup Python 3.11
3. Install requests library
4. Fetch ethics data via curl
5. Process data with Python script
6. Check for changes (`git diff`)
7. Auto-commit if changed

**Data Processing:**
```bash
curl -o ethics-data.json https://raw.githubusercontent.com/russellteter/sc-ethics-monitor/main/state.json
python scripts/process-data.py
```

## Data Processing Script

### Python ETL Script

**File:** `scripts/process-data.py`

| Function | Purpose |
|----------|---------|
| `extract_district_number()` | Parse office string for chamber/district |
| `normalize_name()` | Standardize candidate names |
| `load_party_data()` | Load manual party enrichment |
| `find_party()` | Match candidates to party data |
| `process_ethics_data()` | Main ETL pipeline |

**Input Sources:**
- `ethics-data.json` - Raw SC Ethics Monitor data
- `src/data/party-data.json` - Manual party enrichment

**Output:**
- `src/data/candidates.json` - Enriched candidate data

**Matching Logic:**
1. Exact name match
2. Normalized name match (lowercase, stripped)
3. Partial match (first + last name components)

## Static Data Files

### Data Schema

**candidates.json:**
```json
{
  "lastUpdated": "2026-01-13T04:15:00Z",
  "house": {
    "1": {
      "districtNumber": 1,
      "candidates": [
        {
          "name": "Candidate Name",
          "party": "Democratic|Republican|null",
          "status": "filed",
          "filedDate": "2026-01-01",
          "ethicsUrl": "https://...",
          "reportId": "123456",
          "source": "ethics"
        }
      ]
    }
  },
  "senate": { /* same structure */ }
}
```

**party-data.json:**
```json
{
  "lastUpdated": "2026-01-13T04:15:00Z",
  "candidates": {
    "Candidate Name": {
      "party": "Democratic",
      "verified": true,
      "source": "SC House Democratic Caucus",
      "district": "house-113"
    }
  }
}
```

## SVG Map Assets

### House Districts

| Attribute | Value |
|-----------|-------|
| **File** | `public/maps/house-districts.svg` |
| **Paths** | 124 |
| **ID Format** | `house-{1-124}` |
| **File Size** | 257 KB |
| **ViewBox** | `0 0 800 531` |

### Senate Districts

| Attribute | Value |
|-----------|-------|
| **File** | `public/maps/senate-districts.svg` |
| **Paths** | 46 |
| **ID Format** | `senate-{1-46}` |
| **File Size** | 181 KB |
| **ViewBox** | `0 0 800 531` |

## Client-Side Integration

### Dynamic Path Resolution

```typescript
// Detect GitHub Pages deployment
const basePath = window.location.pathname.includes('/sc-election-map-2026')
  ? '/sc-election-map-2026'
  : '';

// Fetch data
fetch(`${basePath}/data/candidates.json`)

// Fetch SVG
fetch(`${basePath}/maps/${chamber}-districts.svg`)
```

## Environment Configuration

### GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Built-in, used for auto-commit |

### Environment Variables

| Variable | Production | Development |
|----------|------------|-------------|
| `NODE_ENV` | production | development |
| basePath | /sc-election-map-2026 | (empty) |
| assetPrefix | /sc-election-map-2026/ | (empty) |

## Integration Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERNAL DATA SOURCES                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐       ┌─────────────────────┐          │
│  │  SC Ethics Website  │       │  US Census TIGER    │          │
│  │  (Campaign Reports) │       │  (Shapefiles)       │          │
│  └──────────┬──────────┘       └──────────┬──────────┘          │
│             │                              │                     │
│             ▼                              │                     │
│  ┌─────────────────────┐                  │                     │
│  │  SC Ethics Monitor  │                  │                     │
│  │  (Separate Repo)    │                  │                     │
│  └──────────┬──────────┘                  │                     │
│             │                              │                     │
└─────────────┼──────────────────────────────┼─────────────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  update-data.yml (Daily 10 AM EST)                      │    │
│  │  ├─ curl fetch state.json                               │    │
│  │  ├─ python process-data.py                              │    │
│  │  └─ git commit candidates.json                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  deploy.yml (On Push to Main)                           │    │
│  │  ├─ npm ci && npm run build                             │    │
│  │  └─ Deploy to GitHub Pages                              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    STATIC ASSETS                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  public/                                                         │
│  ├─ data/candidates.json    (Updated daily)                     │
│  ├─ data/party-data.json    (Manual enrichment)                 │
│  ├─ maps/house-districts.svg (124 paths)                        │
│  └─ maps/senate-districts.svg (46 paths)                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
              │
              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    GITHUB PAGES                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  URL: https://russellteter.github.io/sc-election-map-2026/      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Client Browser                                          │    │
│  │  ├─ fetch('/data/candidates.json')                       │    │
│  │  ├─ fetch('/maps/house-districts.svg')                   │    │
│  │  └─ Render interactive map                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Future Integration Possibilities

| Integration | Purpose | Status |
|-------------|---------|--------|
| SC Election Commission CSV | Official party data | March 2026 |
| Ballotpedia API | Historical context | Not planned |
| Analytics (Plausible/GA) | Usage tracking | Not implemented |
| Error tracking (Sentry) | Error monitoring | Not implemented |
