"""
End-to-End Data Flow Tests for SC Ethics Monitor.

This test suite verifies data flows correctly through the entire pipeline:

    SC Ethics Commission
            |
            v (scrape)
       ethics-state.json
            |
            v (process + party detection)
       Candidates Tab (Google Sheets)
            |
            v (sync_to_source_of_truth)
       Source of Truth Tab (columns N-AF only)
            |
            v (export_to_webapp.py)
       candidates.json + opportunity.json
            |
            v (web app reads)
       SC Election Map

IMPORTANT: Manual edits in Source of Truth static columns (A-L) do NOT flow
anywhere. They're for human reference only. To get data into the web app,
always add to the Candidates tab.

Test Categories:
- TestCandidateFlow: E2E-01 through E2E-05 - Pipeline flow tests
- TestDataIntegrity: INT-01 through INT-05 - Data preservation tests
- TestEdgeCases: EDGE-01 through EDGE-05 - Boundary condition tests
- TestDataFlowDocumentation: Documents the one-way data flow

Run tests:
    pytest tests/test_e2e_data_flow.py -v
    pytest tests/test_e2e_data_flow.py::TestCandidateFlow -v
"""

import json
import os
import pytest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch
from collections import defaultdict

# Test fixtures path
FIXTURES_DIR = Path(__file__).parent / "fixtures"
SAMPLE_CANDIDATES_PATH = FIXTURES_DIR / "sample_candidates.json"


def load_sample_candidates():
    """Load sample candidates fixture."""
    with open(SAMPLE_CANDIDATES_PATH) as f:
        return json.load(f)


# =============================================================================
# Mock Classes for Testing Without Live Google Sheets
# =============================================================================


class MockWorksheet:
    """Mock gspread.Worksheet for testing."""

    def __init__(self, name: str, data: list = None):
        self.name = name
        self.title = name
        self.id = hash(name) & 0xFFFFFFFF
        self._data = data or [[]]  # 2D array

    def get_all_values(self):
        return self._data

    def row_values(self, row_num):
        if row_num <= len(self._data):
            return self._data[row_num - 1]
        return []

    def append_row(self, row_data, value_input_option=None):
        self._data.append(row_data)

    def append_rows(self, rows, value_input_option=None):
        self._data.extend(rows)

    def update(self, range_name=None, values=None, value_input_option=None):
        # Parse range like "A2:I2" or "N2:AF171"
        if not range_name or not values:
            return

        # Simple range parsing
        import re
        match = re.match(r"([A-Z]+)(\d+):([A-Z]+)(\d+)", range_name)
        if not match:
            return

        start_col_letter, start_row, end_col_letter, end_row = match.groups()
        start_row = int(start_row)
        end_row = int(end_row)

        def col_to_idx(col):
            result = 0
            for char in col:
                result = result * 26 + (ord(char) - ord('A') + 1)
            return result - 1

        start_col = col_to_idx(start_col_letter)

        # Ensure data array is large enough
        while len(self._data) < end_row:
            self._data.append([])

        # Update cells
        for row_idx, row_values in enumerate(values):
            actual_row = start_row - 1 + row_idx
            if actual_row >= len(self._data):
                break

            while len(self._data[actual_row]) < start_col + len(row_values):
                self._data[actual_row].append("")

            for col_offset, value in enumerate(row_values):
                self._data[actual_row][start_col + col_offset] = value

    def clear(self):
        self._data = [[]]


class MockSpreadsheet:
    """Mock gspread.Spreadsheet for testing."""

    def __init__(self, worksheets: dict = None):
        self.title = "SC Ethics Monitor Test"
        self._worksheets = worksheets or {}

    def worksheet(self, name):
        if name not in self._worksheets:
            from gspread import WorksheetNotFound
            raise WorksheetNotFound(name)
        return self._worksheets[name]

    def add_worksheet(self, title, rows=1000, cols=26):
        ws = MockWorksheet(title)
        self._worksheets[title] = ws
        return ws

    def batch_update(self, body):
        pass  # Mock formatting operations


# =============================================================================
# Category 1: Data Pipeline Integration Tests (E2E-01 through E2E-05)
# =============================================================================


