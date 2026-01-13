# File Structure - SC Election Map 2026

> Generated: 2026-01-12 | GSD Codebase Mapping

## Directory Tree

```
sc-election-map-2026/
│
├── src/                          # Source code
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout, metadata
│   │   ├── page.tsx              # Main page (Home component)
│   │   ├── globals.css           # Global styles + design tokens
│   │   └── favicon.ico           # App icon
│   │
│   ├── components/               # React components
│   │   ├── Dashboard/            # Right panel components
│   │   │   ├── SidePanel.tsx     # District detail panel
│   │   │   └── CandidateCard.tsx # Individual candidate display
│   │   │
│   │   └── Map/                  # Map-related components
│   │       ├── DistrictMap.tsx   # SVG map + interaction logic
│   │       ├── Legend.tsx        # Color legend
│   │       └── ChamberToggle.tsx # House/Senate selector
│   │
│   └── data/                     # Source data files
│       ├── candidates.json       # Candidate data by district
│       ├── districts.json        # District metadata
│       └── party-data.json       # Party seat counts
│
├── public/                       # Static assets (served at root)
│   ├── maps/                     # SVG district maps
│   │   ├── house-districts.svg   # 124 House district paths
│   │   └── senate-districts.svg  # 46 Senate district paths
│   │
│   ├── data/                     # Public data (fetched by client)
│   │   ├── candidates.json       # Copy of src/data/candidates.json
│   │   └── party-data.json       # Copy of src/data/party-data.json
│   │
│   └── [Next.js template assets]
│       ├── file.svg, globe.svg
│       ├── next.svg, vercel.svg
│       └── window.svg
│
├── data/                         # Source geographic data
│   └── shapefiles/               # US Census TIGER/Line files
│       ├── tl_2024_45_sldl.*     # SC House districts
│       ├── tl_2024_45_sldu.*     # SC Senate districts
│       └── *.zip                 # Archived shapefiles
│
├── scripts/                      # Build/data scripts
│   └── process-data.py           # ETL: ethics data → candidates.json
│
├── docs/                         # Documentation
│   └── GLASSMORPHIC_MIGRATION_PLAN.md
│
├── .claude/                      # Claude Code configuration
│   ├── agents/                   # Agent workflow definitions
│   │   ├── README.md             # Multi-agent overview
│   │   ├── WORKFLOWS.md          # Workflow quick start
│   │   ├── strategic-planner.md  # Orchestrator agent
│   │   ├── qa-testing.md         # QA/Testing agent
│   │   ├── ui-ux.md              # UI/UX agent
│   │   ├── data-pipeline.md      # Data agent
│   │   ├── performance.md        # Performance agent
│   │   └── documentation.md      # Documentation agent
│   │
│   ├── CLAUDE.md                 # Project context
│   └── plans/                    # Plan mode files
│
├── .github/                      # GitHub configuration
│   └── workflows/                # GitHub Actions
│       ├── deploy.yml            # Build and deploy
│       └── update-data.yml       # Daily data refresh
│
├── .planning/                    # GSD planning artifacts
│   └── codebase/                 # Codebase documentation
│       ├── STACK.md
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md (this file)
│       ├── CONVENTIONS.md
│       ├── TESTING.md
│       ├── INTEGRATIONS.md
│       └── CONCERNS.md
│
├── .next/                        # Build artifacts (gitignored)
├── out/                          # Static export output (gitignored)
├── node_modules/                 # Dependencies (gitignored)
│
└── Configuration Files
    ├── package.json              # Dependencies and scripts
    ├── package-lock.json         # Dependency lock
    ├── tsconfig.json             # TypeScript configuration
    ├── next.config.ts            # Next.js configuration
    ├── postcss.config.mjs        # PostCSS/Tailwind config
    ├── eslint.config.mjs         # ESLint configuration
    ├── .gitignore                # Git ignore patterns
    └── README.md                 # Project README
```

## Component Organization

### By Domain

| Domain | Directory | Components |
|--------|-----------|------------|
| **Map** | `src/components/Map/` | DistrictMap, Legend, ChamberToggle |
| **Dashboard** | `src/components/Dashboard/` | SidePanel, CandidateCard |
| **Pages** | `src/app/` | layout, page |

### Component Responsibilities

| Component | File | Responsibility |
|-----------|------|----------------|
| `Home` | page.tsx | State orchestration, data fetching |
| `DistrictMap` | DistrictMap.tsx | SVG rendering, interaction handling |
| `SidePanel` | SidePanel.tsx | District details display |
| `CandidateCard` | CandidateCard.tsx | Single candidate card |
| `Legend` | Legend.tsx | Color legend display |
| `ChamberToggle` | ChamberToggle.tsx | House/Senate switcher |

## Data File Locations

### Source of Truth

| File | Location | Purpose |
|------|----------|---------|
| candidates.json | `src/data/` | Candidate data by district |
| party-data.json | `src/data/` | Party enrichment data |
| districts.json | `src/data/` | District metadata |

### Public Access (Browser Fetch)

| File | Location | Notes |
|------|----------|-------|
| candidates.json | `public/data/` | Fetched at runtime |
| party-data.json | `public/data/` | Reference copy |

### Geographic Data

| File | Location | Format |
|------|----------|--------|
| house-districts.svg | `public/maps/` | 124 paths, 257 KB |
| senate-districts.svg | `public/maps/` | 46 paths, 181 KB |
| TIGER shapefiles | `data/shapefiles/` | Source for SVG generation |

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts |
| `tsconfig.json` | TypeScript strict mode, paths |
| `next.config.ts` | Static export, base path |
| `postcss.config.mjs` | Tailwind integration |
| `eslint.config.mjs` | Linting rules |
| `.gitignore` | Git ignore patterns |

## GitHub Actions Workflows

| Workflow | File | Schedule |
|----------|------|----------|
| Deploy | `deploy.yml` | On push to main |
| Update Data | `update-data.yml` | Daily at 10 AM EST |

## Output Directories

| Directory | Purpose | Gitignored |
|-----------|---------|------------|
| `.next/` | Build artifacts | Yes |
| `out/` | Static export | Yes |
| `node_modules/` | Dependencies | Yes |

## SVG Path ID Format

```
house-{1-124}   → House district paths
senate-{1-46}   → Senate district paths
```

Example:
```xml
<path id="house-113" d="..." />
<path id="senate-30" d="..." />
```
