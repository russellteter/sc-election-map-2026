#!/usr/bin/env python3
"""
Unit tests for Party Detector module.

Tests the party detection logic without requiring actual API calls.

Usage:
    python -m pytest src/test_party_detector.py -v
    python -m src.test_party_detector  # Standalone run
"""

import unittest
from unittest.mock import MagicMock, patch

from .party_detector import (
    PartyDetector,
    PartyDetectionResult,
    detect_candidate_party,
)


class TestPartyDetector(unittest.TestCase):
    """Test PartyDetector class."""

    def test_build_search_query_basic(self):
        """Test basic search query construction."""
        detector = PartyDetector(firecrawl_api_key="test_key")
        query = detector._build_search_query("John Smith", None)

        self.assertIn('"John Smith"', query)
        self.assertIn('"South Carolina"', query)
        self.assertIn("Democrat", query)
        self.assertIn("Republican", query)

    def test_build_search_query_with_district(self):
        """Test query includes chamber when district provided."""
        detector = PartyDetector(firecrawl_api_key="test_key")
        query = detector._build_search_query("John Smith", "SC-House-042")

        self.assertIn("house", query)
        self.assertIn('"John Smith"', query)

    def test_count_party_mentions_democrat(self):
        """Test counting Democrat mentions."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        text = "John Smith is a Democrat running for office. The Democratic party endorses him."
        count = detector._count_party_mentions(text.lower(), detector.DEM_KEYWORDS)

        self.assertGreater(count, 0)

    def test_count_party_mentions_republican(self):
        """Test counting Republican mentions."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        text = "Jane Doe is a Republican. The GOP candidate has SCGOP support."
        count = detector._count_party_mentions(text.lower(), detector.REP_KEYWORDS)

        self.assertGreater(count, 0)

    def test_determine_party_democrat_high(self):
        """Test HIGH confidence Democrat detection."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        result = detector._determine_party(
            dem_count=5,
            rep_count=1,
            evidence_url="https://example.com",
        )

        self.assertEqual(result.detected_party, "D")
        self.assertEqual(result.confidence, "HIGH")
        self.assertEqual(result.dem_mentions, 5)
        self.assertEqual(result.rep_mentions, 1)

    def test_determine_party_republican_high(self):
        """Test HIGH confidence Republican detection."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        result = detector._determine_party(
            dem_count=1,
            rep_count=5,
            evidence_url="https://example.com",
        )

        self.assertEqual(result.detected_party, "R")
        self.assertEqual(result.confidence, "HIGH")

    def test_determine_party_medium_confidence(self):
        """Test MEDIUM confidence when difference is 2."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        result = detector._determine_party(
            dem_count=3,
            rep_count=1,
            evidence_url="https://example.com",
        )

        self.assertEqual(result.detected_party, "D")
        self.assertEqual(result.confidence, "MEDIUM")

    def test_determine_party_low_confidence(self):
        """Test LOW confidence when difference is 1."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        result = detector._determine_party(
            dem_count=2,
            rep_count=1,
            evidence_url="https://example.com",
        )

        self.assertEqual(result.detected_party, "D")
        self.assertEqual(result.confidence, "LOW")

    def test_determine_party_tie(self):
        """Test tie returns LOW confidence with no party."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        result = detector._determine_party(
            dem_count=2,
            rep_count=2,
            evidence_url="https://example.com",
        )

        self.assertIsNone(result.detected_party)
        self.assertEqual(result.confidence, "LOW")
        self.assertEqual(result.source, "tie_in_mentions")

    def test_determine_party_no_mentions(self):
        """Test no mentions returns UNKNOWN."""
        detector = PartyDetector(firecrawl_api_key="test_key")

        result = detector._determine_party(
            dem_count=0,
            rep_count=0,
            evidence_url=None,
        )

        self.assertIsNone(result.detected_party)
        self.assertEqual(result.confidence, "UNKNOWN")
        self.assertEqual(result.source, "no_party_mentions")

    def test_no_api_key_returns_unknown(self):
        """Test that missing API key returns UNKNOWN result."""
        detector = PartyDetector(firecrawl_api_key=None)

        result = detector.detect_party("John Smith", "SC-House-001")

        self.assertIsNone(result.detected_party)
        self.assertEqual(result.confidence, "UNKNOWN")
        self.assertEqual(result.source, "no_api_key")


class TestPartyDetectorIntegration(unittest.TestCase):
    """Integration tests with mocked Firecrawl."""

    def test_detect_party_with_mock_results(self):
        """Test party detection with mocked search results."""
        # Mock search results for a Democrat candidate
        mock_results = [
            {
                "title": "John Smith - Democratic Candidate for SC House",
                "description": "John Smith announces his campaign as the Democratic nominee for District 42",
                "url": "https://example.com/john-smith-democrat",
                "markdown": "John Smith is running as a Democrat for South Carolina House District 42.",
            },
            {
                "title": "Local News Coverage",
                "description": "Democratic candidate John Smith campaigns in district",
                "url": "https://localnews.com/smith",
                "markdown": "The Democratic party has endorsed John Smith for the state house race.",
            },
        ]

        detector = PartyDetector(firecrawl_api_key="test_key")

        # Directly test _analyze_results instead of mocking the client property
        result = detector._analyze_results(mock_results, "John Smith")

        self.assertEqual(result.detected_party, "D")
        self.assertIn(result.confidence, ["HIGH", "MEDIUM"])
        self.assertIsNotNone(result.evidence_url)

    def test_detect_party_republican(self):
        """Test party detection for Republican candidate."""
        mock_results = [
            {
                "title": "Jane Doe - Republican for State Senate",
                "description": "GOP candidate Jane Doe announces run for Senate District 15",
                "url": "https://example.com/jane-doe-gop",
                "markdown": "Jane Doe is the Republican candidate endorsed by SCGOP.",
            },
        ]

        detector = PartyDetector(firecrawl_api_key="test_key")
        result = detector._analyze_results(mock_results, "Jane Doe")

        self.assertEqual(result.detected_party, "R")

    def test_detect_party_no_results(self):
        """Test handling of empty search results."""
        detector = PartyDetector(firecrawl_api_key="test_key")
        result = detector._analyze_results([], "Unknown Candidate")

        self.assertIsNone(result.detected_party)
        self.assertEqual(result.confidence, "UNKNOWN")


class TestConvenienceFunction(unittest.TestCase):
    """Test the convenience function."""

    def test_detect_candidate_party_no_key(self):
        """Test convenience function without API key."""
        result = detect_candidate_party(
            candidate_name="Test Candidate",
            district_id="SC-House-001",
            api_key=None,
        )

        self.assertIsNone(result.detected_party)
        self.assertEqual(result.confidence, "UNKNOWN")


class TestPartyDetectionResult(unittest.TestCase):
    """Test PartyDetectionResult dataclass."""

    def test_result_creation(self):
        """Test creating a result object."""
        result = PartyDetectionResult(
            detected_party="D",
            confidence="HIGH",
            evidence_url="https://example.com",
            source="web_search",
            dem_mentions=5,
            rep_mentions=1,
        )

        self.assertEqual(result.detected_party, "D")
        self.assertEqual(result.confidence, "HIGH")
        self.assertEqual(result.evidence_url, "https://example.com")
        self.assertEqual(result.source, "web_search")
        self.assertEqual(result.dem_mentions, 5)
        self.assertEqual(result.rep_mentions, 1)

    def test_result_defaults(self):
        """Test default values."""
        result = PartyDetectionResult(
            detected_party=None,
            confidence="UNKNOWN",
            evidence_url=None,
            source="test",
        )

        self.assertEqual(result.dem_mentions, 0)
        self.assertEqual(result.rep_mentions, 0)


def run_tests():
    """Run all tests and print results."""
    print("=" * 60)
    print("Party Detector Unit Tests")
    print("=" * 60)

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestPartyDetector))
    suite.addTests(loader.loadTestsFromTestCase(TestPartyDetectorIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestConvenienceFunction))
    suite.addTests(loader.loadTestsFromTestCase(TestPartyDetectionResult))

    # Run with verbosity
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("=" * 60)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("=" * 60)

    return len(result.failures) == 0 and len(result.errors) == 0


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
