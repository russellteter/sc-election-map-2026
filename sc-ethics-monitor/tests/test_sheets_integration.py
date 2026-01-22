"""
Unit tests for DiscoverySheetIntegration.

Tests:
- SyncResult dataclass
- Name normalization and fuzzy matching
- Finding existing candidates in sheet
- Adding and updating candidates
- Respecting party_locked flags
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest
from candidate_discovery.sheets_integration import (
    DiscoverySheetIntegration,
    SyncResult,
)
from candidate_discovery.sources.base import MergedCandidate, DiscoveredCandidate


class TestSyncResult:
    """Tests for SyncResult dataclass."""

    def test_basic_creation(self):
        """SyncResult should be created with defaults."""
        result = SyncResult()
        assert result.added == []
        assert result.updated == []
        assert result.skipped == []
        assert result.errors == []
        assert result.timestamp is not None

    def test_total_processed(self):
        """SyncResult should calculate total processed."""
        result = SyncResult(
            added=["John Smith", "Jane Doe"],
            updated=["Bob Johnson"],
            skipped=["Alice Brown"],
        )
        assert result.total_processed == 4

    def test_success_rate(self):
        """SyncResult should calculate success rate."""
        result = SyncResult(
            added=["John Smith", "Jane Doe"],
            updated=["Bob Johnson"],
            skipped=["Alice Brown"],
        )
        # 3 out of 4 = 0.75
        assert result.success_rate == 0.75

    def test_success_rate_empty(self):
        """Success rate should be 1.0 when empty."""
        result = SyncResult()
        assert result.success_rate == 1.0

    def test_str_representation(self):
        """SyncResult should have readable string representation."""
        result = SyncResult(
            added=["A", "B"],
            updated=["C"],
            skipped=["D"],
            errors=["E"],
        )
        str_result = str(result)
        assert "2 added" in str_result
        assert "1 updated" in str_result
        assert "1 skipped" in str_result
        assert "1 errors" in str_result


class TestNameNormalization:
    """Tests for name normalization in integration."""

    def setup_method(self):
        """Set up test fixtures."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = []
        self.integration = DiscoverySheetIntegration(mock_sheets)

    def test_lowercase_conversion(self):
        """Names should be converted to lowercase."""
        assert self.integration._normalize_name("John Smith") == "john smith"
        assert self.integration._normalize_name("JANE DOE") == "jane doe"

    def test_suffix_removal(self):
        """Suffixes should be removed."""
        assert self.integration._normalize_name("John Smith Jr.") == "john smith"
        assert self.integration._normalize_name("John Smith Jr") == "john smith"
        assert self.integration._normalize_name("John Smith Sr.") == "john smith"
        assert self.integration._normalize_name("John Smith III") == "john smith"
        assert self.integration._normalize_name("John Smith, Jr.") == "john smith"

    def test_middle_initial_removal(self):
        """Middle initials should be removed."""
        assert self.integration._normalize_name("John H. Smith") == "john smith"
        assert self.integration._normalize_name("John A. B. Smith") == "john smith"

    def test_punctuation_removal(self):
        """Punctuation should be removed."""
        assert self.integration._normalize_name("O'Brien") == "obrien"
        assert self.integration._normalize_name("Smith-Jones") == "smithjones"

    def test_whitespace_normalization(self):
        """Whitespace should be normalized."""
        assert self.integration._normalize_name("John   Smith") == "john smith"
        assert self.integration._normalize_name("  John Smith  ") == "john smith"

    def test_empty_string(self):
        """Empty strings should return empty."""
        assert self.integration._normalize_name("") == ""
        assert self.integration._normalize_name(None) == ""


