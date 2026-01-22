"""
End-to-end integration tests for the candidate discovery pipeline.

Tests the full flow:
  sources -> aggregator -> deduplicator -> reporter -> sheets

Uses mocked external dependencies (Firecrawl, Google Sheets) to verify
data flows correctly through the entire pipeline.
"""

import asyncio
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from candidate_discovery.aggregator import CandidateAggregator, AggregationResult
from candidate_discovery.deduplicator import CandidateDeduplicator
from candidate_discovery.reporter import (
    CoverageReport,
    CoverageReporter,
    format_text_report,
    format_email_section,
    format_summary_line,
)
from candidate_discovery.sheets_integration import (
    DiscoverySheetIntegration,
    SyncResult,
)
from candidate_discovery.sources.base import (
    CandidateSource,
    DiscoveredCandidate,
    MergedCandidate,
)


# =============================================================================
# Test Fixtures and Mock Sources
# =============================================================================


class MockBallotpediaSource(CandidateSource):
    """Mock Ballotpedia source for testing."""

    def __init__(self, candidates: list[DiscoveredCandidate] = None):
        self._candidates = candidates or []

    @property
    def source_name(self) -> str:
        return "ballotpedia"

    @property
    def source_priority(self) -> int:
        return 2

    async def discover_candidates(self, chambers=None):
        return self._candidates

    def extract_district_candidates(self, district_id):
        return [c for c in self._candidates if c.district_id == district_id]


class MockSCDPSource(CandidateSource):
    """Mock SCDP source for testing."""

    def __init__(self, candidates: list[DiscoveredCandidate] = None):
        self._candidates = candidates or []

    @property
    def source_name(self) -> str:
        return "scdp"

    @property
    def source_priority(self) -> int:
        return 3

    async def discover_candidates(self, chambers=None):
        return self._candidates

    def extract_district_candidates(self, district_id):
        return [c for c in self._candidates if c.district_id == district_id]


class MockSCGOPSource(CandidateSource):
    """Mock SCGOP source for testing."""

    def __init__(self, candidates: list[DiscoveredCandidate] = None):
        self._candidates = candidates or []

    @property
    def source_name(self) -> str:
        return "scgop"

    @property
    def source_priority(self) -> int:
        return 3

    async def discover_candidates(self, chambers=None):
        return self._candidates

    def extract_district_candidates(self, district_id):
        return [c for c in self._candidates if c.district_id == district_id]


@pytest.fixture
def sample_ballotpedia_candidates():
    """Sample candidates from Ballotpedia."""
    return [
        DiscoveredCandidate(
            name="John Smith",
            district_id="SC-House-001",
            party="D",
            party_confidence="HIGH",
            source="ballotpedia",
            source_url="https://ballotpedia.org/SC_House_1",
        ),
        DiscoveredCandidate(
            name="Jane Doe",
            district_id="SC-House-002",
            party="R",
            party_confidence="HIGH",
            source="ballotpedia",
            source_url="https://ballotpedia.org/SC_House_2",
        ),
        DiscoveredCandidate(
            name="Robert Johnson",
            district_id="SC-Senate-001",
            party="D",
            party_confidence="HIGH",
            source="ballotpedia",
            source_url="https://ballotpedia.org/SC_Senate_1",
        ),
    ]


@pytest.fixture
def sample_scdp_candidates():
    """Sample candidates from SCDP."""
    return [
        DiscoveredCandidate(
            name="John H. Smith",  # Same as John Smith (dedup test)
            district_id="SC-House-001",
            party="D",
            party_confidence="HIGH",
            source="scdp",
            source_url="https://scdp.org/candidates",
        ),
        DiscoveredCandidate(
            name="Mary Williams",  # New candidate
            district_id="SC-House-003",
            party="D",
            party_confidence="HIGH",
            source="scdp",
            source_url="https://scdp.org/candidates",
        ),
    ]


@pytest.fixture
def sample_scgop_candidates():
    """Sample candidates from SCGOP."""
    return [
        DiscoveredCandidate(
            name="Jane Doe",  # Same as Ballotpedia
            district_id="SC-House-002",
            party="R",
            party_confidence="HIGH",
            source="scgop",
            source_url="https://scgop.com/candidates",
        ),
        DiscoveredCandidate(
            name="Tom Wilson",  # New candidate
            district_id="SC-House-004",
            party="R",
            party_confidence="HIGH",
            source="scgop",
            source_url="https://scgop.com/candidates",
        ),
    ]


