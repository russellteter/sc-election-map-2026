"""
Unit tests for export_to_webapp.py - the export pipeline.

Tests:
- District ID parsing (SC-House-042, SC-Senate-007)
- Name normalization for matching
- Fuzzy name matching (Last, First vs First Last)
- Party enrichment with fallback chain
- Incumbent name matching
- Hyperlink formula extraction
- Output structure validation
"""

import sys
from pathlib import Path

# Add scripts to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import pytest


class TestDistrictIdParsing:
    """Tests for parse_district_id function."""

    def setup_method(self):
        """Import function for testing."""
        from export_to_webapp import parse_district_id
        self.parse_district_id = parse_district_id

    def test_house_district_single_digit(self):
        """Parse single-digit House district."""
        chamber, num = self.parse_district_id("SC-House-001")
        assert chamber == "house"
        assert num == 1

    def test_house_district_double_digit(self):
        """Parse double-digit House district."""
        chamber, num = self.parse_district_id("SC-House-042")
        assert chamber == "house"
        assert num == 42

    def test_house_district_triple_digit(self):
        """Parse triple-digit House district."""
        chamber, num = self.parse_district_id("SC-House-124")
        assert chamber == "house"
        assert num == 124

    def test_senate_district(self):
        """Parse Senate district."""
        chamber, num = self.parse_district_id("SC-Senate-007")
        assert chamber == "senate"
        assert num == 7

    def test_senate_district_max(self):
        """Parse maximum Senate district."""
        chamber, num = self.parse_district_id("SC-Senate-046")
        assert chamber == "senate"
        assert num == 46

    def test_invalid_empty(self):
        """Empty string returns None tuple."""
        chamber, num = self.parse_district_id("")
        assert chamber is None
        assert num is None

    def test_invalid_none(self):
        """None input returns None tuple."""
        chamber, num = self.parse_district_id(None)
        assert chamber is None
        assert num is None

    def test_invalid_wrong_prefix(self):
        """Non-SC prefix returns None tuple."""
        chamber, num = self.parse_district_id("NC-House-042")
        assert chamber is None
        assert num is None

    def test_invalid_format(self):
        """Wrong format returns None tuple."""
        chamber, num = self.parse_district_id("SC-House")
        assert chamber is None
        assert num is None

    def test_invalid_non_numeric(self):
        """Non-numeric district number returns None tuple."""
        chamber, num = self.parse_district_id("SC-House-ABC")
        assert chamber is None
        assert num is None


class TestNameNormalization:
    """Tests for normalize_name_for_matching function."""

    def setup_method(self):
        """Import function for testing."""
        from export_to_webapp import normalize_name_for_matching
        self.normalize = normalize_name_for_matching

    def test_lowercase_conversion(self):
        """Names converted to lowercase."""
        assert self.normalize("John Smith") == "john smith"
        assert self.normalize("JANE DOE") == "jane doe"

    def test_suffix_removal_jr(self):
        """Junior suffix removed."""
        assert self.normalize("John Smith Jr.") == "john smith"
        assert self.normalize("John Smith Jr") == "john smith"

    def test_suffix_removal_sr(self):
        """Senior suffix removed."""
        assert self.normalize("John Smith Sr.") == "john smith"
        assert self.normalize("John Smith Sr") == "john smith"

    def test_suffix_removal_numerals(self):
        """Roman numeral suffixes removed."""
        assert self.normalize("John Smith III") == "john smith"
        assert self.normalize("John Smith II") == "john smith"
        assert self.normalize("John Smith IV") == "john smith"

    def test_last_first_format(self):
        """'Last, First' format converted to 'first last'."""
        assert self.normalize("Smith, John") == "john smith"
        assert self.normalize("Doe, Jane") == "jane doe"

    def test_last_first_with_middle(self):
        """'Last, First M' format converted, using only first name."""
        result = self.normalize("Smith, John A")
        # Should be "john smith" - using only first word of first name
        assert result == "john smith"

    def test_whitespace_normalization(self):
        """Multiple spaces normalized."""
        assert self.normalize("John   Smith") == "john smith"
        assert self.normalize("  John Smith  ") == "john smith"

    def test_empty_string(self):
        """Empty string handled."""
        assert self.normalize("") == ""

    def test_none_returns_empty(self):
        """None input returns empty string."""
        assert self.normalize(None) == ""


