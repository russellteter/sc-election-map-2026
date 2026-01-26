#!/usr/bin/env python3
"""
Initialize Google Sheet with simplified 3-tab structure.

This script:
1. Creates the 3 required tabs (Districts, Candidates, Race Analysis)
2. Adds headers to each tab
3. Initializes all 170 SC legislative districts
4. Optionally migrates data from the old 5-tab structure

Usage:
    python scripts/initialize_sheet.py
    python scripts/initialize_sheet.py --credentials path/to/creds.json
    python scripts/initialize_sheet.py --incumbents path/to/incumbents.json
    python scripts/initialize_sheet.py --migrate  # Migrate from old structure
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync
from src.config import (
    TAB_CANDIDATES,
    TAB_DISTRICTS,
    TAB_RACE_ANALYSIS,
    CANDIDATES_HEADERS,
    DISTRICTS_HEADERS,
    RACE_ANALYSIS_HEADERS,
    CANDIDATES_HEADERS_LEGACY,
    SPREADSHEET_ID,
)


def log(message: str) -> None:
    """Print log message."""
    print(f"[INIT] {message}")


def load_incumbents(path: str = None) -> dict:
    """Load incumbents data."""
    if path:
        p = Path(path)
    else:
        # Try common locations
        possible = [
            Path(__file__).parent.parent / "data" / "incumbents.json",
            Path(__file__).parent.parent.parent / "src" / "data" / "party-data.json",
            Path(__file__).parent.parent.parent / "public" / "data" / "candidates.json",
        ]
        p = None
        for pp in possible:
            if pp.exists():
                p = pp
                break

    if not p or not p.exists():
        log("No incumbents file found - districts will have empty incumbent columns")
        return {}

    try:
        with open(p) as f:
            data = json.load(f)
            # Handle party-data.json format
            if "incumbents" in data:
                return data["incumbents"]
            return data
    except Exception as e:
        log(f"Error loading incumbents: {e}")
        return {}


def migrate_from_legacy(sync: SheetsSync) -> dict:
    """
    Migrate data from old 5-tab structure to new 3-tab structure.

    Reads from old Candidates tab (16 columns) and writes to new structure (9 columns).

    Returns:
        Summary dict with migration counts.
    """
    log("Migrating from legacy structure...")

    results = {
        "candidates_migrated": 0,
        "errors": [],
    }

    try:
        # Try to read from old Candidates tab
        try:
            old_worksheet = sync.spreadsheet.worksheet("Candidates")
            old_values = old_worksheet.get_all_values()
        except Exception as e:
            log(f"  No existing Candidates tab to migrate: {e}")
            return results

        if len(old_values) <= 1:
            log("  No candidates to migrate (empty tab)")
            return results

        headers = old_values[0]
        log(f"  Found {len(old_values) - 1} candidates in old structure")
        log(f"  Old headers: {', '.join(headers[:5])}...")

        # Check if this is old structure (has report_id in column A)
        if headers[0] != "report_id":
            log("  Tab already has new structure, skipping migration")
            return results

        # Map old columns to new structure
        migrated_candidates = []
        for row in old_values[1:]:
            if not row or not row[0]:
                continue

            # Old structure columns (0-indexed):
            # 0: report_id, 1: candidate_name, 2: district_id, 3: filed_date,
            # 4: ethics_report_url, 5: is_incumbent, 6: detected_party,
            # 7: detection_confidence, 8: detection_source, 9: detection_evidence_url,
            # 10: manual_party_override, 11: final_party, 12: party_locked,
            # 13: detection_timestamp, 14: notes, 15: last_synced

            def safe_get(idx):
                return row[idx] if idx < len(row) else ""

            # Get final party value (manual override takes precedence)
            party = safe_get(10) if safe_get(10) else safe_get(6)  # manual_party_override or detected_party

            migrated = {
                "district_id": safe_get(2),
                "candidate_name": safe_get(1),
                "party": party,
                "filed_date": safe_get(3),
                "report_id": safe_get(0),
                "ethics_url": safe_get(4),
                "is_incumbent": safe_get(5) == "Yes",
                "notes": safe_get(14),
            }

            migrated_candidates.append(migrated)

        if migrated_candidates:
            log(f"  Migrating {len(migrated_candidates)} candidates to new structure...")

            # Clear old data and write new structure
            old_worksheet.clear()
            old_worksheet.append_row(CANDIDATES_HEADERS)

            now = datetime.now(timezone.utc).isoformat()

            rows_to_add = []
            for c in migrated_candidates:
                # Build hyperlink formula
                ethics_url = c.get("ethics_url", "")
                if ethics_url and not ethics_url.startswith("="):
                    ethics_url = f'=HYPERLINK("{ethics_url}", "View Filing")'

                rows_to_add.append([
                    c.get("district_id", ""),
                    c.get("candidate_name", ""),
                    c.get("party", ""),
                    c.get("filed_date", ""),
                    c.get("report_id", ""),
                    ethics_url,
                    "Yes" if c.get("is_incumbent") else "No",
                    c.get("notes", ""),
                    now,
                ])

            old_worksheet.append_rows(rows_to_add, value_input_option="USER_ENTERED")
            results["candidates_migrated"] = len(migrated_candidates)
            log(f"  Migrated {len(migrated_candidates)} candidates")

    except Exception as e:
        log(f"  Migration error: {e}")
        results["errors"].append(str(e))

    return results


def delete_legacy_tabs(sync: SheetsSync) -> dict:
    """
    Delete deprecated tabs from the old structure.

    Removes:
    - Research Queue
    - Sync Log

    Returns:
        Summary dict with deletion counts.
    """
    results = {
        "tabs_deleted": 0,
        "errors": [],
    }

    deprecated_tabs = ["Research Queue", "Sync Log"]

    for tab_name in deprecated_tabs:
        try:
            worksheet = sync.spreadsheet.worksheet(tab_name)
            sync.spreadsheet.del_worksheet(worksheet)
            log(f"  Deleted deprecated tab: {tab_name}")
            results["tabs_deleted"] += 1
        except Exception as e:
            # Tab might not exist, which is fine
            log(f"  Tab '{tab_name}' not found or could not be deleted: {e}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Initialize SC Ethics Monitor Google Sheet (Simplified 3-tab structure)"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    parser.add_argument(
        "--incumbents",
        help="Path to incumbents JSON file",
    )
    parser.add_argument(
        "--migrate",
        action="store_true",
        help="Migrate data from old 5-tab structure to new 3-tab structure",
    )
    parser.add_argument(
        "--delete-legacy",
        action="store_true",
        help="Delete deprecated tabs (Research Queue, Sync Log)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes",
    )

    args = parser.parse_args()

    log("=" * 60)
    log("SC Ethics Monitor - Sheet Initialization (Simplified)")
    log("=" * 60)
    log("New structure: 3 tabs (Districts, Candidates, Race Analysis)")
    log("")

    if args.dry_run:
        log("DRY RUN - No changes will be made")
        log("")

    # Connect to sheets
    sync = SheetsSync(args.credentials)
    if not sync.connect():
        log("ERROR: Could not connect to Google Sheets")
        log("Make sure you have valid credentials.json")
        sys.exit(1)

    log("Connected to Google Sheets")

    # Load incumbents
    incumbents = load_incumbents(args.incumbents)
    if incumbents:
        house_count = len(incumbents.get("house", {}))
        senate_count = len(incumbents.get("senate", {}))
        log(f"Loaded {house_count} House + {senate_count} Senate incumbents")

    log("-" * 60)

    if args.dry_run:
        log("Would create/update the following tabs:")
        log("  1. Districts - 170 rows with incumbent data")
        log("  2. Candidates - 9-column simplified structure")
        log("  3. Race Analysis - 6-column simplified structure")
        if args.migrate:
            log("Would migrate candidates from old 16-column structure")
        if args.delete_legacy:
            log("Would delete: Research Queue, Sync Log tabs")
        log("")
        log("DRY RUN complete - no changes made")
        return

    # Migrate from legacy if requested
    if args.migrate:
        migrate_results = migrate_from_legacy(sync)
        if migrate_results["candidates_migrated"] > 0:
            log(f"Migration complete: {migrate_results['candidates_migrated']} candidates")

    # Initialize tabs
    log("Creating/updating tabs...")

    # 1. Districts tab
    log("  1. Districts tab...")
    districts_count = sync.initialize_districts(incumbents)
    log(f"     Initialized {districts_count} districts")

    # 2. Candidates tab (just headers if empty)
    log("  2. Candidates tab...")
    sync._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)
    log("     Headers created (9 columns)")

    # 3. Race Analysis tab
    log("  3. Race Analysis tab...")
    sync._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)
    log("     Headers created (6 columns)")

    # Update race analysis
    log("  Updating Race Analysis...")
    districts_data = sync.get_districts()
    analysis_results = sync.update_race_analysis(districts_data)
    log(f"     Analyzed {analysis_results['districts_analyzed']} districts")
    log(f"     Districts needing D candidate: {analysis_results['needs_dem_candidates']}")

    # Delete legacy tabs if requested
    if args.delete_legacy:
        log("-" * 60)
        log("Deleting deprecated tabs...")
        delete_results = delete_legacy_tabs(sync)
        log(f"  Deleted {delete_results['tabs_deleted']} tabs")

    log("-" * 60)
    log("Initialization complete!")
    log("")
    log("New Structure:")
    log("  - Districts: 170 rows with incumbent info")
    log("  - Candidates: Simplified 9-column structure")
    log("  - Race Analysis: Simplified 6-column structure")
    log("")
    log("Next steps:")
    log("  1. Open the Google Sheet and verify tabs exist")
    log("  2. Review Districts tab for incumbent data")
    log("  3. Run a sync to populate Candidates")
    log("")
    log("Sheet URL:")
    log(f"  https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit")
    log("=" * 60)


if __name__ == "__main__":
    main()
