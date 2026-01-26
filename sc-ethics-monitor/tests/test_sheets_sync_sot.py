"""
Unit tests for Source of Truth sync functionality in SheetsSync.

Tests:
- District ID parsing
- Party normalization
- Priority tier calculation
- Candidate sorting
- SOT row building
- Incumbent filtering
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest


class TestParseDistrictId:
    """Tests for _parse_district_id method."""

    def setup_method(self):
        """Set up test fixtures with mocked dependencies."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_parse_district_id_house(self):
        """SC-House-042 should return ('House', 42)."""
        chamber, number = self.sync._parse_district_id("SC-House-042")
        assert chamber == "House"
        assert number == 42

    def test_parse_district_id_senate(self):
        """SC-Senate-007 should return ('Senate', 7)."""
        chamber, number = self.sync._parse_district_id("SC-Senate-007")
        assert chamber == "Senate"
        assert number == 7

    def test_parse_district_id_house_single_digit(self):
        """SC-House-001 should return ('House', 1)."""
        chamber, number = self.sync._parse_district_id("SC-House-001")
        assert chamber == "House"
        assert number == 1

    def test_parse_district_id_senate_double_digit(self):
        """SC-Senate-046 should return ('Senate', 46)."""
        chamber, number = self.sync._parse_district_id("SC-Senate-046")
        assert chamber == "Senate"
        assert number == 46

    def test_parse_district_id_invalid_prefix(self):
        """Invalid prefix should return (None, None)."""
        chamber, number = self.sync._parse_district_id("NC-House-001")
        assert chamber is None
        assert number is None

    def test_parse_district_id_empty(self):
        """Empty string should return (None, None)."""
        chamber, number = self.sync._parse_district_id("")
        assert chamber is None
        assert number is None

    def test_parse_district_id_none(self):
        """None should return (None, None)."""
        chamber, number = self.sync._parse_district_id(None)
        assert chamber is None
        assert number is None

    def test_parse_district_id_wrong_format(self):
        """Wrong format should return (None, None)."""
        chamber, number = self.sync._parse_district_id("SC-House")
        assert chamber is None
        assert number is None


class TestNormalizeParty:
    """Tests for _normalize_party method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_normalize_party_d(self):
        """Single 'D' should return 'D'."""
        assert self.sync._normalize_party("D") == "D"

    def test_normalize_party_democrat(self):
        """'Democrat' should return 'D'."""
        assert self.sync._normalize_party("Democrat") == "D"

    def test_normalize_party_democratic(self):
        """'DEMOCRATIC' should return 'D'."""
        assert self.sync._normalize_party("DEMOCRATIC") == "D"

    def test_normalize_party_r(self):
        """Single 'R' should return 'R'."""
        assert self.sync._normalize_party("R") == "R"

    def test_normalize_party_republican(self):
        """'Republican' should return 'R'."""
        assert self.sync._normalize_party("Republican") == "R"

    def test_normalize_party_independent(self):
        """'Independent' should return 'I'."""
        assert self.sync._normalize_party("Independent") == "I"

    def test_normalize_party_i(self):
        """Single 'I' should return 'I'."""
        assert self.sync._normalize_party("I") == "I"

    def test_normalize_party_other(self):
        """'Other' should return 'O'."""
        assert self.sync._normalize_party("Other") == "O"

    def test_normalize_party_unknown_string(self):
        """Unknown party string should return '?'."""
        assert self.sync._normalize_party("Libertarian") == "?"
        assert self.sync._normalize_party("Green") == "?"
        assert self.sync._normalize_party("xyz") == "?"

    def test_normalize_party_empty(self):
        """Empty string should return '?'."""
        assert self.sync._normalize_party("") == "?"

    def test_normalize_party_none(self):
        """None should return '?'."""
        assert self.sync._normalize_party(None) == "?"

    def test_normalize_party_whitespace(self):
        """Whitespace should be trimmed before processing."""
        assert self.sync._normalize_party("  D  ") == "D"
        assert self.sync._normalize_party(" democrat ") == "D"


class TestCalculatePriorityTier:
    """Tests for _calculate_priority_tier method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_calculate_priority_tier_flip_target(self):
        """R incumbent with no D filed should be 'A - Flip Target'."""
        result = self.sync._calculate_priority_tier(
            incumbent_party="R",
            dem_count=0,
            challenger_count=1,
        )
        assert result == "A - Flip Target"

    def test_calculate_priority_tier_covered(self):
        """D filed should be 'D - Covered'."""
        result = self.sync._calculate_priority_tier(
            incumbent_party="R",
            dem_count=1,
            challenger_count=2,
        )
        assert result == "D - Covered"

    def test_calculate_priority_tier_defend(self):
        """D incumbent with no D filed should be 'B - Defend'."""
        result = self.sync._calculate_priority_tier(
            incumbent_party="D",
            dem_count=0,
            challenger_count=1,
        )
        assert result == "B - Defend"

    def test_calculate_priority_tier_competitive(self):
        """Multiple challengers with no clear picture should be 'C - Competitive'."""
        result = self.sync._calculate_priority_tier(
            incumbent_party="",  # Open seat
            dem_count=0,
            challenger_count=3,
        )
        assert result == "C - Competitive"

    def test_calculate_priority_tier_d_incumbent_d_filed(self):
        """D incumbent with D filed should be 'D - Covered'."""
        result = self.sync._calculate_priority_tier(
            incumbent_party="D",
            dem_count=1,
            challenger_count=1,
        )
        assert result == "D - Covered"


