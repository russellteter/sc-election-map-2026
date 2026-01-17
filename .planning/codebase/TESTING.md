# Testing Patterns

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## Test Framework

**Unit Testing:**
- Jest 30.2.0
- Config: `jest.config.js` in project root
- ts-jest 29.4.6 for TypeScript support

**E2E Testing:**
- Playwright 1.57.0
- Config: `playwright.config.ts` in project root

**Assertion Library:**
- Jest built-in expect
- @testing-library/jest-dom 6.9.1 for DOM matchers
- Matchers: toBe, toEqual, toBeInTheDocument, toHaveAttribute

**Run Commands:**
```bash
npm test                              # Run all unit tests
npm run test:watch                    # Watch mode
npm test -- path/to/file.test.ts     # Single file
npm run test:coverage                 # Coverage report
npm run test:e2e                      # Run Playwright E2E tests
npm run test:e2e:ui                   # Playwright UI mode
```

## Test File Organization

**Location:**
- Unit tests: `__tests__/` directory or alongside source files
- E2E tests: `e2e/` or `tests/` directory
- Test utilities: `tests/` or `__tests__/utils/`

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.e2e.test.ts` or `*.spec.ts`
- Test files mirror source file names

**Structure:**
```
src/
├── lib/
│   ├── dataLoader.ts
│   └── dataLoader.test.ts (optional colocation)
├── components/
│   └── VoterGuide/
│       └── AddressAutocomplete.tsx
__tests__/
├── lib/
│   └── dataLoader.test.ts
├── components/
│   └── VoterGuide/
│       └── AddressAutocomplete.test.tsx
e2e/
└── voter-guide.e2e.test.ts
```

## Test Structure

**Suite Organization:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/ComponentName';

describe('ComponentName', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<ComponentName />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();

      render(<ComponentName onClick={onClick} />);
      await user.click(screen.getByRole('button'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

**Patterns:**
- Use describe blocks to group related tests
- beforeEach for shared setup
- afterEach for cleanup (restore mocks)
- One assertion focus per test

## Testing Library Patterns

**React Component Testing:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should allow user input', async () => {
  const user = userEvent.setup();
  render(<AddressAutocomplete onSelect={jest.fn()} />);

  const input = screen.getByRole('combobox');
  await user.type(input, '123 Main St');

  expect(input).toHaveValue('123 Main St');
});
```

**Query Priority (Testing Library):**
1. getByRole - Preferred (accessibility)
2. getByLabelText - Form inputs
3. getByPlaceholderText - Inputs without labels
4. getByText - Static text content
5. getByTestId - Last resort

## Mocking

**Framework:**
- Jest built-in mocking
- jest.mock() for module mocking
- jest.fn() for function spies

**Patterns:**
```typescript
// Mock module
jest.mock('@/lib/geocoding', () => ({
  geocodeAddress: jest.fn()
}));

// Mock in test
import { geocodeAddress } from '@/lib/geocoding';

const mockGeocode = geocodeAddress as jest.MockedFunction<typeof geocodeAddress>;

it('handles geocoding', async () => {
  mockGeocode.mockResolvedValue({
    lat: 34.0,
    lon: -81.0,
    address: '123 Main St'
  });

  // Test code

  expect(mockGeocode).toHaveBeenCalledWith('123 Main St');
});
```

**What to Mock:**
- External API calls (Geoapify, Nominatim)
- fetch/network requests
- Browser APIs (geolocation, localStorage)
- Time-dependent functions (Date, setTimeout)

**What NOT to Mock:**
- Internal pure functions
- React hooks (test through component behavior)
- Simple utility functions

## Fixtures and Factories

**Test Data:**
```typescript
// Factory function
function createTestCandidate(overrides?: Partial<Candidate>): Candidate {
  return {
    id: 'test-id',
    name: 'Test Candidate',
    party: 'Democrat',
    office: 'State House',
    district: 'HD-1',
    ...overrides
  };
}

// Usage
const candidate = createTestCandidate({ name: 'Jane Doe' });
```

**Location:**
- Factory functions: In test file or `__tests__/factories/`
- Shared fixtures: `__tests__/fixtures/`
- Mock data: Inline when simple, factory when complex

## Coverage

**Requirements:**
- No enforced coverage target
- Coverage tracked for awareness
- Focus on critical paths (geocoding, district lookup, data loading)

**Configuration:**
- Jest coverage via `--coverage` flag
- Excludes: config files, type definitions

**View Coverage:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Test Types

**Unit Tests:**
- Scope: Single function/component in isolation
- Mocking: Mock all external dependencies
- Speed: Each test <100ms
- Examples: dataLoader functions, geocoding utilities

**Integration Tests:**
- Scope: Multiple modules together
- Mocking: Mock only external boundaries (APIs)
- Examples: Voter guide flow with mocked API responses

**E2E Tests (Playwright):**
- Scope: Full user flows in browser
- Mocking: None (or mock network at Playwright level)
- Location: `e2e/` directory
- Examples: Complete voter guide address-to-ballot flow

## Playwright E2E Patterns

**Basic Test:**
```typescript
import { test, expect } from '@playwright/test';

test('voter guide address flow', async ({ page }) => {
  await page.goto('/voter-guide');

  const input = page.getByRole('combobox');
  await input.fill('123 Main St, Columbia, SC');

  // Wait for suggestions
  await expect(page.getByRole('listbox')).toBeVisible();

  // Select first suggestion
  await page.getByRole('option').first().click();

  // Verify district display
  await expect(page.getByText('Your Districts')).toBeVisible();
});
```

**Configuration:**
```typescript
// playwright.config.ts
export default {
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  use: {
    trace: 'on-first-retry',
  },
};
```

## Common Patterns

**Async Testing:**
```typescript
it('should load data asynchronously', async () => {
  render(<Component />);

  // Wait for async content
  await screen.findByText('Loaded');

  expect(screen.getByText('Loaded')).toBeInTheDocument();
});
```

**Error Testing:**
```typescript
it('should handle errors gracefully', async () => {
  mockFetch.mockRejectedValue(new Error('Network error'));

  render(<Component />);

  await screen.findByText('Error loading data');
  expect(screen.getByRole('alert')).toBeInTheDocument();
});
```

**Timer Testing:**
```typescript
it('should debounce input', async () => {
  jest.useFakeTimers();

  render(<AddressAutocomplete />);
  await userEvent.type(screen.getByRole('combobox'), 'test');

  // Fast-forward debounce timer
  jest.advanceTimersByTime(300);

  expect(mockGeocode).toHaveBeenCalled();

  jest.useRealTimers();
});
```

---

*Testing analysis: 2026-01-17*
*Update when test patterns change*
