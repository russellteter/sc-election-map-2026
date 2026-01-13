# Coding Conventions - SC Election Map 2026

> Generated: 2026-01-12 | GSD Codebase Mapping

## TypeScript Patterns

### Configuration

```json
// tsconfig.json
{
  "strict": true,              // Strict mode enabled
  "target": "ES2017",          // Target ES2017
  "jsx": "react-jsx",          // React 19 automatic runtime
  "moduleResolution": "bundler",
  "paths": { "@/*": ["./src/*"] }  // Path alias
}
```

### Type Definitions

**Preference:** Interfaces for props and data models

```typescript
// Component props
interface ChamberToggleProps {
  chamber: 'house' | 'senate';
  onChange: (chamber: 'house' | 'senate') => void;
}

// Data models
interface Candidate {
  name: string;
  party: string | null;
  status: string;
  filedDate: string | null;
  ethicsUrl: string | null;
  reportId: string;
  source: string;
}

interface District {
  districtNumber: number;
  candidates: Candidate[];
}
```

## Component Patterns

### Function Component Structure

```typescript
'use client';  // Client directive at top

import { useState, useEffect } from 'react';

// Props interface
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// Component definition
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks at top
  const [state, setState] = useState<Type>(initial);
  const ref = useRef<HTMLDivElement>(null);

  // 2. Effects
  useEffect(() => {
    // Side effect logic
  }, [dependencies]);

  // 3. Callbacks
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);

  // 4. Memoized values
  const processed = useMemo(() => {
    // Expensive computation
  }, [dependencies]);

  // 5. Early returns (loading, error)
  if (isLoading) return <div>Loading...</div>;

  // 6. Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}

// Helper functions at bottom
function helperFunction(): Type {
  // logic
}
```

### Export Pattern

- **Default exports** for components
- Named helper functions stay in same file

## Naming Conventions

### Files & Directories

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DistrictMap.tsx` |
| Directories | PascalCase | `Dashboard/`, `Map/` |
| Data files | kebab-case | `candidates.json` |
| Config files | kebab-case | `next.config.ts` |

### Variables

| Type | Convention | Example |
|------|------------|---------|
| State | camelCase | `selectedDistrict` |
| Boolean | `is*`, `has*` | `isLoading`, `hasDemocrat` |
| Arrays | plural | `candidates`, `paths` |
| Handlers | `handle*` | `handleClick` |
| Callbacks | `on*` | `onDistrictClick` |

### Functions

| Type | Convention | Example |
|------|------------|---------|
| Getters | `get*` | `getDistrictColor()` |
| Calculators | `calculate*` | `calculateStats()` |
| Handlers | `handle*` | `handleMouseMove()` |

## Import Organization

```typescript
// 1. Client directive
'use client';

// 2. React imports
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// 3. Local components (@ alias)
import DistrictMap from '@/components/Map/DistrictMap';
import Legend from '@/components/Map/Legend';
import SidePanel from '@/components/Dashboard/SidePanel';

// 4. Types/interfaces defined inline (not imported)
```

**Notes:**
- Always use `@/` path alias
- No external utility libraries (no lodash, classnames)
- Standard React hooks only

## Styling Conventions

### Tailwind CSS

```typescript
// Inline className with utilities
className="flex flex-col lg:flex-row gap-4"

// Conditional classes with template literals
className={`px-4 py-2 text-sm font-medium rounded-md ${
  isActive
    ? 'bg-white text-gray-900 shadow'
    : 'text-gray-600 hover:text-gray-900'
}`}

// Responsive: mobile-first
className="w-full lg:w-96"
className="grid grid-cols-2 sm:grid-cols-4"
```

### CSS Variables (Design Tokens)

```css
/* Colors */
--class-purple: #4739E7;
--class-purple-light: #DAD7FA;
--text-color: #0A1849;

/* Spacing */
--space-1: 2px;
--space-2: 4px;
--space-3: 8px;
--space-4: 12px;
--space-5: 16px;

/* Typography */
--font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;
--font-size-base: 1rem;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
```

### CSS Classes

```css
/* Component classes */
.kpi-card { }
.badge { }
.badge-democrat { }
.badge-republican { }
.chamber-toggle { }
.glass-surface { }

/* Section comments */
/* ================================================
   GLASSMORPHIC DESIGN SYSTEM TOKENS
   ================================================ */
```

## Comment Style

### Minimal Inline Comments

```typescript
// Parse the SVG and add fill colors to each path
const parser = new DOMParser();

// Make SVG responsive
svg.setAttribute('width', '100%');

// Process all district paths
paths.forEach(path => {
  // Apply fill color directly to SVG string
  path.setAttribute('fill', color);
});
```

### CSS Section Comments

```css
/* ================================================
   PRIMARY COLORS
   ================================================ */

/* SVG Map Styles */
/* NOTE: Do NOT set fill here - JavaScript sets fill colors dynamically */
```

## State Management

### Pattern: Prop Drilling

```typescript
// Parent (page.tsx)
const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

// Pass down
<DistrictMap
  selectedDistrict={selectedDistrict}
  onDistrictClick={setSelectedDistrict}
/>
```

**No Context API** - app is simple enough for props

## Event Handling

### Event Delegation Pattern

```typescript
// Container handles all path events
const handleClick = useCallback((e: React.MouseEvent) => {
  const target = e.target as Element;
  const path = target.closest('path[data-district]');
  if (path) {
    const districtNum = parseInt(path.getAttribute('data-district') || '0', 10);
    if (districtNum > 0) {
      onDistrictClick(districtNum);
    }
  }
}, [onDistrictClick]);

return (
  <div onClick={handleClick}>
    {/* SVG content */}
  </div>
);
```

## Data Handling

### Nullable Fields

```typescript
interface Candidate {
  party: string | null;      // May be unknown
  filedDate: string | null;  // May not be set
  ethicsUrl: string | null;  // May not have URL
}
```

### Conditional Rendering

```typescript
// Party badge
{candidate.party ? (
  <span className={`badge badge-${partyClass}`}>{candidate.party}</span>
) : (
  <span className="badge badge-unknown">Unknown</span>
)}

// Date formatting
{candidate.filedDate && (
  <span>{new Date(candidate.filedDate).toLocaleDateString()}</span>
)}
```

## Accessibility Patterns

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .kpi-card::before { transition: none; }
  .animate-count { animation: none; }
}
```

### ARIA Labels

```tsx
<button
  onClick={() => onChange('house')}
  aria-pressed={chamber === 'house'}
>
  House
</button>

<button
  onClick={onClose}
  aria-label="Close panel"
>
  ×
</button>
```

## Summary Checklist

- [ ] TypeScript strict mode enabled
- [ ] Interfaces for all props
- [ ] PascalCase component files
- [ ] camelCase variables
- [ ] `@/` path alias for imports
- [ ] Tailwind for styling
- [ ] CSS variables for design tokens
- [ ] Minimal comments (code is self-documenting)
- [ ] Event delegation for SVG
- [ ] useCallback/useMemo for performance
- [ ] Nullable types handled explicitly
