#!/usr/bin/env python3
"""
Run party detection for candidates in Google Sheets.

This script:
1. Fetches all candidates from the Candidates tab
2. Checks against party-data.json (local verified data)
3. Falls back to Firecrawl web search if API key available
4. Updates each candidate's party detection fields
5. Populates Research Queue with low-confidence candidates

Usage:
    python scripts/run_party_detection.py
    python scripts/run_party_detection.py --credentials path/to/creds.json
    python scripts/run_party_detection.py --debug  # Verbose debug output
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from difflib import SequenceMatcher

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.sheets_sync import SheetsSync
from src.config import CANDIDATES_COLUMNS, FIRECRAWL_API_KEY

# Debug mode flag (set via command line)
DEBUG_MODE = False


def log(message: str) -> None:
    """Print log message."""
    print(f"[DETECT] {message}")


def debug(message: str) -> None:
    """Print debug message if debug mode is enabled."""
    if DEBUG_MODE:
        print(f"[DEBUG] {message}")


def normalize_name(name: str) -> str:
    """
    Normalize name for comparison.

    Handles:
    - Suffixes: Jr., Sr., II, III, IV
    - Middle initials: "A", "A.", "Anthony"
    - Format: "Last, First" or "First Last"
    - Case: converts to lowercase
    - Punctuation: removes periods, extra spaces
    """
    if not name:
        return ""

    # Remove suffixes like Jr., Sr., II, III, IV
    name = re.sub(r'\s+(Jr\.?|Sr\.?|II|III|IV)\s*$', '', name, flags=re.IGNORECASE)

    # Remove periods (for initials like "A." -> "A")
    name = name.replace('.', '')

    # Normalize whitespace
    name = ' '.join(name.split())

    # Lowercase and strip
    result = name.lower().strip()

    debug(f"  normalize_name('{name}') -> '{result}'")
    return result


def extract_name_parts(name: str) -> tuple:
    """
    Extract first name, last name, and optional middle initial from a name.

    Handles both "Last, First M" and "First M Last" formats.

    Returns:
        Tuple of (first_name, last_name, middle_initial or None)
    """
    if not name:
        return ("", "", None)

    # Remove suffixes first
    name = re.sub(r'\s+(Jr\.?|Sr\.?|II|III|IV)\s*$', '', name, flags=re.IGNORECASE)
    name = name.strip()

    # Check for "Last, First" format
    if ',' in name:
        parts = [p.strip() for p in name.split(',', 1)]
        last_name = parts[0]
        first_parts = parts[1].split() if len(parts) > 1 else []
        first_name = first_parts[0] if first_parts else ""
        middle = first_parts[1] if len(first_parts) > 1 else None
    else:
        # "First [Middle] Last" format
        parts = name.split()
        if len(parts) >= 3:
            first_name = parts[0]
            # Check if middle part looks like an initial (single letter or single letter + period)
            if len(parts[1].replace('.', '')) == 1:
                middle = parts[1].replace('.', '')
                last_name = ' '.join(parts[2:])
            else:
                middle = None
                last_name = ' '.join(parts[1:])
        elif len(parts) == 2:
            first_name = parts[0]
            last_name = parts[1]
            middle = None
        else:
            first_name = name
            last_name = ""
            middle = None

    # Clean up middle initial
    if middle:
        middle = middle.replace('.', '').upper()
        if len(middle) > 1:
            middle = middle[0]  # Take just the initial if it's a full middle name

    debug(f"  extract_name_parts('{name}') -> ('{first_name}', '{last_name}', {middle})")
    return (first_name.lower(), last_name.lower(), middle)


def names_match(name1: str, name2: str, threshold: float = 0.85) -> tuple:
    """
    Check if two names match using multiple strategies.

    Returns:
        Tuple of (matches: bool, similarity: float, match_type: str)
    """
    # Strategy 1: Exact match after normalization
    n1 = normalize_name(name1)
    n2 = normalize_name(name2)

    if n1 == n2:
        debug(f"  names_match: EXACT match '{n1}' == '{n2}'")
        return (True, 1.0, "exact")

    # Strategy 2: Extract and compare name parts
    parts1 = extract_name_parts(name1)
    parts2 = extract_name_parts(name2)

    first1, last1, mid1 = parts1
    first2, last2, mid2 = parts2

    # Last names must match
    if last1 and last2 and last1 == last2:
        # First names must match
        if first1 and first2 and first1 == first2:
            # Middle initials are optional - match if both present and equal, or if one is missing
            if mid1 is None or mid2 is None or mid1 == mid2:
                debug(f"  names_match: PARTS match ({first1}, {last1}, {mid1}) == ({first2}, {last2}, {mid2})")
                return (True, 0.95, "parts")

    # Strategy 3: Fuzzy match with SequenceMatcher
    similarity = SequenceMatcher(None, n1, n2).ratio()
    debug(f"  names_match: FUZZY '{n1}' vs '{n2}' = {similarity:.3f} (threshold {threshold})")

    if similarity >= threshold:
        return (True, similarity, "fuzzy")

    return (False, similarity, "no_match")


def name_similarity(name1: str, name2: str) -> float:
    """Calculate similarity between two names (legacy function for compatibility)."""
    matches, similarity, _ = names_match(name1, name2)
    return similarity


def load_party_data() -> dict:
    """Load party-data.json from the main project."""
    possible = [
        Path("/Users/russellteter/Desktop/sc-election-map-2026/src/data/party-data.json"),
        Path(__file__).parent.parent.parent / "src" / "data" / "party-data.json",
        Path("../src/data/party-data.json"),
    ]

    for p in possible:
        if p.exists():
            log(f"Loading party data from: {p}")
            with open(p) as f:
                return json.load(f)

    log("WARNING: party-data.json not found - will rely on web search only")
    return {}


def detect_from_party_data(
    candidate_name: str,
    district_id: str,
    party_data: dict,
) -> dict | None:
    """
    Try to detect party from party-data.json.

    Uses a multi-step lookup strategy:
    1. Direct lookup by exact name key
    2. Check alternate name forms in candidates dict
    3. Match against incumbent data for the district
    4. Fuzzy match against all candidates

    Returns dict with party info or None if not found.
    """
    candidates = party_data.get("candidates", {})
    incumbents = party_data.get("incumbents", {})

    debug(f"Looking up party for: '{candidate_name}' in district {district_id}")
    debug(f"  party-data.json has {len(candidates)} candidate entries")

    # Extract chamber and number from district_id
    # e.g., "SC-House-091" -> ("house", "91")
    match = re.match(r'SC-(House|Senate)-(\d+)', district_id, re.IGNORECASE)
    if not match:
        debug(f"  Could not parse district_id: {district_id}")
        return None

    chamber = match.group(1).lower()
    district_num = str(int(match.group(2)))  # Remove leading zeros

    # Strategy 1: Direct lookup by exact name key
    if candidate_name in candidates:
        info = candidates[candidate_name]
        party_full = info.get("party", "")
        party_code = "D" if "democrat" in party_full.lower() else "R" if "republican" in party_full.lower() else "I"
        debug(f"  FOUND: Direct lookup match for '{candidate_name}'")
        return {
            "detected_party": party_code,
            "confidence": "HIGH" if info.get("verified", False) else "MEDIUM",
            "source": f"party-data.json (direct: {info.get('note', 'no note')})",
            "evidence_url": None,
        }

    # Strategy 2: Try normalized exact lookup
    normalized_input = normalize_name(candidate_name)
    for name_key in candidates.keys():
        if normalize_name(name_key) == normalized_input:
            info = candidates[name_key]
            party_full = info.get("party", "")
            party_code = "D" if "democrat" in party_full.lower() else "R" if "republican" in party_full.lower() else "I"
            debug(f"  FOUND: Normalized match '{candidate_name}' -> '{name_key}'")
            return {
                "detected_party": party_code,
                "confidence": "HIGH" if info.get("verified", False) else "MEDIUM",
                "source": f"party-data.json (normalized: {info.get('note', 'no note')})",
                "evidence_url": None,
            }

    # Strategy 3: Check candidates dict with name parts matching
    for name_key, info in candidates.items():
        matches, similarity, match_type = names_match(candidate_name, name_key)
        if matches:
            party_full = info.get("party", "")
            party_code = "D" if "democrat" in party_full.lower() else "R" if "republican" in party_full.lower() else "I"
            debug(f"  FOUND: {match_type} match '{candidate_name}' -> '{name_key}' (sim={similarity:.3f})")
            return {
                "detected_party": party_code,
                "confidence": "HIGH" if info.get("verified", False) else "MEDIUM",
                "source": f"party-data.json ({match_type}: {info.get('note', 'no note')})",
                "evidence_url": None,
            }

    # Strategy 4: Check if candidate matches an incumbent for this specific district
    chamber_incumbents = incumbents.get(chamber, {})
    if district_num in chamber_incumbents:
        incumbent = chamber_incumbents[district_num]
        incumbent_name = incumbent.get("name", "")

        debug(f"  Checking against incumbent for {chamber} {district_num}: {incumbent_name}")

        matches, similarity, match_type = names_match(candidate_name, incumbent_name, threshold=0.80)
        if matches:
            party_full = incumbent.get("party", "")
            party_code = "D" if "democrat" in party_full.lower() else "R" if "republican" in party_full.lower() else "I"
            debug(f"  FOUND: Incumbent match '{candidate_name}' -> '{incumbent_name}'")
            return {
                "detected_party": party_code,
                "confidence": "HIGH",
                "source": f"incumbent_match ({incumbent_name})",
                "evidence_url": None,
                "is_incumbent": True,
            }

    # Log the top fuzzy matches for debugging
    if DEBUG_MODE:
        debug(f"  No match found. Top 5 fuzzy matches from candidates dict:")
        similarities = []
        for name_key in candidates.keys():
            sim = SequenceMatcher(None, normalize_name(candidate_name), normalize_name(name_key)).ratio()
            similarities.append((name_key, sim))
        similarities.sort(key=lambda x: x[1], reverse=True)
        for name_key, sim in similarities[:5]:
            debug(f"    {sim:.3f}: '{name_key}'")

    return None


def detect_from_firecrawl(
    candidate_name: str,
    district_id: str,
) -> dict | None:
    """
    Try to detect party using Firecrawl web search.

    Returns dict with party info or None if not available/failed.
    """
    if not FIRECRAWL_API_KEY:
        return None

    try:
        from src.party_detector import detect_candidate_party

        result = detect_candidate_party(candidate_name, district_id)

        if result.detected_party:
            return {
                "detected_party": result.detected_party,
                "confidence": result.confidence,
                "source": result.source,
                "evidence_url": result.evidence_url,
            }
    except Exception as e:
        log(f"    Firecrawl error: {e}")

    return None


def main():
    parser = argparse.ArgumentParser(
        description="Run party detection for candidates in Google Sheets"
    )
    parser.add_argument(
        "--credentials",
        help="Path to Google service account credentials JSON",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show detections without updating sheets",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-detect even for candidates with existing party",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable verbose debug logging for name matching",
    )

    args = parser.parse_args()

    # Set global debug flag
    global DEBUG_MODE
    DEBUG_MODE = args.debug

    log("=" * 60)
    log("SC Ethics Monitor - Party Detection")
    log("=" * 60)

    # Load party data
    party_data = load_party_data()
    if party_data:
        log(f"  {len(party_data.get('candidates', {}))} verified candidates")
        house_count = len(party_data.get('incumbents', {}).get('house', {}))
        senate_count = len(party_data.get('incumbents', {}).get('senate', {}))
        log(f"  {house_count} House + {senate_count} Senate incumbents")

    # Check Firecrawl availability
    if FIRECRAWL_API_KEY:
        log("  Firecrawl API available for web search fallback")
    else:
        log("  No Firecrawl API key - using party-data.json only")

    log("-" * 60)

    # Connect to Google Sheets
    sync = SheetsSync(args.credentials)
    if not sync.connect():
        log("ERROR: Could not connect to Google Sheets")
        sys.exit(1)

    log("Connected to Google Sheets")

    # Get all candidates using SheetsSync method
    candidates = sync.get_all_candidates()

    if not candidates:
        log("No candidates found to process")
        sys.exit(0)

    log(f"Found {len(candidates)} candidates")
    log("-" * 60)

    # Process each candidate
    detected = 0
    updated = 0
    already_set = 0
    unknown = 0
    errors = 0

    for i, candidate in enumerate(candidates, 1):
        # Get candidate data from dict
        report_id = candidate.get("report_id", "")
        candidate_name = candidate.get("candidate_name", "")
        district_id = candidate.get("district_id", "")
        current_party = candidate.get("detected_party", "")
        party_locked = candidate.get("party_locked", "")

        if not candidate_name:
            continue

        # Skip if party already set and not forcing
        if current_party and not args.force:
            already_set += 1
            continue

        # Skip if party is locked
        if party_locked and party_locked.lower() == "yes":
            already_set += 1
            continue

        log(f"[{i}/{len(candidates)}] {candidate_name} ({district_id})")

        # Try detection methods
        result = None

        # 1. Check party-data.json first
        result = detect_from_party_data(candidate_name, district_id, party_data)
        if result:
            log(f"    -> {result['detected_party']} ({result['confidence']}) via {result['source']}")

        # 2. Fall back to Firecrawl if needed
        if not result and FIRECRAWL_API_KEY:
            result = detect_from_firecrawl(candidate_name, district_id)
            if result:
                log(f"    -> {result['detected_party']} ({result['confidence']}) via web_search")

        # 3. Mark as unknown if no detection
        if not result:
            result = {
                "detected_party": "",
                "confidence": "UNKNOWN",
                "source": "no_match",
                "evidence_url": None,
            }
            log(f"    -> UNKNOWN (no party data found)")
            unknown += 1
        else:
            detected += 1

        # Update the sheet using add_candidate (handles update when report_id exists)
        if not args.dry_run:
            try:
                is_incumbent = result.get("is_incumbent", False)
                if is_incumbent:
                    is_incumbent_str = "Yes"
                else:
                    is_incumbent_str = candidate.get("is_incumbent", "")

                sync.add_candidate(
                    report_id=report_id,
                    candidate_name=candidate_name,
                    district_id=district_id,
                    filed_date=candidate.get("filed_date", ""),
                    ethics_report_url=candidate.get("ethics_report_url", ""),
                    is_incumbent=is_incumbent_str == "Yes",
                    detected_party=result["detected_party"],
                    detection_confidence=result["confidence"],
                    detection_source=result["source"],
                    detection_evidence_url=result.get("evidence_url", ""),
                )

                updated += 1

            except Exception as e:
                log(f"    ERROR updating sheet: {e}")
                errors += 1

    # Log the detection run
    if not args.dry_run:
        sync.log_sync(
            event_type="PARTY_DETECT",
            details=f"Party detection run",
            candidates_added=0,
            candidates_updated=updated,
            party_detections=detected,
            errors=errors,
        )

        # Update race analysis
        log("-" * 60)
        log("Updating Race Analysis...")
        try:
            sync.update_race_analysis()
            log("  Race Analysis updated")
        except Exception as e:
            log(f"  Warning: Race Analysis update failed: {e}")

        # Populate research queue
        log("Populating Research Queue...")
        try:
            count = sync.populate_research_queue()
            log(f"  Added {count} candidates to Research Queue")
        except Exception as e:
            log(f"  Warning: Research Queue update failed: {e}")

    log("-" * 60)
    log("Party detection complete!")
    log(f"  Detected: {detected}")
    log(f"  Updated: {updated}")
    log(f"  Already set: {already_set}")
    log(f"  Unknown: {unknown}")
    log(f"  Errors: {errors}")
    log("")
    log("Sheet URL:")
    log("  https://docs.google.com/spreadsheets/d/17j_KFZFUw-ESBQlKlIccUMpGCFq_XdeL6WYph7zkxQo/edit")
    log("=" * 60)


if __name__ == "__main__":
    main()
