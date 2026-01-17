#!/usr/bin/env python3
"""
Scrape SCAC (SC Association of Counties) for all county elected officials.

Source: https://www.sccounties.org/county/{county-name}-county/directory
Output: scripts/data/scac-raw.json

Extracts:
- Auditor
- Treasurer
- Coroner
- Clerk of Court
- Register of Deeds
- Probate Judge

(Sheriff is scraped separately from sheriffsc.org)

Usage:
    python scripts/scrape-scac-officials.py           # Full scrape
    python scripts/scrape-scac-officials.py --dry-run # Preview mode
"""

import argparse
import json
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# Configuration
BASE_URL = "https://www.sccounties.org"
RATE_LIMIT_SECONDS = 1.0

# Paths
SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "data" / "scac-raw.json"

# SC Counties (46 total)
SC_COUNTIES = [
    "Abbeville", "Aiken", "Allendale", "Anderson", "Bamberg", "Barnwell",
    "Beaufort", "Berkeley", "Calhoun", "Charleston", "Cherokee", "Chester",
    "Chesterfield", "Clarendon", "Colleton", "Darlington", "Dillon",
    "Dorchester", "Edgefield", "Fairfield", "Florence", "Georgetown",
    "Greenville", "Greenwood", "Hampton", "Horry", "Jasper", "Kershaw",
    "Lancaster", "Laurens", "Lee", "Lexington", "Marion", "Marlboro",
    "McCormick", "Newberry", "Oconee", "Orangeburg", "Pickens", "Richland",
    "Saluda", "Spartanburg", "Sumter", "Union", "Williamsburg", "York"
]

# Offices to extract (Sheriff handled separately)
OFFICES = [
    "Auditor",
    "Treasurer",
    "Coroner",
    "Clerk of Court",
    "Register of Deeds",
    "Probate Judge"
]


