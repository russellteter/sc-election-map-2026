#!/usr/bin/env python3
"""
Migration script to populate Source of Truth with per-candidate slots.

This script reads candidates from the Candidates tab and populates the
dynamic columns (N-AF) in the "Desired Source of Truth" tab using the
new slot-based structure where each candidate gets their own cells.

NEW SHEET STRUCTURE (32 columns A-AF):
  A-L: Static district info - NEVER touched
  M: spacer
  N: Dem Filed (Y/N) - auto-calculated
  O: spacer
  P-S: Challenger 1 (Name, Party, Filed Date, Ethics URL)
  T: spacer
  U-X: Challenger 2 (Name, Party, Filed Date, Ethics URL)
  Y: spacer
  Z-AC: Challenger 3 (Name, Party, Filed Date, Ethics URL)
  AD: spacer
  AE: Bench/Potential - PROTECTED (staff-entered)
  AF: Last Updated - auto timestamp

Key behaviors:
- Each candidate gets their own cell (no comma-separated names)
- Party in adjacent cell with dropdown
- Sorts candidates: D first, then R, then others
- Auto-calculates "Dem Filed" (Y if any D candidate present)
- Filters out incumbents (they're in static columns)
- NEVER touches Bench/Potential column (AE) - staff-managed

Usage:
    python scripts/migrate_to_source_of_truth.py --dry-run   # Preview changes
    python scripts/migrate_to_source_of_truth.py             # Execute migration
"""

import argparse
import re
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync
from src.config import (
    TAB_SOURCE_OF_TRUTH,
    SOURCE_OF_TRUTH_COLUMNS,
    GOOGLE_SHEETS_CREDENTIALS,
)


def parse_district_id(district_id: str) -> tuple:
    """
    Parse district_id like 'SC-House-042' into (chamber, number).

    Returns:
        Tuple of (chamber, district_number) where chamber is 'House' or 'Senate'.
    """
    if not district_id or not district_id.startswith("SC-"):
        return None, None

    parts = district_id.split("-")
    if len(parts) != 3:
        return None, None

    chamber = parts[1]  # Keep capitalization (House/Senate)
    try:
        district_num = int(parts[2])
    except ValueError:
        return None, None

    return chamber, district_num


def extract_url_from_hyperlink(formula: str) -> str:
    """Extract URL from a HYPERLINK formula."""
    if not formula:
        return ""
    if formula.startswith("=HYPERLINK"):
        match = re.search(r'HYPERLINK\("([^"]+)"', formula)
        if match:
            return match.group(1)
    return formula


def normalize_party(party: str) -> str:
    """Normalize party code to single character."""
    if not party:
        return "?"
    party = party.strip().upper()
    if party in ("D", "DEMOCRAT", "DEMOCRATIC"):
        return "D"
    elif party in ("R", "REPUBLICAN"):
        return "R"
    elif party in ("I", "INDEPENDENT"):
        return "I"
    elif party in ("O", "OTHER"):
        return "O"
    return "?"


def sort_candidates(candidates: list) -> list:
    """
    Sort candidates: D first, then R, then others, then by filed date.

    This ensures Democrats are in slot 1 when present for easy scanning.
    """
    def sort_key(c):
        party = c.get("party", "?")
        # Priority: D=0, R=1, others=2
        party_order = 0 if party == "D" else 1 if party == "R" else 2
        # Secondary sort by filed date (earliest first)
        filed_date = c.get("filed_date", "9999-99-99")
        return (party_order, filed_date)

    return sorted(candidates, key=sort_key)


def build_row_data(dem_filed: str, cand1: dict, cand2: dict, cand3: dict, last_updated: str) -> list:
    """
    Build row data for columns N through AF.

    Returns a list of values for columns N through AF (indices 13-31),
    with spacer columns as empty strings.
    """
    def cand_values(c):
        if c is None:
            return ["", "", "", ""]
        return [
            c.get("name", ""),
            c.get("party", "?"),
            c.get("filed_date", ""),
            c.get("ethics_url", ""),
        ]

    c1 = cand_values(cand1)
    c2 = cand_values(cand2)
    c3 = cand_values(cand3)

    # Build row: N through AF
    # N=dem_filed, O=spacer, P-S=cand1, T=spacer, U-X=cand2, Y=spacer, Z-AC=cand3, AD=spacer, AE=skip(protected), AF=last_updated
    return [
        dem_filed,       # N (13) - Dem Filed
        "",              # O (14) - spacer
        c1[0],           # P (15) - Challenger 1 name
        c1[1],           # Q (16) - Party
        c1[2],           # R (17) - Filed Date
        c1[3],           # S (18) - Ethics URL
        "",              # T (19) - spacer
        c2[0],           # U (20) - Challenger 2 name
        c2[1],           # V (21) - Party
        c2[2],           # W (22) - Filed Date
        c2[3],           # X (23) - Ethics URL
        "",              # Y (24) - spacer
        c3[0],           # Z (25) - Challenger 3 name
        c3[1],           # AA (26) - Party
        c3[2],           # AB (27) - Filed Date
        c3[3],           # AC (28) - Ethics URL
        "",              # AD (29) - spacer
        "",              # AE (30) - Bench/Potential (SKIP - protected)
        last_updated,    # AF (31) - Last Updated
    ]


