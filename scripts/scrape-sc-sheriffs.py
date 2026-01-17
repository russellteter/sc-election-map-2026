#!/usr/bin/env python3
"""
Scrape SC Sheriffs' Association for all 46 county sheriff names.

Source: https://sheriffsc.org/county_map/
Output: scripts/data/sheriffs-raw.json

Usage:
    python scripts/scrape-sc-sheriffs.py           # Full scrape
    python scripts/scrape-sc-sheriffs.py --dry-run # Preview mode
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
BASE_URL = "https://sheriffsc.org"
COUNTY_MAP_URL = f"{BASE_URL}/county_map/"
RATE_LIMIT_SECONDS = 1.0  # Be respectful

# Paths
SCRIPT_DIR = Path(__file__).parent
OUTPUT_FILE = SCRIPT_DIR / "data" / "sheriffs-raw.json"

# SC Counties for validation (46 total)
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


def get_session() -> requests.Session:
    """Create a requests session with proper headers."""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "SC-Election-Map-2026/1.0 (Data Collection for Election Information)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    return session


def discover_county_links(session: requests.Session) -> list[dict]:
    """Discover all county page links from the main county map page."""
    print(f"Fetching county list from {COUNTY_MAP_URL}...")

    response = session.get(COUNTY_MAP_URL, timeout=30)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    counties = []
    # Find all links that point to /county_map/county/{id}
    for link in soup.find_all("a", href=True):
        href = link.get("href", "")
        if "/county_map/county/" in href:
            # Extract county name from link text
            county_name = link.get_text(strip=True)
            if county_name and county_name in SC_COUNTIES:
                # Build full URL
                if href.startswith("/"):
                    full_url = BASE_URL + href
                else:
                    full_url = href

                counties.append({
                    "name": county_name,
                    "url": full_url
                })

    # Deduplicate (some counties may appear multiple times)
    seen = set()
    unique_counties = []
    for county in counties:
        if county["name"] not in seen:
            seen.add(county["name"])
            unique_counties.append(county)

    print(f"  Found {len(unique_counties)} county links")
    return sorted(unique_counties, key=lambda x: x["name"])


def extract_sheriff_name(soup: BeautifulSoup, county_name: str) -> str | None:
    """Extract sheriff name from county page HTML."""
    # Get full page text for pattern matching
    text = soup.get_text(" ", strip=True)

    # Skip "South Carolina" which appears in page title - not a name
    if "South Carolina" in text:
        text = text.replace("South Carolina Sheriffs' Association", "")

    # Pattern 1: "Sheriff FirstName [M.] LastName [Jr./Sr./III/IV]"
    # Allow for various name patterns:
    # - Compound last names: McBride, McDonald
    # - Initials: P.J. Tanner, S. Duane Lewis
    # - Multiple initials: G.L. Buddy Hill
    # - Suffixes: Jr., Sr., III, IV
    patterns = [
        # Name with nickname in quotes: "Sheriff James 'Jamie' Hamilton" or "Sheriff Bryan "Jay" Koon"
        r"Sheriff\s+([A-Z][a-z]+\s+['\"][A-Za-z]+['\"]\s+(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+(?:,?\s+(?:Jr\.|Sr\.|III|IV))?)",
        # Initials pattern: "Sheriff P.J. Tanner" or "Sheriff G.L. Buddy Hill, Jr."
        r"Sheriff\s+([A-Z]\.[A-Z]\.?\s+(?:[A-Z][a-z]+\s+)?(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+(?:,?\s+(?:Jr\.|Sr\.|III|IV))?)",
        # Single initial: "Sheriff S. Duane Lewis"
        r"Sheriff\s+([A-Z]\.\s+[A-Z][a-z]+\s+(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+(?:,?\s+(?:Jr\.|Sr\.|III|IV))?)",
        # Compound last name: "Sheriff Chad McBride"
        r"Sheriff\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+(?:Mc|Mac|De|Van|O')[A-Z][a-z]+(?:,?\s+(?:Jr\.|Sr\.|III|IV))?)",
        # Standard: "Sheriff John Smith"
        r"Sheriff\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:,?\s+(?:Jr\.|Sr\.|III|IV))?)",
        # Three-word name: "Sheriff John Robert Smith"
        r"Sheriff\s+([A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+)",
    ]

    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            # Validate it's not "South Carolina"
            if "Carolina" not in match and "County" not in match:
                return match.strip()

    # Pattern 2: Look for title tag or h1 containing sheriff name
    title = soup.find("title")
    if title:
        title_text = title.get_text(strip=True)
        # Pattern: "County Name | Sheriff FirstName LastName"
        match = re.search(r"\|\s*Sheriff\s+(.+?)(?:\s*\||$)", title_text)
        if match:
            name = match.group(1).strip()
            if "Carolina" not in name:
                return name

    # Pattern 3: Look for h1/h2 containing "Sheriff"
    for header in soup.find_all(["h1", "h2"]):
        header_text = header.get_text(strip=True)
        match = re.search(r"Sheriff\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+(?:\s+(?:Jr\.|Sr\.|III|IV))?)", header_text)
        if match:
            name = match.group(1).strip()
            if "Carolina" not in name:
                return name

    # Pattern 4: Look for the sheriff's name in content area
    content = soup.find("div", class_="entry-content") or soup.find("article") or soup.find("main")
    if content:
        content_text = content.get_text(" ", strip=True)
        # Look for pattern after county name
        match = re.search(rf"{county_name}\s+County.*?Sheriff\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+)", content_text, re.DOTALL)
        if match:
            name = match.group(1).strip()
            if "Carolina" not in name:
                return name

    # Pattern 5: Look for specific structure - name after "Sheriff" in a list/paragraph
    for p in soup.find_all(["p", "div", "span"]):
        p_text = p.get_text(strip=True)
        if p_text.startswith("Sheriff "):
            match = re.match(r"Sheriff\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+(?:Mc|Mac|De|Van|O')?[A-Z][a-z]+(?:\s+(?:Jr\.|Sr\.|III|IV))?)", p_text)
            if match:
                name = match.group(1).strip()
                if "Carolina" not in name and len(name) > 5:
                    return name

    return None


def scrape_county_sheriff(session: requests.Session, county: dict) -> dict:
    """Scrape sheriff information from a county page."""
    try:
        response = session.get(county["url"], timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        sheriff_name = extract_sheriff_name(soup, county["name"])

        return {
            "county": county["name"],
            "sheriff": sheriff_name,
            "source": "sheriffsc.org",
            "url": county["url"],
            "scraped_date": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": "success" if sheriff_name else "name_not_found"
        }
    except requests.RequestException as e:
        return {
            "county": county["name"],
            "sheriff": None,
            "source": "sheriffsc.org",
            "url": county["url"],
            "scraped_date": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "status": f"error: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description="Scrape SC Sheriffs' Association for county sheriff names")
    parser.add_argument("--dry-run", action="store_true", help="Preview mode - don't save output")
    args = parser.parse_args()

    print("=" * 60)
    print("SC Sheriffs' Association Scraper")
    print("=" * 60)

    session = get_session()

    # Step 1: Discover county links
    counties = discover_county_links(session)

    if len(counties) < 46:
        print(f"  WARNING: Expected 46 counties, found {len(counties)}")
        # Fill in missing counties
        found_names = {c["name"] for c in counties}
        for county_name in SC_COUNTIES:
            if county_name not in found_names:
                print(f"    Missing: {county_name}")

    # Step 2: Scrape each county
    print(f"\nScraping {len(counties)} counties...")
    results = []

    for i, county in enumerate(counties, 1):
        print(f"  [{i:2d}/{len(counties)}] {county['name']}...", end=" ", flush=True)

        result = scrape_county_sheriff(session, county)
        results.append(result)

        if result["sheriff"]:
            print(f"Sheriff {result['sheriff']}")
        else:
            print(f"[{result['status']}]")

        # Rate limiting
        if i < len(counties):
            time.sleep(RATE_LIMIT_SECONDS)

    # Step 3: Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    successful = [r for r in results if r["sheriff"]]
    failed = [r for r in results if not r["sheriff"]]

    print(f"  Total counties: {len(results)}")
    print(f"  Sheriffs found: {len(successful)}")
    print(f"  Failed/Missing: {len(failed)}")

    if failed:
        print("\n  Counties without sheriff names:")
        for r in failed:
            print(f"    - {r['county']}: {r['status']}")

    # Step 4: Save output
    if not args.dry_run:
        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

        output_data = {
            "metadata": {
                "source": "SC Sheriffs' Association",
                "url": COUNTY_MAP_URL,
                "scraped_date": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "total_counties": len(results),
                "successful": len(successful)
            },
            "sheriffs": {r["county"]: r for r in results}
        }

        with open(OUTPUT_FILE, "w") as f:
            json.dump(output_data, f, indent=2)

        print(f"\n  Output saved to: {OUTPUT_FILE}")
    else:
        print("\n  [DRY RUN - no file saved]")
        print("\n  Sheriffs found:")
        for r in successful:
            print(f"    {r['county']}: {r['sheriff']}")


if __name__ == "__main__":
    main()
