# SC Ethics Monitor: Known Candidate Data Population

## System Design Document

**Version:** 1.0
**Date:** 2026-01-22
**Status:** Design Complete - Ready for Implementation

---

## 1. Executive Summary

### 1.1 Problem Statement

The SC Ethics Monitor has robust infrastructure for:
- Tracking 170 SC legislative districts (124 House + 46 Senate)
- Syncing data bidirectionally with Google Sheets
- Detecting party affiliation via web search
- Managing research queues and race analysis

**The Gap:** The system lacks automated discovery of *who is running* in each race. Currently, it only processes candidates who have filed with the SC Ethics Commission. Many candidates announce their campaigns before filing, and some publicly available candidate lists exist from party websites and Ballotpedia.

### 1.2 Solution Overview

Build a **multi-source candidate discovery pipeline** that:
1. Aggregates candidate data from authoritative public sources
2. Cross-references with existing Ethics Commission filings
3. Populates the Google Sheet with known candidates
4. Triggers party detection for newly discovered candidates
5. Produces actionable reports on coverage gaps

---

## 2. Data Source Architecture

### 2.1 Primary Data Sources

| Source | Data Type | Frequency | Priority |
|--------|-----------|-----------|----------|
| SC Ethics Commission | Filing records | Daily | 1 - Authoritative |
| Ballotpedia | Candidate profiles | Weekly | 2 - Comprehensive |
| SC Democratic Party (SCDP) | D candidate list | Weekly | 3 - Party-specific |
| SC Republican Party (SCGOP) | R candidate list | Weekly | 3 - Party-specific |
| SC State Election Commission | Certified candidates | Monthly | 4 - Official |
| Campaign websites (via search) | Self-declared | On-demand | 5 - Discovery |

### 2.2 Source Reliability Matrix

```
                        Party Known   Filing Status   District   Incumbent
SC Ethics Commission         No           Yes           Yes         No
Ballotpedia                  Yes          Yes           Yes         Yes
SCDP/SCGOP                   Yes          No            Yes         No
SC Election Commission       Yes          Yes           Yes         No
Campaign Websites            Yes          No            Partial     No
```

### 2.3 Data Source URLs

```python
DATA_SOURCES = {
    "ethics_commission": {
        "url": "https://ethicsfiling.sc.gov",
        "method": "scrape",
        "frequency": "daily",
    },
    "ballotpedia": {
        "url_pattern": "https://ballotpedia.org/South_Carolina_State_{chamber}_District_{district}",
        "method": "firecrawl_scrape",
        "frequency": "weekly",
    },
    "scdp": {
        "url": "https://www.scdp.org/candidates",
        "method": "firecrawl_scrape",
        "frequency": "weekly",
    },
    "scgop": {
        "url": "https://www.scgop.com/candidates",
        "method": "firecrawl_scrape",
        "frequency": "weekly",
    },
    "election_commission": {
        "url": "https://info.scvotes.sc.gov/eng/candidates/",
        "method": "api",
        "frequency": "monthly",
    },
}
```

---

## 3. Component Design

### 3.1 Module Structure

```
sc-ethics-monitor/src/
├── candidate_discovery/
│   ├── __init__.py
│   ├── sources/
│   │   ├── __init__.py
│   │   ├── base.py              # Abstract source class
│   │   ├── ballotpedia.py       # Ballotpedia scraper
│   │   ├── scdp.py              # SCDP scraper
│   │   ├── scgop.py             # SCGOP scraper
│   │   └── election_commission.py
│   ├── aggregator.py            # Merges data from all sources
│   ├── deduplicator.py          # Name matching and deduplication
│   └── reporter.py              # Coverage gap analysis
├── party_detector.py            # Existing - enhanced
├── monitor.py                   # Existing - extended
└── sheets_sync.py               # Existing - unchanged
```

### 3.2 Core Classes

#### 3.2.1 CandidateSource (Abstract Base)

