#!/usr/bin/env python3
"""
SC Ethics Commission Scraper for Election Map

Scrapes Initial Reports from the SC Ethics Commission website for SC House
and Senate candidates. Initial Reports indicate candidates who have raised
or spent $500+, indicating serious intent to run.

Output: JSON compatible with process-data.py for candidate data pipeline.

Usage:
    python scrape-ethics.py --output scripts/data/ethics-state.json
    python scrape-ethics.py --max-pages 5 --output scripts/data/ethics-state.json
    python scrape-ethics.py --year 2026 --max-pages 10 --output ethics.json
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from playwright.sync_api import sync_playwright, Page

# Configuration
CAMPAIGN_REPORTS_URL = "https://ethicsfiling.sc.gov/public/campaign-reports/reports"

# Office type patterns for filtering to SC House and Senate only
HOUSE_SENATE_PATTERNS = [
    "house of representatives",
    "sc house",
    "state house",
    "senate",
    "sc senate",
    "state senate",
]


def is_house_or_senate(office_text: str) -> bool:
    """Check if the office is SC House or Senate (not County, Municipal, etc.)."""
    if not office_text:
        return False
    office_lower = office_text.lower()
    return any(pattern in office_lower for pattern in HOUSE_SENATE_PATTERNS)


def parse_date(date_str: str) -> str:
    """Convert 'Jan 8, 2026' to '2026-01-08' for consistent sorting."""
    if not date_str:
        return ""
    try:
        dt = datetime.strptime(date_str.strip(), "%b %d, %Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return date_str


def log(message: str) -> None:
    """Print timestamped log message."""
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{timestamp}] {message}")


def extract_report_id(url: str) -> Optional[str]:
    """Extract reportId from a report detail URL."""
    match = re.search(r'reportId=(\d+)', url)
    return match.group(1) if match else None


def scrape_reports(page: Page, max_pages: int = 5, election_year: Optional[str] = None) -> list[dict]:
    """
    Scrape Initial Reports from the SC Ethics Commission website.

    Args:
        page: Playwright page object
        max_pages: Maximum number of pages to scrape
        election_year: Specific year to filter (default: current year)

    Returns:
        List of report dictionaries with filing details
    """
    reports = []

    log(f"Navigating to {CAMPAIGN_REPORTS_URL}")
    page.goto(CAMPAIGN_REPORTS_URL)
    page.wait_for_load_state("networkidle")

    # Select election year filter
    target_year = election_year or str(datetime.now().year)
    log(f"Setting election year filter to {target_year}")

    try:
        # Click the election year dropdown
        year_dropdown = page.get_by_title("Election Year dropdown").get_by_role("listbox")
        year_dropdown.click()
        page.wait_for_timeout(500)

        # Select target year
        page.get_by_role("option", name=target_year).click()
        page.wait_for_timeout(500)
    except Exception as e:
        log(f"Warning: Could not set year filter: {e}")

    # Select "Initial" report type to find new candidates
    log("Setting report type filter to 'Initial'")
    try:
        report_type_dropdown = page.get_by_title("Report Name dropdown").get_by_role("listbox")
        report_type_dropdown.click()
        page.wait_for_timeout(500)
        page.get_by_role("option", name="Initial").click()
        page.wait_for_timeout(500)
    except Exception as e:
        log(f"Warning: Could not set report type filter: {e}")

    # Click search
    log("Executing search...")
    page.get_by_role("button", name="Search").click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    # Check if we got results
    try:
        status_text = page.locator("status").first.text_content()
        if "No entries" in status_text:
            log("No reports found for current year filter")
            return reports
        log(f"Search status: {status_text}")
    except Exception:
        pass

    # Sort by Last Updated (descending) to get most recent first
    log("Sorting by Last Updated (descending)...")
    try:
        # Click twice to get descending order
        last_updated_header = page.get_by_text("Last Updated").first
        last_updated_header.click()
        page.wait_for_timeout(500)
        last_updated_header.click()
        page.wait_for_timeout(1000)
    except Exception as e:
        log(f"Warning: Could not sort by Last Updated: {e}")

    # Scrape multiple pages
    for page_num in range(max_pages):
        log(f"Scraping page {page_num + 1}...")

        # Extract report data from current page
        rows = page.locator("table").last.locator("tr")
        row_count = rows.count()

        for i in range(row_count):
            try:
                row = rows.nth(i)
                cells = row.locator("td, gridcell")

                if cells.count() < 6:
                    continue

                # Extract report link and details
                report_link = row.locator("a").first
                report_url = report_link.get_attribute("href") or ""
                report_name = report_link.text_content() or ""

                # Get candidate name (second link in row)
                candidate_link = row.locator("a").nth(1)
                candidate_name = candidate_link.text_content() or ""

                # Get other fields
                office = cells.nth(2).text_content() or ""
                election_year_cell = cells.nth(3).text_content() or ""
                election_type = cells.nth(4).text_content() or ""
                last_updated = cells.nth(5).text_content() or ""

                # Extract report ID for unique identification
                report_id = extract_report_id(report_url)

                if report_id:
                    reports.append({
                        "report_id": report_id,
                        "report_name": report_name.strip(),
                        "candidate_name": candidate_name.strip(),
                        "office": office.strip(),
                        "election_year": election_year_cell.strip(),
                        "election_type": election_type.strip(),
                        "last_updated": last_updated.strip(),
                        "url": f"https://ethicsfiling.sc.gov{report_url}" if report_url.startswith("/") else report_url
                    })
            except Exception as e:
                log(f"Warning: Error extracting row {i}: {e}")
                continue

        # Try to go to next page if not on last page
        if page_num < max_pages - 1:
            try:
                next_button = page.get_by_title("Go to the next page")
                if next_button.is_enabled():
                    next_button.click()
                    page.wait_for_timeout(1000)
                else:
                    log("No more pages available")
                    break
            except Exception:
                log("No more pages available")
                break

    log(f"Scraped {len(reports)} reports total")
    return reports


def scrape_calendar_year(page: Page, year: str, max_pages: int = 15) -> dict:
    """
    Scrape ALL Initial Reports FILED in a specific calendar year.

    IMPORTANT: This filters by FILING DATE (when the report was submitted),
    NOT by election year (which election cycle the report is for).

    Returns dict of report metadata keyed by report_id.
    """
    log(f"Scraping Initial Reports filed in calendar year {year}...")

    # Scrape multiple election years to catch all possible filings
    # Reports filed in year X might be for election years X-1, X, or X+1
    year_int = int(year)
    election_years = [str(year_int - 1), year, str(year_int + 1)]

    all_reports = []
    for election_year in election_years:
        log(f"  Scraping election year {election_year}...")
        try:
            reports = scrape_reports(page, max_pages=max_pages, election_year=election_year)
            all_reports.extend(reports)
            log(f"    Found {len(reports)} reports for {election_year} cycle")
        except Exception as e:
            log(f"    Warning: Could not scrape {election_year}: {e}")

    # Deduplicate by report_id
    seen_ids = set()
    unique_reports = []
    for r in all_reports:
        if r["report_id"] not in seen_ids:
            seen_ids.add(r["report_id"])
            unique_reports.append(r)

    log(f"  Total unique reports across all years: {len(unique_reports)}")

    # Filter to: House/Senate AND filed in target calendar year
    historical = {}
    excluded_wrong_date = 0
    excluded_wrong_office = 0

    for r in unique_reports:
        # Must be House/Senate
        if not is_house_or_senate(r.get("office", "")):
            excluded_wrong_office += 1
            continue

        # Parse the filing date
        filed_date = parse_date(r["last_updated"])

        # Filter by FILING DATE, not election year
        if not filed_date.startswith(f"{year}-"):
            excluded_wrong_date += 1
            continue

        historical[r["report_id"]] = {
            "candidate_name": r["candidate_name"],
            "office": r["office"],
            "election_year": r["election_year"],
            "report_name": r["report_name"],
            "filed_date": filed_date,
            "url": r["url"]
        }

    log(f"  Filtered: {excluded_wrong_office} non-House/Senate, {excluded_wrong_date} not filed in {year}")
    log(f"  Result: {len(historical)} House/Senate Initial Reports filed in {year}")
    return historical


def main():
    parser = argparse.ArgumentParser(
        description="Scrape SC Ethics Commission for candidate Initial Reports",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scrape-ethics.py --output scripts/data/ethics-state.json
    python scrape-ethics.py --max-pages 10 --output ethics.json
    python scrape-ethics.py --year 2026 --full --output ethics-2026.json
        """
    )
    parser.add_argument(
        "--output", "-o",
        required=True,
        help="Output JSON file path"
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=5,
        help="Maximum pages to scrape per election year (default: 5)"
    )
    parser.add_argument(
        "--year",
        default=str(datetime.now().year),
        help="Target calendar year for filing date filter (default: current year)"
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Scrape full calendar year (more thorough, slower)"
    )

    args = parser.parse_args()

    log("=" * 60)
    log("SC Ethics Commission Scraper")
    log(f"Output: {args.output}")
    log(f"Max pages: {args.max_pages}")
    log(f"Target year: {args.year}")
    log("=" * 60)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            if args.full:
                # Full calendar year scrape
                historical = scrape_calendar_year(page, args.year, max_pages=args.max_pages)
                output = {
                    "last_scraped": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    "target_year": args.year,
                    "reports_with_metadata": historical,
                    "historical_2025": {"reports": {}}  # Compat with process-data.py
                }
            else:
                # Quick scrape of current reports
                reports = scrape_reports(page, max_pages=args.max_pages, election_year=args.year)

                # Filter to House/Senate and build metadata dict
                reports_with_metadata = {}
                for r in reports:
                    if is_house_or_senate(r.get("office", "")):
                        reports_with_metadata[r["report_id"]] = {
                            "candidate_name": r["candidate_name"],
                            "office": r["office"],
                            "election_year": r["election_year"],
                            "report_name": r["report_name"],
                            "filed_date": parse_date(r["last_updated"]),
                            "url": r["url"]
                        }

                output = {
                    "last_scraped": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    "target_year": args.year,
                    "reports_with_metadata": reports_with_metadata,
                    "historical_2025": {"reports": {}}  # Compat with process-data.py
                }

            browser.close()

    except Exception as e:
        log(f"Error during scraping: {e}")
        sys.exit(1)

    # Write output
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    log(f"Output written to: {args.output}")
    log(f"Reports found: {len(output['reports_with_metadata'])}")
    log("=" * 60)
    log("Scrape complete")
    log("=" * 60)


if __name__ == "__main__":
    main()
