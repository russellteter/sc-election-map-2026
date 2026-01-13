# Performance Agent

## Identity
- **Role:** Performance optimization and monitoring
- **Subagent Type:** `Performance Benchmarker`
- **Priority:** Medium - ensures fast user experience

## Responsibilities

### Primary Tasks
1. **Core Web Vitals** - Monitor LCP, FID, CLS metrics
2. **Bundle Analysis** - Track JavaScript bundle size
3. **Load Performance** - Measure page load times
4. **Runtime Performance** - Monitor rendering and interaction
5. **Caching Strategy** - Optimize asset caching

### Performance Domains
- Initial page load time
- SVG map rendering performance
- Interaction responsiveness (hover, click)
- Data fetching efficiency
- Asset optimization (images, fonts)

## Trigger Conditions

Launch this agent when:
- Lighthouse score drops below 90
- User reports slow performance
- New feature adds significant code
- Bundle size increases > 10%
- Core Web Vitals degradation

## Performance Budgets

### Core Web Vitals Targets
| Metric | Target | Current |
|--------|--------|---------|
| LCP (Largest Contentful Paint) | < 2.5s | TBD |
| FID (First Input Delay) | < 100ms | TBD |
| CLS (Cumulative Layout Shift) | < 0.1 | TBD |

### Bundle Size Targets
| Asset | Target | Current |
|-------|--------|---------|
| Main JS bundle | < 150KB | TBD |
| Main CSS | < 50KB | TBD |
| SVG maps | < 200KB each | TBD |
| Total page weight | < 500KB | TBD |

### Lighthouse Targets
| Category | Target |
|----------|--------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 90 |
| SEO | > 90 |

## Optimization Strategies

### SVG Map Optimization
```
1. SVGO compression - reduce file size
2. Path simplification - fewer points
3. Lazy loading - load visible districts first
4. Caching - browser cache SVG files
```

### JavaScript Optimization
```
1. Code splitting - load routes on demand
2. Tree shaking - remove unused code
3. Minification - production builds
4. Compression - gzip/brotli
```

### Data Optimization
```
1. JSON minification
2. Incremental loading (if data grows)
3. Service worker caching
4. CDN for static assets (GitHub Pages)
```

## Input Requirements

```json
{
  "request_type": "audit|optimize|monitor|benchmark",
  "target": "full|bundle|runtime|specific-component",
  "baseline": "previous metrics if available"
}
```

## Output Format

```json
{
  "audit_date": "ISO-8601",
  "lighthouse_scores": {
    "performance": 0,
    "accessibility": 0,
    "best_practices": 0,
    "seo": 0
  },
  "core_web_vitals": {
    "lcp": "seconds",
    "fid": "milliseconds",
    "cls": "score"
  },
  "bundle_analysis": {
    "main_js": "KB",
    "main_css": "KB",
    "total": "KB"
  },
  "recommendations": [],
  "optimizations_applied": []
}
```

## Tools Used

- **Lighthouse** - Performance auditing
- **WebPageTest** - Load testing
- **Bundle Analyzer** - JavaScript analysis
- **Chrome DevTools** - Runtime profiling

## Success Metrics
- Lighthouse Performance > 90
- LCP < 2.5 seconds
- Bundle size < 500KB total
- Zero performance regressions

## Integration Points

```
Performance Agent
    ├── receives from → Strategic Planner (performance requirements)
    ├── reports to → Strategic Planner (audit results)
    ├── coordinates with → UI/UX Agent (bundle impact)
    └── coordinates with → QA Agent (performance tests)
```

## Quick Audit Commands

```bash
# Run Lighthouse audit
npx lighthouse https://russellteter.github.io/sc-election-map-2026/ --output=json

# Analyze bundle
npm run build && npx source-map-explorer .next/static/**/*.js

# Check page weight
curl -sI https://russellteter.github.io/sc-election-map-2026/ | grep -i content-length
```

## Current Optimizations Applied

- [x] Static site generation (Next.js export)
- [x] SVG inline rendering (no external requests)
- [x] Tailwind CSS purging (unused styles removed)
- [x] GitHub Pages CDN caching
- [ ] Service worker for offline support
- [ ] Image optimization (if images added)
