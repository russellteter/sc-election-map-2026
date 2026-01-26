#!/usr/bin/env python3
"""
Verify and resolve UNKNOWN party candidates.

This script documents the research process and findings for candidates
whose party affiliation could not be automatically detected.

Run this script to see the current status of UNKNOWN candidates
and update party-data.json with findings.

Usage:
    python scripts/verify_unknown_parties.py
    python scripts/verify_unknown_parties.py --update  # Write findings to party-data.json
"""

import argparse
import json
from datetime import datetime
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
PARTY_DATA_PATH = PROJECT_ROOT / "src" / "data" / "party-data.json"

# Research findings for candidates that were previously UNKNOWN
# Last researched: 2026-01-23
RESEARCH_FINDINGS = {
    "Burgett, Joseph M": {
        "district": "House 003",
        "party": "I",  # Independent / Forward Party
        "verified": True,
        "research_date": "2026-01-23",
        "evidence": [
            "Campaign website: joeburgett.com",
            "Second website: movescforward.com",
            "Campaign slogan: 'Not left. Not right. FORWARD!'",
            "Position: Forward Party / Independent movement",
            "Background: Clemson professor, General Contractor",
        ],
        "note": "Forward Party/Independent - 'People Over Politics' campaign. Dr. Joe Burgett is Clemson faculty member.",
    },
    "Zimmerman, Amanda": {
        "district": "House 071",
        "party": None,  # Still unknown
        "verified": False,
        "research_date": "2026-01-23",
        "evidence": [
            "No campaign website found",
            "No party endorsement found",
            "No social media campaign presence found",
            "Note: Found different Amanda Zimmerman who worked for NRCC, but cannot confirm same person",
        ],
        "note": "Party unknown - no definitive evidence found. Recommend manual research or contacting Lexington County party offices.",
    },
    "Beaman, Carlton R III": {
        "district": "House 087",
        "party": None,  # Still unknown
        "verified": False,
        "research_date": "2026-01-23",
        "evidence": [
            "No campaign website found",
            "No party endorsement found",
            "No social media campaign presence found",
            "Filed with Ethics Commission on 2025-04-14 (early filer)",
        ],
        "note": "Party unknown - no definitive evidence found. Recommend manual research or contacting Lexington County party offices.",
    },
}


def load_party_data() -> dict:
    """Load existing party-data.json."""
    if PARTY_DATA_PATH.exists():
        with open(PARTY_DATA_PATH) as f:
            return json.load(f)
    return {"candidates": {}, "incumbents": {}}


def save_party_data(data: dict) -> None:
    """Save party-data.json."""
    data["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")
    with open(PARTY_DATA_PATH, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Updated: {PARTY_DATA_PATH}")


def print_findings():
    """Print research findings for all candidates."""
    print("=" * 70)
    print("UNKNOWN CANDIDATE RESEARCH FINDINGS")
    print("=" * 70)

    for name, info in RESEARCH_FINDINGS.items():
        print(f"\n{name} ({info['district']})")
        print("-" * 50)

        if info["party"]:
            party_display = {
                "D": "Democrat",
                "R": "Republican",
                "I": "Independent",
                "O": "Other",
            }.get(info["party"], info["party"])
            status = "RESOLVED" if info["verified"] else "TENTATIVE"
            print(f"  Party: {party_display} ({info['party']}) - {status}")
        else:
            print(f"  Party: UNKNOWN - needs manual verification")

        print(f"  Researched: {info['research_date']}")
        print(f"  Note: {info['note']}")

        print("  Evidence:")
        for evidence in info["evidence"]:
            print(f"    - {evidence}")

    print("\n" + "=" * 70)


def update_party_data():
    """Update party-data.json with verified findings."""
    data = load_party_data()

    updated_count = 0
    skipped_count = 0

    for name, info in RESEARCH_FINDINGS.items():
        if info["party"] and info["verified"]:
            party_full = {
                "D": "Democratic",
                "R": "Republican",
                "I": "Independent",
                "O": "Other",
            }.get(info["party"], info["party"])

            # Add main entry
            data["candidates"][name] = {
                "party": party_full,
                "verified": info["verified"],
                "district": info["district"],
                "note": info["note"],
            }

            # Add alternate name formats
            # "Last, First M" -> "First Last"
            if "," in name:
                parts = name.split(",")
                last = parts[0].strip()
                first_parts = parts[1].strip().split()
                first = first_parts[0] if first_parts else ""
                alt_name = f"{first} {last}"
                data["candidates"][alt_name] = {
                    "party": party_full,
                    "verified": info["verified"],
                    "district": info["district"],
                    "note": f"Alternate form of {name}",
                }

            print(f"  Added: {name} -> {party_full}")
            updated_count += 1
        else:
            print(f"  Skipped: {name} (unverified or no party)")
            skipped_count += 1

    if updated_count > 0:
        save_party_data(data)
        print(f"\nUpdated {updated_count} candidates in party-data.json")
    else:
        print("\nNo updates to save")

    return updated_count, skipped_count


def main():
    parser = argparse.ArgumentParser(
        description="Verify and resolve UNKNOWN party candidates"
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Update party-data.json with verified findings",
    )

    args = parser.parse_args()

    print_findings()

    if args.update:
        print("\nUpdating party-data.json...")
        updated, skipped = update_party_data()

        print("\n" + "=" * 70)
        print("SUMMARY")
        print("=" * 70)
        print(f"  Verified and added: {updated}")
        print(f"  Skipped (unverified): {skipped}")
        print("\nRemaining UNKNOWN candidates should be placed in I/O Notes column")
        print("in the Source of Truth tab for manual staff research.")
    else:
        print("\nTo update party-data.json with verified findings, run:")
        print("  python scripts/verify_unknown_parties.py --update")


if __name__ == "__main__":
    main()