@pytest.fixture
def mock_sheets_sync():
    """Mock SheetsSync for testing."""
    mock = MagicMock()
    mock.read_sheet_state.return_value = {}
    mock.get_all_candidates.return_value = []
    mock.add_candidate.return_value = True
    return mock


# =============================================================================
# End-to-End Pipeline Tests
# =============================================================================


class TestDiscoveryPipeline:
    """End-to-end tests for the complete discovery pipeline."""

    def test_full_pipeline_basic(
        self,
        sample_ballotpedia_candidates,
        sample_scdp_candidates,
        sample_scgop_candidates,
    ):
        """Test the full pipeline from sources through to report."""

        async def run_test():
            # Set up sources with test data
            sources = [
                MockBallotpediaSource(sample_ballotpedia_candidates),
                MockSCDPSource(sample_scdp_candidates),
                MockSCGOPSource(sample_scgop_candidates),
            ]

            # Create aggregator and run
            aggregator = CandidateAggregator(sources)
            result = await aggregator.aggregate_all(chambers=["house", "senate"])
            return result

        result = asyncio.run(run_test())

        # Verify aggregation results
        assert result.total_raw == 7  # 3 + 2 + 2
        # With deduplication: John Smith + John H. Smith = 1, Jane Doe = 1
        # So we should have 5 unique candidates
        assert result.total_deduplicated == 5

        # Verify source stats
        assert "ballotpedia" in result.successful_sources
        assert "scdp" in result.successful_sources
        assert "scgop" in result.successful_sources

        # Generate coverage report
        reporter = CoverageReporter(house_districts=124, senate_districts=46)
        coverage = reporter.generate_report(result, chambers=["house", "senate"])

        # Verify coverage metrics
        assert coverage.total_districts == 170
        # 5 districts: House 1, 2, 3, 4 and Senate 1
        assert coverage.districts_with_candidates == 5
        assert coverage.total_candidates == 5

        # Verify party breakdown
        assert coverage.candidates_by_party.get("D", 0) == 3  # John, Robert, Mary
        assert coverage.candidates_by_party.get("R", 0) == 2  # Jane, Tom

    def test_pipeline_with_source_failure(
        self,
        sample_ballotpedia_candidates,
    ):
        """Pipeline should handle source failures gracefully."""

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

        async def run_test():
            sources = [
                MockBallotpediaSource(sample_ballotpedia_candidates),
                FailingSource(),
            ]

            aggregator = CandidateAggregator(sources)
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        # Should still get candidates from working source
        assert result.total_raw == 3
        assert "ballotpedia" in result.successful_sources
        assert "failing" in result.failed_sources

    def test_pipeline_deduplication(
        self,
        sample_ballotpedia_candidates,
        sample_scdp_candidates,
    ):
        """Test that deduplication works correctly across sources."""

        async def run_test():
            sources = [
                MockBallotpediaSource(sample_ballotpedia_candidates),
                MockSCDPSource(sample_scdp_candidates),
            ]

            aggregator = CandidateAggregator(sources)
            return await aggregator.aggregate_all(chambers=["house"])

        result = asyncio.run(run_test())

        # John Smith from Ballotpedia and John H. Smith from SCDP should merge
        house_001_candidates = [
            c for c in result.candidates if c.district_id == "SC-House-001"
        ]
        assert len(house_001_candidates) == 1
        assert house_001_candidates[0].has_multiple_sources

    def test_pipeline_sheets_integration(
        self,
        sample_ballotpedia_candidates,
        mock_sheets_sync,
    ):
        """Test that discovered candidates sync to sheets correctly."""

        async def run_test():
            sources = [MockBallotpediaSource(sample_ballotpedia_candidates)]

            aggregator = CandidateAggregator(sources)
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        # Create sheets integration
        integration = DiscoverySheetIntegration(mock_sheets_sync)
        sync_result = integration.sync_discovered_candidates(result.candidates)

        # Verify sync was attempted for all candidates
        assert sync_result.total_processed == 3  # All 3 candidates
        # Since mock returns empty sheet, all should be added
        assert len(sync_result.added) == 3


# =============================================================================
# Reporter Tests
# =============================================================================


