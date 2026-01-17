# Blue Intelligence

National 50-state election intelligence demo platform for Democratic campaigns.

![Districts](https://img.shields.io/badge/Districts-876_total-4739E7?style=for-the-badge) ![States](https://img.shields.io/badge/States-5_live-059669?style=for-the-badge) ![Lighthouse](https://img.shields.io/badge/Lighthouse-100%2F94%2F96%2F100-4739E7?style=for-the-badge)

**Live Demo:** https://russellteter.github.io/sc-election-map-2026/

---

## Overview

Blue Intelligence transforms election data into strategic campaign intelligence. Currently deployed with **5 states** and **876 districts** as a proof-of-concept demo.

### States Deployed

| State | House | Senate | Total | Data |
|-------|-------|--------|-------|------|
| South Carolina | 124 | 46 | 170 | Real + Demo |
| North Carolina | 120 | 50 | 170 | Demo |
| Georgia | 180 | 56 | 236 | Demo |
| Florida | 120 | 40 | 160 | Demo |
| Virginia | 100 | 40 | 140 | Demo |
| **Total** | **644** | **232** | **876** | |

---

## Features

### Interactive District Maps
- 876 clickable districts across 5 states
- Color-coded by party status
- Hover tooltips with district info
- Keyboard accessible

### Voter Guide
- Address-based personalized ballot lookup
- All races from local to federal
- Polling place information

### Strategic Intelligence
- Electorate profiles with partisan composition
- Mobilization scoring ("sleeping giant" districts)
- Resource optimization recommendations
- Opportunity scoring by tier

### Multi-State Support
- National landing page with US map
- Dynamic state routing (`/[state]/`)
- Per-state configuration system
- Demo data generation for all states

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm

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
```

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # National landing page
│   └── [state]/          # Dynamic state routes
├── components/           # React components
│   ├── Map/              # District map components
│   ├── Intelligence/     # Strategic intelligence
│   └── VoterGuide/       # Voter guide components
├── config/states/        # State configurations
├── lib/                  # Utilities
└── types/                # TypeScript definitions

public/
├── maps/                 # SVG district maps
└── data/                 # Static data files
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 |
| UI | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Hosting | GitHub Pages |

---

## Performance

| Metric | Score |
|--------|-------|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 94 |
| Lighthouse Best Practices | 96 |
| Lighthouse SEO | 100 |
| Initial Payload | <10KB |

---

## Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](./CLAUDE.md) | Claude Code context |
| [docs/CURRENT-STATE.md](./docs/CURRENT-STATE.md) | Live metrics |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture |

---

## Development

### Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint check
npm test          # Run tests
```

### Environment Variables

```bash
NEXT_PUBLIC_GEOAPIFY_KEY=your_key_here
```

---

## Roadmap

### Phase A (Complete)
- 5-state demo platform
- All 12 intelligence features
- Demo data generation

### Phase B (Planned)
- Monorepo migration
- Shared component library

### Phase C (Planned)
- Real API integrations
- SC production deployment

### Phase D (Planned)
- 50-state expansion

---

## Demo Data Notice

This platform uses **demo generated data** for all states except South Carolina, which has partial real data. All demo data is clearly labeled with a "Demo Data" badge. Real API integrations (BallotReady, TargetSmart) are planned for future phases.

---

## License

MIT License - see LICENSE file for details.

---

## Contact

**Project Maintainer:** Russell Teter
**GitHub:** https://github.com/russellteter

**Report Issues:** https://github.com/russellteter/sc-election-map-2026/issues
