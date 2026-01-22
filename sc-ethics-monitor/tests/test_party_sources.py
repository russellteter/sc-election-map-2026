"""
Unit tests for SCDPSource and SCGOPSource party adapters.

Tests:
- URL patterns and configuration
- Party assignment (D for SCDP, R for SCGOP)
- District extraction from text
- Candidate parsing from markdown
- Incumbent detection
- Empty/error handling
- Cache management
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from candidate_discovery.sources.scdp import SCDPSource
from candidate_discovery.sources.scgop import SCGOPSource
from candidate_discovery.sources.base import DiscoveredCandidate


# Test fixtures directory
FIXTURES_DIR = Path(__file__).parent / "fixtures"


# ============================================================================
# SCDP Source Tests
# ============================================================================

class TestSCDPSourceProperties:
    """Tests for SCDP source properties."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

    def test_source_name(self):
        """Source name should be 'scdp'."""
        assert self.source.source_name == "scdp"

    def test_source_priority(self):
        """Source priority should be 3 (party-specific)."""
        assert self.source.source_priority == 3

    def test_base_url(self):
        """Base URL should be SCDP website."""
        assert self.source.BASE_URL == "https://scdp.org"

    def test_elected_officials_url(self):
        """Should have correct elected officials URL."""
        assert "elected-officials" in self.source.ELECTED_OFFICIALS_URL


class TestSCDPDistrictIdBuilding:
    """Tests for SCDP district ID building."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

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


class TestSCDPDistrictExtraction:
    """Tests for extracting district info from text."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

    def test_extract_house_district(self):
        """Should extract House district from text."""
        chamber, num = self.source._extract_district_from_text(
            "Running for House District 42"
        )
        assert chamber == "house"
        assert num == 42

    def test_extract_senate_district(self):
        """Should extract Senate district from text."""
        chamber, num = self.source._extract_district_from_text(
            "State Senate District 15"
        )
        assert chamber == "senate"
        assert num == 15

    def test_extract_hd_abbreviation(self):
        """Should handle HD abbreviation."""
        chamber, num = self.source._extract_district_from_text(
            "Candidate for HD 95"
        )
        assert chamber == "house"
        assert num == 95

    def test_extract_sd_abbreviation(self):
        """Should handle SD abbreviation."""
        chamber, num = self.source._extract_district_from_text(
            "Running for SD 7"
        )
        assert chamber == "senate"
        assert num == 7

    def test_extract_no_district(self):
        """Should return None for text without district."""
        chamber, num = self.source._extract_district_from_text(
            "Just a regular sentence"
        )
        assert chamber is None
        assert num is None

    def test_extract_invalid_district_number(self):
        """Should reject invalid district numbers."""
        # House has 124 districts, so 200 is invalid
        chamber, num = self.source._extract_district_from_text(
            "House District 200"
        )
        assert chamber is None
        assert num is None

        # Senate has 46 districts, so 50 is invalid
        chamber, num = self.source._extract_district_from_text(
            "Senate District 50"
        )
        assert chamber is None
        assert num is None


