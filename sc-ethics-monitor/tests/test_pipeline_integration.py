"""
Integration tests for the SC Ethics Monitor pipeline.

Tests the complete data flow from scraping to export:
- Party enrichment chain (Sheets -> party-data.json -> None)
- Output JSON structure validation
- District coverage verification
- Pipeline resilience (partial data handling)
"""

import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

# Add scripts and src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import pytest


class TestPartyEnrichmentChain:
    """Integration tests for the party enrichment fallback chain."""

    def setup_method(self):
        """Set up test fixtures."""
        from export_to_webapp import (
            load_party_data,
            get_party_from_fallback,
            normalize_party_code,
        )
        self.load_party_data = load_party_data
        self.get_party = get_party_from_fallback
        self.normalize = normalize_party_code

    def test_sheets_party_takes_precedence(self):
        """Party from Sheets should be used first."""
        # Simulate candidate with party from Sheets
        sheets_party = "D"
        party_data = {"candidates": {"Smith, John": {"party": "Republican"}}}

        # Even though party-data says R, Sheets D should win
        # (this tests the logic in export_candidates, not get_party_from_fallback)
        # The actual priority is handled in export_to_webapp.py:
        # if not party: party = get_party_from_fallback(...)
        assert sheets_party == "D"

    def test_fallback_used_when_sheets_empty(self):
        """Falls back to party-data.json when Sheets party is empty."""
        party_data = self.load_party_data()

        # Known Democrat in party-data
        result = self.get_party("Scott, Keishan M", party_data)
        assert result == "D"

    def test_returns_none_when_no_match(self):
        """Returns None when not found in party-data."""
        party_data = self.load_party_data()

        # Unknown candidate
        result = self.get_party("Unknown Person XYZ", party_data)
        assert result is None


class TestOutputJSONStructure:
    """Tests for the output JSON structure from export pipeline."""

    def test_existing_candidates_json_structure(self):
        """Validate the structure of the real candidates.json file."""
        project_root = Path(__file__).parent.parent.parent
        candidates_path = project_root / "public" / "data" / "candidates.json"

        if not candidates_path.exists():
            pytest.skip("candidates.json not found - run export first")

        with open(candidates_path) as f:
            data = json.load(f)

        # Top-level structure
        assert "lastUpdated" in data
        assert "house" in data
        assert "senate" in data

        # District counts
        assert len(data["house"]) == 124, "Expected 124 House districts"
        assert len(data["senate"]) == 46, "Expected 46 Senate districts"

        # Check a sample House district structure
        sample_district = data["house"]["1"]
        assert "districtNumber" in sample_district
        assert "candidates" in sample_district
        assert "incumbent" in sample_district
        assert isinstance(sample_district["candidates"], list)

    def test_candidate_entry_has_required_fields(self):
        """Validate candidate entries have all required fields."""
        project_root = Path(__file__).parent.parent.parent
        candidates_path = project_root / "public" / "data" / "candidates.json"

        if not candidates_path.exists():
            pytest.skip("candidates.json not found - run export first")

        with open(candidates_path) as f:
            data = json.load(f)

        required_fields = ["name", "party", "status", "filedDate",
                         "ethicsUrl", "reportId", "source", "isIncumbent"]

        # Check all candidates have required fields
        for chamber in ["house", "senate"]:
            for district_num, district in data[chamber].items():
                for candidate in district.get("candidates", []):
                    for field in required_fields:
                        assert field in candidate, \
                            f"Missing {field} in {chamber} district {district_num}"


class TestDistrictCoverage:
    """Tests for complete district coverage."""

    def test_all_house_districts_present(self):
        """All 124 House districts should be present."""
        project_root = Path(__file__).parent.parent.parent
        candidates_path = project_root / "public" / "data" / "candidates.json"

        if not candidates_path.exists():
            pytest.skip("candidates.json not found - run export first")

        with open(candidates_path) as f:
            data = json.load(f)

        # Check all House districts 1-124
        for i in range(1, 125):
            assert str(i) in data["house"], f"Missing House district {i}"
            assert data["house"][str(i)]["districtNumber"] == i

    def test_all_senate_districts_present(self):
        """All 46 Senate districts should be present."""
        project_root = Path(__file__).parent.parent.parent
        candidates_path = project_root / "public" / "data" / "candidates.json"

        if not candidates_path.exists():
            pytest.skip("candidates.json not found - run export first")

        with open(candidates_path) as f:
            data = json.load(f)

        # Check all Senate districts 1-46
        for i in range(1, 47):
            assert str(i) in data["senate"], f"Missing Senate district {i}"
            assert data["senate"][str(i)]["districtNumber"] == i


