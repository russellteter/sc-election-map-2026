#!/usr/bin/env python3
"""
Populate incumbent data in Google Sheets from party-data.json.

This script reads incumbent information from the party-data.json file
and populates the incumbent_name and incumbent_party columns in both
the Race Analysis and Districts tabs of the SC Ethics Monitor Google Sheet.

Usage:
    python scripts/populate_incumbents.py [--dry-run]

Options:
    --dry-run    Show what would be updated without making changes
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    print("Required packages not installed. Run: pip install gspread google-auth")
    sys.exit(1)

from src.config import (
    SPREADSHEET_ID,
    TAB_RACE_ANALYSIS,
    TAB_DISTRICTS,
    RACE_ANALYSIS_COLUMNS,
    DISTRICTS_COLUMNS,
    GOOGLE_SHEETS_CREDENTIALS,
    SC_HOUSE_DISTRICTS,
    SC_SENATE_DISTRICTS,
)


def load_party_data() -> dict:
    """Load party-data.json and return incumbents data."""
    # Try multiple possible locations
    possible_paths = [
        Path(__file__).parent.parent.parent / "src" / "data" / "party-data.json",
        Path(__file__).parent.parent / "data" / "party-data.json",
        Path(__file__).parent.parent / "src" / "data" / "party-data.json",
    ]

    for path in possible_paths:
        if path.exists():
            print(f"Loading party data from: {path}")
            with open(path) as f:
                data = json.load(f)
            return data.get("incumbents", {})

    raise FileNotFoundError(f"party-data.json not found in any of: {possible_paths}")


def connect_to_sheets():
    """Connect to Google Sheets API."""
    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
    ]

    project_root = Path(__file__).parent.parent.parent  # sc-election-map-2026

    # Try multiple credentials paths
    cred_paths = [
        Path(GOOGLE_SHEETS_CREDENTIALS),
        Path(__file__).parent.parent / GOOGLE_SHEETS_CREDENTIALS,
        Path(__file__).parent.parent / "credentials.json",
        Path.home() / ".config" / "sc-ethics-monitor" / "credentials.json",
        # Additional project-level paths
        project_root / "google-service-account.json",
        project_root / "google-service-account copy.json",
        project_root / "credentials.json",
    ]

    for cred_path in cred_paths:
        if cred_path.exists():
            print(f"Using credentials from: {cred_path}")
            creds = Credentials.from_service_account_file(str(cred_path), scopes=scopes)
            client = gspread.authorize(creds)
            return client.open_by_key(SPREADSHEET_ID)

    # Also check environment variable for path
    import os
    env_path = os.environ.get("GOOGLE_SHEETS_CREDENTIALS")
    if env_path and Path(env_path).exists():
        print(f"Using credentials from env: {env_path}")
        creds = Credentials.from_service_account_file(env_path, scopes=scopes)
        client = gspread.authorize(creds)
        return client.open_by_key(SPREADSHEET_ID)

    raise FileNotFoundError(f"Credentials file not found in any of: {cred_paths}")


def build_district_id(chamber: str, district_num: str) -> str:
    """Build district ID in format SC-House-042 or SC-Senate-001."""
    num = int(district_num)
    return f"SC-{chamber.capitalize()}-{num:03d}"


def col_letter(col_index: int) -> str:
    """Convert 0-based column index to letter (0 -> A, 1 -> B, etc)."""
    return chr(ord('A') + col_index)


def populate_race_analysis(spreadsheet, incumbents: dict, dry_run: bool = False) -> dict:
    """
    Populate incumbent_name and incumbent_party in Race Analysis tab.

    Args:
        spreadsheet: gspread Spreadsheet object
        incumbents: Dict with house/senate incumbent data
        dry_run: If True, don't make changes

    Returns:
        Summary dict with counts
    """
    print("\n=== Updating Race Analysis tab ===")

    worksheet = spreadsheet.worksheet(TAB_RACE_ANALYSIS)
    all_values = worksheet.get_all_values()

    if len(all_values) <= 1:
        print("Race Analysis tab is empty (no data rows)")
        return {"updated": 0, "skipped": 0, "errors": 0}

    # Find rows by district_id
    district_id_col = RACE_ANALYSIS_COLUMNS["district_id"]
    incumbent_name_col = RACE_ANALYSIS_COLUMNS["incumbent_name"]
    incumbent_party_col = RACE_ANALYSIS_COLUMNS["incumbent_party"]

    updates = []
    stats = {"updated": 0, "skipped": 0, "not_found": 0}

    # Build lookup of existing rows by district_id
    row_lookup = {}
    for row_idx, row in enumerate(all_values[1:], start=2):
        if row and len(row) > district_id_col and row[district_id_col]:
            row_lookup[row[district_id_col]] = row_idx

    # Process each incumbent
    for chamber in ["house", "senate"]:
        chamber_data = incumbents.get(chamber, {})
        for district_num, incumbent_info in chamber_data.items():
            district_id = build_district_id(chamber, district_num)

            if district_id not in row_lookup:
                print(f"  District not found in sheet: {district_id}")
                stats["not_found"] += 1
                continue

            row_num = row_lookup[district_id]
            name = incumbent_info.get("name", "")
            party = incumbent_info.get("party", "")

            # Convert full party name to code
            party_code = "R" if party == "Republican" else "D" if party == "Democratic" else party

            # Check current values
            current_row = all_values[row_num - 1]
            current_name = current_row[incumbent_name_col] if len(current_row) > incumbent_name_col else ""
            current_party = current_row[incumbent_party_col] if len(current_row) > incumbent_party_col else ""

            if current_name == name and current_party == party_code:
                stats["skipped"] += 1
                continue

            # Build update
            name_cell = f"{col_letter(incumbent_name_col)}{row_num}"
            party_cell = f"{col_letter(incumbent_party_col)}{row_num}"

            updates.append({
                "range": name_cell,
                "values": [[name]]
            })
            updates.append({
                "range": party_cell,
                "values": [[party_code]]
            })

            print(f"  {district_id}: {name} ({party_code})")
            stats["updated"] += 1

    if dry_run:
        print(f"\n[DRY RUN] Would update {stats['updated']} incumbents in Race Analysis")
    elif updates:
        print(f"\nApplying {len(updates)} cell updates...")
        worksheet.batch_update(updates)
        print("Done!")

    return stats


def populate_districts(spreadsheet, incumbents: dict, dry_run: bool = False) -> dict:
    """
    Populate incumbent_name and incumbent_party in Districts tab.

    Args:
        spreadsheet: gspread Spreadsheet object
        incumbents: Dict with house/senate incumbent data
        dry_run: If True, don't make changes

    Returns:
        Summary dict with counts
    """
    print("\n=== Updating Districts tab ===")

    worksheet = spreadsheet.worksheet(TAB_DISTRICTS)
    all_values = worksheet.get_all_values()

    if len(all_values) <= 1:
        print("Districts tab is empty (no data rows)")
        return {"updated": 0, "skipped": 0, "errors": 0}

    # Find rows by district_id
    district_id_col = DISTRICTS_COLUMNS["district_id"]
    incumbent_name_col = DISTRICTS_COLUMNS["incumbent_name"]
    incumbent_party_col = DISTRICTS_COLUMNS["incumbent_party"]

    updates = []
    stats = {"updated": 0, "skipped": 0, "not_found": 0}

    # Build lookup of existing rows by district_id
    row_lookup = {}
    for row_idx, row in enumerate(all_values[1:], start=2):
        if row and len(row) > district_id_col and row[district_id_col]:
            row_lookup[row[district_id_col]] = row_idx

    # Process each incumbent
    for chamber in ["house", "senate"]:
        chamber_data = incumbents.get(chamber, {})
        for district_num, incumbent_info in chamber_data.items():
            district_id = build_district_id(chamber, district_num)

            if district_id not in row_lookup:
                print(f"  District not found in sheet: {district_id}")
                stats["not_found"] += 1
                continue

            row_num = row_lookup[district_id]
            name = incumbent_info.get("name", "")
            party = incumbent_info.get("party", "")

            # Convert full party name to code
            party_code = "R" if party == "Republican" else "D" if party == "Democratic" else party

            # Check current values
            current_row = all_values[row_num - 1]
            current_name = current_row[incumbent_name_col] if len(current_row) > incumbent_name_col else ""
            current_party = current_row[incumbent_party_col] if len(current_row) > incumbent_party_col else ""

            if current_name == name and current_party == party_code:
                stats["skipped"] += 1
                continue

            # Build update
            name_cell = f"{col_letter(incumbent_name_col)}{row_num}"
            party_cell = f"{col_letter(incumbent_party_col)}{row_num}"

            updates.append({
                "range": name_cell,
                "values": [[name]]
            })
            updates.append({
                "range": party_cell,
                "values": [[party_code]]
            })

            print(f"  {district_id}: {name} ({party_code})")
            stats["updated"] += 1

    if dry_run:
        print(f"\n[DRY RUN] Would update {stats['updated']} incumbents in Districts")
    elif updates:
        print(f"\nApplying {len(updates)} cell updates...")
        worksheet.batch_update(updates)
        print("Done!")

    return stats


def main():
    """Main entry point."""
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("=== DRY RUN MODE - No changes will be made ===\n")

    print("SC Ethics Monitor - Incumbent Data Population")
    print("=" * 50)
    print(f"Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print(f"Spreadsheet ID: {SPREADSHEET_ID}")
    print()

    # Load incumbent data
    try:
        incumbents = load_party_data()
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    house_count = len(incumbents.get("house", {}))
    senate_count = len(incumbents.get("senate", {}))
    print(f"Loaded incumbents: {house_count} House + {senate_count} Senate = {house_count + senate_count} total")

    # Count by party
    house_r = sum(1 for v in incumbents.get("house", {}).values() if v.get("party") == "Republican")
    house_d = sum(1 for v in incumbents.get("house", {}).values() if v.get("party") == "Democratic")
    senate_r = sum(1 for v in incumbents.get("senate", {}).values() if v.get("party") == "Republican")
    senate_d = sum(1 for v in incumbents.get("senate", {}).values() if v.get("party") == "Democratic")
    print(f"  House: {house_r} Republican, {house_d} Democratic")
    print(f"  Senate: {senate_r} Republican, {senate_d} Democratic")

    # Connect to Google Sheets
    try:
        spreadsheet = connect_to_sheets()
        print(f"\nConnected to spreadsheet: {spreadsheet.title}")
    except Exception as e:
        print(f"ERROR connecting to Google Sheets: {e}")
        sys.exit(1)

    # Update Race Analysis tab
    race_stats = populate_race_analysis(spreadsheet, incumbents, dry_run)

    # Update Districts tab
    districts_stats = populate_districts(spreadsheet, incumbents, dry_run)

    # Summary
    print("\n" + "=" * 50)
    print("SUMMARY")
    print("=" * 50)
    print(f"Race Analysis: {race_stats['updated']} updated, {race_stats['skipped']} unchanged, {race_stats.get('not_found', 0)} not found")
    print(f"Districts: {districts_stats['updated']} updated, {districts_stats['skipped']} unchanged, {districts_stats.get('not_found', 0)} not found")

    total_updated = race_stats['updated'] + districts_stats['updated']
    print(f"\nTotal cells updated: {total_updated * 2} (name + party for each)")

    if dry_run:
        print("\n[DRY RUN] No changes were made. Remove --dry-run to apply updates.")


if __name__ == "__main__":
    main()
