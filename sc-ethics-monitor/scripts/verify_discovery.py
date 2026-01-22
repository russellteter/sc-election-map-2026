#!/usr/bin/env python3
"""
Verification script for candidate discovery pipeline.

Tests the discovery pipeline against live sources to verify:
- Ballotpedia scraping works for sample districts
- Candidate extraction parses correctly
- Name normalization and deduplication function as expected
- Report generation produces valid output

Usage:
    python scripts/verify_discovery.py                  # Run all tests
    python scripts/verify_discovery.py --source ballotpedia
    python scripts/verify_discovery.py --districts 5    # Test first 5 districts
    python scripts/verify_discovery.py --dry-run        # Don't make API calls
    python scripts/verify_discovery.py --verbose        # Show detailed output

Environment:
    FIRECRAWL_API_KEY  - Required for live scraping tests
"""

import argparse
import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


def setup_logging(verbose: bool = False) -> None:
    """Configure logging for verification script."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def log(message: str, level: str = "info") -> None:
    """Print timestamped log message."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] [{level.upper()}] {message}")


class DiscoveryVerifier:
    """
    Verifies candidate discovery pipeline components.

    Tests each component of the discovery pipeline:
    - Source adapters (Ballotpedia, SCDP, SCGOP)
    - Candidate extraction and parsing
    - Deduplication logic
    - Report generation
    """

    def __init__(
        self,
        dry_run: bool = False,
        verbose: bool = False,
        max_districts: int = 5,
    ):
        """
        Initialize verifier.

        Args:
            dry_run: If True, skip actual API calls
            verbose: If True, show detailed output
            max_districts: Maximum districts to test
        """
        self.dry_run = dry_run
        self.verbose = verbose
        self.max_districts = max_districts
        self.results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "errors": [],
            "details": {},
        }

    async def verify_ballotpedia_source(self) -> dict:
        """
        Verify Ballotpedia source adapter.

        Tests:
        - URL building
        - District ID parsing
        - Page scraping (if not dry run)
        - Candidate parsing

        Returns:
            Dict with test results
        """
        log("Testing Ballotpedia source adapter...")
        results = {"passed": True, "details": [], "candidates_found": 0}

        try:
            from candidate_discovery.sources.ballotpedia import BallotpediaSource

            source = BallotpediaSource()

            # Test 1: URL building
            log("  Test 1: URL building...", "debug")
            url = source._build_url("house", 42)
            expected = "https://ballotpedia.org/South_Carolina_House_of_Representatives_District_42"
            if url == expected:
                results["details"].append("URL building: PASSED")
            else:
                results["details"].append(f"URL building: FAILED (got {url})")
                results["passed"] = False

            # Test 2: District ID creation
            log("  Test 2: District ID creation...", "debug")
            district_id = source._district_id_from_parts("house", 42)
            if district_id == "SC-House-042":
                results["details"].append("District ID creation: PASSED")
            else:
                results["details"].append(f"District ID creation: FAILED (got {district_id})")
                results["passed"] = False

            # Test 3: Party normalization
            log("  Test 3: Party normalization...", "debug")
            party_tests = [
                ("Democratic", "D"),
                ("Republican", "R"),
                ("Independent", "I"),
                ("Libertarian", "O"),
            ]
            for input_party, expected_code in party_tests:
                result = source._normalize_party(input_party)
                if result == expected_code:
                    results["details"].append(f"Party normalization ({input_party}): PASSED")
                else:
                    results["details"].append(
                        f"Party normalization ({input_party}): FAILED (got {result})"
                    )
                    results["passed"] = False

            # Test 4: Live scraping (if not dry run)
            if not self.dry_run and os.environ.get("FIRECRAWL_API_KEY"):
                log("  Test 4: Live scraping (sample districts)...", "debug")

                # Test a few districts
                sample_districts = [
                    ("house", 1),
                    ("house", 42),
                    ("senate", 1),
                ][:self.max_districts]

                for chamber, num in sample_districts:
                    district_id = source._district_id_from_parts(chamber, num)
                    log(f"    Scraping {district_id}...", "debug")

                    try:
                        candidates = await source.extract_district_candidates_async(district_id)
                        results["candidates_found"] += len(candidates)
                        results["details"].append(
                            f"Scrape {district_id}: PASSED ({len(candidates)} candidates)"
                        )

                        if self.verbose and candidates:
                            for c in candidates[:3]:
                                log(f"      Found: {c.name} ({c.party})", "debug")

                    except Exception as e:
                        results["details"].append(f"Scrape {district_id}: FAILED ({e})")
                        # Don't fail overall test for individual scrape failures
            else:
                results["details"].append("Live scraping: SKIPPED (dry run or no API key)")

        except ImportError as e:
            results["passed"] = False
            results["details"].append(f"Import error: {e}")
        except Exception as e:
            results["passed"] = False
            results["details"].append(f"Unexpected error: {e}")

        return results

    async def verify_scdp_source(self) -> dict:
        """
        Verify SCDP source adapter.

        Returns:
            Dict with test results
        """
        log("Testing SCDP source adapter...")
        results = {"passed": True, "details": [], "candidates_found": 0}

        try:
            from candidate_discovery.sources.scdp import SCDPSource

            source = SCDPSource()

            # Test 1: Source properties
            if source.source_name == "scdp":
                results["details"].append("Source name: PASSED")
            else:
                results["details"].append(f"Source name: FAILED (got {source.source_name})")
                results["passed"] = False

            if source.source_priority == 3:
                results["details"].append("Source priority: PASSED")
            else:
                results["details"].append(f"Source priority: FAILED (got {source.source_priority})")
                results["passed"] = False

        except ImportError as e:
            results["passed"] = False
            results["details"].append(f"Import error: {e}")
        except Exception as e:
            results["passed"] = False
            results["details"].append(f"Unexpected error: {e}")

        return results

    async def verify_scgop_source(self) -> dict:
        """
        Verify SCGOP source adapter.

        Returns:
            Dict with test results
        """
        log("Testing SCGOP source adapter...")
        results = {"passed": True, "details": [], "candidates_found": 0}

        try:
            from candidate_discovery.sources.scgop import SCGOPSource

            source = SCGOPSource()

            # Test 1: Source properties
            if source.source_name == "scgop":
                results["details"].append("Source name: PASSED")
            else:
                results["details"].append(f"Source name: FAILED (got {source.source_name})")
                results["passed"] = False

            if source.source_priority == 3:
                results["details"].append("Source priority: PASSED")
            else:
                results["details"].append(f"Source priority: FAILED (got {source.source_priority})")
                results["passed"] = False

        except ImportError as e:
            results["passed"] = False
            results["details"].append(f"Import error: {e}")
        except Exception as e:
            results["passed"] = False
            results["details"].append(f"Unexpected error: {e}")

        return results

    def verify_deduplicator(self) -> dict:
        """
        Verify deduplication logic.

        Returns:
            Dict with test results
        """
        log("Testing deduplication logic...")
        results = {"passed": True, "details": []}

        try:
            from candidate_discovery.deduplicator import CandidateDeduplicator
            from candidate_discovery.sources.base import DiscoveredCandidate

            deduplicator = CandidateDeduplicator()

            # Test 1: Name normalization
            test_cases = [
                ("John Smith Jr.", "john smith"),
                ("JANE DOE", "jane doe"),
                ("Robert J. Johnson III", "robert johnson"),
                ("Mary-Ann Williams", "maryann williams"),
            ]

            for input_name, expected in test_cases:
                result = deduplicator._normalize_name(input_name)
                if result == expected:
                    results["details"].append(f"Normalize '{input_name}': PASSED")
                else:
                    results["details"].append(
                        f"Normalize '{input_name}': FAILED (got '{result}', expected '{expected}')"
                    )
                    results["passed"] = False

            # Test 2: Deduplication
            candidates = [
                DiscoveredCandidate(
                    name="John Smith",
                    district_id="SC-House-001",
                    party="D",
                    source="ballotpedia",
                ),
                DiscoveredCandidate(
                    name="John H. Smith",  # Same person
                    district_id="SC-House-001",
                    party="D",
                    source="scdp",
                ),
                DiscoveredCandidate(
                    name="Jane Doe",  # Different person
                    district_id="SC-House-001",
                    party="R",
                    source="ballotpedia",
                ),
            ]

            merged = deduplicator.deduplicate(candidates)
            if len(merged) == 2:
                results["details"].append("Deduplication count: PASSED")
            else:
                results["details"].append(
                    f"Deduplication count: FAILED (got {len(merged)}, expected 2)"
                )
                results["passed"] = False

            # Verify merged candidate has multiple sources
            john_merged = next((c for c in merged if "john" in c.name.lower()), None)
            if john_merged and john_merged.has_multiple_sources:
                results["details"].append("Multi-source tracking: PASSED")
            else:
                results["details"].append("Multi-source tracking: FAILED")
                results["passed"] = False

        except ImportError as e:
            results["passed"] = False
            results["details"].append(f"Import error: {e}")
        except Exception as e:
            results["passed"] = False
            results["details"].append(f"Unexpected error: {e}")

        return results

    def verify_reporter(self) -> dict:
        """
        Verify report generation.

        Returns:
            Dict with test results
        """
        log("Testing report generation...")
        results = {"passed": True, "details": []}

        try:
            from candidate_discovery.reporter import (
                CoverageReport,
                CoverageReporter,
                format_text_report,
                format_email_section,
                format_summary_line,
            )
            from candidate_discovery.aggregator import AggregationResult
            from candidate_discovery.sources.base import MergedCandidate

            # Test 1: CoverageReport creation
            report = CoverageReport(
                total_districts=170,
                districts_with_candidates=85,
                candidates_by_party={"D": 40, "R": 45},
                candidates_by_source={"ballotpedia": 60, "scdp": 40, "scgop": 45},
                total_candidates=85,
            )

            if report.coverage_percentage() == 50.0:
                results["details"].append("Coverage percentage: PASSED")
            else:
                results["details"].append(
                    f"Coverage percentage: FAILED (got {report.coverage_percentage()})"
                )
                results["passed"] = False

            # Test 2: Text report formatting
            text_report = format_text_report(report)
            if "COVERAGE REPORT" in text_report and "50.0%" in text_report:
                results["details"].append("Text report format: PASSED")
            else:
                results["details"].append("Text report format: FAILED")
                results["passed"] = False

            # Test 3: Email section formatting
            email_section = format_email_section(report)
            if "<div" in email_section and "Coverage" in email_section:
                results["details"].append("Email section format: PASSED")
            else:
                results["details"].append("Email section format: FAILED")
                results["passed"] = False

            # Test 4: Summary line formatting
            summary = format_summary_line(report)
            if "50.0%" in summary and "85/170" in summary:
                results["details"].append("Summary line format: PASSED")
            else:
                results["details"].append("Summary line format: FAILED")
                results["passed"] = False

            # Test 5: Reporter from AggregationResult
            mock_candidates = [
                MergedCandidate(
                    name="John Smith",
                    district_id="SC-House-001",
                    party="D",
                    sources=["ballotpedia"],
                    source_urls={},
                    source_records=[],
                ),
            ]

            from unittest.mock import MagicMock
            agg_result = AggregationResult(
                candidates=mock_candidates,
                source_stats={
                    "ballotpedia": MagicMock(success=True, candidate_count=1),
                },
                conflicts=[],
                total_raw=1,
                total_deduplicated=1,
            )

            reporter = CoverageReporter()
            generated = reporter.generate_report(agg_result, chambers=["house"])
            if generated.districts_with_candidates == 1:
                results["details"].append("Reporter from AggregationResult: PASSED")
            else:
                results["details"].append("Reporter from AggregationResult: FAILED")
                results["passed"] = False

        except ImportError as e:
            results["passed"] = False
            results["details"].append(f"Import error: {e}")
        except Exception as e:
            results["passed"] = False
            results["details"].append(f"Unexpected error: {e}")

        return results

    async def run_all_tests(self) -> dict:
        """
        Run all verification tests.

        Returns:
            Complete results dict
        """
        log("=" * 60)
        log("CANDIDATE DISCOVERY PIPELINE VERIFICATION")
        log("=" * 60)
        log(f"Dry run: {self.dry_run}")
        log(f"Max districts: {self.max_districts}")
        log("")

        # Run async tests
        async_tests = [
            ("ballotpedia", self.verify_ballotpedia_source),
            ("scdp", self.verify_scdp_source),
            ("scgop", self.verify_scgop_source),
        ]

        # Run sync tests
        sync_tests = [
            ("deduplicator", self.verify_deduplicator),
            ("reporter", self.verify_reporter),
        ]

        # Run async tests
        for test_name, test_func in async_tests:
            try:
                result = await test_func()
                self.results["tests_run"] += 1
                self.results["details"][test_name] = result

                if result["passed"]:
                    self.results["tests_passed"] += 1
                    log(f"  {test_name}: PASSED", "info")
                else:
                    self.results["tests_failed"] += 1
                    log(f"  {test_name}: FAILED", "error")

                if self.verbose:
                    for detail in result["details"]:
                        log(f"    {detail}", "debug")

            except Exception as e:
                self.results["tests_run"] += 1
                self.results["tests_failed"] += 1
                self.results["errors"].append(f"{test_name}: {e}")
                log(f"  {test_name}: ERROR - {e}", "error")

        # Run sync tests
        for test_name, test_func in sync_tests:
            try:
                result = test_func()
                self.results["tests_run"] += 1
                self.results["details"][test_name] = result

                if result["passed"]:
                    self.results["tests_passed"] += 1
                    log(f"  {test_name}: PASSED", "info")
                else:
                    self.results["tests_failed"] += 1
                    log(f"  {test_name}: FAILED", "error")

                if self.verbose:
                    for detail in result["details"]:
                        log(f"    {detail}", "debug")

            except Exception as e:
                self.results["tests_run"] += 1
                self.results["tests_failed"] += 1
                self.results["errors"].append(f"{test_name}: {e}")
                log(f"  {test_name}: ERROR - {e}", "error")

        # Summary
        log("")
        log("=" * 60)
        log("VERIFICATION SUMMARY")
        log("=" * 60)
        log(f"Tests run:    {self.results['tests_run']}")
        log(f"Tests passed: {self.results['tests_passed']}")
        log(f"Tests failed: {self.results['tests_failed']}")

        if self.results["errors"]:
            log("")
            log("ERRORS:")
            for error in self.results["errors"]:
                log(f"  - {error}", "error")

        return self.results


