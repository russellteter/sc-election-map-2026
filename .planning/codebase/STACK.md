# Technology Stack

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## Languages

**Primary:**
- TypeScript 5.x - All application code (strict mode)

**Secondary:**
- JavaScript - Configuration files (next.config.ts uses TS)
- CSS - Tailwind v4 with design tokens

## Runtime

**Environment:**
- Node.js 20+ (LTS)
- Browser runtime (Next.js SSG → static HTML/JS)
- Static export (no server runtime in production)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.1 - App Router with static export
- React 19.2.3 - UI components

**Testing:**
- Jest 30.2.0 - Unit tests
- Playwright 1.57.0 - E2E tests
- Testing Library (React 16.3.1, Jest-DOM 6.9.1, User Event 14.6.1)

**Build/Dev:**
- Turbopack - Default bundler (Next.js 16+)
- Webpack fallback - Performance budgets (200KB entry, 100KB asset)
- TypeScript 5.x - Compilation
- Tailwind CSS v4 - Styling via @tailwindcss/postcss

## Key Dependencies

**Critical (Voter Guide):**
- `@turf/boolean-point-in-polygon` 7.3.1 - Point-in-polygon district lookup
- `@turf/helpers` 7.3.1 - GeoJSON geometry helpers
- `@geoapify/geocoder-autocomplete` 3.0.1 - Address autocomplete UI

**Infrastructure:**
- `next` 16.1.1 - Framework core
- `react` 19.2.3 - UI rendering
- `react-dom` 19.2.3 - DOM binding

**Dev Dependencies:**
- `ts-jest` 29.4.6 - TypeScript test support
- `dotenv` 17.2.3 - Environment variable loading
- `eslint` 9.x + `eslint-config-next` 16.1.1 - Linting

## Configuration

**Environment:**
- `.env.local` for development secrets (gitignored)
- `NEXT_PUBLIC_GEOAPIFY_KEY` - Address autocomplete API
- All env vars are `NEXT_PUBLIC_*` (client-side, static export)

**Build:**
- `next.config.ts` - Static export, basePath, assetPrefix for GitHub Pages
- `tsconfig.json` - TypeScript strict mode
- `jest.config.js` - Test runner configuration
- `playwright.config.ts` - E2E test configuration

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js 20+)
- npm for package management
- No Docker required

**Production:**
- Static HTML/JS/CSS files
- GitHub Pages hosting (via `output: 'export'`)
- basePath: `/sc-election-map-2026` in production
- No server runtime (fully static)

## Voter Guide-Specific Stack

| Purpose | Technology | File |
|---------|------------|------|
| Address Input | Geoapify Autocomplete | `src/components/VoterGuide/AddressAutocomplete.tsx` |
| Geocoding Fallback | Nominatim (OpenStreetMap) | `src/lib/geocoding.ts` |
| District Detection | Turf.js Point-in-Polygon | `src/lib/districtLookup.ts` |
| Congressional Lookup | County FIPS Mapping | `src/lib/congressionalLookup.ts` |
| Data Loading | Progressive 3-Tier System | `src/lib/dataLoader.ts` |
| Type Definitions | TypeScript Interfaces | `src/types/schema.ts` |

---

*Stack analysis: 2026-01-17*
*Update after major dependency changes*
