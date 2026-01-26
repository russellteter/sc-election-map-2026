#!/usr/bin/env python3
"""
Backup current Google Sheet data before migration.

Creates JSON backup of all tabs in the current sheet structure.
Run this BEFORE migrating to the simplified 3-tab structure.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync
from src.config import (
    TAB_DISTRICTS,
    TAB_CANDIDATES,
    TAB_RACE_ANALYSIS,
    TAB_RESEARCH_QUEUE,
    TAB_SYNC_LOG,
    CANDIDATES_HEADERS,
    DISTRICTS_HEADERS,
    RACE_ANALYSIS_HEADERS,
    RESEARCH_QUEUE_HEADERS,
    SYNC_LOG_HEADERS,
    GOOGLE_SHEETS_CREDENTIALS,
)


def backup_sheet(output_dir: str = None, dry_run: bool = False) -> bool:
    """
    Export all tabs from Google Sheet to JSON backup files.

    Args:
        output_dir: Directory for backup files (default: backups/)
        dry_run: If True, show what would be backed up without writing

    Returns:
        True if successful, False otherwise.
    """
    # Default output directory
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / "backups"
    else:
        output_dir = Path(output_dir)

    # Create timestamped backup folder
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = output_dir / f"backup_{timestamp}"

    if not dry_run:
        backup_dir.mkdir(parents=True, exist_ok=True)

    # Connect to Google Sheets
    creds_path = os.environ.get("GOOGLE_SHEETS_CREDENTIALS", GOOGLE_SHEETS_CREDENTIALS)

    # Try relative path from project root if absolute path doesn't exist
    if not Path(creds_path).exists():
        project_root = Path(__file__).parent.parent.parent
        alt_path = project_root / "google-service-account copy.json"
        if alt_path.exists():
            creds_path = str(alt_path)

    sync = SheetsSync(credentials_path=creds_path)

    if not sync.connect():
        print("Error: Failed to connect to Google Sheets")
        return False

    print("Connected to Google Sheets")

    # Define tabs to backup
    tabs = [
        (TAB_DISTRICTS, DISTRICTS_HEADERS),
        (TAB_CANDIDATES, CANDIDATES_HEADERS),
        (TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS),
        (TAB_RESEARCH_QUEUE, RESEARCH_QUEUE_HEADERS),
        (TAB_SYNC_LOG, SYNC_LOG_HEADERS),
    ]

    backup_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tabs": {},
    }

    for tab_name, headers in tabs:
        print(f"Backing up: {tab_name}...")
        try:
            worksheet = sync._get_or_create_worksheet(tab_name, headers)
            all_values = worksheet.get_all_values()

            if len(all_values) <= 1:
                print(f"  Empty or header-only: {len(all_values)} rows")
                backup_data["tabs"][tab_name] = {
                    "headers": all_values[0] if all_values else headers,
                    "rows": [],
                    "row_count": 0,
                }
                continue

            # Convert to list of dicts
            header_row = all_values[0]
            rows = []
            for row in all_values[1:]:
                if not row or not row[0]:
                    continue
                record = {}
                for i, header in enumerate(header_row):
                    if i < len(row):
                        record[header] = row[i]
                    else:
                        record[header] = ""
                rows.append(record)

            backup_data["tabs"][tab_name] = {
                "headers": header_row,
                "rows": rows,
                "row_count": len(rows),
            }
            print(f"  Backed up: {len(rows)} rows")

        except Exception as e:
            print(f"  Error backing up {tab_name}: {e}")
            backup_data["tabs"][tab_name] = {
                "error": str(e),
                "headers": headers,
                "rows": [],
                "row_count": 0,
            }

    if dry_run:
        print("\n--- DRY RUN: Would write backup to", backup_dir, "---")
        print(f"Total tabs: {len(backup_data['tabs'])}")
        for tab_name, data in backup_data["tabs"].items():
            print(f"  {tab_name}: {data['row_count']} rows")
        return True

    # Write combined backup
    backup_file = backup_dir / "full_backup.json"
    with open(backup_file, "w") as f:
        json.dump(backup_data, f, indent=2)
    print(f"\nWrote full backup to: {backup_file}")

    # Write individual tab files for easy inspection
    for tab_name, data in backup_data["tabs"].items():
        tab_file = backup_dir / f"{tab_name.replace(' ', '_').lower()}.json"
        with open(tab_file, "w") as f:
            json.dump(data, f, indent=2)
        print(f"  {tab_name}: {tab_file}")

    # Print candidate summary
    candidates_data = backup_data["tabs"].get(TAB_CANDIDATES, {})
    if candidates_data.get("rows"):
        print("\n=== CANDIDATE SUMMARY ===")
        print(f"Total candidates: {len(candidates_data['rows'])}")

        # Party breakdown
        party_counts = {}
        for candidate in candidates_data["rows"]:
            final_party = candidate.get("final_party") or candidate.get("detected_party") or "UNKNOWN"
            party_counts[final_party] = party_counts.get(final_party, 0) + 1

        print("Party breakdown:")
        for party, count in sorted(party_counts.items()):
            print(f"  {party}: {count}")

        # Manual overrides
        manual_count = sum(
            1 for c in candidates_data["rows"]
            if c.get("manual_party_override")
        )
        print(f"Manual overrides: {manual_count}")

        # Party locked
        locked_count = sum(
            1 for c in candidates_data["rows"]
            if c.get("party_locked") == "Yes"
        )
        print(f"Party locked: {locked_count}")

    print(f"\nBackup complete: {backup_dir}")
    return True


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Backup Google Sheet data before migration"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be backed up without writing"
    )
    parser.add_argument(
        "--output",
        help="Output directory (default: backups/)"
    )

    args = parser.parse_args()

    success = backup_sheet(output_dir=args.output, dry_run=args.dry_run)
    sys.exit(0 if success else 1)