class TestSimilarityCalculation:
    """Tests for string similarity calculation."""

    def setup_method(self):
        """Set up test fixtures."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = []
        self.integration = DiscoverySheetIntegration(mock_sheets)

    def test_exact_match(self):
        """Identical strings should have similarity 1.0."""
        assert self.integration._calculate_similarity("john smith", "john smith") == 1.0

    def test_empty_strings(self):
        """Empty strings should return 0.0."""
        assert self.integration._calculate_similarity("", "") == 0.0
        assert self.integration._calculate_similarity("john", "") == 0.0

    def test_similar_names(self):
        """Similar names should have high similarity."""
        similarity = self.integration._calculate_similarity("john smith", "john smyth")
        assert similarity > 0.8


class TestFuzzyMatching:
    """Tests for fuzzy name matching."""

    def setup_method(self):
        """Set up test fixtures."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = []
        self.integration = DiscoverySheetIntegration(mock_sheets)

    def test_exact_match(self):
        """Exact names should match."""
        assert self.integration._names_fuzzy_match("John Smith", "John Smith") is True

    def test_case_insensitive(self):
        """Names should match regardless of case."""
        assert self.integration._names_fuzzy_match("John Smith", "JOHN SMITH") is True

    def test_with_suffix(self):
        """Names should match with/without suffix."""
        assert self.integration._names_fuzzy_match("John Smith Jr.", "John Smith") is True

    def test_with_middle_initial(self):
        """Names should match with/without middle initial."""
        assert self.integration._names_fuzzy_match("John H. Smith", "John Smith") is True

    def test_different_people(self):
        """Different names should not match."""
        assert self.integration._names_fuzzy_match("John Smith", "Jane Doe") is False


