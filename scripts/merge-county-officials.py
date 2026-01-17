#!/usr/bin/env python3
"""
Merge county officials data from multiple sources into county-races.json.

Sources:
- scripts/data/sheriffs-raw.json (from SC Sheriffs' Association)
- scripts/data/scac-raw.json (from SCAC county directories)
- public/data/county-races.json (existing 10-county data with party affiliations)

Output: public/data/county-races.json with all 46 counties

Conflict resolution: Most recent scraped_date wins.
Party data: Preserved from existing county-races.json where available.

Usage:
    python scripts/merge-county-officials.py           # Full merge
    python scripts/merge-county-officials.py --dry-run # Preview mode
"""

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SHERIFFS_FILE = SCRIPT_DIR / "data" / "sheriffs-raw.json"
SCAC_FILE = SCRIPT_DIR / "data" / "scac-raw.json"
COUNTY_RACES_FILE = PROJECT_ROOT / "public" / "data" / "county-races.json"

# SC County FIPS codes (3-digit format)
COUNTY_FIPS = {
    "Abbeville": "001", "Aiken": "003", "Allendale": "005", "Anderson": "007",
    "Bamberg": "009", "Barnwell": "011", "Beaufort": "013", "Berkeley": "015",
    "Calhoun": "017", "Charleston": "019", "Cherokee": "021", "Chester": "023",
    "Chesterfield": "025", "Clarendon": "027", "Colleton": "029", "Darlington": "031",
    "Dillon": "033", "Dorchester": "035", "Edgefield": "037", "Fairfield": "039",
    "Florence": "041", "Georgetown": "043", "Greenville": "045", "Greenwood": "047",
    "Hampton": "049", "Horry": "051", "Jasper": "053", "Kershaw": "055",
    "Lancaster": "057", "Laurens": "059", "Lee": "061", "Lexington": "063",
    "Marion": "069", "Marlboro": "067", "McCormick": "065", "Newberry": "071",
    "Oconee": "073", "Orangeburg": "075", "Pickens": "077", "Richland": "079",
    "Saluda": "081", "Spartanburg": "083", "Sumter": "085", "Union": "087",
    "Williamsburg": "089", "York": "091"
}

# Standard offices in county-races.json order
OFFICES = [
    "Sheriff",
    "Auditor",
    "Treasurer",
    "Coroner",
    "Clerk of Court",
    "Register of Deeds",
    "Probate Judge"
]


def load_json(path: Path) -> dict:
    """Load JSON file if exists, return empty dict otherwise."""
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {}


def build_party_lookup(existing_data: dict) -> dict:
    """Build lookup of known party affiliations from existing data."""
    party_lookup = {}

    for county_name, county_data in existing_data.get("counties", {}).items():
        for race in county_data.get("races", []):
            incumbent = race.get("incumbent")
            if incumbent and incumbent.get("party"):
                key = (county_name, race.get("office"), incumbent.get("name"))
                party_lookup[key] = incumbent.get("party")

    return party_lookup


def merge_county_data(
    sheriffs_data: dict,
    scac_data: dict,
    existing_data: dict
) -> dict:
    """Merge all data sources into complete county-races structure."""

    # Build party lookup from existing data
    party_lookup = build_party_lookup(existing_data)

    # Track conflicts and stats
    conflicts = []
    stats = {
        "total_counties": 0,
        "total_officials": 0,
        "with_party": 0,
        "without_party": 0,
        "conflicts_resolved": 0
    }

    counties = {}

    for county_name, fips_code in sorted(COUNTY_FIPS.items()):
        stats["total_counties"] += 1

        # Get existing county data if available
        existing_county = existing_data.get("counties", {}).get(county_name, {})

        # Build races array
        races = []

        for office in OFFICES:
            # Get incumbent name from appropriate source
            incumbent_name = None
            incumbent_source = None

            if office == "Sheriff":
                # Use sheriffs data
                sheriff_entry = sheriffs_data.get("sheriffs", {}).get(county_name, {})
                if sheriff_entry.get("sheriff"):
                    incumbent_name = sheriff_entry["sheriff"]
                    incumbent_source = "sheriffsc.org"
            else:
                # Use SCAC data
                scac_entry = scac_data.get("counties", {}).get(county_name, {})
                officials = scac_entry.get("officials", {})
                if officials.get(office):
                    incumbent_name = officials[office]
                    incumbent_source = "sccounties.org"

            # Check for conflict with existing data
            existing_race = None
            for r in existing_county.get("races", []):
                if r.get("office") == office:
                    existing_race = r
                    break

            if existing_race and existing_race.get("incumbent"):
                existing_name = existing_race["incumbent"].get("name")
                if existing_name and incumbent_name and existing_name != incumbent_name:
                    conflicts.append({
                        "county": county_name,
                        "office": office,
                        "existing": existing_name,
                        "new": incumbent_name,
                        "resolution": "new (more recent scrape)"
                    })
                    stats["conflicts_resolved"] += 1

            # Determine party affiliation
            party = None

            # First check exact match in party lookup
            if incumbent_name:
                key = (county_name, office, incumbent_name)
                if key in party_lookup:
                    party = party_lookup[key]
                else:
                    # Check if existing data has party for this office
                    if existing_race and existing_race.get("incumbent"):
                        existing_party = existing_race["incumbent"].get("party")
                        existing_name = existing_race["incumbent"].get("name")
                        # Only use existing party if names match closely
                        if existing_party and existing_name:
                            # Check if last names match (names may have different formats)
                            existing_last = existing_name.split()[-1].lower()
                            new_last = incumbent_name.split()[-1].lower()
                            if existing_last == new_last:
                                party = existing_party

            # Build race entry
            race = {
                "office": office,
                "incumbent": None,
                "candidates": [],
                "termYears": 4
            }

            if incumbent_name:
                race["incumbent"] = {
                    "name": incumbent_name,
                    "party": party
                }
                stats["total_officials"] += 1
                if party:
                    stats["with_party"] += 1
                else:
                    stats["without_party"] += 1

            races.append(race)

        counties[county_name] = {
            "countyName": county_name,
            "fipsCode": fips_code,
            "races": races
        }

    return {
        "counties": counties,
        "conflicts": conflicts,
        "stats": stats
    }


