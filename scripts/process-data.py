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
KJATWOOD_FILE = DATA_DIR / "kjatwood-candidates.json"
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


def load_kjatwood_data() -> dict:
    """Load kjatwood known candidates data."""
    if KJATWOOD_FILE.exists():
        with open(KJATWOOD_FILE) as f:
            return json.load(f)
    return {"house": {}, "senate": {}}


def find_party(name: str, party_data: dict, chamber: str = None, district_num: int = None) -> str | None:
    """Look up party affiliation for a candidate.

    Checks in this order:
    1. Direct candidate matches in candidates section
    2. Incumbent data if chamber and district are provided
    3. Partial name matching
    """
    candidates = party_data.get("candidates", {})

    # Try exact match first
    if name in candidates:
        return candidates[name].get("party")

    # Try normalized name
    normalized = normalize_name(name)
    for stored_name, info in candidates.items():
        if normalize_name(stored_name) == normalized:
            return info.get("party")

    # Try partial matching (last name) with candidates
    name_parts = normalized.lower().split()
    for stored_name, info in candidates.items():
        stored_parts = normalize_name(stored_name).lower().split()
        # Match if last names are the same
        if name_parts and stored_parts and name_parts[-1] == stored_parts[-1]:
            return info.get("party")

    # Check incumbent data for the district
    if chamber and district_num:
        incumbents = party_data.get("incumbents", {}).get(chamber, {})
        district_key = str(district_num)
        if district_key in incumbents:
            incumbent = incumbents[district_key]
            incumbent_name = incumbent.get("name", "").lower()
            # Check if the candidate name matches the incumbent
            if name.lower() in incumbent_name or incumbent_name in name.lower():
                return incumbent.get("party")
            # Check last name match
            incumbent_parts = incumbent_name.split()
            if name_parts and incumbent_parts and name_parts[-1] == incumbent_parts[-1]:
                return incumbent.get("party")

    return None


def is_incumbent(name: str, party_data: dict, chamber: str, district_num: int) -> bool:
    """Check if a candidate is the incumbent for their district.

    Returns True if the candidate name matches the incumbent name for the district.
    """
    if not chamber or not district_num:
        return False

    incumbents = party_data.get("incumbents", {}).get(chamber, {})
    district_key = str(district_num)

    if district_key not in incumbents:
        return False

    incumbent = incumbents[district_key]
    incumbent_name = incumbent.get("name", "").lower()
    candidate_name = normalize_name(name).lower()
    name_parts = candidate_name.split()

    # Exact match
    if candidate_name == incumbent_name:
        return True

    # Substring match (handles middle initials, suffixes)
    if candidate_name in incumbent_name or incumbent_name in candidate_name:
        return True

    # Last name match with first name/initial match
    incumbent_parts = incumbent_name.split()
    if name_parts and incumbent_parts:
        # Last names must match
        if name_parts[-1] == incumbent_parts[-1]:
            # Check if first names match or one is initial of other
            if len(name_parts) > 1 and len(incumbent_parts) > 1:
                first1 = name_parts[0]
                first2 = incumbent_parts[0]
                if first1 == first2 or first1[0] == first2[0]:
                    return True
            # Just last name match is sufficient if unique
            return True

    return False


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

    # Get incumbents data for district metadata
    incumbents_data = party_data.get("incumbents", {})

    # Initialize all districts
    for i in range(1, 125):  # House has 124 districts
        incumbent_info = incumbents_data.get("house", {}).get(str(i), {})
        output["house"][str(i)] = {
            "districtNumber": i,
            "candidates": [],
            "incumbent": incumbent_info if incumbent_info else None
        }

    for i in range(1, 47):  # Senate has 46 districts
        incumbent_info = incumbents_data.get("senate", {}).get(str(i), {})
        output["senate"][str(i)] = {
            "districtNumber": i,
            "candidates": [],
            "incumbent": incumbent_info if incumbent_info else None
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
        party = find_party(candidate_name, party_data, chamber, district_num)

        # Check if candidate is the incumbent
        incumbent_status = is_incumbent(candidate_name, party_data, chamber, district_num)

        # Create candidate entry
        candidate_entry = {
            "name": candidate_name,
            "party": party,
            "status": "filed",
            "filedDate": report.get("filed_date"),
            "ethicsUrl": report.get("url"),
            "reportId": report_id,
            "source": "ethics",
            "isIncumbent": incumbent_status
        }

        # Add to appropriate chamber/district
        district_key = str(district_num)
        if district_key in output[chamber]:
            output[chamber][district_key]["candidates"].append(candidate_entry)

    # Add kjatwood known candidates (who may not have filed Ethics reports yet)
    kjatwood_data = load_kjatwood_data()

    for chamber in ["house", "senate"]:
        kjatwood_chamber = kjatwood_data.get(chamber, {})

        for district_str, candidate_info in kjatwood_chamber.items():
            district_num = int(district_str)
            district_key = str(district_num)

            if district_key not in output[chamber]:
                continue

            candidate_name = candidate_info.get("name")
            if not candidate_name:
                continue

            # Check if this candidate already exists (has filed with Ethics)
            existing_names = [
                normalize_name(c["name"]).lower()
                for c in output[chamber][district_key]["candidates"]
            ]

            normalized_kjatwood = normalize_name(candidate_name).lower()

            # Skip if already exists
            if normalized_kjatwood in existing_names:
                continue

            # Check by last name match (handles name variations)
            kjatwood_parts = normalized_kjatwood.split()
            already_exists = False
            if kjatwood_parts:
                kjatwood_last = kjatwood_parts[-1]
                for existing in existing_names:
                    existing_parts = existing.split()
                    if existing_parts and existing_parts[-1] == kjatwood_last:
                        already_exists = True
                        break

            if already_exists:
                continue

            # Add as known candidate (not yet filed)
            kjatwood_entry = {
                "name": candidate_name,
                "party": candidate_info.get("party"),
                "status": "known",  # Not filed yet, but known to be running
                "filedDate": None,
                "ethicsUrl": None,
                "reportId": None,
                "source": "kjatwood",
                "isIncumbent": "Incumbent" in candidate_info.get("note", ""),
                "note": candidate_info.get("note")
            }

            output[chamber][district_key]["candidates"].append(kjatwood_entry)

    # Sort candidates by filed date (most recent first), then by source
    for chamber in ["house", "senate"]:
        for district_num, district_data in output[chamber].items():
            district_data["candidates"].sort(
                key=lambda x: (
                    x.get("source") == "ethics",  # Ethics first
                    x.get("filedDate") or ""
                ),
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
    incumbent_count = 0
    ethics_filed = 0
    kjatwood_known = 0

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
                if candidate.get("isIncumbent"):
                    incumbent_count += 1
                if candidate.get("source") == "ethics":
                    ethics_filed += 1
                elif candidate.get("source") == "kjatwood":
                    kjatwood_known += 1

    print(f"Total candidates: {total_candidates}")
    print(f"  Democrats: {dem_count}")
    print(f"  Republicans: {rep_count}")
    print(f"  Unknown: {unknown_count}")
    print(f"  Incumbents: {incumbent_count}")
    print(f"  Filed with Ethics: {ethics_filed}")
    print(f"  Known from kjatwood: {kjatwood_known}")

    # Write output
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2)

    print(f"Output written to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