class TestBuildNameIndex:
    """Tests for building name index from sheet data."""

    def test_builds_index(self):
        """Should build index from sheet candidates."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-042",
            },
            {
                "report_id": "REP002",
                "candidate_name": "Jane Doe",
                "district_id": "SC-House-042",
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        index = integration._build_name_index({})

        assert "john smith|SC-House-042" in index
        assert "jane doe|SC-House-042" in index
        assert index["john smith|SC-House-042"] == ["REP001"]

    def test_handles_duplicates(self):
        """Should handle multiple entries for same name/district."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-042",
            },
            {
                "report_id": "REP002",
                "candidate_name": "John Smith",  # Duplicate
                "district_id": "SC-House-042",
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        index = integration._build_name_index({})

        assert len(index["john smith|SC-House-042"]) == 2


class TestFindExisting:
    """Tests for finding existing candidates."""

    def test_finds_exact_match(self):
        """Should find exact name match."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-042",
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        candidate = MergedCandidate(
            name="John Smith",
            district_id="SC-House-042",
            party="D",
            party_confidence="HIGH",
            party_source="scdp",
            sources=["scdp"],
            source_urls={},
            source_records=[],
            filing_status="declared",
            incumbent=False,
            primary_source="scdp",
        )

        name_index = integration._build_name_index({})
        result = integration._find_existing(candidate, {}, name_index)

        assert result == "REP001"

    def test_finds_fuzzy_match(self):
        """Should find fuzzy name match."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John H. Smith Jr.",
                "district_id": "SC-House-042",
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        candidate = MergedCandidate(
            name="John Smith",  # Without middle initial and suffix
            district_id="SC-House-042",
            party="D",
            party_confidence="HIGH",
            party_source="scdp",
            sources=["scdp"],
            source_urls={},
            source_records=[],
            filing_status="declared",
            incumbent=False,
            primary_source="scdp",
        )

        name_index = integration._build_name_index({})
        result = integration._find_existing(candidate, {}, name_index)

        assert result == "REP001"

    def test_no_match_different_district(self):
        """Should not match candidate in different district."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-043",  # Different district
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        candidate = MergedCandidate(
            name="John Smith",
            district_id="SC-House-042",
            party="D",
            party_confidence="HIGH",
            party_source="scdp",
            sources=["scdp"],
            source_urls={},
            source_records=[],
            filing_status="declared",
            incumbent=False,
            primary_source="scdp",
        )

        name_index = integration._build_name_index({})
        result = integration._find_existing(candidate, {}, name_index)

        assert result is None


class TestSyncDiscoveredCandidates:
    """Tests for syncing discovered candidates."""

    def test_adds_new_candidate(self):
        """Should add candidate not in sheet."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = []
        mock_sheets.read_sheet_state.return_value = {}
        integration = DiscoverySheetIntegration(mock_sheets)

        candidate = MergedCandidate(
            name="John Smith",
            district_id="SC-House-042",
            party="D",
            party_confidence="HIGH",
            party_source="scdp",
            sources=["scdp"],
            source_urls={"scdp": "https://scdp.org/test"},
            source_records=[],
            filing_status="declared",
            incumbent=False,
            primary_source="scdp",
        )

        result = integration.sync_discovered_candidates([candidate])

        assert "John Smith" in result.added
        assert len(result.updated) == 0
        mock_sheets.add_candidate.assert_called_once()

    def test_updates_existing_candidate(self):
        """Should update existing candidate without lock."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-042",
            },
        ]
        mock_sheets.read_sheet_state.return_value = {
            "REP001": {
                "party_locked": False,
                "detected_party": None,
            },
        }
        integration = DiscoverySheetIntegration(mock_sheets)

        candidate = MergedCandidate(
            name="John Smith",
            district_id="SC-House-042",
            party="D",
            party_confidence="HIGH",
            party_source="scdp",
            sources=["scdp"],
            source_urls={"scdp": "https://scdp.org/test"},
            source_records=[],
            filing_status="declared",
            incumbent=False,
            primary_source="scdp",
        )

        result = integration.sync_discovered_candidates([candidate])

        assert "John Smith" in result.updated
        assert len(result.added) == 0

    def test_skips_locked_candidate(self):
        """Should skip candidate with party_locked."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-042",
            },
        ]
        mock_sheets.read_sheet_state.return_value = {
            "REP001": {
                "party_locked": True,  # Locked
                "detected_party": "R",
            },
        }
        integration = DiscoverySheetIntegration(mock_sheets)

        candidate = MergedCandidate(
            name="John Smith",
            district_id="SC-House-042",
            party="D",  # Different party
            party_confidence="HIGH",
            party_source="scdp",
            sources=["scdp"],
            source_urls={},
            source_records=[],
            filing_status="declared",
            incumbent=False,
            primary_source="scdp",
        )

        result = integration.sync_discovered_candidates([candidate])

        assert "John Smith" in result.skipped
        assert len(result.added) == 0
        assert len(result.updated) == 0

    def test_handles_empty_list(self):
        """Should handle empty candidate list."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = []
        integration = DiscoverySheetIntegration(mock_sheets)

        result = integration.sync_discovered_candidates([])

        assert result.total_processed == 0
        mock_sheets.add_candidate.assert_not_called()


class TestGetUnmatchedCandidates:
    """Tests for finding unmatched candidates."""

    def test_returns_unmatched(self):
        """Should return candidates not in sheet."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "district_id": "SC-House-042",
            },
        ]
        mock_sheets.read_sheet_state.return_value = {}
        integration = DiscoverySheetIntegration(mock_sheets)

        candidates = [
            MergedCandidate(
                name="John Smith",  # In sheet
                district_id="SC-House-042",
                party="D",
                party_confidence="HIGH",
                party_source="scdp",
                sources=["scdp"],
                source_urls={},
                source_records=[],
                filing_status="declared",
                incumbent=False,
                primary_source="scdp",
            ),
            MergedCandidate(
                name="Jane Doe",  # Not in sheet
                district_id="SC-House-043",
                party="R",
                party_confidence="HIGH",
                party_source="scgop",
                sources=["scgop"],
                source_urls={},
                source_records=[],
                filing_status="declared",
                incumbent=False,
                primary_source="scgop",
            ),
        ]

        unmatched = integration.get_unmatched_candidates(candidates)

        assert len(unmatched) == 1
        assert unmatched[0].name == "Jane Doe"


class TestGetCandidatesNeedingParty:
    """Tests for finding candidates needing party."""

    def test_returns_candidates_without_party(self):
        """Should return candidates without final_party."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "John Smith",
                "final_party": "D",
                "party_locked": "No",
            },
            {
                "report_id": "REP002",
                "candidate_name": "Jane Doe",
                "final_party": "",  # No party
                "party_locked": "No",
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        needs_party = integration.get_candidates_needing_party()

        assert len(needs_party) == 1
        assert needs_party[0]["candidate_name"] == "Jane Doe"

    def test_excludes_locked_candidates(self):
        """Should exclude locked candidates even without party."""
        mock_sheets = MagicMock()
        mock_sheets.get_all_candidates.return_value = [
            {
                "report_id": "REP001",
                "candidate_name": "Jane Doe",
                "final_party": "",  # No party
                "party_locked": "Yes",  # But locked
            },
        ]
        integration = DiscoverySheetIntegration(mock_sheets)

        needs_party = integration.get_candidates_needing_party()

        assert len(needs_party) == 0
