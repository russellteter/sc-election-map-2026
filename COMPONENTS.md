# Component Documentation

Comprehensive guide to all React components in the SC 2026 Election Map application.

---

## Table of Contents

1. [Map Components](#map-components)
2. [Dashboard Components](#dashboard-components)
3. [Layout Components](#layout-components)
4. [Chart Components](#chart-components)
5. [Props Reference](#props-reference)
6. [Hook Usage](#hook-usage)
7. [Performance Considerations](#performance-considerations)

---

## Map Components

### DistrictMap.tsx

**Location:** `src/components/Map/DistrictMap.tsx`

**Purpose:** Interactive SVG-based map showing SC House (124) or Senate (46) districts with click, hover, and keyboard navigation.

**Key Features:**
- Event delegation for performance (single handler for all districts)
- Dynamic SVG processing (applies colors before render to avoid flickering)
- Accessibility (ARIA labels, keyboard navigation)
- Responsive event handling (useMemo, useCallback hooks)

**Props:**
```typescript
interface DistrictMapProps {
  chamber: 'house' | 'senate';             // Current chamber
  candidatesData: CandidatesData;          // All candidate data
  selectedDistrict: number | null;         // Currently selected district
  onDistrictClick: (districtNumber: number) => void;
  onDistrictHover: (districtNumber: number | null) => void;
  filteredDistricts?: Set<number>;         // Optional: districts to highlight
}
```

**State:**
- `rawSvgContent: string` - Raw SVG loaded from `/maps/{chamber}-districts.svg`
- `justSelected: number | null` - Triggers selection animation (400ms)
- `hoveredDistrict: number | null` - Currently hovered district for tooltip
- `mousePosition: { x, y } | null` - Mouse coordinates for tooltip positioning

**Performance Optimizations:**
1. **useMemo for SVG processing** - Recalculates only when dependencies change:
   ```typescript
   const processedSvgContent = useMemo(() => {
     // Parse SVG, apply fills, add event handlers
   }, [rawSvgContent, chamber, candidatesData, selectedDistrict, filteredDistricts, justSelected]);
   ```

2. **Event Delegation** - Single click/hover handler instead of per-path listeners:
   ```typescript
   const handleClick = useCallback((e: React.MouseEvent) => {
     const path = e.target.closest('path[data-district]');
     if (path) {
       const districtNum = parseInt(path.getAttribute('data-district'), 10);
       onDistrictClick(districtNum);
     }
   }, [onDistrictClick]);
   ```

3. **Animation Cleanup** - Auto-removes animation class after 400ms:
   ```typescript
   useEffect(() => {
     if (selectedDistrict !== null) {
       setJustSelected(selectedDistrict);
       const timer = setTimeout(() => setJustSelected(null), 400);
       return () => clearTimeout(timer);
     }
   }, [selectedDistrict]);
   ```

**Color Coding Logic:**
```typescript
function getDistrictColor(district: District | undefined): string {
  if (!district || district.candidates.length === 0) {
    return '#f3f4f6'; // gray-100 - no candidates
  }

  const hasDemocrat = district.candidates.some(
    (c) => c.party?.toLowerCase() === 'democratic'
  );

  if (hasDemocrat) {
    return '#4739E7'; // class-purple - Democrat
  } else {
    return '#9ca3af'; // gray-400 - unknown (includes Republicans)
  }
}
```

**Accessibility Features:**
- `tabindex="0"` on all district paths
- `role="button"` for semantic meaning
- `aria-label` with district info: "House District 113: 1 candidate, Democratic"
- `aria-pressed` for selected state
- Keyboard handlers: Enter and Space to select

**Usage Example:**
```typescript
<DistrictMap
  chamber="house"
  candidatesData={allData}
  selectedDistrict={selectedDistrict}
  onDistrictClick={(num) => setSelectedDistrict(num)}
  onDistrictHover={(num) => setHoveredDistrict(num)}
/>
```

---

### MapTooltip.tsx

**Location:** `src/components/Map/MapTooltip.tsx`

**Purpose:** Glassmorphic tooltip that follows the cursor when hovering over districts.

**Key Features:**
- Cursor-following with viewport boundary detection
- requestAnimationFrame for smooth position updates
- Glassmorphic styling with backdrop blur
- `pointer-events: none` to avoid interfering with mouse events

**Props:**
```typescript
interface MapTooltipProps {
  district: District | null;              // Currently hovered district
  chamber: 'house' | 'senate';            // Current chamber
  mousePosition: { x: number; y: number } | null;
}
```

**State:**
- `position: { x, y }` - Tooltip position (offset from cursor)
- `tooltipRef` - Ref to measure tooltip dimensions
- `rafRef` - requestAnimationFrame ID for cleanup

**Position Calculation:**
```typescript
useEffect(() => {
  if (!mousePosition || !district) return;

  const updatePosition = () => {
    const offset = 16; // Offset from cursor
    const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 0;

    let x = mousePosition.x + offset;
    let y = mousePosition.y + offset;

    // Keep tooltip within viewport bounds
    if (x + tooltipWidth > window.innerWidth) {
      x = mousePosition.x - tooltipWidth - offset;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = mousePosition.y - tooltipHeight - offset;
    }

    setPosition({ x, y });
  };

  rafRef.current = requestAnimationFrame(updatePosition);

  return () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };
}, [mousePosition, district]);
```

**Content Structure:**
```typescript
<div className="tooltip-header">
  <span className="tooltip-chamber">{chamberLabel}</span>
  <span className="tooltip-district">District {district.districtNumber}</span>
</div>

<div className="tooltip-body">
  <div className="tooltip-candidates">
    {candidateCount > 0 && hasDem && (
      <div className="party-dots">
        <span className="party-dot democrat" title="Democrat running" />
      </div>
    )}
    <span className="candidate-count">{candidateText}</span>
  </div>
  {moreText && <span className="more-text">{moreText}</span>}
</div>
```

**Styling (globals.css lines 823-923):**
- Glassmorphic background: `rgba(255, 255, 255, 0.95)` with `backdrop-filter: blur(10px)`
- Purple border: `1px solid rgba(71, 57, 231, 0.15)`
- Shadow: `0 10px 25px rgba(71, 57, 231, 0.2)`
- Fixed position: `position: fixed; left: ${x}px; top: ${y}px;`

---

## Dashboard Components

### SidePanel.tsx

**Location:** `src/components/Dashboard/SidePanel.tsx`

**Purpose:** Right-side panel displaying detailed district information, compact election history, and candidate cards.

**Key Features:**
- Compact election history (inline pills, sparklines)
- Status badges (contested, party, competitiveness)
- Candidate cards with Ethics filing links
- Responsive layout (collapses on mobile)

**Props:**
```typescript
interface SidePanelProps {
  chamber: 'house' | 'senate';
  district: District | null;               // Selected district
  electionHistory?: DistrictElectionHistory | null;
  onClose: () => void;
}
```

**Empty State (lines 14-49):**
```typescript
if (!district) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center animate-entrance">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full"
          style={{ background: 'var(--class-purple-bg)' }}>
          <MapIcon />
        </div>
        <p className="text-lg font-semibold">Select a District</p>
        <p className="text-sm">Click on a district to see candidates</p>
      </div>
    </div>
  );
}
```

**Header Section (lines 59-98):**
- District number and chamber label
- Candidate count
- Close button with hover effect
- Glassmorphic gradient background

**Status Badges (lines 100-128):**
- Contested Race (both parties)
- Democrat/Republican Running
- Party Unknown
- Competitive (score >= 60)

**Compact Election History (lines 131-264):**

Key sections:
1. **Section Label** - "History" in 10px uppercase
2. **Election Pills** - Horizontal flex container with 2024, 2022, 2020
3. **Sparkline** - Canvas-based trend visualization (36x14px)
4. **Competitiveness Score** - Color-coded number (0-100)
5. **SWING Badge** - Green badge if district has flipped parties

Pill format: `[PartyLetter±Margin]` or `[PartyLetterUC]`
- D+3 - Democrat won by 3 points
- R+12 - Republican won by 12 points
- DUC - Democrat Uncontested

**Candidate List (lines 267-312):**
```typescript
<div className="flex-1 overflow-y-auto" style={{ padding: 'var(--space-4)' }}>
  {district.candidates.length === 0 ? (
    <EmptyState />
  ) : (
    <div className="space-y-3">
      {district.candidates.map((candidate, index) => (
        <CandidateCard key={candidate.reportId} candidate={candidate} index={index} />
      ))}
    </div>
  )}
</div>
```

---

### CandidateCard.tsx

**Location:** `src/components/Dashboard/CandidateCard.tsx`

**Purpose:** Individual candidate display with name, party badge, incumbent status, and Ethics filing link.

**Props:**
```typescript
interface CandidateCardProps {
  candidate: Candidate;
  index: number;                           // For stagger animation
}
```

**Structure:**
```typescript
<div className="candidate-card animate-entrance" style={{ animationDelay: `${index * 50}ms` }}>
  <div className="candidate-header">
    <h3 className="candidate-name">{candidate.name}</h3>
    <div className="candidate-badges">
      {candidate.party && <Badge party={candidate.party} />}
      {candidate.isIncumbent && <Badge text="Incumbent" />}
    </div>
  </div>

  <div className="candidate-details">
    <p className="filing-date">Filed: {formatDate(candidate.filedDate)}</p>
    {candidate.ethicsUrl && (
      <a href={candidate.ethicsUrl} target="_blank" className="ethics-link">
        View Ethics Filing →
      </a>
    )}
  </div>
</div>
```

**Badge Logic:**
```typescript
function getBadgeColor(party: string): string {
  const partyLower = party.toLowerCase();
  if (partyLower.includes('democrat')) return 'var(--class-purple)';
  if (partyLower.includes('republican')) return 'var(--color-at-risk)';
  return 'var(--text-muted)';
}
```

---

### MetricCard.tsx

**Location:** `src/components/Dashboard/MetricCard.tsx`

**Purpose:** KPI stat card with animated number counter (glassmorphic style).

**Props:**
```typescript
interface MetricCardProps {
  label: string;                           // e.g., "Democrats"
  value: number;                           // e.g., 40
  color?: string;                          // Badge color (optional)
  trend?: { value: number; direction: 'up' | 'down' };
}
```

**Animated Counter:**
Uses `data-animate-value` attribute and JavaScript utility (globals.css lines 401-445) to animate from 0 to target value on page load.

```typescript
<div className="kpi-card">
  <div className="label">{label}</div>
  <div className="value" data-animate-value={value} data-duration="1500">
    {value}
  </div>
  {trend && (
    <div className="subvalue">
      {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
    </div>
  )}
</div>
```

---

## Layout Components

### Header.tsx

**Location:** `src/components/Layout/Header.tsx`

**Purpose:** Top navigation with title, chamber toggle, and metric cards.

**Structure:**
```typescript
<header className="glass-surface">
  <div className="header-content">
    <h1 className="title">SC 2026 Election Map</h1>

    <ChamberToggle
      current={chamber}
      onChange={(newChamber) => setChamber(newChamber)}
    />

    <div className="metrics">
      <MetricCard label="Democrats" value={demCount} />
      <MetricCard label="Republicans" value={repCount} />
      <MetricCard label="Unknown" value={unknownCount} />
      <MetricCard label="Empty" value={emptyCount} />
    </div>
  </div>
</header>
```

---

### Legend.tsx

**Location:** `src/components/Layout/Legend.tsx`

**Purpose:** Color-coded map legend explaining district colors.

**Structure:**
```typescript
<div className="legend">
  <div className="legend-item">
    <span className="legend-dot" style={{ background: '#4739E7' }} />
    <span className="legend-label">Democrat(s) running</span>
  </div>
  <div className="legend-item">
    <span className="legend-dot" style={{ background: '#DC2626' }} />
    <span className="legend-label">Republican(s) only</span>
  </div>
  <div className="legend-item">
    <span className="legend-dot" style={{ background: '#FFBA00' }} />
    <span className="legend-label">Party unknown</span>
  </div>
  <div className="legend-item">
    <span className="legend-dot" style={{ background: '#F3F4F6' }} />
    <span className="legend-label">No candidates</span>
  </div>
</div>
```

---

## Chart Components

### Sparkline.tsx

**Location:** `src/components/Charts/Sparkline.tsx`

**Purpose:** Mini canvas-based trend visualization for election margins.

**Props:**
```typescript
interface SparklineProps {
  values: number[];                        // Data points (e.g., [10, 15, 12])
  trendPercent: number;                    // Trend percentage for color
  width?: number;                          // Default: 48px
  height?: number;                         // Default: 16px
  className?: string;
}
```

**Rendering Logic:**
1. **Canvas Setup:**
   ```typescript
   const dpr = window.devicePixelRatio || 1;
   canvas.width = width * dpr;
   canvas.height = height * dpr;
   ctx.scale(dpr, dpr);
   ```

2. **Color Selection:**
   ```typescript
   const color = trendPercent > 20 ? '#059669'  // Green - improving
               : trendPercent < -20 ? '#DC2626'  // Red - declining
               : '#D97706';                      // Amber - neutral
   ```

3. **Normalization:**
   ```typescript
   const max = Math.max(...values);
   const min = Math.min(...values);
   const range = max - min || 1;
   ```

4. **Line Drawing:**
   ```typescript
   const stepX = width / (values.length - 1);
   values.forEach((val, i) => {
     const x = i * stepX;
     const y = height - ((val - min) / range) * (height - 4) - 2;
     if (i === 0) ctx.moveTo(x, y);
     else ctx.lineTo(x, y);
   });
   ctx.stroke();
   ```

5. **Endpoint Dot:**
   ```typescript
   const lastY = height - ((values[values.length - 1] - min) / range) * (height - 4) - 2;
   ctx.arc(width - 1, lastY, 2.5, 0, Math.PI * 2);
   ctx.fill();
   ```

**Performance:**
- `useEffect` with dependency array prevents unnecessary re-renders
- Canvas API for hardware-accelerated rendering
- Respects `prefers-reduced-motion` (returns null if insufficient data)

---

## VoterGuide Components

### Core Components

#### AddressAutocomplete

**Location:** `src/components/VoterGuide/AddressAutocomplete.tsx` (17.6KB)

**Purpose:** Address search with Geoapify geocoding API integration. Features debounced search, geolocation support, and lazy GeoJSON loading.

**Props:**
```typescript
interface AddressAutocompleteProps {
  onAddressSelect: (suggestion: GeocodeSuggestion) => void;  // Callback when address is selected
  onGeolocationRequest: () => void;                           // Callback for geolocation button
  isLoading: boolean;                                         // Loading state for search
  isGeolocating: boolean;                                     // Loading state for geolocation
}
```

**Key Features:**
- **Debounced search** (300ms) - Reduces API calls during typing
- **GeoJSON lazy loading on focus** - Defers 2MB boundary loading until needed
- **Geolocation support** - Browser geolocation API integration
- **Responsive dropdown** with max-height and proper scrolling
- **Keyboard navigation** - Arrow keys, Enter, Escape support
- **Touch targets** - 44x44px minimum for mobile (WCAG AA)

**State:**
```typescript
const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [selectedIndex, setSelectedIndex] = useState(-1);
```

**Performance:**
- Debounced API calls prevent request spam
- GeoJSON preloading triggered on first focus (not on mount)
- Dropdown virtualizes long suggestion lists

---

#### DistrictResults

**Location:** `src/components/VoterGuide/DistrictResults.tsx` (9.7KB)

**Purpose:** Display found districts after address lookup with visual district cards.

**Props:**
```typescript
interface DistrictResultsProps {
  houseDistrict?: number;           // SC House district number (1-124)
  senateDistrict?: number;          // SC Senate district number (1-46)
  congressionalDistrict?: number;   // US House district number (1-7)
  countyName?: string;              // County name for county offices
}
```

**Features:**
- Glassmorphic district cards with gradient backgrounds
- Animated entrance on mount
- Links to detailed race pages
- Responsive grid (1 column mobile, 2-3 columns desktop)

---

### Race Display Components (Lazy Loaded)

#### StatewideRaces

**Location:** `src/components/VoterGuide/StatewideRaces.tsx` (5.6KB)

**Purpose:** Display statewide races (Governor, Lt. Governor, Attorney General, etc.)

**Data Source:** `/data/statewide-races.json` (2.8KB)

**Loading:** Tier 1 (immediate on page load)

**Features:**
- 8 statewide offices with candidate cards
- Party badges with color coding
- Incumbent indicators
- Responsive grid (1 column → 2 columns → 3 columns)

**Races Displayed:**
- Governor
- Lieutenant Governor
- Attorney General
- Secretary of State
- State Treasurer
- Comptroller General
- Superintendent of Education
- Commissioner of Agriculture

---

#### CongressionalRaces

**Location:** `src/components/VoterGuide/CongressionalRaces.tsx` (13.6KB)

**Purpose:** Display US House representative race for user's congressional district.

**Data Source:** `/data/congress-candidates.json` (1.8KB)

**Loading:** Tier 2 (after district lookup)

**Features:**
- Filters to show only user's district (1-7)
- Candidate photos and bios
- Party affiliation badges
- Incumbent status
- Campaign website links

---

#### JudicialRaces

**Location:** `src/components/VoterGuide/JudicialRaces.tsx` (13.3KB)

**Purpose:** Circuit Court and Family Court judge elections by circuit.

**Data Source:** `/data/judicial-races.json` (7.2KB)

**Loading:** Tier 3 (lazy load on scroll via Intersection Observer)

**Features:**
- Organized by judicial circuit (1-16)
- Circuit Court and Family Court judges
- Years of experience displayed
- Incumbent indicators
- Bar association ratings (if available)

**Performance:**
- Uses `useIntersectionObserver` hook
- Loads only when scrolled into viewport (rootMargin: '500px')
- Freezes visibility state after first load

---

#### SchoolBoardRaces

**Location:** `src/components/VoterGuide/SchoolBoardRaces.tsx` (11.6KB)

**Purpose:** Local school board elections by district.

**Data Source:** `/data/school-board.json` (4.2KB)

**Loading:** Tier 3 (lazy load on scroll)

**Features:**
- Major SC school districts (Greenville, Charleston, Richland, etc.)
- Organized by school district area
- Candidate backgrounds and education focus
- Term lengths displayed
- Touch-optimized cards (44x44px minimum targets)

**Coverage Districts:**
- Greenville County Schools
- Charleston County School District
- Richland School District One & Two
- Lexington County Schools
- Horry County Schools
- And others

---

#### SpecialDistricts

**Location:** `src/components/VoterGuide/SpecialDistricts.tsx` (16KB)

**Purpose:** Special district board elections (Soil & Water, Hospital District, Fire District).

**Data Source:** `/data/special-districts.json` (13KB)

**Loading:** Tier 3 (lazy load on scroll)

**Features:**
- Soil & Water Conservation Districts
- Hospital District boards
- Fire District boards
- Water & Sewer boards
- Organized by county
- Board responsibilities explained

**District Types:**
- Soil & Water Conservation (all 46 counties)
- Regional Hospital Districts
- Fire Protection Districts
- Water & Sewer Authorities

---

#### BallotMeasures

**Location:** `src/components/VoterGuide/BallotMeasures.tsx` (13.7KB)

**Purpose:** Constitutional amendments and local referendums with analysis.

**Data Source:** `/data/ballot-measures.json` (5.5KB)

**Loading:** Tier 3 (lazy load on scroll)

**Features:**
- Plain language summaries
- Pro/con arguments displayed side-by-side
- Impact analysis
- Current status (proposed, on ballot, etc.)
- Collapsible full text
- Mobile-responsive (stacks pro/con on mobile)

**Measure Types:**
- Constitutional Amendments
- Local Referendums
- Bond Issues
- Tax Measures

---

#### CountyRaces

**Location:** `src/components/VoterGuide/CountyRaces.tsx` (9.9KB)

**Purpose:** County office races (Sheriff, Treasurer, Auditor, County Council).

**Data Source:** `/data/county-races.json` (16KB)

**Loading:** Tier 2 (after district lookup)

**Features:**
- Filtered by user's county
- All county constitutional offices
- County Council districts
- Incumbent indicators
- Salary information (if applicable)
- Term lengths

**Offices Covered:**
- Sheriff
- Treasurer
- Auditor
- Clerk of Court
- Coroner
- Probate Judge
- County Council (by district)

---

#### VoterResources

**Location:** `src/components/VoterGuide/VoterResources.tsx` (14KB)

**Purpose:** Voter registration, polling locations, absentee voting information.

**Loading:** Tier 3 (lazy load on scroll)

**Features:**
- Voter registration status check link
- Polling location finder
- Absentee voting instructions
- Important election dates
- Voter ID requirements
- Accessibility accommodations

**Resources:**
- SC Election Commission links
- County election office contacts
- Voter registration forms
- Absentee ballot request forms
- Polling place accessibility information

---

### Loading States

#### SkeletonLoaders

**Location:** `src/components/VoterGuide/SkeletonLoaders.tsx` (6.2KB)

**Purpose:** Loading placeholders for voter guide components during data fetch.

**Exports:**
```typescript
export const RaceCardSkeleton: React.FC
export const SectionHeaderSkeleton: React.FC
export const StatewideRacesSkeleton: React.FC
export const CongressionalRacesSkeleton: React.FC
export const TimelineSkeleton: React.FC
export const VoterResourcesSkeleton: React.FC
export const KPISummarySkeleton: React.FC
export const VoterGuidePageSkeleton: React.FC
```

**Features:**
- Animated shimmer effect using CSS
- Matches actual component dimensions
- Used as `loading` prop in `next/dynamic` imports
- Glassmorphic styling consistent with design system

**Usage Example:**
```typescript
export const StatewideRaces = dynamic(() => import('./StatewideRaces'), {
  loading: () => <StatewideRacesSkeleton />,
  ssr: false
});
```

---

## Props Reference

### Common Pattern: Callback Props

Most components use callback props for state management:

```typescript
// Preferred pattern
interface ComponentProps {
  onSomethingHappened: (value: Type) => void;  // Clear action
}

// Avoid
interface ComponentProps {
  handleSomething: (value: Type) => void;       // Less clear
}
```

### State Lifting Pattern

State lives in parent component (`page.tsx`), passed down as props:

```typescript
// page.tsx
const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

// Pass to child
<DistrictMap
  selectedDistrict={selectedDistrict}
  onDistrictClick={(num) => setSelectedDistrict(num)}
/>
```

---

## Hook Usage

### Performance Hooks

**useMemo:** Expensive computations
```typescript
const processedSvgContent = useMemo(() => {
  // Parse and process SVG (expensive)
  return parsedSvg;
}, [dependencies]);
```

**useCallback:** Stable function references
```typescript
const handleClick = useCallback((e: React.MouseEvent) => {
  // Event handler
}, [dependencies]);
```

**useRef:** DOM references and mutable values
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);
const rafRef = useRef<number | undefined>(undefined);
```

### Effect Cleanup

Always clean up side effects:

```typescript
useEffect(() => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);  // Cleanup
}, [dependencies]);
```

### useIntersectionObserver Hook

**Location:** `src/hooks/useIntersectionObserver.ts`

**Purpose:** Lazy load components when they enter the viewport using Intersection Observer API.

**Signature:**
```typescript
function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options?: {
    rootMargin?: string;        // Distance before element to trigger (default: '500px')
    threshold?: number;          // % of element visible to trigger (default: 0)
    freezeOnceVisible?: boolean; // Don't toggle back to false (default: false)
  }
): boolean  // Returns true when element is visible (or was visible if frozen)
```

**Usage Example:**
```typescript
const judicialRef = useRef<HTMLDivElement>(null);
const isJudicialVisible = useIntersectionObserver(judicialRef, {
  rootMargin: '500px',    // Load 500px before element enters viewport
  freezeOnceVisible: true  // Don't unload once loaded
});

useEffect(() => {
  if (isJudicialVisible && !data) {
    loadJudicialData();  // Fetch data only when scrolled into view
  }
}, [isJudicialVisible]);

return (
  <div ref={judicialRef}>
    {isJudicialVisible ? <JudicialRaces /> : <RaceCardSkeleton />}
  </div>
);
```

**Key Features:**
- **Preloading** - `rootMargin: '500px'` triggers 500px before viewport
- **Freeze state** - `freezeOnceVisible: true` prevents toggle back to invisible
- **Fallback** - Returns `true` if IntersectionObserver not supported
- **Automatic cleanup** - Observer disconnects on unmount

**Performance Benefits:**
- Reduces initial JS bundle by deferring non-critical components
- Saves API calls by only fetching data for visible components
- Improves Time to Interactive (TTI) by prioritizing above-the-fold content

---

## Performance Considerations

### 1. Event Delegation

**Problem:** 170 districts × 2 event listeners = 340 listeners

**Solution:** Single listener on container:
```typescript
<div onClick={handleClick}>
  {/* 170 district paths */}
</div>
```

### 2. Memoization

**Problem:** SVG re-processing on every render

**Solution:** useMemo with dependency array
```typescript
const processedSvg = useMemo(() => processSvg(), [rawSvg, ...deps]);
```

### 3. Animation Throttling

**Problem:** Tooltip position updates on every mousemove (60+ fps)

**Solution:** requestAnimationFrame batches updates:
```typescript
rafRef.current = requestAnimationFrame(updatePosition);
```

### 4. Component Splitting

Large components split into smaller focused components:
- `DistrictMap` → `MapTooltip` (separate concerns)
- `SidePanel` → `CandidateCard` (reusable)

---

## Testing Components

### Unit Testing (Jest/React Testing Library)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import DistrictMap from './DistrictMap';

test('district selection', () => {
  const mockOnClick = jest.fn();
  render(<DistrictMap onDistrictClick={mockOnClick} {...props} />);

  const district = screen.getByRole('button', { name: /District 113/ });
  fireEvent.click(district);

  expect(mockOnClick).toHaveBeenCalledWith(113);
});
```

### E2E Testing (Playwright)

```typescript
test('select district and view details', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.click('#house-113');

  await expect(page.locator('.side-panel')).toContainText('District 113');
  await expect(page.locator('.candidate-name')).toContainText('Courtney Waters');
});
```

---

## Future Improvements

**Component Library:**
- [ ] Extract common components to shared library
- [ ] Storybook for component documentation
- [ ] Unit tests for all components

**Performance:**
- [ ] Lazy load SidePanel
- [ ] Virtual scrolling for candidate list (>100 candidates)
- [ ] Web Workers for SVG processing

**Accessibility:**
- [ ] Screen reader testing
- [ ] High contrast mode support
- [ ] Focus trap in modal dialogs
