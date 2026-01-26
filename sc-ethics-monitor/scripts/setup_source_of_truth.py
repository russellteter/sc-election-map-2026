#!/usr/bin/env python3
"""
One-time setup script to configure the Source of Truth tab structure.

This script:
1. Adds columns to reach the 32-column structure (A-AF)
2. Sets headers for all dynamic columns
3. Applies data validation (dropdowns) for Dem Filed and Party columns
4. Applies conditional formatting for visual cues
5. Freezes the header row

Column Structure (32 columns total):
  A-L (0-11): Static district info - NEVER touched
  M (12): spacer
  N (13): Dem Filed - Y/N dropdown, green fill if Y
  O (14): spacer
  P-S (15-18): Challenger 1 (Name, Party, Filed Date, Ethics URL)
  T (19): spacer
  U-X (20-23): Challenger 2 (Name, Party, Filed Date, Ethics URL)
  Y (24): spacer
  Z-AC (25-28): Challenger 3 (Name, Party, Filed Date, Ethics URL)
  AD (29): spacer
  AE (30): Bench/Potential - PROTECTED (staff-entered)
  AF (31): Last Updated - Auto timestamp

Usage:
    python scripts/setup_source_of_truth.py --dry-run   # Preview changes
    python scripts/setup_source_of_truth.py             # Execute setup
"""

import argparse
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import (
    TAB_SOURCE_OF_TRUTH,
    SPREADSHEET_ID,
    GOOGLE_SHEETS_CREDENTIALS,
)

try:
    import gspread
    from google.oauth2.service_account import Credentials
except ImportError:
    print("Required packages not installed. Run: pip install gspread google-auth")
    raise


# New column structure (headers for columns M onwards, 0-indexed from M=12)
NEW_HEADERS = [
    "",                    # M (12) - spacer
    "Dem Filed",           # N (13)
    "",                    # O (14) - spacer
    "Challenger 1",        # P (15)
    "Party",               # Q (16)
    "Filed Date",          # R (17)
    "Ethics URL",          # S (18)
    "",                    # T (19) - spacer
    "Challenger 2",        # U (20)
    "Party",               # V (21)
    "Filed Date",          # W (22)
    "Ethics URL",          # X (23)
    "",                    # Y (24) - spacer
    "Challenger 3",        # Z (25)
    "Party",               # AA (26)
    "Filed Date",          # AB (27)
    "Ethics URL",          # AC (28)
    "",                    # AD (29) - spacer
    "Bench/Potential",     # AE (30)
    "Last Updated",        # AF (31)
]

# Data validation rules
DROPDOWN_CONFIGS = {
    "N": ["Y", "N"],                      # Dem Filed
    "Q": ["D", "R", "I", "O", "?"],        # Challenger 1 Party
    "V": ["D", "R", "I", "O", "?"],        # Challenger 2 Party
    "AA": ["D", "R", "I", "O", "?"],       # Challenger 3 Party
}