class TestCoverageReporter:
    """Tests for CoverageReporter."""

    def test_generate_report_empty(self):
        """Report with no candidates."""
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=[],
            total_raw=0,
            total_deduplicated=0,
        )

        reporter = CoverageReporter(house_districts=124, senate_districts=46)
        report = reporter.generate_report(result)

        assert report.total_districts == 170
        assert report.districts_with_candidates == 0
        assert report.coverage_percentage() == 0.0
        assert len(report.districts_without_candidates) == 170

    def test_generate_report_partial(self):
        """Report with some candidates."""
        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-001",
                party="D",
                sources=["ballotpedia"],
                source_urls={},
                source_records=[],
            ),
            MergedCandidate(
                name="Jane Doe",
                district_id="SC-House-002",
                party="R",
                sources=["ballotpedia"],
                source_urls={},
                source_records=[],
            ),
        ]

        result = AggregationResult(
            candidates=candidates,
            source_stats={
                "ballotpedia": MagicMock(success=True, candidate_count=2),
            },
            conflicts=[],
            total_raw=2,
            total_deduplicated=2,
        )

        reporter = CoverageReporter(house_districts=124, senate_districts=46)
        report = reporter.generate_report(result, chambers=["house"])

        assert report.total_districts == 124  # House only
        assert report.districts_with_candidates == 2
        assert report.coverage_percentage() == pytest.approx(2 / 124 * 100, 0.1)

    def test_generate_report_with_new_updated(self):
        """Report tracks new and updated counts."""
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=[],
            total_raw=0,
            total_deduplicated=0,
        )

        reporter = CoverageReporter()
        report = reporter.generate_report(result, new_count=5, updated_count=3)

        assert report.new_candidates_this_run == 5
        assert report.updated_candidates_this_run == 3


class TestReportFormatting:
    """Tests for report formatting functions."""

    def test_format_text_report(self):
        """Text report should be human-readable."""
        report = CoverageReport(
            total_districts=170,
            districts_with_candidates=50,
            districts_without_candidates=["SC-House-001", "SC-House-002"],
            candidates_by_party={"D": 25, "R": 20, None: 5},
            candidates_by_source={"ballotpedia": 40, "scdp": 25, "scgop": 20},
            conflicts_found=3,
            total_candidates=50,
            new_candidates_this_run=10,
            updated_candidates_this_run=5,
        )

        text = format_text_report(report)

        assert "COVERAGE REPORT" in text
        assert "50" in text  # districts_with_candidates
        assert "Democrat: 25" in text or "Democrat" in text
        assert "ballotpedia" in text
        assert "Conflicts Found" in text

    def test_format_email_section(self):
        """Email section should be valid HTML."""
        report = CoverageReport(
            total_districts=170,
            districts_with_candidates=50,
            districts_without_candidates=["SC-House-001", "SC-House-002"],
            candidates_by_party={"D": 25, "R": 20},
            candidates_by_source={"ballotpedia": 40, "scdp": 25},
            conflicts_found=0,
            total_candidates=45,
            new_candidates_this_run=10,
            updated_candidates_this_run=5,
        )

        html = format_email_section(report)

        assert "<div" in html
        assert "Coverage" in html
        assert "29.4%" in html or "29." in html  # 50/170
        assert "Democrat" in html
        assert "ballotpedia" in html

    def test_format_email_section_with_conflicts(self):
        """Email section should show conflicts when present."""
        report = CoverageReport(
            total_districts=170,
            districts_with_candidates=50,
            conflicts_found=5,
            total_candidates=45,
        )

        html = format_email_section(report)

        assert "Conflicts" in html
        assert "5" in html

    def test_format_summary_line(self):
        """Summary line should be single line."""
        report = CoverageReport(
            total_districts=170,
            districts_with_candidates=85,
            total_candidates=100,
            new_candidates_this_run=10,
            conflicts_found=2,
        )

        line = format_summary_line(report)

        assert "\n" not in line
        assert "50.0%" in line
        assert "85/170" in line
        assert "100" in line
        assert "10" in line


# =============================================================================
# Deduplicator Integration Tests
# =============================================================================


class TestDeduplicatorIntegration:
    """Tests for deduplicator in pipeline context."""

    def test_deduplicator_merges_same_person(self):
        """Deduplicator should merge same person different name formats."""
        deduplicator = CandidateDeduplicator()

        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-001",
                party="D",
                source="ballotpedia",
            ),
            DiscoveredCandidate(
                name="John H. Smith",
                district_id="SC-House-001",
                party="D",
                source="scdp",
            ),
            DiscoveredCandidate(
                name="John Smith Jr.",
                district_id="SC-House-001",
                party="D",
                source="scgop",
            ),
        ]

        merged = deduplicator.deduplicate(candidates)

        # All three should merge into one
        assert len(merged) == 1
        assert merged[0].has_multiple_sources

    def test_deduplicator_keeps_different_people(self):
        """Deduplicator should keep different people separate."""
        deduplicator = CandidateDeduplicator()

        candidates = [
            DiscoveredCandidate(
                name="John Smith",
                district_id="SC-House-001",
                party="D",
                source="ballotpedia",
            ),
            DiscoveredCandidate(
                name="Jane Doe",
                district_id="SC-House-001",
                party="R",
                source="ballotpedia",
            ),
        ]

        merged = deduplicator.deduplicate(candidates)

        assert len(merged) == 2