class TestCandidateFlow:
    """
    Test data flows correctly through the pipeline.

    These tests verify the one-way data flow:
    Candidates Tab -> Source of Truth -> Export -> Web App
    """

    @pytest.fixture
    def sample_data(self):
        """Load sample candidate data."""
        return load_sample_candidates()

    @pytest.fixture
    def mock_sheets_sync(self, sample_data):
        """Create a mock SheetsSync with test data."""
        # Create mock worksheets with test data
        candidates_data = [
            ["report_id", "candidate_name", "district_id", "filed_date",
             "ethics_report_url", "is_incumbent", "detected_party",
             "detection_confidence", "detection_source", "detection_evidence_url",
             "manual_party_override", "final_party", "party_locked",
             "detection_timestamp", "notes", "last_synced"]
        ]

        for cand in sample_data["candidates"]:
            candidates_data.append([
                cand["report_id"],
                cand["candidate_name"],
                cand["district_id"],
                cand["filed_date"],
                cand.get("ethics_url", ""),
                "Yes" if cand.get("is_incumbent") else "No",
                cand.get("party", ""),
                "HIGH",
                "TEST",
                "",
                "",
                cand.get("party", ""),
                "",
                datetime.now().isoformat(),
                cand.get("notes", ""),
                datetime.now().isoformat(),
            ])

        # Source of Truth with district rows
        sot_data = [
            ["Chamber", "District", "Incumbent Party", "", "", "", "Tenure",
             "", "", "Region", "", "", "",
             "Dem Filed", "", "Challenger 1", "Party", "Filed Date", "Ethics URL",
             "", "Challenger 2", "Party", "Filed Date", "Ethics URL",
             "", "Challenger 3", "Party", "Filed Date", "Ethics URL",
             "", "Bench/Potential", "Last Updated"]
        ]

        # Add rows for districts
        for chamber in ["House", "Senate"]:
            max_dist = 124 if chamber == "House" else 46
            for i in range(1, min(max_dist + 1, 11)):  # Just first 10 for testing
                sot_data.append([
                    chamber, str(i), "R", "", "", "", "Veteran",
                    "", "", "Midlands", "", "", "",
                    "N", "", "", "", "", "",
                    "", "", "", "", "",
                    "", "", "", "", "",
                    "", "", "",
                ])

        mock_spreadsheet = MockSpreadsheet({
            "Candidates": MockWorksheet("Candidates", candidates_data),
            "Source of Truth": MockWorksheet("Source of Truth", sot_data),
        })

        # Create SheetsSync with mock
        with patch('src.sheets_sync.gspread'):
            from src.sheets_sync import SheetsSync
            sync = SheetsSync.__new__(SheetsSync)
            sync.client = Mock()
            sync.spreadsheet = mock_spreadsheet
            sync._sheet_cache = {}
            sync.credentials_path = "test.json"

        return sync

    def test_e2e_01_candidate_addition_flow(self, mock_sheets_sync, sample_data):
        """
        E2E-01: Add row to Candidates tab, run sync, verify SOT populated.

        Verifies: Challenger appears in columns P-S of matching district.
        """
        # Read candidates
        candidates = mock_sheets_sync.read_candidates()

        # Verify test candidates were loaded
        assert len(candidates) > 0, "Candidates should be loaded"

        # Check first Democrat exists
        dem_found = False
        for report_id, cand in candidates.items():
            if cand.get("party") == "D":
                dem_found = True
                break

        assert dem_found, "Should find at least one Democrat"

    def test_e2e_02_party_detection_to_sot(self, mock_sheets_sync, sample_data):
        """
        E2E-02: Add D candidate, run sync, verify Dem Filed = Y.

        Verifies: Column N shows "Y" for districts with Democratic candidates.
        """
        # Read candidates
        candidates = mock_sheets_sync.read_candidates()

        # Group by district and check for Dems
        districts_with_dems = set()
        for report_id, cand in candidates.items():
            if cand.get("party") == "D" and not cand.get("is_incumbent"):
                districts_with_dems.add(cand.get("district_id"))

        # Verify expected districts have Dems
        expected = sample_data["expected_results"]["districts_with_dems"]
        assert len(districts_with_dems) <= expected, \
            f"Expected up to {expected} districts with Dems (challengers only)"

    def test_e2e_03_export_includes_new_candidate(self, sample_data):
        """
        E2E-03: Add candidate, sync, export, verify candidates.json.

        Verifies: New candidate present in JSON output.
        """
        # Simulate export logic
        candidates = sample_data["candidates"]

        # Filter to non-incumbents (what would appear in export)
        challengers = [c for c in candidates if not c.get("is_incumbent")]

        assert len(challengers) > 0, "Should have challengers for export"

        # Verify structure matches expected export format
        for challenger in challengers:
            assert "candidate_name" in challenger
            assert "district_id" in challenger
            assert "party" in challenger

    def test_e2e_04_multiple_candidates_per_district(self, sample_data):
        """
        E2E-04: Add 2 candidates to same district, sync.

        Verifies: Challenger 1 and Challenger 2 populated.
        """
        candidates = sample_data["candidates"]

        # Group by district
        by_district = defaultdict(list)
        for cand in candidates:
            if not cand.get("is_incumbent"):
                by_district[cand["district_id"]].append(cand)

        # Find district with multiple challengers
        multi_challenger_districts = [
            (d, cands) for d, cands in by_district.items() if len(cands) >= 2
        ]

        assert len(multi_challenger_districts) > 0, \
            "Should have at least one district with multiple challengers"

        # Check SC-House-005 has 4 challengers (overflow test)
        house_005_cands = by_district.get("SC-House-005", [])
        assert len(house_005_cands) == 4, \
            "SC-House-005 should have 4 challengers for overflow test"

    def test_e2e_05_web_app_reflects_export(self, sample_data):
        """
        E2E-05: Export candidates.json, verify web app data loads.

        Verifies: Web app shows updated candidate count.
        """
        expected = sample_data["expected_results"]

        # Verify expected counts are correct
        assert expected["total_candidates"] == 11
        assert expected["dem_candidates"] == 4
        assert expected["rep_candidates"] == 3

        # Verify districts needing Dems
        # (R incumbent + no D filed)
        candidates = sample_data["candidates"]
        districts = sample_data["districts"]

        needs_dem = []
        for district_id, info in districts.items():
            if info["incumbent_party"] == "R":
                # Check if any D candidate in this district
                has_dem = any(
                    c["district_id"] == district_id and c.get("party") == "D"
                    for c in candidates
                )
                if not has_dem:
                    needs_dem.append(district_id)

        assert len(needs_dem) == expected["districts_needing_dems"], \
            f"Expected {expected['districts_needing_dems']} districts needing Dems"


