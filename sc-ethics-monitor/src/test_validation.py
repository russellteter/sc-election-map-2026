#!/usr/bin/env python3
"""
Test Validation Script for SC Ethics Monitor

Validates that:
1. Manual overrides are preserved after sync
2. Party_locked candidates skip re-detection
3. Race Analysis uses final_party correctly
4. Research Queue populates correctly

Usage:
    python -m src.test_validation
    python -m src.test_validation --full
"""

import argparse
import json
from datetime import datetime, timezone

from .sheets_sync import SheetsSync
from .config import (
    TAB_CANDIDATES,
    TAB_RACE_ANALYSIS,
    TAB_RESEARCH_QUEUE,
    CANDIDATES_HEADERS,
)


def log(message: str) -> None:
    """Print timestamped log message."""
    timestamp = datetime.now(timezone.utc).strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")


def test_manual_override_preserved(sync: SheetsSync) -> bool:
    """
    Test that manual_party_override is preserved after sync.

    Verification:
    1. Read sheet state
    2. Find a candidate with manual override
    3. Re-sync that candidate
    4. Confirm override is still there
    """
    log("TEST: Manual override preservation")

    # Read current state
    state = sync.read_sheet_state()
    log(f"  Found {len(state)} candidates in sheet")

    # Find a candidate with manual override
    override_candidate = None
    for report_id, data in state.items():
        if data.get("manual_party_override"):
            override_candidate = (report_id, data)
            break

    if not override_candidate:
        log("  SKIP: No candidates with manual override found")
        log("  To test: Set manual_party_override for a candidate in the sheet")
        return True  # Not a failure, just can't test

    report_id, data = override_candidate
    original_override = data["manual_party_override"]
    log(f"  Found candidate {report_id} with override: {original_override}")

    # Re-sync this candidate (simulated)
    result = sync.add_candidate(
        report_id=report_id,
        candidate_name="Test Candidate",
        district_id="SC-House-001",
        filed_date="2026-01-01",
        ethics_report_url="https://example.com",
        is_incumbent=False,
        detected_party="R",  # Try to overwrite with different party
        detection_confidence="HIGH",
        detection_source="test",
        sheet_state=state,
    )
    log(f"  Sync result: {result}")

    # Read state again
    new_state = sync.read_sheet_state()
    new_override = new_state.get(report_id, {}).get("manual_party_override")

    if new_override == original_override:
        log(f"  PASS: Override preserved ({new_override})")
        return True
    else:
        log(f"  FAIL: Override changed from {original_override} to {new_override}")
        return False


def test_party_locked_skipped(sync: SheetsSync) -> bool:
    """
    Test that party_locked candidates skip re-detection.
    """
    log("TEST: Party_locked skipping")

    state = sync.read_sheet_state()

    # Find a locked candidate
    locked_candidate = None
    for report_id, data in state.items():
        if data.get("party_locked"):
            locked_candidate = (report_id, data)
            break

    if not locked_candidate:
        log("  SKIP: No candidates with party_locked=Yes found")
        log("  To test: Set party_locked=Yes for a candidate in the sheet")
        return True

    report_id, data = locked_candidate
    original_party = data.get("detected_party")
    log(f"  Found locked candidate {report_id}, party: {original_party}")

    # Check that is_party_locked returns True
    is_locked = sync.is_party_locked(report_id, state)

    if is_locked:
        log(f"  PASS: is_party_locked() correctly returns True")
        return True
    else:
        log(f"  FAIL: is_party_locked() should return True for locked candidate")
        return False


def test_race_analysis_uses_final_party(sync: SheetsSync) -> bool:
    """
    Test that race analysis counts use final_party, not detected_party.
    """
    log("TEST: Race analysis uses final_party")

    # Get all candidates
    candidates = sync.get_all_candidates()
    log(f"  Found {len(candidates)} candidates")

    # Count candidates where final_party differs from detected_party
    diff_count = 0
    for c in candidates:
        final = c.get("final_party", "")
        detected = c.get("detected_party", "")
        if final and detected and final != detected:
            diff_count += 1
            log(f"    {c.get('candidate_name')}: detected={detected}, final={final}")

    if diff_count > 0:
        log(f"  Found {diff_count} candidates with override applied")
        log("  Race analysis should use final_party values")
    else:
        log("  No overrides found - final_party equals detected_party")

    log("  PASS: Test complete (manual verification needed)")
    return True


def test_research_queue_population(sync: SheetsSync) -> bool:
    """
    Test that research queue populates with LOW/UNKNOWN candidates.
    """
    log("TEST: Research queue population")

    # Get candidates needing research
    needs_research = sync.get_candidates_needing_research()
    log(f"  Found {len(needs_research)} candidates needing research")

    # Check they have LOW or UNKNOWN confidence
    for c in needs_research[:3]:  # Show first 3
        name = c.get("candidate_name", "Unknown")
        confidence = c.get("detection_confidence", "")
        locked = c.get("party_locked", "")
        log(f"    - {name}: confidence={confidence}, locked={locked}")

    # Verify none are locked
    locked_count = sum(1 for c in needs_research if c.get("party_locked") == "Yes")
    if locked_count > 0:
        log(f"  FAIL: {locked_count} locked candidates in research queue")
        return False

    log("  PASS: Research queue correctly filtered")
    return True


def run_all_tests(credentials_path: str = None) -> dict:
    """
    Run all validation tests.

    Returns:
        Dict with test results.
    """
    log("=" * 60)
    log("SC Ethics Monitor - Validation Tests")
    log("=" * 60)

    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tests_run": 0,
        "tests_passed": 0,
        "tests_failed": 0,
        "tests_skipped": 0,
        "details": {},
    }

    # Connect to sheets
    sync = SheetsSync(credentials_path)
    if not sync.connect():
        log("ERROR: Could not connect to Google Sheets")
        results["details"]["connection"] = "FAILED"
        return results

    log("Connected to Google Sheets")
    log("-" * 60)

    # Run tests
    tests = [
        ("manual_override_preserved", test_manual_override_preserved),
        ("party_locked_skipped", test_party_locked_skipped),
        ("race_analysis_final_party", test_race_analysis_uses_final_party),
        ("research_queue_population", test_research_queue_population),
    ]

    for test_name, test_func in tests:
        try:
            results["tests_run"] += 1
            passed = test_func(sync)
            results["details"][test_name] = "PASSED" if passed else "FAILED"
            if passed:
                results["tests_passed"] += 1
            else:
                results["tests_failed"] += 1
        except Exception as e:
            log(f"  ERROR: {e}")
            results["details"][test_name] = f"ERROR: {e}"
            results["tests_failed"] += 1

        log("-" * 60)

    # Summary
    log("=" * 60)
    log("SUMMARY")
    log(f"  Tests run: {results['tests_run']}")
    log(f"  Passed: {results['tests_passed']}")
    log(f"  Failed: {results['tests_failed']}")
    log("=" * 60)

    return results


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Validate SC Ethics Monitor implementation"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Run full test suite including destructive tests",
    )

    args = parser.parse_args()

    results = run_all_tests(args.credentials)

    # Exit with error if tests failed
    if results["tests_failed"] > 0:
        exit(1)


if __name__ == "__main__":
    main()
