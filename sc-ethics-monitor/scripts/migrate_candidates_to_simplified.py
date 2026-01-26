#!/usr/bin/env python3
"""
Migrate Candidates tab from 16-column legacy format to 9-column simplified format.

ONE-TIME MIGRATION SCRIPT - Run once, then archive.

Legacy format (16 columns A-P):
  A: report_id, B: candidate_name, C: district_id, D: filed_date,
  E: ethics_report_url, F: is_incumbent, G: detected_party,
  H: detection_confidence, I: detection_source, J: detection_evidence_url,
  K: manual_party_override, L: final_party, M: party_locked,
  N: detection_timestamp, O: notes, P: last_synced

Simplified format (9 columns A-I):
  A: district_id, B: candidate_name, C: party, D: filed_date,
  E: report_id, F: ethics_url, G: is_incumbent, H: notes, I: last_synced

Data mapping:
  - district_id: C -> A
  - candidate_name: B -> B
  - party: L (final_party) or G (detected_party) -> C
  - filed_date: D -> D
  - report_id: A -> E
  - ethics_url: E -> F (preserve HYPERLINK formula)
  - is_incumbent: F -> G
  - notes: O -> H
  - last_synced: -> I (set to migration timestamp)

Dropped columns (no data loss - all empty or redundant):
  - detection_confidence (H) - never populated
  - detection_source (I) - minimal use
  - detection_evidence_url (J) - always empty
  - manual_party_override (K) - always empty
  - party_locked (M) - always empty
  - detection_timestamp (N) - metadata only
  - detected_party (G) - redundant with final_party (L)
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    print("Required packages not installed. Run: pip install gspread google-auth")
    sys.exit(1)

from src.config import (
    SPREADSHEET_ID,
    TAB_CANDIDATES,
    CANDIDATES_HEADERS,
    GOOGLE_SHEETS_CREDENTIALS,
)


def connect_to_sheets(credentials_path: str = None) -> tuple:
    """Connect to Google Sheets and return (client, spreadsheet)."""
    creds_path = credentials_path or GOOGLE_SHEETS_CREDENTIALS

    # Try alternative path if not found
    if not Path(creds_path).exists():
        project_root = Path(__file__).parent.parent.parent
        alt_path = project_root / "google-service-account copy.json"
        if alt_path.exists():
            creds_path = str(alt_path)

    scopes = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
    ]

    creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
    client = gspread.authorize(creds)
    spreadsheet = client.open_by_key(SPREADSHEET_ID)

    return client, spreadsheet


def backup_candidates(worksheet, backup_path: Path) -> dict:
    """
    Backup current Candidates data to JSON file.

    Returns:
        Dict with backup metadata and data.
    """
    all_values = worksheet.get_all_values()

    if len(all_values) <= 1:
        return {"rows": 0, "data": []}

    headers = all_values[0]
    data = []

    for row in all_values[1:]:
        record = {}
        for i, header in enumerate(headers):
            if i < len(row):
                record[header] = row[i]
        data.append(record)

    backup = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "row_count": len(data),
        "headers": headers,
        "data": data,
    }

    # Write backup
    with open(backup_path, "w") as f:
        json.dump(backup, f, indent=2)

    print(f"Backed up {len(data)} rows to {backup_path}")

    return backup


def transform_legacy_to_simplified(backup_data: dict) -> list:
    """
    Transform legacy 16-column data to simplified 9-column format.

    Returns:
        List of rows (each row is a list of values).
    """
    simplified_rows = []
    now = datetime.now(timezone.utc).isoformat()

    for record in backup_data["data"]:
        # Get party - prefer final_party over detected_party
        party = record.get("final_party", "") or record.get("detected_party", "")

        # Normalize party to single character
        if party:
            party = party.strip().upper()
            if party in ("DEMOCRAT", "DEMOCRATIC"):
                party = "D"
            elif party in ("REPUBLICAN",):
                party = "R"
            elif party in ("INDEPENDENT",):
                party = "I"
            elif party in ("OTHER",):
                party = "O"
            elif len(party) > 1 and party not in ("D", "R", "I", "O", "?"):
                party = party[0] if party[0] in "DRIO" else "?"

        # Get is_incumbent - normalize to Yes/No
        is_incumbent_raw = record.get("is_incumbent", "")
        is_incumbent = "Yes" if is_incumbent_raw in ("Yes", "TRUE", "true", True) else "No"

        # Build simplified row
        # Order: district_id, candidate_name, party, filed_date, report_id, ethics_url, is_incumbent, notes, last_synced
        row = [
            record.get("district_id", ""),
            record.get("candidate_name", ""),
            party,
            record.get("filed_date", ""),
            record.get("report_id", ""),
            record.get("ethics_report_url", ""),  # Preserve HYPERLINK formula
            is_incumbent,
            record.get("notes", ""),
            now,  # Update last_synced to migration timestamp
        ]

        simplified_rows.append(row)

    return simplified_rows


def migrate_candidates(dry_run: bool = False, skip_backup: bool = False) -> bool:
    """
    Migrate Candidates tab from legacy to simplified format.

    Args:
        dry_run: If True, show what would happen without making changes.
        skip_backup: If True, skip backup step (use if backup already exists).

    Returns:
        True if successful, False otherwise.
    """
    print("=" * 60)
    print("CANDIDATES TAB MIGRATION: 16 columns -> 9 columns")
    print("=" * 60)

    # Connect to Google Sheets
    print("\n1. Connecting to Google Sheets...")
    try:
        _, spreadsheet = connect_to_sheets()
        worksheet = spreadsheet.worksheet(TAB_CANDIDATES)
        print(f"   Connected to spreadsheet: {spreadsheet.title}")
        print(f"   Found Candidates tab")
    except Exception as e:
        print(f"   ERROR: {e}")
        return False

    # Check current format
    print("\n2. Checking current format...")
    all_values = worksheet.get_all_values()

    if len(all_values) <= 1:
        print("   WARNING: Candidates tab is empty or has only header row")
        return True

    current_headers = all_values[0]
    current_row_count = len(all_values) - 1

    print(f"   Current columns: {len(current_headers)}")
    print(f"   Current rows: {current_row_count}")
    print(f"   First column header: '{current_headers[0]}'")

    # Check if already migrated
    if current_headers[0] == "district_id" and len(current_headers) <= 10:
        print("   Already migrated to simplified format!")
        return True

    if current_headers[0] != "report_id":
        print(f"   ERROR: Unexpected format. Expected 'report_id' as first column, got '{current_headers[0]}'")
        return False

    print("   Format: LEGACY (16 columns)")

    # Phase 1: Backup
    if not skip_backup:
        print("\n3. Creating backup...")
        backup_dir = Path(__file__).parent / "data"
        backup_dir.mkdir(exist_ok=True)
        backup_path = backup_dir / f"candidates_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        backup_data = backup_candidates(worksheet, backup_path)
    else:
        print("\n3. Skipping backup (--skip-backup specified)")
        # Read data directly
        headers = all_values[0]
        backup_data = {
            "data": [
                {headers[i]: row[i] for i in range(len(headers)) if i < len(row)}
                for row in all_values[1:]
            ]
        }

    # Phase 2: Transform data
    print("\n4. Transforming to simplified format...")
    simplified_rows = transform_legacy_to_simplified(backup_data)
    print(f"   Transformed {len(simplified_rows)} rows")

    # Show sample transformation
    if simplified_rows:
        print("\n   Sample transformation (first row):")
        print(f"     district_id:    {simplified_rows[0][0]}")
        print(f"     candidate_name: {simplified_rows[0][1]}")
        print(f"     party:          {simplified_rows[0][2]}")
        print(f"     filed_date:     {simplified_rows[0][3]}")
        print(f"     report_id:      {simplified_rows[0][4]}")
        print(f"     ethics_url:     {simplified_rows[0][5][:50]}...")
        print(f"     is_incumbent:   {simplified_rows[0][6]}")
        print(f"     notes:          {simplified_rows[0][7][:30] if simplified_rows[0][7] else '(empty)'}")

    if dry_run:
        print("\n" + "=" * 60)
        print("DRY RUN - No changes made")
        print("=" * 60)
        print(f"Would migrate {len(simplified_rows)} rows to simplified format")
        return True

    # Phase 3: Clear and rewrite sheet
    print("\n5. Clearing and rewriting sheet...")

    # Clear entire sheet
    worksheet.clear()
    print("   Cleared existing data")

    # Write new headers
    worksheet.append_row(CANDIDATES_HEADERS)
    print(f"   Wrote headers: {CANDIDATES_HEADERS}")

    # Write data in batches
    if simplified_rows:
        batch_size = 100
        for i in range(0, len(simplified_rows), batch_size):
            batch = simplified_rows[i:i + batch_size]
            worksheet.append_rows(batch, value_input_option="USER_ENTERED")
            print(f"   Wrote rows {i + 1} to {min(i + batch_size, len(simplified_rows))}")

    # Phase 4: Verify
    print("\n6. Verifying migration...")
    new_values = worksheet.get_all_values()
    new_row_count = len(new_values) - 1

    print(f"   New column count: {len(new_values[0])}")
    print(f"   New row count: {new_row_count}")
    print(f"   New headers: {new_values[0]}")

    if new_row_count != current_row_count:
        print(f"   WARNING: Row count changed! Before: {current_row_count}, After: {new_row_count}")
    else:
        print(f"   Row count verified: {new_row_count}")

    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE")
    print("=" * 60)
    print(f"Migrated {new_row_count} rows from 16-column to 9-column format")
    print("\nNext steps:")
    print("1. Run: python -m pytest tests/ -v (verify tests pass)")
    print("2. Run: python scripts/export_to_webapp.py --dry-run (verify export)")
    print("3. Apply formatting: python -c \"from src.sheet_formatting import ...; ...\"")

    return True


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Migrate Candidates tab from 16-column to 9-column format"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would happen without making changes"
    )
    parser.add_argument(
        "--skip-backup",
        action="store_true",
        help="Skip backup step (use if backup already exists)"
    )

    args = parser.parse_args()

    success = migrate_candidates(dry_run=args.dry_run, skip_backup=args.skip_backup)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
