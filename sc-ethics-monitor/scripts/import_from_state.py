#!/usr/bin/env python3
"""
Import candidates from sc-ethics-report-monitor state.json to Google Sheets.

This script:
1. Loads state.json from the sc-ethics-report-monitor project
2. Parses each candidate's office field to extract district_id
3. Adds candidates to the Google Sheet Candidates tab
4. Logs the import to Sync Log

Usage:
    python scripts/import_from_state.py
    python scripts/import_from_state.py --credentials path/to/creds.json
    python scripts/import_from_state.py --state-json path/to/state.json
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync


def log(message: str) -> None:
    """Print log message."""
    print(f"[IMPORT] {message}")


def parse_district_id(office: str) -> str | None:
    """
    Parse office string to extract district_id.

    Examples:
        "SC House of Representatives District 91" -> "SC-House-091"
        "SC Senate District 42" -> "SC-Senate-042"
        "Governor" -> None
    """
    # House pattern
    house_match = re.search(r'SC House of Representatives District (\d+)', office, re.IGNORECASE)
    if house_match:
        num = int(house_match.group(1))
        return f"SC-House-{num:03d}"

    # Senate pattern
    senate_match = re.search(r'SC Senate District (\d+)', office, re.IGNORECASE)
    if senate_match:
        num = int(senate_match.group(1))
        return f"SC-Senate-{num:03d}"

    # Alternative Senate pattern
    senate_match2 = re.search(r'State Senate District (\d+)', office, re.IGNORECASE)
    if senate_match2:
        num = int(senate_match2.group(1))
        return f"SC-Senate-{num:03d}"

    return None


def load_state_json(path: str = None) -> dict:
    """Load state.json from sc-ethics-report-monitor."""
    if path:
        p = Path(path)
    else:
        # Default location relative to this project
        possible = [
            Path("/Users/russellteter/Desktop/sc-ethics-report-monitor/state.json"),
            Path(__file__).parent.parent.parent.parent / "sc-ethics-report-monitor" / "state.json",
            Path("../sc-ethics-report-monitor/state.json"),
        ]
        p = None
        for pp in possible:
            if pp.exists():
                p = pp
                break

    if not p or not p.exists():
        log(f"ERROR: state.json not found")
        log(f"  Tried: {[str(pp) for pp in possible]}")
        return {}

    log(f"Loading state.json from: {p}")
    with open(p) as f:
        return json.load(f)


def main():
    parser = argparse.ArgumentParser(
        description="Import candidates from state.json to Google Sheets"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    parser.add_argument(
        "--state-json",
        help="Path to state.json file",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be imported without writing to sheets",
    )
    parser.add_argument(
        "--include-historical",
        action="store_true",
        help="Also import candidates from historical_2025 section",
    )

    args = parser.parse_args()

    log("=" * 60)
    log("SC Ethics Monitor - Import from state.json")
    log("=" * 60)

    # Load state.json
    state = load_state_json(args.state_json)
    if not state:
        sys.exit(1)

    # Collect candidates to import
    candidates = []

    # Primary source: reports_with_metadata
    reports = state.get("reports_with_metadata", {})
    log(f"Found {len(reports)} candidates in reports_with_metadata")

    for report_id, data in reports.items():
        district_id = parse_district_id(data.get("office", ""))
        if not district_id:
            log(f"  Skipping {data.get('candidate_name')} - non-legislative office: {data.get('office')}")
            continue

        candidates.append({
            "report_id": report_id,
            "candidate_name": data.get("candidate_name", ""),
            "district_id": district_id,
            "filed_date": data.get("filed_date", ""),
            "ethics_report_url": data.get("url", ""),
            "office": data.get("office", ""),
        })

    # Optional: historical candidates
    if args.include_historical:
        historical = state.get("historical_2025", {})
        log(f"Found {len(historical)} candidates in historical_2025")

        for report_id, data in historical.items():
            # Skip if already in reports_with_metadata
            if report_id in reports:
                continue

            district_id = parse_district_id(data.get("office", ""))
            if not district_id:
                continue

            candidates.append({
                "report_id": report_id,
                "candidate_name": data.get("candidate_name", ""),
                "district_id": district_id,
                "filed_date": data.get("filed_date", ""),
                "ethics_report_url": data.get("url", ""),
                "office": data.get("office", ""),
            })

    log(f"\nTotal legislative candidates to import: {len(candidates)}")
    log("-" * 60)

    if args.dry_run:
        log("DRY RUN - showing candidates without importing:")
        for c in candidates:
            log(f"  {c['report_id']}: {c['candidate_name']} ({c['district_id']})")
        log("\nRe-run without --dry-run to import")
        sys.exit(0)

    # Connect to Google Sheets
    sync = SheetsSync(args.credentials)
    if not sync.connect():
        log("ERROR: Could not connect to Google Sheets")
        log("Make sure you have valid credentials.json")
        sys.exit(1)

    log("Connected to Google Sheets")
    log("-" * 60)

    # Import candidates
    added = 0
    updated = 0
    errors = 0

    for i, c in enumerate(candidates, 1):
        try:
            log(f"[{i}/{len(candidates)}] {c['candidate_name']} ({c['district_id']})")

            result = sync.add_candidate(
                report_id=c["report_id"],
                candidate_name=c["candidate_name"],
                district_id=c["district_id"],
                filed_date=c["filed_date"],
                ethics_report_url=c["ethics_report_url"],
                is_incumbent=False,  # Will be determined by sheets_sync
            )

            if result.get("action") == "added":
                added += 1
                log(f"    -> Added")
            elif result.get("action") == "updated":
                updated += 1
                log(f"    -> Updated")
            else:
                log(f"    -> {result.get('action', 'unknown')}")

        except Exception as e:
            errors += 1
            log(f"    -> ERROR: {e}")

    # Log the import
    sync.log_sync(
        event_type="IMPORT",
        details=f"Imported candidates from state.json",
        candidates_added=added,
        candidates_updated=updated,
        party_detections=0,
        errors=errors,
    )

    log("-" * 60)
    log("Import complete!")
    log(f"  Added: {added}")
    log(f"  Updated: {updated}")
    log(f"  Errors: {errors}")
    log("")
    log("Next steps:")
    log("  1. Run party detection to identify party affiliations")
    log("  2. Check Research Queue for candidates needing manual verification")
    log("")
    log("Sheet URL:")
    log("  https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit")
    log("=" * 60)


if __name__ == "__main__":
    main()
