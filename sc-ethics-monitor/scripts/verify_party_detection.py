#!/usr/bin/env python3
"""
Verify party detection results against party-data.json.

This script:
1. Loads party-data.json candidates
2. Loads candidates from Google Sheet
3. Cross-references to verify accuracy
4. Reports any mismatches

Usage:
    python scripts/verify_party_detection.py
    python scripts/verify_party_detection.py --credentials path/to/creds.json
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync


def log(message: str) -> None:
    """Print log message."""
    print(f"[VERIFY] {message}")


def normalize_name(name: str) -> str:
    """Normalize name for comparison."""
    if not name:
        return ""
    # Remove suffixes like Jr., Sr., II, III, IV
    name = re.sub(r'\s+(Jr\.?|Sr\.?|II|III|IV)\s*$', '', name, flags=re.IGNORECASE)
    # Remove periods
    name = name.replace('.', '')
    # Normalize whitespace
    name = ' '.join(name.split())
    return name.lower().strip()


def load_party_data() -> dict:
    """Load party-data.json from the main project."""
    possible = [
        Path("/Users/russellteter/Desktop/sc-election-map-2026/src/data/party-data.json"),
        Path(__file__).parent.parent.parent / "src" / "data" / "party-data.json",
    ]

    for p in possible:
        if p.exists():
            log(f"Loading party data from: {p}")
            with open(p) as f:
                return json.load(f)

    log("ERROR: party-data.json not found")
    return {}


def party_code_from_full(party_full: str) -> str:
    """Convert full party name to code."""
    if not party_full:
        return ""
    party_lower = party_full.lower()
    if "democrat" in party_lower:
        return "D"
    elif "republican" in party_lower:
        return "R"
    elif "independent" in party_lower:
        return "I"
    else:
        return "O"


def main():
    parser = argparse.ArgumentParser(
        description="Verify party detection results against party-data.json"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )

    args = parser.parse_args()

    log("=" * 60)
    log("SC Ethics Monitor - Party Detection Verification")
    log("=" * 60)

    # Load party data
    party_data = load_party_data()
    if not party_data:
        sys.exit(1)

    candidates_data = party_data.get("candidates", {})
    incumbents_data = party_data.get("incumbents", {})

    log(f"  {len(candidates_data)} candidates in party-data.json")

    # Build lookup dict by normalized name
    party_lookup = {}
    for name, info in candidates_data.items():
        normalized = normalize_name(name)
        party_code = party_code_from_full(info.get("party", ""))
        party_lookup[normalized] = {
            "original_name": name,
            "party": party_code,
            "verified": info.get("verified", False),
            "note": info.get("note", ""),
        }

    # Connect to Google Sheets
    creds = args.credentials or "../google-service-account copy.json"
    sync = SheetsSync(creds)
    if not sync.connect():
        log("ERROR: Could not connect to Google Sheets")
        sys.exit(1)

    log("Connected to Google Sheets")

    # Get all candidates from sheet
    sheet_candidates = sync.get_all_candidates()
    log(f"Found {len(sheet_candidates)} candidates in sheet")
    log("-" * 60)

    # Verify each candidate
    matches = 0
    mismatches = 0
    unknown_in_sheet = 0
    not_in_party_data = 0
    results = []

    for candidate in sheet_candidates:
        name = candidate.get("candidate_name", "")
        detected_party = candidate.get("detected_party", "")
        confidence = candidate.get("detection_confidence", "")
        district_id = candidate.get("district_id", "")

        normalized = normalize_name(name)

        # Check if this candidate exists in party-data.json
        if normalized in party_lookup:
            expected = party_lookup[normalized]
            expected_party = expected["party"]

            if detected_party == expected_party:
                matches += 1
                results.append({
                    "name": name,
                    "status": "MATCH",
                    "detected": detected_party,
                    "expected": expected_party,
                    "confidence": confidence,
                })
            else:
                mismatches += 1
                results.append({
                    "name": name,
                    "status": "MISMATCH",
                    "detected": detected_party,
                    "expected": expected_party,
                    "confidence": confidence,
                    "note": expected["note"],
                })
        else:
            # Candidate not in party-data.json - check if detected is empty/unknown
            if not detected_party or confidence == "UNKNOWN":
                unknown_in_sheet += 1
                results.append({
                    "name": name,
                    "status": "NOT_IN_DATA",
                    "detected": detected_party,
                    "expected": None,
                    "confidence": confidence,
                })
            else:
                # Has a detection but not in our data
                not_in_party_data += 1
                results.append({
                    "name": name,
                    "status": "DETECTED_NOT_VERIFIED",
                    "detected": detected_party,
                    "expected": None,
                    "confidence": confidence,
                })

    # Print results
    log("Verification Results:")
    log("-" * 60)

    # Print mismatches first (most important)
    if mismatches > 0:
        log("MISMATCHES (needs attention):")
        for r in results:
            if r["status"] == "MISMATCH":
                log(f"  {r['name']}: detected={r['detected']}, expected={r['expected']} ({r.get('note', '')})")
        log("")

    # Print matches
    log("MATCHES (correct):")
    for r in results:
        if r["status"] == "MATCH":
            log(f"  {r['name']}: {r['detected']} ({r['confidence']})")
    log("")

    # Print not in party data
    if not_in_party_data > 0:
        log("DETECTED BUT NOT IN PARTY-DATA.JSON:")
        for r in results:
            if r["status"] == "DETECTED_NOT_VERIFIED":
                log(f"  {r['name']}: {r['detected']} ({r['confidence']}) - needs verification")
        log("")

    # Summary
    log("-" * 60)
    log("Summary:")
    log(f"  Matches: {matches}")
    log(f"  Mismatches: {mismatches}")
    log(f"  Not in party-data.json: {unknown_in_sheet}")
    log(f"  Detected but unverified: {not_in_party_data}")
    log("")

    # Calculate accuracy
    total_verifiable = matches + mismatches
    if total_verifiable > 0:
        accuracy = (matches / total_verifiable) * 100
        log(f"  Accuracy: {accuracy:.1f}% ({matches}/{total_verifiable})")
    else:
        log("  Accuracy: N/A (no verifiable candidates)")

    log("=" * 60)

    # Return success if no mismatches
    sys.exit(0 if mismatches == 0 else 1)


if __name__ == "__main__":
    main()