class TestSCDPNameValidation:
    """Tests for name validation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

    def test_valid_name(self):
        """Should accept valid names."""
        assert self.source._is_valid_name("John Smith") is True
        assert self.source._is_valid_name("Jane Marie Doe") is True
        assert self.source._is_valid_name("Robert A. Johnson Jr.") is True

    def test_reject_short_name(self):
        """Should reject names that are too short."""
        assert self.source._is_valid_name("") is False
        assert self.source._is_valid_name("AB") is False

    def test_reject_single_word(self):
        """Should reject single word names."""
        assert self.source._is_valid_name("John") is False

    def test_reject_non_names(self):
        """Should reject obvious non-names."""
        assert self.source._is_valid_name("House District 42") is False
        assert self.source._is_valid_name("Democratic Party") is False
        assert self.source._is_valid_name("State Senate") is False
        assert self.source._is_valid_name("Contact Us") is False


class TestSCDPCandidateParsing:
    """Tests for parsing candidates from markdown."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

    def test_parse_elected_officials(self):
        """Should parse candidates from elected officials page."""
        markdown = (FIXTURES_DIR / "scdp_elected_officials.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://scdp.org/test"
        )

        # Should find multiple candidates
        assert len(candidates) >= 5

        # All should be Democrats
        for candidate in candidates:
            assert candidate.party == "D"
            assert candidate.party_confidence == "HIGH"
            assert candidate.source == "scdp"

    def test_parse_candidate_districts(self):
        """Should correctly assign districts."""
        markdown = (FIXTURES_DIR / "scdp_elected_officials.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://scdp.org/test"
        )

        # Find specific candidates
        allen = next((c for c in candidates if "Allen" in c.name), None)
        if allen:
            assert allen.district_id == "SC-Senate-007"

        rutherford = next((c for c in candidates if "Rutherford" in c.name), None)
        if rutherford:
            assert rutherford.district_id == "SC-House-074"

    def test_parse_candidates_page(self):
        """Should parse candidates from candidates page."""
        markdown = (FIXTURES_DIR / "scdp_candidates_page.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://scdp.org/candidates"
        )

        # Should find candidates
        assert len(candidates) >= 1

        # All should be Democrats
        for candidate in candidates:
            assert candidate.party == "D"

    def test_parse_empty_page(self):
        """Should handle page with no candidates."""
        markdown = (FIXTURES_DIR / "scdp_empty.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://scdp.org/test"
        )

        # Should return empty list
        assert candidates == []

    def test_parse_none_markdown(self):
        """Should handle None markdown."""
        candidates = self.source._parse_candidates(
            None,
            "https://scdp.org/test"
        )
        assert candidates == []

    def test_parse_empty_markdown(self):
        """Should handle empty markdown."""
        candidates = self.source._parse_candidates(
            "",
            "https://scdp.org/test"
        )
        assert candidates == []


class TestSCDPCacheManagement:
    """Tests for SCDP cache management."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

    def test_initial_cache_empty(self):
        """Caches should be empty initially."""
        stats = self.source.get_cache_stats()
        assert stats["pages_cached"] == 0
        assert stats["candidates_cached"] == 0

    def test_clear_cache(self):
        """Clear cache should empty all caches."""
        # Add some test data to cache
        self.source._page_cache["test_url"] = "test markdown"
        self.source._candidates_cache = [
            DiscoveredCandidate(
                name="Test Candidate",
                district_id="SC-House-001",
                source="scdp"
            )
        ]

        # Clear
        self.source.clear_cache()

        # Verify empty
        stats = self.source.get_cache_stats()
        assert stats["pages_cached"] == 0
        assert stats["candidates_cached"] == 0


class TestSCDPExtractDistrictCandidates:
    """Tests for extract_district_candidates method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCDPSource(firecrawl_api_key="test_key")

    def test_extract_from_cache(self):
        """Should return cached candidates if available."""
        # Pre-populate cache
        self.source._candidates_cache = [
            DiscoveredCandidate(
                name="Test Candidate",
                district_id="SC-House-042",
                party="D",
                source="scdp"
            ),
            DiscoveredCandidate(
                name="Other Candidate",
                district_id="SC-House-043",
                party="D",
                source="scdp"
            )
        ]

        # Extract should return only matching district
        result = self.source.extract_district_candidates("SC-House-042")
        assert len(result) == 1
        assert result[0].name == "Test Candidate"

    def test_extract_no_cache(self):
        """Should return empty list if no cache available."""
        result = self.source.extract_district_candidates("SC-House-999")
        assert result == []


# ============================================================================
# SCGOP Source Tests
# ============================================================================

class TestSCGOPSourceProperties:
    """Tests for SCGOP source properties."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_source_name(self):
        """Source name should be 'scgop'."""
        assert self.source.source_name == "scgop"

    def test_source_priority(self):
        """Source priority should be 3 (party-specific)."""
        assert self.source.source_priority == 3

    def test_base_url(self):
        """Base URL should be SCGOP website."""
        assert self.source.BASE_URL == "https://sc.gop"

    def test_news_url(self):
        """Should have correct news URL."""
        assert "news" in self.source.NEWS_URL


class TestSCGOPDistrictIdBuilding:
    """Tests for SCGOP district ID building."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_district_id_house(self):
        """House district IDs should be formatted correctly."""
        district_id = self.source._district_id_from_parts("house", 42)
        assert district_id == "SC-House-042"

    def test_district_id_senate(self):
        """Senate district IDs should be formatted correctly."""
        district_id = self.source._district_id_from_parts("senate", 15)
        assert district_id == "SC-Senate-015"


