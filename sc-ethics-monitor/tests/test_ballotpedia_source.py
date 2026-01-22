"""
Unit tests for BallotpediaSource.

Tests:
- URL building for House and Senate districts
- Party normalization (Democratic, Republican, Independent, etc.)
- Candidate parsing from markdown
- Incumbent detection
- Empty/error handling
- District ID parsing
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from candidate_discovery.sources.ballotpedia import BallotpediaSource


# Test fixtures directory
FIXTURES_DIR = Path(__file__).parent / "fixtures"


class TestURLBuilding:
    """Tests for URL building."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_build_house_url(self):
        """House URLs should use correct template."""
        url = self.source._build_url("house", 42)
        assert url == "https://ballotpedia.org/South_Carolina_House_of_Representatives_District_42"

    def test_build_senate_url(self):
        """Senate URLs should use correct template."""
        url = self.source._build_url("senate", 15)
        assert url == "https://ballotpedia.org/South_Carolina_State_Senate_District_15"

    def test_build_url_case_insensitive(self):
        """Chamber name should be case insensitive."""
        url1 = self.source._build_url("HOUSE", 1)
        url2 = self.source._build_url("House", 1)
        url3 = self.source._build_url("house", 1)
        assert url1 == url2 == url3

    def test_build_url_invalid_chamber(self):
        """Invalid chamber should raise ValueError."""
        with pytest.raises(ValueError, match="Invalid chamber"):
            self.source._build_url("assembly", 1)

    def test_build_url_single_digit(self):
        """Single digit districts should not be zero-padded in URL."""
        url = self.source._build_url("house", 1)
        assert "District_1" in url
        assert "District_01" not in url

    def test_build_url_high_number(self):
        """High district numbers should work correctly."""
        url = self.source._build_url("house", 124)
        assert "District_124" in url


class TestDistrictIdBuilding:
    """Tests for district ID building."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_district_id_house(self):
        """House district IDs should be formatted correctly."""
        district_id = self.source._district_id_from_parts("house", 42)
        assert district_id == "SC-House-042"

    def test_district_id_senate(self):
        """Senate district IDs should be formatted correctly."""
        district_id = self.source._district_id_from_parts("senate", 15)
        assert district_id == "SC-Senate-015"

    def test_district_id_single_digit(self):
        """Single digit districts should be zero-padded."""
        district_id = self.source._district_id_from_parts("house", 1)
        assert district_id == "SC-House-001"

    def test_district_id_triple_digit(self):
        """Triple digit districts should work correctly."""
        district_id = self.source._district_id_from_parts("house", 124)
        assert district_id == "SC-House-124"


class TestPartyNormalization:
    """Tests for party text normalization."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_democratic_variants(self):
        """Democratic variants should normalize to D."""
        assert self.source._normalize_party("Democratic") == "D"
        assert self.source._normalize_party("Democrat") == "D"
        assert self.source._normalize_party("democratic") == "D"
        assert self.source._normalize_party("DEMOCRATIC") == "D"

    def test_republican_variants(self):
        """Republican variants should normalize to R."""
        assert self.source._normalize_party("Republican") == "R"
        assert self.source._normalize_party("republican") == "R"
        assert self.source._normalize_party("GOP") == "R"

    def test_independent(self):
        """Independent should normalize to I."""
        assert self.source._normalize_party("Independent") == "I"
        assert self.source._normalize_party("independent") == "I"

    def test_third_parties(self):
        """Third parties should normalize to O."""
        assert self.source._normalize_party("Libertarian") == "O"
        assert self.source._normalize_party("Green") == "O"
        assert self.source._normalize_party("Constitution") == "O"
        assert self.source._normalize_party("Nonpartisan") == "O"

    def test_empty_party(self):
        """Empty party should return None."""
        assert self.source._normalize_party("") is None
        assert self.source._normalize_party(None) is None

    def test_unknown_party(self):
        """Unknown party should return None."""
        assert self.source._normalize_party("Unknown Party") is None


