"""
Unit tests for SheetFormatter class.

Tests formatting functionality for SC Ethics Monitor Google Sheets:
- Column letter conversion
- Tab formatting (Candidates + Source of Truth only)
- Party color conditional formatting
- Zebra striping
- Column width settings
- Protected ranges
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch, call

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest


class TestColLetter:
    """Tests for _col_letter column index conversion."""

    def setup_method(self):
        """Set up test fixtures with mocked spreadsheet."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(mock_spreadsheet)

    def test_col_letter_single_letter_a(self):
        """Index 0 should return 'A'."""
        assert self.formatter._col_letter(0) == "A"

    def test_col_letter_single_letter_z(self):
        """Index 25 should return 'Z'."""
        assert self.formatter._col_letter(25) == "Z"

    def test_col_letter_single_letter_middle(self):
        """Index 12 should return 'M'."""
        assert self.formatter._col_letter(12) == "M"

    def test_col_letter_double_letter_aa(self):
        """Index 26 should return 'AA'."""
        assert self.formatter._col_letter(26) == "AA"

    def test_col_letter_double_letter_ab(self):
        """Index 27 should return 'AB'."""
        assert self.formatter._col_letter(27) == "AB"

    def test_col_letter_double_letter_az(self):
        """Index 51 should return 'AZ'."""
        assert self.formatter._col_letter(51) == "AZ"

    def test_col_letter_double_letter_ba(self):
        """Index 52 should return 'BA'."""
        assert self.formatter._col_letter(52) == "BA"

    def test_col_letter_af(self):
        """Index 31 should return 'AF' (last Source of Truth column)."""
        assert self.formatter._col_letter(31) == "AF"


class TestFormatAllTabs:
    """Tests for format_all_tabs method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

    def test_format_all_tabs_formats_two_tabs(self):
        """Should only format Candidates and Source of Truth tabs."""
        # Set up mock worksheets
        mock_candidates = MagicMock()
        mock_sot = MagicMock()

        def worksheet_side_effect(name):
            if name == "Candidates":
                return mock_candidates
            elif name == "Source of Truth":
                return mock_sot
            else:
                from gspread import WorksheetNotFound
                raise WorksheetNotFound(name)

        self.mock_spreadsheet.worksheet.side_effect = worksheet_side_effect

        # Patch the individual formatting methods
        with patch.object(self.formatter, 'format_candidates_tab') as mock_fmt_candidates, \
             patch.object(self.formatter, 'format_source_of_truth_tab') as mock_fmt_sot:

            result = self.formatter.format_all_tabs()

            # Should have called both formatters
            mock_fmt_candidates.assert_called_once_with(mock_candidates)
            mock_fmt_sot.assert_called_once_with(mock_sot)
            assert result["tabs_formatted"] == 2

    def test_format_all_tabs_skips_deprecated_tabs(self):
        """Should NOT format Districts or Race Analysis tabs."""
        mock_candidates = MagicMock()
        mock_sot = MagicMock()

        self.mock_spreadsheet.worksheet.side_effect = lambda name: {
            "Candidates": mock_candidates,
            "Source of Truth": mock_sot,
        }.get(name, MagicMock())

        with patch.object(self.formatter, 'format_candidates_tab'), \
             patch.object(self.formatter, 'format_source_of_truth_tab'), \
             patch.object(self.formatter, 'format_districts_tab') as mock_fmt_districts, \
             patch.object(self.formatter, 'format_race_analysis_tab') as mock_fmt_race:

            self.formatter.format_all_tabs()

            # Should NOT call deprecated formatters
            mock_fmt_districts.assert_not_called()
            mock_fmt_race.assert_not_called()

    def test_format_all_tabs_handles_missing_tab(self):
        """Should record error for missing tab but continue."""
        from gspread import WorksheetNotFound

        self.mock_spreadsheet.worksheet.side_effect = WorksheetNotFound("Candidates")

        result = self.formatter.format_all_tabs()

        assert result["tabs_formatted"] == 0
        assert len(result["errors"]) > 0
        assert "Tab not found: Candidates" in result["errors"]


class TestFormatCandidatesTab:
    """Tests for format_candidates_tab method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"), \
             patch("src.sheet_formatting.set_frozen") as self.mock_set_frozen, \
             patch("src.sheet_formatting.format_cell_range"), \
             patch("src.sheet_formatting.get_conditional_format_rules") as self.mock_get_rules, \
             patch("src.sheet_formatting.set_data_validation_for_cell_range"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

            # Mock the conditional format rules
            mock_rules = MagicMock()
            mock_rules.extend = MagicMock()
            mock_rules.save = MagicMock()
            self.mock_get_rules.return_value = mock_rules

    def test_format_candidates_freezes_header(self):
        """Should freeze the header row."""
        mock_worksheet = MagicMock()

        with patch("src.sheet_formatting.set_frozen") as mock_frozen, \
             patch("src.sheet_formatting.format_cell_range"), \
             patch("src.sheet_formatting.get_conditional_format_rules") as mock_rules, \
             patch("src.sheet_formatting.set_data_validation_for_cell_range"):
            mock_rules_obj = MagicMock()
            mock_rules.return_value = mock_rules_obj

            self.formatter.format_candidates_tab(mock_worksheet)

            # Should freeze row 1
            mock_frozen.assert_called_once_with(mock_worksheet, rows=1)