def main():
    """Main entry point for verification script."""
    parser = argparse.ArgumentParser(
        description="Verify candidate discovery pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/verify_discovery.py                   # Run all tests
    python scripts/verify_discovery.py --dry-run         # No API calls
    python scripts/verify_discovery.py --districts 3     # Test 3 districts
    python scripts/verify_discovery.py --verbose         # Detailed output
    python scripts/verify_discovery.py --output results.json
        """
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Skip actual API calls",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Show detailed output",
    )
    parser.add_argument(
        "--districts",
        type=int,
        default=5,
        help="Maximum districts to test (default: 5)",
    )
    parser.add_argument(
        "--source",
        choices=["ballotpedia", "scdp", "scgop", "all"],
        default="all",
        help="Source to test (default: all)",
    )
    parser.add_argument(
        "--output",
        help="Output results to JSON file",
    )

    args = parser.parse_args()

    setup_logging(args.verbose)

    # Run verification
    verifier = DiscoveryVerifier(
        dry_run=args.dry_run,
        verbose=args.verbose,
        max_districts=args.districts,
    )

    results = asyncio.run(verifier.run_all_tests())

    # Output results
    if args.output:
        with open(args.output, "w") as f:
            json.dump(results, f, indent=2, default=str)
        log(f"Results written to {args.output}")

    # Exit with error code if tests failed
    if results["tests_failed"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