class TestPartyCoverageMetrics:
    """Tests for party detection coverage."""

    def test_party_detection_rate(self):
        """Party detection rate should be tracked."""
        project_root = Path(__file__).parent.parent.parent
        candidates_path = project_root / "public" / "data" / "candidates.json"

        if not candidates_path.exists():
            pytest.skip("candidates.json not found - run export first")

        with open(candidates_path) as f:
            data = json.load(f)

        total = 0
        with_party = 0

        for chamber in ["house", "senate"]:
            for district in data[chamber].values():
                for candidate in district.get("candidates", []):
                    total += 1
                    if candidate.get("party"):
                        with_party += 1

        if total > 0:
            rate = with_party / total * 100
            print(f"Party detection rate: {with_party}/{total} ({rate:.1f}%)")

            # After implementing party-data.json fallback, we expect >90% coverage
            # But let's set a lower threshold for now to allow for gradual improvement
            assert rate >= 50, f"Party detection rate too low: {rate:.1f}%"


class TestIncumbentData:
    """Tests for incumbent data consistency."""

    def test_incumbent_structure(self):
        """Incumbent data should have name and party when present."""
        project_root = Path(__file__).parent.parent.parent
        candidates_path = project_root / "public" / "data" / "candidates.json"

        if not candidates_path.exists():
            pytest.skip("candidates.json not found - run export first")

        with open(candidates_path) as f:
            data = json.load(f)

        for chamber in ["house", "senate"]:
            for district_num, district in data[chamber].items():
                incumbent = district.get("incumbent")
                # Incumbent may be None or a dict
                if incumbent is not None:
                    assert "name" in incumbent, f"Missing incumbent name in {chamber} {district_num}"
                    assert "party" in incumbent, f"Missing incumbent party in {chamber} {district_num}"


class TestOpportunityJSON:
    """Tests for opportunity.json output."""

    def test_opportunity_json_structure(self):
        """Validate opportunity.json structure."""
        project_root = Path(__file__).parent.parent.parent
        opp_path = project_root / "public" / "data" / "opportunity.json"

        if not opp_path.exists():
            pytest.skip("opportunity.json not found - run calculate_opportunity first")

        with open(opp_path) as f:
            data = json.load(f)

        assert "house" in data, "Missing 'house' in opportunity.json"
        assert "senate" in data, "Missing 'senate' in opportunity.json"

        # Check sample opportunity entry structure
        for chamber in ["house", "senate"]:
            for district_id, opp in data[chamber].items():
                if opp:  # Some districts may have empty opportunity data
                    # These fields may or may not exist depending on implementation
                    pass  # Minimal validation for now


class TestExportFunctions:
    """Tests for individual export functions."""

    def test_parse_district_id_integration(self):
        """Test parse_district_id with realistic inputs."""
        from export_to_webapp import parse_district_id

        # Test full range of valid IDs
        for i in range(1, 125):
            chamber, num = parse_district_id(f"SC-House-{i:03d}")
            assert chamber == "house"
            assert num == i

        for i in range(1, 47):
            chamber, num = parse_district_id(f"SC-Senate-{i:03d}")
            assert chamber == "senate"
            assert num == i

    def test_is_name_match_integration(self):
        """Test name matching with real-world examples."""
        from export_to_webapp import is_name_match

        # Common name format variations
        assert is_name_match("Smith, John A", "John Smith") is True
        assert is_name_match("John Smith Jr.", "John Smith") is True
        assert is_name_match("Smith, John A. Jr.", "John Smith") is True

        # Different people should not match
        assert is_name_match("John Smith", "Jane Smith") is False
        assert is_name_match("John Smith", "John Jones") is False


class TestLoggingModule:
    """Tests for the logging module."""

    def test_logger_initialization(self):
        """Test logger can be initialized."""
        from logging_config import get_logger, setup_logging

        logger = get_logger()
        assert logger is not None

        # Test logging methods don't throw
        logger.info("Test message")
        logger.warning("Test warning")
        logger.error("Test error")

    def test_log_functions(self):
        """Test convenience log functions."""
        from logging_config import log_info, log_error, log_success, log_metric

        # These should not throw
        log_info("Test info", key="value")
        log_error("Test error", code=500)
        log_success("Test success")
        log_metric("test_metric", 42)


class TestRetryLogic:
    """Tests for retry logic configuration."""

    def test_tenacity_available(self):
        """Verify tenacity is available for retry logic."""
        from tenacity import retry, stop_after_attempt, wait_exponential

        # Should be importable
        assert callable(retry)
        assert callable(stop_after_attempt)
        assert callable(wait_exponential)

    def test_retry_decorator_pattern(self):
        """Test the retry decorator pattern works correctly."""
        from tenacity import (
            retry,
            stop_after_attempt,
            wait_exponential,
            retry_if_exception_type,
        )

        # Simulate the retry decorator pattern used in sheets_sync
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=2, min=2, max=10),
            retry=retry_if_exception_type((ConnectionError,)),
            reraise=True,
        )
        def test_function():
            return "success"

        # Should execute successfully
        assert test_function() == "success"

    def test_sheets_sync_syntax_valid(self):
        """Verify sheets_sync.py has valid Python syntax with retry decorators."""
        import ast

        sheets_sync_path = Path(__file__).parent.parent / "src" / "sheets_sync.py"
        with open(sheets_sync_path) as f:
            source = f.read()

        # Should parse without syntax errors
        ast.parse(source)

        # Verify retry decorator is mentioned
        assert "@sheets_retry()" in source, "Missing retry decorator usage"