class TestSortCandidates:
    """Tests for _sort_candidates method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_sort_candidates_d_first(self):
        """Democrats should sort before Republicans."""
        candidates = [
            {"name": "Republican", "party": "R", "filed_date": "2024-01-01"},
            {"name": "Democrat", "party": "D", "filed_date": "2024-01-02"},
        ]
        result = self.sync._sort_candidates(candidates)
        assert result[0]["party"] == "D"
        assert result[1]["party"] == "R"

    def test_sort_candidates_d_before_r_before_others(self):
        """Sort order: D, then R, then others."""
        candidates = [
            {"name": "Independent", "party": "I", "filed_date": "2024-01-01"},
            {"name": "Republican", "party": "R", "filed_date": "2024-01-01"},
            {"name": "Democrat", "party": "D", "filed_date": "2024-01-01"},
        ]
        result = self.sync._sort_candidates(candidates)
        assert result[0]["party"] == "D"
        assert result[1]["party"] == "R"
        assert result[2]["party"] == "I"

    def test_sort_candidates_same_party_by_date(self):
        """Same party candidates should sort by filed date (earliest first)."""
        candidates = [
            {"name": "Late D", "party": "D", "filed_date": "2024-02-01"},
            {"name": "Early D", "party": "D", "filed_date": "2024-01-01"},
        ]
        result = self.sync._sort_candidates(candidates)
        assert result[0]["name"] == "Early D"
        assert result[1]["name"] == "Late D"

    def test_sort_candidates_empty_list(self):
        """Empty list should return empty list."""
        result = self.sync._sort_candidates([])
        assert result == []

    def test_sort_candidates_unknown_party(self):
        """Unknown party ('?') should sort after R."""
        candidates = [
            {"name": "Unknown", "party": "?", "filed_date": "2024-01-01"},
            {"name": "Republican", "party": "R", "filed_date": "2024-01-01"},
        ]
        result = self.sync._sort_candidates(candidates)
        assert result[0]["party"] == "R"
        assert result[1]["party"] == "?"


class TestBuildSotRowData:
    """Tests for _build_sot_row_data method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_build_sot_row_19_columns(self):
        """Should return exactly 19 values (N through AF)."""
        cand1 = {"name": "John Doe", "party": "D", "filed_date": "2024-01-01", "ethics_url": "http://example.com/1"}
        cand2 = {"name": "Jane Smith", "party": "R", "filed_date": "2024-01-02", "ethics_url": "http://example.com/2"}
        cand3 = None

        result = self.sync._build_sot_row_data(
            dem_filed="Y",
            cand1=cand1,
            cand2=cand2,
            cand3=cand3,
            last_updated="2024-01-15 10:00 UTC"
        )

        assert len(result) == 19

    def test_build_sot_row_spacers_empty(self):
        """Spacer columns (indices 1, 6, 11, 16) should be empty strings."""
        cand1 = {"name": "Test", "party": "D", "filed_date": "2024-01-01", "ethics_url": "http://x.com"}

        result = self.sync._build_sot_row_data(
            dem_filed="Y",
            cand1=cand1,
            cand2=None,
            cand3=None,
            last_updated="2024-01-15"
        )

        # Spacers are at indices: 1 (O), 6 (T), 11 (Y), 16 (AD)
        assert result[1] == ""   # O - spacer after dem_filed
        assert result[6] == ""   # T - spacer after cand1
        assert result[11] == ""  # Y - spacer after cand2
        assert result[16] == ""  # AD - spacer after cand3

    def test_build_sot_row_dem_filed_position(self):
        """dem_filed should be at index 0 (column N)."""
        result = self.sync._build_sot_row_data(
            dem_filed="Y",
            cand1=None,
            cand2=None,
            cand3=None,
            last_updated=""
        )

        assert result[0] == "Y"

    def test_build_sot_row_last_updated_position(self):
        """last_updated should be at index 18 (column AF)."""
        result = self.sync._build_sot_row_data(
            dem_filed="N",
            cand1=None,
            cand2=None,
            cand3=None,
            last_updated="2024-01-15 10:00 UTC"
        )

        assert result[18] == "2024-01-15 10:00 UTC"

    def test_build_sot_row_protected_column_empty(self):
        """Protected column AE (index 17) should be empty string."""
        result = self.sync._build_sot_row_data(
            dem_filed="N",
            cand1={"name": "Test", "party": "D", "filed_date": "", "ethics_url": ""},
            cand2=None,
            cand3=None,
            last_updated=""
        )

        # Index 17 is AE (Bench/Potential) - should always be empty
        assert result[17] == ""

    def test_build_sot_row_cand1_positions(self):
        """Cand1 data should be at correct positions (P, Q, R, S)."""
        cand1 = {
            "name": "John Doe",
            "party": "D",
            "filed_date": "2024-01-15",
            "ethics_url": "http://ethics.sc.gov/1"
        }

        result = self.sync._build_sot_row_data(
            dem_filed="Y",
            cand1=cand1,
            cand2=None,
            cand3=None,
            last_updated=""
        )

        # Cand1 starts at index 2 (P)
        assert result[2] == "John Doe"      # P - name
        assert result[3] == "D"             # Q - party
        assert result[4] == "2024-01-15"    # R - date
        assert result[5] == "http://ethics.sc.gov/1"  # S - URL

    def test_build_sot_row_null_candidate(self):
        """Null candidate should produce empty strings."""
        result = self.sync._build_sot_row_data(
            dem_filed="N",
            cand1=None,
            cand2=None,
            cand3=None,
            last_updated=""
        )

        # Cand1 positions (2-5) should be empty
        assert result[2] == ""
        assert result[3] == ""
        assert result[4] == ""
        assert result[5] == ""