```python
@dataclass
class DiscoveredCandidate:
    """Candidate discovered from external source."""
    name: str
    district_id: str                    # e.g., "SC-House-042"
    party: Optional[str]                # D, R, I, O, or None
    party_confidence: str               # HIGH, MEDIUM, LOW, UNKNOWN
    source: str                         # ballotpedia, scdp, etc.
    source_url: str                     # Evidence URL
    filing_status: Optional[str]        # filed, declared, rumored
    discovered_date: str                # ISO timestamp
    incumbent: bool = False
    additional_data: dict = field(default_factory=dict)


class CandidateSource(ABC):
    """Abstract base class for candidate discovery sources."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Unique identifier for this source."""
        pass

    @property
    @abstractmethod
    def source_priority(self) -> int:
        """Priority for conflict resolution (1 = highest)."""
        pass

    @abstractmethod
    async def discover_candidates(
        self,
        chambers: list[str] = ["house", "senate"],
    ) -> list[DiscoveredCandidate]:
        """Discover candidates from this source."""
        pass

    @abstractmethod
    def extract_district_candidates(
        self,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """Get candidates for a specific district."""
        pass
```

#### 3.2.2 BallotpediaSource

```python
class BallotpediaSource(CandidateSource):
    """
    Scrapes Ballotpedia for SC legislative candidates.

    Strategy:
    - Iterate through all 170 district pages
    - Extract candidates from the "2026 election" section
    - Parse incumbent and challenger information
    """

    source_name = "ballotpedia"
    source_priority = 2

    def __init__(self, firecrawl_api_key: str):
        self.firecrawl = FirecrawlApp(api_key=firecrawl_api_key)
        self._rate_limiter = RateLimiter(requests_per_minute=30)

    async def discover_candidates(
        self,
        chambers: list[str] = ["house", "senate"],
    ) -> list[DiscoveredCandidate]:
        """Scrape all district pages for candidates."""
        candidates = []

        for chamber in chambers:
            max_districts = 124 if chamber == "house" else 46

            for district_num in range(1, max_districts + 1):
                district_id = f"SC-{chamber.capitalize()}-{district_num:03d}"
                url = self._build_url(chamber, district_num)

                await self._rate_limiter.wait()

                try:
                    page_candidates = await self._scrape_district_page(url, district_id)
                    candidates.extend(page_candidates)
                except Exception as e:
                    log(f"Error scraping {district_id}: {e}")
                    continue

        return candidates

    def _build_url(self, chamber: str, district_num: int) -> str:
        """Build Ballotpedia URL for a district."""
        chamber_name = "House" if chamber == "house" else "Senate"
        return f"https://ballotpedia.org/South_Carolina_State_{chamber_name}_District_{district_num}"

    async def _scrape_district_page(
        self,
        url: str,
        district_id: str,
    ) -> list[DiscoveredCandidate]:
        """Scrape a single district page."""
        # Use Firecrawl to get page content
        result = self.firecrawl.scrape(
            url=url,
            formats=["markdown"],
            onlyMainContent=True,
        )

        if not result or "markdown" not in result:
            return []

        markdown = result["markdown"]

        # Parse candidates from markdown
        return self._parse_candidates(markdown, district_id, url)

    def _parse_candidates(
        self,
        markdown: str,
        district_id: str,
        source_url: str,
    ) -> list[DiscoveredCandidate]:
        """Parse candidates from Ballotpedia page markdown."""
        candidates = []

        # Look for 2026 election section
        election_pattern = r"(?:2026|upcoming)\s+election"
        if not re.search(election_pattern, markdown, re.IGNORECASE):
            return []

        # Look for candidate listings
        # Ballotpedia format: "**Candidate Name** (Party)"
        candidate_pattern = r"\*\*([^*]+)\*\*\s*\(([DRI](?:emocrat(?:ic)?|epublican|ndependent)?)\)"

        for match in re.finditer(candidate_pattern, markdown, re.IGNORECASE):
            name = match.group(1).strip()
            party_text = match.group(2).strip()

            # Normalize party
            party = self._normalize_party(party_text)

            # Check if incumbent
            is_incumbent = "(incumbent)" in markdown.lower() and name.lower() in markdown.lower()

            candidates.append(DiscoveredCandidate(
                name=name,
                district_id=district_id,
                party=party,
                party_confidence="HIGH",  # Ballotpedia is authoritative
                source="ballotpedia",
                source_url=source_url,
                filing_status="declared",
                discovered_date=datetime.now(timezone.utc).isoformat(),
                incumbent=is_incumbent,
            ))

        return candidates

    def _normalize_party(self, party_text: str) -> str:
        """Normalize party text to code."""
        party_lower = party_text.lower()
        if "democrat" in party_lower or party_lower == "d":
            return "D"
        elif "republican" in party_lower or party_lower == "r":
            return "R"
        elif "independent" in party_lower or party_lower == "i":
            return "I"
        return "O"
```

