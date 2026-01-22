"""
Unit tests for CandidateDeduplicator.

Tests:
- Name normalization (Jr., middle initials, case)
- Similarity calculation (exact match, similar names, different names)
- Clustering (same person different sources, different people)
- Merge logic (priority ordering, filing status selection)
"""

import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from candidate_discovery.deduplicator import CandidateDeduplicator
from candidate_discovery.sources.base import DiscoveredCandidate


class TestNameNormalization:
    """Tests for name normalization."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_lowercase_conversion(self):
        """Names should be converted to lowercase."""
        assert self.dedup._normalize_name("John Smith") == "john smith"
        assert self.dedup._normalize_name("JANE DOE") == "jane doe"

    def test_suffix_removal_jr(self):
        """Junior suffix should be removed."""
        assert self.dedup._normalize_name("John Smith Jr.") == "john smith"
        assert self.dedup._normalize_name("John Smith Jr") == "john smith"
        assert self.dedup._normalize_name("John Smith, Jr.") == "john smith"
        assert self.dedup._normalize_name("John Smith, Jr") == "john smith"

    def test_suffix_removal_sr(self):
        """Senior suffix should be removed."""
        assert self.dedup._normalize_name("John Smith Sr.") == "john smith"
        assert self.dedup._normalize_name("John Smith Sr") == "john smith"

    def test_suffix_removal_numerals(self):
        """Roman numeral suffixes should be removed."""
        assert self.dedup._normalize_name("John Smith III") == "john smith"
        assert self.dedup._normalize_name("John Smith II") == "john smith"
        assert self.dedup._normalize_name("John Smith IV") == "john smith"

    def test_middle_initial_removal(self):
        """Middle initials should be removed."""
        assert self.dedup._normalize_name("John H. Smith") == "john smith"
        assert self.dedup._normalize_name("John A. B. Smith") == "john smith"

    def test_standalone_middle_initial(self):
        """Standalone middle initials (without period) should be removed."""
        assert self.dedup._normalize_name("John H Smith") == "john smith"

    def test_whitespace_normalization(self):
        """Extra whitespace should be collapsed."""
        assert self.dedup._normalize_name("John   Smith") == "john smith"
        assert self.dedup._normalize_name("  John Smith  ") == "john smith"

    def test_punctuation_removal(self):
        """Common punctuation should be removed."""
        assert self.dedup._normalize_name("O'Brien") == "obrien"
        assert self.dedup._normalize_name("Smith-Jones") == "smithjones"

    def test_empty_string(self):
        """Empty strings should return empty."""
        assert self.dedup._normalize_name("") == ""
        assert self.dedup._normalize_name(None) == ""


class TestSimilarityCalculation:
    """Tests for string similarity calculation."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_exact_match(self):
        """Identical strings should have similarity 1.0."""
        assert self.dedup._calculate_similarity("john smith", "john smith") == 1.0

    def test_completely_different(self):
        """Completely different strings should have low similarity."""
        similarity = self.dedup._calculate_similarity("john", "xyz")
        assert similarity < 0.3

    def test_similar_names(self):
        """Similar names should have high similarity."""
        similarity = self.dedup._calculate_similarity("john smith", "john smyth")
        assert similarity > 0.8

    def test_empty_strings(self):
        """Empty strings should return 0.0."""
        assert self.dedup._calculate_similarity("", "") == 0.0
        assert self.dedup._calculate_similarity("john", "") == 0.0
        assert self.dedup._calculate_similarity("", "john") == 0.0

    def test_nickname_variations(self):
        """Common nicknames may have moderate similarity."""
        similarity = self.dedup._calculate_similarity("robert", "bob")
        # LCS-based won't catch this - this is expected
        assert similarity < 0.5


class TestNamesMatch:
    """Tests for name matching logic."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_exact_match(self):
        """Exact names should match."""
        assert self.dedup._names_match("John Smith", "John Smith") is True

    def test_case_insensitive(self):
        """Names should match regardless of case."""
        assert self.dedup._names_match("John Smith", "JOHN SMITH") is True

    def test_with_suffix(self):
        """Names should match with/without suffix."""
        assert self.dedup._names_match("John Smith Jr.", "John Smith") is True
        assert self.dedup._names_match("John Smith", "John Smith III") is True

    def test_with_middle_initial(self):
        """Names should match with/without middle initial."""
        assert self.dedup._names_match("John H. Smith", "John Smith") is True
        assert self.dedup._names_match("John Smith", "John A. Smith") is True

    def test_different_people(self):
        """Different names should not match."""
        assert self.dedup._names_match("John Smith", "Jane Doe") is False
        assert self.dedup._names_match("John Smith", "Robert Johnson") is False

    def test_similar_last_names(self):
        """People with same last name but different first should not match."""
        # This tests that we're checking full names, not just parts
        assert self.dedup._names_match("John Smith", "Jane Smith") is False


class TestClustering:
    """Tests for candidate clustering."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_single_candidate(self):
        """Single candidate should form one cluster."""
        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
            )
        ]
        clusters = self.dedup._cluster_by_name(candidates)
        assert len(clusters) == 1
        assert len(clusters[0]) == 1

    def test_same_person_different_sources(self):
        """Same person from different sources should cluster together."""
        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
            ),
            DiscoveredCandidate(
                name="John H. Smith",
                district_id="SC-House-042",
                source="scdp",
            ),
            DiscoveredCandidate(
                name="John Smith Jr.",
                district_id="SC-House-042",
                source="scgop",
            ),
        ]
        clusters = self.dedup._cluster_by_name(candidates)
        assert len(clusters) == 1
        assert len(clusters[0]) == 3

    def test_different_people(self):
        """Different people should form separate clusters."""
        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
            ),
            DiscoveredCandidate(
                name="Jane Doe",
                district_id="SC-House-042",
                source="scdp",
            ),
        ]
        clusters = self.dedup._cluster_by_name(candidates)
        assert len(clusters) == 2

    def test_empty_list(self):
        """Empty list should return empty clusters."""
        clusters = self.dedup._cluster_by_name([])
        assert len(clusters) == 0