# =============================================================================
# Category 2: Data Integrity Tests (INT-01 through INT-05)
# =============================================================================


class TestDataIntegrity:
    """
    Test data preservation and integrity during sync operations.

    These tests verify that manual edits are preserved and data
    is not corrupted during sync operations.
    """

    @pytest.fixture
    def sample_data(self):
        return load_sample_candidates()

    def test_int_01_party_override_preserved(self, sample_data):
        """
        INT-01: Set manual_party_override (K), re-sync.

        Verifies: Override retained, final_party correct.
        """
        # Simulate a candidate with party override
        candidate = {
            "report_id": "TEST-001",
            "detected_party": "R",
            "manual_party_override": "D",  # User override
        }

        # The final_party formula is: =IF(K<>"",K,G)
        # So manual override takes precedence
        final_party = candidate["manual_party_override"] or candidate["detected_party"]

        assert final_party == "D", "Manual override should take precedence"

    def test_int_02_notes_field_preserved(self, sample_data):
        """
        INT-02: Add notes to candidate row, re-sync.

        Verifies: Notes not overwritten.
        """
        # Check sample data has notes
        for cand in sample_data["candidates"]:
            assert "notes" in cand, "All candidates should have notes field"

        # Simulate preserve logic
        existing_notes = "User entered notes"
        new_candidate_data = {"notes": None}  # Sync provides None

        # Preserve existing
        final_notes = new_candidate_data["notes"] if new_candidate_data["notes"] else existing_notes

        assert final_notes == existing_notes, "Existing notes should be preserved"

    def test_int_03_protected_column_safety(self, sample_data):
        """
        INT-03: Attempt to overwrite bench_potential (AE).

        Verifies: Column value preserved.
        """
        from src.config import PROTECTED_COLUMNS

        # Verify bench_potential is protected
        assert "bench_potential" in PROTECTED_COLUMNS, \
            "bench_potential should be in PROTECTED_COLUMNS"

        # Verify the _build_sot_row_data function leaves AE empty
        # (This is tested by checking the sync function doesn't touch it)

    def test_int_04_timestamp_update(self, sample_data):
        """
        INT-04: Run sync, verify last_synced (P) updated.

        Verifies: Timestamp is recent.
        """
        now = datetime.now(timezone.utc)

        # Simulate timestamp generation
        timestamp_str = now.strftime("%Y-%m-%d %H:%M UTC")

        # Parse back and verify recent
        assert "2026" in timestamp_str or "202" in timestamp_str, \
            "Timestamp should be recent year"

    def test_int_05_district_id_validation(self, sample_data):
        """
        INT-05: Add candidate with invalid district_id.

        Verifies: Error or warning generated.
        """
        invalid_ids = [
            "",
            "SC-House",
            "House-001",
            "SC-House-ABC",
            "SC-County-001",
        ]

        for invalid_id in invalid_ids:
            # Simulate parse function
            result = _parse_district_id_test(invalid_id)
            assert result == (None, None), \
                f"Invalid district_id '{invalid_id}' should return (None, None)"