#### 3.2.3 CandidateAggregator

```python
class CandidateAggregator:
    """
    Aggregates candidates from multiple sources and resolves conflicts.

    Resolution Strategy:
    1. Deduplicate by name + district
    2. Prefer higher-priority sources for party
    3. Merge additional data from all sources
    4. Flag conflicts for manual review
    """

    def __init__(self, sources: list[CandidateSource]):
        self.sources = sorted(sources, key=lambda s: s.source_priority)
        self.deduplicator = CandidateDeduplicator()

    async def aggregate_all(self) -> AggregationResult:
        """Aggregate candidates from all sources."""
        all_candidates = []
        source_stats = {}

        for source in self.sources:
            log(f"Discovering from {source.source_name}...")
            candidates = await source.discover_candidates()
            all_candidates.extend(candidates)
            source_stats[source.source_name] = len(candidates)
            log(f"  Found {len(candidates)} candidates")

        # Deduplicate
        log("Deduplicating candidates...")
        deduplicated = self.deduplicator.deduplicate(all_candidates)

        # Find conflicts
        conflicts = self._find_conflicts(deduplicated)

        return AggregationResult(
            candidates=deduplicated,
            source_stats=source_stats,
            conflicts=conflicts,
            total_raw=len(all_candidates),
            total_deduplicated=len(deduplicated),
        )

    def _find_conflicts(
        self,
        candidates: list[MergedCandidate],
    ) -> list[ConflictRecord]:
        """Find candidates with conflicting data across sources."""
        conflicts = []

        for candidate in candidates:
            if len(candidate.sources) < 2:
                continue

            # Check for party conflicts
            parties = set(s.party for s in candidate.source_records if s.party)
            if len(parties) > 1:
                conflicts.append(ConflictRecord(
                    candidate_name=candidate.name,
                    district_id=candidate.district_id,
                    conflict_type="party",
                    values=list(parties),
                    resolution=candidate.party,
                    resolution_source=candidate.primary_source,
                ))

        return conflicts


@dataclass
class AggregationResult:
    """Result of candidate aggregation."""
    candidates: list[MergedCandidate]
    source_stats: dict[str, int]
    conflicts: list[ConflictRecord]
    total_raw: int
    total_deduplicated: int
```

#### 3.2.4 CandidateDeduplicator

