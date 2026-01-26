#!/usr/bin/env python3
"""
Calculate Opportunity Tiers for Multi-Lens Visualization System.

Computes a 5-tier opportunity classification for each district based on:
- Historical margin data from elections.json
- Candidate filing status from candidates.json
- Incumbent party from candidates.json

Tiers:
- HOT: Top priority (≤5pt margin, no Dem incumbent)
- WARM: Strong opportunity (6-10pt margin, no Dem incumbent)
- POSSIBLE: Worth watching (11-15pt margin, no Dem incumbent)
- LONG_SHOT: Unlikely flip (>15pt margin, no Dem incumbent)
- DEFENSIVE: Dem-held seat to protect
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
PUBLIC_DATA_DIR = PROJECT_ROOT / "public" / "data"
CANDIDATES_FILE = PUBLIC_DATA_DIR / "candidates.json"
ELECTIONS_FILE = PUBLIC_DATA_DIR / "elections.json"
OUTPUT_FILE = PUBLIC_DATA_DIR / "opportunity.json"

# Tier thresholds (margin in percentage points)
TIER_THRESHOLDS = {
    "HOT": 5,      # ≤5pt margin
    "WARM": 10,    # 6-10pt margin
    "POSSIBLE": 15,  # 11-15pt margin
    # LONG_SHOT: >15pt margin
}


def get_latest_margin(election_history: dict) -> Optional[float]:
    """
    Get the margin from the most recent election.

    Checks 2024, then 2022, then 2020.

    Args:
        election_history: District election history dict.

    Returns:
        Margin percentage or None if no data.
    """
    elections = election_history.get("elections", {})

    for year in ["2024", "2022", "2020"]:
        if year in elections:
            return elections[year].get("margin")

    return None


def calculate_opportunity_tier(
    district: dict,
    election_history: dict,
) -> dict:
    """
    Calculate the opportunity tier for a district.

    Args:
        district: District data from candidates.json
        election_history: Election history from elections.json

    Returns:
        Opportunity data dict with tier, score, and flags.
    """
    district_num = district.get("districtNumber")
    incumbent = district.get("incumbent") or {}
    candidates = district.get("candidates", [])

    # Determine incumbent party
    incumbent_party = incumbent.get("party", "")
    is_dem_incumbent = incumbent_party == "Democratic"

    # Check if Dem has filed
    has_dem_filed = any(
        c.get("party") == "Democratic"
        for c in candidates
    )

    # Check if Rep has filed
    has_rep_filed = any(
        c.get("party") == "Republican"
        for c in candidates
    )

    # Get historical margin
    margin = get_latest_margin(election_history) if election_history else None

    # Default margin if no data (assume safe R)
    if margin is None:
        margin = 25.0

    # Calculate tier
    if is_dem_incumbent:
        tier = "DEFENSIVE"
        tier_label = "Defensive (Dem-held)"
    elif margin <= TIER_THRESHOLDS["HOT"]:
        tier = "HOT"
        tier_label = f"Hot Zone (≤{TIER_THRESHOLDS['HOT']}pt)"
    elif margin <= TIER_THRESHOLDS["WARM"]:
        tier = "WARM"
        tier_label = f"Warm Zone ({TIER_THRESHOLDS['HOT']+1}-{TIER_THRESHOLDS['WARM']}pt)"
    elif margin <= TIER_THRESHOLDS["POSSIBLE"]:
        tier = "POSSIBLE"
        tier_label = f"Possible ({TIER_THRESHOLDS['WARM']+1}-{TIER_THRESHOLDS['POSSIBLE']}pt)"
    else:
        tier = "LONG_SHOT"
        tier_label = f"Long Shot (>{TIER_THRESHOLDS['POSSIBLE']}pt)"

    # Calculate opportunity score (0-100, higher = more opportunity)
    # DEFENSIVE seats get a fixed score
    if tier == "DEFENSIVE":
        score = 50  # Middle of the road - protect but not expand
    else:
        # Invert margin to score: 0pt margin = 100, 50pt margin = 0
        score = max(0, min(100, 100 - (margin * 2)))

    # Flags for filtering
    needs_candidate = not has_dem_filed and not is_dem_incumbent and margin <= 15
    is_open_seat = not incumbent.get("name")

    return {
        "districtNumber": district_num,
        "tier": tier,
        "tierLabel": tier_label,
        "opportunityScore": round(score),
        "margin": round(margin, 1) if margin else None,
        "flags": {
            "needsCandidate": needs_candidate,
            "hasDemocrat": has_dem_filed,
            "hasRepublican": has_rep_filed,
            "isDefensive": is_dem_incumbent,
            "isOpenSeat": is_open_seat,
        },
        "incumbent": {
            "name": incumbent.get("name", ""),
            "party": incumbent_party,
        }
    }


def calculate_all_opportunities(
    candidates_data: dict,
    elections_data: dict,
) -> dict:
    """
    Calculate opportunity tiers for all districts.

    Args:
        candidates_data: Full candidates.json data
        elections_data: Full elections.json data

    Returns:
        Opportunity data dict with house and senate.
    """
    output = {
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "thresholds": TIER_THRESHOLDS,
        "house": {},
        "senate": {},
    }

    for chamber in ["house", "senate"]:
        districts = candidates_data.get(chamber, {})
        elections = elections_data.get(chamber, {}) if elections_data else {}

        for district_num, district in districts.items():
            election_history = elections.get(district_num, {})
            opportunity = calculate_opportunity_tier(district, election_history)
            output[chamber][district_num] = opportunity

    return output


def generate_summary(opportunity_data: dict) -> dict:
    """
    Generate summary statistics for opportunity data.

    Args:
        opportunity_data: Full opportunity data

    Returns:
        Summary dict with counts by tier.
    """
    summary = {
        "house": {"HOT": 0, "WARM": 0, "POSSIBLE": 0, "LONG_SHOT": 0, "DEFENSIVE": 0, "needsCandidate": 0},
        "senate": {"HOT": 0, "WARM": 0, "POSSIBLE": 0, "LONG_SHOT": 0, "DEFENSIVE": 0, "needsCandidate": 0},
        "total": {"HOT": 0, "WARM": 0, "POSSIBLE": 0, "LONG_SHOT": 0, "DEFENSIVE": 0, "needsCandidate": 0},
    }

    for chamber in ["house", "senate"]:
        for district_num, opp in opportunity_data.get(chamber, {}).items():
            tier = opp.get("tier", "LONG_SHOT")
            summary[chamber][tier] += 1
            summary["total"][tier] += 1

            if opp.get("flags", {}).get("needsCandidate"):
                summary[chamber]["needsCandidate"] += 1
                summary["total"]["needsCandidate"] += 1

    return summary


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Calculate opportunity tiers for districts"
    )
    parser.add_argument(
        "--candidates",
        default=str(CANDIDATES_FILE),
        help=f"Path to candidates.json (default: {CANDIDATES_FILE})"
    )
    parser.add_argument(
        "--elections",
        default=str(ELECTIONS_FILE),
        help=f"Path to elections.json (default: {ELECTIONS_FILE})"
    )
    parser.add_argument(
        "--output",
        default=str(OUTPUT_FILE),
        help=f"Output path (default: {OUTPUT_FILE})"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print output but don't write file"
    )

    args = parser.parse_args()

    # Load candidates data
    candidates_path = Path(args.candidates)
    if not candidates_path.exists():
        print(f"Error: Candidates file not found: {candidates_path}")
        sys.exit(1)

    with open(candidates_path) as f:
        candidates_data = json.load(f)
    print(f"Loaded candidates from: {candidates_path}")

    # Load elections data (optional)
    elections_path = Path(args.elections)
    elections_data = None
    if elections_path.exists():
        with open(elections_path) as f:
            elections_data = json.load(f)
        print(f"Loaded elections from: {elections_path}")
    else:
        print(f"Warning: Elections file not found, using default margins")

    # Calculate opportunities
    opportunity_data = calculate_all_opportunities(candidates_data, elections_data)

    # Generate summary
    summary = generate_summary(opportunity_data)
    opportunity_data["summary"] = summary

    # Print summary
    print("\n=== Opportunity Summary ===")
    for chamber in ["house", "senate"]:
        print(f"\n{chamber.upper()}:")
        for tier in ["HOT", "WARM", "POSSIBLE", "LONG_SHOT", "DEFENSIVE"]:
            count = summary[chamber][tier]
            print(f"  {tier}: {count}")
        print(f"  Needs Candidate: {summary[chamber]['needsCandidate']}")

    print(f"\nTOTAL:")
    for tier in ["HOT", "WARM", "POSSIBLE", "LONG_SHOT", "DEFENSIVE"]:
        count = summary["total"][tier]
        print(f"  {tier}: {count}")
    print(f"  Needs Candidate: {summary['total']['needsCandidate']}")

    if args.dry_run:
        print("\n--- DRY RUN: Would write to", args.output, "---")
        print(json.dumps(opportunity_data, indent=2)[:2000] + "...")
        return

    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(opportunity_data, f, indent=2)

    print(f"\nWrote opportunity.json to: {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