# =============================================================================
# Sheets Integration Tests
# =============================================================================


class TestSheetsIntegration:
    """Tests for sheets integration in pipeline context."""

    def test_sync_result_tracking(self, mock_sheets_sync):
        """SyncResult should track all operations."""
        integration = DiscoverySheetIntegration(mock_sheets_sync)

        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-001",
                party="D",
                sources=["ballotpedia"],
                source_urls={"ballotpedia": "https://example.com"},
                source_records=[],
            ),
        ]

        result = integration.sync_discovered_candidates(candidates)

        assert isinstance(result, SyncResult)
        assert result.total_processed == 1

    def test_sync_handles_locked_candidates(self, mock_sheets_sync):
        """Sync should skip locked candidates."""
        # Set up mock to return existing locked candidate
        mock_sheets_sync.read_sheet_state.return_value = {
            "existing-001": {
                "party_locked": True,
                "candidate_name": "John Smith",
                "district_id": "SC-House-001",
            },
        }
        mock_sheets_sync.get_all_candidates.return_value = [
            {
                "report_id": "existing-001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-001",
            },
        ]

        integration = DiscoverySheetIntegration(mock_sheets_sync)

        candidates = [
            MergedCandidate(
                name="John Smith",
                district_id="SC-House-001",
                party="D",
                sources=["ballotpedia"],
                source_urls={},
                source_records=[],
            ),
        ]

        result = integration.sync_discovered_candidates(candidates)

        # Should be skipped due to lock
        assert "John Smith" in result.skipped


# =============================================================================
# Performance Tests
# =============================================================================


class TestPipelinePerformance:
    """Performance tests for the pipeline."""

    def test_large_candidate_set(self):
        """Pipeline should handle large numbers of candidates."""
        # Generate 500 candidates across 170 districts
        candidates = []
        for i in range(500):
            district_num = (i % 170) + 1
            chamber = "House" if district_num <= 124 else "Senate"
            actual_num = district_num if chamber == "House" else district_num - 124

            candidates.append(
                DiscoveredCandidate(
                    name=f"Candidate {i}",
                    district_id=f"SC-{chamber}-{actual_num:03d}",
                    party="D" if i % 2 == 0 else "R",
                    party_confidence="HIGH",
                    source="ballotpedia",
                )
            )

        async def run_test():
            source = MockBallotpediaSource(candidates)
            aggregator = CandidateAggregator([source])
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        # Should process all candidates
        assert result.total_raw == 500

        # Generate report
        reporter = CoverageReporter()
        report = reporter.generate_report(result)

        # Coverage should be 100% (all 170 districts covered)
        assert report.coverage_percentage() == 100.0


# =============================================================================
# Error Handling Tests
# =============================================================================


class TestPipelineErrorHandling:
    """Tests for error handling in the pipeline."""

    def test_handles_empty_sources(self):
        """Pipeline should handle empty source list."""

        async def run_test():
            aggregator = CandidateAggregator([])
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        assert result.total_raw == 0
        assert result.total_deduplicated == 0

    def test_handles_all_sources_failing(self):
        """Pipeline should handle all sources failing."""

        class AlwaysFailsSource(CandidateSource):
            @property
            def source_name(self):
                return "always_fails"

            @property
            def source_priority(self):
                return 5

            async def discover_candidates(self, chambers=None):
                raise Exception("Always fails")

            def extract_district_candidates(self, district_id):
                return []

        async def run_test():
            aggregator = CandidateAggregator([AlwaysFailsSource()])
            return await aggregator.aggregate_all()

        result = asyncio.run(run_test())

        assert result.total_raw == 0
        assert "always_fails" in result.failed_sources

    def test_reporter_handles_empty_result(self):
        """Reporter should handle empty aggregation result."""
        result = AggregationResult(
            candidates=[],
            source_stats={},
            conflicts=[],
            total_raw=0,
            total_deduplicated=0,
        )

        reporter = CoverageReporter()
        report = reporter.generate_report(result)

        assert report.coverage_percentage() == 0.0
        assert report.total_candidates == 0
