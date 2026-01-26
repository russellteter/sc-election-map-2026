# SC Ethics Monitor - Source of Truth Sprint

## Mission

Transform the Google Sheets Source of Truth from a functional data sync target into a polished, user-friendly campaign operations dashboard that enables fast decision-making and efficient research workflows.

**Google Sheet:** https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit

## Current State

**What exists:**
- 5-tab structure: Districts, Candidates, Race Analysis, Research Queue, Sync Log
- Bidirectional sync system (Python)
- 170 SC districts tracked (124 House, 46 Senate)
- Party detection with manual override support
- Basic formatting (colors, dropdowns, frozen headers)

**What's missing:**
- County-level geography linking
- Dashboard/summary view for at-a-glance insights
- Named ranges for formula maintainability
- Advanced conditional formatting for visual scanning
- Data validation rules to prevent errors
- Print-friendly and mobile-friendly views

## Strategic Context

This sheet serves as the **single source of truth** for SC election data. Campaign staff will:
1. Review daily sync reports
2. Research candidates needing party verification
3. Identify recruitment opportunities
4. Export data for field operations

A well-designed sheet reduces research time, prevents data entry errors, and enables faster strategic decisions.

## Sprint Scope

**In Scope:**
- Data enrichment (county mapping, incumbent enrichment)
- Usability improvements (validation, named ranges, formulas)
- Design polish (formatting, dashboard tab, print views)

**Out of Scope:**
- Python code changes (sync system works fine)
- New tabs beyond Dashboard
- Integration with external systems

## Success Metrics

| Metric | Target |
|--------|--------|
| Research queue item resolution | < 3 clicks to verify party |
| Data entry errors | Zero validation failures |
| At-a-glance insights | Dashboard shows all KPIs |
| Visual scanning speed | Color-coded by priority |

## Key Constraints

1. **Bidirectional sync must continue working** - Don't change column positions A-P in Candidates tab
2. **Manual overrides preserved** - Columns K, M, O must remain editable
3. **Formula columns protected** - L (final_party) uses formula
4. **No breaking changes** - Existing Python code depends on current structure

## Guiding Principles

**DO:**
- Add new columns to the right (after P)
- Use named ranges for formula references
- Add data validation rules
- Create Dashboard as a new tab
- Use conditional formatting extensively

**DON'T:**
- Reorder existing columns A-P
- Change tab names (Python references them)
- Remove any existing columns
- Add complex formulas that slow sheet performance