def run_migration(dry_run: bool = False) -> dict:
    """
    Run the migration to populate Source of Truth with slot-based structure.

    Args:
        dry_run: If True, show what would be done without making changes.

    Returns:
        Summary dict with migration results.
    """
    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "dry_run": dry_run,
        "candidates_read": 0,
        "incumbents_filtered": 0,
        "challengers_processed": 0,
        "districts_updated": 0,
        "districts_with_1_challenger": 0,
        "districts_with_2_challengers": 0,
        "districts_with_3_plus_challengers": 0,
        "dem_candidates": 0,
        "rep_candidates": 0,
        "other_candidates": 0,
        "errors": [],
    }

    print("=" * 70)
    print("SOURCE OF TRUTH MIGRATION (Slot-Based Structure)")
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

    sync = SheetsSync(credentials_path=creds_path)

    print("\nStep 1: Connecting to Google Sheets...")
    if not sync.connect():
        results["errors"].append("Failed to connect to Google Sheets")
        print("  ERROR: Failed to connect")
        return results
    print("  Connected successfully")

    # Read all candidates from Candidates tab
    print("\nStep 2: Reading candidates from Candidates tab...")
    candidates = sync.read_candidates()
    results["candidates_read"] = len(candidates)
    print(f"  Found {len(candidates)} candidates")

    # Get Source of Truth worksheet
    print("\nStep 3: Getting Source of Truth tab...")
    try:
        sot_worksheet = sync.spreadsheet.worksheet(TAB_SOURCE_OF_TRUTH)
        print(f"  Found tab: '{TAB_SOURCE_OF_TRUTH}'")
    except Exception as e:
        results["errors"].append(f"Could not find Source of Truth tab: {e}")
        print(f"  ERROR: {e}")
        return results

    # Read existing Source of Truth data to get row numbers
    print("\nStep 4: Reading Source of Truth structure...")
    sot_data = sot_worksheet.get_all_values()
    print(f"  Found {len(sot_data)} rows (including header)")
    print(f"  Columns: {len(sot_data[0]) if sot_data else 0}")

    # Build a mapping of (chamber, district_num) -> row number
    # Assumes header is row 1, data starts row 2
    # Column A = chamber, Column B = district_number
    district_row_map = {}
    for row_idx, row in enumerate(sot_data[1:], start=2):  # Skip header
        if len(row) >= 2 and row[0] and row[1]:
            chamber = row[0]  # e.g., "House" or "Senate"
            try:
                district_num = int(row[1])
                district_row_map[(chamber, district_num)] = row_idx
            except ValueError:
                continue

    print(f"  Mapped {len(district_row_map)} districts to rows")

    # Group candidates by district
    print("\nStep 5: Grouping candidates by district...")
    candidates_by_district = defaultdict(list)
    incumbent_count = 0
    challenger_count = 0

    for report_id, candidate in candidates.items():
        district_id = candidate.get("district_id", "")
        chamber, district_num = parse_district_id(district_id)

        if chamber is None or district_num is None:
            print(f"  Warning: Could not parse district_id: {district_id}")
            continue

        # Check if incumbent - filter them out
        is_incumbent = candidate.get("is_incumbent", False)
        if is_incumbent:
            incumbent_count += 1
            continue  # Skip incumbents - they're in static columns

        challenger_count += 1

        # Normalize party
        party = normalize_party(candidate.get("party", ""))
        if party == "D":
            results["dem_candidates"] += 1
        elif party == "R":
            results["rep_candidates"] += 1
        else:
            results["other_candidates"] += 1

        # Extract URL from hyperlink formula if present
        ethics_url = extract_url_from_hyperlink(candidate.get("ethics_url", ""))

        candidates_by_district[(chamber, district_num)].append({
            "name": candidate.get("candidate_name", ""),
            "party": party,
            "filed_date": candidate.get("filed_date", ""),
            "ethics_url": ethics_url,
            "report_id": report_id,
        })

    results["incumbents_filtered"] = incumbent_count
    results["challengers_processed"] = challenger_count
    print(f"  Incumbents filtered: {incumbent_count}")
    print(f"  Challengers to process: {challenger_count}")
    print(f"    Democrats: {results['dem_candidates']}")
    print(f"    Republicans: {results['rep_candidates']}")
    print(f"    Other/Unknown: {results['other_candidates']}")

    # Analyze distribution
    for (chamber, district_num), cands in candidates_by_district.items():
        count = len(cands)
        if count == 1:
            results["districts_with_1_challenger"] += 1
        elif count == 2:
            results["districts_with_2_challengers"] += 1
        elif count >= 3:
            results["districts_with_3_plus_challengers"] += 1
            if count > 3:
                print(f"  Warning: {chamber} {district_num} has {count} challengers (only first 3 will be shown)")

    print(f"\n  Distribution:")
    print(f"    1 challenger: {results['districts_with_1_challenger']} districts")
    print(f"    2 challengers: {results['districts_with_2_challengers']} districts")
    print(f"    3+ challengers: {results['districts_with_3_plus_challengers']} districts")

    # Prepare batch updates
    print("\nStep 6: Preparing Source of Truth updates...")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    row_data_map = {}  # row_num -> row values
    districts_updated = 0

    for (chamber, district_num), row_num in district_row_map.items():
        district_cands = candidates_by_district.get((chamber, district_num), [])

        # Sort candidates: D first, then R, then others
        sorted_cands = sort_candidates(district_cands)

        # Assign to slots (max 3)
        cand1 = sorted_cands[0] if len(sorted_cands) > 0 else None
        cand2 = sorted_cands[1] if len(sorted_cands) > 1 else None
        cand3 = sorted_cands[2] if len(sorted_cands) > 2 else None

        # Calculate Dem Filed
        has_dem = any(c["party"] == "D" for c in district_cands)
        dem_filed = "Y" if has_dem else "N"

        # Only set last_updated if there are candidates
        last_updated = now if district_cands else ""

        # Build row data for columns N through AF
        row_values = build_row_data(dem_filed, cand1, cand2, cand3, last_updated)
        row_data_map[row_num] = row_values

        if district_cands:
            districts_updated += 1

    results["districts_updated"] = districts_updated
    print(f"  Updates prepared for {len(row_data_map)} rows")
    print(f"  Districts with challengers: {districts_updated}")

    # Execute updates
    print("\nStep 7: Executing updates...")

    if dry_run:
        print("  DRY RUN: Would update the following districts with challengers:")
        for (chamber, district_num), cands in sorted(candidates_by_district.items()):
            if cands:
                sorted_cands = sort_candidates(cands)
                has_dem = any(c["party"] == "D" for c in cands)
                print(f"\n    {chamber} {district_num} (Dem Filed: {'Y' if has_dem else 'N'}):")
                for i, c in enumerate(sorted_cands[:3], start=1):
                    print(f"      Slot {i}: {c['name']} ({c['party']}) - filed {c['filed_date']}")
                if len(sorted_cands) > 3:
                    print(f"      (+ {len(sorted_cands) - 3} more candidates not shown)")
    else:
        # Use batch_update for efficiency (single API call)
        sorted_rows = sorted(row_data_map.keys())

        if sorted_rows:
            min_row = min(sorted_rows)
            max_row = max(sorted_rows)

            # Build a 2D array for the entire range
            all_rows = []
            for row_num in range(min_row, max_row + 1):
                if row_num in row_data_map:
                    all_rows.append(row_data_map[row_num])
                else:
                    # Empty row placeholder (maintains N column default)
                    all_rows.append(["N"] + [""] * 18)  # N through AF (19 columns)

            # Single batch update for columns N through AF
            # N=13 (0-indexed), AF=31 -> letters N:AF
            cell_range = f"N{min_row}:AF{max_row}"
            try:
                sot_worksheet.update(values=all_rows, range_name=cell_range, value_input_option="USER_ENTERED")
                print(f"  Successfully updated {len(all_rows)} rows ({cell_range})")
            except Exception as e:
                print(f"  Error in batch update: {e}")
                results["errors"].append(f"Batch update failed: {e}")

    # Summary
    print("\n" + "=" * 70)
    print("MIGRATION SUMMARY")
    print("=" * 70)
    print(f"  Candidates read: {results['candidates_read']}")
    print(f"  Incumbents filtered: {results['incumbents_filtered']}")
    print(f"  Challengers processed: {results['challengers_processed']}")
    print(f"  Districts with challengers: {results['districts_updated']}")
    print(f"    - 1 challenger: {results['districts_with_1_challenger']}")
    print(f"    - 2 challengers: {results['districts_with_2_challengers']}")
    print(f"    - 3+ challengers: {results['districts_with_3_plus_challengers']}")
    print(f"  Democrat challengers: {results['dem_candidates']}")
    print(f"  Republican challengers: {results['rep_candidates']}")
    print(f"  Other/Unknown challengers: {results['other_candidates']}")
    if results["errors"]:
        print(f"  Errors: {len(results['errors'])}")
        for err in results["errors"]:
            print(f"    - {err}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Migrate candidate data to Source of Truth tab with slot-based structure"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to sheet",
    )

    args = parser.parse_args()
    results = run_migration(dry_run=args.dry_run)

    if results["errors"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
