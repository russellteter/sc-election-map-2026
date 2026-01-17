# External Integrations

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## APIs & External Services

**Address Autocomplete:**
- Geoapify Geocoder API - Address input suggestions and coordinate lookup
  - SDK/Client: `@geoapify/geocoder-autocomplete` v3.0.1
  - Auth: API key in `NEXT_PUBLIC_GEOAPIFY_KEY` env var
  - Features: Debounced input (300ms), SC bounding box filtering
  - File: `src/components/VoterGuide/AddressAutocomplete.tsx`

**Geocoding Fallback:**
- Nominatim (OpenStreetMap) - Free geocoding when Geoapify unavailable
  - Integration: Direct REST API via fetch
  - Auth: None (public API)
  - Rate limits: 1.1s between requests (enforced in code)
  - File: `src/lib/geocoding.ts`

**Geographic Computation:**
- Turf.js - Client-side point-in-polygon calculations
  - SDK/Client: `@turf/boolean-point-in-polygon`, `@turf/helpers`
  - Auth: None (client-side library)
  - Purpose: Determine which district contains a coordinate
  - File: `src/lib/districtLookup.ts`

## Data Storage

**Static Data (Production):**
- JSON files served from GitHub Pages
  - Location: `public/data/` directory
  - Files: `candidates.json`, `county-races.json`, `district-boundaries.json`, etc.
  - Access: HTTP fetch at runtime
  - No database (fully static site)

**GeoJSON Boundaries:**
- District boundary polygons for point-in-polygon lookup
  - Files: `public/maps/` and `public/data/` directories
  - Size: ~2MB total (lazy-loaded on address input focus)
  - Format: GeoJSON FeatureCollections

**Client-Side Caching:**
- Singleton pattern with in-memory cache
  - Implementation: `src/lib/dataLoader.ts`
  - Deduplication: Multiple requests for same data return cached promise
  - No persistence (session-only cache)

## Authentication & Identity

**Auth Provider:**
- None - Public read-only demo platform
  - No user accounts
  - No login required
  - All data publicly accessible

## Monitoring & Observability

**Error Tracking:**
- None configured
  - Console errors only
  - No Sentry, LogRocket, or similar

**Analytics:**
- None configured
  - No Google Analytics, Mixpanel, or similar
  - No usage tracking

**Logs:**
- Browser console only
  - Development logging via console.log
  - No production logging infrastructure

## CI/CD & Deployment

**Hosting:**
- GitHub Pages - Static file hosting
  - Deployment: Automatic on push to `main` branch
  - basePath: `/sc-election-map-2026`
  - assetPrefix: `/sc-election-map-2026/`
  - URL: https://russellteter.github.io/sc-election-map-2026/

**CI Pipeline:**
- GitHub Actions (inferred)
  - Trigger: Push to main
  - Build: `next build` (static export)
  - Deploy: GitHub Pages

## Environment Configuration

**Development:**
- Required env vars:
  - `NEXT_PUBLIC_GEOAPIFY_KEY` - Address autocomplete
- Secrets location: `.env.local` (gitignored)
- Works without API key (fallback to Nominatim)

**Production:**
- Env vars: Baked into static build at build time
- Secrets management: GitHub repository secrets
- No runtime environment (static files)

## Webhooks & Callbacks

**Incoming:**
- None - Static site with no server

**Outgoing:**
- None - No server-side event triggers

## Planned/Locked Integrations

**BallotReady API (Locked):**
- Purpose: Real candidate data, polling places, ballot information
- Status: Not integrated (requires paid API key ~$5K/yr)
- When unlocked: Would replace demo candidate data

**TargetSmart API (Locked):**
- Purpose: Voter intelligence, targeting data, voter file matching
- Status: Not integrated (enterprise pricing)
- When unlocked: Would power voter intelligence features

**Google Civic API (Planned):**
- Purpose: Polling places, election dates
- Status: Partially planned for free data tier
- No current implementation

## API Dependency Map (Voter Guide)

```
User enters address
       │
       ▼
┌─────────────────────┐
│ Geoapify API        │ ← Primary geocoder
│ (NEXT_PUBLIC_KEY)   │
└─────────────────────┘
       │ fallback
       ▼
┌─────────────────────┐
│ Nominatim API       │ ← Free fallback
│ (no auth)           │
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Turf.js (local)     │ ← Point-in-polygon
└─────────────────────┘
       │
       ▼
┌─────────────────────┐
│ Static JSON         │ ← District/candidate data
│ (public/data/)      │
└─────────────────────┘
```

---

*Integration audit: 2026-01-17*
*Update when adding/removing external services*