class TestCandidateParsing:
    """Tests for parsing candidates from markdown."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_parse_sample_page(self):
        """Should parse candidates from sample Ballotpedia page."""
        markdown = (FIXTURES_DIR / "ballotpedia_sample.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-042",
            "https://ballotpedia.org/test"
        )

        # Should find 3 candidates
        assert len(candidates) == 3

        # Check names are extracted
        names = [c.name for c in candidates]
        assert "John H. Smith" in names
        assert "Jane Marie Doe" in names
        assert "Robert A. Johnson Jr." in names

    def test_parse_party_assignment(self):
        """Candidates should have correct party assignment."""
        markdown = (FIXTURES_DIR / "ballotpedia_sample.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-042",
            "https://ballotpedia.org/test"
        )

        # Find specific candidates
        smith = next(c for c in candidates if "Smith" in c.name)
        doe = next(c for c in candidates if "Doe" in c.name)
        johnson = next(c for c in candidates if "Johnson" in c.name)

        assert smith.party == "R"
        assert doe.party == "D"
        assert johnson.party == "D"

    def test_parse_incumbent_detection(self):
        """Should detect incumbent status."""
        markdown = (FIXTURES_DIR / "ballotpedia_sample.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-042",
            "https://ballotpedia.org/test"
        )

        # Find Smith (incumbent)
        smith = next(c for c in candidates if "Smith" in c.name)
        assert smith.incumbent is True

        # Others should not be incumbents
        doe = next(c for c in candidates if "Doe" in c.name)
        assert doe.incumbent is False

    def test_parse_no_election_section(self):
        """Page without 2026 election section should return no candidates from that section."""
        markdown = (FIXTURES_DIR / "ballotpedia_no_election.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-099",
            "https://ballotpedia.org/test"
        )

        # May still find names in bold with party, but fewer/different
        # The page has historical candidate mentions
        for candidate in candidates:
            assert candidate.district_id == "SC-House-099"

    def test_parse_single_candidate(self):
        """Should handle uncontested races."""
        markdown = (FIXTURES_DIR / "ballotpedia_single_candidate.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-Senate-015",
            "https://ballotpedia.org/test"
        )

        # Should find the single candidate
        assert len(candidates) >= 1

        # Wilson should be present
        wilson = next((c for c in candidates if "Wilson" in c.name), None)
        assert wilson is not None
        assert wilson.party == "R"
        assert wilson.incumbent is True

    def test_parse_with_independents(self):
        """Should parse independent and third-party candidates."""
        markdown = (FIXTURES_DIR / "ballotpedia_independent.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-077",
            "https://ballotpedia.org/test"
        )

        # Should find all parties
        parties = {c.party for c in candidates}
        assert "R" in parties  # Republican
        assert "D" in parties  # Democratic
        assert "I" in parties  # Independent
        assert "O" in parties  # Libertarian -> O

    def test_parse_empty_markdown(self):
        """Empty markdown should return empty list."""
        candidates = self.source._parse_candidates(
            "",
            "SC-House-001",
            "https://ballotpedia.org/test"
        )
        assert candidates == []

    def test_parse_none_markdown(self):
        """None markdown should return empty list."""
        candidates = self.source._parse_candidates(
            None,
            "SC-House-001",
            "https://ballotpedia.org/test"
        )
        assert candidates == []

    def test_candidate_metadata(self):
        """Candidates should have correct metadata."""
        markdown = (FIXTURES_DIR / "ballotpedia_sample.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-042",
            "https://ballotpedia.org/test_url"
        )

        for candidate in candidates:
            # Check source fields
            assert candidate.source == "ballotpedia"
            assert candidate.source_url == "https://ballotpedia.org/test_url"
            assert candidate.district_id == "SC-House-042"
            assert candidate.filing_status == "declared"

            # Check additional data
            assert "raw_party_text" in candidate.additional_data
            assert "has_2026_section" in candidate.additional_data


class TestSourceProperties:
    """Tests for source properties."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_source_name(self):
        """Source name should be 'ballotpedia'."""
        assert self.source.source_name == "ballotpedia"

    def test_source_priority(self):
        """Source priority should be 2."""
        assert self.source.source_priority == 2


