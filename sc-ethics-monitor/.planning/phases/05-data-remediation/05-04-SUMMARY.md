# 05-04 Summary: Run Candidate Discovery Pipeline

## Execution Date
2026-01-22

## Tasks Completed

### Task 1: Verify Discovery Configuration
- DISCOVERY_ENABLED: True
- DISCOVERY_SOURCES: ballotpedia, scdp, scgop
- FIRECRAWL_API_KEY: Set and working
- NAME_SIMILARITY_THRESHOLD: 0.85

### Task 2: Verify Firecrawl API Access
Firecrawl API connectivity confirmed:
- Successfully authenticated with API key
- Rate limiting and retries working correctly
- Timeout handling in place (30s default)

### Task 3: Run Discovery Verification Script
```bash
python scripts/verify_discovery.py --districts 3 --verbose
```

**Results:** 5/5 tests passed
- Ballotpedia source adapter: PASSED
- SCDP source adapter: PASSED
- SCGOP source adapter: PASSED
- Deduplicator logic: PASSED
- Reporter generation: PASSED

### Task 4: Execute Discovery Pipeline - Ballotpedia
**Districts Scraped:** 170 (124 House + 46 Senate)
**Time:** ~25 minutes (1474.7 seconds)
**Candidates Found:** 0

**Notes:**
- All 170 district pages successfully scraped from Ballotpedia
- One transient 502 error on SC-Senate-017 (retried successfully)
- **Expected Result:** Ballotpedia does not have 2026 SC legislative candidate data published yet
- 2026 primary filing deadline is typically March, general election candidates list later

### Task 5: Execute Discovery Pipeline - Party Sources

#### SCDP (South Carolina Democratic Party)
**Pages Scraped:** 4
- https://scdp.org/candidates/
- https://scdp.org/2026-candidates/
- https://scdp.org/endorsed-candidates/
- https://scdp.org/our-party/elected-officials/

**Time:** 21.7 seconds
**Candidates Found:** 0

**Notes:** SCDP website does not have 2026 candidate listings published yet

#### SCGOP (South Carolina Republican Party)
**Pages Scraped:** 5
- https://sc.gop/candidates/
- https://sc.gop/2026-candidates/
- https://sc.gop/endorsed-candidates/
- https://sc.gop/our-candidates/
- https://sc.gop/news/

**Time:** 20.9 seconds
**Candidates Found:** 2 (from news page)

### Task 6: Review Discovered Candidates
**Total Raw Candidates:** 2
**After Deduplication:** 2
**Merged Candidates:** 0
**Conflicts:** 0

The 2 candidates discovered from SCGOP news page need manual verification before adding to the sheet.

### Task 7: Sync to Google Sheets
**Status:** Not applicable - no verified candidates to sync

The 2 SCGOP news candidates need manual verification before import as they may be:
- Announcements rather than filed candidates
- Already present in the Ethics Commission filings
- Incomplete data (missing district assignment)

### Task 8: Generate Coverage Report
| Metric | Value |
|--------|-------|
| Total Districts | 170 |
| Districts with Candidates | 0 (from discovery) |
| Coverage Percentage | 0% |
| Sources Attempted | 3 |
| Sources Succeeded | 3 |

## Discovery Statistics

### By Source
| Source | Pages Scraped | Candidates Found | Time |
|--------|---------------|------------------|------|
| Ballotpedia | 170 | 0 | 1474.7s |
| SCDP | 4 | 0 | 21.7s |
| SCGOP | 5 | 2 | 20.9s |
| **Total** | **179** | **2** | **~26 min** |

### Pipeline Performance
- Total scrape requests: 179 pages
- Failed requests: 1 (retried successfully)
- Average time per page: ~8 seconds (Ballotpedia), ~5 seconds (party sites)
- API rate limiting: Respected, no 429 errors

## Key Finding

**No 2026 candidate data available yet from external sources.**

This is expected for January 2026:
1. **Ballotpedia** typically updates state legislative races closer to primary elections
2. **SCDP/SCGOP** party websites don't list candidates until filing is complete
3. **SC Primary Date:** June 2026 (filing deadline March 2026)

The current candidates in the system (28 total) are from:
- SC Ethics Commission filings (primary source)
- party-data.json manual research

## Success Criteria
- [x] Discovery configuration verified
- [x] Firecrawl API access confirmed
- [x] Dry-run completes successfully
- [x] Ballotpedia discovery executed (0 candidates - expected)
- [x] SCDP/SCGOP discovery executed (2 candidates found)
- [x] Results reviewed for accuracy
- [ ] Candidates synced to Google Sheet (N/A - no verified candidates)
- [x] Coverage report generated

## Recommendations

1. **Schedule Weekly Discovery Runs**
   - Run discovery weekly starting March 2026 (after filing opens)
   - Monitor Ballotpedia for 2026 race updates

2. **Alternative Data Sources**
   - Consider adding SCVotes.gov when 2026 filings are published
   - Monitor local news outlets for candidate announcements

3. **Manual Research Priority**
   - The 21 UNKNOWN party candidates in the sheet need manual research
   - Focus on: Ethics filings, social media, local news

4. **Verify SCGOP News Candidates**
   - Manually verify the 2 candidates found before import
   - Cross-reference with Ethics Commission filings

## Usage

To run discovery in the future:
```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor

# Dry run (test without live scraping)
python scripts/verify_discovery.py --dry-run --verbose

# Live discovery (requires FIRECRAWL_API_KEY)
export FIRECRAWL_API_KEY="your-key-here"
python scripts/verify_discovery.py --verbose

# Full pipeline with sheets sync
FORCE_DISCOVERY=1 python -m src.monitor --force-discovery
```