```python
class CandidateDeduplicator:
    """
    Deduplicates candidates across sources using fuzzy name matching.

    Strategy:
    - Group by district_id (exact match)
    - Within district, fuzzy match on name
    - Handle common variations:
      - "John Smith" vs "John H. Smith" vs "Johnny Smith"
      - "Jr." suffix variations
      - Middle initial presence/absence
    """

    SIMILARITY_THRESHOLD = 0.85

    def deduplicate(
        self,
        candidates: list[DiscoveredCandidate],
    ) -> list[MergedCandidate]:
        """Deduplicate candidates and merge data."""
        # Group by district
        by_district = defaultdict(list)
        for c in candidates:
            by_district[c.district_id].append(c)

        merged_candidates = []

        for district_id, district_candidates in by_district.items():
            # Cluster by name similarity
            clusters = self._cluster_by_name(district_candidates)

            for cluster in clusters:
                merged = self._merge_cluster(cluster)
                merged_candidates.append(merged)

        return merged_candidates

    def _cluster_by_name(
        self,
        candidates: list[DiscoveredCandidate],
    ) -> list[list[DiscoveredCandidate]]:
        """Cluster candidates by name similarity."""
        if not candidates:
            return []

        clusters = []
        used = set()

        for i, c1 in enumerate(candidates):
            if i in used:
                continue

            cluster = [c1]
            used.add(i)

            for j, c2 in enumerate(candidates[i+1:], i+1):
                if j in used:
                    continue

                if self._names_match(c1.name, c2.name):
                    cluster.append(c2)
                    used.add(j)

            clusters.append(cluster)

        return clusters

    def _names_match(self, name1: str, name2: str) -> bool:
        """Check if two names likely refer to the same person."""
        # Normalize names
        n1 = self._normalize_name(name1)
        n2 = self._normalize_name(name2)

        # Exact match after normalization
        if n1 == n2:
            return True

        # Fuzzy match
        similarity = self._calculate_similarity(n1, n2)
        return similarity >= self.SIMILARITY_THRESHOLD

    def _normalize_name(self, name: str) -> str:
        """Normalize name for comparison."""
        # Lowercase
        name = name.lower()

        # Remove common suffixes
        for suffix in [" jr.", " jr", " sr.", " sr", " iii", " ii", " iv"]:
            name = name.replace(suffix, "")

        # Remove middle initials
        name = re.sub(r'\b[a-z]\.\s*', '', name)

        # Remove extra whitespace
        name = ' '.join(name.split())

        return name.strip()

    def _calculate_similarity(self, s1: str, s2: str) -> float:
        """Calculate string similarity using Levenshtein ratio."""
        # Simple implementation - could use python-Levenshtein for better perf
        if not s1 or not s2:
            return 0.0

        # Use longest common subsequence ratio
        m, n = len(s1), len(s2)

        # DP table for LCS
        dp = [[0] * (n + 1) for _ in range(m + 1)]

        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if s1[i-1] == s2[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])

        lcs_length = dp[m][n]
        return (2 * lcs_length) / (m + n)

    def _merge_cluster(
        self,
        cluster: list[DiscoveredCandidate],
    ) -> MergedCandidate:
        """Merge a cluster of duplicate candidates."""
        # Sort by source priority
        cluster.sort(key=lambda c: self._get_source_priority(c.source))

        primary = cluster[0]

        # Collect all sources
        sources = list(set(c.source for c in cluster))
        source_urls = {c.source: c.source_url for c in cluster}

        # Determine best party (from highest priority source with party)
        party = None
        party_confidence = "UNKNOWN"
        party_source = None

        for c in cluster:
            if c.party:
                party = c.party
                party_confidence = c.party_confidence
                party_source = c.source
                break

        # Determine incumbent status (any source saying incumbent)
        is_incumbent = any(c.incumbent for c in cluster)

        # Determine filing status (most advanced status)
        filing_status = self._best_filing_status(
            [c.filing_status for c in cluster]
        )

        return MergedCandidate(
            name=primary.name,
            district_id=primary.district_id,
            party=party,
            party_confidence=party_confidence,
            party_source=party_source,
            sources=sources,
            source_urls=source_urls,
            filing_status=filing_status,
            incumbent=is_incumbent,
            discovered_date=min(c.discovered_date for c in cluster),
            source_records=cluster,
        )

    def _get_source_priority(self, source: str) -> int:
        """Get priority for a source."""
        priorities = {
            "ethics_commission": 1,
            "ballotpedia": 2,
            "scdp": 3,
            "scgop": 3,
            "election_commission": 4,
            "web_search": 5,
        }
        return priorities.get(source, 10)

    def _best_filing_status(self, statuses: list[Optional[str]]) -> str:
        """Get most advanced filing status."""
        status_order = ["certified", "filed", "declared", "rumored"]
        for status in status_order:
            if status in statuses:
                return status
        return "unknown"
```

---

## 4. Integration with Existing System

### 4.1 Google Sheets Integration

The discovered candidates integrate with the existing `sheets_sync.py`:

