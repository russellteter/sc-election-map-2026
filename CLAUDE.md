# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blue Intelligence is a national 50-state election intelligence demo platform for Democratic campaigns. Currently deployed with 5 states (SC, NC, GA, FL, VA) and 876 districts as a proof-of-concept.

**Live URL:** https://russellteter.github.io/sc-election-map-2026/

## Commands

```bash
# Development
npm run dev              # Start development server (localhost:3000)
npm run build            # Production build (static export to out/)
npm run lint             # ESLint check

# Testing
npm test                 # Run Jest unit tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report
npm run test:e2e         # Run Playwright E2E tests (requires dev server)
npm run test:e2e:ui      # Run Playwright with UI

# Data Pipeline
npm run refresh-data     # Scrape Ethics Commission + regenerate candidates.json

# Deployment
git push origin main     # Auto-deploys via GitHub Actions
```

## Architecture

**Pattern:** Static-export Next.js application with progressive data loading

**Key Constraints:**
- Static export only (`output: 'export'`) - no server runtime, GitHub Pages hosting
- Client-side API keys only (`NEXT_PUBLIC_*`) - for public demo data
- <10KB initial payload target - mobile-first performance
- Neutral public UI - no overt Democratic branding

**Tech Stack:**
- Next.js 16 + React 19 + TypeScript (strict mode)
- Tailwind CSS v4 with glassmorphic design tokens
- Turf.js for geographic calculations
- Static JSON data in `public/data/`

**Path Alias:** `@/` maps to `src/` (e.g., `import { Candidate } from '@/types/schema'`)

## Key Files

| Purpose | Location |
|---------|----------|
| Type definitions | `src/types/schema.ts` |
| State configurations | `src/config/states/` |
| Demo data generator | `src/lib/demoDataGenerator.ts` |
| Progressive data loading | `src/lib/dataLoader.ts` |
| District lookup (GeoJSON) | `src/lib/districtLookup.ts` |
| Route pages | `src/app/page.tsx`, `src/app/[state]/page.tsx` |

## Data Flow

- **SC only:** Real data from SC Ethics Commission + party enrichment
- **All other states:** Demo-generated data (clearly labeled with DemoBadge component)
- Data pipeline: Python scripts in `scripts/` → JSON in `public/data/` → client fetch

## Data Refresh Pipeline

To update candidate data from the SC Ethics Commission:

```bash
npm run refresh-data
```

This runs the full pipeline:
1. **Scrape** - Playwright scrapes ethicsfiling.sc.gov for Initial Reports
2. **Process** - Merges with party-data.json for party enrichment
3. **Output** - Generates public/data/candidates.json

**Prerequisites:**
- Python 3.11+ with virtual environment at `.venv/`
- Playwright: `pip install playwright && python -m playwright install chromium`

**Manual scraping (advanced):**
```bash
# Activate venv first
source .venv/bin/activate

# Scrape ethics data
python scripts/scrape-ethics.py --max-pages 10 --output scripts/data/ethics-state.json

# Process with party enrichment
python scripts/process-data.py scripts/data/ethics-state.json

# Copy to public
cp src/data/candidates.json public/data/candidates.json
```

## Code Patterns

**DemoBadge:** Always label demo/generated data:
```tsx
import { DemoBadge } from '@/components/ui/DemoBadge';
<DemoBadge />
```

**Progressive Loading:** Use 3-tier data loading for Voter Guide:
- Tier 1 (Critical): election-dates.json, statewide-races.json
- Tier 2 (On-demand): candidates.json, county-races.json
- Tier 3 (Deferred): judicial, school-board, special-districts

**Event Delegation:** SVG maps use single event handler on container, not per-path listeners.

## Environment Variables

```bash
NEXT_PUBLIC_GEOAPIFY_KEY=your_key_here  # Address geocoding (3,000 req/day free)
```

## Documentation

| Document | Purpose |
|----------|---------|
| `.planning/PROJECT.md` | Mission & strategy |
| `.planning/STATE.md` | Current progress |
| `docs/ARCHITECTURE.md` | System architecture details |
| `docs/CURRENT-STATE.md` | Live metrics & feature matrix |
| `claudedocs/BLUE-INTELLIGENCE-BIBLE.md` | Deep context (load when needed) |

## Guiding Principles

**DO:**
- Use DemoBadge to clearly label demo/generated data
- Follow existing glassmorphic design system
- Use the established type system in `src/types/schema.ts`
- Keep mobile performance optimized

**DON'T:**
- Add overt Democratic branding to public-facing UI
- Present demo data as real data
- Break static export compatibility (no server-side features)
