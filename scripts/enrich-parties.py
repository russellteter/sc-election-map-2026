#!/usr/bin/env python3
"""
Enrich candidates.json with party data from party-data.json.
This script updates the existing candidates data without needing to re-fetch from Ethics.
"""

import json
from datetime import datetime
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
CANDIDATES_FILE = PROJECT_ROOT / "public" / "data" / "candidates.json"
PARTY_DATA_FILE = PROJECT_ROOT / "public" / "data" / "party-data.json"


def normalize_name(name: str) -> str:
    """Normalize candidate name for matching."""
    # Handle "Last, First" format
    if "," in name:
        parts = name.split(",", 1)
        name = f"{parts[1].strip()} {parts[0].strip()}"
    return name.strip().lower()


def find_party(name: str, party_data: dict, chamber: str = None, district_num: int = None) -> str | None:
    """Look up party affiliation for a candidate."""
    candidates = party_data.get("candidates", {})

    # Get normalized name parts
    normalized = normalize_name(name)
    name_parts = normalized.split()

    # Try direct match in candidates section
    for stored_name, info in candidates.items():
        if normalize_name(stored_name) == normalized:
            return info.get("party")
        # Try last name match
        stored_parts = normalize_name(stored_name).split()
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
            if normalized in incumbent_name or incumbent_name in normalized:
                return incumbent.get("party")
            # Check last name match
            incumbent_parts = incumbent_name.split()
            if name_parts and incumbent_parts and name_parts[-1] == incumbent_parts[-1]:
                return incumbent.get("party")

    return None


def main():
    # Load data
    with open(CANDIDATES_FILE) as f:
        candidates_data = json.load(f)

    with open(PARTY_DATA_FILE) as f:
        party_data = json.load(f)

    # Track statistics
    total = 0
    enriched_before = 0
    enriched_after = 0

    # Process each chamber
    for chamber in ["house", "senate"]:
        for district_num, district_data in candidates_data[chamber].items():
            for candidate in district_data["candidates"]:
                total += 1

                if candidate.get("party"):
                    enriched_before += 1
                    enriched_after += 1
                    continue

                # Try to find party
                party = find_party(
                    candidate["name"],
                    party_data,
                    chamber,
                    int(district_num)
                )

                if party:
                    candidate["party"] = party
                    enriched_after += 1
                    print(f"  Enriched: {candidate['name']} ({chamber} {district_num}) -> {party}")

    # Update timestamp
    candidates_data["lastUpdated"] = datetime.utcnow().isoformat() + "Z"

    # Write back
    with open(CANDIDATES_FILE, "w") as f:
        json.dump(candidates_data, f, indent=2)

    # Also update src/data copy
    src_candidates = PROJECT_ROOT / "src" / "data" / "candidates.json"
    with open(src_candidates, "w") as f:
        json.dump(candidates_data, f, indent=2)

    print(f"\nResults:")
    print(f"  Total candidates: {total}")
    print(f"  Before enrichment: {enriched_before} ({round(enriched_before/total*100) if total else 0}%)")
    print(f"  After enrichment: {enriched_after} ({round(enriched_after/total*100) if total else 0}%)")
    print(f"\nUpdated: {CANDIDATES_FILE}")
    print(f"Updated: {src_candidates}")


if __name__ == "__main__":
    main()
