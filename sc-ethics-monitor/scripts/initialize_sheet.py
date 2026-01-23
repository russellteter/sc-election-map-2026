#!/usr/bin/env python3
"""
Initialize Google Sheet with proper structure and formatting.

This script:
1. Creates all required tabs (Districts, Candidates, Race Analysis, etc.)
2. Adds headers to each tab
3. Initializes all 170 SC legislative districts
4. Applies professional formatting (colors, dropdowns, frozen headers)
5. Adds final_party formulas

Usage:
    python scripts/initialize_sheet.py
    python scripts/initialize_sheet.py --credentials path/to/creds.json
    python scripts/initialize_sheet.py --incumbents path/to/incumbents.json
"""

import argparse
import json
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync
from src.sheet_formatting import SheetFormatter, format_spreadsheet
from src.config import (
    TAB_CANDIDATES,
    TAB_DISTRICTS,
    TAB_RACE_ANALYSIS,
    TAB_RESEARCH_QUEUE,
    TAB_SYNC_LOG,
    CANDIDATES_HEADERS,
    DISTRICTS_HEADERS,
    RACE_ANALYSIS_HEADERS,
    RESEARCH_QUEUE_HEADERS,
    SYNC_LOG_HEADERS,
)


def log(message: str) -> None:
    """Print log message."""
    print(f"[INIT] {message}")


def load_incumbents(path: str = None) -> dict:
    """Load incumbents data."""
    if path:
        p = Path(path)
    else:
        # Try common locations
        possible = [
            Path("../src/data/party-data.json"),
            Path("../public/data/candidates.json"),
            Path("data/incumbents.json"),
        ]
        p = None
        for pp in possible:
            if pp.exists():
                p = pp
                break

    if not p or not p.exists():
        log("No incumbents file found - districts will have empty incumbent columns")
        return {}

    try:
        with open(p) as f:
            data = json.load(f)
            # Handle party-data.json format
            if "incumbents" in data:
                return data["incumbents"]
            return data
    except Exception as e:
        log(f"Error loading incumbents: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(
        description="Initialize SC Ethics Monitor Google Sheet"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    parser.add_argument(
        "--incumbents",
        help="Path to incumbents JSON file",
    )
    parser.add_argument(
        "--skip-formatting",
        action="store_true",
        help="Skip applying conditional formatting",
    )

    args = parser.parse_args()

    log("=" * 60)
    log("SC Ethics Monitor - Sheet Initialization")
    log("=" * 60)

    # Connect to sheets
    sync = SheetsSync(args.credentials)
    if not sync.connect():
        log("ERROR: Could not connect to Google Sheets")
        log("Make sure you have valid credentials.json")
        sys.exit(1)

    log("Connected to Google Sheets")

    # Load incumbents
    incumbents = load_incumbents(args.incumbents)
    if incumbents:
        house_count = len(incumbents.get("house", {}))
        senate_count = len(incumbents.get("senate", {}))
        log(f"Loaded {house_count} House + {senate_count} Senate incumbents")

    # Initialize tabs
    log("-" * 60)
    log("Creating/updating tabs...")

    # 1. Districts tab
    log("  1. Districts tab...")
    districts_count = sync.initialize_districts(incumbents)
    log(f"     Initialized {districts_count} districts")

    # 2. Candidates tab (just headers if empty)
    log("  2. Candidates tab...")
    sync._get_or_create_worksheet(TAB_CANDIDATES, CANDIDATES_HEADERS)
    log("     Headers created")

    # 3. Race Analysis tab
    log("  3. Race Analysis tab...")
    sync._get_or_create_worksheet(TAB_RACE_ANALYSIS, RACE_ANALYSIS_HEADERS)
    log("     Headers created")

    # 4. Research Queue tab
    log("  4. Research Queue tab...")
    sync._get_or_create_worksheet(TAB_RESEARCH_QUEUE, RESEARCH_QUEUE_HEADERS)
    log("     Headers created")

    # 5. Sync Log tab
    log("  5. Sync Log tab...")
    sync._get_or_create_worksheet(TAB_SYNC_LOG, SYNC_LOG_HEADERS)
    log("     Headers created")

    # Apply formatting
    if not args.skip_formatting:
        log("-" * 60)
        log("Applying formatting...")
        try:
            formatter = SheetFormatter(sync.spreadsheet)
            results = formatter.format_all_tabs()
            log(f"  Formatted {results['tabs_formatted']} tabs")
            if results.get("errors"):
                for err in results["errors"]:
                    log(f"  Warning: {err}")
        except Exception as e:
            log(f"  Warning: Formatting failed: {e}")
            log("  You may need to apply formatting manually")

    # Log initialization
    sync.log_sync(
        event_type="INIT",
        details="Sheet initialized with all tabs and formatting",
        candidates_added=0,
        candidates_updated=0,
        party_detections=0,
        errors=0,
    )

    log("-" * 60)
    log("Initialization complete!")
    log("")
    log("Next steps:")
    log("  1. Open the Google Sheet and verify tabs exist")
    log("  2. Review Districts tab for incumbent data")
    log("  3. Run a sync to populate Candidates")
    log("")
    log("Sheet URL:")
    log("  https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit")
    log("=" * 60)


if __name__ == "__main__":
    main()
