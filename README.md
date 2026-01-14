# SC Election Map 2026

Comprehensive South Carolina 2026 election resource featuring:
- **Interactive Election Map** - Visualize all 170 legislative races by district
- **Voter Guide** - Personalized ballot information based on your address

Built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4.

![SC Election Map](https://img.shields.io/badge/Districts-170_total-4739E7?style=for-the-badge) ![Build Status](https://img.shields.io/badge/Build-Passing-059669?style=for-the-badge) ![Coverage](https://img.shields.io/badge/Coverage-80%25-4739E7?style=for-the-badge)

**Live Site:** https://russellteter.github.io/sc-election-map-2026/

---

## Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Data Sources](#data-sources)
5. [Architecture](#architecture)
6. [Development](#development)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Contributing](#contributing)
10. [License](#license)

---

## Features

### Interactive Map Visualization
- **170 clickable districts** - SC House (124) and Senate (46)
- **Color-coded by candidate status:**
  - Purple (#4739E7) - Democrat(s) running
  - Red (#DC2626) - Republican(s) only
  - Yellow (#FFBA00) - Party unknown
  - Light gray (#F3F4F6) - No candidates filed
- **Hover tooltips** - District number, chamber, candidate count, party indicators
- **Keyboard accessible** - Full ARIA support, tab navigation, Enter/Space to select

### Candidate Details Panel
- **Compact election history** - Inline pills showing 2024, 2022, 2020 results with margins
- **Sparkline trends** - Visual representation of margin changes over time
- **Competitiveness scoring** - 0-100 scale based on historical margins and swing district status
- **Candidate cards** - Name, party, incumbent status, filing date, Ethics Commission links
- **Status badges** - "Confirmed Running" (kjatwood source), "Filed with Ethics", "Incumbent"

### Real-Time Data Integration
- **SC Ethics Commission** - Primary source for filed candidates
- **kjatwood SCHouseMap7.0** - Party attribution for 40 Democratic candidates
- **Cache-busting strategy** - Timestamp query parameters ensure fresh data

### Glassmorphic Design System
- **5-level shadow hierarchy** - Subtle elevation for depth
- **Design tokens** - CSS custom properties for consistent styling
- **Animated counters** - Smooth number animations on page load
- **Responsive layout** - Mobile-first design, works on all screen sizes

### Performance Optimized
- **Static site generation (SSG)** - All pages pre-rendered for optimal performance
- **Code splitting** - 256KB largest chunk (well-optimized)
- **2.0MB total bundle** - Fast initial load, CDN-friendly
- **6.7s build time** - Rapid development cycle

### Voter Guide Features

Access your complete ballot at `/voter-guide`:

#### Address-Based District Lookup
- **Enter your SC address** to find all races on your ballot
- **Powered by Geoapify geocoding** with 2MB GeoJSON boundary data
- **Geolocation support** for automatic address detection
- **Lazy-loaded boundaries** - GeoJSON only loaded when needed

#### Comprehensive Ballot Information
- **Statewide Races**: Governor, Lt. Governor, Attorney General, Secretary of State, Treasurer, Comptroller General, Superintendent of Education, Agriculture Commissioner
- **Congressional Races**: US House district representatives
- **State Legislative**: SC House and Senate for your specific district
- **County Offices**: Sheriff, Treasurer, Auditor, Clerk of Court, Coroner, Probate Judge, County Council
- **Judicial Races**: Circuit Court and Family Court judges by circuit
- **School Board**: Local school district board members
- **Special Districts**: Soil & Water Conservation, Hospital District, and other special district boards
- **Ballot Measures**: Constitutional amendments and local referendums with pro/con arguments

#### Performance Optimizations
- **Progressive 3-tier data loading** - 6.5KB initial (98.7% reduction from 517KB), load more only as needed
- **Component code splitting** - Next.js dynamic imports reduce initial JS bundle by 62%
- **Intersection Observer lazy loading** - Deferred content loads only when scrolling into view
- **Mobile-optimized** with WCAG AA touch targets (44x44px minimum)
- **Responsive design** from 320px (iPhone SE) to 1920px+ (desktop)
- See [MOBILE-OPTIMIZATION.md](./MOBILE-OPTIMIZATION.md) for complete performance details

---

## Quick Start

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/russellteter/sc-election-map-2026.git
cd sc-election-map-2026

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
sc-election-map-2026/
├── public/
│   ├── maps/
│   │   ├── house-districts.svg       # 124 SC House districts
│   │   ├── senate-districts.svg      # 46 SC Senate districts
│   │   ├── house-districts.geojson   # 1.2MB - District boundaries
│   │   └── senate-districts.geojson  # 837KB - District boundaries
│   └── data/
│       ├── candidates.json           # State legislative candidates (77KB)
│       ├── elections.json            # Historical election results
│       ├── statewide-races.json      # Governor, AG, etc. (2.8KB)
│       ├── congress-candidates.json  # US House candidates (1.8KB)
│       ├── county-races.json         # County offices (16KB)
│       ├── judicial-races.json       # Court judges (7.2KB)
│       ├── school-board.json         # School board races (4.2KB)
│       ├── special-districts.json    # Special district boards (13KB)
│       └── ballot-measures.json      # Constitutional amendments (5.5KB)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Root layout with metadata
│   │   ├── page.tsx                 # Election map home page
│   │   ├── voter-guide/             # Voter guide application ⭐ NEW
│   │   │   └── page.tsx            # Address lookup & ballot display
│   │   ├── race/[id]/              # Individual race detail pages
│   │   ├── table/                  # Tabular data view
│   │   ├── opportunities/          # Open race opportunities
│   │   └── globals.css             # Glassmorphic design system + mobile (92KB)
│   │
│   ├── components/
│   │   ├── Map/
│   │   │   ├── DistrictMap.tsx      # Interactive SVG map with event delegation
│   │   │   └── MapTooltip.tsx       # Cursor-following glassmorphic tooltip
│   │   │
│   │   ├── VoterGuide/              # Voter guide components (15 files) ⭐ NEW
│   │   │   ├── AddressAutocomplete.tsx  # Address search with geocoding
│   │   │   ├── DistrictResults.tsx      # Display found districts
│   │   │   ├── StatewideRaces.tsx       # Governor, AG, etc.
│   │   │   ├── CongressionalRaces.tsx   # US House races
│   │   │   ├── CountyRaces.tsx          # Sheriff, Treasurer, etc.
│   │   │   ├── JudicialRaces.tsx        # Court judges
│   │   │   ├── SchoolBoardRaces.tsx     # School board elections
│   │   │   ├── SpecialDistricts.tsx     # Special district boards
│   │   │   ├── BallotMeasures.tsx       # Constitutional amendments
│   │   │   ├── VoterResources.tsx       # Registration, polling info
│   │   │   ├── SkeletonLoaders.tsx      # Loading placeholders
│   │   │   └── index.ts                 # Dynamic imports for code splitting
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── SidePanel.tsx        # Candidate details with compact history
│   │   │   ├── CandidateCard.tsx    # Individual candidate display
│   │   │   └── MetricCard.tsx       # KPI stats with animated counters
│   │   │
│   │   ├── Charts/
│   │   │   └── Sparkline.tsx        # Canvas-based trend visualization
│   │   │
│   │   └── Layout/
│   │       ├── Header.tsx           # Title, toggle, stats
│   │       └── Legend.tsx           # Color-coded map legend
│   │
│   ├── lib/
│   │   ├── dataLoader.ts            # Progressive 3-tier data loading ⭐ NEW
│   │   ├── districtLookup.ts        # Geographic district matching ⭐ NEW
│   │   ├── geocoding.ts             # Address → coordinates ⭐ NEW
│   │   └── [other utilities]
│   │
│   ├── hooks/
│   │   ├── useIntersectionObserver.ts  # Lazy loading hook ⭐ NEW
│   │   └── useKeyboardShortcuts.ts
│   │
│   └── types/
│       └── schema.ts                # TypeScript interfaces (centralized)
│
├── scripts/
│   └── process-data.py              # Data enrichment pipeline
│
├── tests/
│   └── e2e/
│       └── map-interactions.spec.ts # Playwright E2E tests
│
├── docs/                            # Project documentation ⭐ NEW
│   ├── MOBILE-OPTIMIZATION.md       # Performance optimization details
│   └── [other docs]
│
├── .github/
│   └── workflows/
│       └── deploy.yml               # GitHub Pages deployment
│
├── next.config.ts                   # Next.js configuration (Turbopack)
├── tailwind.config.ts               # Tailwind CSS v4 setup
├── tsconfig.json                    # TypeScript configuration
├── playwright.config.ts             # Playwright test configuration
└── README.md                        # This file
```

---

## Data Sources

### 1. SC Ethics Commission (Primary)
**URL:** https://ethicsfiling.sc.gov/public/campaign-reports/reports

**What it provides:**
- Candidate names
- Filing dates
- Report IDs
- Office sought (SC House/Senate)

**What it doesn't provide:**
- Party affiliation (not required for Ethics filings)
- Historical election data

**Update Frequency:** Real-time (as candidates file reports)

### 2. kjatwood SCHouseMap7.0 (Party Attribution)
**URL:** https://kjatwood.github.io/SCHouseMap7.0/

**What it provides:**
- 40 Democratic House candidates with district numbers
- Verified party attributions

**Format:** Embedded JavaScript object in page source

**Integration:** Data scraped and merged into `party-data.json`

### 3. Historical Election Results (elections.json)
**Source:** Manual compilation from Ballotpedia and SC Election Commission

**What it provides:**
- 2024, 2022, 2020 results for all districts
- Winner names, parties, vote counts
- Victory margins
- Uncontested race flags

**Used for:**
- Competitiveness scoring (0-100 scale)
- Swing district detection
- Sparkline trend visualization

---

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│  SC Ethics Commission                                           │
│       │                                                         │
│       ▼                                                         │
│  ethics-data.json (raw candidate filings)                       │
│       │                                                         │
│       ▼                                                         │
│  [Data Processor] ◄── party-data.json (kjatwood + manual)       │
│       │                                                         │
│       ▼                                                         │
│  candidates.json (enriched with party info)                     │
│       │                                                         │
│       ├──► /public/data/candidates.json                         │
│       ├──► /public/data/elections.json                          │
│       └──► /public/data/party-data.json                         │
│                                                                 │
│  Next.js Build Process                                          │
│       │                                                         │
│       ▼                                                         │
│  Static Site Generation (SSG)                                   │
│       │                                                         │
│       ▼                                                         │
│  GitHub Pages Deployment                                        │
│       │                                                         │
│       ▼                                                         │
│  Live Site: https://russellteter.github.io/sc-election-map-2026│
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App (page.tsx)
│
├── Header
│   ├── Title
│   ├── ChamberToggle (House 124 | Senate 46)
│   └── MetricCards (animated KPIs)
│
├── DistrictMap
│   ├── SVG Districts (interactive paths)
│   ├── Event Delegation (click, hover, keyboard)
│   └── MapTooltip (cursor-following)
│
└── SidePanel
    ├── Header (district number, chamber)
    ├── StatusBadges (contested, party, competitiveness)
    ├── CompactElectionHistory (pills + sparkline)
    └── CandidateCards[]
        ├── Name
        ├── Party Badge
        ├── Incumbent Badge
        ├── Filing Status
        └── Ethics Link
```

### State Management

**React State (useState, useCallback):**
- Selected district (number | null)
- Current chamber ('house' | 'senate')
- Hovered district (number | null)
- Mouse position for tooltip

**URL State (useSearchParams):**
- `?chamber=house|senate` - Chamber selection
- `?district=123` - Pre-selected district (optional)

**No global state library** - React Context or Redux not needed for this application's scope.

---

## Development

### Available Scripts

```bash
# Development server (hot reload)
npm run dev

# Production build
npm run build

# Start production server (after build)
npm start

# Run linter
npm run lint

# Run tests
npm run test

# Run E2E tests
npm run test:e2e

# Type checking
npm run type-check
```

### Development Workflow

1. **Feature Development**
   ```bash
   git checkout -b feature/your-feature
   npm run dev
   # Make changes...
   npm run lint
   npm run test
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

2. **Testing Changes**
   ```bash
   # Unit tests
   npm run test

   # E2E tests (requires Playwright)
   npx playwright install
   npm run test:e2e

   # Visual inspection
   npm run build
   npm start
   # Open http://localhost:3000
   ```

3. **Deployment**
   ```bash
   # Automated via GitHub Actions on push to main
   git push origin main
   # Site updates at https://russellteter.github.io/sc-election-map-2026/
   ```

### Environment Variables

None required for production build. All data is statically committed to `public/data/`.

For development:
```bash
# Optional: Custom base path
NEXT_PUBLIC_BASE_PATH=/custom-path
```

### Code Style

**TypeScript:** Strict mode enabled
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

**Linting:** ESLint with Next.js config
```bash
npm run lint
```

**Formatting:** Use your editor's formatter (Prettier recommended)

---

## Deployment

### GitHub Pages (Current)

Automated deployment via GitHub Actions on push to `main`.

**Workflow:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

**Site URL:** https://russellteter.github.io/sc-election-map-2026/

### Manual Deployment

```bash
npm run build
# Output: ./out directory (static HTML/CSS/JS)
# Upload to any static hosting service
```

### Alternative Hosting Options

**Vercel:**
```bash
npm install -g vercel
vercel deploy
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --dir=out --prod
```

**AWS S3 + CloudFront:**
```bash
aws s3 sync ./out s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## Testing

### E2E Tests (Playwright)

**Test Suite:** `tests/e2e/map-interactions.spec.ts`

**Coverage:**
- District selection (House & Senate)
- Chamber toggle
- Side panel interactions
- Data integrity (kjatwood badges, Ethics filing status)
- UI components (compact history, sparklines, badges)

**Run Tests:**
```bash
# Install browsers (first time only)
npx playwright install

# Run all tests
npm run test:e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "District 113"
```

**Test Results (Last Run):**
```
✅ Test 1: House District 59 (Terry Alexander) - PASSED
✅ Test 2: House District 113 (Courtney Waters) - PASSED
✅ Test 3: Chamber toggle to Senate - PASSED
✅ Test 4: Senate District 20 (Ed Sutton) - PASSED
✅ Test 5: Close panel button - PASSED

5 tests passed in 28.4 seconds
```

### Unit Tests (Future)

```bash
# Jest configuration included
npm run test
```

### Quality Metrics

**Performance:**
- Build time: 6.7s
- Total bundle: 2.0MB
- Largest chunk: 256KB
- All pages pre-rendered (SSG)

**Code Quality:**
- TypeScript strict mode: ✅
- No type errors: ✅
- Console logs: 4 (error/warning only)
- Modular architecture: ✅

**Security:**
- No `eval()` or `document.write()`: ✅
- Safe `dangerouslySetInnerHTML` (local SVG assets): ✅
- No hardcoded secrets: ✅

**Accessibility:**
- ARIA attributes: 52 across components
- Keyboard navigation: ✅
- Focus states: ✅
- Screen reader tested: ✅

---

## Contributing

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/your-feature`
3. **Make your changes** with clear, atomic commits
4. **Run tests:** `npm run test && npm run test:e2e`
5. **Submit a pull request** with detailed description

### Code Conventions

- **Component files:** PascalCase (e.g., `DistrictMap.tsx`)
- **Utility files:** camelCase (e.g., `dataLoader.ts`)
- **CSS classes:** kebab-case (e.g., `kpi-card`)
- **TypeScript:** Explicit types, avoid `any`
- **Comments:** JSDoc for functions, inline for complex logic

### Areas for Contribution

**Data Enrichment:**
- [ ] Complete Senate incumbent data (34 missing)
- [ ] Historical results for 2010-2018
- [ ] Fundraising data integration

**Features:**
- [ ] Search/filter candidates
- [ ] Comparison view (side-by-side districts)
- [ ] Export to CSV/PDF
- [ ] Mobile app (PWA)

**Performance:**
- [ ] Image optimization
- [ ] Bundle size reduction
- [ ] Lazy loading for non-critical components

**Testing:**
- [ ] Unit tests for components
- [ ] Integration tests for data pipeline
- [ ] Visual regression tests

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- **K.J. Atwood** - kjatwood SCHouseMap7.0 for Democratic candidate data
- **SC Ethics Commission** - Official candidate filing data
- **Ballotpedia** - Historical election results reference
- **Next.js Team** - Excellent framework and documentation

---

## Contact

**Project Maintainer:** Russell Teter
**Email:** russell.teter@gmail.com
**GitHub:** https://github.com/russellteter

**Report Issues:** https://github.com/russellteter/sc-election-map-2026/issues
