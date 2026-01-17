# Codebase Structure

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## Directory Layout

```
sc-election-map-2026/
├── .planning/              # GSD planning documents
│   ├── codebase/          # This codebase map
│   ├── PROJECT.md         # Mission & strategy
│   ├── STATE.md           # Current progress
│   └── ROADMAP.md         # Phases & milestones
├── src/                    # Application source code
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── config/            # State configurations
│   ├── lib/               # Utility libraries
│   └── types/             # TypeScript definitions
├── public/                 # Static assets
│   ├── data/              # JSON data files
│   └── maps/              # SVG district maps
├── docs/                   # Documentation
├── claudedocs/            # Claude context documents
└── [config files]         # Root configs
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router pages and routes
- Contains: Page components, dynamic route handlers
- Key files:
  - `page.tsx` - National landing page
  - `[state]/page.tsx` - Dynamic state routes
  - `voter-guide/page.tsx` - Voter guide (666 lines, main focus)
  - `layout.tsx` - Root layout with providers
- Subdirectories: `[state]/` for state-specific pages

**src/components/**
- Purpose: Reusable React components
- Contains: UI components organized by feature
- Key subdirectories:
  - `VoterGuide/` - Voter guide components (AddressAutocomplete, etc.)
  - `Map/` - District map components
  - `Intelligence/` - Strategic intelligence dashboards
  - `ui/` - Generic UI primitives
- Naming: PascalCase directories and files

**src/components/VoterGuide/** (Focus Area)
- Purpose: Voter guide specific components
- Key files:
  - `AddressAutocomplete.tsx` (458 lines) - Geoapify address input
  - `RaceCard.tsx` - Individual race display
  - `CandidateCard.tsx` - Candidate information
  - `BallotSection.tsx` - Ballot category grouping

**src/lib/**
- Purpose: Utility functions and services
- Contains: Data loading, geocoding, district lookup
- Key files:
  - `dataLoader.ts` (143 lines) - Progressive data loading
  - `districtLookup.ts` (175 lines) - Turf.js point-in-polygon
  - `geocoding.ts` (265 lines) - Nominatim + validation
  - `congressionalLookup.ts` (236 lines) - County→CD mapping
  - `demoDataGenerator.ts` - Demo data creation

**src/config/**
- Purpose: State-specific configuration
- Contains: Per-state settings and metadata
- Key files:
  - `states/sc.ts` - South Carolina config
  - `states/nc.ts`, `ga.ts`, `fl.ts`, `va.ts` - Other state configs
  - `states/index.ts` - State config exports

**src/types/**
- Purpose: TypeScript type definitions
- Contains: Interfaces and type aliases
- Key files:
  - `schema.ts` (730 lines) - All data types (Candidate, District, Race, etc.)

**public/data/**
- Purpose: Static JSON data files
- Contains: Candidate data, race information, district info
- Key files:
  - `candidates.json` - Candidate records
  - `county-races.json` - County-level races
  - `district-boundaries.json` - GeoJSON boundaries
- Note: Some expected files missing (judicial, school board, ballot measures)

**public/maps/**
- Purpose: SVG district map files
- Contains: State district visualizations
- Structure: One SVG per state/chamber combination

## Key File Locations

**Entry Points:**
- `src/app/page.tsx` - National landing page
- `src/app/[state]/page.tsx` - State page entry
- `src/app/voter-guide/page.tsx` - Voter guide entry

**Configuration:**
- `next.config.ts` - Next.js config (static export, basePath)
- `tsconfig.json` - TypeScript config (strict mode)
- `tailwind.config.ts` - Tailwind CSS config
- `jest.config.js` - Jest test config
- `playwright.config.ts` - E2E test config
- `.env.local` - Local environment (gitignored)

**Core Voter Guide Logic:**
- `src/components/VoterGuide/AddressAutocomplete.tsx` - Address input
- `src/lib/geocoding.ts` - Geocoding service
- `src/lib/districtLookup.ts` - District detection
- `src/lib/congressionalLookup.ts` - County/CD mapping
- `src/lib/dataLoader.ts` - Data fetching

**Testing:**
- `__tests__/` - Unit test files
- `e2e/` or `tests/` - E2E test files
- `jest.config.js` - Unit test config
- `playwright.config.ts` - E2E config

**Documentation:**
- `README.md` - Project overview
- `CLAUDE.md` - Claude Code context
- `docs/ARCHITECTURE.md` - System architecture
- `docs/CURRENT-STATE.md` - Live metrics
- `claudedocs/BLUE-INTELLIGENCE-BIBLE.md` - Deep context

## Naming Conventions

**Files:**
- `kebab-case.ts` - Utility modules (data-loader.ts, district-lookup.ts)
- `PascalCase.tsx` - React components (AddressAutocomplete.tsx)
- `*.test.ts` - Test files alongside source
- `UPPERCASE.md` - Important documentation files

**Directories:**
- `PascalCase/` - Component feature directories (VoterGuide/, Map/)
- `lowercase/` - Utility directories (lib/, config/, types/)
- Plural for collections (components/, types/)

**Special Patterns:**
- `index.ts` - Barrel exports for directories
- `page.tsx` - Next.js page components
- `layout.tsx` - Next.js layout components
- `[param]/` - Dynamic route directories

## Where to Add New Code

**New Voter Guide Feature:**
- Component: `src/components/VoterGuide/{FeatureName}.tsx`
- Logic: `src/lib/{feature-name}.ts`
- Types: `src/types/schema.ts` (add to existing)
- Tests: `src/components/VoterGuide/{FeatureName}.test.tsx`

**New Data Source:**
- Static data: `public/data/{data-name}.json`
- Loader: Add to `src/lib/dataLoader.ts`
- Types: Add interfaces to `src/types/schema.ts`

**New State Configuration:**
- Config: `src/config/states/{state-abbr}.ts`
- Export: Add to `src/config/states/index.ts`

**New Utility Function:**
- Location: `src/lib/{utility-name}.ts`
- Tests: `src/lib/{utility-name}.test.ts`

**New Page Route:**
- Page: `src/app/{route}/page.tsx`
- Layout (if needed): `src/app/{route}/layout.tsx`

## Special Directories

**.planning/**
- Purpose: GSD workflow planning documents
- Source: Created by /gsd commands
- Committed: Yes (planning history)

**public/**
- Purpose: Static assets served directly
- Source: Manually maintained data/maps
- Committed: Yes (essential data)

**out/**
- Purpose: Build output (static export)
- Source: Generated by `next build`
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-17*
*Update when directory structure changes*
