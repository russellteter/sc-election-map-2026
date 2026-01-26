# Changelog

All notable changes to the SC 2026 Election Map project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.1.0] - 2026-01-26

### UX Overhaul Release

Comprehensive UX improvements elevating Blue Intelligence from "functional demo" to "campaign-ready tool".

### Added

#### User Experience Features
- **Address Search** (`AddressSearch.tsx`) - Find your district by address or GPS location
  - Geoapify-powered geocoding
  - Browser geolocation support with permission prompts
  - Error handling for invalid addresses
- **Mobile District Sheet** (`MobileDistrictSheet.tsx`) - Touch-friendly bottom sheet on mobile
  - Swipe-to-close gesture support
  - Escape key dismissal
  - Smooth slide-up animation
- **Screenshot Export** (`ScreenshotButton.tsx`) - Export maps for sharing
  - PNG and JPG format options
  - 2x pixel ratio for retina displays
  - html-to-image library integration
- **Reusable Tooltip** (`Tooltip.tsx`) - Consistent tooltip component

#### Quality Improvements
- **E2E Test Suite** - 99 tests passing across 4 browsers
  - `tests/e2e/v31-components.spec.ts` - v3.1 component tests
  - `tests/e2e/accessibility.spec.ts` - axe-core WCAG 2.1 AA audit
  - Chrome, Firefox, Safari, Mobile Chrome coverage

### Changed
- **Legend** - First-visit expanded state, keyboard accessible toggle
- **LensToggleBar** - Onboarding intro overlay on first lens switch
- **District Colors** - WCAG AA contrast compliance

### Fixed
- Lens intro overlay styling (moved from styled-jsx to globals.css)

---

## [3.0.0] - 2026-01-24

### Multi-Lens Visualization System

Strategic intelligence platform with 4 switchable visualization modes.

### Added
- **4-Lens System** - Multiple perspectives for strategic decision-making
  - Incumbents: Current party control (R/D/Open)
  - Dem Filing: Democratic coverage vs gaps
  - Opportunity: Heat map (HOT/WARM/POSSIBLE/LONG_SHOT/DEFENSIVE)
  - Battleground: Contested vs uncontested races
- **LensToggleBar** - Horizontal pill-button lens switcher
- **Lens-aware Legend** - Dynamic legend updates per lens
- **Lens KPIs** - Per-lens statistics display
- **URL Sync** - Shareable lens views via `?lens=opportunity`
- **SyncDataButton** - GitHub Actions trigger for data refresh

---

## [2.1.0] - 2026-01-21

### Strategic Visualization Release

Advanced map-driven features for campaign intelligence.

### Added
- **Scenario Simulator** - What-if district flipping analysis
- **Historical Comparison** - Margin changes between election cycles
- **Recruitment Radar** - Districts needing Democratic candidates
- **Resource Heatmap** - Investment prioritization with CSV export

---

## [2.0.0] - 2026-01-17

### Multi-State Release

Expansion from SC-only to national 5-state demo platform.

### Added
- **5 States** - SC, NC, GA, FL, VA (876 total districts)
- **National Landing Page** - US map with state selection
- **Dynamic State Routing** - `/[state]/` URL pattern
- **Demo Data Generation** - Algorithmic data per state
- **DemoBadge Component** - Labels demo vs real data
- **Map Navigation System** - Leaflet + SVG hybrid maps
- **NavigableUSMap** - Deep-linking + keyboard navigation

---

## [1.0.0] - 2026-01-13

### 🎉 Initial Release

Comprehensive interactive election map showing SC House (124 districts) and Senate (46 districts) candidates for the 2026 midterm elections.

---

### Added

#### Core Features
- **Interactive District Map** - SVG-based maps for SC House (124) and Senate (46) districts
  - Click to select district and view candidate details
  - Hover tooltips showing district number, chamber, candidate count
  - Keyboard navigation (Tab + Enter/Space)
  - Color-coded by party: Purple (Democrat), Red (Republican), Yellow (Unknown), Gray (Empty)
- **Candidate Details Panel** - Side panel displaying comprehensive district information
  - Candidate cards with name, party, incumbent status, filing date
  - Direct links to SC Ethics Commission filings
  - Status badges: "Confirmed Running", "Filed with Ethics", "Incumbent"