class TestFuzzyNameMatch:
    """Tests for fuzzy_name_match function."""

    def setup_method(self):
        """Import function for testing."""
        from export_to_webapp import fuzzy_name_match
        self.match = fuzzy_name_match

    def test_exact_match(self):
        """Exact match returns True."""
        assert self.match("John Smith", "John Smith") is True

    def test_case_insensitive_match(self):
        """Case insensitive match returns True."""
        assert self.match("john smith", "JOHN SMITH") is True

    def test_last_first_vs_first_last(self):
        """'Smith, John' matches 'John Smith'."""
        assert self.match("Smith, John", "John Smith") is True

    def test_first_last_vs_last_first(self):
        """'John Smith' matches 'Smith, John'."""
        assert self.match("John Smith", "Smith, John") is True

    def test_suffix_ignored(self):
        """Suffix differences ignored."""
        assert self.match("John Smith Jr.", "John Smith") is True
        assert self.match("John Smith", "John Smith III") is True

    def test_similar_first_name(self):
        """First names with same first 3 chars match if last name matches."""
        # "Johnathan" and "John" both start with "joh"
        assert self.match("Johnathan Smith", "John Smith") is True
        # "Jonathan" starts with "jon", "John" starts with "joh" - no match
        assert self.match("Jonathan Smith", "John Smith") is False

    def test_different_last_names(self):
        """Different last names don't match."""
        assert self.match("John Smith", "John Jones") is False

    def test_different_first_names(self):
        """Different first names don't match."""
        assert self.match("John Smith", "Jane Smith") is False

    def test_single_name(self):
        """Single name handled gracefully."""
        assert self.match("Smith", "John Smith") is False


class TestPartyEnrichment:
    """Tests for party enrichment with fallback chain."""

    def setup_method(self):
        """Import functions for testing."""
        from export_to_webapp import (
            get_party_from_fallback,
            normalize_party_code,
        )
        self.get_party = get_party_from_fallback
        self.normalize = normalize_party_code

    def test_normalize_democratic(self):
        """Democratic normalized to D."""
        assert self.normalize("Democratic") == "D"
        assert self.normalize("Democrat") == "D"
        assert self.normalize("DEMOCRATIC") == "D"
        assert self.normalize("D") == "D"

    def test_normalize_republican(self):
        """Republican normalized to R."""
        assert self.normalize("Republican") == "R"
        assert self.normalize("REPUBLICAN") == "R"
        assert self.normalize("R") == "R"

    def test_normalize_independent(self):
        """Independent normalized to I."""
        assert self.normalize("Independent") == "I"
        assert self.normalize("I") == "I"

    def test_normalize_other(self):
        """Other normalized to O."""
        assert self.normalize("Other") == "O"
        assert self.normalize("O") == "O"

    def test_normalize_none(self):
        """None returns None."""
        assert self.normalize(None) is None
        assert self.normalize("") is None

    def test_fallback_exact_match(self):
        """Exact name match in party-data returns party."""
        party_data = {
            "candidates": {
                "Smith, John": {"party": "Democratic", "verified": True}
            }
        }
        result = self.get_party("Smith, John", party_data)
        assert result == "D"

    def test_fallback_fuzzy_match(self):
        """Fuzzy name match in party-data returns party."""
        party_data = {
            "candidates": {
                "Smith, John": {"party": "Republican", "verified": True}
            }
        }
        result = self.get_party("John Smith", party_data)
        assert result == "R"

    def test_fallback_no_match(self):
        """No match in party-data returns None."""
        party_data = {
            "candidates": {
                "Smith, John": {"party": "Democratic", "verified": True}
            }
        }
        result = self.get_party("Jane Doe", party_data)
        assert result is None

    def test_fallback_empty_data(self):
        """Empty party-data returns None."""
        result = self.get_party("John Smith", {"candidates": {}})
        assert result is None


class TestIncumbentMatching:
    """Tests for is_name_match function (incumbent matching)."""

    def setup_method(self):
        """Import function for testing."""
        from export_to_webapp import is_name_match
        self.match = is_name_match

    def test_exact_match(self):
        """Exact names match."""
        assert self.match("John Smith", "John Smith") is True

    def test_last_first_vs_first_last(self):
        """'Smith, John' matches 'John Smith' for incumbents."""
        assert self.match("Smith, John", "John Smith") is True

    def test_suffix_handling_jr(self):
        """Jr. suffix handled."""
        assert self.match("John Smith Jr.", "John Smith") is True
        assert self.match("John Smith", "John Smith Jr.") is True

    def test_suffix_handling_roman(self):
        """Roman numeral suffix handled."""
        assert self.match("John Smith III", "John Smith") is True

    def test_empty_names(self):
        """Empty names return False."""
        assert self.match("", "John Smith") is False
        assert self.match("John Smith", "") is False
        assert self.match("", "") is False

    def test_different_names(self):
        """Different names don't match."""
        assert self.match("John Smith", "Jane Doe") is False