```python
# In candidate_discovery/sheets_integration.py

class DiscoverySheetIntegration:
    """Integrates discovered candidates with Google Sheets."""

    def __init__(self, sheets_sync: SheetsSync):
        self.sheets = sheets_sync

    def sync_discovered_candidates(
        self,
        candidates: list[MergedCandidate],
    ) -> SyncResult:
        """
        Sync discovered candidates to Google Sheets.

        Strategy:
        - For candidates already in sheet (by report_id or name+district match):
          - Update party if not locked and new source is higher priority
          - Add to sources list
        - For new candidates:
          - Create placeholder record (no report_id yet)
          - Set filing_status to indicate not yet filed with Ethics
          - Trigger party detection if party unknown
        """
        # Read current state
        sheet_state = self.sheets.read_sheet_state()

        # Build name+district index for matching
        name_index = self._build_name_index(sheet_state)

        results = SyncResult()

        for candidate in candidates:
            # Check if already exists
            existing = self._find_existing(candidate, sheet_state, name_index)

            if existing:
                # Update existing
                result = self._update_existing(candidate, existing)
                results.updated.append(result)
            else:
                # Add new
                result = self._add_new(candidate)
                results.added.append(result)

        return results

    def _find_existing(
        self,
        candidate: MergedCandidate,
        sheet_state: dict,
        name_index: dict,
    ) -> Optional[dict]:
        """Find existing candidate record."""
        # First check by name + district
        key = f"{candidate.name.lower()}|{candidate.district_id}"
        if key in name_index:
            return name_index[key]

        # Fuzzy name matching within district
        for existing_key, existing in name_index.items():
            ex_name, ex_district = existing_key.split("|")
            if ex_district == candidate.district_id:
                if self._names_fuzzy_match(candidate.name, ex_name):
                    return existing

        return None
```

### 4.2 Party Detection Integration

Discovered candidates without party trigger party detection:

```python
# In monitor.py - extended workflow

async def run_daily_monitor(self, ...):
    # ... existing steps ...

    # Step 5a: Run candidate discovery (weekly)
    if self._should_run_discovery():
        log("Step 5a: Running candidate discovery...")
        discovery_results = await self._run_candidate_discovery()

        # Sync discovered candidates
        sync_results = self.discovery_integration.sync_discovered_candidates(
            discovery_results.candidates
        )

        log(f"  Discovered: {len(discovery_results.candidates)}")
        log(f"  Added: {len(sync_results.added)}")
        log(f"  Updated: {len(sync_results.updated)}")

        # Run party detection on candidates without party
        for candidate in sync_results.added:
            if not candidate.party:
                await self._detect_party(candidate)

    # ... continue with existing steps ...

def _should_run_discovery(self) -> bool:
    """Check if discovery should run (weekly or forced)."""
    # Run on Sundays or if FORCE_DISCOVERY env var set
    today = datetime.now().weekday()
    return today == 6 or os.getenv("FORCE_DISCOVERY") == "1"
```

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CANDIDATE DISCOVERY PIPELINE                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Ballotpedia │  │    SCDP      │  │    SCGOP     │  │   SC Election│
│   (170 pgs)  │  │ (Candidates) │  │ (Candidates) │  │  Commission  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       │  Firecrawl      │  Firecrawl      │  Firecrawl      │  API/Scrape
       ▼                 ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CandidateSource Adapters                      │
│   - Normalize to DiscoveredCandidate format                       │
│   - Extract: name, district, party, filing_status                 │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      CandidateAggregator                          │
│   - Merge candidates from all sources                             │
│   - Resolve conflicts by source priority                          │
│   - Flag conflicts for manual review                              │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CandidateDeduplicator                         │
│   - Fuzzy name matching within districts                          │
│   - Handle: "John Smith" vs "John H. Smith" vs "Johnny Smith"     │
│   - Merge data from duplicate records                             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               DiscoverySheetIntegration                           │
│   - Match against existing Google Sheet records                   │
│   - Add new candidates (placeholder records)                      │
│   - Update existing with new source data                          │
│   - Respect party_locked flags                                    │
└──────────────────────────────────────────────────────────────────┘
                               │
           ┌───────────────────┴───────────────────┐
           │                                       │
           ▼                                       ▼
┌──────────────────────┐              ┌──────────────────────┐
│  Existing Candidates │              │   New Candidates     │
│  - Update sources    │              │   - Create record    │
│  - Merge party data  │              │   - Trigger party    │
│  - Log changes       │              │     detection        │
└──────────────────────┘              └──────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Google Sheets                                 │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Candidates │  │   Race      │  │  Research   │  │  Sync    │ │
│  │     Tab     │  │  Analysis   │  │   Queue     │  │   Log    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Core Infrastructure (2-3 hours)
1. Create `candidate_discovery/` module structure
2. Implement `DiscoveredCandidate` and `MergedCandidate` dataclasses
3. Implement abstract `CandidateSource` base class
4. Implement `CandidateDeduplicator` with fuzzy matching