def main():
    parser = argparse.ArgumentParser(description="Merge county officials data")
    parser.add_argument("--dry-run", action="store_true", help="Preview mode - don't save output")
    args = parser.parse_args()

    print("=" * 60)
    print("County Officials Data Merge")
    print("=" * 60)

    # Load source data
    print("\nLoading source data...")
    sheriffs_data = load_json(SHERIFFS_FILE)
    scac_data = load_json(SCAC_FILE)
    existing_data = load_json(COUNTY_RACES_FILE)

    print(f"  Sheriffs data: {len(sheriffs_data.get('sheriffs', {}))} counties")
    print(f"  SCAC data: {len(scac_data.get('counties', {}))} counties")
    print(f"  Existing data: {len(existing_data.get('counties', {}))} counties")

    # Merge data
    print("\nMerging data...")
    result = merge_county_data(sheriffs_data, scac_data, existing_data)

    counties = result["counties"]
    conflicts = result["conflicts"]
    stats = result["stats"]

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    print(f"\n  Counties: {stats['total_counties']}")
    print(f"  Officials found: {stats['total_officials']}")
    print(f"  With party data: {stats['with_party']}")
    print(f"  Without party data: {stats['without_party']}")
    print(f"  Conflicts resolved: {stats['conflicts_resolved']}")

    # Office coverage
    print("\n  By office:")
    for office in OFFICES:
        count = sum(1 for c in counties.values()
                   if any(r["office"] == office and r["incumbent"] for r in c["races"]))
        print(f"    {office}: {count}/46")

    # Conflicts
    if conflicts:
        print("\n  Conflicts found (resolved with newer data):")
        for c in conflicts[:10]:  # Show first 10
            print(f"    {c['county']} {c['office']}: '{c['existing']}' -> '{c['new']}'")
        if len(conflicts) > 10:
            print(f"    ... and {len(conflicts) - 10} more")

    # Save output
    if not args.dry_run:
        output_data = {
            "lastUpdated": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "counties": counties
        }

        with open(COUNTY_RACES_FILE, "w") as f:
            json.dump(output_data, f, indent=2)

        print(f"\n  Output saved to: {COUNTY_RACES_FILE}")

        # Verification
        print("\n  Verification:")
        print(f"    Counties: {len(counties)}")
        total_races = sum(len(c["races"]) for c in counties.values())
        print(f"    Total races: {total_races}")

        # Quick spot check
        print("\n  Spot check (first 3 counties):")
        for county_name in list(counties.keys())[:3]:
            county = counties[county_name]
            sheriff = next((r for r in county["races"] if r["office"] == "Sheriff"), None)
            if sheriff and sheriff["incumbent"]:
                inc = sheriff["incumbent"]
                print(f"    {county_name}: Sheriff {inc['name']} ({inc['party'] or 'no party'})")
    else:
        print("\n  [DRY RUN - no file saved]")
        print("\n  Sample output (first 2 counties):")
        for county_name in list(counties.keys())[:2]:
            county = counties[county_name]
            print(f"\n    {county_name} (FIPS: {county['fipsCode']}):")
            for race in county["races"]:
                if race["incumbent"]:
                    inc = race["incumbent"]
                    print(f"      {race['office']}: {inc['name']} ({inc['party'] or 'unknown'})")
                else:
                    print(f"      {race['office']}: (no incumbent)")


if __name__ == "__main__":
    main()