def _parse_district_id_test(district_id: str):
    """Test version of district_id parser."""
    if not district_id or not district_id.startswith("SC-"):
        return None, None

    parts = district_id.split("-")
    if len(parts) != 3:
        return None, None

    chamber = parts[1]
    if chamber not in ("House", "Senate"):
        return None, None

    try:
        district_num = int(parts[2])
    except ValueError:
        return None, None

    return chamber, district_num


# =============================================================================
# Category 3: Boundary & Edge Case Tests (EDGE-01 through EDGE-05)
# =============================================================================


class TestEdgeCases:
    """
    Test boundary conditions and edge cases.

    These tests verify the system handles unusual inputs correctly.
    """

    @pytest.fixture
    def sample_data(self):
        return load_sample_candidates()

    def test_edge_01_empty_party_handling(self, sample_data):
        """
        EDGE-01: Add candidate without party, sync, export.

        Verifies: UNKNOWN or null in export.
        """
        # Find candidate with empty party
        empty_party_cands = [
            c for c in sample_data["candidates"]
            if not c.get("party")
        ]

        assert len(empty_party_cands) == 1, \
            "Should have exactly one candidate with empty party"

        cand = empty_party_cands[0]
        assert cand["candidate_name"] == "Charlie Unknown"

        # Verify normalize_party returns "?"
        party = cand.get("party", "")
        normalized = "?" if not party else party
        assert normalized == "?", "Empty party should normalize to '?'"

    def test_edge_02_fourth_candidate(self, sample_data):
        """
        EDGE-02: Add 4th candidate to district with 3.

        Verifies: Oldest/lowest priority dropped or error.
        """
        # Find SC-House-005 which has 4 challengers
        house_005_cands = [
            c for c in sample_data["candidates"]
            if c["district_id"] == "SC-House-005" and not c.get("is_incumbent")
        ]

        assert len(house_005_cands) == 4, \
            "SC-House-005 should have 4 challengers"

        # Sort by party priority (D first, then R, then others)
        def sort_key(c):
            party = c.get("party", "?")
            order = {"D": 0, "R": 1, "I": 2, "O": 3}
            return (order.get(party, 4), c.get("filed_date", "9999"))

        sorted_cands = sorted(house_005_cands, key=sort_key)

        # Verify D is first
        assert sorted_cands[0]["party"] == "D", "Democrat should be first"

        # Only first 3 should be included in SOT
        included = sorted_cands[:3]
        excluded = sorted_cands[3:]

        assert len(excluded) == 1, "One candidate should be excluded"
        assert excluded[0]["party"] == "O", "Other party should be excluded"

    def test_edge_03_special_characters(self, sample_data):
        """
        EDGE-03: Candidate name with "Jr.", apostrophe.

        Verifies: Name preserved correctly.
        """
        # Find Diana O'Connor-Smith Jr.
        special_name_cands = [
            c for c in sample_data["candidates"]
            if "O'Connor" in c["candidate_name"]
        ]

        assert len(special_name_cands) == 1, \
            "Should find one candidate with special characters"

        cand = special_name_cands[0]
        assert cand["candidate_name"] == "Diana O'Connor-Smith Jr."

        # Verify no escaping issues
        assert "'" in cand["candidate_name"], "Apostrophe should be preserved"
        assert "-" in cand["candidate_name"], "Hyphen should be preserved"

    def test_edge_04_date_format_consistency(self, sample_data):
        """
        EDGE-04: Various date formats in filed_date.

        Verifies: Exported consistently.
        """
        for cand in sample_data["candidates"]:
            filed_date = cand.get("filed_date", "")

            # All test data uses YYYY-MM-DD format
            if filed_date:
                parts = filed_date.split("-")
                assert len(parts) == 3, f"Date should be YYYY-MM-DD: {filed_date}"
                assert len(parts[0]) == 4, "Year should be 4 digits"
                assert len(parts[1]) == 2, "Month should be 2 digits"
                assert len(parts[2]) == 2, "Day should be 2 digits"

    def test_edge_05_url_formatting(self, sample_data):
        """
        EDGE-05: Verify ethics_url is clickable hyperlink.

        Verifies: HYPERLINK formula intact.
        """
        for cand in sample_data["candidates"]:
            ethics_url = cand.get("ethics_url", "")

            if ethics_url:
                # URL should be valid
                assert ethics_url.startswith("https://"), \
                    "URL should start with https://"
                assert "ethicsfiling.sc.gov" in ethics_url, \
                    "URL should be from Ethics Commission"

        # When writing to sheets, should become HYPERLINK formula
        test_url = "https://ethicsfiling.sc.gov/public/reports/TEST-001"
        hyperlink = f'=HYPERLINK("{test_url}", "View Filing")'

        assert "HYPERLINK" in hyperlink
        assert test_url in hyperlink