**Deliverables:**
- `src/candidate_discovery/__init__.py`
- `src/candidate_discovery/sources/base.py`
- `src/candidate_discovery/deduplicator.py`

### Phase 2: Ballotpedia Source (2-3 hours)
1. Implement `BallotpediaSource` with Firecrawl integration
2. Build district URL generator for all 170 districts
3. Implement markdown parsing for candidate extraction
4. Add rate limiting for Firecrawl API

**Deliverables:**
- `src/candidate_discovery/sources/ballotpedia.py`
- Unit tests with mock Ballotpedia pages

### Phase 3: Party Sources (1-2 hours)
1. Implement `SCDPSource` for Democratic candidates
2. Implement `SCGOPSource` for Republican candidates
3. Handle party-specific page formats

**Deliverables:**
- `src/candidate_discovery/sources/scdp.py`
- `src/candidate_discovery/sources/scgop.py`

### Phase 4: Aggregator and Integration (2 hours)
1. Implement `CandidateAggregator` with conflict resolution
2. Implement `DiscoverySheetIntegration`
3. Add discovery step to `monitor.py`

**Deliverables:**
- `src/candidate_discovery/aggregator.py`
- `src/candidate_discovery/sheets_integration.py`
- Modified `src/monitor.py`

### Phase 5: Reporting and Verification (1-2 hours)
1. Implement coverage gap reporter
2. Add discovery metrics to daily email
3. Test full pipeline on subset of districts

**Deliverables:**
- `src/candidate_discovery/reporter.py`
- Updated email templates
- Integration tests

---

## 7. Cost and Rate Limiting

### 7.1 Firecrawl API Costs

| Operation | Pages | Cost per Page | Total |
|-----------|-------|---------------|-------|
| Ballotpedia (all districts) | 170 | $0.004 | $0.68 |
| SCDP candidate page | 1-5 | $0.004 | $0.02 |
| SCGOP candidate page | 1-5 | $0.004 | $0.02 |
| Weekly discovery run | ~180 | $0.004 | ~$0.72 |
| Monthly cost | ~720 | $0.004 | ~$2.88 |

### 7.2 Rate Limiting Strategy

```python
class RateLimiter:
    """Rate limiter for API calls."""

    def __init__(self, requests_per_minute: int = 30):
        self.rpm = requests_per_minute
        self.interval = 60.0 / requests_per_minute
        self.last_request = 0

    async def wait(self):
        """Wait if necessary to respect rate limit."""
        now = time.time()
        elapsed = now - self.last_request
        if elapsed < self.interval:
            await asyncio.sleep(self.interval - elapsed)
        self.last_request = time.time()
```

---

## 8. Error Handling

### 8.1 Source Failure Handling

```python
class SourceResult:
    """Result from a source operation."""
    success: bool
    candidates: list[DiscoveredCandidate]
    error: Optional[str]
    partial_coverage: bool  # True if some districts failed


async def aggregate_all(self) -> AggregationResult:
    """Aggregate with error handling."""
    source_results = {}

    for source in self.sources:
        try:
            result = await source.discover_candidates()
            source_results[source.source_name] = SourceResult(
                success=True,
                candidates=result,
                error=None,
                partial_coverage=False,
            )
        except Exception as e:
            log(f"Source {source.source_name} failed: {e}")
            source_results[source.source_name] = SourceResult(
                success=False,
                candidates=[],
                error=str(e),
                partial_coverage=False,
            )

    # Continue with successful sources
    all_candidates = []
    for result in source_results.values():
        if result.success:
            all_candidates.extend(result.candidates)

    # ... continue aggregation ...
```

### 8.2 Retry Strategy

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((TimeoutError, ConnectionError)),
)
async def _scrape_with_retry(self, url: str) -> dict:
    """Scrape URL with retry logic."""
    return self.firecrawl.scrape(url, formats=["markdown"])
