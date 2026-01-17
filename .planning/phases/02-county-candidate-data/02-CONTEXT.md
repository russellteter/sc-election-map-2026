# Phase 2: County Candidate Data - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<vision>
## How This Should Work

Real data, not demo data. This phase should populate county-races.json with actual incumbent names for all 46 SC counties across all 7 county offices (Sheriff, Auditor, Treasurer, Coroner, Clerk of Court, Register of Deeds, Probate Judge).

The data should come from authoritative sources - SC Sheriffs' Association for sheriffs, SCAC Directory for other officials. Where possible, scrape programmatically so data can be updated. Where sites don't expose clean data, fall back to manual research.

For candidates, the filing period (March 16-30, 2026) hasn't opened yet. Check SC Ethics Commission for early filers who have filed campaign finance reports - these could be marked as "potential candidates" with transparency about the data source.

</vision>

<essential>
## What Must Be Nailed

- **Real incumbent data for all 46 counties** - No made-up names. Every sheriff, auditor, treasurer, coroner, clerk of court, register of deeds, and probate judge should be the actual person holding that office.
- **Cross-referenced from multiple sources** - Don't trust a single source blindly. Pull from sheriffs' association, SCAC directory, county websites where possible to verify accuracy.
- **Conflict resolution: most recent wins** - When sources disagree, prefer the source with the most recent update date.
- **Scraper where possible, manual fallback** - Build Python scrapers following existing scripts/ pattern for repeatable data updates. Fill gaps manually where automation isn't feasible.

</essential>

<boundaries>
## What's Out of Scope

- Demo/fake data generation - explicitly rejected
- Waiting for the March filing period - we'll populate incumbents now and check Ethics Commission for early filers
- Perfect candidate data - filing period hasn't opened, so candidate arrays may be sparse or empty
- Other states - this is SC-only for Phase 2

</boundaries>

<specifics>
## Specific Ideas

**Data sources identified:**
1. SC Sheriffs' Association (sheriffsc.org/county_map/) - Individual pages have sheriff names, contact info
2. SCAC 2025 Directory of County Officials - PDF with all elected/appointed officials
3. County government websites - Often list elected officials
4. SC Ethics Commission - For early campaign finance filers as potential candidates

**Data pipeline approach:**
- Python scrapers for structured sources (sheriffs' association individual county pages)
- PDF parsing for SCAC directory if needed
- Manual data entry for gaps
- JSON output matching existing county-races.json schema

**Quality controls:**
- Cross-reference multiple sources where possible
- Most recent source wins on conflicts
- Clear provenance tracking (source field)

</specifics>

<notes>
## Additional Context

The existing county-races.json has 10 counties with incumbent data - this data appears to be real (verified Greenville Sheriff Hobart Lewis, Richland Sheriff Leon Lott). The structure is correct, just needs to be expanded to all 46 counties.

Filing period for 2026 candidates: March 16-30, 2026
Primaries: June 9, 2026
General: November 3, 2026

Party affiliation for county officials: SC Ethics filings don't include party. Will need to determine from election results or party records.

</notes>

---

*Phase: 02-county-candidate-data*
*Context gathered: 2026-01-17*
