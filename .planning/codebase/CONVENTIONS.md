# Coding Conventions

**Analysis Date:** 2026-01-17
**Focus:** SC Voter Guide System

## Naming Patterns

**Files:**
- `kebab-case.ts` for utility modules (data-loader.ts, district-lookup.ts)
- `PascalCase.tsx` for React components (AddressAutocomplete.tsx, RaceCard.tsx)
- `*.test.ts` or `*.test.tsx` for test files
- `index.ts` for barrel exports

**Functions:**
- camelCase for all functions (findDistricts, loadTier1, geocodeAddress)
- No special prefix for async functions
- handleEventName for event handlers (handleAddressSelect, handleSubmit)

**Variables:**
- camelCase for variables (selectedAddress, districtBoundaries)
- UPPER_SNAKE_CASE for constants (COUNTY_TO_CD, SC_BOUNDS)
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces, no I prefix (Candidate, District, not ICandidate)
- PascalCase for type aliases (StatewideRace, CountyRace)
- Located in `src/types/schema.ts` (centralized)

## Code Style

**Formatting:**
- No Prettier config (using ESLint only)
- 2 space indentation
- Single quotes for strings
- Semicolons required
- Line length not strictly enforced

**Linting:**
- ESLint 9.x with flat config (`eslint.config.js`)
- extends `eslint-config-next` 16.1.1
- Run: `npm run lint`

**TypeScript:**
- Strict mode enabled
- Explicit return types optional (inferred)
- No `any` without justification

## Import Organization

**Order:**
1. External packages (react, next, @turf/*)
2. Internal absolute imports (@/lib, @/components)
3. Relative imports (./utils, ../types)
4. Type imports (import type { Candidate })

**Grouping:**
- Blank line between groups
- React imports first within external group
- Type-only imports use `import type`

**Path Aliases:**
- `@/` maps to `src/` (via tsconfig paths)
- Used throughout: `@/lib/dataLoader`, `@/components/VoterGuide`

## Component Patterns

**Client Components:**
```typescript
'use client';

import { useState, useEffect } from 'react';

export function ComponentName({ prop1, prop2 }: Props) {
  const [state, setState] = useState<Type>(initial);

  useEffect(() => {
    // effect logic
  }, [dependencies]);

  return <div>...</div>;
}
```

**Props:**
- Destructure in parameter list
- Define Props interface inline or imported
- Use TypeScript for prop types (not PropTypes)

**State Management:**
- useState for component state
- useEffect for side effects
- No global state library (no Redux, Zustand)

## Error Handling

**Patterns:**
- Try/catch for async operations
- Fallback patterns (Geoapify → Nominatim)
- Graceful degradation for missing data

**Error Types:**
- Throw Error with descriptive message
- No custom error classes observed
- Console.error for logging

**Example:**
```typescript
try {
  const result = await geocodeAddress(address);
  return result;
} catch (error) {
  console.error('Geocoding failed:', error);
  // Fallback to alternative
  return await nominatimGeocode(address);
}
```

## Logging

**Framework:**
- Console.log/error/warn (browser console)
- No structured logging library

**Patterns:**
- console.log for debug information
- console.error for error conditions
- No production logging infrastructure

## Comments

**When to Comment:**
- Explain why, not what
- Document business logic (SC bounding box, district mapping)
- TODO comments for incomplete features

**JSDoc/TSDoc:**
- Not consistently used
- Some functions have parameter descriptions
- Types provide most documentation

**TODO Comments:**
- Format: `// TODO: description`
- No issue tracking links observed

## Function Design

**Size:**
- Generally keep under 50 lines
- Extract helpers for complex logic
- Some large page components (voter-guide/page.tsx: 666 lines)

**Parameters:**
- Max 3-4 parameters
- Use options object for complex inputs
- Destructure in parameter list

**Return Values:**
- Explicit return for non-trivial functions
- Return early for guard clauses
- Promise<T> for async functions

## React Patterns

**Hooks:**
```typescript
// State
const [value, setValue] = useState<Type>(initial);

// Effects with cleanup
useEffect(() => {
  const controller = new AbortController();
  fetchData(controller.signal);
  return () => controller.abort();
}, [dependency]);

// Callbacks (memoized when needed)
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);
```

**Conditional Rendering:**
```typescript
{condition && <Component />}
{condition ? <A /> : <B />}
{items.map(item => <Item key={item.id} {...item} />)}
```

**Loading States:**
```typescript
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

## Module Design

**Exports:**
- Named exports preferred
- Default exports for page components (Next.js convention)
- Barrel files (index.ts) for directory re-exports

**File Organization:**
- One component per file
- Related utilities in same file (or separate helper file)
- Types in `src/types/schema.ts` (centralized)

## Accessibility Patterns

**ARIA:**
- aria-label for interactive elements
- aria-expanded for expandable sections
- role attributes where semantic HTML insufficient

**Keyboard:**
- onKeyDown handlers for keyboard navigation
- Focus management in modals/dropdowns
- Tab index management

**Example (AddressAutocomplete):**
```typescript
<input
  type="text"
  role="combobox"
  aria-autocomplete="list"
  aria-expanded={showSuggestions}
  aria-controls="suggestions-list"
  onKeyDown={handleKeyDown}
/>
```

---

*Convention analysis: 2026-01-17*
*Update when patterns change*