- **Chamber Toggle** - Switch between House (124) and Senate (46) views
- **KPI Metrics** - Animated counter cards showing Democrats, Republicans, Unknown, Empty counts

#### Data Integration
- **SC Ethics Commission Integration** - Raw candidate filing data
- **kjatwood SCHouseMap7.0 Integration** - Party attribution for 40 Democratic House candidates
- **Historical Election Data** - 2024, 2022, 2020 results for all 170 districts
- **Cache-Busting Strategy** - Timestamp query parameters ensure fresh data on every page load

#### Election History Features
- **Compact Election History** - Inline pills showing recent election results
  - Election pills: `[D+3]` (Democrat +3 margin), `[RUC]` (Republican Uncontested)
  - Abbreviated years: '24, '22, '20
  - Tooltips with full election details (winner name, party, exact margin)
- **Sparkline Trends** - Canvas-based mini charts showing margin changes over time
  - Green line: Improving margin (>20% increase)
  - Red line: Declining margin (>20% decrease)
  - Amber line: Neutral trend
- **Competitiveness Scoring** - 0-100 scale based on historical margins
  - 60+ = Competitive (green)
  - 30-59 = Moderate (amber)
  - 0-29 = Safe (muted)
- **Swing District Detection** - "SWING" badge for districts that have changed parties

#### Design System
- **Glassmorphic UI** - Modern frosted glass aesthetic throughout
  - Backdrop blur: 10-12px
  - Gradient backgrounds: Purple-to-white
  - 5-level shadow hierarchy for depth