class TestApplyZebraStriping:
    """Tests for apply_zebra_striping method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

    def test_apply_zebra_striping_uses_iseven(self):
        """Zebra striping should use ISEVEN(ROW()) formula."""
        mock_worksheet = MagicMock()

        with patch("src.sheet_formatting.get_conditional_format_rules") as mock_get_rules, \
             patch("src.sheet_formatting.ConditionalFormatRule") as mock_rule, \
             patch("src.sheet_formatting.BooleanRule") as mock_bool_rule, \
             patch("src.sheet_formatting.BooleanCondition") as mock_condition, \
             patch("src.sheet_formatting.GridRange"):

            mock_rules_obj = MagicMock()
            mock_get_rules.return_value = mock_rules_obj

            self.formatter.apply_zebra_striping(mock_worksheet, start_row=2, end_col="I")

            # Should create a CUSTOM_FORMULA condition with ISEVEN(ROW())
            mock_condition.assert_called_once()
            call_args = mock_condition.call_args
            assert call_args[0][0] == "CUSTOM_FORMULA"
            assert "ISEVEN(ROW())" in call_args[0][1][0]


class TestSetColumnWidths:
    """Tests for set_column_widths method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

    def test_set_column_widths_batch_request(self):
        """Should create updateDimensionProperties requests."""
        mock_worksheet = MagicMock()
        mock_worksheet.id = 12345

        widths = {0: 100, 1: 200, 2: 150}

        self.formatter.set_column_widths(mock_worksheet, widths)

        # Should call batch_update with requests
        self.mock_spreadsheet.batch_update.assert_called_once()
        call_args = self.mock_spreadsheet.batch_update.call_args[0][0]

        # Should have 3 requests
        assert len(call_args["requests"]) == 3

        # Each request should be updateDimensionProperties
        for req in call_args["requests"]:
            assert "updateDimensionProperties" in req
            props = req["updateDimensionProperties"]
            assert props["range"]["sheetId"] == 12345
            assert props["range"]["dimension"] == "COLUMNS"
            assert "pixelSize" in props["properties"]

    def test_set_column_widths_empty(self):
        """Should not call batch_update for empty widths."""
        mock_worksheet = MagicMock()

        self.formatter.set_column_widths(mock_worksheet, {})

        self.mock_spreadsheet.batch_update.assert_not_called()


class TestApplyProtectedRanges:
    """Tests for apply_protected_ranges method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

    def test_protected_ranges_warning_only(self):
        """Protected ranges should use warningOnly=True."""
        mock_candidates = MagicMock()
        mock_candidates.id = 111
        mock_sot = MagicMock()
        mock_sot.id = 222

        self.mock_spreadsheet.worksheet.side_effect = lambda name: {
            "Candidates": mock_candidates,
            "Source of Truth": mock_sot,
        }.get(name)

        # Capture all batch_update calls
        calls = []

        def capture_batch(req):
            calls.append(req)

        self.mock_spreadsheet.batch_update.side_effect = capture_batch

        self.formatter.apply_protected_ranges()

        # All protection requests should have warningOnly=True
        for call in calls:
            for req in call.get("requests", []):
                if "addProtectedRange" in req:
                    protected_range = req["addProtectedRange"]["protectedRange"]
                    assert protected_range.get("warningOnly") is True

    def test_protected_ranges_skips_race_analysis(self):
        """Should NOT try to protect deprecated Race Analysis tab."""
        from gspread import WorksheetNotFound

        mock_candidates = MagicMock()
        mock_candidates.id = 111
        mock_sot = MagicMock()
        mock_sot.id = 222

        def worksheet_side_effect(name):
            if name == "Candidates":
                return mock_candidates
            elif name == "Source of Truth":
                return mock_sot
            elif name == "Race Analysis":
                raise WorksheetNotFound("Race Analysis")
            raise WorksheetNotFound(name)

        self.mock_spreadsheet.worksheet.side_effect = worksheet_side_effect

        result = self.formatter.apply_protected_ranges()

        # Should not have errors for Race Analysis (since we don't try to access it)
        assert not any("Race Analysis" in str(e) for e in result.get("errors", []))


class TestFormatSourceOfTruthTab:
    """Tests for format_source_of_truth_tab method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

    def test_format_source_of_truth_applies_party_colors(self):
        """Should apply party conditional formatting to columns Q, V, AA."""
        mock_worksheet = MagicMock()
        mock_worksheet.id = 12345

        with patch("src.sheet_formatting.set_frozen"), \
             patch("src.sheet_formatting.format_cell_range"), \
             patch.object(self.formatter, '_add_party_conditional_formatting') as mock_party_fmt:

            self.formatter.format_source_of_truth_tab(mock_worksheet)

            # Should be called 3 times for Q (17), V (22), AA (27)
            assert mock_party_fmt.call_count == 3

            # Get the column indices from the calls
            col_indices = [call[1]["col_index"] for call in mock_party_fmt.call_args_list]
            # Q = 17 (1-based), V = 22, AA = 27
            assert 17 in col_indices
            assert 22 in col_indices
            assert 27 in col_indices


class TestCreateFilterViews:
    """Tests for create_filter_views method."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch("src.sheet_formatting.gspread"):
            from src.sheet_formatting import SheetFormatter
            self.mock_spreadsheet = MagicMock()
            self.formatter = SheetFormatter(self.mock_spreadsheet)

    def test_create_filter_views_candidates_only(self):
        """Filter views should only be created for Candidates tab."""
        mock_candidates = MagicMock()
        mock_candidates.id = 111

        self.mock_spreadsheet.worksheet.return_value = mock_candidates

        result = self.formatter.create_filter_views()

        # Should have requested filter views for Candidates
        tabs_with_filters = [fv["tab"] for fv in result.get("filter_views_requested", [])]
        assert "Candidates" in tabs_with_filters
        assert "Race Analysis" not in tabs_with_filters
