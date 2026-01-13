# Technology Stack - SC Election Map 2026

> Generated: 2026-01-12 | GSD Codebase Mapping

## Primary Language & Version

| Technology | Version | Notes |
|------------|---------|-------|
| **TypeScript** | 5 | Strict mode enabled |
| **Target** | ES2017 | JSX React mode |
| **Module Resolution** | bundler | Path alias: `@/*` → `./src/*` |

## Framework

| Framework | Version | Configuration |
|-----------|---------|---------------|
| **Next.js** | 16.1.1 | App Router, Static Export |
| **React** | 19.2.3 | Latest with automatic runtime |
| **React DOM** | 19.2.3 | Client-side rendering |

### Next.js Configuration

```typescript
// next.config.ts
{
  output: 'export',                    // Static generation (no server)
  basePath: '/sc-election-map-2026',   // GitHub Pages subdirectory
  assetPrefix: '/sc-election-map-2026/', // Asset URL prefix
  images: { unoptimized: true },       // No Next.js image optimization
  trailingSlash: true                  // URLs end with /
}
```

## Build Tools

| Tool | Purpose |
|------|---------|
| **npm** | Package manager (package-lock.json) |
| **Node.js** | 20 (GitHub Actions requirement) |
| **Webpack** | Bundler (via Next.js) |

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

## Styling

| Technology | Version | Notes |
|------------|---------|-------|
| **Tailwind CSS** | 4 | Utility-first CSS |
| **PostCSS** | 4 | Via `postcss.config.mjs` |
| **Design System** | Custom | Glassmorphic tokens in CSS variables |

### Design System Colors

```css
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

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.1.1 | Framework |
| `react` | 19.2.3 | UI library |
| `react-dom` | 19.2.3 | DOM rendering |
| `tailwindcss` | ^4 | Styling |
| `@tailwindcss/postcss` | ^4 | PostCSS plugin |

## Development Tools

| Tool | Version | Configuration |
|------|---------|---------------|
| **ESLint** | 9 | `eslint.config.mjs` (flat config) |
| **TypeScript** | 5 | `tsconfig.json` (strict mode) |

### ESLint Plugins

- `eslint-config-next/core-web-vitals` - Performance rules
- `eslint-config-next/typescript` - TypeScript rules

### Ignored Paths

- `.next/` - Build artifacts
- `out/` - Static export output
- `build/` - Alternative build output
- `next-env.d.ts` - Generated types

## Fonts

- **Geist Sans** - Primary font (via `next/font/google`)
- **Geist Mono** - Monospace font

## Runtime Environment

| Environment | Value |
|-------------|-------|
| **Client-Side** | Yes (`'use client'` directives) |
| **Server-Side** | No (static export) |
| **Deployment** | GitHub Pages |
| **CDN** | GitHub Pages CDN |

## File Extensions

| Extension | Usage |
|-----------|-------|
| `.tsx` | React components with TypeScript |
| `.ts` | TypeScript utilities/config |
| `.css` | Global styles |
| `.json` | Data files |
| `.svg` | Map assets |
| `.mjs` | ES module configs (PostCSS, ESLint) |
