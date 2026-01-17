# Blue Intelligence - Codebase Overview

> Consolidated technical reference for the Blue Intelligence codebase
> Last Updated: 2026-01-17

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16 | App Router, Static Export |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Type safety (strict mode) |
| **Tailwind CSS** | 4 | Utility-first styling |
| **Node.js** | 20 | Build environment |

### Build Configuration

```typescript
// next.config.ts
{
  output: 'export',                    // Static generation
  basePath: '/sc-election-map-2026',   // GitHub Pages path
  assetPrefix: '/sc-election-map-2026/',
  images: { unoptimized: true },       // No image optimization
  trailingSlash: true                  // URLs end with /
}
```

### Design System

```css
/* Core design tokens */
--class-purple: #4739E7;           /* Primary brand */
--class-purple-light: #DAD7FA;     /* Light variant */
--glass-background: #EDECFD;       /* Page background */
--text-color: #0A1849;             /* Midnight blue */

/* Election map semantic colors */
--map-democrat: #3b82f6;           /* Blue */
--map-republican: #ef4444;         /* Red */
--map-both-parties: #a855f7;       /* Purple */
--map-unknown: #9ca3af;            /* Gray */
--map-empty: #f3f4f6;              /* Light gray */
```

---

## Architecture

### Overview

**Pattern**: Component-driven client-side application with static generation

**Key Characteristics**:
- Static export via Next.js (`output: 'export'`)
- Client-side data fetching and rendering
- SVG-based interactive maps
- Multi-state configuration system
- Demo data generation at build time

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      BUILD TIME                              │
├─────────────────────────────────────────────────────────────┤
│  State Configs (src/config/states/)                         │
│         │                                                   │
│         ▼                                                   │
│  Demo Data Generator (src/lib/demoDataGenerator.ts)         │
│         │                                                   │
│         ▼                                                   │
│  Static JSON files (public/data/[state]/*.json)             │
│         │                                                   │
│         ▼                                                   │
│  Next.js Build → Static HTML/JS/CSS                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    CLIENT RUNTIME                           │
├─────────────────────────────────────────────────────────────┤
│  Browser loads page                                         │
│         │                                                   │
│         ▼ (Progressive loading)                             │
│  Tier 1: Critical data (<10KB)                              │
│         │                                                   │
│         ▼ (User action)                                     │
│  Tier 2: On-demand data (~100KB)                            │
│         │                                                   │
│         ▼ (Scroll/visibility)                               │
│  Tier 3: Deferred data (~30KB)                              │
│         │                                                   │
│         ▼                                                   │
│  React renders interactive UI                               │
└─────────────────────────────────────────────────────────────┘
```

### State Management

**Approach**: React hooks (useState, useEffect, useMemo, useCallback)

| State | Type | Purpose |
|-------|------|---------|
| `currentState` | `StateCode` | Active state (SC, NC, etc.) |
| `chamber` | `'house' \| 'senate'` | Current chamber view |
| `selectedDistrict` | `number \| null` | Selected district |
| `candidatesData` | `StateData \| null` | Loaded state data |
| `isLoading` | `boolean` | Loading state |

---

## Directory Structure

```
sc-election-map-2026/
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # National landing page
│   │   ├── [state]/              # Dynamic state routes
│   │   │   ├── page.tsx          # State election map
│   │   │   ├── voter-guide/      # Voter guide
│   │   │   ├── opportunities/    # Strategic opportunities
│   │   │   └── race/[id]/        # Race details
│   │   └── globals.css           # Global styles
│   │
│   ├── components/
│   │   ├── Map/                  # Map components
│   │   │   ├── DistrictMap.tsx   # Interactive SVG map
│   │   │   ├── USMap.tsx         # National map
│   │   │   └── Legend.tsx        # Color legend
│   │   │
│   │   ├── Dashboard/            # Dashboard components
│   │   │   ├── SidePanel.tsx     # District details
│   │   │   └── CandidateCard.tsx # Candidate display
│   │   │
│   │   ├── VoterGuide/           # Voter guide components
│   │   │   ├── AddressLookup.tsx
│   │   │   └── BallotDisplay.tsx
│   │   │
│   │   ├── Intelligence/         # Intelligence features
│   │   │   ├── ElectorateProfile.tsx
│   │   │   ├── MobilizationCard.tsx
│   │   │   ├── EarlyVoteTracker.tsx
│   │   │   └── ResourceOptimizer.tsx
│   │   │
│   │   └── ui/                   # Shared UI components
│   │       └── DemoBadge.tsx     # Demo data indicator
│   │
│   ├── config/
│   │   └── states/               # State configurations
│   │       ├── index.ts          # State registry
│   │       ├── sc.ts             # South Carolina
│   │       ├── nc.ts             # North Carolina
│   │       ├── ga.ts             # Georgia
│   │       ├── fl.ts             # Florida
│   │       └── va.ts             # Virginia
│   │
│   ├── lib/
│   │   ├── dataLoader.ts         # Progressive data loading
│   │   ├── demoDataGenerator.ts  # Demo data generation
│   │   ├── districtLookup.ts     # Geographic lookup
│   │   ├── geocoding.ts          # Address geocoding
│   │   └── constants.ts          # App constants
│   │
│   └── types/
│       └── schema.ts             # TypeScript definitions
│
├── public/
│   ├── maps/
│   │   ├── us-states.svg         # National map
│   │   └── [state]/              # State-specific maps
│   │       ├── house-districts.svg
│   │       └── senate-districts.svg
│   │
│   └── data/
│       └── [state]/              # State-specific data
│           ├── candidates.json
│           ├── elections.json
│           └── *.geojson
│
├── .planning/                    # GSD planning
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── STATE.md
│   └── codebase/                 # This directory
│
├── claudedocs/                   # Claude Code context
│   ├── BLUE-INTELLIGENCE-BIBLE.md
│   └── gsd/                      # GSD execution support
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md
│   └── CURRENT-STATE.md
│
└── Configuration
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── eslint.config.mjs
```

---

## Coding Conventions

### TypeScript Patterns

```typescript
// Component props interface
interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlighted' | 'muted';
  state?: StateCode;
}

// Data models use interfaces
interface District {
  districtNumber: number;
  candidates: Candidate[];
  chamber: 'house' | 'senate';
}

// State codes as union type
type StateCode = 'SC' | 'NC' | 'GA' | 'FL' | 'VA';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DistrictMap.tsx` |
| Utilities | camelCase | `dataLoader.ts` |
| State | camelCase with `is*`/`has*` | `isLoading`, `hasData` |
| Handlers | `handle*` | `handleClick` |
| Callbacks | `on*` | `onDistrictClick` |

### Component Structure

```typescript
'use client';  // Client directive

import { useState, useEffect } from 'react';
import { useStateConfig } from '@/lib/stateConfig';

interface Props { /* ... */ }

