#!/usr/bin/env python3
"""
Export SC Ethics Monitor data to webapp candidates.json format.

Reads from Google Sheets (Source of Truth) and generates
public/data/candidates.json for the Blue Intelligence webapp.

Uses simplified 3-tab structure with single 'party' column.
Fallback: Uses incumbents.json when Sheets data is empty.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync
from src.config import (
    SC_HOUSE_DISTRICTS,
    SC_SENATE_DISTRICTS,
    GOOGLE_SHEETS_CREDENTIALS,
)


def load_incumbents_fallback() -> dict:
    """
    Load incumbent data from incumbents.json as fallback.

    Returns:
        Dict with 'house' and 'senate' keys containing incumbent info per district.
    """
    project_root = Path(__file__).parent.parent.parent
    incumbents_path = project_root / "public" / "data" / "incumbents.json"

    if not incumbents_path.exists():
        print(f"Warning: Incumbents fallback file not found: {incumbents_path}")
        return {"house": {}, "senate": {}}

    with open(incumbents_path) as f:
        data = json.load(f)

    print(f"Loaded incumbent fallback data: {len(data.get('house', {}))} House, {len(data.get('senate', {}))} Senate")
    return data


def parse_district_id(district_id: str) -> tuple[str, int]:
    """
    Parse district_id like 'SC-House-042' into (chamber, number).

    Returns:
        Tuple of (chamber, district_number) where chamber is 'house' or 'senate'.
    """
    if not district_id or not district_id.startswith("SC-"):
        return None, None

    parts = district_id.split("-")
    if len(parts) != 3:
        return None, None

    chamber = parts[1].lower()
    try:
        district_num = int(parts[2])
    except ValueError:
        return None, None

    return chamber, district_num


def export_candidates(output_path: str = None, dry_run: bool = False) -> bool:
    """
    Export candidates from Google Sheets to candidates.json.

    Args:
        output_path: Path to output file (default: ../public/data/candidates.json)
        dry_run: If True, print output but don't write file

    Returns:
        True if successful, False otherwise.
    """
    # Default output path
    if output_path is None:
        project_root = Path(__file__).parent.parent.parent
        output_path = project_root / "public" / "data" / "candidates.json"
    else:
        output_path = Path(output_path)

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

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

    # Get all candidates (simplified structure)
    candidates = sync.read_candidates()
    print(f"Found {len(candidates)} candidates")

    # Get Districts data for incumbent info
    districts_data = sync.get_districts()
    print(f"Found {len(districts_data)} district records")

    # Load incumbent fallback from incumbents.json
    incumbents_fallback = load_incumbents_fallback()

    # Build output structure
    output = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "house": {},
        "senate": {}
    }

    # Party code to full name mapping
    party_full = {"R": "Republican", "D": "Democratic", "I": "Independent", "O": "Other"}

    # Initialize all districts with empty candidates
    for district_num in range(1, SC_HOUSE_DISTRICTS + 1):
        district_id = f"SC-House-{district_num:03d}"
        district_info = districts_data.get(district_id, {})

        # Get incumbent from Sheets, fallback to incumbents.json
        inc_name = district_info.get("incumbent_name", "")
        inc_party = district_info.get("incumbent_party", "")

        # Fallback to incumbents.json if Sheets data is empty
        if not inc_name:
            fallback = incumbents_fallback.get("house", {}).get(str(district_num), {})
            inc_name = fallback.get("name", "")
            inc_party = fallback.get("party", "")

        output["house"][str(district_num)] = {
            "districtNumber": district_num,
            "candidates": [],
            "incumbent": {
                "name": inc_name,
                "party": party_full.get(inc_party, inc_party)
            }
        }

    for district_num in range(1, SC_SENATE_DISTRICTS + 1):
        district_id = f"SC-Senate-{district_num:03d}"
        district_info = districts_data.get(district_id, {})

        # Get incumbent from Sheets, fallback to incumbents.json
        inc_name = district_info.get("incumbent_name", "")
        inc_party = district_info.get("incumbent_party", "")

        # Fallback to incumbents.json if Sheets data is empty
        if not inc_name:
            fallback = incumbents_fallback.get("senate", {}).get(str(district_num), {})
            inc_name = fallback.get("name", "")
            inc_party = fallback.get("party", "")

        output["senate"][str(district_num)] = {
            "districtNumber": district_num,
            "candidates": [],
            "incumbent": {
                "name": inc_name,
                "party": party_full.get(inc_party, inc_party)
            }
        }

    # Add candidates to their districts
    for report_id, candidate in candidates.items():
        district_id = candidate.get("district_id", "")
        chamber, district_num = parse_district_id(district_id)

        if chamber is None or district_num is None:
            print(f"Warning: Could not parse district_id: {district_id}")
            continue

        # Get the party directly from the 'party' column
        party = candidate.get("party") or None
        if party in ("UNKNOWN", ""):
            party = None

        # Normalize party codes to full names
        if party:
            party = party_full.get(party, party)

        # Check if this candidate is the incumbent
        incumbent_name = output[chamber][str(district_num)]["incumbent"]["name"]
        is_incumbent = is_name_match(candidate.get("candidate_name", ""), incumbent_name)

        # Get ethics URL - handle both raw URL and hyperlink formula
        ethics_url = candidate.get("ethics_url", "")
        # If it's a hyperlink formula, extract the URL
        if ethics_url and ethics_url.startswith("=HYPERLINK"):
            # Extract URL from =HYPERLINK("url", "text")
            import re
            match = re.search(r'HYPERLINK\("([^"]+)"', ethics_url)
            if match:
                ethics_url = match.group(1)

        # Build candidate entry
        candidate_entry = {
            "name": candidate.get("candidate_name", ""),
            "party": party,
            "status": "filed",
            "filedDate": candidate.get("filed_date", ""),
            "ethicsUrl": ethics_url,
            "reportId": report_id,
            "source": "ethics",
            "isIncumbent": is_incumbent or candidate.get("is_incumbent", False)
        }

        # Add to district
        output[chamber][str(district_num)]["candidates"].append(candidate_entry)

    # Count candidates
    total_candidates = sum(
        len(d["candidates"]) for d in output["house"].values()
    ) + sum(
        len(d["candidates"]) for d in output["senate"].values()
    )

    # Count candidates with party
    candidates_with_party = sum(
        1 for d in output["house"].values() for c in d["candidates"] if c["party"]
    ) + sum(
        1 for d in output["senate"].values() for c in d["candidates"] if c["party"]
    )

    print(f"Total candidates: {total_candidates}")
    print(f"Candidates with party: {candidates_with_party} ({100*candidates_with_party//total_candidates if total_candidates else 0}%)")

    if dry_run:
        print("\n--- DRY RUN: Would write to", output_path, "---")
        print(json.dumps(output, indent=2)[:2000] + "...")
        return True

    # Write output
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote candidates.json to: {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

    return True


def is_name_match(candidate_name: str, incumbent_name: str) -> bool:
    """
    Check if a candidate name matches an incumbent name.

    Handles "Last, First" vs "First Last" formats.
    """
    if not candidate_name or not incumbent_name:
        return False

    # Normalize both names
    def normalize(name: str) -> str:
        # Remove common suffixes
        for suffix in [" Jr.", " Jr", " III", " II", " Sr.", " Sr"]:
            name = name.replace(suffix, "")

        # Handle "Last, First" format
        if "," in name:
            parts = name.split(",")
            if len(parts) == 2:
                last = parts[0].strip()
                first_parts = parts[1].strip().split()
                if first_parts:
                    first = first_parts[0]  # First word of first name
                    return f"{first} {last}".lower()
                return last.lower()

        return name.lower().strip()

    norm_candidate = normalize(candidate_name)
    norm_incumbent = normalize(incumbent_name)

    # Check exact match
    if norm_candidate == norm_incumbent:
        return True

    # Check if last names match and first name is similar
    cand_parts = norm_candidate.split()
    inc_parts = norm_incumbent.split()

    if len(cand_parts) >= 2 and len(inc_parts) >= 2:
        # Compare last names
        if cand_parts[-1] == inc_parts[-1]:
            # Check if first names start the same
            if cand_parts[0][:3] == inc_parts[0][:3]:
                return True

    return False


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Export SC Ethics Monitor data to webapp candidates.json"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print output but don't write file"
    )
    parser.add_argument(
        "--output",
        help="Output path (default: ../public/data/candidates.json)"
    )

    args = parser.parse_args()

    success = export_candidates(output_path=args.output, dry_run=args.dry_run)
    sys.exit(0 if success else 1)
