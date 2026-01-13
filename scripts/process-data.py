#!/usr/bin/env python3
"""
Process Ethics monitor data and merge with party enrichment.
Generates candidates.json for the election map website.
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "src" / "data"
PARTY_DATA_FILE = DATA_DIR / "party-data.json"
OUTPUT_FILE = DATA_DIR / "candidates.json"


def extract_district_number(office: str) -> tuple[str, int]:
    """Extract chamber (house/senate) and district number from office string."""
    office_lower = office.lower()

    if "house" in office_lower:
        chamber = "house"
    elif "senate" in office_lower:
        chamber = "senate"
    else:
        return None, None

    # Extract district number
    match = re.search(r'district\s*(\d+)', office_lower)
    if match:
        return chamber, int(match.group(1))

    return chamber, None


def normalize_name(name: str) -> str:
    """Normalize candidate name for matching."""
    # Handle "Last, First" format
    if "," in name:
        parts = name.split(",", 1)
        name = f"{parts[1].strip()} {parts[0].strip()}"
    return name.strip()


def load_party_data() -> dict:
    """Load party enrichment data."""
    if PARTY_DATA_FILE.exists():
        with open(PARTY_DATA_FILE) as f:
            return json.load(f)
    return {"candidates": {}}


def find_party(name: str, party_data: dict) -> str | None:
    """Look up party affiliation for a candidate."""
    candidates = party_data.get("candidates", {})

    # Try exact match first
    if name in candidates:
        return candidates[name].get("party")

    # Try normalized name
    normalized = normalize_name(name)
    for stored_name, info in candidates.items():
        if normalize_name(stored_name) == normalized:
            return info.get("party")

    # Try partial matching (last name)
    name_parts = normalized.lower().split()
    for stored_name, info in candidates.items():
        stored_parts = normalize_name(stored_name).lower().split()
        # Match if last names are the same
        if name_parts and stored_parts and name_parts[-1] == stored_parts[-1]:
            return info.get("party")

    return None


def process_ethics_data(ethics_file: str) -> dict:
    """Process Ethics monitor state.json and generate candidates.json."""

    # Load ethics data
    with open(ethics_file) as f:
        ethics_data = json.load(f)

    # Load party enrichment
    party_data = load_party_data()

    # Initialize output structure
    output = {
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "house": {},
        "senate": {}
    }

    # Initialize all districts
    for i in range(1, 125):  # House has 124 districts
        output["house"][str(i)] = {
            "districtNumber": i,
            "candidates": []
        }

    for i in range(1, 47):  # Senate has 46 districts
        output["senate"][str(i)] = {
            "districtNumber": i,
            "candidates": []
        }

    # Process reports_with_metadata (current tracking)
    reports = ethics_data.get("reports_with_metadata", {})

    # Also include historical_2025 data
    historical = ethics_data.get("historical_2025", {}).get("reports", {})
    all_reports = {**historical, **reports}  # Current takes precedence

    seen_candidates = set()  # Track to avoid duplicates

    for report_id, report in all_reports.items():
        candidate_name = report.get("candidate_name", "")
        office = report.get("office", "")

        chamber, district_num = extract_district_number(office)
        if not chamber or not district_num:
            continue

        # Skip if we've already processed this candidate for this district
        candidate_key = f"{chamber}_{district_num}_{candidate_name.lower()}"
        if candidate_key in seen_candidates:
            continue
        seen_candidates.add(candidate_key)

        # Look up party affiliation
        party = find_party(candidate_name, party_data)

        # Create candidate entry
        candidate_entry = {
            "name": candidate_name,
            "party": party,
            "status": "filed",
            "filedDate": report.get("filed_date"),
            "ethicsUrl": report.get("url"),
            "reportId": report_id,
            "source": "ethics"
        }

        # Add to appropriate chamber/district
        district_key = str(district_num)
        if district_key in output[chamber]:
            output[chamber][district_key]["candidates"].append(candidate_entry)

    # Sort candidates by filed date (most recent first)
    for chamber in ["house", "senate"]:
        for district_num, district_data in output[chamber].items():
            district_data["candidates"].sort(
                key=lambda x: x.get("filedDate") or "",
                reverse=True
            )

    return output


def main():
    if len(sys.argv) < 2:
        print("Usage: python process-data.py <ethics-data.json>")
        sys.exit(1)

    ethics_file = sys.argv[1]

    print(f"Processing ethics data from: {ethics_file}")

    output = process_ethics_data(ethics_file)

    # Count statistics
    total_candidates = 0
    dem_count = 0
    rep_count = 0
    unknown_count = 0

    for chamber in ["house", "senate"]:
        for district_data in output[chamber].values():
            for candidate in district_data["candidates"]:
                total_candidates += 1
                party = candidate.get("party")
                if party == "Democratic":
                    dem_count += 1
                elif party == "Republican":
                    rep_count += 1
                else:
                    unknown_count += 1

    print(f"Total candidates: {total_candidates}")
    print(f"  Democrats: {dem_count}")
    print(f"  Republicans: {rep_count}")
    print(f"  Unknown: {unknown_count}")

    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Output written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