export function Component({ prop1, prop2 }: Props) {
  // 1. Hooks at top
  const [state, setState] = useState(initial);
  const config = useStateConfig();

  // 2. Effects
  useEffect(() => { /* ... */ }, [deps]);

  // 3. Callbacks
  const handleClick = useCallback(() => { /* ... */ }, [deps]);

  // 4. Memoized values
  const computed = useMemo(() => { /* ... */ }, [deps]);

  // 5. Early returns
  if (isLoading) return <Skeleton />;

  // 6. Render
  return <div>{/* JSX */}</div>;
}
```

---

## Testing

### Current Status

| Type | Status | Framework |
|------|--------|-----------|
| Unit Tests | Partial | Jest |
| E2E Tests | Planned | Playwright |
| Type Checking | Full | TypeScript |
| Linting | Full | ESLint |

### Key Test Commands

```bash
npm run lint      # ESLint
npm run type-check # TypeScript
npm test          # Unit tests
npm run test:e2e  # E2E tests (when implemented)
```

### Quality Gates

- TypeScript compiles without errors
- ESLint passes
- Lighthouse scores >90
- Mobile viewport renders correctly

---

## External Integrations

### Current Integrations

| Integration | Purpose | Status |
|-------------|---------|--------|
| GitHub Pages | Hosting | Active |
| Geoapify | Geocoding | Active |
| SC Ethics Commission | Candidate data | Active (SC only) |

### Planned Integrations (Phase C)

| Integration | Purpose | Status |
|-------------|---------|--------|
| BallotReady API | Candidate data | Planned |
| TargetSmart API | Voter intelligence | Planned |
| OpenStates API | Legislative data | Planned |

---

## Known Concerns

### Critical

| Issue | Location | Mitigation |
|-------|----------|------------|
| SVG innerHTML | DistrictMap.tsx | Local assets only |
| Demo data presentation | All states | DemoBadge component |

### Technical Debt

| Item | Priority | Phase |
|------|----------|-------|
| Consolidate duplicate types | High | B |
| Add test coverage | High | B |
| Implement error boundaries | Medium | B |
| Add service worker | Low | D |

---

## Performance Optimizations

| Optimization | Location | Benefit |
|--------------|----------|---------|
| `useMemo` for SVG processing | DistrictMap | Prevents re-parsing |
| Progressive data loading | dataLoader | Faster initial load |
| Event delegation | DistrictMap | Single handler |
| Static generation | Next.js config | No SSR overhead |
| Code splitting | Dynamic imports | Smaller bundles |

---

## Deployment

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
on: push to main

steps:
  - Checkout
  - Setup Node.js 20
  - npm ci
  - npm run build
  - Deploy to GitHub Pages
```

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_BASE_PATH` | GitHub Pages path | Yes |
| `NEXT_PUBLIC_GEOAPIFY_KEY` | Geocoding API | Yes |

---

*This document consolidates content from the previous STACK.md, ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, INTEGRATIONS.md, and CONCERNS.md files.*
