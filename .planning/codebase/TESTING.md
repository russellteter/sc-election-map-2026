# Testing - SC Election Map 2026

> Generated: 2026-01-12 | GSD Codebase Mapping

## Current Status

| Aspect | Status |
|--------|--------|
| **Test Framework** | NOT INSTALLED |
| **Unit Tests** | 0 files |
| **E2E Tests** | 0 files |
| **Test Coverage** | 0% |
| **Target Coverage** | >80% (per QA agent spec) |

## Dependencies (Missing)

```json
// NOT in package.json - needs to be added:
{
  "devDependencies": {
    "jest": "^29",
    "@testing-library/react": "^14",
    "@testing-library/dom": "^9",
    "playwright": "^1.40",
    "@types/jest": "^29"
  }
}
```

## Current Quality Tools

### ESLint (Configured)

```javascript
// eslint.config.mjs
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,    // Core Web Vitals rules
  ...nextTs,        // TypeScript rules
  globalIgnores(['.next/', 'out/', 'build/'])
]);
```

**Run:** `npm run lint`

### TypeScript (Strict Mode)

- Catches type errors at compile time
- Strict null checks enabled
- No implicit any

## Planned Test Architecture

### Test Directory Structure

```
tests/
├── e2e/                      # End-to-end tests
│   ├── map.spec.ts           # Map rendering & interaction
│   ├── sidepanel.spec.ts     # Side panel functionality
│   └── chamber-toggle.spec.ts # Chamber switching
│
├── unit/                     # Unit tests
│   ├── getDistrictColor.test.ts
│   ├── calculateStats.test.ts
│   └── components/
│       ├── Legend.test.tsx
│       └── CandidateCard.test.tsx
│
└── utils/                    # Test utilities
    ├── mockData.ts           # Test fixtures
    └── testHelpers.ts        # Common test functions
```

## Test Suites (Planned)

### 1. SVG Rendering Tests

| Test | Description | Priority |
|------|-------------|----------|
| House SVG loads | All 124 district paths exist | Critical |
| Senate SVG loads | All 46 district paths exist | Critical |
| Path IDs correct | Format `house-{N}`, `senate-{N}` | Critical |
| Colors match data | Blue/red/purple/gray per candidates | Critical |
| No black rendering | Regression test for fixed bug | Critical |

### 2. User Interaction Tests

| Test | Description | Priority |
|------|-------------|----------|
| Click → panel opens | District click shows side panel | High |
| Hover → opacity | Path opacity changes to 0.8 | Medium |
| Leave → restore | Opacity returns to 1.0 | Medium |
| Selected highlight | Blue stroke on selected district | High |
| Close button | Panel closes correctly | High |

### 3. Chamber Toggle Tests

| Test | Description | Priority |
|------|-------------|----------|
| House button | Loads House map (124 paths) | High |
| Senate button | Loads Senate map (46 paths) | High |
| Stats update | Stats reflect current chamber | High |
| Selection clears | Previous selection cleared | Medium |

### 4. Data Integrity Tests

| Test | Description | Priority |
|------|-------------|----------|
| Candidate names | Display correctly | Medium |
| Party badges | Correct colors | Medium |
| Filed dates | Format correctly | Low |
| Ethics links | Valid URLs | Medium |

### 5. Responsive Design Tests

| Test | Description | Priority |
|------|-------------|----------|
| Desktop layout | Map + sidebar side-by-side | Medium |
| Mobile layout | Stacked layout | Medium |
| Touch events | Work on mobile | Medium |

## E2E Testing Plan

### Tool: Playwright MCP

**Testing URL:** `https://russellteter.github.io/sc-election-map-2026/`

```typescript
// Example test structure
import { test, expect } from '@playwright/test';

test.describe('District Map', () => {
  test('should load House map with 124 districts', async ({ page }) => {
    await page.goto('/');

    // Wait for SVG to load
    await page.waitForSelector('svg');

    // Count district paths
    const paths = await page.locator('path[id^="house-"]').count();
    expect(paths).toBe(124);
  });

  test('should color districts based on party', async ({ page }) => {
    await page.goto('/');

    // Check district 113 (known Democrat)
    const district113 = page.locator('path[id="house-113"]');
    const fill = await district113.getAttribute('fill');
    expect(fill).toBe('#3b82f6'); // Blue
  });

  test('should open side panel on district click', async ({ page }) => {
    await page.goto('/');

    // Click district
    await page.locator('path[id="house-113"]').click();

    // Verify side panel shows
    await expect(page.locator('text=House District 113')).toBeVisible();
  });
});
```

### Evidence Requirements

Per QA agent spec, all test results must include:
- Screenshots for visual verification
- Console logs for errors
- DOM state inspection results

## Unit Testing Plan

### Critical Functions to Test

```typescript
// src/components/Map/DistrictMap.tsx:163-187
function getDistrictColor(district: District | undefined): string

// Test cases:
// - undefined district → '#f3f4f6'
// - empty candidates → '#f3f4f6'
// - Democrat only → '#3b82f6'
// - Republican only → '#ef4444'
// - Both parties → '#a855f7'
// - Unknown party → '#9ca3af'
```

```typescript
// src/app/page.tsx (inline)
function calculateStats(data, chamber)

// Test cases:
// - All empty districts → counts all as empty
// - Mixed parties → correct categorization
// - Edge cases: null party, missing candidates array
```

## Accessibility Testing

### Target: WCAG 2.1 AA

| Criterion | Status | Notes |
|-----------|--------|-------|
| 1.1.1 Non-text Content | ❌ | SVG paths need alt text |
| 1.3.1 Info & Relationships | ❌ | ARIA labels missing |
| 1.4.1 Use of Color | ❌ | Color-only info |
| 2.1.1 Keyboard | ❌ | SVG not keyboard accessible |
| 2.4.3 Focus Order | ❌ | Focus not managed |

### Automated Testing

```typescript
// Using axe-core
import { injectAxe, checkA11y } from 'axe-playwright';

test('should pass accessibility audit', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);

  const results = await checkA11y(page);
  expect(results.violations).toHaveLength(0);
});
```

## Performance Testing

### Lighthouse Targets

| Metric | Target | Current |
|--------|--------|---------|
| Performance | >90 | TBD |
| Accessibility | >95 | TBD |
| Best Practices | >90 | TBD |
| SEO | >90 | TBD |

### Core Web Vitals

| Metric | Target | Current |
|--------|--------|---------|
| LCP | <2.5s | TBD |
| FID | <100ms | TBD |
| CLS | <0.1 | TBD |

## Continuous Integration

### Planned GitHub Action

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm test

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
```

## Implementation Priority

1. **Install test dependencies** - Jest, Testing Library, Playwright
2. **Create test structure** - Directory setup, config files
3. **Unit tests** - `getDistrictColor`, `calculateStats`
4. **E2E tests** - Map loading, interactions
5. **Accessibility tests** - axe-core integration
6. **CI integration** - GitHub Actions workflow
7. **Performance tests** - Lighthouse CI

## Success Criteria

| Metric | Target |
|--------|--------|
| Test coverage | >80% |
| All E2E tests pass | 100% |
| Accessibility violations | 0 critical |
| Lighthouse Performance | >90 |
| Lighthouse Accessibility | >95 |