class TestMergeLogic:
    """Tests for cluster merging."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_source_priority_ordering(self):
        """Higher priority source should be primary."""
        cluster = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",
                party="D",
            ),
            DiscoveredCandidate(
                name="John H. Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                party="D",
            ),
        ]
        merged = self.dedup._merge_cluster(cluster)
        # Ballotpedia (priority 2) should be primary over SCDP (priority 3)
        assert merged.primary_source == "ballotpedia"
        assert merged.name == "John H. Smith"

    def test_party_from_highest_priority(self):
        """Party should come from highest priority source."""
        cluster = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",
                party="D",
                party_confidence="HIGH",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="web_search",
                party="R",
                party_confidence="LOW",
            ),
        ]
        merged = self.dedup._merge_cluster(cluster)
        assert merged.party == "D"
        assert merged.party_source == "scdp"

    def test_party_skips_null(self):
        """Party selection should skip sources without party."""
        cluster = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                party=None,
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",
                party="D",
                party_confidence="HIGH",
            ),
        ]
        merged = self.dedup._merge_cluster(cluster)
        assert merged.party == "D"
        assert merged.party_source == "scdp"

    def test_filing_status_priority(self):
        """Filing status should prefer most advanced."""
        cluster = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                filing_status="declared",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ethics_commission",
                filing_status="filed",
            ),
        ]
        merged = self.dedup._merge_cluster(cluster)
        assert merged.filing_status == "filed"

    def test_incumbent_any_source(self):
        """Incumbent should be True if any source says incumbent."""
        cluster = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                incumbent=True,
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",
                incumbent=False,
            ),
        ]
        merged = self.dedup._merge_cluster(cluster)
        assert merged.incumbent is True

    def test_sources_collected(self):
        """All sources should be collected."""
        cluster = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                source_url="https://ballotpedia.org/test",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",
                source_url="https://scdp.org/test",
            ),
        ]
        merged = self.dedup._merge_cluster(cluster)
        assert set(merged.sources) == {"ballotpedia", "scdp"}
        assert len(merged.source_urls) == 2


class TestFilingStatusSelection:
    """Tests for filing status selection."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_certified_is_highest(self):
        """Certified should be preferred."""
        assert self.dedup._best_filing_status(["certified", "filed"]) == "certified"

    def test_filed_over_declared(self):
        """Filed should be preferred over declared."""
        assert self.dedup._best_filing_status(["declared", "filed"]) == "filed"

    def test_declared_over_rumored(self):
        """Declared should be preferred over rumored."""
        assert self.dedup._best_filing_status(["rumored", "declared"]) == "declared"

    def test_empty_list(self):
        """Empty list should return unknown."""
        assert self.dedup._best_filing_status([]) == "unknown"

    def test_all_none(self):
        """All None values should return unknown."""
        assert self.dedup._best_filing_status([None, None]) == "unknown"


class TestFullDeduplication:
    """Integration tests for full deduplication pipeline."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_multiple_districts(self):
        """Candidates in different districts should not merge."""
        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-043",
                source="ballotpedia",
            ),
        ]
        merged = self.dedup.deduplicate(candidates)
        assert len(merged) == 2

    def test_full_pipeline(self):
        """Test complete deduplication pipeline."""
        candidates = [
            # District 42 - two candidates, one with duplicates
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                party="D",
            ),
            DiscoveredCandidate(
                name="John H. Smith",
                district_id="SC-House-042",
                source="scdp",
                party="D",
                filing_status="filed",
            ),
            DiscoveredCandidate(
                name="Jane Doe",
                district_id="SC-House-042",
                source="scgop",
                party="R",
            ),
            # District 43 - one candidate
            DiscoveredCandidate(
                name="Bob Johnson",
                district_id="SC-House-043",
                source="ballotpedia",
                party="R",
            ),
        ]

        merged = self.dedup.deduplicate(candidates)

        # Should have 3 merged candidates
        assert len(merged) == 3

        # Find the merged John Smith
        john = next(m for m in merged if "john" in m.name.lower())
        assert john.has_multiple_sources
        assert len(john.sources) == 2

        # Find Jane Doe
        jane = next(m for m in merged if "jane" in m.name.lower())
        assert not jane.has_multiple_sources

    def test_empty_input(self):
        """Empty input should return empty output."""
        assert self.dedup.deduplicate([]) == []


class TestSourcePriority:
    """Tests for source priority lookup."""

    def setup_method(self):
        """Set up test fixtures."""
        self.dedup = CandidateDeduplicator()

    def test_known_sources(self):
        """Known sources should return correct priority."""
        assert self.dedup._get_source_priority("ethics_commission") == 1
        assert self.dedup._get_source_priority("ballotpedia") == 2
        assert self.dedup._get_source_priority("scdp") == 3
        assert self.dedup._get_source_priority("scgop") == 3
        assert self.dedup._get_source_priority("election_commission") == 4
        assert self.dedup._get_source_priority("web_search") == 5

    def test_unknown_source(self):
        """Unknown sources should return default priority."""
        assert self.dedup._get_source_priority("unknown_source") == 10
