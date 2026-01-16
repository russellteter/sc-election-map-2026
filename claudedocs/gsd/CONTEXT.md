# SC Election Map 2026 - Execution Context

## Mission
Democratic campaign intelligence tool for SC 2026 elections.
Public face: neutral voter resource. Strategic layer: recruitment & mobilization.

## Tech Stack
- Next.js 14 static export (GitHub Pages)
- React 19, TypeScript 5, Tailwind CSS v4
- No server-side code (all client-side)

## API Credentials
```bash
# .env.local (create if not exists)
NEXT_PUBLIC_BALLOTREADY_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131
NEXT_PUBLIC_TARGETSMART_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7
```

## Key Files to Modify
| Purpose | File |
|---------|------|
| BallotReady client | `src/lib/ballotready.ts` |
| TargetSmart client | `src/lib/targetsmart.ts` |
| Intelligence aggregator | `src/lib/voterIntelligence.ts` |
| Master types | `src/types/schema.ts` |
| Opportunities page | `src/app/opportunities/page.tsx` |
| Voter guide page | `src/app/voter-guide/page.tsx` |
| Race detail page | `src/app/race/[chamber]/[district]/page.tsx` |

## Existing Patterns (Follow These)
- **API clients:** 100ms rate limit, TTL cache, error fallbacks
- **Components:** 'use client', skeleton loaders, glassmorphic styling
- **Data:** static JSON enriched with live API data
- **State:** URL params for shareability

## What's Working vs Stubbed

### Working
- Interactive SVG Map with chamber toggle
- KPI Cards with animations
- Advanced Filter Panel with search
- Side Panel with candidates
- Opportunities Dashboard
- Voter Guide with address lookup
- Race Detail Pages
- Strategic Table with CSV export
- URL State Persistence
- Keyboard Navigation

### Stubbed (Needs Implementation)
| Feature | File | Status |
|---------|------|--------|
| BallotReady API | `src/lib/ballotready.ts` | Client exists, not integrated |
| TargetSmart API | `src/lib/targetsmart.ts` | Uses mock data |
| Voter Intelligence | `src/lib/voterIntelligence.ts` | Never called |
| Recruitment Pipeline | Component imported | Renders nothing |
| Endorsement Dashboard | Component imported | Renders nothing |
| Polling Place Finder | Component exists | No API integration |
| Mobilization Card | Component exists | Uses mock data only |
| Early Vote Tracking | Component exists | Returns null |

## Data Sources
| Data | File | Update Method |
|------|------|---------------|
| Candidates | `public/data/candidates.json` | Daily via GitHub Action |
| Elections | `public/data/elections.json` | Manual |
| Opportunities | `public/data/opportunity.json` | Python script |
| Statewide Races | `public/data/statewide-races.json` | Manual |
| County Races | `public/data/county-races.json` | Manual |
| GeoJSON Maps | `public/maps/*.geojson` | Static |

## Critical Configuration
- `next.config.ts`: `output: 'export'` (static site)
- Base path: `/sc-election-map-2026` in production
- All data must be in `public/` for static serving