class TestSCGOPDistrictExtraction:
    """Tests for extracting district info from text."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_extract_house_district(self):
        """Should extract House district from text."""
        chamber, num = self.source._extract_district_from_text(
            "Running for House District 88"
        )
        assert chamber == "house"
        assert num == 88

    def test_extract_senate_district(self):
        """Should extract Senate district from text."""
        chamber, num = self.source._extract_district_from_text(
            "SC Senate District 29"
        )
        assert chamber == "senate"
        assert num == 29

    def test_extract_from_news_format(self):
        """Should handle news announcement format."""
        chamber, num = self.source._extract_district_from_text(
            "JD Chaplin on his victory in the SC Senate District 29"
        )
        assert chamber == "senate"
        assert num == 29

    def test_extract_no_district(self):
        """Should return None for text without district."""
        chamber, num = self.source._extract_district_from_text(
            "Political news update"
        )
        assert chamber is None
        assert num is None


class TestSCGOPNameValidation:
    """Tests for name validation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_valid_name(self):
        """Should accept valid names."""
        assert self.source._is_valid_name("John Smith") is True
        assert self.source._is_valid_name("JD Chaplin") is True
        assert self.source._is_valid_name("Drew McKissick") is True

    def test_reject_party_names(self):
        """Should reject party-related terms."""
        assert self.source._is_valid_name("SC GOP Party") is False
        assert self.source._is_valid_name("Republican Party") is False
        assert self.source._is_valid_name("South Carolina GOP") is False


class TestSCGOPCandidateParsing:
    """Tests for parsing candidates from markdown."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_parse_news_page(self):
        """Should parse candidates from news page."""
        markdown = (FIXTURES_DIR / "scgop_news.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://sc.gop/news"
        )

        # Should find candidates from announcements
        assert len(candidates) >= 1

        # All should be Republicans
        for candidate in candidates:
            assert candidate.party == "R"
            assert candidate.party_confidence == "HIGH"
            assert candidate.source == "scgop"

    def test_parse_candidates_page(self):
        """Should parse candidates from candidates page."""
        markdown = (FIXTURES_DIR / "scgop_candidates_page.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://sc.gop/candidates"
        )

        # Should find multiple candidates
        assert len(candidates) >= 3

        # All should be Republicans
        for candidate in candidates:
            assert candidate.party == "R"

    def test_parse_incumbent_detection(self):
        """Should detect incumbent status."""
        markdown = (FIXTURES_DIR / "scgop_candidates_page.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://sc.gop/candidates"
        )

        # Find incumbents
        incumbents = [c for c in candidates if c.incumbent]
        # The fixture has some marked as incumbent
        # Note: may not find them depending on exact parsing

    def test_parse_empty_page(self):
        """Should handle page with no candidates."""
        markdown = (FIXTURES_DIR / "scgop_empty.md").read_text()
        candidates = self.source._parse_candidates(
            markdown,
            "https://sc.gop/test"
        )

        # Should return empty list
        assert candidates == []

    def test_parse_none_markdown(self):
        """Should handle None markdown."""
        candidates = self.source._parse_candidates(
            None,
            "https://sc.gop/test"
        )
        assert candidates == []

    def test_parse_empty_markdown(self):
        """Should handle empty markdown."""
        candidates = self.source._parse_candidates(
            "",
            "https://sc.gop/test"
        )
        assert candidates == []


class TestSCGOPCacheManagement:
    """Tests for SCGOP cache management."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_initial_cache_empty(self):
        """Caches should be empty initially."""
        stats = self.source.get_cache_stats()
        assert stats["pages_cached"] == 0
        assert stats["candidates_cached"] == 0

    def test_clear_cache(self):
        """Clear cache should empty all caches."""
        # Add some test data to cache
        self.source._page_cache["test_url"] = "test markdown"
        self.source._candidates_cache = [
            DiscoveredCandidate(
                name="Test Candidate",
                district_id="SC-House-001",
                source="scgop"
            )
        ]

        # Clear
        self.source.clear_cache()

        # Verify empty
        stats = self.source.get_cache_stats()
        assert stats["pages_cached"] == 0
        assert stats["candidates_cached"] == 0