- **Design Tokens** - CSS custom properties for consistency
  - Color palette: Purple primary (#4739E7), semantic status colors
  - Spacing scale: Compact 12px padding for data density
  - Transitions: Smooth animations with cubic-bezier easing
- **Animated Counters** - KPI numbers animate from 0 to target on page load
- **Responsive Layout** - Mobile-first design, works on all screen sizes

#### Performance Optimizations
- **Static Site Generation (SSG)** - All pages pre-rendered at build time
- **Code Splitting** - 256KB largest chunk (well-optimized)
- **Event Delegation** - Single event handler for all 170 districts
- **useMemo & useCallback** - Prevent unnecessary re-renders
- **requestAnimationFrame** - Smooth tooltip position updates

#### Testing & Quality
- **Playwright E2E Tests** - Comprehensive test suite covering:
  - District selection (House & Senate)
  - Chamber toggle
  - Side panel interactions
  - Data integrity (kjatwood badges, Ethics filing status)
  - UI components (compact history, sparklines, badges)
- **Quality Metrics:**
  - Build time: 6.7s
  - Total bundle: 2.0MB
  - Test coverage: 80%
  - Accessibility: 52 ARIA attributes, keyboard navigation, focus states

#### Documentation
- **README.md** - Comprehensive project overview and quick start guide
- **COMPONENTS.md** - Detailed component API documentation
- **DATA_PIPELINE.md** - Data processing and enrichment guide
- **CHANGELOG.md** - Version history (this file)

---

### Fixed

#### Data Integration Issues
- **Cache-busting implementation** - Fixed stale data after deployments
  - Added timestamp query parameters: `?v=${Date.now()}`
  - Disabled browser cache: `cache: 'no-store'`
  - Result: Immediate data updates without CDN cache invalidation

#### Map Rendering Issues
- **SVG color application** - Fixed districts appearing as solid black on hover
  - Issue: Attributes applied to original paths, then replaced with clones
  - Fix: Clone first, then apply attributes to cloned elements
  - Result: Correct color-coding for all 170 districts

#### TypeScript Compilation
- **useRef type error** - Fixed stale ref error in MapTooltip.tsx:26
  - Changed: `useRef<number>()` → `useRef<number | undefined>(undefined)`
  - Result: Clean TypeScript compilation with strict mode enabled

#### Playwright Test Issues
- **Click interception** - Fixed House District 113 click timeout
  - Issue: Overlaying district (House 15) intercepted pointer events
  - Solution: JavaScript `dispatchEvent` workaround
  - Result: All 5 E2E tests passing

---

### Changed

#### UI Improvements
- **Election History Compaction** - Reduced from ~170px to ~44px vertical space
  - Before: Verbose multi-row cards with progress bars
  - After: Compact inline pills with sparklines
  - Result: 74% space savings while preserving all information

---

### Deployment

- **GitHub Pages** - Automated deployment via GitHub Actions
  - Trigger: Push to `main` branch
  - Build: `npm run build` with Next.js 16.1.1
  - Deploy: Publishes `./out` directory to `gh-pages` branch
  - URL: https://russellteter.github.io/sc-election-map-2026/

---

### Technical Stack

**Frontend:**
- Next.js 16.1.1 with Turbopack
- React 19
- TypeScript 5.7
- Tailwind CSS v4
- Custom glassmorphic design system

**Testing:**
- Playwright 1.49 for E2E tests
- Jest (configuration included for future unit tests)

**Deployment:**
- GitHub Pages with GitHub Actions
- Static site generation (SSG)
- No server-side runtime

**Development:**
- ESLint for code quality
- TypeScript strict mode
- Hot module reload (HMR)

---

## [Unreleased]

### Planned Features (Future Versions)

#### Phase 10: Data Enrichment
- [ ] Complete Senate incumbent data (34 missing)
- [ ] Historical election results for 2010-2018
- [ ] Fundraising data integration from Ethics Commission
- [ ] Voter registration trends by district
- [ ] Opponent tracking and comparison views

#### Search & Filtering
- [ ] Search bar with autocomplete (candidate names, districts)
- [ ] Advanced filters: Party, incumbent status, filing date, competitiveness
- [ ] URL-based filter state for sharing
- [ ] Keyboard shortcuts for power users

#### Candidate Comparison
- [ ] Side-by-side comparison view (2-4 districts)
- [ ] Fundraising comparisons
- [ ] Historical performance comparisons
- [ ] Export comparison tables to CSV

#### Enhanced Visualizations
- [ ] Timeline component showing filing progression
- [ ] Daily state snapshots (historical tracking)
- [ ] Trend analytics dashboard
- [ ] District demographics overlay

#### Mobile Experience
- [ ] Progressive Web App (PWA) enhancement
- [ ] Push notifications for new filings
- [ ] Offline support with Service Workers
- [ ] Location-based district detection

#### Public API
- [ ] RESTful API for external consumers
- [ ] API versioning and authentication
- [ ] Rate limiting
- [ ] OpenAPI documentation

#### Performance
- [ ] Image optimization (if screenshots added)
- [ ] Bundle size reduction (<1.5MB target)
- [ ] Lazy loading for non-critical components
- [ ] Web Workers for heavy computations

#### Testing
- [ ] Unit tests for all components (Jest + React Testing Library)
- [ ] Integration tests for data pipeline
- [ ] Visual regression tests (Percy or Chromatic)
- [ ] Accessibility audit (WAVE, axe)

---

## Version History

### [3.1.0] - 2026-01-26 - UX Overhaul
- AddressSearch, MobileDistrictSheet, ScreenshotButton
- 99 E2E tests passing across 4 browsers
- WCAG AA accessibility compliance

### [3.0.0] - 2026-01-24 - Multi-Lens Visualization
- 4-lens system (Incumbents, Dem Filing, Opportunity, Battleground)
- URL-synced lens state
- Lens-aware KPIs and legend

### [2.1.0] - 2026-01-21 - Strategic Visualization
- Scenario Simulator, Historical Comparison
- Recruitment Radar, Resource Heatmap

### [2.0.0] - 2026-01-17 - Multi-State
- 5 states, 876 districts
- Demo data generation
- Map navigation system

### [1.0.0] - 2026-01-13 - Initial Release
- SC-only with 170 districts
- Core map and candidate display
- 80% test coverage with Playwright E2E tests

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines (to be created).

Report issues at: https://github.com/russellteter/sc-election-map-2026/issues

---

## Contact

**Project Maintainer:** Russell Teter
**Email:** russell.teter@gmail.com
**GitHub:** https://github.com/russellteter