def get_column_letter(col_index: int) -> str:
    """Convert 0-based column index to letter(s)."""
    if col_index < 26:
        return chr(ord('A') + col_index)
    else:
        first = chr(ord('A') + (col_index // 26) - 1)
        second = chr(ord('A') + (col_index % 26))
        return first + second


def run_setup(dry_run: bool = False) -> dict:
    """
    Run the sheet setup to configure columns, headers, dropdowns, and formatting.

    Args:
        dry_run: If True, show what would be done without making changes.

    Returns:
        Summary dict with setup results.
    """
    results = {
        "dry_run": dry_run,
        "columns_added": 0,
        "headers_set": False,
        "dropdowns_applied": 0,
        "formatting_applied": False,
        "errors": [],
    }

    print("=" * 70)
    print("SOURCE OF TRUTH SHEET SETUP")
    print(f"Dry run: {dry_run}")
    print("=" * 70)

    # Connect to Google Sheets
    import os
    creds_path = os.environ.get("GOOGLE_SHEETS_CREDENTIALS", GOOGLE_SHEETS_CREDENTIALS)

    # Try relative path from project root if absolute path doesn't exist
    if not Path(creds_path).exists():
        project_root = Path(__file__).parent.parent.parent
        alt_path = project_root / "google-service-account copy.json"
        if alt_path.exists():
            creds_path = str(alt_path)

    print(f"\nUsing credentials: {creds_path}")

    try:
        scopes = [
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ]

        creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SPREADSHEET_ID)

    except Exception as e:
        results["errors"].append(f"Failed to connect: {e}")
        print(f"  ERROR: {e}")
        return results

    print("  Connected successfully")

    # Get Source of Truth worksheet
    print(f"\nStep 1: Getting Source of Truth tab...")
    try:
        worksheet = spreadsheet.worksheet(TAB_SOURCE_OF_TRUTH)
        print(f"  Found tab: '{TAB_SOURCE_OF_TRUTH}'")
    except Exception as e:
        results["errors"].append(f"Could not find Source of Truth tab: {e}")
        print(f"  ERROR: {e}")
        return results

    # Read current structure
    print("\nStep 2: Analyzing current structure...")
    all_values = worksheet.get_all_values()
    current_rows = len(all_values)
    current_cols = len(all_values[0]) if all_values else 0
    target_cols = 32  # A through AF

    print(f"  Current rows: {current_rows}")
    print(f"  Current columns: {current_cols}")
    print(f"  Target columns: {target_cols}")

    if dry_run:
        print("\n[DRY RUN] Would perform the following changes:")

        if current_cols < target_cols:
            print(f"  - Add {target_cols - current_cols} columns (from {get_column_letter(current_cols - 1)} to AF)")

        print("  - Set headers for columns M through AF:")
        for i, header in enumerate(NEW_HEADERS):
            col_letter = get_column_letter(12 + i)  # Start from M (index 12)
            if header:
                print(f"      {col_letter}: '{header}'")

        print("  - Apply dropdown validation:")
        for col, options in DROPDOWN_CONFIGS.items():
            print(f"      {col}: {options}")

        print("  - Apply conditional formatting:")
        print("      N = 'Y' → green fill")
        print("      Party = '?' → yellow fill")

        print("  - Freeze header row")

        return results

    # Step 3: Ensure we have enough columns
    print("\nStep 3: Ensuring column count...")
    if current_cols < target_cols:
        cols_to_add = target_cols - current_cols
        print(f"  Adding {cols_to_add} columns...")

        # Resize the worksheet to have more columns
        try:
            worksheet.resize(rows=current_rows, cols=target_cols)
            results["columns_added"] = cols_to_add
            print(f"  Resized to {target_cols} columns")
        except Exception as e:
            results["errors"].append(f"Failed to resize: {e}")
            print(f"  ERROR: {e}")
    else:
        print(f"  Already has {current_cols} columns (>= {target_cols})")

    # Step 4: Set headers for dynamic columns
    print("\nStep 4: Setting headers for M through AF...")
    header_range = "M1:AF1"
    try:
        worksheet.update(header_range, [NEW_HEADERS], value_input_option="USER_ENTERED")
        results["headers_set"] = True
        print("  Headers updated successfully")
    except Exception as e:
        results["errors"].append(f"Failed to set headers: {e}")
        print(f"  ERROR: {e}")

    # Step 5: Apply data validation (dropdowns)
    print("\nStep 5: Applying dropdown validation...")

    # Get total data rows (excluding header)
    data_rows = current_rows - 1
    if data_rows < 1:
        data_rows = 170  # Default for 124 House + 46 Senate

    requests = []

    for col_letter, options in DROPDOWN_CONFIGS.items():
        # Convert column letter to 0-based index
        if len(col_letter) == 1:
            col_index = ord(col_letter) - ord('A')
        else:
            col_index = (ord(col_letter[0]) - ord('A') + 1) * 26 + (ord(col_letter[1]) - ord('A'))

        # Create data validation rule
        rule = {
            "setDataValidation": {
                "range": {
                    "sheetId": worksheet.id,
                    "startRowIndex": 1,  # Skip header (0-indexed)
                    "endRowIndex": current_rows,
                    "startColumnIndex": col_index,
                    "endColumnIndex": col_index + 1,
                },
                "rule": {
                    "condition": {
                        "type": "ONE_OF_LIST",
                        "values": [{"userEnteredValue": opt} for opt in options],
                    },
                    "showCustomUi": True,  # Show dropdown arrow
                    "strict": False,  # Allow other values (for flexibility)
                }
            }
        }
        requests.append(rule)
        print(f"  Prepared dropdown for {col_letter}: {options}")

    if requests:
        try:
            spreadsheet.batch_update({"requests": requests})
            results["dropdowns_applied"] = len(DROPDOWN_CONFIGS)
            print(f"  Applied {len(requests)} dropdown rules")
        except Exception as e:
            results["errors"].append(f"Failed to apply dropdowns: {e}")
            print(f"  ERROR: {e}")

    # Step 6: Apply conditional formatting
    print("\nStep 6: Applying conditional formatting...")

    format_requests = []

    # Rule 1: Dem Filed (N) = "Y" → green fill
    # Column N is index 13
    format_requests.append({
        "addConditionalFormatRule": {
            "rule": {
                "ranges": [{
                    "sheetId": worksheet.id,
                    "startRowIndex": 1,
                    "endRowIndex": current_rows,
                    "startColumnIndex": 13,  # N
                    "endColumnIndex": 14,
                }],
                "booleanRule": {
                    "condition": {
                        "type": "TEXT_EQ",
                        "values": [{"userEnteredValue": "Y"}],
                    },
                    "format": {
                        "backgroundColor": {
                            "red": 0.71,
                            "green": 0.84,
                            "blue": 0.66,
                        }  # Light green
                    }
                }
            },
            "index": 0,
        }
    })

    # Rule 2: Party columns with "?" → yellow fill
    party_columns = [16, 21, 26]  # Q, V, AA (0-indexed)
    for col_idx in party_columns:
        format_requests.append({
            "addConditionalFormatRule": {
                "rule": {
                    "ranges": [{
                        "sheetId": worksheet.id,
                        "startRowIndex": 1,
                        "endRowIndex": current_rows,
                        "startColumnIndex": col_idx,
                        "endColumnIndex": col_idx + 1,
                    }],
                    "booleanRule": {
                        "condition": {
                            "type": "TEXT_EQ",
                            "values": [{"userEnteredValue": "?"}],
                        },
                        "format": {
                            "backgroundColor": {
                                "red": 1.0,
                                "green": 0.95,
                                "blue": 0.6,
                            }  # Light yellow
                        }
                    }
                },
                "index": 0,
            }
        })

    if format_requests:
        try:
            spreadsheet.batch_update({"requests": format_requests})
            results["formatting_applied"] = True
            print(f"  Applied {len(format_requests)} formatting rules")
        except Exception as e:
            results["errors"].append(f"Failed to apply formatting: {e}")
            print(f"  ERROR: {e}")

    # Step 7: Freeze header row
    print("\nStep 7: Freezing header row...")
    try:
        freeze_request = {
            "updateSheetProperties": {
                "properties": {
                    "sheetId": worksheet.id,
                    "gridProperties": {
                        "frozenRowCount": 1,
                    }
                },
                "fields": "gridProperties.frozenRowCount"
            }
        }
        spreadsheet.batch_update({"requests": [freeze_request]})
        print("  Header row frozen")
    except Exception as e:
        results["errors"].append(f"Failed to freeze header: {e}")
        print(f"  ERROR: {e}")

    # Summary
    print("\n" + "=" * 70)
    print("SETUP SUMMARY")
    print("=" * 70)
    print(f"  Columns added: {results['columns_added']}")
    print(f"  Headers set: {results['headers_set']}")
    print(f"  Dropdowns applied: {results['dropdowns_applied']}")
    print(f"  Formatting applied: {results['formatting_applied']}")
    if results["errors"]:
        print(f"  Errors: {len(results['errors'])}")
        for err in results["errors"]:
            print(f"    - {err}")
    else:
        print("  No errors - setup complete!")

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Set up Source of Truth tab with proper column structure"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to sheet",
    )

    args = parser.parse_args()
    results = run_setup(dry_run=args.dry_run)

    if results["errors"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