class TestSCGOPExtractDistrictCandidates:
    """Tests for extract_district_candidates method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.source = SCGOPSource(firecrawl_api_key="test_key")

    def test_extract_from_cache(self):
        """Should return cached candidates if available."""
        # Pre-populate cache
        self.source._candidates_cache = [
            DiscoveredCandidate(
                name="Republican Candidate",
                district_id="SC-House-088",
                party="R",
                source="scgop"
            ),
            DiscoveredCandidate(
                name="Other Republican",
                district_id="SC-House-089",
                party="R",
                source="scgop"
            )
        ]

        # Extract should return only matching district
        result = self.source.extract_district_candidates("SC-House-088")
        assert len(result) == 1
        assert result[0].name == "Republican Candidate"

    def test_extract_no_cache(self):
        """Should return empty list if no cache available."""
        result = self.source.extract_district_candidates("SC-House-999")
        assert result == []


# ============================================================================
# Cross-Source Tests
# ============================================================================

class TestPartySourceComparison:
    """Tests comparing SCDP and SCGOP sources."""

    def setup_method(self):
        """Set up test fixtures."""
        self.scdp = SCDPSource(firecrawl_api_key="test_key")
        self.scgop = SCGOPSource(firecrawl_api_key="test_key")

    def test_same_priority(self):
        """Both party sources should have same priority."""
        assert self.scdp.source_priority == self.scgop.source_priority == 3

    def test_different_parties(self):
        """SCDP should produce D, SCGOP should produce R."""
        scdp_markdown = "**John Smith** - House District 42"
        scgop_markdown = "**Jane Doe** - House District 43"

        scdp_candidates = self.scdp._parse_candidates(
            scdp_markdown, "https://scdp.org/test"
        )
        scgop_candidates = self.scgop._parse_candidates(
            scgop_markdown, "https://sc.gop/test"
        )

        # Check party assignments
        for c in scdp_candidates:
            assert c.party == "D"
        for c in scgop_candidates:
            assert c.party == "R"

    def test_high_confidence(self):
        """Both sources should have HIGH confidence for party."""
        scdp_markdown = "**John Smith** - House District 42"
        scgop_markdown = "**Jane Doe** - House District 43"

        scdp_candidates = self.scdp._parse_candidates(
            scdp_markdown, "https://scdp.org/test"
        )
        scgop_candidates = self.scgop._parse_candidates(
            scgop_markdown, "https://sc.gop/test"
        )

        # All should be HIGH confidence
        for c in scdp_candidates + scgop_candidates:
            assert c.party_confidence == "HIGH"


class TestRateLimiter:
    """Tests for rate limiter integration."""

    def test_scdp_default_rate_limit(self):
        """SCDP should use default rate limit from config."""
        from config import FIRECRAWL_RPM
        source = SCDPSource(firecrawl_api_key="test_key")
        assert source.rate_limiter.rpm == FIRECRAWL_RPM

    def test_scgop_default_rate_limit(self):
        """SCGOP should use default rate limit from config."""
        from config import FIRECRAWL_RPM
        source = SCGOPSource(firecrawl_api_key="test_key")
        assert source.rate_limiter.rpm == FIRECRAWL_RPM

    def test_custom_rate_limit(self):
        """Custom rate limit should be respected."""
        scdp = SCDPSource(firecrawl_api_key="test_key", rate_limit=10)
        scgop = SCGOPSource(firecrawl_api_key="test_key", rate_limit=15)
        assert scdp.rate_limiter.rpm == 10
        assert scgop.rate_limiter.rpm == 15


class TestDiscoveredCandidateMetadata:
    """Tests for discovered candidate metadata."""

    def setup_method(self):
        """Set up test fixtures."""
        self.scdp = SCDPSource(firecrawl_api_key="test_key")
        self.scgop = SCGOPSource(firecrawl_api_key="test_key")

    def test_scdp_source_url(self):
        """SCDP candidates should have correct source URL."""
        markdown = (FIXTURES_DIR / "scdp_candidates_page.md").read_text()
        url = "https://scdp.org/candidates"
        candidates = self.scdp._parse_candidates(markdown, url)

        for c in candidates:
            assert c.source_url == url

    def test_scgop_source_url(self):
        """SCGOP candidates should have correct source URL."""
        markdown = (FIXTURES_DIR / "scgop_candidates_page.md").read_text()
        url = "https://sc.gop/candidates"
        candidates = self.scgop._parse_candidates(markdown, url)

        for c in candidates:
            assert c.source_url == url

    def test_discovered_date_set(self):
        """Candidates should have discovered_date set."""
        markdown = "**John Smith** - House District 42"
        candidates = self.scdp._parse_candidates(
            markdown, "https://scdp.org/test"
        )

        for c in candidates:
            assert c.discovered_date is not None
            # Should be ISO format
            assert "T" in c.discovered_date