class TestSyncToSourceOfTruth:
    """Tests for sync_to_source_of_truth method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")
            self.sync.spreadsheet = MagicMock()

    def test_sync_skips_incumbents(self):
        """Incumbents should not appear in challenger slots."""
        # Set up mock SOT worksheet
        mock_sot = MagicMock()
        mock_sot.id = 12345
        mock_sot.get_all_values.return_value = [
            ["Chamber", "District", "..."],  # Header
            ["House", "42", "..."],          # District row
        ]
        mock_sot.update = MagicMock()

        self.sync.spreadsheet.worksheet.return_value = mock_sot

        # Provide candidates including an incumbent
        candidates = {
            "INC001": {
                "district_id": "SC-House-042",
                "candidate_name": "Incumbent Smith",
                "party": "R",
                "filed_date": "2024-01-01",
                "ethics_url": "",
                "is_incumbent": True,  # This is an incumbent
            },
            "CHAL001": {
                "district_id": "SC-House-042",
                "candidate_name": "Challenger Jones",
                "party": "D",
                "filed_date": "2024-01-02",
                "ethics_url": "",
                "is_incumbent": False,  # This is a challenger
            },
        }

        result = self.sync.sync_to_source_of_truth(candidates)

        # Should have 1 dem candidate (the challenger)
        assert result["dem_candidates"] == 1
        # Should have 0 rep candidates (incumbent was skipped)
        assert result["rep_candidates"] == 0

    def test_sync_counts_parties_correctly(self):
        """Should count D, R, and other parties separately."""
        mock_sot = MagicMock()
        mock_sot.id = 12345
        mock_sot.get_all_values.return_value = [
            ["Chamber", "District"],
            ["House", "1"],
        ]
        mock_sot.update = MagicMock()

        self.sync.spreadsheet.worksheet.return_value = mock_sot

        candidates = {
            "C1": {"district_id": "SC-House-001", "candidate_name": "D1", "party": "D",
                   "filed_date": "", "ethics_url": "", "is_incumbent": False},
            "C2": {"district_id": "SC-House-001", "candidate_name": "D2", "party": "Democrat",
                   "filed_date": "", "ethics_url": "", "is_incumbent": False},
            "C3": {"district_id": "SC-House-001", "candidate_name": "R1", "party": "R",
                   "filed_date": "", "ethics_url": "", "is_incumbent": False},
            "C4": {"district_id": "SC-House-001", "candidate_name": "I1", "party": "I",
                   "filed_date": "", "ethics_url": "", "is_incumbent": False},
        }

        result = self.sync.sync_to_source_of_truth(candidates)

        assert result["dem_candidates"] == 2
        assert result["rep_candidates"] == 1
        assert result["other_candidates"] == 1

    def test_sync_handles_missing_sot_tab(self):
        """Should return error if Source of Truth tab not found."""
        from gspread import WorksheetNotFound
        self.sync.spreadsheet.worksheet.side_effect = WorksheetNotFound("Source of Truth")

        result = self.sync.sync_to_source_of_truth({})

        assert len(result["errors"]) > 0
        assert "Source of Truth" in str(result["errors"][0])


class TestExtractUrlFromHyperlink:
    """Tests for _extract_url_from_hyperlink method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_extract_url_from_hyperlink_formula(self):
        """Should extract URL from HYPERLINK formula."""
        formula = '=HYPERLINK("https://ethics.sc.gov/report/123", "View Filing")'
        result = self.sync._extract_url_from_hyperlink(formula)
        assert result == "https://ethics.sc.gov/report/123"

    def test_extract_url_plain_url(self):
        """Plain URL should be returned as-is."""
        url = "https://example.com/test"
        result = self.sync._extract_url_from_hyperlink(url)
        assert result == url

    def test_extract_url_empty_string(self):
        """Empty string should return empty string."""
        result = self.sync._extract_url_from_hyperlink("")
        assert result == ""

    def test_extract_url_none(self):
        """None should return empty string."""
        result = self.sync._extract_url_from_hyperlink(None)
        assert result == ""


class TestIsRecentFiling:
    """Tests for _is_recent_filing method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheets_sync.Credentials"), \
             patch("src.sheets_sync.gspread"):
            from src.sheets_sync import SheetsSync
            self.sync = SheetsSync("fake_credentials.json")

    def test_is_recent_filing_empty_date(self):
        """Empty date should return False."""
        assert self.sync._is_recent_filing("") is False

    def test_is_recent_filing_none_date(self):
        """None date should return False."""
        assert self.sync._is_recent_filing(None) is False

    def test_is_recent_filing_invalid_format(self):
        """Invalid date format should return False."""
        assert self.sync._is_recent_filing("not-a-date") is False