```

---

## 9. Verification and Metrics

### 9.1 Coverage Metrics

```python
@dataclass
class CoverageReport:
    """Report on candidate discovery coverage."""
    total_districts: int = 170
    districts_with_candidates: int = 0
    districts_without_candidates: int = 0
    candidates_by_party: dict = field(default_factory=dict)
    candidates_by_source: dict = field(default_factory=dict)
    conflicts_found: int = 0

    def coverage_percentage(self) -> float:
        """Calculate coverage percentage."""
        return (self.districts_with_candidates / self.total_districts) * 100
```

### 9.2 Daily Reporting

Add to email notification:
```
=== CANDIDATE DISCOVERY ===
Coverage: 142/170 districts (83.5%)
Candidates discovered: 287
  - By party: D=124, R=156, Unknown=7
  - By source: Ballotpedia=215, SCDP=89, SCGOP=112
New candidates this week: 12
Conflicts for review: 3
```

---

## 10. Configuration

### 10.1 Environment Variables

```bash
# Discovery settings
DISCOVERY_ENABLED=true
DISCOVERY_FREQUENCY=weekly  # daily, weekly, manual
DISCOVERY_SOURCES=ballotpedia,scdp,scgop,election_commission

# Rate limiting
FIRECRAWL_RPM=30  # requests per minute

# Matching thresholds
NAME_SIMILARITY_THRESHOLD=0.85
```

### 10.2 Config Module Updates

```python
# In config.py

# Discovery configuration
DISCOVERY_ENABLED = get_env("DISCOVERY_ENABLED", "true").lower() == "true"
DISCOVERY_FREQUENCY = get_env("DISCOVERY_FREQUENCY", "weekly")
DISCOVERY_SOURCES = get_env("DISCOVERY_SOURCES", "ballotpedia,scdp,scgop").split(",")
NAME_SIMILARITY_THRESHOLD = float(get_env("NAME_SIMILARITY_THRESHOLD", "0.85"))
```

---

## 11. Success Criteria

| Metric | Target |
|--------|--------|
| District coverage | > 80% of contested districts |
| Party identification | > 90% of discovered candidates |
| Duplicate detection | < 5% false negatives |
| Source reliability | > 95% success rate per source |
| Processing time | < 15 minutes for full discovery |
| Cost per run | < $1.00 |

---

## 12. Future Enhancements

### 12.1 Phase 2 Enhancements
- Add campaign finance API integration
- Implement Google News search for campaign announcements
- Add social media presence detection

### 12.2 Phase 3 Enhancements
- Machine learning for candidate name disambiguation
- Automated campaign website detection
- Real-time filing notifications from Ethics Commission

---

## Appendix A: Ballotpedia Page Structure

Example URL: `https://ballotpedia.org/South_Carolina_State_House_District_42`

Typical page structure:
```markdown
# South Carolina State House District 42

## 2026 election

### Candidates

**Republican primary**
- **John Smith** (Incumbent)

**Democratic primary**
- **Jane Doe**
- **Bob Johnson**

### General election
The general election will be held on November 3, 2026.
```

---

## Appendix B: Dependencies

Add to `requirements.txt`:
```
# Candidate discovery
python-Levenshtein>=0.25.0  # Fast fuzzy matching
tenacity>=8.2.0             # Retry logic
aiohttp>=3.9.0              # Async HTTP (optional)
```

---

## Appendix C: File Checklist

**New Files to Create:**
- [ ] `src/candidate_discovery/__init__.py`
- [ ] `src/candidate_discovery/sources/__init__.py`
- [ ] `src/candidate_discovery/sources/base.py`
- [ ] `src/candidate_discovery/sources/ballotpedia.py`
- [ ] `src/candidate_discovery/sources/scdp.py`
- [ ] `src/candidate_discovery/sources/scgop.py`
- [ ] `src/candidate_discovery/aggregator.py`
- [ ] `src/candidate_discovery/deduplicator.py`
- [ ] `src/candidate_discovery/sheets_integration.py`
- [ ] `src/candidate_discovery/reporter.py`

**Files to Modify:**
- [ ] `src/config.py` - Add discovery configuration
- [ ] `src/monitor.py` - Add discovery step
- [ ] `requirements.txt` - Add dependencies

---

*Document generated by SC Ethics Monitor Design System*