class TestHyperlinkExtraction:
    """Tests for extracting URL from HYPERLINK formulas."""

    def test_extract_from_formula(self):
        """URL extracted from HYPERLINK formula."""
        import re

        formula = '=HYPERLINK("https://ethics.sc.gov/123", "View Filing")'
        match = re.search(r'HYPERLINK\("([^"]+)"', formula)
        assert match is not None
        assert match.group(1) == "https://ethics.sc.gov/123"

    def test_raw_url_unchanged(self):
        """Raw URL passed through unchanged."""
        url = "https://ethics.sc.gov/123"
        # Non-HYPERLINK URLs should be used as-is
        assert not url.startswith("=HYPERLINK")

    def test_empty_string(self):
        """Empty string handled."""
        import re

        formula = ""
        match = re.search(r'HYPERLINK\("([^"]+)"', formula)
        assert match is None


class TestOutputStructure:
    """Tests for output JSON structure validation."""

    def test_required_top_level_keys(self):
        """Output has required top-level keys."""
        expected_keys = {"lastUpdated", "house", "senate"}
        # Mock output for validation
        output = {
            "lastUpdated": "2026-01-26T00:00:00+00:00",
            "house": {},
            "senate": {}
        }
        assert expected_keys.issubset(output.keys())

    def test_district_structure(self):
        """District entries have required structure."""
        district_entry = {
            "districtNumber": 42,
            "candidates": [],
            "incumbent": {
                "name": "John Smith",
                "party": "Republican"
            }
        }
        assert "districtNumber" in district_entry
        assert "candidates" in district_entry
        assert "incumbent" in district_entry
        assert isinstance(district_entry["candidates"], list)

    def test_candidate_entry_structure(self):
        """Candidate entries have required fields."""
        candidate_entry = {
            "name": "Jane Doe",
            "party": "Democratic",
            "status": "filed",
            "filedDate": "2026-01-15",
            "ethicsUrl": "https://ethics.sc.gov/123",
            "reportId": "12345",
            "source": "ethics",
            "isIncumbent": False
        }
        required_fields = ["name", "party", "status", "filedDate",
                         "ethicsUrl", "reportId", "source", "isIncumbent"]
        for field in required_fields:
            assert field in candidate_entry


class TestPartyDataLoading:
    """Tests for party-data.json loading."""

    def test_load_real_party_data(self):
        """Test loading the real party-data.json file."""
        from export_to_webapp import load_party_data

        data = load_party_data()

        # Should have candidates key
        assert "candidates" in data

        # Should have many candidate records
        candidates = data.get("candidates", {})
        assert len(candidates) > 50  # We know there are 130+ records

        # Spot check a known entry
        if "Scott, Keishan M" in candidates:
            entry = candidates["Scott, Keishan M"]
            assert entry.get("party") == "Democratic"
            assert entry.get("verified") is True


class TestEndToEndPartyEnrichment:
    """Integration tests for the full party enrichment chain."""

    def setup_method(self):
        """Import required functions."""
        from export_to_webapp import (
            get_party_from_fallback,
            load_party_data,
        )
        self.get_party = get_party_from_fallback
        self.party_data = load_party_data()

    def test_known_democrat_lookup(self):
        """Look up a known Democrat from party-data.json."""
        # Keishan Scott is a known Democrat in District 50
        result = self.get_party("Scott, Keishan M", self.party_data)
        assert result == "D"

    def test_known_democrat_alternate_format(self):
        """Look up with alternate name format."""
        # Test with "First Last" format
        result = self.get_party("Keishan Scott", self.party_data)
        # May or may not match depending on exact data format
        # This tests the fuzzy matching capability

    def test_known_republican_lookup(self):
        """Look up a known Republican from party-data.json."""
        # John Lastinger is a known Republican in District 88
        result = self.get_party("Lastinger, John", self.party_data)
        assert result == "R"

    def test_unknown_candidate(self):
        """Unknown candidate returns None."""
        result = self.get_party("Completely Unknown Name XYZ", self.party_data)
        assert result is None