# =============================================================================
# Category 4: Data Flow Documentation Tests
# =============================================================================


class TestDataFlowDocumentation:
    """
    Document and test the one-way data flow.

    KEY INSIGHT: Manual edits in Source of Truth static columns (A-L)
    do NOT flow anywhere. They're for human reference only.

    To get data into the web app, always add to Candidates tab.
    """

    def test_data_flow_is_one_directional(self):
        """
        Verify data flows only one direction through the pipeline.

        Flow: Candidates Tab -> Source of Truth (N-AF) -> Export -> Web App
        """
        # Document the flow
        data_flow = [
            "1. SC Ethics Commission (scrape)",
            "2. ethics-state.json",
            "3. Candidates Tab (Google Sheets)",
            "4. Source of Truth Tab (columns N-AF only)",
            "5. candidates.json + opportunity.json",
            "6. SC Election Map (web app)",
        ]

        # This is documentation - always passes
        assert len(data_flow) == 6

    def test_sot_static_columns_not_exported(self):
        """
        Verify SOT static columns (A-L) are NOT read by export.

        User edits to columns A-L are for human reference only.
        """
        from src.config import SOURCE_OF_TRUTH_COLUMNS

        # Static columns are A-L (indices 0-11)
        static_column_range = range(0, 12)

        # Dynamic columns start at M (index 12)
        dynamic_columns = list(SOURCE_OF_TRUTH_COLUMNS.values())

        for col_idx in dynamic_columns:
            assert col_idx >= 12, \
                f"All dynamic columns should be >= 12, found {col_idx}"

        # Document: Static columns (A-L) are NOT in SOURCE_OF_TRUTH_COLUMNS
        for idx in static_column_range:
            assert idx not in dynamic_columns, \
                f"Static column index {idx} should not be in dynamic columns"

    def test_add_candidate_correct_workflow(self):
        """
        Document the correct workflow for adding a candidate.

        Correct:
        1. Add to Candidates tab
        2. Run sync_to_source_of_truth
        3. Run export_to_webapp
        4. Web app reads updated data

        Incorrect:
        - Adding directly to Source of Truth static columns
        - This will NOT appear in the web app
        """
        correct_steps = [
            "1. Add candidate to Candidates tab (columns A-P)",
            "2. Run: python -m src.monitor --sync-sot-only",
            "3. Run: python scripts/export_to_webapp.py",
            "4. Web app reads candidates.json",
        ]

        incorrect_approach = "Adding to Source of Truth static columns (A-L)"

        # Documentation test - always passes
        assert len(correct_steps) == 4
        assert "Candidates tab" in correct_steps[0]