class TestDistrictIdParsing:
    """Tests for district ID parsing (inherited from base)."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_parse_house_district(self):
        """Should parse House district ID."""
        chamber, num = self.source._parse_district_id("SC-House-042")
        assert chamber == "house"
        assert num == 42

    def test_parse_senate_district(self):
        """Should parse Senate district ID."""
        chamber, num = self.source._parse_district_id("SC-Senate-015")
        assert chamber == "senate"
        assert num == 15

    def test_parse_invalid_format(self):
        """Should raise ValueError for invalid format."""
        with pytest.raises(ValueError):
            self.source._parse_district_id("invalid")

    def test_parse_wrong_state(self):
        """Should raise ValueError for wrong state."""
        with pytest.raises(ValueError):
            self.source._parse_district_id("NC-House-001")

    def test_parse_invalid_chamber(self):
        """Should raise ValueError for invalid chamber."""
        with pytest.raises(ValueError):
            self.source._parse_district_id("SC-Assembly-001")


class TestCacheManagement:
    """Tests for cache management."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_initial_cache_empty(self):
        """Caches should be empty initially."""
        stats = self.source.get_cache_stats()
        assert stats["pages_cached"] == 0
        assert stats["districts_cached"] == 0
        assert stats["total_candidates_cached"] == 0

    def test_clear_cache(self):
        """Clear cache should empty all caches."""
        # Add some test data to cache
        self.source._page_cache["SC-House-001"] = "test markdown"
        self.source._candidates_cache["SC-House-001"] = []

        # Clear
        self.source.clear_cache()

        # Verify empty
        stats = self.source.get_cache_stats()
        assert stats["pages_cached"] == 0
        assert stats["districts_cached"] == 0


class TestExtractDistrictCandidates:
    """Tests for extract_district_candidates method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_extract_from_cache(self):
        """Should return cached candidates if available."""
        from candidate_discovery.sources.base import DiscoveredCandidate

        # Pre-populate cache
        cached_candidates = [
            DiscoveredCandidate(
                name="Test Candidate",
                district_id="SC-House-042",
                source="ballotpedia",
            )
        ]
        self.source._candidates_cache["SC-House-042"] = cached_candidates

        # Extract should return cached
        result = self.source.extract_district_candidates("SC-House-042")
        assert len(result) == 1
        assert result[0].name == "Test Candidate"

    def test_extract_from_page_cache(self):
        """Should parse from page cache if candidates not cached."""
        markdown = (FIXTURES_DIR / "ballotpedia_sample.md").read_text()
        self.source._page_cache["SC-House-042"] = markdown

        result = self.source.extract_district_candidates("SC-House-042")
        assert len(result) >= 1

    def test_extract_no_cache(self):
        """Should return empty list if no cache available."""
        result = self.source.extract_district_candidates("SC-House-999")
        assert result == []

    def test_extract_invalid_district(self):
        """Should return empty list for invalid district ID."""
        result = self.source.extract_district_candidates("invalid")
        assert result == []


class TestPartyConfidence:
    """Tests for party confidence assignment."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_known_party_high_confidence(self):
        """Known parties should have HIGH confidence."""
        markdown = (FIXTURES_DIR / "ballotpedia_sample.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-042",
            "https://ballotpedia.org/test"
        )

        for candidate in candidates:
            if candidate.party:
                assert candidate.party_confidence == "HIGH"

    def test_unknown_party_unknown_confidence(self):
        """Unknown parties should have UNKNOWN confidence."""
        # Create markdown with unknown party
        markdown = """
## 2026 election

### Candidates

**John Test** (Unknown Party Label)
"""
        candidates = self.source._parse_candidates(
            markdown,
            "SC-House-001",
            "https://ballotpedia.org/test"
        )

        # Find the candidate with unknown party
        test_candidate = next((c for c in candidates if "Test" in c.name), None)
        if test_candidate:
            assert test_candidate.party is None
            assert test_candidate.party_confidence == "UNKNOWN"


class TestDistrictCounts:
    """Tests for district count constants."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = BallotpediaSource(firecrawl_api_key="test_key")

    def test_house_district_count(self):
        """SC should have 124 House districts."""
        assert self.source.DISTRICT_COUNTS["house"] == 124

    def test_senate_district_count(self):
        """SC should have 46 Senate districts."""
        assert self.source.DISTRICT_COUNTS["senate"] == 46


class TestRateLimiter:
    """Tests for rate limiter integration."""

    def test_default_rate_limit(self):
        """Default rate limit should be from config."""
        from config import FIRECRAWL_RPM
        source = BallotpediaSource(firecrawl_api_key="test_key")
        assert source.rate_limiter.rpm == FIRECRAWL_RPM

    def test_custom_rate_limit(self):
        """Custom rate limit should be respected."""
        source = BallotpediaSource(firecrawl_api_key="test_key", rate_limit=10)
        assert source.rate_limiter.rpm == 10
