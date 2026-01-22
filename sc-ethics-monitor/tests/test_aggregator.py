"""
Unit tests for CandidateAggregator.

Tests:
- AggregationResult and SourceResult dataclasses
- Source sorting by priority
- Aggregate all with error handling
- Conflict detection for party disagreements
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from candidate_discovery.aggregator import (
    AggregationResult,
    CandidateAggregator,
    SourceResult,
)
from candidate_discovery.sources.base import (
    CandidateSource,
    ConflictRecord,
    DiscoveredCandidate,
    MergedCandidate,
)


class MockSource(CandidateSource):
    """Mock source for testing."""

    def __init__(self, name: str, priority: int, candidates: list = None):
        self._name = name
        self._priority = priority
        self._candidates = candidates or []

    @property
    def source_name(self) -> str:
        return self._name

    @property
    def source_priority(self) -> int:
        return self._priority

    async def discover_candidates(self, chambers=None):
        return self._candidates

    def extract_district_candidates(self, district_id):
        return [c for c in self._candidates if c.district_id == district_id]


class TestSourceResult:
    """Tests for SourceResult dataclass."""

    def test_basic_creation(self):
        """SourceResult should be created with defaults."""
        result = SourceResult(
            source_name="test",
            success=True,
        )
        assert result.source_name == "test"
        assert result.success is True
        assert result.candidates == []
        assert result.error is None
        assert result.partial_coverage is False

    def test_with_candidates(self):
        """SourceResult should track candidate count."""
        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="test",
            ),
            DiscoveredCandidate(
                name="Jane Doe",
                district_id="SC-House-042",
                source="test",
            ),
        ]
        result = SourceResult(
            source_name="test",
            success=True,
            candidates=candidates,
        )
        assert result.candidate_count == 2

    def test_failed_result(self):
        """SourceResult should capture errors."""
        result = SourceResult(
            source_name="test",
            success=False,
            error="Connection timeout",
        )
        assert result.success is False
        assert result.error == "Connection timeout"
        assert result.candidate_count == 0


class TestAggregationResult:
    """Tests for AggregationResult dataclass."""

    def test_basic_creation(self):
        """AggregationResult should be created with defaults."""
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=[],
            total_raw=0,
            total_deduplicated=0,
        )
        assert result.total_raw == 0
        assert result.total_deduplicated == 0
        assert result.timestamp is not None

    def test_successful_sources(self):
        """AggregationResult should track successful sources."""
        result = AggregationResult(
            candidates=[],
            source_stats={
                "ballotpedia": SourceResult("ballotpedia", True),
                "scdp": SourceResult("scdp", False, error="Failed"),
                "scgop": SourceResult("scgop", True),
            },
            conflicts=[],
            total_raw=10,
            total_deduplicated=8,
        )
        assert set(result.successful_sources) == {"ballotpedia", "scgop"}
        assert result.failed_sources == ["scdp"]

    def test_deduplication_ratio(self):
        """AggregationResult should calculate deduplication ratio."""
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=[],
            total_raw=10,
            total_deduplicated=5,
        )
        assert result.deduplication_ratio == 0.5

    def test_deduplication_ratio_zero(self):
        """Deduplication ratio should handle zero raw candidates."""
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=[],
            total_raw=0,
            total_deduplicated=0,
        )
        assert result.deduplication_ratio == 1.0

    def test_conflict_count(self):
        """AggregationResult should count conflicts."""
        conflicts = [
            ConflictRecord(
                candidate_name="John Smith",
                district_id="SC-House-042",
                conflict_type="party",
                values=["D (scdp)", "R (scgop)"],
            ),
            ConflictRecord(
                candidate_name="Jane Doe",
                district_id="SC-House-043",
                conflict_type="party",
                values=["D (ballotpedia)", "R (web_search)"],
            ),
        ]
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=conflicts,
            total_raw=10,
            total_deduplicated=8,
        )
        assert result.conflict_count == 2


class TestCandidateAggregator:
    """Tests for CandidateAggregator class."""

    def test_source_sorting(self):
        """Sources should be sorted by priority."""
        sources = [
            MockSource("web_search", 5),
            MockSource("ballotpedia", 2),
            MockSource("scdp", 3),
            MockSource("ethics_commission", 1),
        ]
        aggregator = CandidateAggregator(sources)

        # Check ordering
        assert aggregator.sources[0].source_name == "ethics_commission"
        assert aggregator.sources[1].source_name == "ballotpedia"
        assert aggregator.sources[2].source_name == "scdp"
        assert aggregator.sources[3].source_name == "web_search"

    def test_get_source_summary(self):
        """Aggregator should provide source summary."""
        sources = [
            MockSource("ballotpedia", 2),
            MockSource("scdp", 3),
        ]
        aggregator = CandidateAggregator(sources)

        summary = aggregator.get_source_summary()
        assert summary["total_sources"] == 2
        assert len(summary["sources"]) == 2


class TestAggregateAll:
    """Tests for aggregate_all method."""

    def test_aggregate_empty_sources(self):
        """Aggregation with no sources should return empty result."""
        import asyncio

        async def run_test():
            aggregator = CandidateAggregator([])
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        assert result.total_raw == 0
        assert result.total_deduplicated == 0
        assert len(result.candidates) == 0

    def test_aggregate_single_source(self):
        """Aggregation from single source should return candidates."""
        import asyncio

        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                party="D",
            ),
            DiscoveredCandidate(
                name="Jane Doe",
                district_id="SC-House-043",
                source="ballotpedia",
                party="R",
            ),
        ]
        sources = [MockSource("ballotpedia", 2, candidates)]
        aggregator = CandidateAggregator(sources)

        async def run_test():
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        assert result.total_raw == 2
        assert result.total_deduplicated == 2
        assert "ballotpedia" in result.successful_sources

    def test_aggregate_multiple_sources(self):
        """Aggregation from multiple sources should deduplicate."""
        import asyncio

        ballotpedia_candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
                party="D",
            ),
        ]
        scdp_candidates = [
            DiscoveredCandidate(
                name="John H. Smith",  # Same person, different name format
                district_id="SC-House-042",
                source="scdp",
                party="D",
            ),
        ]
        sources = [
            MockSource("ballotpedia", 2, ballotpedia_candidates),
            MockSource("scdp", 3, scdp_candidates),
        ]
        aggregator = CandidateAggregator(sources)

        async def run_test():
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        # Should deduplicate to 1 candidate
        assert result.total_raw == 2
        assert result.total_deduplicated == 1
        assert len(result.successful_sources) == 2

    def test_aggregate_handles_source_failure(self):
        """Aggregation should handle source failures gracefully."""
        import asyncio

        class FailingSource(CandidateSource):
            @property
            def source_name(self):
                return "failing"

            @property
            def source_priority(self):
                return 5

            async def discover_candidates(self, chambers=None):
                raise Exception("Source unavailable")

            def extract_district_candidates(self, district_id):
                return []

        good_candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",
            ),
        ]

        sources = [
            MockSource("ballotpedia", 2, good_candidates),
            FailingSource(),
        ]
        aggregator = CandidateAggregator(sources)

        async def run_test():
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        # Should still have candidates from good source
        assert result.total_raw == 1
        assert "ballotpedia" in result.successful_sources
        assert "failing" in result.failed_sources


class TestConflictDetection:
    """Tests for conflict detection."""

    def setup_method(self):
        """Set up test fixtures."""
        self.aggregator = CandidateAggregator([])

    def test_no_conflicts_single_source(self):
        """Single source candidates should have no conflicts."""
        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-042",
                party="D",
                party_confidence="HIGH",
                party_source="scdp",
                sources=["scdp"],
                source_urls={},
                source_records=[
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="scdp",
                        party="D",
                    ),
                ],
                filing_status="declared",
                incumbent=False,
                primary_source="scdp",
            ),
        ]
        conflicts = self.aggregator._find_conflicts(candidates)
        assert len(conflicts) == 0

    def test_no_conflicts_matching_parties(self):
        """Multiple sources with same party should have no conflicts."""
        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-042",
                party="D",
                party_confidence="HIGH",
                party_source="scdp",
                sources=["ballotpedia", "scdp"],
                source_urls={},
                source_records=[
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="ballotpedia",
                        party="D",
                    ),
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="scdp",
                        party="D",
                    ),
                ],
                filing_status="declared",
                incumbent=False,
                primary_source="ballotpedia",
            ),
        ]
        conflicts = self.aggregator._find_conflicts(candidates)
        assert len(conflicts) == 0

    def test_detects_party_conflict(self):
        """Should detect when sources disagree on party."""
        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-042",
                party="D",
                party_confidence="HIGH",
                party_source="scdp",
                sources=["scdp", "scgop"],
                source_urls={},
                source_records=[
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="scdp",
                        party="D",
                    ),
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="scgop",
                        party="R",
                    ),
                ],
                filing_status="declared",
                incumbent=False,
                primary_source="scdp",
            ),
        ]
        conflicts = self.aggregator._find_conflicts(candidates)

        assert len(conflicts) == 1
        conflict = conflicts[0]
        assert conflict.candidate_name == "John Smith"
        assert conflict.conflict_type == "party"
        assert conflict.resolution == "D"
        assert conflict.resolution_source == "scdp"

    def test_party_sites_conflict_requires_review(self):
        """Conflicts between party sites should require review."""
        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-042",
                party="D",
                party_confidence="HIGH",
                party_source="scdp",
                sources=["scdp", "scgop"],
                source_urls={},
                source_records=[
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="scdp",
                        party="D",
                    ),
                    DiscoveredCandidate(
                        name="John Smith",
                        district_id="SC-House-042",
                        source="scgop",
                        party="R",
                    ),
                ],
                filing_status="declared",
                incumbent=False,
                primary_source="scdp",
            ),
        ]
        conflicts = self.aggregator._find_conflicts(candidates)

        assert len(conflicts) == 1
        assert conflicts[0].requires_review is True


class TestShouldFlagForReview:
    """Tests for review flag logic."""

    def setup_method(self):
        """Set up test fixtures."""
        self.aggregator = CandidateAggregator([])

    def test_both_party_sites_should_flag(self):
        """Both party sites claiming candidate should flag for review."""
        records = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",
                party="D",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scgop",
                party="R",
            ),
        ]
        assert self.aggregator._should_flag_for_review(records) is True

    def test_similar_priority_should_flag(self):
        """Similar priority sources should flag for review."""
        records = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="scdp",  # priority 3
                party="D",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ballotpedia",  # priority 2
                party="R",
            ),
        ]
        # Priority difference is 1, should flag
        assert self.aggregator._should_flag_for_review(records) is True

    def test_large_priority_gap_no_flag(self):
        """Large priority gap should not flag for review."""
        records = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="ethics_commission",  # priority 1
                party="D",
            ),
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-042",
                source="web_search",  # priority 5
                party="R",
            ),
        ]
        # Priority difference is 4, should not flag
        assert self.aggregator._should_flag_for_review(records) is False
