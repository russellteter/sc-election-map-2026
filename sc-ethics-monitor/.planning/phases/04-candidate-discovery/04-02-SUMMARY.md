# Phase 04-02: Ballotpedia Source Implementation Summary

**Status:** COMPLETE
**Date:** 2026-01-22
**Test Results:** 44/44 tests passing

## Implementation Overview

Implemented `BallotpediaSource` class for discovering candidates from Ballotpedia's South Carolina legislative district pages.

## Files Created

### Source Code
- `src/candidate_discovery/sources/ballotpedia.py` - Main BallotpediaSource class (~400 lines)

### Test Files
- `tests/test_ballotpedia_source.py` - Comprehensive unit tests (44 tests)

### Test Fixtures
- `tests/fixtures/ballotpedia_sample.md` - Multi-candidate contested race
- `tests/fixtures/ballotpedia_no_election.md` - No 2026 election section
- `tests/fixtures/ballotpedia_single_candidate.md` - Uncontested race
- `tests/fixtures/ballotpedia_independent.md` - Race with third-party candidates

## Key Implementation Details

### URL Building
- House: `https://ballotpedia.org/South_Carolina_House_of_Representatives_District_{n}`
- Senate: `https://ballotpedia.org/South_Carolina_State_Senate_District_{n}`
- District IDs use zero-padded format: `SC-House-042`, `SC-Senate-015`

### Candidate Parsing Patterns
```regex
# Candidate name and party
\*\*([^*]+)\*\*\s*\(([^)]+)\)

# 2026 election section extraction
##\s*2026\s+election.*?(?=##\s*(?:Previous|20(?:2[0-4]|1\d))|$)
```

### Party Normalization
| Input Text | Normalized Code |
|------------|-----------------|
| Democratic, Democrat | D |
| Republican, GOP | R |
| Independent | I |
| Libertarian, Green, Constitution | O |

### Incumbent Detection
- Searches for "incumbent" keyword within the same line as the candidate name
- Scoped to the election section context to avoid false positives from historical mentions

### Rate Limiting
- Uses `RateLimiter` from core infrastructure
- Default: 30 requests per minute (Firecrawl limit)
- Configurable via constructor parameter

### Caching
- Page cache: Stores scraped markdown by district_id
- Candidates cache: Stores parsed candidates by district_id
- `clear_cache()` method for cache invalidation
- `get_cache_stats()` for monitoring

## Test Coverage

### Test Classes (44 tests total)
1. **TestURLBuilding** (6 tests) - URL construction for House/Senate
2. **TestDistrictIdBuilding** (4 tests) - District ID formatting
3. **TestPartyNormalization** (6 tests) - Party text normalization
4. **TestCandidateParsing** (9 tests) - Markdown parsing
5. **TestSourceProperties** (2 tests) - Source name/priority
6. **TestDistrictIdParsing** (5 tests) - District ID parsing (inherited)
7. **TestCacheManagement** (2 tests) - Cache operations
8. **TestExtractDistrictCandidates** (4 tests) - Single district extraction
9. **TestPartyConfidence** (2 tests) - Confidence assignment
10. **TestDistrictCounts** (2 tests) - District count constants
11. **TestRateLimiter** (2 tests) - Rate limiter integration

## API Methods

### Async Methods
```python
async discover_candidates(chambers=["house", "senate"]) -> list[DiscoveredCandidate]
async extract_district_candidates_async(district_id) -> list[DiscoveredCandidate]
```

### Sync Methods
```python
extract_district_candidates(district_id) -> list[DiscoveredCandidate]  # From cache
clear_cache() -> None
get_cache_stats() -> dict
```

### Internal Methods
```python
_build_url(chamber, district_num) -> str
_district_id_from_parts(chamber, district_num) -> str
_normalize_party(party_text) -> Optional[str]
_extract_election_section(markdown) -> tuple[str, bool]
_parse_candidates(markdown, district_id, source_url) -> list[DiscoveredCandidate]
_scrape_district_page(url, district_id) -> Optional[str]  # Async with retry
```

## Dependencies

### Required Packages
- `tenacity` - Retry logic for API calls
- `requests` - HTTP requests to Firecrawl API

### Internal Dependencies
- `candidate_discovery.sources.base.CandidateSource`
- `candidate_discovery.sources.base.DiscoveredCandidate`
- `candidate_discovery.rate_limiter.RateLimiter`
- `config.py` constants (FIRECRAWL_API_KEY, FIRECRAWL_RPM, etc.)

## Known Limitations

1. **Firecrawl API Required** - Scraping requires valid Firecrawl API key
2. **Rate Limited** - 30 RPM limit means full discovery takes ~6 minutes
3. **2026 Section Parsing** - Pages without explicit 2026 election sections may not parse correctly
4. **Markdown Format Dependency** - Parsing assumes Ballotpedia's current markdown format

## Usage Example

```python
from candidate_discovery.sources import BallotpediaSource

# Initialize with API key
source = BallotpediaSource(firecrawl_api_key="your_key")

# Discover all candidates (async)
import asyncio
candidates = asyncio.run(source.discover_candidates())

# Or single district (async)
candidates = asyncio.run(
    source.extract_district_candidates_async("SC-House-042")
)

# Check cache stats
print(source.get_cache_stats())
```

## Next Steps

1. **Phase 04-03:** Implement SCDP (SC Democratic Party) source
2. **Phase 04-04:** Implement SCGOP (SC Republican Party) source
3. **Phase 04-05:** Implement multi-source aggregation pipeline

## Verification Command

```bash
cd /Users/russellteter/Desktop/sc-election-map-2026/sc-ethics-monitor
pytest tests/test_ballotpedia_source.py -v
```