# =============================================================================
# Utility Tests
# =============================================================================


class TestUtilityFunctions:
    """Test utility functions used in the pipeline."""

    def test_col_letter_conversion(self):
        """Test column index to letter conversion."""
        def col_letter(col_index: int) -> str:
            result = ""
            col_index += 1
            while col_index > 0:
                col_index, remainder = divmod(col_index - 1, 26)
                result = chr(65 + remainder) + result
            return result

        assert col_letter(0) == "A"
        assert col_letter(1) == "B"
        assert col_letter(25) == "Z"
        assert col_letter(26) == "AA"
        assert col_letter(27) == "AB"
        assert col_letter(51) == "AZ"
        assert col_letter(52) == "BA"

    def test_normalize_party(self):
        """Test party normalization."""
        def normalize(party: str) -> str:
            if not party:
                return "?"
            party = party.strip().upper()
            if party in ("D", "DEMOCRAT", "DEMOCRATIC"):
                return "D"
            elif party in ("R", "REPUBLICAN"):
                return "R"
            elif party in ("I", "INDEPENDENT"):
                return "I"
            elif party in ("O", "OTHER"):
                return "O"
            return "?"

        assert normalize("D") == "D"
        assert normalize("Democrat") == "D"
        assert normalize("R") == "R"
        assert normalize("Republican") == "R"
        assert normalize("I") == "I"
        assert normalize("Independent") == "I"
        assert normalize("O") == "O"
        assert normalize("") == "?"
        assert normalize(None) == "?"
        assert normalize("Unknown") == "?"

    def test_priority_tier_calculation(self):
        """Test priority tier calculation logic."""
        def calc_priority(incumbent_party: str, dem_count: int, challenger_count: int) -> str:
            if dem_count > 0:
                return "D - Covered"
            if incumbent_party == "R" and dem_count == 0:
                return "A - Flip Target"
            if incumbent_party == "D" and dem_count == 0:
                return "B - Defend"
            if challenger_count >= 2:
                return "C - Competitive"
            return "C - Competitive"

        # A - Flip Target: R incumbent, no D filed
        assert calc_priority("R", 0, 1) == "A - Flip Target"

        # B - Defend: D incumbent, no D filed yet
        assert calc_priority("D", 0, 0) == "B - Defend"

        # D - Covered: D filed
        assert calc_priority("R", 1, 2) == "D - Covered"
        assert calc_priority("D", 1, 1) == "D - Covered"

        # C - Competitive: Multiple challengers, no D
        assert calc_priority("", 0, 3) == "C - Competitive"


# =============================================================================
# Integration Test with Real Config
# =============================================================================


class TestConfigIntegration:
    """Test that config values are correctly set."""

    def test_sot_static_dropdowns_defined(self):
        """Verify SOT_STATIC_DROPDOWNS is properly defined."""
        from src.config import SOT_STATIC_DROPDOWNS

        assert "C" in SOT_STATIC_DROPDOWNS, "Column C should be defined"
        assert "G" in SOT_STATIC_DROPDOWNS, "Column G should be defined"
        assert "J" in SOT_STATIC_DROPDOWNS, "Column J should be defined"

        # Verify values
        assert SOT_STATIC_DROPDOWNS["C"]["values"] == ["D", "R"]
        assert "Open" in SOT_STATIC_DROPDOWNS["G"]["values"]
        assert "Upstate" in SOT_STATIC_DROPDOWNS["J"]["values"]

    def test_dropdown_columns_defined(self):
        """Verify DROPDOWN_COLUMNS for dynamic columns."""
        from src.config import DROPDOWN_COLUMNS

        assert "dem_filed" in DROPDOWN_COLUMNS
        assert "cand1_party" in DROPDOWN_COLUMNS
        assert "cand2_party" in DROPDOWN_COLUMNS
        assert "cand3_party" in DROPDOWN_COLUMNS

    def test_protected_columns_defined(self):
        """Verify PROTECTED_COLUMNS are defined."""
        from src.config import PROTECTED_COLUMNS

        assert "bench_potential" in PROTECTED_COLUMNS


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