def get_session() -> requests.Session:
    """Create a requests session with proper headers."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "SC-Election-Map-2026/1.0 (Data Collection for Election Information)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return session


def county_to_url_slug(county_name: str) -> str:
    """Convert county name to URL slug format."""
    # Handle special cases
    return county_name.lower().replace(" ", "-")


def extract_officials(soup: BeautifulSoup, county_name: str) -> dict:
    """Extract elected officials from county directory page.

    SCAC pages use a table with columns: Name | Position | Phone | Address
    """
    officials = {office: None for office in OFFICES}

    # Primary method: Parse tables with Name/Position columns
    for table in soup.find_all("table"):
        rows = table.find_all("tr")

        # Find header row to determine column indices
        header_row = rows[0] if rows else None
        if not header_row:
            continue

        headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]

        # Find name and position column indices
        name_col = None
        position_col = None
        for i, h in enumerate(headers):
            if "name" in h:
                name_col = i
            if "position" in h:
                position_col = i

        if name_col is None or position_col is None:
            # Try inferring from first data row
            if len(headers) >= 2:
                name_col = 0
                position_col = 1

        if name_col is None or position_col is None:
            continue

        # Process data rows
        for row in rows[1:]:  # Skip header
            cells = row.find_all(["td", "th"])
            if len(cells) <= max(name_col, position_col):
                continue

            name_text = cells[name_col].get_text(strip=True)
            position_text = cells[position_col].get_text(strip=True)

            # Skip vacant positions
            if "vacant" in name_text.lower():
                continue

            # Match position to our target offices
            for office in OFFICES:
                if officials[office]:  # Already found
                    continue

                # Match office name (case-insensitive)
                if office.lower() == position_text.lower():
                    officials[office] = name_text
                    break
                # Partial match for variations like "County Auditor"
                elif office.lower() in position_text.lower():
                    # Make sure it's the right office (not "Deputy Auditor")
                    if not any(x in position_text.lower() for x in ["deputy", "assistant", "chief"]):
                        officials[office] = name_text
                        break

    # Fallback: Text-based extraction if table parsing failed
    if not any(officials.values()):
        text = soup.get_text(" ", strip=True)
        for office in OFFICES:
            if officials[office]:
                continue

            patterns = [
                rf"{office}[:\s]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+)",
                rf"([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+)[,\s]+{office}",
            ]

            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    if not re.match(r"^\d", name) and len(name) > 3:
                        officials[office] = name
                        break

    return officials


def scrape_county(session: requests.Session, county_name: str) -> dict:
    """Scrape elected officials for a single county."""
    slug = county_to_url_slug(county_name)
    url = f"{BASE_URL}/county/{slug}-county/directory"

    try:
        response = session.get(url, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        officials = extract_officials(soup, county_name)

        # Count how many officials were found
        found_count = sum(1 for v in officials.values() if v)

        return {
            "county": county_name,
            "officials": officials,
            "source": "sccounties.org",
            "url": url,
            "scraped_date": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": "success" if found_count > 0 else "no_officials_found",
            "officials_found": found_count
        }
    except requests.RequestException as e:
        return {
            "county": county_name,
            "officials": {office: None for office in OFFICES},
            "source": "sccounties.org",
            "url": url,
            "scraped_date": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": f"error: {str(e)}",
            "officials_found": 0
        }


def main():
    parser = argparse.ArgumentParser(description="Scrape SCAC for county elected officials")
    parser.add_argument("--dry-run", action="store_true", help="Preview mode - don't save output")
    args = parser.parse_args()

    print("=" * 60)
    print("SCAC County Officials Scraper")
    print("=" * 60)

    session = get_session()
    results = []

    print(f"\nScraping {len(SC_COUNTIES)} counties...")

    for i, county in enumerate(SC_COUNTIES, 1):
        print(f"  [{i:2d}/{len(SC_COUNTIES)}] {county}...", end=" ", flush=True)

        result = scrape_county(session, county)
        results.append(result)

        found = result["officials_found"]
        if found > 0:
            print(f"{found}/{len(OFFICES)} officials found")
        else:
            print(f"[{result['status']}]")

        if i < len(SC_COUNTIES):
            time.sleep(RATE_LIMIT_SECONDS)

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    total_possible = len(SC_COUNTIES) * len(OFFICES)
    total_found = sum(r["officials_found"] for r in results)
    full_coverage = [r for r in results if r["officials_found"] == len(OFFICES)]
    partial_coverage = [r for r in results if 0 < r["officials_found"] < len(OFFICES)]
    no_coverage = [r for r in results if r["officials_found"] == 0]

    print(f"  Total counties: {len(results)}")
    print(f"  Full coverage (6/6): {len(full_coverage)}")
    print(f"  Partial coverage: {len(partial_coverage)}")
    print(f"  No coverage: {len(no_coverage)}")
    print(f"  Officials found: {total_found}/{total_possible} ({round(total_found/total_possible*100)}%)")

    if no_coverage:
        print("\n  Counties with no officials found:")
        for r in no_coverage:
            print(f"    - {r['county']}: {r['status']}")

    # Office-level summary
    print("\n  By office:")
    for office in OFFICES:
        count = sum(1 for r in results if r["officials"][office])
        print(f"    {office}: {count}/46")

    # Save output
    if not args.dry_run:
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

        output_data = {
            "metadata": {
                "source": "SC Association of Counties",
                "base_url": BASE_URL,
                "scraped_date": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "total_counties": len(results),
                "total_officials_found": total_found,
                "offices": OFFICES
            },
            "counties": {r["county"]: r for r in results}
        }

        with open(OUTPUT_FILE, "w") as f:
            json.dump(output_data, f, indent=2)

        print(f"\n  Output saved to: {OUTPUT_FILE}")
    else:
        print("\n  [DRY RUN - no file saved]")
        print("\n  Sample data (first 5 counties):")
        for r in results[:5]:
            print(f"\n    {r['county']}:")
            for office, name in r["officials"].items():
                if name:
                    print(f"      {office}: {name}")


if __name__ == "__main__":
    main()
