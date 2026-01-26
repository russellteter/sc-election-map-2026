#!/usr/bin/env python3
"""
Restore Dropdowns to Source of Truth Static Columns.

This script restores data validation dropdowns that were lost when the
"Lists" tab was deleted. These dropdowns are for user-managed static
columns (A-L) in the Source of Truth tab.

Columns restored:
- C (Incumbent Party): D, R
- G (Tenure): Open, First-term, Veteran, Long-serving
- J (Region): Upstate, Midlands, Lowcountry, Pee Dee

Usage:
    python scripts/restore_sot_dropdowns.py [--dry-run]

Options:
    --dry-run    Show what would be done without making changes
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import gspread
    from google.oauth2.service_account import Credentials
    from gspread_formatting import (
        DataValidationRule,
        BooleanCondition,
        set_data_validation_for_cell_range,
    )
except ImportError:
    print("Required packages not installed.")
    print("Run: pip install gspread google-auth gspread-formatting")
    sys.exit(1)

from src.config import (
    SPREADSHEET_ID,
    TAB_SOURCE_OF_TRUTH,
    SOT_STATIC_DROPDOWNS,
    GOOGLE_SHEETS_CREDENTIALS,
)


def connect_to_sheets(credentials_path: str = None):
    """Connect to Google Sheets API."""
    creds_path = credentials_path or GOOGLE_SHEETS_CREDENTIALS

    try:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ]

        creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SPREADSHEET_ID)

        return spreadsheet

    except FileNotFoundError:
        print(f"Error: Credentials file not found: {creds_path}")
        return None
    except Exception as e:
        print(f"Error connecting to Google Sheets: {e}")
        return None


def restore_dropdowns(spreadsheet, dry_run: bool = False) -> dict:
    """
    Restore dropdowns to Source of Truth static columns.

    Args:
        spreadsheet: gspread Spreadsheet object
        dry_run: If True, only show what would be done

    Returns:
        Dict with results summary
    """
    results = {
        "columns_processed": 0,
        "dropdowns_applied": 0,
        "errors": [],
    }

    # Get Source of Truth worksheet
    try:
        worksheet = spreadsheet.worksheet(TAB_SOURCE_OF_TRUTH)
    except gspread.WorksheetNotFound:
        results["errors"].append(f"Tab not found: {TAB_SOURCE_OF_TRUTH}")
        return results

    # Get row count (excluding header)
    all_values = worksheet.get_all_values()
    row_count = len(all_values)

    if row_count <= 1:
        results["errors"].append("Source of Truth tab appears empty (no data rows)")
        return results

    print(f"Source of Truth has {row_count - 1} data rows (rows 2-{row_count})")
    print()

    # Apply dropdowns to each static column
    for col_letter, config in SOT_STATIC_DROPDOWNS.items():
        dropdown_name = config["name"]
        values = config["values"]

        # Range: column letter + rows 2 through last row
        range_notation = f"{col_letter}2:{col_letter}{row_count}"

        print(f"Column {col_letter} ({dropdown_name}):")
        print(f"  Range: {range_notation}")
        print(f"  Values: {values}")

        results["columns_processed"] += 1

        if dry_run:
            print(f"  [DRY RUN] Would apply dropdown validation")
            print()
            continue

        try:
            # Create data validation rule with inline values
            validation_rule = DataValidationRule(
                BooleanCondition("ONE_OF_LIST", values),
                showCustomUi=True,
            )

            # Apply to range
            set_data_validation_for_cell_range(worksheet, range_notation, validation_rule)

            results["dropdowns_applied"] += 1
            print(f"  Successfully applied dropdown")

        except Exception as e:
            error_msg = f"Column {col_letter}: {e}"
            results["errors"].append(error_msg)
            print(f"  ERROR: {e}")

        print()

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Restore dropdowns to Source of Truth static columns"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be done without making changes"
    )
    parser.add_argument(
        "--credentials",
        type=str,
        default=None,
        help="Path to Google service account credentials JSON"
    )

    args = parser.parse_args()

    print("=" * 60)
    print("SC Ethics Monitor - Restore Source of Truth Dropdowns")
    print("=" * 60)
    print()

    if args.dry_run:
        print("[DRY RUN MODE - No changes will be made]")
        print()

    # Connect to Google Sheets
    print("Connecting to Google Sheets...")
    spreadsheet = connect_to_sheets(args.credentials)

    if spreadsheet is None:
        print("Failed to connect to Google Sheets")
        sys.exit(1)

    print(f"Connected to: {spreadsheet.title}")
    print()

    # Restore dropdowns
    results = restore_dropdowns(spreadsheet, dry_run=args.dry_run)

    # Summary
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Columns processed: {results['columns_processed']}")
    print(f"Dropdowns applied: {results['dropdowns_applied']}")

    if results["errors"]:
        print(f"Errors: {len(results['errors'])}")
        for error in results["errors"]:
            print(f"  - {error}")
        sys.exit(1)
    else:
        print("No errors")

    print()
    if args.dry_run:
        print("Dry run complete. Run without --dry-run to apply changes.")
    else:
        print("Dropdowns restored successfully!")
        print()
        print("Verification:")
        print("  1. Open the Source of Truth tab in Google Sheets")
        print("  2. Click a cell in column C, G, or J (rows 2+)")
        print("  3. You should see a dropdown arrow with the values")


if __name__ == "__main__":
    main()
