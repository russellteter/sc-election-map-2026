# Phase 04-03: Party Sources (SCDP/SCGOP) - COMPLETED

## Summary

Implemented candidate discovery adapters for both South Carolina political party websites:
- **SCDPSource** - South Carolina Democratic Party (scdp.org)
- **SCGOPSource** - South Carolina Republican Party (sc.gop)

Both sources provide authoritative party affiliation data (HIGH confidence) since candidates appearing on party websites definitively indicate their party membership.

## Implementation Details

### SCDPSource (`src/candidate_discovery/sources/scdp.py`)

**Configuration:**
- `source_name`: "scdp"
- `source_priority`: 3 (party-specific)
- `BASE_URL`: https://scdp.org

**Key URLs Scraped:**
1. `https://scdp.org/candidates/` (2026 candidates - when available)
2. `https://scdp.org/2026-candidates/` (alternative)
3. `https://scdp.org/endorsed-candidates/` (endorsed candidates)
4. `https://scdp.org/our-party/elected-officials/` (incumbents)

**Party Assignment:**
- All discovered candidates: `party = "D"`, `party_confidence = "HIGH"`

### SCGOPSource (`src/candidate_discovery/sources/scgop.py`)

**Configuration:**
- `source_name`: "scgop"
- `source_priority`: 3 (party-specific)
- `BASE_URL`: https://sc.gop (note: www.scgop.com redirects here)

**Key URLs Scraped:**
1. `https://sc.gop/candidates/` (2026 candidates - when available)
2. `https://sc.gop/2026-candidates/` (alternative)
3. `https://sc.gop/endorsed-candidates/` (endorsed candidates)
4. `https://sc.gop/news/` (candidate announcements)

**Party Assignment:**
- All discovered candidates: `party = "R"`, `party_confidence = "HIGH"`

## Website Structure Findings

### SCDP (scdp.org)

Current structure (as of January 2026):
- **Elected Officials page exists** - Lists current Democratic officeholders with districts
- **No dedicated 2026 candidates page** - Party focuses on recruitment forms
- **Candidate Resources Toolkit** - Recruitment-focused, no public candidate list
- **County Party Map** - 46 county organizations for local candidate tracking

### SCGOP (sc.gop)

Current structure (as of January 2026):
- **News page exists** - Contains candidate announcements
- **No dedicated candidates page** - Party focuses on volunteer/donate
- **Election Info** - Links to external vote.gop site
- Candidate information primarily appears in news articles

## Parsing Strategies

Both sources implement multiple parsing strategies to handle varied page formats:

1. **District Pattern Matching**
   - Senate: `/(?:Senate|SD|State\s*Senate|Senate\s+District)\s*(?:#?\s*)?(\d{1,2})/`
   - House: `/(?:House|HD|House\s+District)\s*(?:#?\s*)?(\d{1,3})/`

2. **Name Extraction**
   - Bold pattern: `**Name** - District X`
   - List pattern: `- Name - District X`
   - News announcement pattern: `Name ... SC Senate/House District X`

3. **Validation**
   - District numbers checked against valid ranges (House: 1-124, Senate: 1-46)
   - Names validated for multi-word structure
   - Non-name terms filtered (district, house, senate, party, etc.)

## Test Coverage

Created `tests/test_party_sources.py` with 58 test cases covering:

| Test Category | Count |
|---------------|-------|
| SCDP Source Properties | 4 |
| SCDP District ID Building | 3 |
| SCDP District Extraction | 6 |
| SCDP Name Validation | 4 |
| SCDP Candidate Parsing | 6 |
| SCDP Cache Management | 2 |
| SCDP Extract District Candidates | 2 |
| SCGOP Source Properties | 4 |
| SCGOP District ID Building | 2 |
| SCGOP District Extraction | 4 |
| SCGOP Name Validation | 2 |
| SCGOP Candidate Parsing | 6 |
| SCGOP Cache Management | 2 |
| SCGOP Extract District Candidates | 2 |
| Cross-Source Comparison | 3 |
| Rate Limiter Integration | 3 |
| Metadata Validation | 3 |

All 142 tests pass (including existing tests).

## Test Fixtures Created

```
tests/fixtures/
  scdp_elected_officials.md   # Mock elected officials page
  scdp_candidates_page.md     # Mock candidates listing
  scdp_empty.md               # Empty/placeholder page
  scgop_news.md               # Mock news with announcements
  scgop_candidates_page.md    # Mock candidates listing
  scgop_empty.md              # Empty/placeholder page
```

## Challenges and Solutions

### Challenge 1: Party Websites Lack Dedicated Candidate Pages

**Problem:** Neither party website currently has a centralized 2026 candidates page.

**Solution:**
- Implemented multiple URL fallbacks
- Parse elected officials page for incumbent data
- Parse news pages for candidate announcements
- Code structured to easily add new URLs as they become available

### Challenge 2: Ambiguous District Patterns

**Problem:** "District 15" could be House or Senate without context.

**Solution:**
- Check Senate patterns first (more specific)
- Use context clues from surrounding text
- Validate district numbers against valid ranges
- Skip ambiguous matches when chamber cannot be determined

### Challenge 3: Name vs. Non-Name Detection

**Problem:** Bold text might contain headers or navigation items, not just names.

**Solution:**
- Implemented `_is_valid_name()` with multiple checks
- Require at least two words (first + last name)
- Filter common non-name terms
- Skip names containing district/party terminology

## Files Created/Modified

### New Files
- `src/candidate_discovery/sources/scdp.py` - SCDP source adapter
- `src/candidate_discovery/sources/scgop.py` - SCGOP source adapter
- `tests/test_party_sources.py` - Unit tests (58 tests)
- `tests/fixtures/scdp_*.md` - SCDP test fixtures (3 files)
- `tests/fixtures/scgop_*.md` - SCGOP test fixtures (3 files)

## Integration Notes

Both sources are ready to integrate with the discovery orchestrator:

```python
from candidate_discovery.sources.scdp import SCDPSource
from candidate_discovery.sources.scgop import SCGOPSource

# Initialize sources
scdp = SCDPSource(firecrawl_api_key=FIRECRAWL_API_KEY)
scgop = SCGOPSource(firecrawl_api_key=FIRECRAWL_API_KEY)

# Discover candidates
dem_candidates = await scdp.discover_candidates(chambers=["house", "senate"])
rep_candidates = await scgop.discover_candidates(chambers=["house", "senate"])

# Get district-specific candidates
district_dems = scdp.extract_district_candidates("SC-House-042")
district_reps = scgop.extract_district_candidates("SC-House-042")
```

## Next Steps

1. **Phase 04-04**: Implement SC Election Commission source
2. **Phase 04-05**: Implement web search fallback source
3. **Phase 04-06**: Build candidate merger with conflict resolution
4. **Monitor Party Websites**: Add URLs as 2026 candidate pages become available

## Conclusion

The party source adapters provide authoritative party affiliation data that will be crucial for the candidate merger in Phase 04-06. While the party websites currently have limited candidate listings, the implementation is designed to gracefully handle empty pages and will automatically capture candidates as the parties publish their 2026 candidate information.
